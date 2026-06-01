import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

const SUBMIT_MESSAGE = 'DigiGram: আপনার office serial/appointment request গ্রহণ করা হয়েছে। সময় নির্ধারণ হলে SMS/Inbox-এ update পাবেন।';
const VALID_PRIORITY = new Set(['low', 'normal', 'urgent', 'emergency']);
const VALID_SLOT = new Set(['morning', 'noon', 'afternoon', 'evening', 'anytime']);

function normalizePhone(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

async function resolveUnionId(scopeType, scopeId) {
    if (!scopeId) return null;
    if (scopeType === 'union') return scopeId;

    const { data: scope } = await supabaseAdmin
        .from('locations')
        .select('id,type,parent_id,parent:parent_id(id,type,parent_id)')
        .eq('id', scopeId)
        .maybeSingle();

    if (!scope) return null;
    if (scope.type === 'union') return scope.id;
    if (scope.type === 'ward') return scope.parent_id;
    if (scope.type === 'village') return scope.parent?.parent_id || null;
    return null;
}

async function nextSerialNo(scopeId, preferredDate) {
    if (!scopeId || !preferredDate) return null;
    const { count, error } = await supabaseAdmin
        .from('citizen_appointments')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_scope_id', scopeId)
        .eq('preferred_date', preferredDate);
    if (error) throw error;
    return Number(count || 0) + 1;
}

async function queueAppointmentSms({ appointment, unionId, message, category }) {
    if (!appointment?.phone || !unionId) {
        return { queued: false, reason: 'missing_phone_or_union' };
    }

    const { data: wallet, error: walletError } = await supabaseAdmin
        .from('sms_wallets')
        .upsert({ owner_type: 'location', owner_id: unionId }, { onConflict: 'owner_type,owner_id' })
        .select()
        .single();
    if (walletError) throw walletError;

    if (!wallet || Number(wallet.balance || 0) < 1) {
        return { queued: false, reason: 'empty_wallet' };
    }

    const { data: smsMessage, error: smsError } = await supabaseAdmin
        .from('sms_messages')
        .insert([{
            wallet_id: wallet.id,
            owner_type: 'location',
            owner_id: unionId,
            recipient_phone: appointment.phone,
            message,
            category,
            source_type: 'citizen_appointment',
            source_id: appointment.id
        }])
        .select()
        .single();
    if (smsError) throw smsError;

    const nextBalance = Number(wallet.balance || 0) - 1;
    const { error: updateError } = await supabaseAdmin
        .from('sms_wallets')
        .update({ balance: nextBalance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id);
    if (updateError) throw updateError;

    const { error: transactionError } = await supabaseAdmin
        .from('sms_wallet_transactions')
        .insert([{
            wallet_id: wallet.id,
            transaction_type: 'usage',
            credits: -1,
            reference_type: 'sms_messages',
            reference_id: smsMessage.id,
            note: category
        }]);
    if (transactionError) throw transactionError;

    return { queued: true, remainingBalance: nextBalance };
}

export async function POST(request) {
    try {
        const body = await request.json();
        const phone = normalizePhone(body.phone);
        if (!/^01[0-9]{9}$/.test(phone) || !body.title) {
            return NextResponse.json({ error: 'Phone and appointment title are required' }, { status: 400 });
        }

        const scopeType = body.scopeType || null;
        const scopeId = body.scopeId || null;
        const preferredDate = body.preferredDate || null;
        const priority = VALID_PRIORITY.has(body.priority) ? body.priority : 'normal';
        const preferredTimeSlot = VALID_SLOT.has(body.preferredTimeSlot) ? body.preferredTimeSlot : 'anytime';
        const serialNo = await nextSerialNo(scopeId, preferredDate);

        const { data, error } = await supabaseAdmin
            .from('citizen_appointments')
            .insert([{
                phone,
                citizen_name: body.citizenName || null,
                appointment_type: body.appointmentType || 'office_visit',
                title: body.title,
                description: body.description || null,
                location_text: body.locationText || null,
                assigned_scope_type: scopeType,
                assigned_scope_id: scopeId,
                preferred_date: preferredDate,
                preferred_time_slot: preferredTimeSlot,
                serial_no: serialNo,
                priority
            }])
            .select()
            .single();
        if (error) throw error;

        const serialText = data.serial_no ? ` Serial: ${data.serial_no}.` : '';
        await supabaseAdmin
            .from('citizen_reminders')
            .insert([{
                phone,
                reminder_type: 'appointment_status',
                title: `Office serial গ্রহণ: ${data.title}`,
                body: `${SUBMIT_MESSAGE}${serialText}`,
                source_type: 'citizen_appointment',
                source_id: data.id,
                status: 'pending'
            }]);

        const unionId = await resolveUnionId(scopeType, scopeId);
        const sms = await queueAppointmentSms({
            appointment: data,
            unionId,
            message: `${SUBMIT_MESSAGE}${serialText}`,
            category: 'appointment_submitted'
        });

        return NextResponse.json({ success: true, data, sms });
    } catch (error) {
        console.error('Citizen appointment failed:', error);
        return NextResponse.json({ error: error.message || 'Appointment submit failed' }, { status: 500 });
    }
}

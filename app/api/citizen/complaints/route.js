import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

const SUBMIT_MESSAGE = 'DigiGram: আপনার অভিযোগটি গ্রহণ করা হয়েছে। দায়িত্বপ্রাপ্ত অফিসার review করলে SMS/Inbox-এ update পাবেন।';
const VALID_PRIORITY = new Set(['low', 'normal', 'urgent', 'emergency']);

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

async function queueComplaintSms({ complaint, unionId, message, category }) {
    if (!complaint?.phone || !unionId) {
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
            recipient_phone: complaint.phone,
            message,
            category,
            source_type: 'citizen_complaint',
            source_id: complaint.id
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
            return NextResponse.json({ error: 'Phone and title are required' }, { status: 400 });
        }

        const scopeType = body.scopeType || null;
        const scopeId = body.scopeId || null;
        const priority = VALID_PRIORITY.has(body.priority) ? body.priority : 'normal';

        const { data, error } = await supabaseAdmin
            .from('citizen_complaints')
            .insert([{
                phone,
                citizen_name: body.citizenName || null,
                complaint_type: body.complaintType || 'general',
                title: body.title,
                description: body.description || null,
                location_text: body.locationText || null,
                priority,
                assigned_scope_type: scopeType,
                assigned_scope_id: scopeId
            }])
            .select()
            .single();

        if (error) throw error;

        await supabaseAdmin
            .from('citizen_reminders')
            .insert([{
                phone,
                reminder_type: 'complaint_status',
                title: `অভিযোগ গ্রহণ: ${data.title}`,
                body: SUBMIT_MESSAGE,
                source_type: 'citizen_complaint',
                source_id: data.id,
                status: 'pending'
            }]);

        const unionId = await resolveUnionId(scopeType, scopeId);
        const sms = await queueComplaintSms({
            complaint: data,
            unionId,
            message: SUBMIT_MESSAGE,
            category: 'complaint_submitted'
        });

        return NextResponse.json({ success: true, data, sms });
    } catch (error) {
        console.error('Citizen complaint failed:', error);
        return NextResponse.json({ error: error.message || 'Complaint submit failed' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { internalServerError } from '@/lib/utils/api-response';
import { readJsonObject, validateTextFields } from '@/lib/utils/request-validation';

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
        const parsed = await readJsonObject(request);
        if (parsed.error) {
            return NextResponse.json({ error: parsed.error }, { status: parsed.status });
        }
        const body = parsed.data;
        const phone = normalizePhone(body.phone);
        const validation = validateTextFields(body, {
            citizenName: { label: 'Citizen name', maxLength: 120 },
            complaintType: { label: 'Complaint type', maxLength: 64, defaultValue: 'general', pattern: /^[a-z0-9_-]+$/i },
            title: { label: 'Title', required: true, maxLength: 160 },
            description: { label: 'Description', maxLength: 3000 },
            locationText: { label: 'Location', maxLength: 300 },
            scopeType: { label: 'Scope type', maxLength: 16, allowed: new Set(['union', 'ward', 'village']) },
            scopeId: { label: 'Scope ID', maxLength: 80 },
            priority: { label: 'Priority', allowed: VALID_PRIORITY, defaultValue: 'normal' }
        });
        if (!/^01[0-9]{9}$/.test(phone)) {
            validation.errors.phone = ['A valid Bangladeshi mobile number is required'];
            validation.valid = false;
        }
        if (!validation.valid) {
            return NextResponse.json({
                error: 'Please correct the highlighted information',
                errors: validation.errors
            }, { status: 400 });
        }

        const recentCutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const dailyCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const [{ count: recentCount, error: recentError }, { count: dailyCount, error: dailyError }] = await Promise.all([
            supabaseAdmin
                .from('citizen_complaints')
                .select('id', { count: 'exact', head: true })
                .eq('phone', phone)
                .gte('created_at', recentCutoff),
            supabaseAdmin
                .from('citizen_complaints')
                .select('id', { count: 'exact', head: true })
                .eq('phone', phone)
                .gte('created_at', dailyCutoff)
        ]);
        if (recentError) throw recentError;
        if (dailyError) throw dailyError;
        if (Number(recentCount || 0) > 0 || Number(dailyCount || 0) >= 5) {
            return NextResponse.json({ error: 'Complaint submission limit reached. Please try again later.' }, { status: 429 });
        }

        const {
            citizenName,
            complaintType,
            title,
            description,
            locationText,
            scopeType,
            scopeId,
            priority
        } = validation.values;

        const { data, error } = await supabaseAdmin
            .from('citizen_complaints')
            .insert([{
                phone,
                citizen_name: citizenName,
                complaint_type: complaintType,
                title,
                description,
                location_text: locationText,
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
        return internalServerError('Complaint submission failed. Please try again.');
    }
}

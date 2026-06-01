import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

const VALID_STATUS = new Set(['submitted', 'reviewing', 'assigned', 'scheduled', 'completed', 'rejected']);
const VALID_PRIORITY = new Set(['low', 'normal', 'urgent', 'emergency']);

const STATUS_SMS = {
    reviewing: 'DigiGram: আপনার request review করা হচ্ছে।',
    assigned: 'DigiGram: আপনার request দায়িত্বপ্রাপ্ত টিমে পাঠানো হয়েছে।',
    scheduled: 'DigiGram: আপনার request-এর follow-up সময় নির্ধারণ করা হয়েছে।',
    completed: 'DigiGram: আপনার request সম্পন্ন করা হয়েছে।',
    rejected: 'DigiGram: আপনার request বন্ধ করা হয়েছে।'
};

async function getAllowedScopeIds(scopeType, scopeId) {
    if (!scopeType || !scopeId) return [];
    if (scopeType === 'ward') {
        const { data: villages } = await supabaseAdmin.from('locations').select('id').eq('parent_id', scopeId);
        return [scopeId, ...(villages || []).map((item) => item.id)];
    }
    if (scopeType === 'union') {
        const { data: wards } = await supabaseAdmin.from('locations').select('id').eq('parent_id', scopeId);
        const wardIds = (wards || []).map((item) => item.id);
        let villageIds = [];
        if (wardIds.length > 0) {
            const { data: villages } = await supabaseAdmin.from('locations').select('id').in('parent_id', wardIds);
            villageIds = (villages || []).map((item) => item.id);
        }
        return [scopeId, ...wardIds, ...villageIds];
    }
    return [scopeId];
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

async function queueSms({ row, message, category }) {
    if (!row?.phone) return { queued: false, reason: 'missing_phone' };
    const unionId = await resolveUnionId(row.assigned_scope_type, row.assigned_scope_id);
    if (!unionId) return { queued: false, reason: 'missing_union' };

    const { data: wallet, error: walletError } = await supabaseAdmin
        .from('sms_wallets')
        .upsert({ owner_type: 'location', owner_id: unionId }, { onConflict: 'owner_type,owner_id' })
        .select()
        .single();
    if (walletError) throw walletError;
    if (!wallet || Number(wallet.balance || 0) < 1) return { queued: false, reason: 'empty_wallet' };

    const { data: smsMessage, error: smsError } = await supabaseAdmin
        .from('sms_messages')
        .insert([{
            wallet_id: wallet.id,
            owner_type: 'location',
            owner_id: unionId,
            recipient_phone: row.phone,
            message,
            category,
            source_type: 'citizen_life_support_case',
            source_id: row.id
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

    await supabaseAdmin.from('sms_wallet_transactions').insert([{
        wallet_id: wallet.id,
        transaction_type: 'usage',
        credits: -1,
        reference_type: 'sms_messages',
        reference_id: smsMessage.id,
        note: category
    }]);

    return { queued: true, remainingBalance: nextBalance };
}

export async function GET(request) {
    try {
        const { searchParams } = request.nextUrl;
        const scopeType = searchParams.get('scopeType');
        const scopeId = searchParams.get('scopeId');
        const status = searchParams.get('status');
        const caseType = searchParams.get('caseType');
        const allowedScopeIds = await getAllowedScopeIds(scopeType, scopeId);

        let query = supabaseAdmin
            .from('citizen_life_support_cases')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(400);

        if (status && status !== 'all') query = query.eq('status', status);
        if (caseType && caseType !== 'all') query = query.eq('case_type', caseType);

        const { data, error } = await query;
        if (error) throw error;

        const rows = (data || []).filter((item) => {
            if (!scopeId) return true;
            if (!item.assigned_scope_id) return true;
            return allowedScopeIds.includes(item.assigned_scope_id);
        });

        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        console.error('Life support manager load failed:', error);
        return NextResponse.json({ error: error.message || 'Life support manager load failed' }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const body = await request.json();
        if (!body.id) return NextResponse.json({ error: 'Case id is required' }, { status: 400 });
        if (body.status && !VALID_STATUS.has(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        if (body.priority && !VALID_PRIORITY.has(body.priority)) return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });

        const payload = { updated_at: new Date().toISOString() };
        if (body.status) payload.status = body.status;
        if (body.status === 'completed') payload.completed_at = new Date().toISOString();
        if ('feedback' in body) payload.feedback = body.feedback || null;
        if ('officerNote' in body) payload.officer_note = body.officerNote || null;
        if ('scheduledAt' in body) payload.scheduled_at = body.scheduledAt || null;
        if (body.priority) payload.priority = body.priority;

        const { data: previous } = await supabaseAdmin
            .from('citizen_life_support_cases')
            .select('id,status,feedback,scheduled_at')
            .eq('id', body.id)
            .maybeSingle();

        const { data, error } = await supabaseAdmin
            .from('citizen_life_support_cases')
            .update(payload)
            .eq('id', body.id)
            .select()
            .single();
        if (error) throw error;

        const changedStatus = body.status && previous?.status !== body.status;
        const changedFeedback = 'feedback' in body && (previous?.feedback || '') !== (body.feedback || '');
        const changedSchedule = 'scheduledAt' in body && (previous?.scheduled_at || '') !== (body.scheduledAt || '');
        let sms = { queued: false, reason: 'no_status_change' };

        if (data?.phone && body.status && (changedStatus || changedFeedback || changedSchedule)) {
            const scheduleText = data.scheduled_at ? ` সময়: ${new Date(data.scheduled_at).toLocaleString('bn-BD')}.` : '';
            const statusText = STATUS_SMS[body.status] || 'DigiGram: আপনার request update হয়েছে।';
            const message = `${statusText}${scheduleText}${body.feedback ? ` ${body.feedback}` : ''}`;

            await supabaseAdmin.from('citizen_reminders').insert([{
                phone: data.phone,
                reminder_type: `${data.case_type}_status`,
                title: `Request update: ${data.title}`,
                body: message,
                source_type: 'citizen_life_support_case',
                source_id: data.id,
                status: 'pending'
            }]);

            sms = await queueSms({ row: data, message, category: `${data.case_type}_${body.status}` });
        }

        return NextResponse.json({ success: true, data, sms });
    } catch (error) {
        console.error('Life support update failed:', error);
        return NextResponse.json({ error: error.message || 'Life support update failed' }, { status: 500 });
    }
}

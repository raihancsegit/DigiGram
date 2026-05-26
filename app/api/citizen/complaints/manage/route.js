import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

const VALID_STATUS = new Set(['submitted', 'reviewing', 'assigned', 'resolved', 'rejected']);
const VALID_PRIORITY = new Set(['low', 'normal', 'urgent', 'emergency']);
const STATUS_SMS = {
    reviewing: 'DigiGram: আপনার অভিযোগটি এখন পর্যালোচনায় আছে।',
    assigned: 'DigiGram: আপনার অভিযোগটি দায়িত্বপ্রাপ্ত টিমে পাঠানো হয়েছে।',
    resolved: 'DigiGram: আপনার অভিযোগটি সমাধান করা হয়েছে।',
    rejected: 'DigiGram: আপনার অভিযোগটি বন্ধ করা হয়েছে।'
};

async function getAllowedScopeIds(scopeType, scopeId) {
    if (!scopeType || !scopeId) return [];

    if (scopeType === 'ward') {
        const { data: villages } = await supabaseAdmin
            .from('locations')
            .select('id')
            .eq('parent_id', scopeId);
        return [scopeId, ...(villages || []).map((item) => item.id)];
    }

    if (scopeType === 'union') {
        const { data: wards } = await supabaseAdmin
            .from('locations')
            .select('id')
            .eq('parent_id', scopeId);
        const wardIds = (wards || []).map((item) => item.id);

        let villageIds = [];
        if (wardIds.length > 0) {
            const { data: villages } = await supabaseAdmin
                .from('locations')
                .select('id')
                .in('parent_id', wardIds);
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

async function queueComplaintSms({ complaint, message, category }) {
    if (!complaint?.phone) return { queued: false, reason: 'missing_phone' };
    const unionId = await resolveUnionId(complaint.assigned_scope_type, complaint.assigned_scope_id);
    if (!unionId) return { queued: false, reason: 'missing_union' };

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

export async function GET(request) {
    try {
        const { searchParams } = request.nextUrl;
        const scopeType = searchParams.get('scopeType');
        const scopeId = searchParams.get('scopeId');
        const status = searchParams.get('status');
        const allowedScopeIds = await getAllowedScopeIds(scopeType, scopeId);

        let query = supabaseAdmin
            .from('citizen_complaints')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(300);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;

        const rows = (data || []).filter((item) => {
            if (!scopeId) return true;
            if (!item.assigned_scope_id) return true;
            return allowedScopeIds.includes(item.assigned_scope_id);
        });

        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        console.error('Complaint manager load failed:', error);
        return NextResponse.json({ error: error.message || 'Complaint manager load failed' }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const body = await request.json();
        if (!body.id) {
            return NextResponse.json({ error: 'Complaint id is required' }, { status: 400 });
        }
        if (body.status && !VALID_STATUS.has(body.status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
        if (body.priority && !VALID_PRIORITY.has(body.priority)) {
            return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
        }

        const payload = {
            updated_at: new Date().toISOString()
        };
        if (body.status) payload.status = body.status;
        if (body.status === 'resolved') payload.resolved_at = new Date().toISOString();
        if ('feedback' in body) payload.feedback = body.feedback || null;
        if ('officerNote' in body) payload.officer_note = body.officerNote || null;
        if (body.priority) payload.priority = body.priority;
        if (body.assignedScopeType) payload.assigned_scope_type = body.assignedScopeType;
        if (body.assignedScopeId) payload.assigned_scope_id = body.assignedScopeId;

        const { data: previous } = await supabaseAdmin
            .from('citizen_complaints')
            .select('id,status,feedback')
            .eq('id', body.id)
            .maybeSingle();

        const { data, error } = await supabaseAdmin
            .from('citizen_complaints')
            .update(payload)
            .eq('id', body.id)
            .select()
            .single();
        if (error) throw error;

        let sms = { queued: false, reason: 'no_status_change' };
        const changedStatus = body.status && previous?.status !== body.status;
        const changedFeedback = 'feedback' in body && (previous?.feedback || '') !== (body.feedback || '');

        if (data?.phone && body.status && (changedStatus || changedFeedback)) {
            const statusText = {
                reviewing: 'আপনার অভিযোগটি পর্যালোচনায় নেওয়া হয়েছে।',
                assigned: 'আপনার অভিযোগটি দায়িত্বপ্রাপ্ত টিমে পাঠানো হয়েছে।',
                resolved: 'আপনার অভিযোগটি সমাধান করা হয়েছে।',
                rejected: 'আপনার অভিযোগটি বন্ধ করা হয়েছে।'
            }[body.status];

            if (statusText) {
                await supabaseAdmin
                    .from('citizen_reminders')
                    .insert([{
                        phone: data.phone,
                        reminder_type: 'complaint_status',
                        title: `অভিযোগ আপডেট: ${data.title}`,
                        body: body.feedback ? `${statusText} ${body.feedback}` : statusText,
                        source_type: 'citizen_complaint',
                        source_id: data.id,
                        status: 'pending'
                    }]);

                sms = await queueComplaintSms({
                    complaint: data,
                    message: body.feedback ? `${STATUS_SMS[body.status] || statusText} ${body.feedback}` : (STATUS_SMS[body.status] || statusText),
                    category: `complaint_${body.status}`
                });
            }
        }

        return NextResponse.json({ success: true, data, sms });
    } catch (error) {
        console.error('Complaint update failed:', error);
        return NextResponse.json({ error: error.message || 'Complaint update failed' }, { status: 500 });
    }
}

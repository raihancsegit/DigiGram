import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { canAccessLocation, requireRequestProfile } from '@/lib/utils/server-auth';
import { loadOfficerActivity, recordOfficerActivity } from '@/lib/utils/officer-activity';

const VALID_STATUS = new Set(['submitted', 'reviewing', 'scheduled', 'completed', 'rejected', 'no_show']);
const VALID_PRIORITY = new Set(['low', 'normal', 'urgent', 'emergency']);
const STATUS_SMS = {
    reviewing: 'DigiGram: আপনার appointment request এখন পর্যালোচনায় আছে।',
    scheduled: 'DigiGram: আপনার office serial/appointment সময় নির্ধারণ করা হয়েছে।',
    completed: 'DigiGram: আপনার appointment/office visit সম্পন্ন করা হয়েছে।',
    rejected: 'DigiGram: আপনার appointment request বন্ধ করা হয়েছে।',
    no_show: 'DigiGram: নির্ধারিত appointment-এ উপস্থিত পাওয়া যায়নি। প্রয়োজন হলে আবার request করুন।'
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

async function queueAppointmentSms({ appointment, message, category }) {
    if (!appointment?.phone) return { queued: false, reason: 'missing_phone' };
    const unionId = await resolveUnionId(appointment.assigned_scope_type, appointment.assigned_scope_id);
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

export async function GET(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin', 'chairman', 'ward_member']);
        if (auth.response) return auth.response;

        const { searchParams } = request.nextUrl;
        const scopeType = searchParams.get('scopeType');
        const scopeId = searchParams.get('scopeId');
        const status = searchParams.get('status');
        if (auth.profile.role !== 'super_admin') {
            if (!scopeId || !(await canAccessLocation(auth.profile, scopeId))) {
                return NextResponse.json({ error: 'Appointment scope is outside your assigned area' }, { status: 403 });
            }
        }

        await supabaseAdmin.rpc('refresh_service_sla_escalations');
        const allowedScopeIds = await getAllowedScopeIds(scopeType, scopeId);

        let query = supabaseAdmin
            .from('citizen_appointments')
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
            if (!item.assigned_scope_id) return auth.profile.role === 'super_admin';
            return allowedScopeIds.includes(item.assigned_scope_id);
        });

        const activity = await loadOfficerActivity('citizen_appointment', rows);
        return NextResponse.json({
            success: true,
            data: rows.map((item) => ({ ...item, activity: activity.get(item.id) || [] }))
        });
    } catch (error) {
        console.error('Appointment manager load failed:', error);
        return NextResponse.json({ error: error.message || 'Appointment manager load failed' }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin', 'chairman', 'ward_member']);
        if (auth.response) return auth.response;

        const body = await request.json();
        if (!body.id) {
            return NextResponse.json({ error: 'Appointment id is required' }, { status: 400 });
        }
        if (body.status && !VALID_STATUS.has(body.status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
        if (body.priority && !VALID_PRIORITY.has(body.priority)) {
            return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
        }

        const payload = { updated_at: new Date().toISOString() };
        if (body.status) payload.status = body.status;
        if (body.status === 'completed') payload.completed_at = new Date().toISOString();
        if ('feedback' in body) payload.feedback = body.feedback || null;
        if ('officerNote' in body) payload.officer_note = body.officerNote || null;
        if ('officerName' in body) payload.officer_name = body.officerName || null;
        if ('scheduledAt' in body) payload.scheduled_at = body.scheduledAt || null;
        if ('serialNo' in body) payload.serial_no = body.serialNo ? Number(body.serialNo) : null;
        if (body.priority) payload.priority = body.priority;

        const { data: previous } = await supabaseAdmin
            .from('citizen_appointments')
            .select('id,status,feedback,scheduled_at,assigned_scope_id')
            .eq('id', body.id)
            .maybeSingle();

        if (!previous) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }
        if (
            auth.profile.role !== 'super_admin'
            && (!previous.assigned_scope_id || !(await canAccessLocation(auth.profile, previous.assigned_scope_id)))
        ) {
            return NextResponse.json({ error: 'Appointment is outside your assigned area' }, { status: 403 });
        }

        const { data, error } = await supabaseAdmin
            .from('citizen_appointments')
            .update(payload)
            .eq('id', body.id)
            .select()
            .single();
        if (error) throw error;

        await recordOfficerActivity({
            sourceType: 'citizen_appointment',
            sourceId: data.id,
            assignedScopeId: data.assigned_scope_id,
            actor: auth.profile,
            action: previous.status !== data.status ? 'status_changed' : 'details_updated',
            fromStatus: previous.status,
            toStatus: data.status,
            note: body.officerNote || body.feedback || null,
            metadata: {
                scheduled_at: data.scheduled_at,
                serial_no: data.serial_no,
                priority: data.priority
            }
        });

        const activity = await loadOfficerActivity('citizen_appointment', [data]);
        data.activity = activity.get(data.id) || [];

        const changedStatus = body.status && previous?.status !== body.status;
        const changedFeedback = 'feedback' in body && (previous?.feedback || '') !== (body.feedback || '');
        const changedSchedule = 'scheduledAt' in body && (previous?.scheduled_at || '') !== (body.scheduledAt || '');
        let sms = { queued: false, reason: 'no_status_change' };

        if (data?.phone && body.status && (changedStatus || changedFeedback || changedSchedule)) {
            const scheduleText = data.scheduled_at
                ? ` সময়: ${new Date(data.scheduled_at).toLocaleString('bn-BD')}.`
                : data.preferred_date
                    ? ` পছন্দের তারিখ: ${new Date(data.preferred_date).toLocaleDateString('bn-BD')}.`
                    : '';
            const serialText = data.serial_no ? ` Serial: ${data.serial_no}.` : '';
            const statusText = STATUS_SMS[body.status] || 'DigiGram: আপনার appointment update হয়েছে।';
            const message = `${statusText}${serialText}${scheduleText}${body.feedback ? ` ${body.feedback}` : ''}`;

            await supabaseAdmin
                .from('citizen_reminders')
                .insert([{
                    phone: data.phone,
                    reminder_type: 'appointment_status',
                    title: `Appointment update: ${data.title}`,
                    body: message,
                    source_type: 'citizen_appointment',
                    source_id: data.id,
                    status: 'pending'
                }]);

            sms = await queueAppointmentSms({
                appointment: data,
                message,
                category: `appointment_${body.status}`
            });
        }

        return NextResponse.json({ success: true, data, sms });
    } catch (error) {
        console.error('Appointment update failed:', error);
        return NextResponse.json({ error: error.message || 'Appointment update failed' }, { status: 500 });
    }
}

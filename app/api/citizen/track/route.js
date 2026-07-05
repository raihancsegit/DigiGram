import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { getServiceSla } from '@/lib/utils/serviceSla';

export const dynamic = 'force-dynamic';

const TYPE_META = {
    service: {
        label: 'Service request',
        table: 'service_requests',
        phoneColumn: 'contact_phone',
        select: 'id,request_type,status,applicant_name,contact_phone,collection_date,feedback,certificate_no,created_at,updated_at,sla_due_at,sla_breached_at,escalation_level'
    },
    complaint: {
        label: 'Complaint',
        table: 'citizen_complaints',
        phoneColumn: 'phone',
        select: 'id,title,status,phone,citizen_name,complaint_type,priority,feedback,created_at,updated_at,sla_due_at,sla_breached_at,escalation_level'
    },
    appointment: {
        label: 'Office serial',
        table: 'citizen_appointments',
        phoneColumn: 'phone',
        select: 'id,title,status,phone,citizen_name,appointment_type,preferred_date,preferred_time_slot,scheduled_at,serial_no,officer_name,feedback,priority,created_at,updated_at,sla_due_at,sla_breached_at,escalation_level'
    },
    life_support: {
        label: 'Citizen support',
        table: 'citizen_life_support_cases',
        phoneColumn: 'phone',
        select: 'id,title,status,phone,citizen_name,case_type,category,scheduled_at,feedback,priority,created_at,updated_at,sla_due_at,sla_breached_at,escalation_level'
    }
};

function normalizePhone(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

function maskPhone(phone) {
    if (!phone || phone.length < 7) return phone || '';
    return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
}

function publicTitle(type, row) {
    if (type === 'service') return row.request_type || 'Service request';
    if (type === 'appointment') return row.title || 'Office serial';
    if (type === 'life_support') return row.title || row.case_type || 'Citizen support';
    return row.title || 'Complaint';
}

function nextAction(type, row, sla) {
    if (['completed', 'resolved', 'closed'].includes(row.status)) {
        return 'Request completed. Keep the tracking ID for future reference.';
    }
    if (['rejected', 'cancelled', 'no_show'].includes(row.status)) {
        return row.feedback || 'Request was not approved. Contact the office if you need help.';
    }
    if (row.status === 'ready') {
        return row.collection_date
            ? 'Bring original documents and collect from the office on the collection date.'
            : 'Your request is ready. Contact the office for collection time.';
    }
    if (row.scheduled_at) {
        return 'Appointment time has been scheduled. Please arrive with required documents.';
    }
    if (sla?.state === 'overdue') {
        return 'This request crossed the target time. Please contact the office with this tracking ID.';
    }
    return 'Request is active. You will get SMS or inbox update when the office changes status.';
}

async function findRow(type, trackingId, phone) {
    const meta = TYPE_META[type];
    if (!meta) return null;

    let query = supabaseAdmin
        .from(meta.table)
        .select(meta.select)
        .eq(meta.phoneColumn, phone)
        .limit(1);

    if (type === 'service') {
        query = query.or(`id.eq.${trackingId},certificate_no.eq.${trackingId}`);
    } else {
        query = query.eq('id', trackingId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
        if (['42P01', '42703', 'PGRST205'].includes(error.code)) return null;
        throw error;
    }
    if (!data) return null;

    const sla = getServiceSla(data);
    return {
        type,
        typeLabel: meta.label,
        id: data.id,
        title: publicTitle(type, data),
        status: data.status,
        priority: data.priority || null,
        submittedAt: data.created_at,
        updatedAt: data.updated_at || data.created_at,
        maskedPhone: maskPhone(data[meta.phoneColumn]),
        serialNo: data.serial_no || null,
        scheduledAt: data.scheduled_at || null,
        collectionDate: data.collection_date || null,
        certificateNo: data.certificate_no || null,
        officerName: data.officer_name || null,
        feedback: data.feedback || null,
        sla: {
            active: sla.active,
            state: sla.state,
            ageDays: sla.ageDays,
            remainingDays: sla.remainingDays,
            targetDays: sla.targetDays,
            progress: sla.progress,
            dueDate: sla.dueDate.toISOString(),
            escalationLevel: sla.escalationLevel
        },
        nextAction: nextAction(type, data, sla)
    };
}

export async function POST(request) {
    try {
        const body = await request.json();
        const trackingId = String(body.trackingId || '').trim();
        const phone = normalizePhone(body.phone);

        if (!trackingId || !/^01[0-9]{9}$/.test(phone)) {
            return NextResponse.json({ error: 'Tracking ID and valid Bangladesh phone number are required' }, { status: 400 });
        }

        const preferredType = TYPE_META[body.type] ? body.type : null;
        const types = preferredType ? [preferredType] : ['service', 'complaint', 'appointment', 'life_support'];

        for (const type of types) {
            const row = await findRow(type, trackingId, phone);
            if (row) {
                return NextResponse.json({ success: true, data: row });
            }
        }

        return NextResponse.json({
            error: 'No matching request found for this tracking ID and phone number'
        }, { status: 404 });
    } catch (error) {
        console.error('Citizen tracking lookup failed:', error);
        return NextResponse.json({ error: error.message || 'Tracking lookup failed' }, { status: 500 });
    }
}

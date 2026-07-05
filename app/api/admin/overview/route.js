import { NextResponse } from 'next/server';
import { requireRequestProfile } from '@/lib/utils/server-auth';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export const dynamic = 'force-dynamic';

const OPTIONAL_SCHEMA_ERRORS = new Set(['42P01', '42703', 'PGRST204', 'PGRST205']);

async function safeCount(table, applyFilter = (query) => query) {
    try {
        const query = applyFilter(supabaseAdmin.from(table).select('*', { count: 'exact', head: true }));
        const { count, error } = await query;
        if (error) {
            if (OPTIONAL_SCHEMA_ERRORS.has(error.code)) return { count: 0, error: error.message, missing: true };
            return { count: 0, error: error.message, missing: false };
        }
        return { count: count || 0, error: null, missing: false };
    } catch (error) {
        return { count: 0, error: error.message || String(error), missing: false };
    }
}

async function safeRows(table, select = '*', applyFilter = (query) => query, limit = 6) {
    try {
        const query = applyFilter(supabaseAdmin.from(table).select(select)).limit(limit);
        const { data, error } = await query;
        if (error) return [];
        return data || [];
    } catch {
        return [];
    }
}

export async function GET(request) {
    const auth = await requireRequestProfile(request, ['super_admin']);
    if (auth.response) return auth.response;

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const monthStart = thisMonth.toISOString();

    const [
        districts,
        upazilas,
        unions,
        wards,
        villages,
        households,
        residents,
        profiles,
        institutions,
        activeInstitutions,
        schoolStudents,
        admissionPending,
        serviceOpen,
        complaintsOpen,
        appointmentsOpen,
        lifeSupportOpen,
        smsMonth,
        smsQueued,
        smsFailed,
        smsWallets,
        paymentsPending,
        dataQualityOpen,
        demoBatches
    ] = await Promise.all([
        safeCount('locations', (q) => q.eq('type', 'district')),
        safeCount('locations', (q) => q.eq('type', 'upazila')),
        safeCount('locations', (q) => q.eq('type', 'union')),
        safeCount('locations', (q) => q.eq('type', 'ward')),
        safeCount('locations', (q) => q.eq('type', 'village')),
        safeCount('households'),
        safeCount('residents'),
        safeCount('profiles'),
        safeCount('institutions'),
        safeCount('institutions', (q) => q.eq('website_status', 'active')),
        safeCount('school_students', (q) => q.eq('active', true)),
        safeCount('school_admission_applications', (q) => q.in('status', ['pending', 'reviewing'])),
        safeCount('service_requests', (q) => q.in('status', ['pending', 'processing', 'ready'])),
        safeCount('citizen_complaints', (q) => q.in('status', ['submitted', 'reviewing', 'assigned', 'in_progress'])),
        safeCount('citizen_appointments', (q) => q.in('status', ['requested', 'scheduled'])),
        safeCount('citizen_life_support_cases', (q) => q.in('status', ['submitted', 'reviewing', 'approved'])),
        safeCount('sms_messages', (q) => q.gte('queued_at', monthStart)),
        safeCount('sms_messages', (q) => q.eq('status', 'queued')),
        safeCount('sms_messages', (q) => q.eq('status', 'failed')),
        safeRows('sms_wallets', 'balance,low_balance_threshold,owner_type,owner_id', (q) => q.order('balance', { ascending: true }), 10),
        safeCount('payment_transactions', (q) => q.in('status', ['pending', 'submitted', 'reviewing'])),
        safeCount('data_quality_tasks', (q) => q.in('status', ['open', 'reviewing'])),
        safeCount('demo_data_batches', (q) => q.in('status', ['creating', 'active', 'failed']))
    ]);

    const recentInstitutions = await safeRows(
        'institutions',
        'id,name,type,category,website_status,created_at',
        (q) => q.order('created_at', { ascending: false }),
        5
    );
    const recentRequests = await safeRows(
        'service_requests',
        'id,request_type,status,applicant_name,created_at',
        (q) => q.order('created_at', { ascending: false }),
        5
    );

    const openWorkload = serviceOpen.count + complaintsOpen.count + appointmentsOpen.count + lifeSupportOpen.count;
    const lowSmsWallets = smsWallets.filter((wallet) => Number(wallet.balance || 0) <= Number(wallet.low_balance_threshold || 0)).length;

    return NextResponse.json({
        success: true,
        generatedAt: new Date().toISOString(),
        counts: {
            districts: districts.count,
            upazilas: upazilas.count,
            unions: unions.count,
            wards: wards.count,
            villages: villages.count,
            households: households.count,
            residents: residents.count,
            profiles: profiles.count,
            institutions: institutions.count,
            activeInstitutions: activeInstitutions.count,
            schoolStudents: schoolStudents.count,
            admissionPending: admissionPending.count,
            serviceOpen: serviceOpen.count,
            complaintsOpen: complaintsOpen.count,
            appointmentsOpen: appointmentsOpen.count,
            lifeSupportOpen: lifeSupportOpen.count,
            openWorkload,
            smsMonth: smsMonth.count,
            smsQueued: smsQueued.count,
            smsFailed: smsFailed.count,
            lowSmsWallets,
            paymentsPending: paymentsPending.count,
            dataQualityOpen: dataQualityOpen.count,
            activeDemoBatches: demoBatches.count
        },
        recent: {
            institutions: recentInstitutions,
            requests: recentRequests
        }
    });
}

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

function normalizePhone(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

async function verifyOtp(phone, otpCode) {
    const { data, error } = await supabaseAdmin
        .from('citizen_otps')
        .select('*')
        .eq('phone', phone)
        .eq('otp_code', otpCode)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    return Boolean(data);
}

export async function POST(request) {
    try {
        const { phone, otpCode } = await request.json();
        const normalizedPhone = normalizePhone(phone);
        if (!/^01[0-9]{9}$/.test(normalizedPhone) || !otpCode) {
            return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
        }

        const verified = await verifyOtp(normalizedPhone, String(otpCode).trim());
        if (!verified) {
            return NextResponse.json({ error: 'OTP ভুল অথবা মেয়াদ শেষ হয়েছে' }, { status: 401 });
        }

        const [
            { data: serviceRequests },
            { data: complaints },
            { data: bloodRequests },
            { data: reminders },
            { data: households }
        ] = await Promise.all([
            supabaseAdmin
                .from('service_requests')
                .select('id,request_type,status,applicant_name,contact_phone,collection_date,feedback,certificate_no,created_at')
                .eq('contact_phone', normalizedPhone)
                .order('created_at', { ascending: false })
                .limit(30),
            supabaseAdmin
                .from('citizen_complaints')
                .select('*')
                .eq('phone', normalizedPhone)
                .order('created_at', { ascending: false })
                .limit(30),
            supabaseAdmin
                .from('citizen_blood_requests')
                .select('*')
                .eq('phone', normalizedPhone)
                .order('created_at', { ascending: false })
                .limit(20),
            supabaseAdmin
                .from('citizen_reminders')
                .select('*')
                .eq('phone', normalizedPhone)
                .order('created_at', { ascending: false })
                .limit(20),
            supabaseAdmin
                .from('households')
                .select('id,owner_name,house_no,phone,created_at')
                .eq('phone', normalizedPhone)
                .order('created_at', { ascending: false })
                .limit(10)
        ]);

        const householdIds = (households || []).map((household) => household.id).filter(Boolean);
        const { data: householdTaxes } = householdIds.length > 0
            ? await supabaseAdmin
                .from('household_taxes')
                .select('id,household_id,year,fiscal_year_label,amount_due,amount_paid,due_date,paid_date,receipt_no,status,created_at,updated_at')
                .in('household_id', householdIds)
                .order('created_at', { ascending: false })
                .limit(50)
            : { data: [] };

        let appointments = [];
        try {
            const { data: appointmentRows, error: appointmentError } = await supabaseAdmin
                .from('citizen_appointments')
                .select('id,phone,citizen_name,appointment_type,title,description,location_text,preferred_date,preferred_time_slot,scheduled_at,serial_no,officer_name,feedback,priority,status,created_at,updated_at')
                .eq('phone', normalizedPhone)
                .order('created_at', { ascending: false })
                .limit(30);
            if (appointmentError) throw appointmentError;
            appointments = appointmentRows || [];
        } catch (appointmentError) {
            console.warn('Citizen appointments skipped:', appointmentError.message);
        }

        let lifeSupportCases = [];
        try {
            const { data: lifeRows, error: lifeError } = await supabaseAdmin
                .from('citizen_life_support_cases')
                .select('id,phone,citizen_name,case_type,category,title,description,location_text,scheduled_at,feedback,priority,status,created_at,updated_at')
                .eq('phone', normalizedPhone)
                .order('created_at', { ascending: false })
                .limit(40);
            if (lifeError) throw lifeError;
            lifeSupportCases = lifeRows || [];
        } catch (lifeError) {
            console.warn('Citizen life support skipped:', lifeError.message);
        }

        const timeline = [
            ...(serviceRequests || []).map((item) => ({
                id: `service-${item.id}`,
                type: 'service',
                title: item.request_type || 'Service request',
                status: item.status,
                date: item.updated_at || item.created_at,
                text: item.collection_date
                    ? `Collection date: ${item.collection_date}`
                    : item.certificate_no
                        ? `Certificate: ${item.certificate_no}`
                        : item.feedback || 'Application update'
            })),
            ...(complaints || []).map((item) => ({
                id: `complaint-${item.id}`,
                type: 'complaint',
                title: item.title || 'Complaint',
                status: item.status,
                date: item.updated_at || item.created_at,
                text: item.feedback || item.description || item.location_text || 'Complaint update'
            })),
            ...(bloodRequests || []).map((item) => ({
                id: `blood-${item.id}`,
                type: 'blood',
                title: `${item.blood_group || ''} Blood request`.trim(),
                status: item.status,
                date: item.updated_at || item.created_at,
                text: item.hospital_or_location || item.note || 'Blood request update'
            })),
            ...(appointments || []).map((item) => ({
                id: `appointment-${item.id}`,
                type: 'appointment',
                title: item.title || 'Office serial',
                status: item.status,
                date: item.updated_at || item.scheduled_at || item.preferred_date || item.created_at,
                text: [
                    item.serial_no ? `Serial: ${item.serial_no}` : '',
                    item.scheduled_at ? `সময়: ${new Date(item.scheduled_at).toLocaleString('bn-BD')}` : '',
                    item.preferred_date ? `পছন্দের তারিখ: ${new Date(item.preferred_date).toLocaleDateString('bn-BD')}` : '',
                    item.feedback || item.description || item.location_text || ''
                ].filter(Boolean).join(' · ')
            })),
            ...(lifeSupportCases || []).map((item) => ({
                id: `life-${item.id}`,
                type: 'life_support',
                title: item.title || item.case_type || 'Citizen support',
                status: item.status,
                date: item.updated_at || item.scheduled_at || item.created_at,
                text: [
                    item.case_type,
                    item.category,
                    item.scheduled_at ? `সময়: ${new Date(item.scheduled_at).toLocaleString('bn-BD')}` : '',
                    item.feedback || item.description || item.location_text || ''
                ].filter(Boolean).join(' · ')
            })),
            ...(reminders || []).map((item) => ({
                id: `reminder-${item.id}`,
                type: 'reminder',
                title: item.title || 'Reminder',
                status: item.status || 'active',
                date: item.created_at,
                text: item.body || item.message || 'Reminder'
            })),
            ...(householdTaxes || []).map((item) => ({
                id: `tax-${item.id}`,
                type: 'tax',
                title: `${item.fiscal_year_label || item.year || 'Tax'} holding tax`,
                status: item.status,
                date: item.updated_at || item.created_at || item.due_date,
                text: `Due: ${item.amount_due || 0}, paid: ${item.amount_paid || 0}${item.due_date ? `, deadline: ${item.due_date}` : ''}`
            }))
        ]
            .filter((item) => item.date || item.title)
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
            .slice(0, 80);

        return NextResponse.json({
            success: true,
            data: {
                phone: normalizedPhone,
                serviceRequests: serviceRequests || [],
                complaints: complaints || [],
                bloodRequests: bloodRequests || [],
                appointments,
                lifeSupportCases,
                reminders: reminders || [],
                households: households || [],
                householdTaxes: householdTaxes || [],
                timeline
            }
        });
    } catch (error) {
        console.error('Citizen inbox failed:', error);
        return NextResponse.json({ error: error.message || 'Citizen inbox failed' }, { status: 500 });
    }
}

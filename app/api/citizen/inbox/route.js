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

        return NextResponse.json({
            success: true,
            data: {
                phone: normalizedPhone,
                serviceRequests: serviceRequests || [],
                complaints: complaints || [],
                bloodRequests: bloodRequests || [],
                reminders: reminders || [],
                households: households || []
            }
        });
    } catch (error) {
        console.error('Citizen inbox failed:', error);
        return NextResponse.json({ error: error.message || 'Citizen inbox failed' }, { status: 500 });
    }
}

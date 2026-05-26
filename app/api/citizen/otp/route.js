import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

function normalizePhone(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

function createCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request) {
    try {
        const { phone, purpose = 'citizen_inbox' } = await request.json();
        const normalizedPhone = normalizePhone(phone);
        if (!/^01[0-9]{9}$/.test(normalizedPhone)) {
            return NextResponse.json({ error: 'Valid Bangladeshi mobile number is required' }, { status: 400 });
        }

        const otpCode = createCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        const { data, error } = await supabaseAdmin
            .from('citizen_otps')
            .insert([{
                phone: normalizedPhone,
                otp_code: otpCode,
                purpose,
                expires_at: expiresAt
            }])
            .select('id, phone, expires_at')
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data,
            debugCode: process.env.NODE_ENV === 'production' ? undefined : otpCode
        });
    } catch (error) {
        console.error('Citizen OTP failed:', error);
        return NextResponse.json({ error: error.message || 'OTP request failed' }, { status: 500 });
    }
}

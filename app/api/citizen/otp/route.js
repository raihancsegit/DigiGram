import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import crypto from 'node:crypto';

const ALLOWED_PURPOSES = new Set([
    'citizen_inbox',
    'lost_found_report',
    'lost_found_claim',
    'citizen_payment'
]);

function normalizePhone(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

function createCode() {
    return String(crypto.randomInt(100000, 1000000));
}

export async function POST(request) {
    try {
        const { phone, purpose = 'citizen_inbox' } = await request.json();
        const normalizedPhone = normalizePhone(phone);
        if (!/^01[0-9]{9}$/.test(normalizedPhone)) {
            return NextResponse.json({ error: 'Valid Bangladeshi mobile number is required' }, { status: 400 });
        }
        if (!ALLOWED_PURPOSES.has(purpose)) {
            return NextResponse.json({ error: 'Unsupported OTP purpose' }, { status: 400 });
        }

        const recentCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { count, error: countError } = await supabaseAdmin
            .from('citizen_otps')
            .select('id', { count: 'exact', head: true })
            .eq('phone', normalizedPhone)
            .eq('purpose', purpose)
            .gte('created_at', recentCutoff);
        if (countError) throw countError;
        if (Number(count || 0) >= 3) {
            return NextResponse.json({ error: 'Too many OTP requests. Please try again later.' }, { status: 429 });
        }

        await supabaseAdmin
            .from('citizen_otps')
            .update({ used_at: new Date().toISOString() })
            .eq('phone', normalizedPhone)
            .eq('purpose', purpose)
            .is('used_at', null);

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

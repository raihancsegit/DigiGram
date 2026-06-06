import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export function normalizeCitizenPhone(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

export async function verifyCitizenOtp(phone, otpCode) {
    const normalizedPhone = normalizeCitizenPhone(phone);
    if (!/^01[0-9]{9}$/.test(normalizedPhone) || !otpCode) return false;

    const { data, error } = await supabaseAdmin
        .from('citizen_otps')
        .select('id')
        .eq('phone', normalizedPhone)
        .eq('otp_code', String(otpCode).trim())
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return Boolean(data);
}

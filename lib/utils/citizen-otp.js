import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import crypto from 'node:crypto';

export function normalizeCitizenPhone(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

function getSessionSecret() {
    const secret = process.env.CITIZEN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) throw new Error('Citizen session secret is not configured');
    return secret;
}

function sign(value) {
    return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

export function createCitizenAccessToken(phone) {
    const payload = Buffer.from(JSON.stringify({
        phone: normalizeCitizenPhone(phone),
        expiresAt: Date.now() + 30 * 60 * 1000
    })).toString('base64url');
    return `${payload}.${sign(payload)}`;
}

export function verifyCitizenAccessToken(phone, token) {
    try {
        const [payload, signature] = String(token || '').split('.');
        if (!payload || !signature) return false;
        const expected = sign(payload);
        const actualBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expected);
        if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
            return false;
        }
        const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        return session.phone === normalizeCitizenPhone(phone) && Number(session.expiresAt) > Date.now();
    } catch {
        return false;
    }
}

export async function verifyCitizenOtp(phone, otpCode, purpose = null) {
    const normalizedPhone = normalizeCitizenPhone(phone);
    if (!/^01[0-9]{9}$/.test(normalizedPhone) || !otpCode) return false;

    let query = supabaseAdmin
        .from('citizen_otps')
        .select('id')
        .eq('phone', normalizedPhone)
        .eq('otp_code', String(otpCode).trim())
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);
    if (purpose) query = query.eq('purpose', purpose);

    const { data: matches, error } = await query;
    if (error) throw error;
    const match = matches?.[0];
    if (!match) return false;

    const { data: consumed, error: consumeError } = await supabaseAdmin
        .from('citizen_otps')
        .update({ used_at: new Date().toISOString() })
        .eq('id', match.id)
        .is('used_at', null)
        .select('id')
        .maybeSingle();
    if (consumeError) throw consumeError;
    return Boolean(consumed);
}

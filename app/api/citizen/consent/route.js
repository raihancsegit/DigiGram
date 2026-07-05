import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { verifyCitizenAccessToken, verifyCitizenOtp } from '@/lib/utils/citizen-otp';

const VALID_TYPES = new Set(['data_processing', 'document_access', 'sms_service', 'sms_marketing']);

function normalizePhone(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

export async function POST(request) {
    try {
        const body = await request.json();
        const phone = normalizePhone(body.phone);
        const authenticated = verifyCitizenAccessToken(phone, body.accessToken)
            || await verifyCitizenOtp(phone, String(body.otpCode || '').trim(), 'citizen_inbox');
        if (!authenticated) {
            return NextResponse.json({ error: 'Citizen verification required' }, { status: 401 });
        }
        if (!VALID_TYPES.has(body.consentType)) {
            return NextResponse.json({ error: 'Invalid consent type' }, { status: 400 });
        }

        const granted = Boolean(body.granted);
        const now = new Date().toISOString();
        const { data: household } = await supabaseAdmin
            .from('households')
            .select('id')
            .eq('phone', phone)
            .limit(1)
            .maybeSingle();
        const { data, error } = await supabaseAdmin
            .from('citizen_consents')
            .upsert({
                phone,
                household_id: household?.id || null,
                consent_type: body.consentType,
                granted,
                source: 'citizen_portal',
                granted_at: granted ? now : null,
                revoked_at: granted ? null : now,
                updated_at: now
            }, { onConflict: 'phone,consent_type' })
            .select()
            .single();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error) {
        if (['42P01', 'PGRST205'].includes(error?.code)) {
            return NextResponse.json({ error: 'Consent system setup is pending.' }, { status: 409 });
        }
        console.error('Citizen consent update failed:', error);
        return NextResponse.json({ error: error.message || 'Consent update failed' }, { status: 500 });
    }
}

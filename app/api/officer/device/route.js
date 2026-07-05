import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireRequestProfile } from '@/lib/utils/server-auth';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

const OFFICER_ROLES = [
    'super_admin', 'chairman', 'ward_member', 'volunteer',
    'institution_admin', 'school_admin', 'market_manager',
    'mosque_admin', 'clinic_admin'
];

function tokenHash(profileId, deviceId) {
    return createHash('sha256').update(`${profileId}:${deviceId}`).digest('hex');
}

export async function POST(request) {
    const { profile, response } = await requireRequestProfile(request, OFFICER_ROLES);
    if (response) return response;

    try {
        const body = await request.json();
        const deviceId = String(body.deviceId || '').trim().slice(0, 160);
        if (deviceId.length < 12) {
            return NextResponse.json({ error: 'Invalid device identifier' }, { status: 400 });
        }
        const hash = tokenHash(profile.id, deviceId);
        const { data: existing, error: readError } = await supabaseAdmin
            .from('officer_devices')
            .select('id,revoked_at')
            .eq('device_token_hash', hash)
            .maybeSingle();
        if (readError) throw readError;
        if (existing?.revoked_at) {
            return NextResponse.json({ error: 'This device has been revoked by an administrator.' }, { status: 403 });
        }

        const payload = {
            profile_id: profile.id,
            device_token_hash: hash,
            device_name: String(body.deviceName || 'Officer device').slice(0, 100),
            platform: String(body.platform || 'web').slice(0, 40),
            user_agent: String(request.headers.get('user-agent') || '').slice(0, 500),
            last_seen_at: new Date().toISOString(),
            metadata: { language: body.language || null, screen: body.screen || null }
        };
        const { data, error } = await supabaseAdmin
            .from('officer_devices')
            .upsert(payload, { onConflict: 'device_token_hash' })
            .select('id,last_seen_at,revoked_at')
            .single();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error) {
        if (['42P01', 'PGRST205'].includes(error?.code)) {
            return NextResponse.json({ setupRequired: true }, { status: 409 });
        }
        console.error('Officer device registration failed:', error);
        return NextResponse.json({ error: error.message || 'Device registration failed' }, { status: 500 });
    }
}

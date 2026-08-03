import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { canAccessLocation, requireRequestProfile } from '@/lib/utils/server-auth';

export async function GET(request) {
    const auth = await requireRequestProfile(request, ['super_admin', 'chairman']);
    if (auth.response) return auth.response;
    const unionId = new URL(request.url).searchParams.get('unionId');
    if (!unionId || !(await canAccessLocation(auth.profile, unionId))) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    const { data, error } = await supabaseAdmin.from('union_service_settings').select('*').eq('union_id', unionId).order('title');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ services: data || [] });
}

export async function PUT(request) {
    const auth = await requireRequestProfile(request, ['super_admin', 'chairman']);
    if (auth.response) return auth.response;
    const { unionId, services } = await request.json();
    if (!unionId || !Array.isArray(services) || !(await canAccessLocation(auth.profile, unionId))) return NextResponse.json({ error: 'Invalid request or access denied' }, { status: 403 });
    const rows = services.slice(0, 50).map((item) => ({
        union_id: unionId, request_type: String(item.request_type || '').slice(0, 80),
        title: String(item.title || '').slice(0, 160), description: String(item.description || '').slice(0, 500) || null,
        fee_amount: Math.max(0, Number(item.fee_amount) || 0), payment_required: Boolean(item.payment_required),
        online_payment_enabled: Boolean(item.online_payment_enabled), sms_enabled: Boolean(item.sms_enabled),
        estimated_days: Math.min(365, Math.max(0, Number(item.estimated_days) || 0)),
        instructions: String(item.instructions || '').slice(0, 1000) || null, is_active: Boolean(item.is_active), updated_at: new Date().toISOString()
    })).filter((item) => item.request_type && item.title);
    const { data, error } = await supabaseAdmin.from('union_service_settings').upsert(rows, { onConflict: 'union_id,request_type' }).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ services: data });
}

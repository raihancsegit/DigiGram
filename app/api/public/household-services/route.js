import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export async function GET(request) {
    const householdId = new URL(request.url).searchParams.get('householdId');
    if (!householdId) return NextResponse.json({ error: 'householdId is required' }, { status: 400 });

    const { data: household, error } = await supabaseAdmin
        .from('households').select('ward_id,location_village_id,ward:locations!households_ward_id_fkey(parent_id)')
        .eq('id', householdId).maybeSingle();
    if (error || !household) return NextResponse.json({ error: 'Household not found' }, { status: 404 });

    const unionId = household.ward?.parent_id;
    const { data: services } = unionId ? await supabaseAdmin.from('union_service_settings')
        .select('id,request_type,title,description,fee_amount,payment_required,online_payment_enabled,sms_enabled,estimated_days,instructions,required_documents')
        .eq('union_id', unionId).eq('is_active', true).order('title') : { data: [] };

    return NextResponse.json({ unionId, wardId: household.ward_id, villageId: household.location_village_id, services: services || [] });
}


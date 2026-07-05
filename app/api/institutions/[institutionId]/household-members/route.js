import { NextResponse } from 'next/server';
import { canManageInstitution, requireRequestProfile } from '@/lib/utils/server-auth';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export const dynamic = 'force-dynamic';

function clean(value = '') {
    return String(value || '').trim();
}

function like(value = '') {
    return `%${clean(value).replace(/[%_]/g, '')}%`;
}

function unique(values = []) {
    return [...new Set(values.filter(Boolean))];
}

function isUuid(value = '') {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function ageFromDob(dob) {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
    return age;
}

function mapResident(resident) {
    return {
        id: resident.id,
        household_id: resident.household_id,
        name: resident.bn_name || resident.name || '',
        legal_name: resident.name || resident.bn_name || '',
        dob: resident.dob || null,
        age: ageFromDob(resident.dob),
        gender: resident.gender || null,
        phone: resident.phone || '',
        father_name: resident.father_name || '',
        mother_name: resident.mother_name || '',
        birth_reg_no: resident.birth_reg_no || '',
        nid: resident.nid || '',
        student_status: resident.student_status || 'not_student',
        current_class_name: resident.current_class_name || '',
        current_roll_no: resident.current_roll_no || ''
    };
}

export async function GET(request, { params }) {
    try {
        const { institutionId } = await params;
        const auth = await requireRequestProfile(request);
        if (auth.response) return auth.response;

        const allowed = await canManageInstitution(auth.profile, institutionId);
        if (!allowed) {
            return NextResponse.json({ error: 'You do not have permission for this institution' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const q = clean(searchParams.get('q'));
        if (q.length < 2) {
            return NextResponse.json({ success: true, data: { query: q, households: [] } });
        }

        const pattern = like(q);
        const householdFilter = isUuid(q)
            ? `id.eq.${q},owner_name.ilike.${pattern},house_no.ilike.${pattern},phone.ilike.${pattern}`
            : `owner_name.ilike.${pattern},house_no.ilike.${pattern},phone.ilike.${pattern}`;
        const residentFilter = isUuid(q)
            ? `id.eq.${q},name.ilike.${pattern},bn_name.ilike.${pattern},phone.ilike.${pattern},nid.ilike.${pattern},birth_reg_no.ilike.${pattern}`
            : `name.ilike.${pattern},bn_name.ilike.${pattern},phone.ilike.${pattern},nid.ilike.${pattern},birth_reg_no.ilike.${pattern}`;

        const [householdMatches, residentMatches] = await Promise.all([
            supabaseAdmin
                .from('households')
                .select('id')
                .or(householdFilter)
                .order('created_at', { ascending: false })
                .limit(8),
            supabaseAdmin
                .from('residents')
                .select('id,household_id')
                .or(residentFilter)
                .limit(12)
        ]);

        if (householdMatches.error) throw householdMatches.error;
        if (residentMatches.error) throw residentMatches.error;

        const householdIds = unique([
            ...(householdMatches.data || []).map((item) => item.id),
            ...(residentMatches.data || []).map((item) => item.household_id)
        ]).slice(0, 10);

        if (householdIds.length === 0) {
            return NextResponse.json({ success: true, data: { query: q, households: [] } });
        }

        const [householdRows, residentRows] = await Promise.all([
            supabaseAdmin
                .from('households')
                .select('id,house_no,owner_name,phone,ward:locations(name_bn,name_en),village:villages(bn_name,name)')
                .in('id', householdIds),
            supabaseAdmin
                .from('residents')
                .select('id,household_id,name,bn_name,dob,gender,phone,father_name,mother_name,birth_reg_no,nid,student_status,current_class_name,current_roll_no')
                .in('household_id', householdIds)
                .order('dob', { ascending: true, nullsFirst: false })
        ]);

        if (householdRows.error) throw householdRows.error;
        if (residentRows.error) throw residentRows.error;

        const residentsByHousehold = (residentRows.data || []).reduce((acc, resident) => {
            acc[resident.household_id] ??= [];
            acc[resident.household_id].push(mapResident(resident));
            return acc;
        }, {});
        const order = new Map(householdIds.map((id, index) => [id, index]));

        const households = (householdRows.data || [])
            .sort((left, right) => (order.get(left.id) ?? 99) - (order.get(right.id) ?? 99))
            .map((household) => ({
                id: household.id,
                house_no: household.house_no || '',
                owner_name: household.owner_name || '',
                guardian_phone: household.phone || '',
                ward_name: household.ward?.name_bn || household.ward?.name_en || '',
                village_name: household.village?.bn_name || household.village?.name || '',
                residents: residentsByHousehold[household.id] || []
            }));

        return NextResponse.json({ success: true, data: { query: q, households } });
    } catch (error) {
        console.error('Institution household member search failed:', error);
        return NextResponse.json({ error: error.message || 'Household member search failed' }, { status: 500 });
    }
}

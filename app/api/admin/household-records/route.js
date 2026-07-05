import { NextResponse } from 'next/server';
import { requireRequestProfile } from '@/lib/utils/server-auth';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export const dynamic = 'force-dynamic';

const HOUSEHOLD_COLUMNS = new Set([
    'village_id',
    'ward_id',
    'location_village_id',
    'added_by_user_id',
    'added_by_volunteer_id',
    'house_no',
    'owner_name',
    'phone',
    'lat',
    'lng',
    'electricity_meter',
    'meter_no',
    'latrine_status',
    'water_source',
    'housing_type',
    'economic_status',
    'religion',
    'qr_code_id'
]);

function pickHouseholdColumns(data = {}) {
    return Object.fromEntries(
        Object.entries(data).filter(([key]) => HOUSEHOLD_COLUMNS.has(key))
    );
}

async function syncHouseholdStats(householdId) {
    const { data: residents, error } = await supabaseAdmin
        .from('residents')
        .select('dob,is_voter,gender,blood_group,birth_reg_no')
        .eq('household_id', householdId);
    if (error) throw error;

    const stats = (residents || []).reduce((acc, resident) => {
        const gender = String(resident.gender || '').trim().toLowerCase();
        const isMale = ['male', 'man', 'm', 'পুরুষ', 'ছেলে'].includes(gender);
        const isFemale = ['female', 'woman', 'f', 'নারী', 'মহিলা', 'মেয়ে', 'মেয়ে'].includes(gender);
        const birthDate = resident.dob ? new Date(resident.dob) : null;
        let age = -1;
        if (birthDate && !Number.isNaN(birthDate.getTime())) {
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
        }
        if (resident.blood_group) {
            acc.blood_groups[resident.blood_group] = (acc.blood_groups[resident.blood_group] || 0) + 1;
        }
        return {
            ...acc,
            total_members: acc.total_members + 1,
            voters: acc.voters + (resident.is_voter ? 1 : 0),
            male_voters: acc.male_voters + (resident.is_voter && isMale ? 1 : 0),
            female_voters: acc.female_voters + (resident.is_voter && isFemale ? 1 : 0),
            males: acc.males + (isMale ? 1 : 0),
            females: acc.females + (isFemale ? 1 : 0),
            blood_donors: acc.blood_donors + (resident.blood_group ? 1 : 0),
            birth_registered: acc.birth_registered + (resident.birth_reg_no ? 1 : 0),
            voter_eligible: acc.voter_eligible + (age >= 18 && !resident.is_voter ? 1 : 0)
        };
    }, {
        total_members: 0,
        voters: 0,
        male_voters: 0,
        female_voters: 0,
        males: 0,
        females: 0,
        blood_donors: 0,
        birth_registered: 0,
        voter_eligible: 0,
        blood_groups: {}
    });

    const { data: household, error: updateError } = await supabaseAdmin
        .from('households')
        .update({ stats, updated_at: new Date().toISOString() })
        .eq('id', householdId)
        .select('id,village_id,ward_id')
        .single();
    if (updateError) throw updateError;
    return { stats, household };
}

export async function POST(request) {
    const auth = await requireRequestProfile(request, ['super_admin']);
    if (auth.response) return auth.response;

    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'update_household') {
            const { id, data } = body;
            const { data: household, error } = await supabaseAdmin
                .from('households')
                .update({ ...pickHouseholdColumns(data), updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return NextResponse.json({ success: true, data: household });
        }

        if (action === 'delete_household') {
            const { error } = await supabaseAdmin.from('households').delete().eq('id', body.id);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'create_resident') {
            const { data: resident, error } = await supabaseAdmin
                .from('residents')
                .insert([body.data])
                .select()
                .single();
            if (error) throw error;
            if (resident.household_id) await syncHouseholdStats(resident.household_id);
            return NextResponse.json({ success: true, data: resident });
        }

        if (action === 'update_resident') {
            const { data: resident, error } = await supabaseAdmin
                .from('residents')
                .update(body.data)
                .eq('id', body.id)
                .select()
                .single();
            if (error) throw error;
            if (resident.household_id) await syncHouseholdStats(resident.household_id);
            return NextResponse.json({ success: true, data: resident });
        }

        if (action === 'delete_resident') {
            const { error } = await supabaseAdmin.from('residents').delete().eq('id', body.id);
            if (error) throw error;
            if (body.householdId) await syncHouseholdStats(body.householdId);
            return NextResponse.json({ success: true });
        }

        if (action === 'sync_household_stats') {
            const result = await syncHouseholdStats(body.householdId);
            return NextResponse.json({ success: true, data: result });
        }

        return NextResponse.json({ error: 'Unknown household action' }, { status: 400 });
    } catch (error) {
        console.error('Admin household record action failed:', error);
        return NextResponse.json({ error: error.message || 'Household action failed' }, { status: 500 });
    }
}

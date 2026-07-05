import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

function text(value, maxLength = 240) {
    return String(value || '').trim().slice(0, maxLength);
}

function normalizePhone(value) {
    return text(value, 40).replace(/[^\d+]/g, '');
}

function normalizeName(value = '') {
    return String(value || '').trim().toLowerCase();
}

function namesMatch(left, right) {
    return normalizeName(left) === normalizeName(right);
}

function isSetupError(error) {
    return ['42703', '42P01', 'PGRST204', 'PGRST205'].includes(error?.code);
}

async function findLegacyVillage(locationVillage, wardId) {
    if (!locationVillage?.id || !wardId) return null;

    const names = [locationVillage.name_bn, locationVillage.name_en].filter(Boolean);
    if (!names.length) return null;

    const { data, error } = await supabaseAdmin
        .from('villages')
        .select('id,ward_id,name,bn_name')
        .eq('ward_id', wardId);
    if (error) throw error;

    const existing = (data || []).find((village) => (
        names.some((name) => namesMatch(name, village.bn_name) || namesMatch(name, village.name))
    ));
    if (existing) return existing;

    const { data: created, error: createError } = await supabaseAdmin
        .from('villages')
        .insert([{
            ward_id: wardId,
            name: locationVillage.name_en || locationVillage.name_bn || 'School village',
            bn_name: locationVillage.name_bn || locationVillage.name_en || null,
            survey_status: 'pending'
        }])
        .select('id,ward_id,name,bn_name')
        .single();
    if (createError) throw createError;
    return created;
}

async function resolveInstitutionScope(institution) {
    const scopeId = institution.village_location_id || institution.location_id;
    if (!scopeId) return { locationVillage: null, wardId: null, legacyVillage: null };

    const { data: location, error } = await supabaseAdmin
        .from('locations')
        .select('id,type,parent_id,name_bn,name_en')
        .eq('id', scopeId)
        .maybeSingle();
    if (error) throw error;

    const locationVillage = location?.type === 'village' ? location : null;
    const wardId = location?.type === 'village' ? location.parent_id : location?.type === 'ward' ? location.id : null;
    const legacyVillage = locationVillage ? await findLegacyVillage(locationVillage, wardId) : null;

    return { locationVillage, wardId, legacyVillage };
}

async function syncHouseholdStats(householdId) {
    if (!householdId) return null;

    const { data: residents, error } = await supabaseAdmin
        .from('residents')
        .select('dob,is_voter,gender,blood_group,birth_reg_no')
        .eq('household_id', householdId);
    if (error) throw error;

    const stats = (residents || []).reduce((acc, resident) => {
        const gender = normalizeName(resident.gender);
        const isMale = ['male', 'man', 'm', 'পুরুষ', 'ছেলে'].includes(gender);
        const isFemale = ['female', 'woman', 'f', 'নারী', 'মহিলা', 'মেয়ে', 'মেয়েয়ে'].includes(gender);
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

    const { error: updateError } = await supabaseAdmin
        .from('households')
        .update({ stats, updated_at: new Date().toISOString() })
        .eq('id', householdId);
    if (updateError && !isSetupError(updateError)) throw updateError;
    return stats;
}

async function findOrCreateAdmissionHousehold(payload, institution) {
    if (payload.household_id && payload.resident_id) {
        return { householdId: payload.household_id, residentId: payload.resident_id, source: 'household_profile' };
    }

    const scope = await resolveInstitutionScope(institution);
    if (!scope.wardId) return { householdId: payload.household_id || null, residentId: payload.resident_id || null, source: 'public_form' };

    let household = null;
    if (payload.guardian_phone) {
        let query = supabaseAdmin
            .from('households')
            .select('id,owner_name,phone,ward_id,village_id,location_village_id')
            .eq('ward_id', scope.wardId)
            .eq('phone', payload.guardian_phone)
            .limit(5);
        if (scope.locationVillage?.id) query = query.eq('location_village_id', scope.locationVillage.id);
        const { data, error } = await query;
        if (error && !isSetupError(error)) throw error;
        household = (data || []).find((item) => namesMatch(item.owner_name, payload.guardian_name)) || data?.[0] || null;
    }

    if (!household) {
        const householdPayload = {
            ward_id: scope.wardId,
            village_id: scope.legacyVillage?.id || null,
            location_village_id: scope.locationVillage?.id || null,
            owner_name: payload.guardian_name,
            phone: payload.guardian_phone,
            stats: { total_members: 0, voters: 0, males: 0, females: 0 }
        };
        const { data, error } = await supabaseAdmin
            .from('households')
            .insert([householdPayload])
            .select('id,owner_name,phone,ward_id,village_id,location_village_id')
            .single();
        if (error) throw error;
        household = data;
    }

    let resident = null;
    const residentName = payload.student_name;
    let residentQuery = supabaseAdmin
        .from('residents')
        .select('id,household_id,name,bn_name,dob')
        .eq('household_id', household.id);
    if (payload.date_of_birth) residentQuery = residentQuery.eq('dob', payload.date_of_birth);
    const { data: residentRows, error: residentLookupError } = await residentQuery;
    if (residentLookupError && !isSetupError(residentLookupError)) throw residentLookupError;
    resident = (residentRows || []).find((item) => (
        namesMatch(item.name, residentName) || namesMatch(item.bn_name, residentName)
    )) || null;

    const residentPayload = {
        household_id: household.id,
        name: payload.student_name_en || residentName,
        bn_name: payload.student_name_en ? residentName : null,
        dob: payload.date_of_birth || null,
        gender: payload.gender || null,
        student_status: 'applied',
        current_institution_id: institution.id,
        current_school_name: institution.name,
        current_class_name: payload.desired_class,
        school_enrollment_updated_at: new Date().toISOString()
    };

    if (resident) {
        const { data, error } = await supabaseAdmin
            .from('residents')
            .update(residentPayload)
            .eq('id', resident.id)
            .select('id,household_id')
            .single();
        if (error) throw error;
        resident = data;
    } else {
        const { data, error } = await supabaseAdmin
            .from('residents')
            .insert([residentPayload])
            .select('id,household_id')
            .single();
        if (error) throw error;
        resident = data;
    }

    await syncHouseholdStats(household.id);
    return { householdId: household.id, residentId: resident.id, source: 'household_profile' };
}

export async function POST(request, { params }) {
    try {
        const { institutionId } = await params;
        const body = await request.json();
        const payload = {
            institution_id: institutionId,
            student_name: text(body.student_name, 180),
            student_name_en: text(body.student_name_en, 180) || null,
            date_of_birth: body.date_of_birth || null,
            gender: text(body.gender, 40) || null,
            desired_class: text(body.desired_class, 100),
            previous_institution: text(body.previous_institution, 180) || null,
            guardian_name: text(body.guardian_name, 180),
            guardian_phone: normalizePhone(body.guardian_phone),
            guardian_email: text(body.guardian_email, 180) || null,
            address: text(body.address, 500) || null,
            notes: text(body.notes, 1000) || null
        };
        const householdId = text(body.household_id, 80);
        const residentId = text(body.resident_id, 80);
        if (householdId) payload.household_id = householdId;
        if (residentId) payload.resident_id = residentId;
        if (householdId || residentId) payload.source = 'household_profile';

        if (!payload.institution_id || !payload.student_name || !payload.desired_class || !payload.guardian_name || !payload.guardian_phone) {
            return NextResponse.json({ error: 'Student name, class, guardian name and phone are required.' }, { status: 400 });
        }

        const { data: institution, error: institutionError } = await supabaseAdmin
            .from('institutions')
            .select('id,name,website_status,location_id,village_location_id')
            .eq('id', institutionId)
            .maybeSingle();
        if (institutionError) throw institutionError;
        if (!institution || institution.website_status === 'paused') {
            return NextResponse.json({ error: 'Admission is not available for this institution.' }, { status: 404 });
        }

        const recentCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { count: recentCount, error: rateError } = await supabaseAdmin
            .from('school_admission_applications')
            .select('id', { count: 'exact', head: true })
            .eq('institution_id', institutionId)
            .eq('guardian_phone', payload.guardian_phone)
            .gte('created_at', recentCutoff);
        if (rateError) throw rateError;
        if (Number(recentCount || 0) > 0) {
            return NextResponse.json({ error: 'An admission application was submitted recently.' }, { status: 429 });
        }

        const homeLink = await findOrCreateAdmissionHousehold(payload, institution);
        if (homeLink.householdId) payload.household_id = homeLink.householdId;
        if (homeLink.residentId) payload.resident_id = homeLink.residentId;
        payload.source = homeLink.source;

        const { data, error } = await supabaseAdmin
            .from('school_admission_applications')
            .insert([payload])
            .select('id,status,created_at')
            .single();
        if (error) throw error;

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        console.error('Admission application failed:', error);
        return NextResponse.json({ error: error.message || 'Admission application failed.' }, { status: 500 });
    }
}

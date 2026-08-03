import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { repairMojibakeText } from '@/lib/utils/textEncoding';
import { buildDemoHouseholdDonors, buildDemoHouseholdsForVillage, buildDemoVillageStats } from '@/lib/utils/demoHouseholds';
import { internalServerError } from '@/lib/utils/api-response';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeName(value) {
    return String(value || '').trim().toLowerCase();
}

function boundedInteger(value, fallback, minimum, maximum) {
    const parsed = Number.parseInt(String(value || ''), 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(parsed, minimum), maximum);
}

function isMaleGender(value) {
    return ['male', 'man', 'm', 'পুরুষ', 'ছেলে'].includes(normalizeName(value));
}

function isFemaleGender(value) {
    return ['female', 'woman', 'f', 'নারী', 'মহিলা', 'মেয়ে', 'মেয়েয়ে'].includes(normalizeName(value));
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

function buildResidentStats(residents = []) {
    return residents.reduce((acc, resident) => {
        const isMale = isMaleGender(resident.gender);
        const isFemale = isFemaleGender(resident.gender);
        const age = ageFromDob(resident.dob);

        return {
            total_members: acc.total_members + 1,
            voters: acc.voters + (resident.is_voter ? 1 : 0),
            male_voters: acc.male_voters + (resident.is_voter && isMale ? 1 : 0),
            female_voters: acc.female_voters + (resident.is_voter && isFemale ? 1 : 0),
            males: acc.males + (isMale ? 1 : 0),
            females: acc.females + (isFemale ? 1 : 0),
            blood_donors: acc.blood_donors + (resident.blood_group ? 1 : 0),
            birth_registered: acc.birth_registered + (resident.birth_reg_no ? 1 : 0),
            voter_eligible: acc.voter_eligible + (age !== null && age >= 18 && !resident.is_voter ? 1 : 0)
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
        voter_eligible: 0
    });
}

function buildBloodGroups(residents = []) {
    return residents.reduce((acc, resident) => {
        if (!resident.blood_group) return acc;
        acc[resident.blood_group] = (acc[resident.blood_group] || 0) + 1;
        return acc;
    }, {});
}

function mergeRows(rows) {
    return [...new Map((rows || []).map((row) => [row.id, row])).values()];
}

function cleanText(value) {
    return repairMojibakeText(value);
}

function cleanObjectText(value) {
    if (typeof value === 'string') return cleanText(value);
    if (Array.isArray(value)) return value.map(cleanObjectText);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, entry]) => [key, cleanObjectText(entry)])
        );
    }
    return value;
}

async function findHouseholdVillageIds(locationVillage, wardId) {
    if (!locationVillage?.id || !wardId) return [];

    const names = [
        locationVillage.name_bn,
        locationVillage.name_en
    ].filter(Boolean);

    if (names.length === 0) return [];

    const { data, error } = await supabaseAdmin
        .from('villages')
        .select('id,bn_name,name')
        .eq('ward_id', wardId);

    if (error) throw error;

    return (data || [])
        .filter((village) => names.some((name) => name === village.bn_name || name === village.name))
        .map((village) => village.id);
}

async function loadHouseholds({
    locationVillageId,
    householdVillageIds,
    fallbackVillageId,
    page,
    limit
}) {
    const select = 'id,house_no,owner_name,stats,ward_id,village_id,location_village_id,housing_type,electricity_meter,latrine_status,water_source,created_at';
    const queries = [];
    const from = (page - 1) * limit;
    const to = from + limit;

    if (locationVillageId) {
        queries.push(
            supabaseAdmin
                .from('households')
                .select(select)
                .eq('location_village_id', locationVillageId)
                .order('created_at', { ascending: false })
                .range(from, to)
        );
    }

    if (householdVillageIds.length > 0) {
        queries.push(
            supabaseAdmin
                .from('households')
                .select(select)
                .in('village_id', householdVillageIds)
                .order('created_at', { ascending: false })
                .range(from, to)
        );
    }

    if (queries.length === 0 && fallbackVillageId) {
        queries.push(
            supabaseAdmin
                .from('households')
                .select(select)
                .eq('village_id', fallbackVillageId)
                .order('created_at', { ascending: false })
                .range(from, to)
        );
    }

    const results = await Promise.all(queries);
    const errors = results.map((result) => result.error).filter(Boolean);
    if (errors.length > 0) throw errors[0];

    const merged = mergeRows(results.flatMap((result) => result.data || []))
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return {
        rows: merged.slice(0, limit),
        hasMore: merged.length > limit || results.some((result) => (result.data || []).length > limit)
    };
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const villageId = searchParams.get('villageId');
        const wardIdParam = searchParams.get('wardId');
        const page = boundedInteger(searchParams.get('page'), 1, 1, 1000);
        const limit = boundedInteger(searchParams.get('limit'), 100, 1, 200);

        if (!villageId && !wardIdParam) {
            return NextResponse.json({ error: 'Village or ward id is required' }, { status: 400 });
        }

        if (String(villageId || '').startsWith('demo-village')) {
            const allDemoHouseholds = buildDemoHouseholdsForVillage(villageId);
            const start = (page - 1) * limit;
            const households = allDemoHouseholds.slice(start, start + limit).map((household) => ({
                id: household.id,
                house_no: household.house_no,
                owner_name: household.owner_name,
                housing_type: household.housing_type,
                electricity_meter: Boolean(household.electricity_meter),
                latrine_status: household.latrine_status,
                water_source: household.water_source,
                stats: household.stats
            }));
            const stats = buildDemoVillageStats(villageId);

            return NextResponse.json({
                success: true,
                data: {
                    households,
                    donors: buildDemoHouseholdDonors(villageId),
                    blood_groups: stats.blood_groups,
                    total: households.length,
                    demo: true,
                    pagination: {
                        page,
                        limit,
                        returned: households.length,
                        hasMore: start + households.length < allDemoHouseholds.length
                    }
                }
            });
        }

        if ((villageId && !UUID_RE.test(villageId)) || (wardIdParam && !UUID_RE.test(wardIdParam))) {
            return NextResponse.json({ error: 'Valid village or ward id is required' }, { status: 400 });
        }

        let locationVillage = null;
        let wardId = wardIdParam || null;

        if (villageId) {
            const { data: location, error: locationError } = await supabaseAdmin
                .from('locations')
                .select('id,name_bn,name_en,parent_id,type')
                .eq('id', villageId)
                .maybeSingle();

            if (locationError) throw locationError;
            if (location?.type === 'village') {
                locationVillage = location;
                wardId = wardId || location.parent_id;
            }
        }

        const householdVillageIds = await findHouseholdVillageIds(locationVillage, wardId);
        const householdResult = await loadHouseholds({
            locationVillageId: locationVillage?.id || null,
            householdVillageIds,
            fallbackVillageId: locationVillage ? null : villageId,
            page,
            limit
        });
        const households = householdResult.rows;

        const householdIds = households.map((household) => household.id).filter(Boolean);
        const { data: residents, error: residentError } = householdIds.length > 0
            ? await supabaseAdmin
                .from('residents')
                .select('id,household_id,name,bn_name,dob,is_voter,gender,blood_group,birth_reg_no')
                .in('household_id', householdIds)
                .limit(Math.min(limit * 20, 4000))
            : { data: [], error: null };

        if (residentError) throw residentError;

        const residentsByHousehold = (residents || []).reduce((acc, resident) => {
            acc[resident.household_id] = acc[resident.household_id] || [];
            acc[resident.household_id].push(resident);
            return acc;
        }, {});

        const safeHouseholds = households.map((household) => {
            const liveStats = buildResidentStats(residentsByHousehold[household.id] || []);
            return {
                id: household.id,
                house_no: cleanText(household.house_no),
                owner_name: cleanText(household.owner_name),
                housing_type: cleanText(household.housing_type),
                electricity_meter: Boolean(household.electricity_meter),
                latrine_status: cleanText(household.latrine_status),
                water_source: cleanText(household.water_source),
                stats: {
                    ...cleanObjectText(household.stats || {}),
                    ...liveStats
                }
            };
        });
        const householdById = new Map(households.map((household) => [household.id, household]));
        const donors = (residents || [])
            .filter((resident) => resident.blood_group)
            .map((resident) => {
                const household = householdById.get(resident.household_id) || {};
                return {
                    id: resident.id,
                    name: resident.bn_name || resident.name || household.owner_name || 'নাম নেই',
                    group: resident.blood_group,
                    house_no: household.house_no || null,
                    owner_name: household.owner_name || null
                };
            });

        const cleanDonors = donors.map((donor) => ({
            ...donor,
            name: cleanText(donor.name),
            house_no: cleanText(donor.house_no),
            owner_name: cleanText(donor.owner_name)
        }));

        return NextResponse.json({
            success: true,
            data: {
                households: safeHouseholds,
                donors: cleanDonors,
                blood_groups: buildBloodGroups(residents || []),
                total: safeHouseholds.length,
                pagination: {
                    page,
                    limit,
                    returned: safeHouseholds.length,
                    hasMore: householdResult.hasMore
                }
            }
        });
    } catch (error) {
        console.error('Public households load failed:', error);
        return internalServerError('Household list could not be loaded. Please try again.');
    }
}

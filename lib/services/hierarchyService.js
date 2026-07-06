import { supabase, supabasePublic } from '../utils/supabase';
import { wardService } from './wardService';
import { repairMojibakeText } from '@/lib/utils/textEncoding';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTEXT_TIMEOUT_MS = 8000;

async function withContextTimeout(promise, fallback, label, timeoutMs = CONTEXT_TIMEOUT_MS) {
    let timeoutId;
    try {
        return await Promise.race([
            promise,
            new Promise((resolve) => {
                timeoutId = setTimeout(() => {
                    console.error(`Timed out loading ${label}`);
                    resolve(fallback);
                }, timeoutMs);
            })
        ]);
    } catch (error) {
        console.error(`Error loading ${label}:`, error);
        return fallback;
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}

function isUUID(value) {
    return UUID_PATTERN.test(value || '');
}

function demoBanglaName(location = {}) {
    const slug = String(location.slug || '').toLowerCase();
    if (!slug.startsWith('demo-')) return null;

    if (location.type === 'district') return 'ডেমো জেলা';
    if (location.type === 'upazila') return 'ডেমো উপজেলা';
    if (location.type === 'union') return 'ডেমো ইউনিয়ন';
    if (location.type === 'ward') {
        const match = slug.match(/ward-(\d+)/);
        return `ডেমো ওয়ার্ড ${match?.[1] || '১'}`;
    }
    if (location.type === 'village') {
        if (slug.includes('village-b')) return 'ডেমো গ্রাম খ';
        return 'ডেমো গ্রাম ক';
    }
    return null;
}

function normalizeLocationText(location) {
    if (!location) return location;
    const nameBn = demoBanglaName(location) || repairMojibakeText(location.name_bn);
    const normalized = {
        ...location,
        name_bn: nameBn,
        name_en: repairMojibakeText(location.name_en),
        name: demoBanglaName(location) || repairMojibakeText(location.name)
    };

    if (normalized.parent) {
        normalized.parent = normalizeLocationText(normalized.parent);
    }

    return normalized;
}

function normalizeLocationList(rows = []) {
    return (rows || []).map(normalizeLocationText);
}

function emptyHouseholdStats() {
    return {
        population: 0,
        total_members: 0,
        voters: 0,
        maleVoters: 0,
        femaleVoters: 0,
        male_voters: 0,
        female_voters: 0,
        males: 0,
        females: 0,
        blood_donors: 0,
        birth_registered: 0,
        voter_eligible: 0,
        total_houses: 0,
        blood_groups: {}
    };
}

function addHouseholdStats(target, household) {
    const source = household?.stats || {};
    target.population += Number(source.total_members || source.population || 0);
    target.total_members += Number(source.total_members || source.population || 0);
    target.voters += Number(source.voters || 0);
    target.maleVoters += Number(source.male_voters || source.maleVoters || 0);
    target.femaleVoters += Number(source.female_voters || source.femaleVoters || 0);
    target.male_voters = target.maleVoters;
    target.female_voters = target.femaleVoters;
    target.males += Number(source.males || 0);
    target.females += Number(source.females || 0);
    target.blood_donors += Number(source.blood_donors || source.bloodDonors || 0);
    target.birth_registered += Number(source.birth_registered || source.birthRegistered || 0);
    target.voter_eligible += Number(source.voter_eligible || source.voterEligible || 0);
    target.total_houses += 1;

    Object.entries(source.blood_groups || source.bloodGroups || {}).forEach(([group, count]) => {
        target.blood_groups[group] = (target.blood_groups[group] || 0) + Number(count || 0);
    });
}

function getAge(dob) {
    if (!dob) return -1;
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return -1;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
}

function isMaleGender(value) {
    const gender = String(value || '').trim().toLowerCase();
    return ['male', 'man', 'm', 'পুরুষ', 'ছেলে'].includes(gender);
}

function isFemaleGender(value) {
    const gender = String(value || '').trim().toLowerCase();
    return ['female', 'woman', 'f', 'নারী', 'মহিলা', 'মেয়ে', 'মেয়ে'].includes(gender);
}

function addResidentStats(target, residents = []) {
    target.total_houses += 1;
    residents.forEach((resident) => {
        const isMale = isMaleGender(resident.gender);
        const isFemale = isFemaleGender(resident.gender);
        const isVoter = Boolean(resident.is_voter);

        target.population += 1;
        target.total_members += 1;
        target.voters += isVoter ? 1 : 0;
        target.maleVoters += isVoter && isMale ? 1 : 0;
        target.femaleVoters += isVoter && isFemale ? 1 : 0;
        target.male_voters = target.maleVoters;
        target.female_voters = target.femaleVoters;
        target.males += isMale ? 1 : 0;
        target.females += isFemale ? 1 : 0;
        target.blood_donors += resident.blood_group ? 1 : 0;
        target.birth_registered += resident.birth_reg_no ? 1 : 0;
        target.voter_eligible += getAge(resident.dob) >= 18 && !isVoter ? 1 : 0;

        if (resident.blood_group) {
            target.blood_groups[resident.blood_group] = (target.blood_groups[resident.blood_group] || 0) + 1;
        }
    });
}

function preferPositive(liveValue, fallbackValue) {
    const liveNumber = Number(liveValue || 0);
    if (liveNumber > 0) return liveValue;
    return fallbackValue ?? liveValue;
}

function mergeLiveStats(existingStats = {}, liveStats = {}) {
    const merged = { ...existingStats };
    const numericKeys = [
        'population',
        'total_members',
        'voters',
        'maleVoters',
        'femaleVoters',
        'male_voters',
        'female_voters',
        'males',
        'females',
        'blood_donors',
        'birth_registered',
        'voter_eligible',
        'total_houses'
    ];

    numericKeys.forEach((key) => {
        merged[key] = preferPositive(liveStats[key], existingStats[key]);
    });

    if (Object.keys(liveStats.blood_groups || {}).length > 0) {
        merged.blood_groups = liveStats.blood_groups;
    }

    return merged;
}

function namesMatch(left, right) {
    return String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase();
}

function findLocationVillageForHousehold(household, householdVillages, locationVillages) {
    if (household.location_village_id) {
        return locationVillages.find((village) => village.id === household.location_village_id);
    }

    const householdVillage = householdVillages.find((village) => village.id === household.village_id);
    if (!householdVillage) return null;

    return locationVillages.find((locationVillage) => (
        locationVillage.parent_id === household.ward_id &&
        (
            namesMatch(locationVillage.name_bn, householdVillage.bn_name) ||
            namesMatch(locationVillage.name_bn, householdVillage.name) ||
            namesMatch(locationVillage.name_en, householdVillage.name) ||
            namesMatch(locationVillage.name_en, householdVillage.bn_name)
        )
    ));
}

async function getLiveHouseholdStatsForWards(wardIds, locationVillages = []) {
    const validWardIds = (wardIds || []).filter((id) => isUUID(id));
    if (validWardIds.length === 0) return {};

    const [{ data: households, error: householdError }, { data: householdVillages, error: villageError }] = await Promise.all([
        supabasePublic
            .from('households')
            .select('id, ward_id, village_id, location_village_id, stats')
            .in('ward_id', validWardIds),
        supabasePublic
            .from('villages')
            .select('id, ward_id, name, bn_name')
            .in('ward_id', validWardIds)
    ]);

    if (householdError) {
        console.error('Error fetching live household stats:', householdError);
        return {};
    }
    if (villageError) console.error('Error fetching household village mapping:', villageError);

    const householdIds = (households || []).map((household) => household.id).filter(Boolean);
    let residentsByHousehold = {};
    if (householdIds.length > 0) {
        const { data: residents, error: residentError } = await supabasePublic
            .from('residents')
            .select('household_id, dob, is_voter, gender, blood_group, birth_reg_no')
            .in('household_id', householdIds);

        if (residentError) {
            console.error('Error fetching live resident stats:', residentError);
        } else {
            residentsByHousehold = (residents || []).reduce((acc, resident) => {
                acc[resident.household_id] ??= [];
                acc[resident.household_id].push(resident);
                return acc;
            }, {});
        }
    }

    const byLocationVillage = {};
    (households || []).forEach((household) => {
        const locationVillage = findLocationVillageForHousehold(household, householdVillages || [], locationVillages);
        const key = locationVillage?.id || household.location_village_id;
        if (!key) return;
        byLocationVillage[key] ??= emptyHouseholdStats();
        const residents = residentsByHousehold[household.id] || [];
        if (residents.length > 0) {
            addResidentStats(byLocationVillage[key], residents);
        } else {
            addHouseholdStats(byLocationVillage[key], household);
        }
    });

    return byLocationVillage;
}

export function mergeLocationLiveStats(existingStats = {}, liveStats = {}) {
    return mergeLiveStats(existingStats, liveStats);
}

export async function getLiveStatsForVillageLocation(villageId) {
    if (!isUUID(villageId)) return null;

    const { data: village } = await supabasePublic
        .from('locations')
        .select('id, parent_id')
        .eq('id', villageId)
        .eq('type', 'village')
        .maybeSingle();

    if (!village?.parent_id) return null;

    const liveStats = await getLiveHouseholdStatsForWards([village.parent_id], [village]);
    return liveStats[village.id] || null;
}

// 0. Get all districts (Root level)
export async function getDistricts() {
    const { data, error } = await supabasePublic
        .from('locations')
        .select('*')
        .eq('type', 'district')
        .order('name_bn', { ascending: true });

    if (error) {
        console.error("Error fetching districts:", error);
        return [];
    }
    const districts = normalizeLocationList(data);
    const demoDistricts = districts.filter((district) => String(district.slug || '').startsWith('demo-'));
    return demoDistricts.length > 0 ? demoDistricts : districts;
}

// 0.5 Get child locations filtering by type (General)
export async function getChildLocationsByType(parentId, type) {
    const { data, error } = await supabasePublic
        .from('locations')
        .select('*')
        .eq('parent_id', parentId)
        .eq('type', type)
        .order('name_bn', { ascending: true });

    if (error) {
        console.error(`Error fetching ${type} for ${parentId}:`, error);
        return [];
    }
    return normalizeLocationList(data);
}

// 0.6 Search locations by name (Union, Ward, Village)
export async function searchLocations(query) {
    if (!query || query.length < 2) return [];

    const { data, error } = await supabase
        .from('locations')
        .select(`
            id, slug, name_bn, name_en, type, parent_id,
            parent:parent_id (
                id, slug, name_bn, name_en, type,
                parent:parent_id (
                    id, slug, name_bn, name_en, type
                )
            )
        `)
        .or(`name_bn.ilike.%${query}%,name_en.ilike.%${query}%`)
        .in('type', ['union', 'ward', 'village'])
        .order('type', { ascending: true })
        .limit(10);

    if (error) {
        console.error("Search error:", error);
        return [];
    }
    return normalizeLocationList(data);
}

/**
 * Service to manage geographic hierarchy (Village -> Ward -> Union -> Upazila -> District)
 * and their associated institutions.
 */

// 1. Get entire hierarchy path for a specific location
export async function getLocationPath(locationId) {
    if (!isUUID(locationId)) return null;

    const { data, error } = await supabase
        .from('locations')
        .select(`
            id, slug, name_en, name_bn, type, parent_id, stats
        `)
        .eq('id', locationId)
        .single();

    if (error) {
        console.error("Error fetching location path:", error);
        return null;
    }
    return normalizeLocationText(data);
}

// Fetch by string Slug instead of UUID
export async function getLocationBySlug(slug) {
    const { data, error } = await supabase
        .from('locations')
        .select(`
            id, slug, name_en, name_bn, type, parent_id, stats
        `)
        .eq('slug', slug)
        .single();

    if (error) {
        console.error("Error fetching location by slug:", slug, error);
        return null;
    }
    return normalizeLocationText(data);
}

// Get the full context (Union + Upazila + District) by Union Slug
export async function getFullContextBySlug(unionSlug) {
    // 1. Get Union
    const union = await getLocationBySlug(unionSlug);
    if (!union) return null;

    // 2. Get Upazila
    let upazila = { id: 'unknown', name: repairMojibakeText('অজানা উপজেলা') };
    if (union.parent_id) {
        const { data: upData } = await supabase
            .from('locations')
            .select('id, name_bn, parent_id')
            .eq('id', union.parent_id)
            .single();
        if (upData) {
            const safeUpazila = normalizeLocationText(upData);
            upazila = { id: safeUpazila.id, name: safeUpazila.name_bn, parent_id: safeUpazila.parent_id };
        }
    }

    // 3. Get District
    let district = { id: 'unknown', name: 'অজানা জেলা' };
    if (upazila.parent_id) {
        const { data: distData } = await supabase
            .from('locations')
            .select('id, name_bn')
            .eq('id', upazila.parent_id)
            .single();
        if (distData) {
            const safeDistrict = normalizeLocationText(distData);
            district = { id: safeDistrict.id, name: safeDistrict.name_bn };
        }
    }

    return {
        union: {
            id: union.id,
            slug: union.slug,
            name: union.name_bn ? union.name_bn.replace(/\s*ইউনিয়ন\s*/g, '').replace(/\s*ইউনিয়ন\s*/g, '').trim() : ''
        },
        upazila,
        district
    };
}

// 2. Fetch children of a location (e.g., Get all Wards of a Union)
export async function getChildLocations(parentId) {
    if (!isUUID(parentId)) return [];

    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('parent_id', parentId)
        .order('name_en', { ascending: true });

    if (error) {
        console.error("Error fetching children for:", parentId, error);
        return [];
    }
    return data;
}

// 2.5 Fetch Wards with their Member Details
export async function getWardsWithDetailsByUnion(unionId) {
    if (!unionId) return [];
    if (!isUUID(unionId)) return [];

    const { data: wards, error: wardsError } = await supabase
        .from('locations')
        .select('*')
        .eq('parent_id', unionId)
        .eq('type', 'ward')
        .order('name_bn', { ascending: true });

    if (wardsError || !wards) return [];

    const wardIds = wards.map(w => w.id).filter(id => isUUID(id));

    if (wardIds.length === 0) return wards;

    try {
        // 1. Fetch ALL ward members and filter in JS to avoid 22P02 errors
        const { data: profiles, error: pError } = await supabase
            .from('public_officer_profiles')
            .select('id, first_name, last_name, phone, avatar_url, access_scope_id')
            .eq('role', 'ward_member');

        if (pError) console.error("Profile fetch error:", pError);

        // Filter only those belonging to our wards
        const relevantProfiles = (profiles || []).filter(p => wardIds.includes(p.access_scope_id));

        // 2. Fetch ALL villages for these wards
        const { data: allVillages, error: vError } = await supabase
            .from('locations')
            .select('*')
            .in('parent_id', wardIds)
            .eq('type', 'village');

        if (vError) console.error("Village fetch error:", vError);

        const liveStatsByVillage = await getLiveHouseholdStatsForWards(wardIds, allVillages || []);

        return wards.map(ward => {
            const member = relevantProfiles?.find(p => p.access_scope_id === ward.id);
            const wardVillages = allVillages?.filter(v => v.parent_id === ward.id) || [];

            // Map villages to the format expected by the frontend
            const mappedVillages = wardVillages.map(v => {
                let statsObj = { ...v.stats }; // fallback to manual stats

                if (v.survey_status === 'verified' && v.real_stats) {
                    const rs = v.real_stats;
                    statsObj.population = rs.total_members || rs.population || v.population || 0;
                    statsObj.voters = rs.voters || v.voters || 0;
                    statsObj.maleVoters = rs.male_voters || rs.maleVoters || rs.males || 0;
                    statsObj.femaleVoters = rs.female_voters || rs.femaleVoters || rs.females || 0;
                    statsObj.blood_donors = rs.blood_donors || rs.bloodDonors || 0;
                    statsObj.blood_groups = rs.blood_groups || rs.bloodGroups || {};
                    statsObj.total_houses = rs.total_houses || rs.totalHouses || 0;
                    statsObj.birth_registered = rs.birth_registered || rs.birthRegistered || 0;
                    statsObj.voter_eligible = rs.voter_eligible || rs.voterEligible || 0;
                } else {
                    const s = v.stats || {};
                    statsObj.population = s.population || s.total_members || 0;
                    statsObj.voters = s.voters || 0;
                    statsObj.maleVoters = s.maleVoters || s.male_voters || s.males || 0;
                    statsObj.femaleVoters = s.femaleVoters || s.female_voters || s.females || 0;
                    statsObj.blood_donors = s.blood_donors || s.bloodDonors || 0;
                    statsObj.blood_groups = s.blood_groups || s.bloodGroups || {};
                    statsObj.total_houses = s.total_houses || s.totalHouses || v.total_estimated_houses || 0;
                    statsObj.birth_registered = s.birth_registered || s.birthRegistered || 0;
                    statsObj.voter_eligible = s.voter_eligible || s.voterEligible || 0;
                }

                const liveStats = liveStatsByVillage[v.id];
                if (liveStats?.total_houses > 0) {
                    statsObj = mergeLiveStats(statsObj, liveStats);
                }

                return {
                    id: v.id,
                    name: v.name_bn,
                    name_en: v.name_en,
                    ...statsObj
                };
            });

            return {
                ...ward,
                name: ward.name_bn || ward.name_en,
                member: member ? {
                    name: `${member.first_name} ${member.last_name}`,
                    phone: member.phone,
                    avatar: member.avatar_url
                } : null,
                villages: mappedVillages
            };
        });
    } catch (err) {
        console.error("Critical error in ward details fetch:", err);
        return wards;
    }
}

// 3. Fetch Institutions within a specific Location
export async function getInstitutionsByLocation(locationId, type) {
    if (!isUUID(locationId)) return [];

    let query = supabase
        .from('institutions')
        .select('*')
        .eq('location_id', locationId)
        .order('name', { ascending: true });

    if (type) query = query.eq('type', type);

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching institutions:", error);
        return [];
    }
    return data;
}

// 3.5 Fetch Institution by Custom Domain or Subdomain
export async function getInstitutionByDomain(domainString) {
    const cleanDomain = domainString
        .split(':')[0]
        .trim()
        .toLowerCase();

    const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .or(`subdomain.eq.${cleanDomain},custom_domain.eq.${cleanDomain}`)
        .maybeSingle();

    if (error) {
        console.warn("Institution lookup failed for domain:", cleanDomain, error);
        return null;
    }

    return data;
}

// 4. Fetch the Active Services/Plugins for a specific Location
export async function getActiveServices(locationId) {
    const { data, error } = await supabase
        .from('location_services')
        .select(`
            is_active,
            config,
            services (
                name, slug, features
            )
        `)
        .eq('location_id', locationId)
        .eq('is_active', true);

    if (error) {
        console.error("Error fetching active services:", error);
        return [];
    }
    return data;
}
// 5. Fetch the Chairman for a specific Location
export async function getChairmanByLocation(locationId) {
    const { data, error } = await supabase
        .from('public_officer_profiles')
        .select(`
            id, first_name, last_name, avatar_url, phone, role
        `)
        .eq('access_scope_id', locationId)
        .eq('role', 'chairman')
        .maybeSingle();

    if (error) {
        console.error("Error fetching chairman:", error);
        return null;
    }
    return data;
}

// 6. Fetch Village with Full Context from Village ID or Slug
export async function getVillageFullContext(villageIdOrSlug) {
    // Try by ID first if it's a UUID, otherwise try by slug
    let query = supabase.from('locations').select('*');
    if (isUUID(villageIdOrSlug)) {
        query = query.eq('id', villageIdOrSlug);
    } else {
        query = query.eq('slug', villageIdOrSlug);
    }

    // 1. Get the village
    const { data: village, error: vError } = await withContextTimeout(
        query.single(),
        { data: null, error: new Error('Village lookup timed out') },
        'village'
    );

    if (vError || !village) return null;

    // 2. Get the ward
    if (!isUUID(village.parent_id)) return { village };

    const { data: ward, error: wError } = await withContextTimeout(
        supabase
            .from('locations')
            .select('*')
            .eq('id', village.parent_id)
            .single(),
        { data: null, error: new Error('Ward lookup timed out') },
        'village ward'
    );

    if (wError || !ward) return { village };

    // 3. Get the union
    if (!isUUID(ward.parent_id)) return { village, ward };

    const { data: union } = await withContextTimeout(
        supabase
            .from('locations')
            .select('id, slug, name_bn, parent_id')
            .eq('id', ward.parent_id)
            .single(),
        { data: null },
        'village union'
    );

    if (!union) return { village, ward };

    // 4. Get the rest of the context. Each piece has a fallback so the village
    // portal does not hang when one optional dataset is slow or unavailable.
    const fallbackContext = {
        union: {
            id: union.id,
            slug: union.slug,
            name: union.name_bn || '',
            wards: []
        },
        upazila: { id: 'unknown', name: '' },
        district: { id: 'unknown', name: '' }
    };

    const [fullContext, allWards, volunteers] = await Promise.all([
        withContextTimeout(getFullContextBySlug(union.slug), fallbackContext, 'full union context'),
        withContextTimeout(getWardsWithDetailsByUnion(union.id), [], 'union wards'),
        withContextTimeout(wardService.getVolunteersByVillage(village.id), [], 'village volunteers')
    ]);

    const matchedWard = allWards.find(w => w.id === ward.id);
    const safeContext = fullContext || fallbackContext;
    const safeUnion = safeContext.union || fallbackContext.union;
    const liveStats = await getLiveStatsForVillageLocation(village.id);
    const mergedVillage = liveStats?.total_houses > 0
        ? {
            ...village,
            real_stats: mergeLiveStats(village.real_stats || village.stats || {}, liveStats),
            survey_status: 'verified'
        }
        : village;

    return {
        village: mergedVillage,
        ward: matchedWard || {
            ...ward,
            name: ward.name_bn
        },
        ctx: {
            ...safeContext,
            union: {
                ...safeUnion,
                id: safeUnion.id || union.id,
                slug: safeUnion.slug || union.slug,
                name: safeUnion.name || union.name_bn || '',
                wards: allWards
            },
            volunteers
        }
    };
}

// 7. Fetch Ward with Full Context from just Ward ID
export async function getWardFullContext(wardIdOrSlug) {
    // Try by ID first if it's a UUID, otherwise try by slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(wardIdOrSlug);

    let query = supabase.from('locations').select('*');
    if (isUUID) {
        query = query.eq('id', wardIdOrSlug);
    } else {
        query = query.eq('slug', wardIdOrSlug);
    }

    const { data: ward, error: wError } = await query.single();

    if (wError || !ward) return null;

    const isParentUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ward.parent_id);
    if (!isParentUUID) return { ward };

    const { data: union } = await supabase
        .from('locations')
        .select('id, slug, name_bn, parent_id')
        .eq('id', ward.parent_id)
        .single();

    if (!union) return { ward };

    const fullContext = await getFullContextBySlug(union.slug);
    const allWards = await getWardsWithDetailsByUnion(union.id);
    const matchedWard = allWards.find(w => w.id === ward.id);

    return {
        ward: matchedWard || {
            ...ward,
            name: ward.name_bn
        },
        ctx: {
            ...fullContext,
            union: {
                ...fullContext.union,
                wards: allWards
            }
        }
    };
}

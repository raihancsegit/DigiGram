import { supabase, supabasePublic } from '../utils/supabase';
import { wardService } from './wardService';

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
    return data;
}

// 0.5 Get child locations filtering by type (General)
export async function getChildLocationsByType(parentId, type) {
    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('parent_id', parentId)
        .eq('type', type)
        .order('name_bn', { ascending: true });

    if (error) {
        console.error(`Error fetching ${type} for ${parentId}:`, error);
        return [];
    }
    return data;
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
    return data;
}

/**
 * Service to manage geographic hierarchy (Village -> Ward -> Union -> Upazila -> District)
 * and their associated institutions.
 */

// 1. Get entire hierarchy path for a specific location
export async function getLocationPath(locationId) {
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
    return data;
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
    return data;
}

// Get the full context (Union + Upazila + District) by Union Slug
export async function getFullContextBySlug(unionSlug) {
    // 1. Get Union
    const union = await getLocationBySlug(unionSlug);
    if (!union) return null;

    // 2. Get Upazila
    let upazila = { id: 'unknown', name: 'অজানা উপজেলা' };
    if (union.parent_id) {
        const { data: upData } = await supabase
            .from('locations')
            .select('id, name_bn, parent_id')
            .eq('id', union.parent_id)
            .single();
        if (upData) {
            upazila = { id: upData.id, name: upData.name_bn, parent_id: upData.parent_id };
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
            district = { id: distData.id, name: distData.name_bn };
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
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(unionId);
    if (!isUUID) return [];

    const { data: wards, error: wardsError } = await supabase
        .from('locations')
        .select('*')
        .eq('parent_id', unionId)
        .eq('type', 'ward')
        .order('name_bn', { ascending: true });

    if (wardsError || !wards) return [];

    const wardIds = wards.map(w => w.id).filter(id => 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    );

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
export async function getInstitutionsByLocation(locationId) {
    const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .eq('location_id', locationId)
        .order('name', { ascending: true });

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
        console.log("Institution lookup failed for domain:", cleanDomain, error);
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
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(villageIdOrSlug);
    
    let query = supabase.from('locations').select('*');
    if (isUUID) {
        query = query.eq('id', villageIdOrSlug);
    } else {
        query = query.eq('slug', villageIdOrSlug);
    }

    // 1. Get the village
    const { data: village, error: vError } = await query.single();
    
    if (vError || !village) return null;

    // 2. Get the ward
    const isWardUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(village.parent_id);
    if (!isWardUUID) return { village };

    const { data: ward, error: wError } = await supabase
        .from('locations')
        .select('*')
        .eq('id', village.parent_id)
        .single();

    if (wError || !ward) return { village };

    // 3. Get the union
    const isUnionUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ward.parent_id);
    if (!isUnionUUID) return { village, ward };

    const { data: union } = await supabase
        .from('locations')
        .select('id, slug, name_bn')
        .eq('id', ward.parent_id)
        .single();

    if (!union) return { village, ward };

    // 4. Get the rest of the context
    const fullContext = await getFullContextBySlug(union.slug);
    const allWards = await getWardsWithDetailsByUnion(union.id);
    const matchedWard = allWards.find(w => w.id === ward.id);

    return {
        village,
        ward: matchedWard || {
            ...ward,
            name: ward.name_bn
        },
        ctx: {
            ...fullContext,
            union: {
                ...fullContext.union,
                wards: allWards
            },
            volunteers: await wardService.getVolunteersByVillage(village.id)
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

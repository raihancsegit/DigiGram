import { supabase } from '@/lib/utils/supabase';
import { authenticatedFetch } from '@/lib/utils/authenticated-fetch';

function matchesLocationVillage(village, locationVillage) {
    const names = [
        locationVillage?.name_bn,
        locationVillage?.name_en,
        locationVillage?.name
    ].filter(Boolean);

    return names.includes(village?.bn_name) || names.includes(village?.name);
}

function isFemaleResident(resident = {}) {
    const gender = String(resident.gender || '').toLowerCase();
    return ['female', 'woman', 'নারী', 'মহিলা', 'মেয়ে'].includes(gender);
}

function isWidowResident(resident = {}) {
    const marital = String(resident.marital_status || '').toLowerCase();
    return marital.includes('widow') || marital.includes('বিধবা');
}

function normalizeCitizenText(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '');
}

function pushDuplicateCandidate(map, key, reason, resident) {
    if (!key || key.length < 6) return;
    const current = map.get(key) || { key, reason, items: [] };
    current.items.push({
        id: resident.id,
        name: resident.name,
        nid: resident.nid,
        birthRegNo: resident.birth_reg_no,
        phone: resident.household?.phone,
        wardName: resident.household?.ward?.name_bn,
        houseNo: resident.household?.house_no,
        householdId: resident.household?.id,
        ownerName: resident.household?.owner_name
    });
    map.set(key, current);
}

const SUGGESTED_REQUEST_TYPES = {
    nid_application: {
        title: 'NID আবেদন follow-up',
        details: 'Citizen quality dashboard থেকে NID আবেদন follow-up তৈরি করা হয়েছে।'
    },
    birth_registration: {
        title: 'জন্ম নিবন্ধন আবেদন follow-up',
        details: 'Citizen quality dashboard থেকে জন্ম নিবন্ধন আবেদন follow-up তৈরি করা হয়েছে।'
    },
    widow_allowance: {
        title: 'বিধবা ভাতা যাচাই',
        details: 'Women Support Desk থেকে বিধবা ভাতা যাচাই case তৈরি করা হয়েছে। প্রয়োজনীয় কাগজপত্র ও যোগ্যতা যাচাই করুন।'
    },
    maternity_support: {
        title: 'মাতৃত্বকালীন সহায়তা follow-up',
        details: 'Women Support Desk থেকে মাতৃত্বকালীন স্বাস্থ্য/সহায়তা follow-up case তৈরি করা হয়েছে।'
    },
    women_health_checkup: {
        title: 'নারী স্বাস্থ্য checkup follow-up',
        details: 'Women Support Desk থেকে স্বাস্থ্য checkup ও blood group update follow-up তৈরি করা হয়েছে।'
    }
};

export const householdService = {
    // --- Village Management ---
    async getVillagesByWard(wardId) {
        const { data, error } = await supabase
            .from('villages')
            .select('*')
            .eq('ward_id', wardId)
            .order('name', { ascending: true });

        if (error) throw error;

        const { data: locationVillages, error: locationError } = await supabase
            .from('locations')
            .select('id, name_bn, name_en')
            .eq('parent_id', wardId)
            .eq('type', 'village');

        if (locationError) throw locationError;

        return (data || []).map((village) => {
            const locationVillage = (locationVillages || []).find((locVillage) => matchesLocationVillage(village, locVillage));
            return {
                ...village,
                location_id: locationVillage?.id || village.location_id || null,
                location_village_id: locationVillage?.id || village.location_village_id || null
            };
        });
    },

    async getLocationVillagesByWard(wardId) {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .eq('parent_id', wardId)
            .eq('type', 'village')
            .order('name_bn', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async syncLocationVillagesToHouseholdVillages(wardId) {
        if (!wardId) return [];

        const response = await authenticatedFetch('/api/admin/sync-household-villages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wardId })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to sync villages');
        return result.data?.villages || [];
    },

    async getOrCreateVillageForLocation(wardId, locationVillage) {
        if (!wardId || !locationVillage?.id) return null;

        const response = await authenticatedFetch('/api/admin/sync-household-villages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wardId, locationVillage })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to sync village');
        return result.data?.village || null;
    },

    async mutateVillage(villageData) {
        const { id, ...rest } = villageData;
        if (id) {
            const { data, error } = await supabase
                .from('villages')
                .update(rest)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        }

        const { data, error } = await supabase
            .from('villages')
            .insert([rest])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // --- Volunteer Management ---
    async getVolunteersByWard(wardId) {
        const villages = await this.syncLocationVillagesToHouseholdVillages(wardId);
        const locationVillages = await this.getLocationVillagesByWard(wardId);
        const locationVillageIds = locationVillages.map((v) => v.id);

        if (locationVillageIds.length === 0) return [];

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'volunteer')
            .in('access_scope_id', locationVillageIds)
            .order('first_name', { ascending: true });

        if (error) throw error;

        return (data || []).map((profile) => {
            const locationVillage = locationVillages.find((v) => v.id === profile.access_scope_id);
            const householdVillage = villages.find((v) => (
                v.bn_name === locationVillage?.name_bn ||
                v.name === locationVillage?.name_en ||
                v.name === locationVillage?.name_bn
            ));

            return {
                ...profile,
                name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || profile.phone,
                assigned_village_id: householdVillage?.id || profile.access_scope_id,
                assigned_village: {
                    id: householdVillage?.id || profile.access_scope_id,
                    name: householdVillage?.bn_name || locationVillage?.name_bn || locationVillage?.name_en
                }
            };
        });
    },

    async mutateVolunteer(volunteerData) {
        const { id, ...rest } = volunteerData;
        if (id) {
            const { data, error } = await supabase
                .from('volunteers')
                .update(rest)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        }

        const { data, error } = await supabase
            .from('volunteers')
            .insert([rest])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // --- Household Management ---
    async getHouseholdsByVillage(villageId) {
        const { data, error } = await supabase
            .from('households')
            .select('*, residents(*)')
            .eq('village_id', villageId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        const households = data || [];
        const householdIds = households.map((household) => household.id).filter(Boolean);

        if (householdIds.length === 0) return households;

        const [requestsResult, taxesResult] = await Promise.allSettled([
            supabase
                .from('service_requests')
                .select('id,household_id,request_type,title,status,priority,applicant_name,collection_date,created_at,updated_at')
                .in('household_id', householdIds)
                .order('created_at', { ascending: false }),
            supabase
                .from('household_taxes')
                .select('id,household_id,year,fiscal_year_label,amount_due,amount_paid,due_date,paid_date,receipt_no,status,created_at,updated_at')
                .in('household_id', householdIds)
                .order('created_at', { ascending: false })
        ]);

        const requests = requestsResult.status === 'fulfilled' && !requestsResult.value.error
            ? requestsResult.value.data || []
            : [];
        const taxes = taxesResult.status === 'fulfilled' && !taxesResult.value.error
            ? taxesResult.value.data || []
            : [];

        return households.map((household) => ({
            ...household,
            service_requests: requests.filter((request) => request.household_id === household.id),
            household_taxes: taxes.filter((tax) => tax.household_id === household.id)
        }));
    },

    async deleteHousehold(householdId) {
        // Because of ON DELETE CASCADE, deleting a household will also delete its residents
        const { error } = await supabase
            .from('households')
            .delete()
            .eq('id', householdId);

        if (error) throw error;
        return true;
    },

    async getHouseholdStats(wardId) {
        const { data, error } = await supabase
            .from('households')
            .select('stats')
            .eq('ward_id', wardId);

        if (error) throw error;

        return (data || []).reduce((acc, h) => {
            const s = h.stats || {};
            return {
                total_members: acc.total_members + (s.total_members || 0),
                voters: acc.voters + (s.voters || 0),
                males: acc.males + (s.males || 0),
                females: acc.females + (s.females || 0),
                total_houses: acc.total_houses + 1
            };
        }, { total_members: 0, voters: 0, males: 0, females: 0, total_houses: 0 });
    },

    // --- Household & Resident Actions ---
    async createHousehold(householdData) {
        const { data, error } = await supabase
            .from('households')
            .insert([householdData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async createResident(residentData) {
        const { data, error } = await supabase
            .from('residents')
            .insert([residentData])
            .select()
            .single();

        if (error) throw error;
        await this.syncHouseholdStats(residentData.household_id);
        return data;
    },

    async updateHousehold(id, householdData) {
        const { data, error } = await supabase
            .from('households')
            .update({ ...householdData, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        
        // Auto-sync
        if (data.village_id) await this.syncVillageData(data.village_id);
        
        return data;
    },

    async updateResident(id, residentData) {
        // Remove any id or metadata from residentData to be safe
        const { id: _, created_at: __, updated_at: ___, ...cleanData } = residentData;
        
        console.log(`Attempting DB Update for Resident ID: ${id}`, cleanData);
        
        const { data, error } = await supabase
            .from('residents')
            .update(cleanData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error("Critical Update Failure:", error);
            throw error;
        }
        
        console.log("DB Update Success:", data.name, "->", data.blood_group);
        await this.syncHouseholdStats(cleanData.household_id || data.household_id);
        return data;
    },

    async deleteResident(id, householdId) {
        const { error } = await supabase
            .from('residents')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await this.syncHouseholdStats(householdId);
        return true;
    },

    async verifyLockerPin(idOrCode, pin) {
        const { data, error } = await supabase.rpc('verify_household_locker_pin', {
            lookup_value: idOrCode,
            candidate_pin: pin
        });

        if (error) {
            console.error('Locker PIN verification failed:', error);
            return false;
        }

        return !!data;
    },

    async syncHouseholdStats(householdId) {
        // Select only specific columns to avoid errors if name_en/address don't exist yet
        const { data: residents, error } = await supabase
            .from('residents')
            .select('dob, is_voter, gender, blood_group, birth_reg_no')
            .eq('household_id', householdId);

        if (error) throw error;

        const stats = (residents || []).reduce((acc, r) => {
            const birthDate = r.dob ? new Date(r.dob) : null;
            const today = new Date();
            let age = -1;
            if (birthDate) {
                age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            }

            if (r.blood_group) {
                acc.blood_groups[r.blood_group] = (acc.blood_groups[r.blood_group] || 0) + 1;
            }

            return {
                ...acc,
                total_members: acc.total_members + 1,
                voters: acc.voters + (r.is_voter ? 1 : 0),
                male_voters: acc.male_voters + (r.is_voter && r.gender === 'Male' ? 1 : 0),
                female_voters: acc.female_voters + (r.is_voter && r.gender === 'Female' ? 1 : 0),
                males: acc.males + (r.gender === 'Male' ? 1 : 0),
                females: acc.females + (r.gender === 'Female' ? 1 : 0),
                blood_donors: acc.blood_donors + (r.blood_group ? 1 : 0),
                birth_registered: acc.birth_registered + (r.birth_reg_no ? 1 : 0),
                voter_eligible: acc.voter_eligible + (age >= 18 && !r.is_voter ? 1 : 0)
            };
        }, { total_members: 0, voters: 0, male_voters: 0, female_voters: 0, males: 0, females: 0, blood_donors: 0, birth_registered: 0, voter_eligible: 0, blood_groups: {} });

        const { error: updateError } = await supabase
            .from('households')
            .update({ stats })
            .eq('id', householdId);

        if (updateError) throw updateError;

        // Auto-sync hierarchy if applicable
        try {
            const { data: hData } = await supabase
                .from('households')
                .select('village_id, ward_id')
                .eq('id', householdId)
                .single();
                
            if (hData?.village_id) {
                await this.syncVillageData(hData.village_id);
                if (hData.ward_id) {
                    await this.syncWardData(hData.ward_id);
                    const { data: wData } = await supabase
                        .from('locations')
                        .select('parent_id')
                        .eq('id', hData.ward_id)
                        .single();
                        
                    if (wData?.parent_id) {
                        await this.syncUnionData(wData.parent_id);
                    }
                }
            }
        } catch (syncErr) {
            console.error("Auto-sync failed during household update:", syncErr);
            // Non-blocking error, so we don't throw it
        }

        return stats;
    },

    // --- Public Profile ---
    async getPublicHouseholdProfile(idOrCode) {
        const { data, error } = await supabase.rpc('get_public_household_profile', {
            lookup_value: idOrCode
        });

        if (error) throw error;
        if (!data) throw new Error('Household not found');
        return data;
    },

    async getFullHouseholdProfile(idOrCode, pin) {
        // Verify PIN first
        const isValid = await this.verifyLockerPin(idOrCode, pin);
        if (!isValid) throw new Error('Invalid Locker PIN');

        const { data, error } = await supabase.rpc('get_full_household_profile', {
            lookup_value: idOrCode,
            candidate_pin: pin
        });

        if (error) throw error;
        if (!data) throw new Error('Household not found');
        return data;
    },

    // --- Service Requests ---
    async notifyServiceRequest(requestId, eventKey) {
        if (!requestId || !eventKey) return { skipped: true };

        try {
            const response = await fetch('/api/service-requests/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, eventKey })
            });

            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                console.warn('Service request notification skipped:', result.error || response.statusText);
                return { skipped: true, error: result.error || response.statusText };
            }

            return response.json();
        } catch (error) {
            console.warn('Service request notification skipped:', error);
            return { skipped: true, error: error.message };
        }
    },

    async createServiceRequest(requestData) {
        const { data, error } = await supabase
            .from('service_requests')
            .insert([{
                status: 'pending',
                created_at: new Date().toISOString(),
                ...requestData
            }])
            .select()
            .single();

        if (error) throw error;

        await this.notifyServiceRequest(data.id, 'submitted');

        return data;
    },

    async createSuggestedServiceRequestForResident(residentId, requestType, unionId) {
        if (!residentId || !requestType || !unionId) {
            throw new Error('Resident, request type, and union are required');
        }

        const suggestion = SUGGESTED_REQUEST_TYPES[requestType];
        if (!suggestion) {
            throw new Error('This suggestion does not support automatic case creation');
        }

        const { data: resident, error: residentError } = await supabase
            .from('residents')
            .select(`
                id,
                name,
                name_en,
                dob,
                gender,
                nid,
                birth_reg_no,
                father_name,
                mother_name,
                address,
                blood_group,
                marital_status,
                disability_status,
                occupation,
                household:households!inner(
                    id,
                    phone,
                    house_no,
                    owner_name,
                    ward:locations!inner(id, parent_id)
                )
            `)
            .eq('id', residentId)
            .eq('household.ward.parent_id', unionId)
            .maybeSingle();

        if (residentError) throw residentError;
        if (!resident?.household?.id) {
            throw new Error('Resident is outside this union scope');
        }

        const { data: existingRequest, error: existingError } = await supabase
            .from('service_requests')
            .select('*')
            .eq('resident_id', resident.id)
            .eq('request_type', requestType)
            .in('status', ['pending', 'processing', 'ready'])
            .maybeSingle();

        if (existingError) throw existingError;
        if (existingRequest) {
            return { request: existingRequest, alreadyExists: true };
        }

        const household = resident.household;
        const request = await this.createServiceRequest({
            household_id: household.id,
            resident_id: resident.id,
            request_type: requestType,
            title: suggestion.title,
            applicant_name: resident.name,
            applicant_nid: resident.nid || null,
            applicant_birth_reg: resident.birth_reg_no || null,
            applicant_dob: resident.dob || null,
            applicant_gender: resident.gender || null,
            applicant_address: resident.address || null,
            father_name: resident.father_name || null,
            mother_name: resident.mother_name || null,
            blood_group: resident.blood_group || null,
            contact_phone: household.phone || null,
            details: suggestion.details,
            priority: requestType === 'widow_allowance' ? 'high' : 'normal',
            status: 'pending',
            meta_data: {
                source: 'union_citizen_quality_dashboard',
                generated_from_suggestion: true,
                generated_at: new Date().toISOString(),
                household_no: household.house_no || null,
                household_owner: household.owner_name || null,
                name_en: resident.name_en || null,
                marital_status: resident.marital_status || null,
                disability_status: resident.disability_status || null,
                occupation: resident.occupation || null
            }
        });

        return { request, alreadyExists: false };
    },

    async getServiceRequestsByWard(wardId) {
        if (!wardId) return [];

        const { data, error } = await supabase
            .from('service_requests')
            .select(`
                *,
                resident:residents(*),
                household:households!inner(
                    owner_name,
                    house_no,
                    ward_id,
                    village:villages(bn_name)
                )
            `)
            .eq('household.ward_id', wardId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getServiceRequestsByUnion(unionId) {
        if (!unionId) return [];

        const { data, error } = await supabase
            .from('service_requests')
            .select(`
                *,
                resident:residents(*),
                household:households!inner(
                    owner_name,
                    house_no,
                    ward_id,
                    village:villages(bn_name),
                    ward:locations!inner(id, parent_id)
                )
            `)
            .eq('household.ward.parent_id', unionId)
            .in('status', ['pending', 'processing', 'ready', 'completed', 'rejected'])
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getServiceRequestSmsByUnion(unionId) {
        if (!unionId) return [];

        const { data, error } = await supabase
            .from('service_request_sms')
            .select(`
                *,
                request:service_requests!inner(
                    id,
                    request_type,
                    applicant_name,
                    household:households!inner(
                        house_no,
                        ward:locations!inner(parent_id)
                    )
                )
            `)
            .eq('request.household.ward.parent_id', unionId)
            .order('queued_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        return data || [];
    },

    async getCitizenQualityDashboardByUnion(unionId) {
        if (!unionId) {
            return {
                summary: { totalResidents: 0, missingNid: 0, missingBirthReg: 0, missingBloodGroup: 0, voterEligibleWithoutNid: 0, childrenWithoutBirthReg: 0, femaleResidents: 0, widowCandidates: 0, womenHealthCheckups: 0, citizenCompleteness: 100 },
                wardSummaries: [],
                candidates: [],
                womenSupport: [],
                lowCompleteness: [],
                duplicateGroups: []
            };
        }

        const { data, error } = await supabase
            .from('residents')
            .select(`
                id,
                name,
                name_en,
                dob,
                gender,
                nid,
                birth_reg_no,
                father_name,
                mother_name,
                address,
                blood_group,
                is_voter,
                marital_status,
                disability_status,
                occupation,
                household:households!inner(
                    id,
                    phone,
                    house_no,
                    owner_name,
                    ward:locations!inner(id, name_bn, parent_id)
                )
            `)
            .eq('household.ward.parent_id', unionId);

        if (error) throw error;

        const residents = data || [];
        const residentIds = residents.map((resident) => resident.id);
        let activeRequests = [];

        if (residentIds.length > 0) {
            const { data: requestData, error: requestError } = await supabase
                .from('service_requests')
                .select('id, resident_id, request_type, status')
                .in('resident_id', residentIds)
                .in('status', ['pending', 'processing', 'ready']);

            if (requestError) throw requestError;
            activeRequests = requestData || [];
        }

        const activeRequestMap = new Map(
            activeRequests.map((request) => [`${request.resident_id}:${request.request_type}`, request])
        );
        const today = new Date();
        const getAge = (dob) => {
            if (!dob) return null;
            const birthDate = new Date(dob);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDelta = today.getMonth() - birthDate.getMonth();
            if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) age--;
            return age;
        };

        const summary = residents.reduce((acc, resident) => {
            const age = getAge(resident.dob);
            acc.totalResidents += 1;
            if (!resident.nid) acc.missingNid += 1;
            if (!resident.birth_reg_no) acc.missingBirthReg += 1;
            if (!resident.blood_group) acc.missingBloodGroup += 1;
            if (age !== null && age >= 18 && !resident.nid) acc.voterEligibleWithoutNid += 1;
            if (age !== null && age < 18 && !resident.birth_reg_no) acc.childrenWithoutBirthReg += 1;
            if (isFemaleResident(resident)) acc.femaleResidents += 1;
            if (isWidowResident(resident)) acc.widowCandidates += 1;
            if (isFemaleResident(resident) && (age === null || age >= 13)) acc.womenHealthCheckups += 1;
            return acc;
        }, { totalResidents: 0, missingNid: 0, missingBirthReg: 0, missingBloodGroup: 0, voterEligibleWithoutNid: 0, childrenWithoutBirthReg: 0, femaleResidents: 0, widowCandidates: 0, womenHealthCheckups: 0, citizenCompleteness: 100 });
        const totalDataFields = Math.max(1, summary.totalResidents * 3);
        const missingFields = summary.missingNid + summary.missingBirthReg + summary.missingBloodGroup;
        summary.citizenCompleteness = Math.max(0, Math.round(((totalDataFields - missingFields) / totalDataFields) * 100));

        const wardMap = new Map();
        residents.forEach((resident) => {
            const ward = resident.household?.ward;
            if (!ward?.id) return;
            const age = getAge(resident.dob);
            const current = wardMap.get(ward.id) || {
                wardId: ward.id,
                wardName: ward.name_bn,
                totalResidents: 0,
                missingNid: 0,
                missingBirthReg: 0,
                missingBloodGroup: 0,
                voterEligibleWithoutNid: 0,
                childrenWithoutBirthReg: 0,
                femaleResidents: 0,
                widowCandidates: 0,
                womenHealthCheckups: 0
            };
            current.totalResidents += 1;
            if (!resident.nid) current.missingNid += 1;
            if (!resident.birth_reg_no) current.missingBirthReg += 1;
            if (!resident.blood_group) current.missingBloodGroup += 1;
            if (age !== null && age >= 18 && !resident.nid) current.voterEligibleWithoutNid += 1;
            if (age !== null && age < 18 && !resident.birth_reg_no) current.childrenWithoutBirthReg += 1;
            if (isFemaleResident(resident)) current.femaleResidents += 1;
            if (isWidowResident(resident)) current.widowCandidates += 1;
            if (isFemaleResident(resident) && (age === null || age >= 13)) current.womenHealthCheckups += 1;
            wardMap.set(ward.id, current);
        });

        const candidates = residents.flatMap((resident) => {
            const age = getAge(resident.dob);
            const base = {
                id: resident.id,
                name: resident.name,
                wardName: resident.household?.ward?.name_bn,
                houseNo: resident.household?.house_no,
                ownerName: resident.household?.owner_name
            };
            const next = [];
            if (age !== null && age >= 18 && !resident.nid) {
                next.push({
                    ...base,
                    type: 'nid_application',
                    label: 'NID আবেদন প্রয়োজন',
                    activeRequest: activeRequestMap.get(`${resident.id}:nid_application`) || null
                });
            }
            if (age !== null && age < 18 && !resident.birth_reg_no) {
                next.push({
                    ...base,
                    type: 'birth_registration',
                    label: 'জন্ম নিবন্ধন প্রয়োজন',
                    activeRequest: activeRequestMap.get(`${resident.id}:birth_registration`) || null
                });
            }
            if (!resident.blood_group) {
                next.push({
                    ...base,
                    type: 'blood_group_update',
                    label: 'রক্তের গ্রুপ আপডেট প্রয়োজন',
                    activeRequest: null
                });
            }
            return next;
        }).slice(0, 20);

        const womenSupport = residents.flatMap((resident) => {
            if (!isFemaleResident(resident)) return [];
            const age = getAge(resident.dob);
            const base = {
                id: resident.id,
                name: resident.name || resident.household?.owner_name,
                wardName: resident.household?.ward?.name_bn,
                houseNo: resident.household?.house_no,
                phone: resident.household?.phone,
                householdId: resident.household?.id
            };
            const next = [];
            if (isWidowResident(resident)) next.push({ ...base, type: 'widow_allowance', label: 'বিধবা ভাতা যাচাই', priority: 'high', activeRequest: activeRequestMap.get(`${resident.id}:widow_allowance`) || null });
            if (age !== null && age >= 13 && age <= 49) next.push({ ...base, type: 'maternity_support', label: 'মাতৃত্ব/নারী স্বাস্থ্য follow-up', priority: 'normal', activeRequest: activeRequestMap.get(`${resident.id}:maternity_support`) || null });
            if (!resident.blood_group) next.push({ ...base, type: 'women_health_checkup', label: 'স্বাস্থ্য checkup ও blood group update', priority: 'normal', activeRequest: activeRequestMap.get(`${resident.id}:women_health_checkup`) || null });
            return next;
        }).slice(0, 30);

        const householdMap = new Map();
        residents.forEach((resident) => {
            const house = resident.household;
            if (!house?.id) return;
            const current = householdMap.get(house.id) || {
                id: house.id,
                ownerName: house.owner_name,
                houseNo: house.house_no,
                wardName: house.ward?.name_bn,
                phone: house.phone,
                total: 0,
                missing: 0,
                missingNid: 0,
                missingBirthReg: 0,
                missingBloodGroup: 0
            };
            current.total += 3;
            if (!resident.nid) {
                current.missing += 1;
                current.missingNid += 1;
            }
            if (!resident.birth_reg_no) {
                current.missing += 1;
                current.missingBirthReg += 1;
            }
            if (!resident.blood_group) {
                current.missing += 1;
                current.missingBloodGroup += 1;
            }
            householdMap.set(house.id, current);
        });
        const lowCompleteness = Array.from(householdMap.values())
            .map((house) => ({
                ...house,
                score: Math.max(0, Math.round(((house.total - house.missing) / Math.max(1, house.total)) * 100))
            }))
            .filter((house) => house.score < 70)
            .sort((a, b) => a.score - b.score)
            .slice(0, 20);

        const duplicateMap = new Map();
        residents.forEach((resident) => {
            const nidKey = normalizeCitizenText(resident.nid);
            const birthKey = normalizeCitizenText(resident.birth_reg_no);
            const nameKey = [
                normalizeCitizenText(resident.name),
                normalizeCitizenText(resident.father_name),
                normalizeCitizenText(resident.mother_name)
            ].filter(Boolean).join(':');
            const phoneNameKey = [
                normalizeCitizenText(resident.household?.phone),
                normalizeCitizenText(resident.name)
            ].filter(Boolean).join(':');

            pushDuplicateCandidate(duplicateMap, nidKey.length >= 8 ? `nid:${nidKey}` : '', 'Same NID number', resident);
            pushDuplicateCandidate(duplicateMap, birthKey.length >= 8 ? `birth:${birthKey}` : '', 'Same birth registration number', resident);
            if (phoneNameKey.length >= 12) {
                pushDuplicateCandidate(duplicateMap, `phone:${phoneNameKey}`, 'Same phone number with same citizen name', resident);
            }
            if (nameKey.length > 10) {
                pushDuplicateCandidate(duplicateMap, `family:${nameKey}`, 'Same name with same parents', resident);
            }
        });

        const duplicateGroups = Array.from(duplicateMap.values())
            .filter((group) => group.items.length > 1)
            .sort((a, b) => b.items.length - a.items.length)
            .slice(0, 20);

        return {
            summary,
            wardSummaries: Array.from(wardMap.values()).sort((a, b) => a.wardName.localeCompare(b.wardName, 'bn')),
            candidates,
            womenSupport,
            lowCompleteness,
            duplicateGroups
        };
    },

    async updateRequestStatus(requestId, status, collectionDate, feedback, unionId = null) {
        if (unionId) {
            const { data: scopedRequest, error: scopeError } = await supabase
                .from('service_requests')
                .select(`
                    id,
                    household:households!inner(
                        ward:locations!inner(parent_id)
                    )
                `)
                .eq('id', requestId)
                .eq('household.ward.parent_id', unionId)
                .maybeSingle();

            if (scopeError) throw scopeError;
            if (!scopedRequest) throw new Error('Request is outside this union scope');
        }

        const { data: existingRequest, error: existingError } = await supabase
            .from('service_requests')
            .select('resident_id, request_type, certificate_no, status')
            .eq('id', requestId)
            .single();

        if (existingError) throw existingError;

        const normalizedStatus = status === 'Approved' ? 'ready' : status === 'Rejected' ? 'rejected' : status;
        const now = new Date().toISOString();
        const certificateNo = (
            ['ready', 'completed'].includes(normalizedStatus) &&
            !existingRequest?.certificate_no
        )
            ? `${existingRequest?.request_type === 'death_certificate' ? 'D' : 'B'}-${new Date().getFullYear()}-${requestId.slice(0, 8).toUpperCase()}`
            : existingRequest?.certificate_no;

        const { data, error } = await supabase
            .from('service_requests')
            .update({
                status: normalizedStatus,
                collection_date: collectionDate,
                feedback,
                certificate_no: certificateNo,
                issued_at: ['ready', 'completed'].includes(normalizedStatus) ? now : undefined,
                collected_at: normalizedStatus === 'completed' ? now : undefined,
                updated_at: now
            })
            .eq('id', requestId);

        if (error) throw error;

        if (
            existingRequest?.resident_id &&
            existingRequest.request_type === 'death_certificate' &&
            ['ready', 'completed'].includes(normalizedStatus)
        ) {
            await supabase
                .from('residents')
                .update({ is_dead: true })
                .eq('id', existingRequest.resident_id);
        }

        await supabase
            .from('service_request_events')
            .insert([{
                service_request_id: requestId,
                status: normalizedStatus,
                note: feedback || null
            }]);

        if (
            ['processing', 'ready', 'rejected', 'completed'].includes(normalizedStatus) &&
            existingRequest?.status !== normalizedStatus
        ) {
            await this.notifyServiceRequest(requestId, normalizedStatus);
        }

        return data;
    },

    // --- Data Sync & Verification ---
    async getAllVillagesForSync() {
        const { data, error } = await supabase
            .from('villages')
            .select(`
                *,
                ward:locations (
                    id, 
                    name_bn,
                    parent_id
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async syncVillageData(villageId) {
        // 1. Get all households in the village
        const { data: households, error: hError } = await supabase
            .from('households')
            .select('stats')
            .eq('village_id', villageId);

        if (hError) throw hError;

        // 2. Aggregate stats
        const householdAggregation = (households || []).reduce((acc, h) => {
            const s = h.stats || {};
            
            if (s.blood_groups) {
                for (const [bg, count] of Object.entries(s.blood_groups)) {
                    acc.blood_groups[bg] = (acc.blood_groups[bg] || 0) + count;
                }
            }

            return {
                ...acc,
                total_houses: acc.total_houses + 1,
                total_members: acc.total_members + (s.total_members || 0),
                males: acc.males + (s.males || 0),
                females: acc.females + (s.females || 0),
                voters: acc.voters + (s.voters || 0),
                male_voters: acc.male_voters + (s.male_voters || 0),
                female_voters: acc.female_voters + (s.female_voters || 0),
                blood_donors: acc.blood_donors + (s.blood_donors || 0),
                birth_registered: acc.birth_registered + (s.birth_registered || 0),
                voter_eligible: acc.voter_eligible + (s.voter_eligible || 0)
            };
        }, { total_houses: 0, total_members: 0, males: 0, females: 0, voters: 0, male_voters: 0, female_voters: 0, blood_donors: 0, birth_registered: 0, voter_eligible: 0, blood_groups: {} });

        // Get existing manual stats to preserve institutional data
        const { data: existingVillage } = await supabase
            .from('villages')
            .select('stats')
            .eq('id', villageId)
            .single();
        
        const manualStats = existingVillage?.stats || {};
        const realStats = {
            ...manualStats, // Keep mosques, schools, etc.
            ...householdAggregation // Overwrite demographics with real data
        };

        // 3. Update village
        const { data: vData, error: updateError } = await supabase
            .from('villages')
            .update({
                survey_status: 'verified',
                real_stats: realStats
            })
            .eq('id', villageId)
            .select('name, bn_name, ward_id')
            .single();

        if (updateError) throw updateError;

        // 4. Update the corresponding manual village in 'locations' table (bridge old & new systems)
        if (vData && vData.ward_id) {
            try {
                const searchName = vData.bn_name || vData.name;
                const { data: locVillages } = await supabase
                    .from('locations')
                    .select('id, name_bn, name_en')
                    .eq('parent_id', vData.ward_id)
                    .eq('type', 'village');

                if (locVillages && locVillages.length > 0) {
                    const matchedLoc = locVillages.find(lv => 
                        (lv.name_bn && lv.name_bn === vData.bn_name) || 
                        (lv.name_en && lv.name_en === vData.name) ||
                        (lv.name_bn && lv.name_bn === vData.name)
                    );

                    if (matchedLoc) {
                        await supabase
                            .from('locations')
                            .update({
                                survey_status: 'verified',
                                real_stats: realStats
                            })
                            .eq('id', matchedLoc.id);
                    }
                }
            } catch (err) {
                console.error("Failed to sync bridge to locations table", err);
            }
        }

        return realStats;
    },

    async syncWardData(wardId) {
        // 1. Get all verified villages in this ward
        const { data: villages, error: vError } = await supabase
            .from('villages')
            .select('real_stats')
            .eq('ward_id', wardId)
            .eq('survey_status', 'verified');

        if (vError) throw vError;

        // 2. Aggregate
        const realStats = (villages || []).reduce((acc, v) => {
            const s = v.real_stats || {};
            
            if (s.blood_groups) {
                for (const [bg, count] of Object.entries(s.blood_groups)) {
                    acc.blood_groups[bg] = (acc.blood_groups[bg] || 0) + count;
                }
            }

            return {
                ...acc,
                total_houses: acc.total_houses + (s.total_houses || 0),
                total_members: acc.total_members + (s.total_members || 0),
                males: acc.males + (s.males || 0),
                females: acc.females + (s.females || 0),
                voters: acc.voters + (s.voters || 0),
                male_voters: acc.male_voters + (s.male_voters || 0),
                female_voters: acc.female_voters + (s.female_voters || 0),
                blood_donors: acc.blood_donors + (s.blood_donors || 0),
                birth_registered: acc.birth_registered + (s.birth_registered || 0),
                voter_eligible: acc.voter_eligible + (s.voter_eligible || 0),
                // Institutional stats can be aggregated too if they are numbers
                schools: acc.schools + (typeof s.schools === 'number' ? s.schools : (Array.isArray(s.schools) ? s.schools.length : 0)),
                mosques: acc.mosques + (typeof s.mosques === 'number' ? s.mosques : (Array.isArray(s.mosques) ? s.mosques.length : 0)),
                madrassas: acc.madrassas + (typeof s.madrassas === 'number' ? s.madrassas : (Array.isArray(s.madrassas) ? s.madrassas.length : 0)),
                orphanages: acc.orphanages + (typeof s.orphanages === 'number' ? s.orphanages : (Array.isArray(s.orphanages) ? s.orphanages.length : 0)),
            };
        }, { total_houses: 0, total_members: 0, males: 0, females: 0, voters: 0, male_voters: 0, female_voters: 0, blood_donors: 0, schools: 0, mosques: 0, madrassas: 0, orphanages: 0, birth_registered: 0, voter_eligible: 0, blood_groups: {} });

        // 3. Update ward location
        const { error: updateError } = await supabase
            .from('locations')
            .update({
                survey_status: 'verified',
                real_stats: realStats
            })
            .eq('id', wardId);

        if (updateError) throw updateError;
        return realStats;
    },

    async syncUnionData(unionId) {
        // 1. Get all wards in this union
        const { data: wards, error: wError } = await supabase
            .from('locations')
            .select('real_stats')
            .eq('parent_id', unionId)
            .eq('type', 'ward')
            .eq('survey_status', 'verified');

        if (wError) throw wError;

        // 2. Aggregate
        const realStats = (wards || []).reduce((acc, w) => {
            const s = w.real_stats || {};
            
            if (s.blood_groups) {
                for (const [bg, count] of Object.entries(s.blood_groups)) {
                    acc.blood_groups[bg] = (acc.blood_groups[bg] || 0) + count;
                }
            }

            return {
                ...acc,
                total_houses: acc.total_houses + (s.total_houses || 0),
                total_members: acc.total_members + (s.total_members || 0),
                males: acc.males + (s.males || 0),
                females: acc.females + (s.females || 0),
                voters: acc.voters + (s.voters || 0),
                male_voters: acc.male_voters + (s.male_voters || 0),
                female_voters: acc.female_voters + (s.female_voters || 0),
                blood_donors: acc.blood_donors + (s.blood_donors || 0),
                schools: acc.schools + (s.schools || 0),
                mosques: acc.mosques + (s.mosques || 0),
                madrassas: acc.madrassas + (s.madrassas || 0),
                orphanages: acc.orphanages + (s.orphanages || 0),
                birth_registered: acc.birth_registered + (s.birth_registered || 0),
                voter_eligible: acc.voter_eligible + (s.voter_eligible || 0),
            };
        }, { total_houses: 0, total_members: 0, males: 0, females: 0, voters: 0, male_voters: 0, female_voters: 0, blood_donors: 0, schools: 0, mosques: 0, madrassas: 0, orphanages: 0, birth_registered: 0, voter_eligible: 0, blood_groups: {} });

        // 3. Update union location
        const { error: updateError } = await supabase
            .from('locations')
            .update({
                survey_status: 'verified',
                real_stats: realStats
            })
            .eq('id', unionId);

        if (updateError) throw updateError;
        return realStats;
    },

    // --- Document Management (Digital Locker) ---
    async uploadDocument(householdLookup, file, type, title, pin) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('householdLookup', householdLookup);
        formData.append('type', type);
        formData.append('title', title);
        formData.append('pin', pin);

        const response = await fetch('/api/household/upload-document', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Upload failed');
        return result.data;
    },

    async getHouseholdDocuments(householdLookup, pin) {
        const response = await fetch(`/api/household/documents?lookup=${encodeURIComponent(householdLookup)}&pin=${encodeURIComponent(pin)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to load documents');
        return result.data || [];
    },

    async deleteDocument(docId, pin) {
        // This will be handled by a trigger or API to also delete from Storage
        const response = await fetch(`/api/household/delete-document?id=${docId}&pin=${encodeURIComponent(pin)}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Delete failed');
        return result.data;
    }
};

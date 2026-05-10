import { supabase } from '@/lib/utils/supabase';

export const householdService = {
    // --- Village Management ---
    async getVillagesByWard(wardId) {
        const { data, error } = await supabase
            .from('villages')
            .select('*')
            .eq('ward_id', wardId)
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
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

        const response = await fetch('/api/admin/sync-household-villages', {
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

        const response = await fetch('/api/admin/sync-household-villages', {
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

        if (locationVillageIds.length > 0) {
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
        }

        const { data, error } = await supabase
            .from('volunteers')
            .select('*, assigned_village:villages(name)')
            .eq('ward_id', wardId);

        if (error) throw error;
        return data || [];
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
            .select('*')
            .eq('village_id', villageId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
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
        const { data, error } = await supabase
            .from('residents')
            .update(residentData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        await this.syncHouseholdStats(residentData.household_id || data.household_id);
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
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);

        let query = supabase
            .from('households')
            .select('locker_pin');

        if (isUUID) {
            query = query.eq('id', idOrCode);
        } else {
            query = query.eq('qr_code_id', idOrCode);
        }

        const { data, error } = await query.eq('locker_pin', pin).single();

        if (error) return false;
        return !!data;
    },

    async syncHouseholdStats(householdId) {
        const { data: residents, error } = await supabase
            .from('residents')
            .select('*')
            .eq('household_id', householdId);

        if (error) throw error;

        const stats = (residents || []).reduce((acc, r) => ({
            total_members: acc.total_members + 1,
            voters: acc.voters + (r.is_voter ? 1 : 0),
            males: acc.males + (r.gender === 'Male' ? 1 : 0),
            females: acc.females + (r.gender === 'Female' ? 1 : 0)
        }), { total_members: 0, voters: 0, males: 0, females: 0 });

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
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);

        let query = supabase
            .from('households')
            .select('*, village:villages(name, bn_name)');

        if (isUUID) {
            query = query.eq('id', idOrCode);
        } else {
            query = query.eq('qr_code_id', idOrCode);
        }

        const { data: house, error: hError } = await query.single();

        if (hError) throw hError;

        const { data: residents, error: rError } = await supabase
            .from('residents')
            .select('gender, blood_group, is_voter')
            .eq('household_id', house.id);

        if (rError) throw rError;

        return {
            ...house,
            residents_summary: residents || []
        };
    },

    async getFullHouseholdProfile(idOrCode, pin) {
        // Verify PIN first
        const isValid = await this.verifyLockerPin(idOrCode, pin);
        if (!isValid) throw new Error('Invalid Locker PIN');

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);

        let query = supabase
            .from('households')
            .select('*, village:villages(name, bn_name)');

        if (isUUID) {
            query = query.eq('id', idOrCode);
        } else {
            query = query.eq('qr_code_id', idOrCode);
        }

        const { data: house, error: hError } = await query.single();

        if (hError) throw hError;

        const { data: residents, error: rError } = await supabase
            .from('residents')
            .select('*')
            .eq('household_id', house.id)
            .order('created_at', { ascending: true });

        if (rError) throw rError;

        return {
            ...house,
            residents: residents || []
        };
    },

    // --- Service Requests ---
    async createServiceRequest(requestData) {
        const { data, error } = await supabase
            .from('service_requests')
            .insert([requestData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getServiceRequestsByUnion(unionId) {
        const { data, error } = await supabase
            .from('service_requests')
            .select('*, household:households(owner_name, house_no, village:villages(bn_name))')
            .eq('status', 'Pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async updateRequestStatus(requestId, status, collectionDate, feedback) {
        const { data, error } = await supabase
            .from('service_requests')
            .update({
                status,
                collection_date: collectionDate,
                feedback,
                updated_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (error) throw error;
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
        const realStats = (households || []).reduce((acc, h) => {
            const s = h.stats || {};
            return {
                total_houses: acc.total_houses + 1,
                total_members: acc.total_members + (s.total_members || 0),
                males: acc.males + (s.males || 0),
                females: acc.females + (s.females || 0),
                voters: acc.voters + (s.voters || 0)
            };
        }, { total_houses: 0, total_members: 0, males: 0, females: 0, voters: 0 });

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
            return {
                total_houses: acc.total_houses + (s.total_houses || 0),
                total_members: acc.total_members + (s.total_members || 0),
                males: acc.males + (s.males || 0),
                females: acc.females + (s.females || 0),
                voters: acc.voters + (s.voters || 0)
            };
        }, { total_houses: 0, total_members: 0, males: 0, females: 0, voters: 0 });

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
            return {
                total_houses: acc.total_houses + (s.total_houses || 0),
                total_members: acc.total_members + (s.total_members || 0),
                males: acc.males + (s.males || 0),
                females: acc.females + (s.females || 0),
                voters: acc.voters + (s.voters || 0)
            };
        }, { total_houses: 0, total_members: 0, males: 0, females: 0, voters: 0 });

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
    async uploadDocument(householdId, file, type, title) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('householdId', householdId);
        formData.append('type', type);
        formData.append('title', title);

        const response = await fetch('/api/household/upload-document', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Upload failed');
        return result.data;
    },

    async getHouseholdDocuments(householdId) {
        const { data, error } = await supabase
            .from('household_documents')
            .select('*')
            .eq('household_id', householdId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async deleteDocument(docId) {
        // This will be handled by a trigger or API to also delete from Storage
        const response = await fetch(`/api/household/delete-document?id=${docId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Delete failed');
        return result.data;
    }
};

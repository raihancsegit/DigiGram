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
        return stats;
    },

    // --- Public Profile ---
    async getPublicHouseholdProfile(householdId) {
        const { data: house, error: hError } = await supabase
            .from('households')
            .select('*, village:villages(name, bn_name)')
            .eq('id', householdId)
            .single();

        if (hError) throw hError;

        const { data: residents, error: rError } = await supabase
            .from('residents')
            .select('gender, blood_group, is_voter')
            .eq('household_id', householdId);

        if (rError) throw rError;

        return {
            ...house,
            residents_summary: residents || []
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
    }
};

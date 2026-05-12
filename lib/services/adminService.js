import { supabase } from '../utils/supabase';

/**
 * Service for Super Admin operations: Location management, 
 * Global Service toggling, and Institutional setup.
 */
export const adminService = {
    // 1. Fetch all Locations (filtering by type if needed) with Pagination
    getLocations: async (type = 'union', page = 1, pageSize = 10, searchQuery = '') => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('locations')
            .select('*', { count: 'exact' })
            .eq('type', type);
            
        if (searchQuery) {
            query = query.or(`name_bn.ilike.%${searchQuery}%,name_en.ilike.%${searchQuery}%,slug.ilike.%${searchQuery}%`);
        }

        const { data, error, count } = await query
            .order('name_en', { ascending: true })
            .range(from, to);
        
        if (error) throw error;
        return { data, count };
    },

    // 1.5 Fetch child locations (Ward -> Union, Village -> Ward) with Pagination
    getChildrenLocations: async (parentId, type = 'ward', page = 1, pageSize = 10) => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
            .from('locations')
            .select('*', { count: 'exact' })
            .eq('parent_id', parentId)
            .eq('type', type)
            .order('name_bn', { ascending: true })
            .range(from, to);
        
        if (error) throw error;
        return { data, count };
    },

    // 2. Fetch all Global Master Services
    getMasterServices: async () => {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        return data;
    },

    // 3. Get currently active services for a union
    getUnionServices: async (unionId) => {
        const { data, error } = await supabase
            .from('location_services')
            .select(`
                *,
                services (*)
            `)
            .eq('location_id', unionId);
        
        if (error) throw error;
        return data;
    },

    // 4. Toggle Service Status for a Union (via API Bridge)
    toggleService: async (locationId, serviceId, isActive) => {
        const response = await fetch('/api/admin/mutate-service', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'toggle', 
                locationId, 
                serviceId, 
                isActive 
            })
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Toggle failed');
        return result.data;
    },

    // 5. Update Service Config (via API Bridge)
    updateServiceConfig: async (relationId, config) => {
        const response = await fetch('/api/admin/mutate-service', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'update_config', 
                relationId, 
                config 
            })
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Config update failed');
        return result.data;
    },

    // 6. Create New Location (via API Bridge to bypass RLS)
    createLocation: async (locationData) => {
        const response = await fetch('/api/admin/mutate-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'new', action: 'create', updates: locationData })
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Creation failed');
        return result.data;
    },

    // 7. Update Location Details or Stats (via API Bridge for Super Admin)
    updateLocation: async (id, updates) => {
        const response = await fetch('/api/admin/mutate-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, action: 'update', updates })
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Update failed');
        return result.data;
    },

    // 8. Assign User to a Specific Role and Location (via API Bridge to bypass RLS)
    assignRoleToUser: async (userId, role, scopeId) => {
        return adminService.mutateUser(userId, 'update_profile', {
            role,
            access_scope_id: scopeId
        });
    },

    // 9. Fetch Users by Role (for selection in UI - without pagination)
    getUsersByRole: async (role = null) => {
        let query = supabase.from('profiles').select('*');
        if (role) {
            query = query.eq('role', role);
        }
        const { data, error } = await query.order('first_name', { ascending: true });
        
        if (error) throw error;
        return data;
    },

    // 9.5 Fetch Users with Pagination and Search
    getUsersPaginated: async (page = 1, pageSize = 10, role = 'all', searchQuery = '') => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('profiles')
            .select('*', { count: 'exact' });

        if (role && role !== 'all') {
            query = query.eq('role', role);
        }

        if (searchQuery) {
            query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);
        
        if (error) throw error;
        return { data, count };
    },

    // 10. Delete a Location (via API Bridge for Super Admin)
    deleteLocation: async (id) => {
        const response = await fetch('/api/admin/mutate-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, action: 'delete' })
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Delete failed');
        return true;
    },

    // 11. Quick Create any User Role (Admin Managed)
    quickCreateChairman: async ({ email, password, first_name, last_name, phone, role = 'chairman', access_scope_id }) => {
        try {
            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email, password, first_name, last_name, phone, role, access_scope_id
                })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to create user through admin API');
            }

            return { data: result.user, error: null };
        } catch (error) {
            console.error("Admin User Creation Error: ", error);
            throw error;
        }
    },
    
    // 12. General User Mutation (De-assign, Delete etc - via API Bridge)
    mutateUser: async (id, action, updates = {}) => {
        const response = await fetch('/api/admin/mutate-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, action, updates })
        });
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'User mutation failed');
            return result.data || true;
        } else {
            const text = await response.text();
            throw new Error(text || 'সার্ভার থেকে ভুল রেসপন্স এসেছে।');
        }
    },

    // 13. Get Global Stats
    getGlobalStats: async () => {
        const { count: upazilaCount } = await supabase.from('locations').select('*', { count: 'exact', head: true }).eq('type', 'upazila');
        const { count: unionCount } = await supabase.from('locations').select('*', { count: 'exact', head: true }).eq('type', 'union');
        const { count: wardCount } = await supabase.from('locations').select('*', { count: 'exact', head: true }).eq('type', 'ward');
        const { count: villageCount } = await supabase.from('locations').select('*', { count: 'exact', head: true }).eq('type', 'village');
        const { count: verifiedCount } = await supabase.from('locations').select('*', { count: 'exact', head: true }).eq('type', 'village').eq('survey_status', 'verified');
        const { count: volunteerCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'volunteer');
        const { count: householdCount } = await supabase.from('households').select('*', { count: 'exact', head: true });
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        
        return {
            upazilas: upazilaCount || 0,
            unions: unionCount || 0,
            wards: wardCount || 0,
            villages: villageCount || 0,
            verifiedVillages: verifiedCount || 0,
            volunteers: volunteerCount || 0,
            households: householdCount || 0,
            users: userCount || 0
        };
    },

    // 13.5 Get Global Location Stats Summary
    getGlobalLocationStats: async () => {
        const { data, error } = await supabase
            .from('locations')
            .select('stats')
            .in('type', ['union', 'ward', 'village']);

        if (error) {
            console.error('Global location stats fetch error:', error);
            return {
                population: 0,
                voters: 0,
                maleVoters: 0,
                femaleVoters: 0,
                homes: 0
            };
        }

        const totals = (data || []).reduce((acc, item) => {
            const stats = item?.stats || {};
            const parseStat = (value) => {
                if (typeof value === 'number') return value;
                if (typeof value === 'string') return parseInt(value.replace(/[^0-9]/g, '')) || 0;
                return 0;
            };

            return {
                population: acc.population + parseStat(stats.population),
                voters: acc.voters + parseStat(stats.voters),
                maleVoters: acc.maleVoters + parseStat(stats.maleVoters),
                femaleVoters: acc.femaleVoters + parseStat(stats.femaleVoters),
                homes: acc.homes + parseStat(stats.homes || stats.households || stats.house_count || stats.houses)
            };
        }, { population: 0, voters: 0, maleVoters: 0, femaleVoters: 0, homes: 0 });

        return totals;
    },

    // 14. Get Recent Location Logs
    getRecentLogs: async () => {
        const { data, error } = await supabase
            .from('locations')
            .select('id, name_bn, type, created_at')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        return data;
    },

    // 15. Fetch all institutions for selection
    getAllInstitutions: async () => {
        const { data, error } = await supabase
            .from('institutions')
            .select('id, name, type, location_id')
            .order('name', { ascending: true });
        
        if (error) throw error;
        return data;
    }
};

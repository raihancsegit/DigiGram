import { supabase } from '../utils/supabase';

export const wardService = {
    // ---- WARD STATS ----
    getWardStats: async (wardId) => {
        const { data, error } = await supabase
            .from('locations')
            .select(`
                stats, real_stats, survey_status, name_bn, name_en, parent_id,
                parent:parent_id(slug)
            `)
            .eq('id', wardId)
            .single();
        
        if (error) throw error;
        return data;
    },

    getWardBySlug: async (slug) => {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .eq('slug', slug)
            .eq('type', 'ward')
            .single();
        
        if (error) throw error;
        return data;
    },

    updateWardStats: async (wardId, stats) => {
        const { data, error } = await supabase
            .from('locations')
            .update({ 
                stats, 
                updated_at: new Date() 
            })
            .eq('id', wardId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // ---- LOCAL NEWS ----
    getNewsByLocation: async (locationId) => {
        const { data, error } = await supabase
            .from('local_news')
            .select(`
                *,
                location:locations(name_bn),
                profiles:author_id (first_name, last_name, avatar_url)
            `)
            .or(`location_id.eq.${locationId},is_global.eq.true`)
            .eq('status', 'published')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data;
    },

    getMultipleLocationsNews: async (locationIds, timeframe = 'all') => {
        let query = supabase
            .from('local_news')
            .select(`
                *,
                location:location_id(name_bn),
                profiles:author_id (first_name, last_name, avatar_url)
            `)
            .or(`location_id.in.(${locationIds.join(',')}),is_global.eq.true`)
            .eq('status', 'published');

        if (timeframe !== 'all') {
            const now = new Date();
            let filterDate = new Date();
            if (timeframe === 'today') filterDate.setHours(0, 0, 0, 0);
            else if (timeframe === '7days') filterDate.setDate(now.getDate() - 7);
            else if (timeframe === '15days') filterDate.setDate(now.getDate() - 15);
            else if (timeframe === '30days') filterDate.setDate(now.getDate() - 30);
            else if (timeframe === 'year') filterDate.setDate(now.getDate() - 365);
            
            query = query.gte('created_at', filterDate.toISOString());
        }

        const { data, error } = await query
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data;
    },

    createNews: async (newsData) => {
        const { data, error } = await supabase
            .from('local_news')
            .insert([{
                ...newsData,
                created_at: new Date(),
                updated_at: new Date()
            }])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    deleteNews: async (newsId) => {
        const { error } = await supabase
            .from('local_news')
            .delete()
            .eq('id', newsId);
            
        if (error) throw error;
        return true;
    },

    // ---- VILLAGE MANAGEMENT ----
    getVillageById: async (id) => {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .eq('id', id)
            .eq('type', 'village')
            .single();
        
        if (error) throw error;
        return data;
    },

    getVillageBySlug: async (slug) => {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .eq('slug', slug)
            .eq('type', 'village')
            .maybeSingle();
        
        if (error) throw error;
        return data;
    },

    createVillage: async (wardId, villageData) => {
        const { data, error } = await supabase
            .from('locations')
            .insert([{
                ...villageData,
                parent_id: wardId,
                type: 'village',
                created_at: new Date(),
                updated_at: new Date()
            }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    getVillagesByWard: async (wardId) => {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .eq('parent_id', wardId)
            .eq('type', 'village')
            .order('name_bn', { ascending: true });
        
        if (error) throw error;
        return data;
    },

    updateVillage: async (id, changes) => {
        const { data, error } = await supabase
            .from('locations')
            .update({
                ...changes,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    deleteVillage: async (id) => {
        const { error } = await supabase
            .from('locations')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    },

    // ---- VOLUNTEER MANAGEMENT ----
    getVolunteersByVillage: async (villageId) => {
        if (!villageId) return [];
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'volunteer')
                .eq('access_scope_id', villageId)
                .order('first_name', { ascending: true });
            
            if (error) {
                console.error("Error fetching volunteers:", error);
                return [];
            }
            return data || [];
        } catch (err) {
            console.error("Critical error in getVolunteersByVillage:", err);
            return [];
        }
    },

    getVolunteersByWard: async (villageIds) => {
        if (!villageIds || villageIds.length === 0) return [];
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'volunteer')
                .in('access_scope_id', villageIds)
                .order('first_name', { ascending: true });
            
            if (error) {
                console.error("Error fetching volunteers for ward:", error);
                return [];
            }
            return data || [];
        } catch (err) {
            console.error("Critical error in getVolunteersByWard:", err);
            return [];
        }
    }
};

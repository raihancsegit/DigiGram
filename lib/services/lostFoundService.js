import { supabase } from '../utils/supabase';

export const lostFoundService = {
    // Get posts for a specific location (Union) or Global with Pagination and Filtering
    getPosts: async (locationId, page = 1, pageSize = 12, includeGlobal = true, timeframe = 'all') => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('lost_found_posts')
            .select(`
                *,
                location_details:locations(id, name_bn, slug)
            `, { count: 'exact' });

        if (locationId) {
            if (includeGlobal) {
                query = query.or(`location_id.eq.${locationId},is_global.eq.true`);
            } else {
                query = query.eq('location_id', locationId);
            }
        } else if (includeGlobal) {
            query = query.eq('is_global', true);
        }

        if (timeframe !== 'all') {
            const now = new Date();
            let filterDate = new Date();
            if (timeframe === 'today') filterDate.setHours(0, 0, 0, 0);
            else if (timeframe === '7days') filterDate.setDate(now.getDate() - 7);
            else if (timeframe === '15days') filterDate.setDate(now.getDate() - 15);
            else if (timeframe === '30days') filterDate.setDate(now.getDate() - 30);
            
            query = query.gte('created_at', filterDate.toISOString());
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);
        
        if (error) throw error;
        return { data, count };
    },

    // Get a single lost & found post by ID
    getPostById: async (id) => {
        const { data, error } = await supabase
            .from('lost_found_posts')
            .select(`*, location_details:locations(id, name_bn, slug)`)
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    // Get only global posts with Pagination and Filtering
    getGlobalPosts: async (page = 1, pageSize = 12, timeframe = 'all') => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('lost_found_posts')
            .select(`
                *,
                location_details:locations(id, name_bn, slug)
            `)
            .eq('is_global', true);

        if (timeframe !== 'all') {
            const now = new Date();
            let filterDate = new Date();
            if (timeframe === 'today') filterDate.setHours(0, 0, 0, 0);
            else if (timeframe === '7days') filterDate.setDate(now.getDate() - 7);
            else if (timeframe === '15days') filterDate.setDate(now.getDate() - 15);
            else if (timeframe === '30days') filterDate.setDate(now.getDate() - 30);
            
            query = query.gte('created_at', filterDate.toISOString());
        }

        console.log("Executing Supabase Query for Global Posts...");
        const { data, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to);
        
        if (error) throw error;
        return data;
    },

    // Add a new post
    addPost: async (postData) => {
        const { data, error } = await supabase
            .from('lost_found_posts')
            .insert([postData])
            .select();
        
        if (error) throw error;
        return data[0];
    },

    // Delete a post
    deletePost: async (id) => {
        const { error } = await supabase
            .from('lost_found_posts')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    },

    // Update a post
    updatePost: async (id, updateData) => {
        const { data, error } = await supabase
            .from('lost_found_posts')
            .update(updateData)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    }
};

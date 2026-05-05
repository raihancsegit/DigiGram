import { supabase } from '../utils/supabase';

export const newsService = {
    // Get local news with Pagination and Filtering
    getNews: async (locationId, page = 1, pageSize = 12, asGlobal = false, timeframe = 'all') => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('local_news')
            .select(`
                *,
                author:profiles(id, first_name, last_name, avatar_url),
                location:locations(id, name_bn, slug)
            `, { count: 'exact' });

        if (locationId) {
            query = query.eq('location_id', locationId);
        }
        if (asGlobal) {
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

    // Get Global News with Pagination and Filtering
    getGlobalNews: async (page = 1, pageSize = 10, timeframe = 'all') => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('local_news')
            .select(`
                *,
                location:locations(id, name_bn, slug)
            `)
            .eq('is_global', true)
            .eq('status', 'published');

        if (timeframe !== 'all') {
            const now = new Date();
            let filterDate = new Date();
            if (timeframe === 'today') filterDate.setHours(0, 0, 0, 0);
            else if (timeframe === '7days') filterDate.setDate(now.getDate() - 7);
            else if (timeframe === '15days') filterDate.setDate(now.getDate() - 15);
            else if (timeframe === '30days') filterDate.setDate(now.getDate() - 30);
            
            query = query.gte('created_at', filterDate.toISOString());
        }

        console.log("Executing Supabase Query for Global News...");
        const { data, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to);
        
        if (error) throw error;
        return data || [];
    },

    // Add a new news post
    addNews: async (newsData) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('local_news')
            .insert([{
                ...newsData,
                author_id: user.id,
                status: newsData.status || 'published'
            }])
            .select();
        
        if (error) throw error;
        return data[0];
    },

    // Delete a news post
    deleteNews: async (id) => {
        const { error } = await supabase
            .from('local_news')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    },

    // Update a news post (strips non-updatable fields)
    updateNews: async (id, updateData) => {
        // Remove fields that should not be updated
        const { author_id, location_id, created_at, id: _id, ...safeData } = updateData;

        const { data, error } = await supabase
            .from('local_news')
            .update({ ...safeData, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    },

    // Get a single news post by ID or Slug
    getNewsBySlugOrId: async (identifier) => {
        if (!identifier) return null;

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
        
        const SELECT_FIELDS = `
            *,
            author:profiles(id, first_name, last_name, avatar_url),
            location:locations(id, name_bn, slug)
        `;

        try {
            // 1. If UUID, fetch by ID first — skip slug query if found
            if (isUuid) {
                const { data, error } = await supabase
                    .from('local_news')
                    .select(SELECT_FIELDS)
                    .eq('id', identifier)
                    .maybeSingle();
                
                if (error) console.error('ID fetch error:', error);
                if (data) return data; // ✅ Found by ID — no slug query needed
            }

            // 2. Try matching by slug (only if not a UUID, or UUID lookup returned nothing)
            const { data: slugData, error: slugError } = await supabase
                .from('local_news')
                .select(SELECT_FIELDS)
                .eq('slug', identifier)
                .maybeSingle();

            // Only log real errors, not "column doesn't exist" type misses
            if (slugError && slugError.code !== 'PGRST116') {
                console.error('Slug fetch error:', slugError);
            }

            return slugData || null;

        } catch (err) {
            console.error('Critical news fetch error:', err);
            return null;
        }
    }
};

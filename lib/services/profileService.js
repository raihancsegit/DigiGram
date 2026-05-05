import { supabase } from '@/lib/utils/supabase';

/**
 * Service to manage profiles and link them to locations/institutions.
 */
export const profileService = {
    // 1. Create a profile (Called after Super Admin creates an Auth user)
    createProfile: async ({ id, first_name, last_name, phone, role, access_scope_id }) => {
        const { data, error } = await supabase
            .from('profiles')
            .insert([{ id, first_name, last_name, phone, role, access_scope_id }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // 2. Fetch profile with joined location/institution details
    getProfileDetails: async (userId) => {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                location:locations(id, name_en, name_bn, slug, type),
                institution:institutions(id, name, type, subdomain)
            `)
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    // 3. Update profile
    updateProfile: async (userId, updates) => {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

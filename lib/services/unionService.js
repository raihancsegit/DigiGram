import { supabase } from '@/lib/utils/supabase';

export const unionService = {
    // Get union basic info
    async getUnionInfo(unionId) {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .eq('id', unionId)
            .single();
        
        if (error) throw error;
        return data;
    },

    // Update union settings or profile
    async updateUnionProfile(unionId, profileData) {
        const { data, error } = await supabase
            .from('locations')
            .update(profileData)
            .eq('id', unionId);
        
        if (error) throw error;
        return data;
    }
};

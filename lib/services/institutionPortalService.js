import { supabase } from '@/lib/utils/supabase';

export const institutionPortalService = {
    async getCurrentRole() {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData.user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .maybeSingle();
        if (error) throw error;
        return data?.role || null;
    },

    async getPage(institutionId) {
        const { data, error } = await supabase
            .from('institution_pages')
            .select('*')
            .eq('institution_id', institutionId)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    async getPublicNotices(institutionId) {
        const { data, error } = await supabase
            .from('institution_notices')
            .select('*')
            .eq('institution_id', institutionId)
            .eq('audience', 'public')
            .order('published_at', { ascending: false })
            .limit(5);
        if (error) throw error;
        return data || [];
    },

    async getMembership(institutionId, memberRole = null) {
        let query = supabase
            .from('institution_memberships')
            .select('*')
            .eq('institution_id', institutionId)
            .eq('is_active', true)
            .limit(1);

        if (memberRole) query = query.eq('member_role', memberRole);

        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        return data;
    },

    async upsertPage(payload) {
        const { data, error } = await supabase
            .from('institution_pages')
            .upsert(payload, { onConflict: 'institution_id' })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async createNotice(payload) {
        const { data, error } = await supabase
            .from('institution_notices')
            .insert([payload])
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

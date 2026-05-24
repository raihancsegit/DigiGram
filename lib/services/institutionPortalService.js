import { supabase } from '@/lib/utils/supabase';

function isMissingAuthSession(error) {
    return error?.name === 'AuthSessionMissingError'
        || error?.code === 'session_not_found'
        || String(error?.message || '').toLowerCase().includes('auth session missing');
}

export const institutionPortalService = {
    async getCurrentRole() {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) {
            if (isMissingAuthSession(authError)) return null;
            throw authError;
        }
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

    async getPublishedPage(institutionId) {
        const { data, error } = await supabase
            .from('institution_pages')
            .select('*')
            .eq('institution_id', institutionId)
            .maybeSingle();
        if (error) throw error;
        if (!data?.published_content || Object.keys(data.published_content).length === 0) return data;
        return { ...data, ...data.published_content };
    },

    async getPublicNotices(institutionId) {
        const { data, error } = await supabase
            .from('institution_notices')
            .select('*')
            .eq('institution_id', institutionId)
            .eq('audience', 'public')
            .order('is_pinned', { ascending: false })
            .order('published_at', { ascending: false })
            .limit(5);
        if (error) throw error;
        return data || [];
    },

    async getNotices(institutionId, limit = 100) {
        const { data, error } = await supabase
            .from('institution_notices')
            .select('*')
            .eq('institution_id', institutionId)
            .order('is_pinned', { ascending: false })
            .order('published_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data || [];
    },

    async getMembership(institutionId, memberRole = null) {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) {
            if (isMissingAuthSession(authError)) return null;
            throw authError;
        }
        if (!authData.user) return null;

        let query = supabase
            .from('institution_memberships')
            .select('*')
            .eq('institution_id', institutionId)
            .eq('profile_id', authData.user.id)
            .eq('is_active', true)
            .limit(1);

        if (memberRole) query = query.eq('member_role', memberRole);

        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        return data;
    },

    async getMembers(institutionId, memberRole = null, includeInactive = false) {
        let query = supabase
            .from('institution_memberships')
            .select('*')
            .eq('institution_id', institutionId)
            .order('display_name', { ascending: true, nullsFirst: false });

        if (memberRole) query = query.eq('member_role', memberRole);
        if (!includeInactive) query = query.eq('is_active', true);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async addMembership(payload) {
        const { data, error } = await supabase
            .from('institution_memberships')
            .upsert([payload], { onConflict: 'institution_id,profile_id,member_role' })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateMembership(id, updates) {
        const { data, error } = await supabase
            .from('institution_memberships')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
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

    async savePageDraft(institutionId, content, theme) {
        const timestamp = new Date().toISOString();
        const { data, error } = await supabase
            .from('institution_pages')
            .upsert({
                institution_id: institutionId,
                draft_content: content,
                draft_theme: theme,
                last_draft_saved_at: timestamp,
                updated_at: timestamp
            }, { onConflict: 'institution_id' })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async publishPage(institutionId, content, theme) {
        const timestamp = new Date().toISOString();
        const { data, error } = await supabase
            .from('institution_pages')
            .upsert({
                institution_id: institutionId,
                ...content,
                draft_content: content,
                draft_theme: theme,
                published_content: content,
                last_draft_saved_at: timestamp,
                published_at: timestamp,
                updated_at: timestamp
            }, { onConflict: 'institution_id' })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getPublishHistory(institutionId, limit = 20) {
        const { data, error } = await supabase
            .from('institution_page_publish_history')
            .select('*')
            .eq('institution_id', institutionId)
            .order('published_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data || [];
    },

    async createPublishHistory(institutionId, content, theme) {
        const { data: authData } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('institution_page_publish_history')
            .insert([{
                institution_id: institutionId,
                content_snapshot: content,
                theme_snapshot: theme,
                published_by: authData?.user?.id || null
            }])
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
    },

    async updateNotice(noticeId, updates) {
        const { data, error } = await supabase
            .from('institution_notices')
            .update(updates)
            .eq('id', noticeId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteNotice(noticeId) {
        const { error } = await supabase
            .from('institution_notices')
            .delete()
            .eq('id', noticeId);
        if (error) throw error;
        return true;
    },

    async getAdmissionApplications(institutionId, limit = 120) {
        const { data, error } = await supabase
            .from('school_admission_applications')
            .select('*')
            .eq('institution_id', institutionId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data || [];
    },

    async updateAdmissionApplication(applicationId, updates) {
        const { data: authData } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('school_admission_applications')
            .update({
                ...updates,
                reviewed_by: authData?.user?.id || null,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', applicationId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

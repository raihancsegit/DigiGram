import { supabase, supabasePublic } from '../utils/supabase';

export const donationService = {
    // Get all projects for a specific union + Global projects
    getProjects: async (unionSlug, timeframe = 'all') => {
        let query = supabasePublic
            .from('donation_projects')
            .select('*')
            .or(`union_slug.eq.${unionSlug},is_global.eq.true`);

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

        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        if (!data) return [];

        // Fetch location names for unique slugs
        const slugs = [...new Set(data.map(p => p.union_slug))];
        const { data: locations } = await supabasePublic
            .from('locations')
            .select('slug, name_bn')
            .in('slug', slugs);
        
        const locationMap = (locations || []).reduce((acc, loc) => {
            acc[loc.slug] = loc.name_bn;
            return acc;
        }, {});

        return data.map(p => ({
            ...p,
            union_name: locationMap[p.union_slug] || 'সারাদেশ'
        }));
    },

    // Get a single donation project by identifier (ID or slug) with its ledger
    getProjectById: async (identifier) => {
        if (!identifier) return null;

        const { data: projectById, error: idError } = await supabasePublic
            .from('donation_projects')
            .select('*')
            .eq('id', identifier)
            .maybeSingle();

        if (idError) throw idError;
        let project = projectById;

        if (!project) {
            const { data: projectBySlug, error: slugError } = await supabasePublic
                .from('donation_projects')
                .select('*')
                .eq('slug', identifier)
                .maybeSingle();

            if (slugError) {
                if (slugError.code === '42703' || slugError.message?.toLowerCase().includes('column "slug" does not exist')) {
                    project = null;
                } else {
                    throw slugError;
                }
            } else {
                project = projectBySlug;
            }
        }

        if (!project) return null;

        // Get union name from slug
        const { data: loc } = await supabasePublic
            .from('locations')
            .select('name_bn, slug')
            .eq('slug', project.union_slug)
            .maybeSingle();

        // Fetch verified public ledger for this project
        const { data: ledger } = await supabasePublic
            .from('donation_ledger')
            .select('*')
            .eq('project_id', project.id)
            .eq('status', 'verified')
            .eq('is_public', true)
            .order('created_at', { ascending: false });

        return { ...project, union_name: loc?.name_bn || 'সারাদেশ', ledger: ledger || [] };
    },

    // Get public ledger (verified & public donations)
    getPublicLedger: async (unionSlug) => {
        // First get project IDs for this union
        const { data: projects } = await supabase
            .from('donation_projects')
            .select('id')
            .eq('union_slug', unionSlug);
        
        if (!projects || projects.length === 0) return [];

        const projectIds = projects.map(p => p.id);

        const { data, error } = await supabase
            .from('donation_ledger')
            .select(`
                *,
                project:donation_projects(title)
            `)
            .in('project_id', projectIds)
            .eq('status', 'verified')
            .eq('is_public', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get donation settings for a union
    getSettings: async (unionSlug) => {
        const { data, error } = await supabase
            .from('donation_settings')
            .select('*')
            .eq('union_slug', unionSlug)
            .maybeSingle();
        
        if (error) throw error;
        return data;
    },

    // Submit a new donation (Pending status)
    submitDonation: async (donationData) => {
        const { data, error } = await supabase
            .from('donation_ledger')
            .insert([donationData])
            .select();
        
        if (error) throw error;
        return data[0];
    },

    // Save project (Create/Update via API Bridge)
    saveProject: async (projectData) => {
        const response = await fetch('/api/admin/mutate-donation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_project', projectData })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Project save failed');
        return result.data;
    },

    // Delete project (via API Bridge)
    deleteProject: async (projectId) => {
        const response = await fetch('/api/admin/mutate-donation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_project', projectId })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Delete failed');
        return true;
    },

    // Save settings (via API Bridge)
    saveSettings: async (unionSlug, settings) => {
        const response = await fetch('/api/admin/mutate-donation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_settings', unionSlug, settings })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Settings save failed');
        return result.data;
    },

    // Verify Donation (via API Bridge)
    verifyDonation: async (donationId) => {
        const response = await fetch('/api/admin/mutate-donation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'verify_donation', donationId })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Verification failed');
        return result.data;
    },

    // Upload Project Image (via API Bridge to ensure bucket exists)
    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/admin/upload-donation-image', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Upload failed');
        return result.publicUrl;
    }
};

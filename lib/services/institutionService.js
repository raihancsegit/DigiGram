import { supabase } from '../utils/supabase';
import { getInstitutionDesignProfile } from '@/lib/constants/institutionDesignProfiles';

/**
 * Service to manage Institutions (Schools, Colleges, Mosques, Madrassas)
 * Implementing Multi-tenant Data Isolation using location_id.
 */
export const institutionService = {
    
    // 1. Get Institution Basic Info
    getInstitutionById: async (id) => {
        const { data, error } = await supabase
            .from('institutions')
            .select('*, locations!institutions_location_id_fkey(name_bn, name_en)')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },

    // 2. Add New Institution
    addInstitution: async (instData) => {
        const design = getInstitutionDesignProfile(instData.category || instData.type);
        const { data, error } = await supabase
            .from('institutions')
            .insert([{
                name: instData.name,
                type: instData.type,
                location_id: instData.location_id,
                village: instData.village,
                village_location_id: instData.village_location_id || null,
                subdomain: instData.subdomain?.trim().toLowerCase() || null,
                custom_domain: instData.custom_domain?.trim().toLowerCase() || null,
                category: instData.category || instData.type,
                portal_features: instData.portal_features || [],
                operational_settings: instData.operational_settings || {},
                website_status: instData.website_status || 'active',
                theme: instData.theme || {
                    preset: instData.category || instData.type,
                    primary_color: design.primaryColor,
                    font_family: design.fontFamily,
                    menu_items: ['home', 'about', 'classes', 'teachers', 'guardian', 'facilities', 'admission', 'notices', 'contact']
                },
                config: instData.config || {},
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // 3. Get Institutions by Union (for Chairman/Admin lists) with Pagination
    getInstitutionsByUnion: async (locationId, type = null, page = 1, pageSize = 12) => {
        if (!locationId) return { data: [], count: 0 };
        
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('institutions')
            .select('*', { count: 'exact' })
            .eq('location_id', locationId);
        
        if (type) {
            query = query.eq('type', type);
        }

        const { data, error, count } = await query
            .order('name', { ascending: true })
            .range(from, to);
            
        if (error) throw error;
        return { data, count };
    },

    // 3. Get Financial Records (Income/Expense)
    getTransactions: async (institutionId, limit = 50) => {
        const { data, error } = await supabase
            .from('institution_transactions')
            .select('*')
            .eq('institution_id', institutionId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return data || [];
    },

    // 4. Add Transaction
    addTransaction: async (txData) => {
        const { data, error } = await supabase
            .from('institution_transactions')
            .insert([{
                institution_id: txData.institutionId,
                amount: txData.amount,
                type: txData.type, // 'income' or 'expense'
                description: txData.description,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // 5. Update Config (Namaz times, School notice, etc)
    updateConfig: async (id, config) => {
        const { data, error } = await supabase
            .from('institutions')
            .update({ 
                config,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    updateBranding: async (id, theme) => {
        const { data, error } = await supabase
            .from('institutions')
            .update({
                theme,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    updateInstitution: async (id, updates) => {
        const { data, error } = await supabase
            .from('institutions')
            .update({
                name: updates.name,
                type: updates.type,
                category: updates.category,
                location_id: updates.location_id,
                village: updates.village,
                village_location_id: updates.village_location_id || null,
                subdomain: updates.subdomain?.trim().toLowerCase() || null,
                custom_domain: updates.custom_domain?.trim().toLowerCase() || null,
                portal_features: updates.portal_features || [],
                operational_settings: updates.operational_settings || {},
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    deleteInstitution: async (id) => {
        const { error } = await supabase
            .from('institutions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    updateWebsiteStatus: async (id, websiteStatus) => {
        const { data, error } = await supabase
            .from('institutions')
            .update({
                website_status: websiteStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    duplicateInstitution: async (institution) => {
        const baseSubdomain = `${institution.subdomain || 'institution'}-copy`;
        const { data, error } = await supabase
            .from('institutions')
            .insert([{
                name: `${institution.name} Copy`,
                type: institution.type,
                category: institution.category,
                location_id: institution.location_id,
                village: institution.village,
                village_location_id: institution.village_location_id,
                subdomain: baseSubdomain,
                custom_domain: null,
                portal_features: institution.portal_features || [],
                operational_settings: institution.operational_settings || {},
                website_status: 'paused',
                theme: institution.theme || {},
                config: institution.config || {},
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

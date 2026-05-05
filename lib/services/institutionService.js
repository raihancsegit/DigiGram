import { supabase } from '../utils/supabase';

/**
 * Service to manage Institutions (Schools, Colleges, Mosques, Madrassas)
 * Implementing Multi-tenant Data Isolation using location_id.
 */
export const institutionService = {
    
    // 1. Get Institution Basic Info
    getInstitutionById: async (id) => {
        const { data, error } = await supabase
            .from('institutions')
            .select('*, locations(name, name_bn)')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },

    // 2. Add New Institution
    addInstitution: async (instData) => {
        const { data, error } = await supabase
            .from('institutions')
            .insert([{
                name: instData.name,
                type: instData.type,
                location_id: instData.location_id,
                village: instData.village,
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
    }
};

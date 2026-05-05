import { supabase } from '../utils/supabase';

/**
 * Service to manage E-Clinic operations (Doctors, Ambulances, Pharmacies)
 * Implementing Multi-tenant Data Isolation using location_id.
 */
export const clinicService = {
    // 1. Get Doctors for a specific Union with Pagination
    getDoctors: async (locationId, page = 1, pageSize = 12) => {
        if (!locationId) return { data: [], count: 0 };
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
            .from('doctors')
            .select('*', { count: 'exact' })
            .eq('location_id', locationId)
            .order('name', { ascending: true })
            .range(from, to);
        
        if (error) throw error;
        return { data: data || [], count: count || 0 };
    },

    // 2. Get Ambulances for a specific Union with Pagination
    getAmbulances: async (locationId, page = 1, pageSize = 12) => {
        if (!locationId) return { data: [], count: 0 };
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
            .from('ambulances')
            .select('*', { count: 'exact' })
            .eq('location_id', locationId)
            .order('provider', { ascending: true })
            .range(from, to);
        
        if (error) throw error;
        return { data: data || [], count: count || 0 };
    },

    // 3. Get Pharmacies for a specific Union with Pagination
    getPharmacies: async (locationId, page = 1, pageSize = 12) => {
        if (!locationId) return { data: [], count: 0 };
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
            .from('pharmacies')
            .select('*', { count: 'exact' })
            .eq('location_id', locationId)
            .order('name', { ascending: true })
            .range(from, to);
        
        if (error) throw error;
        return { data: data || [], count: count || 0 };
    }
};

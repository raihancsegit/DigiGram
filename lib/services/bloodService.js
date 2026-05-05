import { supabase } from '../utils/supabase';

/**
 * Service to manage Blood Bank operations (Donors Search & Registration)
 */
export const bloodService = {
    // 1. Get all donors with advanced filtering and pagination
    getDonors: async ({ bloodGroup = 'All', locationId = 'All', searchTerm = '', page = 1, pageSize = 12 } = {}) => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('blood_donors')
            .select('*', { count: 'exact' })
            .order('name', { ascending: true });

        // Filter by Blood Group
        if (bloodGroup !== 'All') {
            query = query.eq('blood_group', bloodGroup);
        }

        // Filter by Location (Union)
        if (locationId !== 'All') {
            query = query.eq('location_id', locationId);
        }

        // Search by Name or Village
        if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%,village.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query.range(from, to);
        if (error) throw error;
        return { data, count };
    },

    // 2. Register a new donor
    registerDonor: async (donorData) => {
        const { data, error } = await supabase
            .from('blood_donors')
            .insert([{
                name: donorData.name,
                blood_group: donorData.bloodGroup,
                phone: donorData.phone,
                village: donorData.village,
                location_id: donorData.locationId,
                is_available: true
            }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // 3. Update donation status (after a successful donation)
    logDonation: async (donorId) => {
        // Fetch current donation count first
        const { data: donor } = await supabase
            .from('blood_donors')
            .select('total_donations')
            .eq('id', donorId)
            .single();

        const { data, error } = await supabase
            .from('blood_donors')
            .update({ 
                total_donations: (donor?.total_donations || 0) + 1,
                last_donation_date: new Date().toISOString(),
                is_available: false // Set to unavailable immediately after donating
            })
            .eq('id', donorId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

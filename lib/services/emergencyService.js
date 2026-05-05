import { supabase } from '../utils/supabase';

export const emergencyService = {
    // Get contacts for a specific location (Union) with Pagination
    getContacts: async (locationId, page = 1, pageSize = 20) => {
        if (!locationId) return { data: [], count: 0 };

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
            .from('emergency_contacts')
            .select('*', { count: 'exact' })
            .eq('location_id', locationId)
            .order('category', { ascending: true })
            .range(from, to);
        
        if (error) throw error;
        return { data, count };
    },
// ... rest of the file

    // Add a new contact
    addContact: async (contactData) => {
        const { data, error } = await supabase
            .from('emergency_contacts')
            .insert([contactData])
            .select();
        
        if (error) throw error;
        return data[0];
    },

    // Delete a contact
    deleteContact: async (id) => {
        const { error } = await supabase
            .from('emergency_contacts')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    },

    // Update a contact
    updateContact: async (id, updateData) => {
        const { data, error } = await supabase
            .from('emergency_contacts')
            .update(updateData)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    }
};

'use server';

import { supabaseAdmin } from '@/lib/utils/supabase-admin';

/**
 * Creates a village using Admin client to bypass RLS.
 */
export async function createVillageAction(wardId, villagePayload) {
    try {
        const { data, error } = await supabaseAdmin
            .from('locations')
            .insert([{
                ...villagePayload,
                parent_id: wardId,
                type: 'village',
                created_at: new Date(),
                updated_at: new Date()
            }])
            .select()
            .single();

        if (error) {
            console.error("Error creating village:", error);
            throw new Error(error.message);
        }
        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Updates a village using Admin client.
 */
export async function updateVillageAction(id, villagePayload) {
    try {
        const { data, error } = await supabaseAdmin
            .from('locations')
            .update({
                ...villagePayload,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error("Error updating village:", error);
            throw new Error(error.message);
        }
        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Deletes a village using Admin client.
 */
export async function deleteVillageAction(id) {
    try {
        const { error } = await supabaseAdmin
            .from('locations')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting village:", error);
            throw new Error(error.message);
        }
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Updates ward stats using Admin client.
 */
export async function updateWardStatsAction(wardId, stats) {
    try {
        const { data, error } = await supabaseAdmin
            .from('locations')
            .update({ 
                stats, 
                updated_at: new Date() 
            })
            .eq('id', wardId)
            .select()
            .single();
        
        if (error) {
            console.error("Error updating ward stats:", error);
            throw new Error(error.message);
        }
        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Fetches volunteers for a village using Admin client to bypass RLS.
 */
export async function getVolunteersAction(villageId) {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('role', 'volunteer')
            .eq('access_scope_id', villageId)
            .order('first_name', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (err) {
        console.error("Error fetching volunteers via action:", err);
        return { success: false, error: err.message };
    }
}

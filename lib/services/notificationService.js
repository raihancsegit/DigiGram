import { supabase } from '../utils/supabase';

/**
 * Service to manage role-based and targeted notifications.
 */
export const notificationService = {
    // 1. Fetch notifications for a specific role and scope
    getNotifications: async (role, scopeId = null) => {
        if (!role) return [];

        let query = supabase
            .from('notifications')
            .select('*')
            .or(`role.eq.all,role.eq.${role}`)
            .order('created_at', { ascending: false })
            .limit(20);

        // If a scope is provided (Union/Ward/Village), filter by it or null (global)
        if (scopeId) {
            query = query.or(`scope_id.is.null,scope_id.eq.${scopeId}`);
        } else {
            query = query.is('scope_id', null);
        }

        const { data, error } = await query;
        if (error) {
            console.error("NOTIFICATION_ERROR_MESSAGE:", error.message);
            console.error("NOTIFICATION_ERROR_CODE:", error.code);
            return [];
        }
        return data;
    },

    // 2. Mark a notification as read
    markAsRead: async (notificationId) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) {
            console.error("NOTIFICATION_READ_ERROR:", error.message, "Code:", error.code);
            return false;
        }
        return true;
    },

    // 3. Mark all as read for a role
    markAllAsRead: async (role, scopeId = null) => {
        let query = supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('role', role)
            .eq('is_read', false);

        if (scopeId) {
            query = query.eq('scope_id', scopeId);
        }

        const { error } = await query;
        if (error) {
            console.error("NOTIFICATION_ALL_READ_ERROR:", error.message, "Code:", error.code);
            return false;
        }
        return true;
    },

    // 4. Create a new notification (Internal/Admin use)
    createNotification: async ({ title, message, role = 'all', scope_id = null, type = 'info', link = null, user_id = null }) => {
        const { data, error } = await supabase
            .from('notifications')
            .insert([{
                title,
                message,
                role,
                scope_id,
                type,
                link,
                user_id,
                is_read: false
            }]);

        if (error) {
            console.error("NOTIFICATION_CREATE_ERROR:", error.message, "Code:", error.code);
            return null;
        }
        return data;
    },

    // 5. Subscribe to real-time notifications
    subscribeToNotifications: (role, scopeId, callback) => {
        return supabase
            .channel('notifications-channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `role=in.(all,${role})`
                },
                (payload) => {
                    // Check scope if necessary
                    if (!payload.new.scope_id || payload.new.scope_id === scopeId) {
                        callback(payload.new);
                    }
                }
            )
            .subscribe();
    }
};

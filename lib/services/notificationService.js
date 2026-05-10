import { supabase } from '../utils/supabase';

export const notificationService = {
    async getUnreadNotifications(userId) {
        if (!userId) return [];
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .eq('is_read', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
        return data || [];
    },

    async markAsRead(notificationId) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) console.error('Error marking notification read:', error);
    },

    async createNotification({ user_id, type, title, message, reference_id = null }) {
        const { error } = await supabase
            .from('notifications')
            .insert([{ user_id, type, title, message, reference_id }]);

        if (error) console.error('Error creating notification:', error);
    }
};

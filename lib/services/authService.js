import { supabase } from '@/lib/utils/supabase';

/**
 * Handles all Authentication and Profile related operations.
 */
export const authService = {
    // 1. Admin Login (Email/Password)
    loginWithEmail: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;

        // Fetch Profile
        const profile = await authService.getProfile(data.user.id);
        return { user: data.user, profile };
    },

    // 2. Social Login (Google/Facebook)
    loginWithSocial: async (provider) => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
        return data;
    },

    // 3. Fetch User Profile (Role & Scope)
    getProfile: async (userId) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error("Error fetching profile:", error);
            return null;
        }
        return data;
    },

    getCurrentSessionProfile: async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session?.user) return { session: null, profile: null };

        const profile = await authService.getProfile(session.user.id);
        return { session, profile };
    },

    // 4. Logout
    logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    // 5. Update Password
    updatePassword: async (newPassword) => {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
        return data;
    },

    // 6. Upload Avatar to Storage via API Bridge
    uploadAvatar: async (userId, file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', userId);

            const response = await fetch('/api/admin/upload-avatar', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.error?.includes('Bucket not found')) {
                    throw new Error(`'avatars' বাকেটটি পাওয়া যায়নি। আপনার Supabase Storage-এ গিয়ে 'avatars' নামে একটি Public Bucket তৈরি করুন।`);
                }
                throw new Error(result.error || 'Upload failed');
            }

            return result.publicUrl;
        } catch (error) {
            console.error('Upload avatar error:', error);
            throw error;
        }
    }
};

import { supabase } from '@/lib/utils/supabase';

export async function authenticatedFetch(input, init = {}) {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    const token = data.session?.access_token;
    if (!token) {
        throw new Error('Your session has expired. Please log in again.');
    }

    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    return fetch(input, {
        ...init,
        headers
    });
}

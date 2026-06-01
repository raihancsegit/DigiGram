import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
        console.error('Supabase configuration missing in environmental variables. Please check your .env.local file.');
    }
}

// Provide a fallback dummy URL during build if environment variable is missing
const effectiveUrl = supabaseUrl || 'https://placeholder.supabase.co';
const effectiveAnonKey = supabaseAnonKey || 'placeholder';

const createBrowserClient = () => createClient(effectiveUrl, effectiveAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    }
});

const getBrowserClient = () => {
    if (typeof window === 'undefined') return createBrowserClient();

    window.__digigramSupabaseClient ??= createBrowserClient();
    return window.__digigramSupabaseClient;
};

export const supabase = getBrowserClient();

// Public client for reading public data like donation projects
// On the browser we reuse the main singleton to avoid multiple GoTrue clients
// competing for the same auth storage key. On the server, use service role if available.
export const supabasePublic = typeof window === 'undefined'
    ? createClient(effectiveUrl, supabaseServiceKey || effectiveAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        }
    })
    : supabase;

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
        console.error('Supabase configuration missing in environmental variables. Please check your .env.local file.');
    }
}

// Create a single supabase client instance
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // In some development environments, the browser's Lock API can cause deadlocks
        // We can optionally disable it if issues persist, but first we ensure valid URL/Key
    }
});

// Public client for reading public data like donation projects
// Use the service role on server if available, otherwise fall back to anon.
const publicKey = typeof window === 'undefined'
    ? (supabaseServiceKey || supabaseAnonKey)
    : supabaseAnonKey;

export const supabasePublic = createClient(supabaseUrl || '', publicKey || '', {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

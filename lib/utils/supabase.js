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

export const supabase = createClient(effectiveUrl, supabaseAnonKey || 'placeholder', {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    }
});

// Public client for reading public data like donation projects
// Use the service role on server if available, otherwise fall back to anon.
const publicKey = typeof window === 'undefined'
    ? (supabaseServiceKey || supabaseAnonKey)
    : supabaseAnonKey;

export const supabasePublic = createClient(effectiveUrl, publicKey || 'placeholder', {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

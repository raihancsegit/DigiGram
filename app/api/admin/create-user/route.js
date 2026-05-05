import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password, first_name, last_name, phone, role, access_scope_id } = body;

        if (!email || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Step 1: Create User using Admin Auth API (No email confirmation needed for admins)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email.trim(),
            password: password,
            email_confirm: true, // Automatically confirm email
            user_metadata: { first_name, last_name, phone }
        });

        if (authError) {
            console.error('Auth Error:', authError);
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        const user = authData.user;

        // Step 2: Create/Update Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: user.id,
                email: email.trim(),
                first_name,
                last_name,
                phone,
                role,
                access_scope_id: access_scope_id || null,
                permissions: body.permissions || {}
            });

        if (profileError) {
            console.error('Profile Error:', profileError);
            // Even if profile fails, user was created, but we should report the error
            return NextResponse.json({ 
                error: 'User created but profile setup failed: ' + profileError.message,
                userId: user.id 
            }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'User and Profile created successfully',
            user: { id: user.id, email: user.email }
        });

    } catch (err) {
        console.error('Route error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

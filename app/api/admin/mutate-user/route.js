import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { id, action, updates } = body;

        if (!id || !action) {
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

        if (action === 'deassign') {
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .update({
                    role: 'student',
                    access_scope_id: null,
                    updated_at: new Date()
                })
                .eq('id', id)
                .select()
                .maybeSingle();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (action === 'update_profile') {
            const { password, ...profileUpdates } = updates || {};

            if (password) {
                const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(id, {
                    password
                });
                if (passwordError) throw passwordError;
            }

            const { data, error } = await supabaseAdmin
                .from('profiles')
                .update({
                    ...profileUpdates,
                    updated_at: new Date()
                })
                .eq('id', id)
                .select()
                .maybeSingle();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (action === 'delete') {
            // Delete from Auth AND Profile (Cascade handles profile usually but let's be explicit)
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
            if (authError) throw authError;

            return NextResponse.json({ success: true, message: 'User deleted successfully' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (err) {
        console.error('Mutate User Route Error Detail:', {
            message: err.message,
            stack: err.stack
        });
        return NextResponse.json({ 
            error: err.message || 'Internal Server Error',
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined 
        }, { status: 500 });
    }
}

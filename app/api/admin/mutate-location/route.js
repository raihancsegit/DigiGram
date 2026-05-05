import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { id, action, updates } = body;

        if (!id || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Initialize Supabase Admin Client (Server Side)
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

        if (action === 'delete') {
            const { data, error } = await supabaseAdmin
                .from('locations')
                .delete()
                .eq('id', id)
                .select();

            if (error) throw error;
            if (!data || data.length === 0) {
                return NextResponse.json({ error: 'No record found to delete' }, { status: 404 });
            }
            return NextResponse.json({ success: true, message: 'Location deleted successfully' });
        }

        if (action === 'update') {
            const { data, error } = await supabaseAdmin
                .from('locations')
                .update({
                    ...updates,
                    updated_at: new Date()
                })
                .eq('id', id)
                .select()
                .maybeSingle();

            if (error) throw error;
            if (!data) {
                return NextResponse.json({ error: 'No record found to update' }, { status: 404 });
            }
            return NextResponse.json({ success: true, data });
        }

        if (action === 'create') {
            const { data, error } = await supabaseAdmin
                .from('locations')
                .insert([{
                    ...updates,
                    created_at: new Date(),
                    updated_at: new Date()
                }])
                .select()
                .maybeSingle();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (err) {
        console.error('Mutate Location Route Error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}

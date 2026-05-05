import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { action, locationId, serviceId, isActive, relationId, config } = body;

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

        if (action === 'toggle') {
            const { data, error } = await supabaseAdmin
                .from('location_services')
                .upsert({
                    location_id: locationId,
                    service_id: serviceId,
                    is_active: isActive
                }, { 
                    onConflict: 'location_id,service_id' 
                })
                .select()
                .maybeSingle();
            
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (action === 'update_config') {
            const { data, error } = await supabaseAdmin
                .from('location_services')
                .update({ 
                    config
                })
                .eq('id', relationId)
                .select()
                .maybeSingle();
            
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (err) {
        console.error('Mutate Service Route Error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { action, projectData, projectId, settings, unionSlug, donationId } = body;

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

        if (action === 'save_project') {
            const dataToSave = {
                ...projectData,
                updated_at: new Date()
            };
            if (projectData.id || projectId) {
                const id = projectData.id || projectId;
                const { data, error } = await supabaseAdmin
                    .from('donation_projects')
                    .update(dataToSave)
                    .eq('id', id)
                    .select()
                    .maybeSingle();
                
                if (error) throw error;
                return NextResponse.json({ success: true, data });
            } else {
                const { data, error } = await supabaseAdmin
                    .from('donation_projects')
                    .insert([dataToSave])
                    .select()
                    .maybeSingle();
                
                if (error) throw error;
                return NextResponse.json({ success: true, data });
            }
        }

        if (action === 'delete_project') {
            const { error } = await supabaseAdmin
                .from('donation_projects')
                .delete()
                .eq('id', projectId);
            
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'save_settings') {
            // Check if exists
            const { data: existing } = await supabaseAdmin
                .from('donation_settings')
                .select('union_slug')
                .eq('union_slug', unionSlug)
                .maybeSingle();

            if (existing) {
                const { data, error } = await supabaseAdmin
                    .from('donation_settings')
                    .update({ ...settings, updated_at: new Date() })
                    .eq('union_slug', unionSlug)
                    .select()
                    .maybeSingle();
                
                if (error) throw error;
                return NextResponse.json({ success: true, data });
            } else {
                const { data, error } = await supabaseAdmin
                    .from('donation_settings')
                    .insert([{ ...settings, union_slug: unionSlug, updated_at: new Date() }])
                    .select()
                    .maybeSingle();
                
                if (error) throw error;
                return NextResponse.json({ success: true, data });
            }
        }

        if (action === 'verify_donation') {
            // 1. Get donation details
            const { data: donation, error: dError } = await supabaseAdmin
                .from('donation_ledger')
                .select('*')
                .eq('id', donationId)
                .single();
            
            if (dError) throw dError;
            if (donation.status === 'verified') {
                return NextResponse.json({ error: 'Already verified' }, { status: 400 });
            }

            // 2. Update donation status
            const { error: uError } = await supabaseAdmin
                .from('donation_ledger')
                .update({ status: 'verified' })
                .eq('id', donationId);
            
            if (uError) throw uError;

            // 3. Increment project raised_amount if linked to a project
            if (donation.project_id) {
                const { data: project } = await supabaseAdmin
                    .from('donation_projects')
                    .select('raised_amount')
                    .eq('id', donation.project_id)
                    .single();
                
                if (project) {
                    await supabaseAdmin
                        .from('donation_projects')
                        .update({ 
                            raised_amount: (project.raised_amount || 0) + donation.amount 
                        })
                        .eq('id', donation.project_id);
                }
            }
            
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (err) {
        console.error('Mutate Donation Route Error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}

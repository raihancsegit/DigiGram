import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function matchesLocationVillage(village, locationVillage) {
    const names = [
        locationVillage?.name_bn,
        locationVillage?.name_en,
        locationVillage?.name
    ].filter(Boolean);

    return names.includes(village.bn_name) || names.includes(village.name);
}

export async function POST(request) {
    try {
        const { wardId, locationVillage = null } = await request.json();

        if (!wardId) {
            return NextResponse.json({ error: 'wardId is required' }, { status: 400 });
        }

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

        const { data: existingVillages, error: existingError } = await supabaseAdmin
            .from('villages')
            .select('*')
            .eq('ward_id', wardId);

        if (existingError) throw existingError;

        const { data: locationVillages, error: locationError } = await supabaseAdmin
            .from('locations')
            .select('*')
            .eq('parent_id', wardId)
            .eq('type', 'village')
            .order('name_bn', { ascending: true });

        if (locationError) throw locationError;

        const sourceVillages = locationVillage?.id ? [locationVillage] : (locationVillages || []);
        const missing = sourceVillages.filter((locVillage) => (
            !(existingVillages || []).some((village) => matchesLocationVillage(village, locVillage))
        ));

        let inserted = [];
        if (missing.length > 0) {
            const rows = missing.map((locVillage) => ({
                ward_id: wardId,
                name: locVillage.name_en || locVillage.name || locVillage.name_bn,
                bn_name: locVillage.name_bn || locVillage.name || locVillage.name_en,
                para_name: 'মূল গ্রাম',
                total_estimated_houses: 0
            }));

            const { data, error } = await supabaseAdmin
                .from('villages')
                .insert(rows)
                .select();

            if (error) throw error;
            inserted = data || [];
        }

        const allVillages = [...(existingVillages || []), ...inserted];
        const syncedVillage = locationVillage?.id
            ? allVillages.find((village) => matchesLocationVillage(village, locationVillage)) || null
            : null;

        return NextResponse.json({
            success: true,
            data: {
                villages: allVillages,
                village: syncedVillage
            }
        });
    } catch (err) {
        console.error('Sync household villages error:', err);
        return NextResponse.json({
            error: err.message || 'Failed to sync household villages'
        }, { status: 500 });
    }
}

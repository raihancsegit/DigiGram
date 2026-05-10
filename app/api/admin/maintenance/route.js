import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function slugify(text) {
    return text.toString().toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { action } = body;

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        if (action === 'wipe') {
            console.log('Starting full wipe...');
            // Delete in correct order (child first)
            await supabaseAdmin.from('residents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabaseAdmin.from('households').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabaseAdmin.from('villages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            
            // Delete Unions, Wards, Villages from locations
            await supabaseAdmin.from('locations').delete().in('type', ['union', 'ward', 'village']);

            return NextResponse.json({ success: true, message: 'All test data wiped successfully' });
        }

        if (action === 'seed') {
            const upazilaId = '86947c42-8ad3-464c-bb44-52466193ae3b'; // Parent Upazila
            
            const suffix = Math.random().toString(36).substring(2, 6);
            console.log('Starting seed process with suffix:', suffix);

            for (let i = 1; i <= 4; i++) {
                // Create Union
                const unionName = `TEST-Union ${i}`;
                const { data: union, error: uErr } = await supabaseAdmin.from('locations').insert([{
                    name_en: unionName,
                    name_bn: `টেস্ট ইউনিয়ন ${i}`,
                    type: 'union',
                    parent_id: upazilaId,
                    slug: `${slugify(unionName)}-${suffix}`,
                    survey_status: 'verified'
                }]).select().single();

                if (uErr) throw uErr;

                for (let j = 1; j <= 6; j++) {
                    // Create Ward
                    const wardName = `TEST-Ward ${j}`;
                    const { data: ward, error: wErr } = await supabaseAdmin.from('locations').insert([{
                        name_en: wardName,
                        name_bn: `ওয়ার্ড ${j}`,
                        type: 'ward',
                        parent_id: union.id,
                        slug: `${union.slug}-ward-${j}`,
                        survey_status: 'verified'
                    }]).select().single();

                    if (wErr) throw wErr;

                    for (let k = 1; k <= 2; k++) {
                        const vChar = k === 1 ? 'A' : 'B';
                        const villageName = `TEST-Village ${vChar}`;
                        
                        // Create Village in locations
                        const { data: locVillage, error: lvErr } = await supabaseAdmin.from('locations').insert([{
                            name_en: villageName,
                            name_bn: `গ্রাম ${vChar}`,
                            type: 'village',
                            parent_id: ward.id,
                            slug: `${ward.slug}-v-${vChar.toLowerCase()}`,
                            survey_status: 'verified'
                        }]).select().single();

                        if (lvErr) throw lvErr;

                        // Create Village in villages table (mirror)
                        const { data: vTable, error: vtErr } = await supabaseAdmin.from('villages').insert([{
                            ward_id: ward.id,
                            name: villageName,
                            bn_name: `গ্রাম ${vChar}`,
                            para_name: 'মূল পাড়া',
                            survey_status: 'verified'
                        }]).select().single();

                        if (vtErr) throw vtErr;

                        // Bulk Create 50 Households
                        const households = [];
                        for (let h = 1; h <= 50; h++) {
                            households.push({
                                village_id: vTable.id,
                                ward_id: ward.id,
                                house_no: h.toString(),
                                owner_name: `Head ${h}`,
                                phone: `017000000${h.toString().padStart(2, '0')}`,
                                religion: 'Islam',
                                housing_type: 'pucka'
                            });
                        }

                        const { data: createdHouseholds, error: hErr } = await supabaseAdmin
                            .from('households')
                            .insert(households)
                            .select();

                        if (hErr) throw hErr;

                        // For each household, create 1-3 residents
                        const residents = [];
                        createdHouseholds.forEach(house => {
                            const count = Math.floor(Math.random() * 3) + 1;
                            for (let r = 1; r <= count; r++) {
                                residents.push({
                                    household_id: house.id,
                                    name: `Resident ${r} of House ${house.house_no}`,
                                    bn_name: `সদস্য ${r}`,
                                    gender: r === 1 ? 'male' : 'female',
                                    is_voter: true,
                                    blood_group: 'A+',
                                    dob: '1990-01-01',
                                    relation_with_head: r === 1 ? 'Head' : 'Member'
                                });
                            }
                        });

                        const { error: rErr } = await supabaseAdmin.from('residents').insert(residents);
                        if (rErr) throw rErr;
                    }
                }
            }

            return NextResponse.json({ success: true, message: 'All test data generated successfully' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (err) {
        console.error('Maintenance Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

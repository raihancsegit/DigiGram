import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

export async function GET() {
    try {
        const supabaseAdmin = createAdminClient();

        const [
            legacyVolunteerRows,
            householdsMissingLocationVillage,
            householdsUsingLegacyVolunteer,
            householdsMissingCreator,
            documentsMissingPrivatePath,
            volunteerProfiles,
            missingVillageHouseholdRows,
            legacyLinkedHouseholdRows,
            missingCreatorHouseholdRows,
            missingPrivatePathDocumentRows,
            assignableProfiles,
            locationVillages
        ] = await Promise.all([
            supabaseAdmin.from('volunteers').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('households').select('*', { count: 'exact', head: true }).is('location_village_id', null),
            supabaseAdmin.from('households').select('*', { count: 'exact', head: true }).not('added_by_volunteer_id', 'is', null),
            supabaseAdmin.from('households').select('*', { count: 'exact', head: true }).is('added_by_user_id', null),
            supabaseAdmin.from('household_documents').select('*', { count: 'exact', head: true }).is('file_path', null),
            supabaseAdmin
                .from('profiles')
                .select('id, first_name, last_name, phone, email, access_scope_id')
                .eq('role', 'volunteer'),
            supabaseAdmin
                .from('households')
                .select('id, owner_name, house_no, ward_id, village:villages(name, bn_name), ward:locations(name_bn)')
                .is('location_village_id', null)
                .order('created_at', { ascending: false })
                .limit(10),
            supabaseAdmin
                .from('households')
                .select('id, owner_name, house_no, added_by_volunteer_id, village:villages(name, bn_name)')
                .not('added_by_volunteer_id', 'is', null)
                .order('created_at', { ascending: false })
                .limit(10),
            supabaseAdmin
                .from('households')
                .select('id, owner_name, house_no, village:villages(name, bn_name)')
                .is('added_by_user_id', null)
                .order('created_at', { ascending: false })
                .limit(10),
            supabaseAdmin
                .from('household_documents')
                .select('id, title, type, household_id, household:households(owner_name, house_no)')
                .is('file_path', null)
                .order('created_at', { ascending: false })
                .limit(10),
            supabaseAdmin
                .from('profiles')
                .select('id, first_name, last_name, phone, email, role')
                .in('role', ['volunteer', 'ward_member', 'chairman', 'super_admin'])
                .order('first_name', { ascending: true })
                .limit(200),
            supabaseAdmin
                .from('locations')
                .select('id, name_bn, name_en, parent_id')
                .eq('type', 'village')
                .order('name_bn', { ascending: true })
        ]);

        const scopedProfiles = volunteerProfiles.data || [];
        const scopeIds = scopedProfiles.map((profile) => profile.access_scope_id).filter(Boolean);
        let locationTypes = new Map();

        if (scopeIds.length > 0) {
            const { data: scopedLocations, error: scopedLocationError } = await supabaseAdmin
                .from('locations')
                .select('id, type')
                .in('id', scopeIds);

            if (scopedLocationError) throw scopedLocationError;
            locationTypes = new Map((scopedLocations || []).map((location) => [location.id, location.type]));
        }

        const badVolunteerScopeCount = scopedProfiles.filter((profile) => (
            !profile.access_scope_id || locationTypes.get(profile.access_scope_id) !== 'village'
        )).length;
        const badVolunteerScopeRows = scopedProfiles
            .filter((profile) => !profile.access_scope_id || locationTypes.get(profile.access_scope_id) !== 'village')
            .slice(0, 10);

        return NextResponse.json({
            success: true,
            data: {
                legacyVolunteerRows: legacyVolunteerRows.count || 0,
                householdsMissingLocationVillage: householdsMissingLocationVillage.count || 0,
                householdsUsingLegacyVolunteer: householdsUsingLegacyVolunteer.count || 0,
                householdsMissingCreator: householdsMissingCreator.count || 0,
                documentsMissingPrivatePath: documentsMissingPrivatePath.count || 0,
                volunteersWithoutVillageScope: badVolunteerScopeCount,
                details: {
                    missingVillageHouseholds: missingVillageHouseholdRows.data || [],
                    legacyLinkedHouseholds: legacyLinkedHouseholdRows.data || [],
                    missingCreatorHouseholds: missingCreatorHouseholdRows.data || [],
                    documentsMissingPrivatePath: missingPrivatePathDocumentRows.data || [],
                    volunteersWithoutVillageScope: badVolunteerScopeRows
                },
                options: {
                    assignableProfiles: assignableProfiles.data || [],
                    locationVillages: locationVillages.data || []
                }
            }
        });
    } catch (err) {
        console.error('Maintenance audit error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { action } = body;

        const supabaseAdmin = createAdminClient();

        if (action === 'wipe') {
            console.log('Starting full wipe...');
            await supabaseAdmin.from('residents').delete().neq('id', '0');
            await supabaseAdmin.from('households').delete().neq('id', '0');
            await supabaseAdmin.from('villages').delete().neq('id', '0');
            await supabaseAdmin.from('local_news').delete().neq('id', '0');
            await supabaseAdmin.from('donation_projects').delete().neq('id', '0');
            await supabaseAdmin.from('markets').delete().neq('id', '0');
            await supabaseAdmin.from('location_services').delete().neq('location_id', '0');
            
            // Wipe locations from bottom up
            await supabaseAdmin.from('locations').delete().eq('type', 'village');
            await supabaseAdmin.from('locations').delete().eq('type', 'ward');
            await supabaseAdmin.from('locations').delete().eq('type', 'union');
            await supabaseAdmin.from('locations').delete().eq('type', 'upazila');
            await supabaseAdmin.from('locations').delete().eq('type', 'district');

            const { data: nonAdmins } = await supabaseAdmin.from('profiles').select('id').neq('role', 'super_admin');
            if (nonAdmins) {
                for (const p of nonAdmins) {
                    try { await supabaseAdmin.auth.admin.deleteUser(p.id); } catch(e) {}
                }
            }
            return NextResponse.json({ success: true, message: 'সব ডাটা মুছে ফেলা হয়েছে।' });
        }

        if (action === 'repair_migration_links') {
            const { error: villageRepairError } = await supabaseAdmin.rpc('repair_household_location_village_links');
            if (villageRepairError) throw villageRepairError;

            const { error: creatorRepairError } = await supabaseAdmin.rpc('repair_household_creator_links');
            if (creatorRepairError) throw creatorRepairError;

            return NextResponse.json({
                success: true,
                message: 'নিরাপদ migration repair চালানো হয়েছে।'
            });
        }

        if (action === 'assign_volunteer_scope') {
            const { profileId, villageId } = body;
            if (!profileId || !villageId) {
                return NextResponse.json({ error: 'profileId and villageId are required' }, { status: 400 });
            }

            const { data: village, error: villageError } = await supabaseAdmin
                .from('locations')
                .select('id, type')
                .eq('id', villageId)
                .eq('type', 'village')
                .maybeSingle();

            if (villageError) throw villageError;
            if (!village) return NextResponse.json({ error: 'Village not found' }, { status: 404 });

            const { error } = await supabaseAdmin
                .from('profiles')
                .update({ access_scope_id: village.id, updated_at: new Date() })
                .eq('id', profileId)
                .eq('role', 'volunteer');

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Volunteer village scope আপডেট হয়েছে।' });
        }

        if (action === 'assign_household_creator') {
            const { householdId, profileId } = body;
            if (!householdId || !profileId) {
                return NextResponse.json({ error: 'householdId and profileId are required' }, { status: 400 });
            }

            const { error } = await supabaseAdmin
                .from('households')
                .update({ added_by_user_id: profileId, updated_at: new Date() })
                .eq('id', householdId);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Household creator link আপডেট হয়েছে।' });
        }

        if (action === 'assign_household_location_village') {
            const { householdId, villageId } = body;
            if (!householdId || !villageId) {
                return NextResponse.json({ error: 'householdId and villageId are required' }, { status: 400 });
            }

            const { data: household, error: householdError } = await supabaseAdmin
                .from('households')
                .select('id, ward_id')
                .eq('id', householdId)
                .maybeSingle();

            if (householdError) throw householdError;
            if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 });

            const { data: village, error: villageError } = await supabaseAdmin
                .from('locations')
                .select('id, parent_id, type')
                .eq('id', villageId)
                .eq('type', 'village')
                .maybeSingle();

            if (villageError) throw villageError;
            if (!village || village.parent_id !== household.ward_id) {
                return NextResponse.json({ error: 'Village must belong to the same ward as the household' }, { status: 400 });
            }

            const { error } = await supabaseAdmin
                .from('households')
                .update({ location_village_id: village.id, updated_at: new Date() })
                .eq('id', householdId);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Household village mapping আপডেট হয়েছে।' });
        }

        if (action === 'seed') {
            console.log('Starting full hierarchy seed...');

            // 1. District: Rajshahi
            const { data: district } = await supabaseAdmin.from('locations').upsert({
                id: '11111111-1111-1111-1111-111111111111',
                slug: 'rajshahi',
                name_en: 'Rajshahi',
                name_bn: 'রাজশাহী',
                type: 'district',
                parent_id: null
            }, { onConflict: 'slug' }).select().single();

            // 2. Upazila: Poba
            const { data: upazila } = await supabaseAdmin.from('locations').upsert({
                id: '22222222-2222-2222-2222-222222222222',
                slug: 'poba-upazila',
                name_en: 'Poba',
                name_bn: 'পবা',
                type: 'upazila',
                parent_id: district.id
            }, { onConflict: 'slug' }).select().single();

            // --- Create Test Users ---
            const createTestUser = async (email, role, firstName) => {
                const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
                    email, password: 'password123', email_confirm: true
                });
                if (authErr && authErr.message.includes('already exists')) {
                    const { data: existing } = await supabaseAdmin.from('profiles').select('id').eq('email', email).single();
                    return existing?.id;
                }
                if (authUser?.user) {
                    await supabaseAdmin.from('profiles').update({
                        first_name: firstName,
                        role: role,
                        phone: '01700000000'
                    }).eq('id', authUser.user.id);
                    return authUser.user.id;
                }
                return null;
            };

            const chairmanId = await createTestUser('chairman@test.com', 'chairman', 'চেয়ারম্যান');
            const volunteerId = await createTestUser('volunteer@test.com', 'volunteer', 'ভলান্টিয়ার');

            for (let i = 1; i <= 4; i++) {
                // 3. Union
                const unionSlug = `test-union-${i}`;
                const { data: union } = await supabaseAdmin.from('locations').upsert({
                    name_en: `Union ${i}`,
                    name_bn: `ইউনিয়ন ${i}`,
                    type: 'union',
                    parent_id: upazila.id,
                    slug: unionSlug
                }, { onConflict: 'slug' }).select().single();

                // Assign chairman to first union
                if (chairmanId && i === 1) {
                    await supabaseAdmin.from('profiles').update({ access_scope_id: union.id }).eq('id', chairmanId);
                }

                await supabaseAdmin.from('markets').insert([{
                    name: `ইউনিয়ন বাজার ${i}`,
                    union_id: union.id,
                    status: 'active'
                }]);

                for (let j = 1; j <= 6; j++) {
                    // 4. Ward
                    const wardSlug = `${unionSlug}-ward-${j}`;
                    const { data: ward } = await supabaseAdmin.from('locations').upsert({
                        name_en: `Ward ${j}`,
                        name_bn: `ওয়ার্ড ${j}`,
                        type: 'ward',
                        parent_id: union.id,
                        slug: wardSlug
                    }, { onConflict: 'slug' }).select().single();

                    // Assign volunteer to first ward of first union
                    if (volunteerId && i === 1 && j === 1) {
                        await supabaseAdmin.from('profiles').update({ access_scope_id: ward.id }).eq('id', volunteerId);
                    }

                    for (let k = 1; k <= 2; k++) {
                        // 5. Village (Location)
                        const vChar = k === 1 ? 'A' : 'B';
                        const vSlug = `${wardSlug}-v-${vChar.toLowerCase()}`;
                        
                        const { data: locVillage } = await supabaseAdmin.from('locations').upsert({
                            name_en: `Village ${vChar}`,
                            name_bn: `গ্রাম ${vChar}`,
                            type: 'village',
                            parent_id: ward.id,
                            slug: vSlug
                        }, { onConflict: 'slug' }).select().single();

                        // 6. Village (Table)
                        const { data: vTable } = await supabaseAdmin.from('villages').insert([{
                            ward_id: ward.id,
                            name: `Village ${vChar}`,
                            bn_name: `গ্রাম ${vChar}`
                        }]).select().single();

                        const households = [];
                        for (let h = 1; h <= 5; h++) {
                            households.push({
                                village_id: vTable.id,
                                ward_id: ward.id,
                                owner_name: `Owner ${h}`,
                                house_no: h.toString()
                            });
                        }
                        const { data: createdH } = await supabaseAdmin.from('households').insert(households).select();

                        const residents = [];
                        createdH.forEach(house => {
                            for (let r = 1; r <= 3; r++) {
                                residents.push({
                                    household_id: house.id,
                                    name: `Resident ${r}`,
                                    gender: r === 1 ? 'Male' : 'Female',
                                    relation_with_head: r === 1 ? 'Head' : 'Member'
                                });
                            }
                        });
                        await supabaseAdmin.from('residents').insert(residents);
                    }
                }
            }
            return NextResponse.json({ success: true, message: 'রাজশাহী জেলা ও পবা উপজেলার আন্ডারে ডাটা তৈরি হয়েছে।' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (err) {
        console.error('Maintenance Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

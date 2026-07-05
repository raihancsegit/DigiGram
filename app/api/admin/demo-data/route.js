import { NextResponse } from 'next/server';
import { requireRequestProfile } from '@/lib/utils/server-auth';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { repairMojibakeText } from '@/lib/utils/textEncoding';

export const dynamic = 'force-dynamic';

const DEMO_PHONE = '01700009999';
const OPTIONAL_SCHEMA_ERRORS = new Set(['42P01', '42703', 'PGRST204', 'PGRST205']);

function isOptionalSchemaError(error) {
    return OPTIONAL_SCHEMA_ERRORS.has(error?.code);
}

function batchSuffix() {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function repairDemoPayload(value) {
    if (typeof value === 'string') return repairMojibakeText(value);
    if (Array.isArray(value)) return value.map(repairDemoPayload);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, entry]) => [key, repairDemoPayload(entry)])
        );
    }
    return value;
}

async function registerRecord(batchId, tableName, record, deleteOrder, label) {
    if (!record?.id) return record;
    const { error } = await supabaseAdmin.from('demo_data_records').insert({
        batch_id: batchId,
        table_name: tableName,
        record_id: record.id,
        delete_order: deleteOrder,
        label
    });
    if (error) throw error;
    return record;
}

async function insertTracked(batchId, tableName, payload, deleteOrder, label) {
    const { data, error } = await supabaseAdmin.from(tableName).insert(repairDemoPayload(payload)).select().single();
    if (error) throw error;
    return registerRecord(batchId, tableName, data, deleteOrder, label);
}

async function optionalModule(summary, key, work) {
    try {
        const count = await work();
        summary.modules[key] = { status: 'created', count: Number(count) || 0 };
        summary.created += Number(count) || 0;
    } catch (error) {
        summary.modules[key] = {
            status: isOptionalSchemaError(error) ? 'skipped' : 'failed',
            count: 0,
            reason: error.message
        };
        if (!isOptionalSchemaError(error)) summary.warnings.push(`${key}: ${error.message}`);
    }
}

async function ensureDemoScope(batchId, suffix) {
    const district = await insertTracked(batchId, 'locations', {
        slug: `demo-district-${suffix}`, name_en: 'Demo District', name_bn: 'ডেমো জেলা',
        type: 'district', parent_id: null
    }, 110, 'Demo district');
    const upazila = await insertTracked(batchId, 'locations', {
        slug: `demo-upazila-${suffix}`, name_en: 'Demo Upazila', name_bn: 'ডেমো উপজেলা',
        type: 'upazila', parent_id: district.id
    }, 120, 'Demo upazila');
    const union = await insertTracked(batchId, 'locations', {
        slug: `demo-union-${suffix}`, name_en: 'Demo Union', name_bn: 'ডেমো ইউনিয়ন',
        type: 'union', parent_id: upazila.id
    }, 130, 'Demo union');
    const ward = await insertTracked(batchId, 'locations', {
        slug: `demo-ward-1-${suffix}`, name_en: 'Demo Ward 1', name_bn: 'ডেমো ওয়ার্ড ১',
        type: 'ward', parent_id: union.id
    }, 140, 'Demo ward');

    const villageStats = {
        population: 12, total_members: 12, voters: 8,
        maleVoters: 3, femaleVoters: 5, male_voters: 3, female_voters: 5,
        males: 5, females: 7, total_houses: 4,
        schools: ['Demo High School', 'Demo Kindergarten'],
        mosques: ['Demo Central Mosque', 'Demo Bazar Mosque'],
        madrassas: ['Demo Noorani Madrasa'],
        orphanages: ['Demo Child Care Center'],
        blood_donors: 10, birth_registered: 8, voter_eligible: 2,
        blood_groups: { 'A+': 3, 'B+': 4, 'O+': 3 }
    };
    const secondVillageStats = {
        population: 18, total_members: 18, voters: 10,
        maleVoters: 6, femaleVoters: 4, male_voters: 6, female_voters: 4,
        males: 9, females: 9, total_houses: 4,
        schools: ['Demo College'], mosques: ['Demo East Mosque'], madrassas: [],
        orphanages: [], blood_donors: 5, birth_registered: 12, voter_eligible: 3,
        blood_groups: { 'AB+': 1, 'O+': 4 }
    };

    const villageLocation = await insertTracked(batchId, 'locations', {
        slug: `demo-village-a-${suffix}`, name_en: 'Demo Village A', name_bn: 'ডেমো গ্রাম ক',
        type: 'village', parent_id: ward.id,
        stats: villageStats, real_stats: villageStats, survey_status: 'verified'
    }, 150, 'Demo village location A');
    const secondVillageLocation = await insertTracked(batchId, 'locations', {
        slug: `demo-village-b-${suffix}`, name_en: 'Demo Village B', name_bn: 'ডেমো গ্রাম খ',
        type: 'village', parent_id: ward.id,
        stats: secondVillageStats, real_stats: secondVillageStats, survey_status: 'verified'
    }, 150, 'Demo village location B');

    const village = await insertTracked(batchId, 'villages', {
        ward_id: ward.id,
        name: 'Demo Village A',
        bn_name: 'ডেমো গ্রাম ক',
        total_estimated_houses: 4,
        survey_status: 'verified',
        real_stats: villageStats
    }, 200, 'Demo household village A');
    await insertTracked(batchId, 'villages', {
        ward_id: ward.id,
        name: 'Demo Village B',
        bn_name: 'ডেমো গ্রাম খ',
        total_estimated_houses: 4,
        survey_status: 'verified',
        real_stats: secondVillageStats
    }, 200, 'Demo household village B');

    return { union, ward, villageLocation, secondVillageLocation, village };
}

async function seedHouseholds(batchId, scope, suffix) {
    const households = [];
    const residents = [];
    for (let index = 1; index <= 4; index += 1) {
        const household = await insertTracked(batchId, 'households', {
            village_id: scope.village.id,
            ward_id: scope.ward.id,
            location_village_id: scope.villageLocation.id,
            house_no: `DEMO-${suffix.toUpperCase()}-${index}`,
            owner_name: ['মোঃ রহিম উদ্দিন', 'মোছাঃ সালমা বেগম', 'আব্দুল করিম', 'রোকেয়া খাতুন'][index - 1],
            phone: `${DEMO_PHONE.slice(0, -1)}${index}`,
            lat: 24.45 + index * 0.001,
            lng: 88.61 + index * 0.001,
            electricity_meter: index !== 4,
            latrine_status: index === 4 ? 'unhygienic' : 'hygienic',
            water_source: 'tube-well',
            housing_type: index % 2 ? 'Paka' : 'Tin-shed',
            economic_status: index === 4 ? 'lower' : 'middle',
            qr_code_id: `DEMO-${suffix}-${index}`,
            stats: { total_members: 3, voters: 2, males: 2, females: 1 }
        }, 400, `Demo household ${index}`);
        households.push(household);

        const memberRows = [
            {
                name: household.owner_name, bn_name: household.owner_name, gender: index === 2 || index === 4 ? 'Female' : 'Male',
                relation_with_head: 'self', dob: `198${index}-01-10`, nid: `990000${suffix.slice(-4).replace(/[^0-9]/g, '7')}${index}01`,
                blood_group: index === 4 ? null : 'A+', is_voter: true
            },
            {
                name: `ডেমো সদস্য ${index}-২`, bn_name: `ডেমো সদস্য ${index}-২`, gender: 'Female',
                relation_with_head: 'spouse', dob: `198${index + 1}-05-12`, birth_reg_no: `200000000000${index}02`,
                blood_group: 'B+', is_voter: true
            },
            {
                name: `ডেমো শিশু ${index}`, bn_name: `ডেমো শিশু ${index}`, gender: index % 2 ? 'Male' : 'Female',
                relation_with_head: 'child', dob: `201${index}-08-15`, birth_reg_no: `201000000000${index}03`,
                blood_group: index === 3 ? null : 'O+', is_voter: false
            }
        ];
        for (const member of memberRows) {
            residents.push(await insertTracked(batchId, 'residents', {
                household_id: household.id,
                ...member
            }, 500, `Resident of ${household.house_no}`));
        }
    }
    return { households, residents };
}

async function seedSchool(batchId, scope, suffix) {
    const institution = await insertTracked(batchId, 'institutions', {
        name: 'Demo DigiGram Academy',
        type: 'school',
        category: 'high_school',
        location_id: scope.union.id,
        village_location_id: scope.villageLocation.id,
        village: scope.villageLocation.name_bn,
        subdomain: `demo-school-${suffix}`,
        website_status: 'active',
        portal_features: ['attendance', 'lessons', 'results', 'admission'],
        operational_settings: { academic_year: new Date().getFullYear(), demo: true }
    }, 300, 'Demo school');
    let created = 1;

    await insertTracked(batchId, 'institution_pages', {
        institution_id: institution.id,
        hero_title: institution.name,
        hero_subtitle: 'Demo education, attendance, results and guardian updates in one place.',
        about_text: 'Complete DigiGram demo school website content for testing.',
        contact_phone: DEMO_PHONE,
        contact_email: 'demo.school@example.com',
        address: 'Demo Village A, Demo Union'
    }, 650, 'Demo school website');
    created += 1;
    const schoolClass = await insertTracked(batchId, 'school_classes', {
        institution_id: institution.id,
        name: `Demo Class ${suffix.slice(-3)}`,
        academic_year: new Date().getFullYear(),
        grade_level: 8,
        section: 'à¦•'
    }, 650, 'Demo class');
    created += 1;
    const subject = await insertTracked(batchId, 'school_subjects', {
        institution_id: institution.id,
        class_id: schoolClass.id,
        name: 'à¦¡à§‡à¦®à§‹ à¦—à¦£à¦¿à¦¤'
    }, 700, 'Demo subject');
    created += 1;
    for (let index = 1; index <= 5; index += 1) {
        await insertTracked(batchId, 'school_students', {
            institution_id: institution.id,
            class_id: schoolClass.id,
            student_name: `à¦¡à§‡à¦®à§‹ à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€ ${index}`,
            roll_no: `D${index}`,
            guardian_name: `à¦¡à§‡à¦®à§‹ à¦…à¦­à¦¿à¦­à¦¾à¦¬à¦• ${index}`,
            guardian_phone: `${DEMO_PHONE.slice(0, -1)}${index}`,
            active: true
        }, 750, `Demo student ${index}`);
        created += 1;
    }
    await insertTracked(batchId, 'school_lessons', {
        institution_id: institution.id,
        class_id: schoolClass.id,
        subject_id: subject.id,
        title: 'à¦­à¦—à§à¦¨à¦¾à¦‚à¦¶à§‡à¦° à¦¸à¦¹à¦œ à¦§à¦¾à¦°à¦£à¦¾',
        description: '<p><strong>à¦²à¦¬</strong> à¦“ <em>à¦¹à¦°</em> à¦šà¦¿à¦¹à§à¦¨à¦¿à¦¤ à¦•à¦°à§‡ à¦¬à¦¾à¦¸à§à¦¤à¦¬ à¦‰à¦¦à¦¾à¦¹à¦°à¦£ à¦¸à¦®à¦¾à¦§à¦¾à¦¨ à¦•à¦°à§à¦¨à¥¤</p>',
        homework: 'à¦…à¦¨à§à¦¶à§€à¦²à¦¨à§€ à¦¥à§‡à¦•à§‡ à§§-à§« à¦¨à¦®à§à¦¬à¦° à¦¸à¦®à¦¾à¦§à¦¾à¦¨ à¦•à¦°à§à¦¨à¥¤',
        lesson_date: new Date().toISOString().slice(0, 10),
        status: 'published'
    }, 800, 'Demo lesson topic');
    created += 1;
    await insertTracked(batchId, 'institution_notices', {
        institution_id: institution.id,
        title: 'à¦¡à§‡à¦®à§‹: à¦¨à¦¤à§à¦¨ à¦¶à¦¿à¦•à§à¦·à¦¾à¦¬à¦°à§à¦·à§‡ à¦­à¦°à§à¦¤à¦¿ à¦šà¦²à¦›à§‡',
        body: 'Website admission page à¦¥à§‡à¦•à§‡ à¦†à¦¬à§‡à¦¦à¦¨ à¦•à¦°à¦¾ à¦¯à¦¾à¦¬à§‡à¥¤',
        audience: 'public'
    }, 750, 'Demo school notice');
    created += 1;
    await insertTracked(batchId, 'school_admission_applications', {
        institution_id: institution.id,
        student_name: 'à¦¡à§‡à¦®à§‹ à¦­à¦°à§à¦¤à¦¿ à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€',
        desired_class: 'à§®à¦® à¦¶à§à¦°à§‡à¦£à¦¿',
        guardian_name: 'à¦¡à§‡à¦®à§‹ à¦…à¦­à¦¿à¦­à¦¾à¦¬à¦•',
        guardian_phone: DEMO_PHONE,
        address: 'à¦¡à§‡à¦®à§‹ à¦¸à§à¦®à¦¾à¦°à§à¦Ÿ à¦—à§à¦°à¦¾à¦®',
        status: 'pending'
    }, 800, 'Demo admission');
    return created + 1;
}

async function seedLocalInstitutions(batchId, scope, suffix) {
    const rows = [
        {
            name: 'Demo Kindergarten',
            type: 'school',
            category: 'kindergarten',
            subdomain: `demo-kindergarten-${suffix}`,
            website_status: 'active'
        },
        {
            name: 'Demo College',
            type: 'college',
            category: 'college',
            subdomain: `demo-college-${suffix}`,
            website_status: 'active'
        },
        {
            name: 'Demo Noorani Madrasa',
            type: 'madrasa',
            category: 'dakhil_madrasa',
            subdomain: `demo-madrasa-${suffix}`,
            website_status: 'active'
        },
        {
            name: 'Demo Central Mosque',
            type: 'mosque',
            category: 'mosque',
            subdomain: `demo-mosque-${suffix}`,
            website_status: 'active'
        }
    ];

    for (const row of rows) {
        await insertTracked(batchId, 'institutions', {
            ...row,
            location_id: scope.union.id,
            village_location_id: row.type === 'college' ? scope.secondVillageLocation.id : scope.villageLocation.id,
            village: row.type === 'college' ? scope.secondVillageLocation.name_bn : scope.villageLocation.name_bn,
            portal_features: row.type === 'mosque' ? ['donations', 'accounts', 'announcements'] : ['website', 'notice', 'admission'],
            operational_settings: { demo: true }
        }, 300, `Demo ${row.type}`);
    }

    return rows.length;
}

async function seedAll(profile) {
    const suffix = batchSuffix();
    const batchKey = `full-demo-${suffix}`;
    const { data: batch, error: batchError } = await supabaseAdmin
        .from('demo_data_batches')
        .insert({ batch_key: batchKey, status: 'creating', created_by: profile.id })
        .select().single();
    if (batchError) throw batchError;

    const summary = { created: 0, modules: {}, warnings: [], demoPhone: DEMO_PHONE };
    try {
        const scope = await ensureDemoScope(batch.id, suffix);
        await supabaseAdmin.from('demo_data_batches').update({ scope_location_id: scope.union.id }).eq('id', batch.id);
        summary.modules.scope = { status: 'ready', union: scope.union.name_bn, ward: scope.ward.name_bn, village: scope.villageLocation.name_bn };

        const { households, residents } = await seedHouseholds(batch.id, scope, suffix);
        summary.created += households.length + residents.length;
        summary.modules.households = { status: 'created', count: households.length, residents: residents.length };

        await optionalModule(summary, 'services_and_tax', async () => {
            const request = await insertTracked(batch.id, 'service_requests', {
                household_id: households[0].id,
                resident_id: residents[0].id,
                request_type: 'birth_registration',
                applicant_name: residents[0].bn_name,
                contact_phone: households[0].phone,
                details: 'à¦¡à§‡à¦®à§‹ à¦œà¦¨à§à¦® à¦¨à¦¿à¦¬à¦¨à§à¦§à¦¨ à¦†à¦¬à§‡à¦¦à¦¨',
                status: 'processing'
            }, 850, 'Demo service request');
            await insertTracked(batch.id, 'household_taxes', {
                household_id: households[1].id,
                year: new Date().getFullYear(),
                fiscal_year_label: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
                amount_due: 500,
                amount_paid: 200,
                due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
                status: 'partial',
                notes: 'à¦¡à§‡à¦®à§‹ tax record'
            }, 850, 'Demo tax');
            return request ? 2 : 0;
        });

        await optionalModule(summary, 'citizen_center', async () => {
            const rows = [
                ['citizen_complaints', {
                    phone: DEMO_PHONE, citizen_name: 'à¦¡à§‡à¦®à§‹ à¦¨à¦¾à¦—à¦°à¦¿à¦•', complaint_type: 'road',
                    title: 'à¦¡à§‡à¦®à§‹ à¦°à¦¾à¦¸à§à¦¤à¦¾ à¦®à§‡à¦°à¦¾à¦®à¦¤à§‡à¦° à¦†à¦¬à§‡à¦¦à¦¨', description: 'à¦¬à§ƒà¦·à§à¦Ÿà¦¿à¦¤à§‡ à¦°à¦¾à¦¸à§à¦¤à¦¾à¦° à¦…à¦‚à¦¶ à¦•à§à¦·à¦¤à¦¿à¦—à§à¦°à¦¸à§à¦¤ à¦¹à§Ÿà§‡à¦›à§‡à¥¤',
                    location_text: scope.villageLocation.name_bn, assigned_scope_type: 'union', assigned_scope_id: scope.union.id,
                    status: 'reviewing'
                }, 'Demo complaint'],
                ['citizen_appointments', {
                    phone: DEMO_PHONE, citizen_name: 'à¦¡à§‡à¦®à§‹ à¦¨à¦¾à¦—à¦°à¦¿à¦•', appointment_type: 'office_visit',
                    title: 'à¦¸à¦¨à¦¦ à¦¸à¦‚à¦—à§à¦°à¦¹à§‡à¦° appointment', assigned_scope_type: 'union', assigned_scope_id: scope.union.id,
                    preferred_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), status: 'scheduled'
                }, 'Demo appointment'],
                ['citizen_life_support_cases', {
                    phone: DEMO_PHONE, citizen_name: 'à¦¡à§‡à¦®à§‹ à¦¨à¦¾à¦—à¦°à¦¿à¦•', case_type: 'benefit', category: 'widow_allowance',
                    title: 'à¦¬à¦¿à¦§à¦¬à¦¾ à¦­à¦¾à¦¤à¦¾ à¦¯à¦¾à¦šà¦¾à¦‡', description: 'à¦¡à§‡à¦®à§‹ support case', assigned_scope_type: 'union',
                    assigned_scope_id: scope.union.id, status: 'reviewing'
                }, 'Demo support case'],
                ['citizen_blood_requests', {
                    requester_name: 'à¦¡à§‡à¦®à§‹ à¦¨à¦¾à¦—à¦°à¦¿à¦•', phone: DEMO_PHONE, blood_group: 'A+',
                    patient_name: 'à¦¡à§‡à¦®à§‹ à¦°à§‹à¦—à§€', hospital_or_location: 'à¦¡à§‡à¦®à§‹ à¦‰à¦ªà¦œà§‡à¦²à¦¾ à¦¸à§à¦¬à¦¾à¦¸à§à¦¥à§à¦¯à¦•à§‡à¦¨à§à¦¦à§à¦°', status: 'active'
                }, 'Demo blood request']
            ];
            for (const [table, payload, label] of rows) await insertTracked(batch.id, table, payload, 850, label);
            return rows.length;
        });

        await optionalModule(summary, 'market', async () => {
            const market = await insertTracked(batch.id, 'markets', {
                name: `à¦¡à§‡à¦®à§‹ à¦¸à§à¦®à¦¾à¦°à§à¦Ÿ à¦¬à¦¾à¦œà¦¾à¦° ${suffix.slice(-3)}`, type: 'à¦ªà§à¦°à¦¤à¦¿à¦¦à¦¿à¦¨',
                days: ['Saturday', 'Monday'], location_id: scope.union.id, is_active: true
            }, 500, 'Demo market');
            const commodity = await insertTracked(batch.id, 'market_commodities', {
                name: `à¦¡à§‡à¦®à§‹ à¦šà¦¾à¦² ${suffix.slice(-3)}`, category: 'à¦šà¦¾à¦²', unit: 'à¦•à§‡à¦œà¦¿', icon: 'package'
            }, 450, 'Demo commodity');
            const rows = [
                ['market_prices', { market_id: market.id, commodity_id: commodity.id, price: 68, prev_price: 72, trend: 'down', supply: 'Normal' }, 'Demo market price'],
                ['market_demands', {
                    location_id: scope.union.id, market_id: market.id, commodity_id: commodity.id,
                    demand_type: 'sell', title: 'à¦¡à§‡à¦®à§‹ à¦•à§ƒà¦·à¦•à§‡à¦° à¦§à¦¾à¦¨ à¦¬à¦¿à¦•à§à¦°à¦¿', quantity: 'à§¨à§¦ à¦®à¦£',
                    expected_price: 1300, contact_name: 'à¦¡à§‡à¦®à§‹ à¦•à§ƒà¦·à¦•', contact_phone: DEMO_PHONE,
                    village_name: scope.villageLocation.name_bn, status: 'active', phone_verified: true
                }, 'Demo market demand'],
                ['market_complaints', {
                    location_id: scope.union.id, market_id: market.id, complainant_name: 'à¦¡à§‡à¦®à§‹ à¦•à§à¦°à§‡à¦¤à¦¾',
                    complainant_phone: DEMO_PHONE, complaint_type: 'high_price', note: 'à¦®à§‚à¦²à§à¦¯ à¦¤à¦¾à¦²à¦¿à¦•à¦¾à¦° à¦šà§‡à§Ÿà§‡ à¦¬à§‡à¦¶à¦¿ à¦¨à§‡à¦“à§Ÿà¦¾ à¦¹à§Ÿà§‡à¦›à§‡à¥¤',
                    status: 'pending'
                }, 'Demo market complaint']
            ];
            for (const [table, payload, label] of rows) await insertTracked(batch.id, table, payload, 800, label);
            return rows.length + 2;
        });

        await optionalModule(summary, 'lost_found', async () => {
            const post = await insertTracked(batch.id, 'lost_found_posts', {
                location_id: scope.union.id, type: 'lost', category: 'document',
                title: 'à¦¡à§‡à¦®à§‹ à¦œà¦¾à¦¤à§€à§Ÿ à¦ªà¦°à¦¿à¦šà§Ÿà¦ªà¦¤à§à¦° à¦¹à¦¾à¦°à¦¿à§Ÿà§‡à¦›à§‡', description: 'à¦¬à¦¾à¦œà¦¾à¦° à¦à¦²à¦¾à¦•à¦¾à§Ÿ à¦¹à¦¾à¦°à¦¿à§Ÿà§‡à¦›à§‡à¥¤',
                location: scope.villageLocation.name_bn, event_date: new Date().toISOString().slice(0, 10),
                contact_name: 'à¦¡à§‡à¦®à§‹ à¦¨à¦¾à¦—à¦°à¦¿à¦•', contact_phone: DEMO_PHONE, reporter_phone: DEMO_PHONE,
                status: 'active', phone_verified: true
            }, 600, 'Demo lost-found post');
            await insertTracked(batch.id, 'lost_found_claims', {
                post_id: post.id, location_id: scope.union.id, claimant_name: 'à¦¡à§‡à¦®à§‹ à¦¦à¦¾à¦¬à¦¿à¦¦à¦¾à¦°',
                claimant_phone: DEMO_PHONE, proof_note: 'à¦¨à¦¾à¦® à¦“ à¦œà¦¨à§à¦®à¦¤à¦¾à¦°à¦¿à¦– à¦®à¦¿à¦²à§‡à¦›à§‡à¥¤',
                status: 'pending', phone_verified: true
            }, 850, 'Demo lost-found claim');
            return 2;
        });

        await optionalModule(summary, 'business_directory', async () => {
            const business = await insertTracked(batch.id, 'local_businesses', {
                union_id: scope.union.id, ward_id: scope.ward.id, village_id: scope.villageLocation.id,
                name: 'à¦¡à§‡à¦®à§‹ à¦¡à¦¿à¦œà¦¿à¦Ÿà¦¾à¦² à¦¸à§‡à¦¬à¦¾ à¦•à§‡à¦¨à§à¦¦à§à¦°', category: 'technology',
                description: 'à¦…à¦¨à¦²à¦¾à¦‡à¦¨ à¦†à¦¬à§‡à¦¦à¦¨, à¦ªà§à¦°à¦¿à¦¨à§à¦Ÿ, à¦›à¦¬à¦¿ à¦“ à¦¡à¦¿à¦œà¦¿à¦Ÿà¦¾à¦² à¦¸à¦¹à¦¾à§Ÿà¦¤à¦¾à¥¤',
                owner_name: 'à¦¡à§‡à¦®à§‹ à¦‰à¦¦à§à¦¯à§‹à¦•à§à¦¤à¦¾', phone: DEMO_PHONE, whatsapp: DEMO_PHONE,
                address: scope.villageLocation.name_bn, service_area: 'à¦ªà§à¦°à§‹ à¦‡à¦‰à¦¨à¦¿à§Ÿà¦¨',
                opening_hours: 'à¦¸à¦•à¦¾à¦² à§¯à¦Ÿà¦¾ - à¦°à¦¾à¦¤ à§®à¦Ÿà¦¾', plan: 'featured', status: 'approved',
                is_verified: true, is_featured: true, approved_at: new Date().toISOString()
            }, 600, 'Demo business');
            await insertTracked(batch.id, 'business_ads', {
                business_id: business.id, union_id: scope.union.id,
                title: 'à¦¡à§‡à¦®à§‹: à¦…à¦¨à¦²à¦¾à¦‡à¦¨ à¦¸à§‡à¦¬à¦¾à§Ÿ à§§à§¦% à¦›à¦¾à§œ', subtitle: 'DigiGram user offer',
                placement: 'directory_top', daily_budget: 100, total_budget: 1000,
                status: 'active', ends_at: new Date(Date.now() + 30 * 86400000).toISOString()
            }, 850, 'Demo business ad');
            return 2;
        });

        await optionalModule(summary, 'school', () => seedSchool(batch.id, scope, suffix));
        await optionalModule(summary, 'local_institutions', () => seedLocalInstitutions(batch.id, scope, suffix));

        await optionalModule(summary, 'sms_and_governance', async () => {
            let { data: wallet, error } = await supabaseAdmin
                .from('sms_wallets').select('*').eq('owner_type', 'location').eq('owner_id', scope.union.id).maybeSingle();
            if (error) throw error;
            let count = 0;
            if (!wallet) {
                wallet = await insertTracked(batch.id, 'sms_wallets', {
                    owner_type: 'location', owner_id: scope.union.id, balance: 500, low_balance_threshold: 50
                }, 550, 'Demo SMS wallet');
                count += 1;
            }
            await insertTracked(batch.id, 'sms_messages', {
                wallet_id: wallet.id, owner_type: 'location', owner_id: scope.union.id,
                recipient_phone: DEMO_PHONE, message: 'DigiGram demo: à¦†à¦ªà¦¨à¦¾à¦° à¦†à¦¬à§‡à¦¦à¦¨ processing à¦…à¦¬à¦¸à§à¦¥à¦¾à§Ÿ à¦†à¦›à§‡à¥¤',
                category: 'service', status: 'queued', source_type: 'demo'
            }, 850, 'Demo SMS');
            await insertTracked(batch.id, 'citizen_consents', {
                phone: DEMO_PHONE, household_id: households[0].id, consent_type: 'sms_service',
                granted: true, source: 'demo_seed', granted_at: new Date().toISOString()
            }, 850, 'Demo consent');
            await insertTracked(batch.id, 'system_recovery_snapshots', {
                snapshot_type: 'demo_checkpoint', label: 'Demo testing checkpoint',
                status: 'ready', summary: { demo: true, batch: batchKey }, created_by: profile.id
            }, 850, 'Demo recovery snapshot');
            return count + 3;
        });

        await supabaseAdmin.from('demo_data_batches').update({
            status: 'active', summary
        }).eq('id', batch.id);
        return { batchId: batch.id, batchKey, summary };
    } catch (error) {
        await supabaseAdmin.from('demo_data_batches').update({
            status: 'failed', error_message: error.message, summary
        }).eq('id', batch.id);
        throw error;
    }
}

async function removeBatch(batch) {
    const { data: records, error } = await supabaseAdmin
        .from('demo_data_records')
        .select('*')
        .eq('batch_id', batch.id)
        .order('delete_order', { ascending: false })
        .order('created_at', { ascending: false });
    if (error) throw error;

    await supabaseAdmin.from('demo_data_batches').update({ status: 'removing' }).eq('id', batch.id);
    const removed = {};
    const warnings = [];
    for (const record of records || []) {
        const result = await supabaseAdmin.from(record.table_name).delete().eq('id', record.record_id);
        if (result.error && !isOptionalSchemaError(result.error)) {
            warnings.push(`${record.table_name}: ${result.error.message}`);
            continue;
        }
        removed[record.table_name] = (removed[record.table_name] || 0) + 1;
    }
    await supabaseAdmin.from('demo_data_records').delete().eq('batch_id', batch.id);
    await supabaseAdmin.from('demo_data_batches').update({
        status: 'removed',
        removed_at: new Date().toISOString(),
        summary: { ...(batch.summary || {}), removed, cleanupWarnings: warnings }
    }).eq('id', batch.id);
    return { removed, warnings };
}

async function findActiveBatch() {
    const { data, error } = await supabaseAdmin
        .from('demo_data_batches')
        .select('*')
        .in('status', ['creating', 'active', 'failed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    return data || null;
}

export async function GET(request) {
    const { response } = await requireRequestProfile(request, ['super_admin']);
    if (response) return response;
    const { data, error } = await supabaseAdmin
        .from('demo_data_batches')
        .select('*,records:demo_data_records(count)')
        .order('created_at', { ascending: false })
        .limit(10);
    if (error) {
        if (isOptionalSchemaError(error)) {
            return NextResponse.json({ setupRequired: true, activeBatch: null, history: [] });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
        success: true,
        setupRequired: false,
        activeBatch: (data || []).find((row) => ['creating', 'active', 'failed'].includes(row.status)) || null,
        history: data || []
    });
}

export async function POST(request) {
    const { profile, response } = await requireRequestProfile(request, ['super_admin']);
    if (response) return response;
    try {
        const body = await request.json();
        if (body.action === 'seed') {
            const active = await findActiveBatch();
            if (active) {
                return NextResponse.json({ error: 'à¦à¦•à¦Ÿà¦¿ demo batch à¦‡à¦¤à§‹à¦®à¦§à§à¦¯à§‡ active à¦†à¦›à§‡à¥¤ à¦†à¦—à§‡ Remove Demo Data à¦šà¦¾à¦²à¦¾à¦¨à¥¤' }, { status: 409 });
            }
            const result = await seedAll(profile);
            return NextResponse.json({ success: true, message: 'à¦¸à¦¬ module-à¦à¦° demo data à¦¤à§ˆà¦°à¦¿ à¦¹à§Ÿà§‡à¦›à§‡à¥¤', ...result });
        }
        if (body.action === 'remove') {
            const batch = await findActiveBatch();
            if (!batch) return NextResponse.json({ success: true, message: 'Active demo data à¦¨à§‡à¦‡à¥¤' });
            const result = await removeBatch(batch);
            return NextResponse.json({ success: true, message: 'à¦¶à§à¦§à§ registered demo data remove à¦¹à§Ÿà§‡à¦›à§‡à¥¤', ...result });
        }
        if (body.action === 'reset') {
            const batch = await findActiveBatch();
            const cleanup = batch ? await removeBatch(batch) : { removed: {}, warnings: [] };
            const result = await seedAll(profile);
            return NextResponse.json({
                success: true,
                message: batch
                    ? 'à¦ªà§à¦°à¦¨à§‹ registered demo data remove à¦•à¦°à§‡ à¦¨à¦¤à§à¦¨ demo data à¦¤à§ˆà¦°à¦¿ à¦¹à§Ÿà§‡à¦›à§‡à¥¤'
                    : 'Active demo à¦›à¦¿à¦² à¦¨à¦¾, à¦¨à¦¤à§à¦¨ demo data à¦¤à§ˆà¦°à¦¿ à¦¹à§Ÿà§‡à¦›à§‡à¥¤',
                cleanup,
                ...result
            });
        }
        return NextResponse.json({ error: 'Unknown demo action' }, { status: 400 });
    } catch (error) {
        console.error('Demo data manager failed:', error);
        if (isOptionalSchemaError(error)) {
            return NextResponse.json({ error: 'à¦ªà§à¦°à¦¥à¦®à§‡ database/73_demo_data_registry.sql à¦šà¦¾à¦²à¦¾à¦¨à¥¤' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message || 'Demo data operation failed' }, { status: 500 });
    }
}

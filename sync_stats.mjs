import { createClient } from '@supabase/supabase-js';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncHouseholdStats(householdId) {
    const { data: residents, error } = await supabase
        .from('residents')
        .select('*')
        .eq('household_id', householdId);

    if (error) throw error;

    const stats = (residents || []).reduce((acc, r) => {
        const birthDate = r.dob ? new Date(r.dob) : null;
        const today = new Date();
        let age = -1;
        if (birthDate) {
            age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        }

        if (r.blood_group) {
            acc.blood_groups[r.blood_group] = (acc.blood_groups[r.blood_group] || 0) + 1;
        }

        return {
            ...acc,
            total_members: acc.total_members + 1,
            voters: acc.voters + (r.is_voter ? 1 : 0),
            male_voters: acc.male_voters + (r.is_voter && r.gender === 'Male' ? 1 : 0),
            female_voters: acc.female_voters + (r.is_voter && r.gender === 'Female' ? 1 : 0),
            males: acc.males + (r.gender === 'Male' ? 1 : 0),
            females: acc.females + (r.gender === 'Female' ? 1 : 0),
            blood_donors: acc.blood_donors + (r.blood_group ? 1 : 0),
            birth_registered: acc.birth_registered + (r.birth_reg_no ? 1 : 0),
            voter_eligible: acc.voter_eligible + (age >= 18 && !r.is_voter ? 1 : 0)
        };
    }, { total_members: 0, voters: 0, male_voters: 0, female_voters: 0, males: 0, females: 0, blood_donors: 0, birth_registered: 0, voter_eligible: 0, blood_groups: {} });

    const { error: updateError } = await supabase
        .from('households')
        .update({ stats })
        .eq('id', householdId);

    if (updateError) throw updateError;
    return stats;
}

async function syncVillageData(villageId) {
    const { data: households, error: hError } = await supabase
        .from('households')
        .select('stats')
        .eq('village_id', villageId);

    if (hError) throw hError;

    const householdAggregation = (households || []).reduce((acc, h) => {
        const s = h.stats || {};
        
        if (s.blood_groups) {
            for (const [bg, count] of Object.entries(s.blood_groups)) {
                acc.blood_groups[bg] = (acc.blood_groups[bg] || 0) + count;
            }
        }

        return {
            ...acc,
            total_houses: acc.total_houses + 1,
            total_members: acc.total_members + (s.total_members || 0),
            males: acc.males + (s.males || 0),
            females: acc.females + (s.females || 0),
            voters: acc.voters + (s.voters || 0),
            male_voters: acc.male_voters + (s.male_voters || 0),
            female_voters: acc.female_voters + (s.female_voters || 0),
            blood_donors: acc.blood_donors + (s.blood_donors || 0),
            birth_registered: acc.birth_registered + (s.birth_registered || 0),
            voter_eligible: acc.voter_eligible + (s.voter_eligible || 0)
        };
    }, { total_houses: 0, total_members: 0, males: 0, females: 0, voters: 0, male_voters: 0, female_voters: 0, blood_donors: 0, birth_registered: 0, voter_eligible: 0, blood_groups: {} });

    const { data: existingVillage } = await supabase
        .from('villages')
        .select('stats')
        .eq('id', villageId)
        .single();
    
    const manualStats = existingVillage?.stats || {};
    const realStats = {
        ...manualStats,
        ...householdAggregation
    };

    const { data: vData, error: updateError } = await supabase
        .from('villages')
        .update({
            survey_status: 'verified',
            real_stats: realStats
        })
        .eq('id', villageId)
        .select('name, bn_name, ward_id')
        .single();

    if (updateError) throw updateError;
    return { realStats, wardId: vData?.ward_id };
}

async function syncWardData(wardId) {
    const { data: villages, error: vError } = await supabase
        .from('villages')
        .select('real_stats')
        .eq('ward_id', wardId)
        .eq('survey_status', 'verified');

    if (vError) throw vError;

    const realStats = (villages || []).reduce((acc, v) => {
        const s = v.real_stats || {};
        
        if (s.blood_groups) {
            for (const [bg, count] of Object.entries(s.blood_groups)) {
                acc.blood_groups[bg] = (acc.blood_groups[bg] || 0) + count;
            }
        }

        return {
            ...acc,
            total_houses: acc.total_houses + (s.total_houses || 0),
            total_members: acc.total_members + (s.total_members || 0),
            males: acc.males + (s.males || 0),
            females: acc.females + (s.females || 0),
            voters: acc.voters + (s.voters || 0),
            male_voters: acc.male_voters + (s.male_voters || 0),
            female_voters: acc.female_voters + (s.female_voters || 0),
            blood_donors: acc.blood_donors + (s.blood_donors || 0),
            birth_registered: acc.birth_registered + (s.birth_registered || 0),
            voter_eligible: acc.voter_eligible + (s.voter_eligible || 0),
            schools: acc.schools + (typeof s.schools === 'number' ? s.schools : (Array.isArray(s.schools) ? s.schools.length : 0)),
            mosques: acc.mosques + (typeof s.mosques === 'number' ? s.mosques : (Array.isArray(s.mosques) ? s.mosques.length : 0)),
            madrassas: acc.madrassas + (typeof s.madrassas === 'number' ? s.madrassas : (Array.isArray(s.madrassas) ? s.madrassas.length : 0)),
            orphanages: acc.orphanages + (typeof s.orphanages === 'number' ? s.orphanages : (Array.isArray(s.orphanages) ? s.orphanages.length : 0)),
        };
    }, { total_houses: 0, total_members: 0, males: 0, females: 0, voters: 0, male_voters: 0, female_voters: 0, blood_donors: 0, schools: 0, mosques: 0, madrassas: 0, orphanages: 0, birth_registered: 0, voter_eligible: 0, blood_groups: {} });

    const { error: updateError } = await supabase
        .from('locations')
        .update({
            survey_status: 'verified',
            real_stats: realStats
        })
        .eq('id', wardId);

    if (updateError) throw updateError;
    
    // Get parent union id
    const { data: wData } = await supabase
        .from('locations')
        .select('parent_id')
        .eq('id', wardId)
        .single();
        
    return { realStats, unionId: wData?.parent_id };
}

async function syncUnionData(unionId) {
    const { data: wards, error: wError } = await supabase
        .from('locations')
        .select('real_stats')
        .eq('parent_id', unionId)
        .eq('type', 'ward')
        .eq('survey_status', 'verified');

    if (wError) throw wError;

    const realStats = (wards || []).reduce((acc, w) => {
        const s = w.real_stats || {};
        
        if (s.blood_groups) {
            for (const [bg, count] of Object.entries(s.blood_groups)) {
                acc.blood_groups[bg] = (acc.blood_groups[bg] || 0) + count;
            }
        }

        return {
            ...acc,
            total_houses: acc.total_houses + (s.total_houses || 0),
            total_members: acc.total_members + (s.total_members || 0),
            males: acc.males + (s.males || 0),
            females: acc.females + (s.females || 0),
            voters: acc.voters + (s.voters || 0),
            male_voters: acc.male_voters + (s.male_voters || 0),
            female_voters: acc.female_voters + (s.female_voters || 0),
            blood_donors: acc.blood_donors + (s.blood_donors || 0),
            schools: acc.schools + (s.schools || 0),
            mosques: acc.mosques + (s.mosques || 0),
            madrassas: acc.madrassas + (s.madrassas || 0),
            orphanages: acc.orphanages + (s.orphanages || 0),
            birth_registered: acc.birth_registered + (s.birth_registered || 0),
            voter_eligible: acc.voter_eligible + (s.voter_eligible || 0),
        };
    }, { total_houses: 0, total_members: 0, males: 0, females: 0, voters: 0, male_voters: 0, female_voters: 0, blood_donors: 0, schools: 0, mosques: 0, madrassas: 0, orphanages: 0, birth_registered: 0, voter_eligible: 0, blood_groups: {} });

    const { error: updateError } = await supabase
        .from('locations')
        .update({
            survey_status: 'verified',
            real_stats: realStats
        })
        .eq('id', unionId);

    if (updateError) throw updateError;
    return realStats;
}

async function run() {
    console.log("Starting full sync...");
    
    // 1. Sync Households
    console.log("Syncing households...");
    const { data: households } = await supabase.from('households').select('id, village_id');
    const villageIds = new Set();
    
    for (const h of households) {
        await syncHouseholdStats(h.id);
        if (h.village_id) villageIds.add(h.village_id);
    }
    console.log(`Synced ${households.length} households.`);
    
    // 2. Sync Villages
    console.log("Syncing villages...");
    const wardIds = new Set();
    for (const vId of villageIds) {
        const { wardId } = await syncVillageData(vId);
        if (wardId) wardIds.add(wardId);
    }
    console.log(`Synced ${villageIds.size} villages.`);
    
    // 3. Sync Wards
    console.log("Syncing wards...");
    const unionIds = new Set();
    for (const wId of wardIds) {
        const { unionId } = await syncWardData(wId);
        if (unionId) unionIds.add(unionId);
    }
    console.log(`Synced ${wardIds.size} wards.`);
    
    // 4. Sync Unions
    console.log("Syncing unions...");
    for (const uId of unionIds) {
        await syncUnionData(uId);
    }
    console.log(`Synced ${unionIds.size} unions.`);
    
    console.log("Full sync complete!");
}

run().catch(console.error);

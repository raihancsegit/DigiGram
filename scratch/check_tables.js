import { supabase } from '../lib/utils/supabase.js';

async function checkTables() {
    const tables = ['agri_equipment', 'blood_donors', 'lost_found_posts', 'emergency_contacts', 'institutions'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table ${table} does not exist or error:`, error.message);
        } else {
            console.log(`Table ${table} exists.`);
        }
    }
}

checkTables();

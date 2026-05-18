
import { supabase } from '@/lib/utils/supabase';

async function checkSchema() {
    const { data, error } = await supabase.from('residents').select('*').limit(1);
    if (error) {
        console.error("Schema check error:", error);
    } else {
        console.log("Residents Table Columns:", Object.keys(data[0] || {}));
    }
}

checkSchema();

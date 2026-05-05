const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function loadEnv() {
    try {
        const env = fs.readFileSync('.env.local', 'utf8');
        const lines = env.split('\n');
        lines.forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim().replace(/^"|"$/g, '');
            }
        });
    } catch (e) {}
}
loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getEnumValues() {
  const { data, error } = await supabase
    .rpc('get_enum_values', { enum_name: 'profile_role' });

  if (error) {
    // If RPC doesn't exist, try a raw query via a trick or just guess
    console.error("RPC Error (maybe not defined):", error);
    
    // Fallback: Try to query a system table if allowed
    const { data: raw, error: rawError } = await supabase.from('profiles').select('role').limit(1);
    console.log("Single row role:", raw?.[0]?.role);
    return;
  }

  console.log("Enum values for profile_role:", data);
}

getEnumValues();

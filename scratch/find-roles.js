const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple manual env loader
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
    } catch (e) {
        console.warn("Could not load .env.local manually");
    }
}

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findRoles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('role');

  if (error) {
    console.error("Error fetching roles:", error);
    return;
  }

  const roles = [...new Set(data.map(r => r.role))];
  console.log("Unique roles in database:", roles);
}

findRoles();

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

async function testRole() {
  const { data, error } = await supabase
    .from('profiles')
    .insert([{
        id: '00000000-0000-0000-0000-000000000000', // Dummy
        first_name: 'Test',
        last_name: 'User',
        role: 'user'
    }]);

  if (error) {
    console.error("Role 'user' error:", error.message);
  } else {
    console.log("Role 'user' is VALID!");
    // Clean up
    await supabase.from('profiles').delete().eq('id', '00000000-0000-0000-0000-000000000000');
  }
}

testRole();

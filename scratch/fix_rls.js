import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split(/\r?\n/).filter(Boolean).forEach(line => {
    const [key, value] = line.split('=');
    envVars[key] = value;
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function fixRLSPolicies() {
    console.log('Dropping existing policy...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "Projects are readable by everyone" ON donation_projects;`
    });
    if (dropError) console.log('Drop error:', dropError);

    console.log('Creating new policy...');
    const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `CREATE POLICY "Projects are readable by everyone" ON donation_projects FOR SELECT USING (true);`
    });
    if (createError) console.log('Create error:', createError);

    console.log('Testing policy with anon key...');
    const anonSupabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data, error } = await anonSupabase
        .from('donation_projects')
        .select('*')
        .eq('id', '245b38a0-bec0-413d-b88a-9d3c87b69d34');

    console.log('error=', error);
    console.log('data found=', data?.length > 0);
    if (data?.length > 0) {
        console.log('Project:', { id: data[0].id, title: data[0].title, union_slug: data[0].union_slug });
    }
}

fixRLSPolicies().catch(console.error);
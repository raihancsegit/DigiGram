
const { createClient } = require('@supabase/supabase-client');

// Use env vars or hardcoded for a quick check
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
);

async function checkServices() {
    const { data, error } = await supabase
        .from('services')
        .select('*');
    
    if (error) {
        console.error("Error fetching services:", error);
        return;
    }
    
    console.log("Current Services in DB:");
    console.table(data.map(s => ({ id: s.id, slug: s.slug, name: s.name })));
}

checkServices();

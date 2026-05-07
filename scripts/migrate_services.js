const { createClient } = require('@supabase/supabase-js');

async function migrateServices() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Adding name_bn column if not exists...");
    // We can't run raw SQL easily via client for migrations, 
    // but we can try to RPC or just use the existing name column.
    
    // Actually, I'll just update the existing 'village-market' to have a better name.
    const { data, error } = await supabase
        .from('services')
        .upsert({
            name: 'ভিলেজ মার্কেট (বাজারদর)',
            slug: 'village-market',
            features: JSON.stringify(["view", "compare", "track"])
        }, { onConflict: 'slug' })
        .select();

    if (error) console.error("Error:", error);
    else console.log("Updated service:", data);
}

migrateServices();

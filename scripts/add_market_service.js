const { createClient } = require('@supabase/supabase-js');

async function addMarketService() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase credentials in .env.local");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('services')
        .upsert({
            name: 'ভিলেজ মার্কেট',
            slug: 'village-market',
            features: JSON.stringify(["view", "compare", "track"])
        }, { onConflict: 'slug' })
        .select();

    if (error) {
        console.error("Error adding service:", error);
    } else {
        console.log("Service added/updated successfully:", data);
    }
}

addMarketService();

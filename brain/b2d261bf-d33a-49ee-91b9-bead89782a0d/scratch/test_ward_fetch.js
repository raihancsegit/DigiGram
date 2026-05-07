
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ycuaranwplqqdcutevrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdWFyYW53cGxxcWRjdXRldnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MTgzMTAsImV4cCI6MjA5MTk5NDMxMH0.VjdHk8bLz7Z71tIRPTO--ynG60o8SBTYteh9A60KsAU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testWardFetch() {
    const unionId = '17d8aae9-ebc5-4b25-bef4-1a6538f15357';
    
    // 1. Fetch Wards
    const { data: wards, error: wardsError } = await supabase
        .from('locations')
        .select('*')
        .eq('parent_id', unionId)
        .eq('type', 'ward');
    
    if (wardsError) {
        console.error("Wards Error:", wardsError);
        return;
    }
    console.log("Found Wards:", wards.length);
    console.table(wards.map(w => ({ id: w.id, name: w.name_bn })));

    if (wards.length === 0) return;

    const wardIds = wards.map(w => w.id);

    // 2. Fetch Villages
    const { data: allVillages, error: vError } = await supabase
        .from('locations')
        .select('*')
        .in('parent_id', wardIds)
        .eq('type', 'village');

    if (vError) {
        console.error("Village Error:", vError);
        return;
    }
    console.log("Found Villages:", allVillages.length);
    console.table(allVillages.map(v => ({ id: v.id, name: v.name_bn, parent: v.parent_id })));
}

testWardFetch();

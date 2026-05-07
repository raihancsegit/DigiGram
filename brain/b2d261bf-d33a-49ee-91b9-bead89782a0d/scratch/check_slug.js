
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ycuaranwplqqdcutevrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdWFyYW53cGxxcWRjdXRldnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MTgzMTAsImV4cCI6MjA5MTk5NDMxMH0.VjdHk8bLz7Z71tIRPTO--ynG60o8SBTYteh9A60KsAU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSlugs() {
    const { data, error } = await supabase
        .from('locations')
        .select('id, name_bn, slug, type')
        .or('slug.eq.hujripara,slug.eq.hujuripara');
    
    if (error) {
        console.error("Error:", error);
        return;
    }
    console.log("Locations with relevant slugs:");
    console.table(data);
}

checkSlugs();

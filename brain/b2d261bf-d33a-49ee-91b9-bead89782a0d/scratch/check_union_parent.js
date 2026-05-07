
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ycuaranwplqqdcutevrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdWFyYW53cGxxcWRjdXRldnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MTgzMTAsImV4cCI6MjA5MTk5NDMxMH0.VjdHk8bLz7Z71tIRPTO--ynG60o8SBTYteh9A60KsAU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUnionParent() {
    const { data: unions, error } = await supabase
        .from('locations')
        .select('id, name_bn, slug, parent_id')
        .eq('slug', 'hujripara');
    
    if (error) {
        console.error("Error:", error);
        return;
    }
    console.log("Union Details:");
    console.table(unions);

    if (unions.length > 0) {
        const { data: upazila, error: upError } = await supabase
            .from('locations')
            .select('id, name_bn')
            .eq('id', unions[0].parent_id);
        
        console.log("Parent Upazila:");
        console.table(upazila);
    }
}

checkUnionParent();

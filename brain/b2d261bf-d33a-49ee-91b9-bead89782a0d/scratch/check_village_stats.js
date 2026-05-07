
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ycuaranwplqqdcutevrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdWFyYW53cGxxcWRjdXRldnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MTgzMTAsImV4cCI6MjA5MTk5NDMxMH0.VjdHk8bLz7Z71tIRPTO--ynG60o8SBTYteh9A60KsAU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVillageStats() {
    const wardId = '0383993a-9745-416a-ba81-b2efc1eade12';
    const { data, error } = await supabase
        .from('locations')
        .select('id, name_bn, stats')
        .eq('parent_id', wardId);
    
    if (error) {
        console.error("Error:", error);
        return;
    }
    console.log("Village Stats:");
    console.log(JSON.stringify(data, null, 2));
}

checkVillageStats();

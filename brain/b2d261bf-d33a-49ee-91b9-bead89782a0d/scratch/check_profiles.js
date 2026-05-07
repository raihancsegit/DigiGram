
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ycuaranwplqqdcutevrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdWFyYW53cGxxcWRjdXRldnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MTgzMTAsImV4cCI6MjA5MTk5NDMxMH0.VjdHk8bLz7Z71tIRPTO--ynG60o8SBTYteh9A60KsAU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
    const wardId = '0383993a-9745-416a-ba81-b2efc1eade12';
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('access_scope_id', wardId);
    
    if (error) {
        console.error("Error:", error);
        return;
    }
    console.log("Profiles for Ward 0383...:");
    console.table(data);
}

checkProfiles();

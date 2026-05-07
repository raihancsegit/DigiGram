
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ycuaranwplqqdcutevrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdWFyYW53cGxxcWRjdXRldnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MTgzMTAsImV4cCI6MjA5MTk5NDMxMH0.VjdHk8bLz7Z71tIRPTO--ynG60o8SBTYteh9A60KsAU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPabaChildren() {
    const pabaId = '86947c42-8ad3-464c-bb44-52466193ae3b';
    const { data: children, error } = await supabase
        .from('locations')
        .select('id, name_bn, slug, type')
        .eq('parent_id', pabaId);
    
    if (error) {
        console.error("Error:", error);
        return;
    }
    console.log("Children of Paba Upazila:");
    console.table(children);
}

checkPabaChildren();

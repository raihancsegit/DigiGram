
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ycuaranwplqqdcutevrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdWFyYW53cGxxcWRjdXRldnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MTgzMTAsImV4cCI6MjA5MTk5NDMxMH0.VjdHk8bLz7Z71tIRPTO--ynG60o8SBTYteh9A60KsAU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMarkets() {
    const unionId = '17d8aae9-ebc5-4b25-bef4-1a6538f15357';
    const { data: markets, error } = await supabase
        .from('markets')
        .select('id, name, location_id')
        .eq('location_id', unionId);
    
    if (error) {
        console.error("Error:", error);
        return;
    }
    console.log("Markets for Hujripara Union:");
    console.table(markets);
}

checkMarkets();

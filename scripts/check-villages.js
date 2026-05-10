const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ycuaranwplqqdcutevrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdWFyYW53cGxxcWRjdXRldnJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQxODMxMCwiZXhwIjoyMDkxOTk0MzEwfQ.h2_B9WnNAP6IB_NYKV77kvpTvBKp49Kdti1bKpixZcs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVillages() {
    const { data, error } = await supabase.from('villages').select('*').limit(1);
    console.log(data);
}
checkVillages();

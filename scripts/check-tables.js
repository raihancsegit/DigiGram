const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ycuaranwplqqdcutevrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdWFyYW53cGxxcWRjdXRldnJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQxODMxMCwiZXhwIjoyMDkxOTk0MzEwfQ.h2_B9WnNAP6IB_NYKV77kvpTvBKp49Kdti1bKpixZcs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    // List tables using public schema (this is hacky but might work if we have permissions)
    const { data, error } = await supabase.from('locations').select('id').limit(1);
    console.log('Locations table accessible');
    
    const { data: v, error: vError } = await supabase.from('villages').select('id').limit(1);
    if (!vError) console.log('Villages table accessible');
    
    const { data: h, error: hError } = await supabase.from('households').select('id').limit(1);
    if (!hError) console.log('Households table accessible');
    
    const { data: r, error: rError } = await supabase.from('residents').select('id').limit(1);
    if (!rError) console.log('Residents table accessible');
}
checkTables();

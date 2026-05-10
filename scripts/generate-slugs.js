const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ycuaranwplqqdcutevrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdWFyYW53cGxxcWRjdXRldnJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQxODMxMCwiZXhwIjoyMDkxOTk0MzEwfQ.h2_B9WnNAP6IB_NYKV77kvpTvBKp49Kdti1bKpixZcs';

const supabase = createClient(supabaseUrl, supabaseKey);

function cleanSlug(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove non-word (except space/dash) - this will strip Bengali
        .replace(/\s+/g, '-')     
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function fixSlugs() {
    console.log('Fetching all wards and villages to clean up slugs...');
    
    const { data: locations, error } = await supabase
        .from('locations')
        .select('id, name_en, type, name_bn')
        .in('type', ['ward', 'village']);

    if (error) {
        console.error('Error fetching locations:', error);
        return;
    }

    for (const loc of locations) {
        let newSlug = '';
        if (loc.type === 'ward') {
            // Extract numbers from name_bn or name_en
            const num = (loc.name_bn + loc.name_en).match(/\d+/);
            newSlug = num ? `ward-${num[0]}` : `ward-${loc.id.substring(0, 4)}`;
        } else {
            // For villages, use name_en if possible, otherwise name_bn (but clean it)
            newSlug = cleanSlug(loc.name_en || loc.name_bn) || `village-${loc.id.substring(0, 4)}`;
            // Add short ID to ensure global uniqueness in the table
            newSlug = `${newSlug}-${loc.id.substring(0, 4)}`;
        }

        console.log(`Updating ${loc.type}: ${loc.name_bn} -> ${newSlug}`);

        await supabase
            .from('locations')
            .update({ slug: newSlug })
            .eq('id', loc.id);
    }

    console.log('Done!');
}

fixSlugs();

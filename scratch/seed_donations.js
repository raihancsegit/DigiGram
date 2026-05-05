import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split(/\r?\n/).filter(Boolean).forEach(line => {
    const [key, value] = line.split('=');
    envVars[key] = value;
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function seedDonationProjects() {
    console.log('Inserting sample donation projects...');

    const sampleProjects = [
        {
            id: '245b38a0-bec0-413d-b88a-9d3c87b69d34', // The UUID from the URL
            union_slug: 'poba',
            title: 'Winter Clothes Distribution for Poor Families',
            description: 'Help us provide warm clothes to families in need during the cold winter months.',
            target_amount: 50000,
            raised_amount: 12500,
            image_url: '/images/donation/winter-clothes.jpg',
            category: 'disaster',
            status: 'active',
            deadline: '2024-12-31',
            is_verified: true
        },
        {
            union_slug: 'poba',
            title: 'Road Repair Project',
            description: 'Repairing the main road connecting our village to the city.',
            target_amount: 100000,
            raised_amount: 45000,
            image_url: '/images/donation/road-repair.jpg',
            category: 'others',
            status: 'active',
            deadline: '2024-06-30',
            is_verified: true
        },
        {
            union_slug: 'poba',
            title: 'School Books and Supplies',
            description: 'Providing educational materials to underprivileged students.',
            target_amount: 25000,
            raised_amount: 25000,
            image_url: '/images/donation/school-books.jpg',
            category: 'education',
            status: 'completed',
            deadline: '2024-01-15',
            is_verified: true
        }
    ];

    for (const project of sampleProjects) {
        const { data, error } = await supabase
            .from('donation_projects')
            .insert(project)
            .select();

        if (error) {
            console.log(`Error inserting project "${project.title}":`, error);
        } else {
            console.log(`Successfully inserted project: ${project.title}`);
        }
    }

    // Verify the data
    const { data: allProjects, error: fetchError } = await supabase
        .from('donation_projects')
        .select('*');

    if (fetchError) {
        console.log('Error fetching projects:', fetchError);
    } else {
        console.log(`\nTotal projects in database: ${allProjects.length}`);
        console.log('Projects:', allProjects.map(p => ({ id: p.id, title: p.title, union_slug: p.union_slug })));
    }
}

seedDonationProjects().catch(console.error);
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(Boolean);
env.forEach(line => {
  const [key, value] = line.split('=');
  process.env[key] = value;
});

const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const anonDonations = await anon.from('donation_projects').select('*').limit(5);
  const serviceDonations = await service.from('donation_projects').select('*').limit(5);
  const anonLocations = await anon.from('locations').select('*').limit(5);

  console.log('anon donation_projects', anonDonations.error, anonDonations.data?.length);
  console.log('service donation_projects', serviceDonations.error, serviceDonations.data?.length);
  console.log('anon locations', anonLocations.error, anonLocations.data?.length);
}

inspect().catch(console.error);

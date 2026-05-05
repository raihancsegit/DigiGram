import { notFound } from 'next/navigation';
import { getWardFullContext } from '@/lib/services/hierarchyService';
import WardPortalClient from '@/components/sections/ward/WardPortalClient';

export const dynamic = 'force-dynamic';

export default async function FlatWardPortalPage({ params }) {
    const { id } = await params;
    
    // This will work with both UUID IDs and Slugs if we handle it in hierarchyService
    const data = await getWardFullContext(id);
    
    if (!data || !data.ward) notFound();

    return <WardPortalClient ctx={data.ctx} ward={data.ward} />;
}

import { notFound } from 'next/navigation';
import { getVillageFullContext } from '@/lib/services/hierarchyService';
import VillagePortalClient from '@/components/sections/village/VillagePortalClient';

export default async function FlatVillagePortalPage({ params }) {
    const { villageId } = await params;
    
    const data = await getVillageFullContext(villageId);
    
    if (!data || !data.village) notFound();

    return <VillagePortalClient ctx={data.ctx} ward={data.ward} village={data.village} />;
}

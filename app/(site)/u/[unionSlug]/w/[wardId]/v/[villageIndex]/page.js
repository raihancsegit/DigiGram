import { notFound } from 'next/navigation';
import { findUnionBySlug } from '@/lib/constants/locations';
import VillagePortalClient from '@/components/sections/village/VillagePortalClient';

export default async function VillagePortalPage({ params }) {
    const { unionSlug, wardId, villageIndex } = await params;
    const ctx = findUnionBySlug(unionSlug);
    if (!ctx) notFound();

    const ward = ctx.union.wards?.find((w) => w.id === wardId);
    if (!ward) notFound();

    const village = ward.villages?.[parseInt(villageIndex, 10)];
    if (!village) notFound();

    return <VillagePortalClient ctx={ctx} ward={ward} village={village} />;
}

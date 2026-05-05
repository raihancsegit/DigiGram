import { notFound } from 'next/navigation';
import { findUnionBySlug } from '@/lib/constants/locations';
import VillagePortalClient from '@/components/sections/village/VillagePortalClient';
import { wardService } from '@/lib/services/wardService';
import { getFullContextBySlug, getWardsWithDetailsByUnion, getLocationBySlug } from '@/lib/services/hierarchyService';

export const dynamic = 'force-dynamic';

export default async function VillagePortalPage({ params }) {
    const { unionSlug, wardId, villageId } = await params;
    
    // Fetch dynamic context from DB first
    const locationData = await getLocationBySlug(unionSlug);
    let ctx = null;
    let ward = null;

    if (locationData) {
        const fullContext = await getFullContextBySlug(unionSlug);
        const wards = await getWardsWithDetailsByUnion(locationData.id);
        const matchedWard = wards.find(w => w.id === wardId);
        
        if (!matchedWard) notFound();

        ctx = {
            district: fullContext.district,
            upazila: fullContext.upazila,
            union: {
                id: locationData.id,
                slug: locationData.slug,
                name: locationData.name_bn,
                wards: wards
            }
        };
        ward = matchedWard;
    } else {
        // Fallback to hardcoded locations.js
        ctx = findUnionBySlug(unionSlug);
        if (!ctx) notFound();

        ward = ctx.union.wards?.find((w) => w.id === wardId);
        if (!ward) notFound();
    }

    // Fetch dynamic village from DB
    let village = null;
    try {
        village = await wardService.getVillageById(villageId);
    } catch (error) {
        console.error("Village not found:", error);
        notFound();
    }

    if (!village) notFound();

    return <VillagePortalClient ctx={ctx} ward={ward} village={village} />;
}

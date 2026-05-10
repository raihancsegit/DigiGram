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
        
        // Match by ID or Slug
        const matchedWard = wards.find(w => w.id === wardId || w.slug === wardId);
        
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

        ward = ctx.union.wards?.find((w) => w.id === wardId || w.slug === wardId);
        if (!ward) notFound();
    }

    // Fetch dynamic village from DB
    let village = null;
    try {
        // Try UUID first if it looks like one, otherwise try Slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(villageId);
        if (isUUID) {
            village = await wardService.getVillageById(villageId);
        } else {
            village = await wardService.getVillageBySlug(villageId);
        }
    } catch (error) {
        console.error("Village resolution error:", error);
    }

    if (!village) notFound();

    return <VillagePortalClient ctx={ctx} ward={ward} village={village} />;
}

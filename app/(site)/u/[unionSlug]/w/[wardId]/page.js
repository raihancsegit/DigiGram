import { notFound } from 'next/navigation';
import { findUnionBySlug } from '@/lib/constants/locations';
import WardPortalClient from '@/components/sections/ward/WardPortalClient';
import { getLocationBySlug, getWardsWithDetailsByUnion, getFullContextBySlug } from '@/lib/services/hierarchyService';

export const dynamic = 'force-dynamic';

export default async function WardPortalPage({ params }) {
    const resolvedParams = await params;
    const { unionSlug, wardId } = resolvedParams;

    const locationData = await getLocationBySlug(unionSlug);
    let ctx = null;
    let ward = null;

    if (locationData) {
        const wards = await getWardsWithDetailsByUnion(locationData.id);
        const matchedWard = wards.find(w => w.id === wardId || w.slug === wardId);
        if (!matchedWard) notFound();

        // Construct dynamic context from DB using recursive parent fetching
        const fullContext = await getFullContextBySlug(unionSlug);
        
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
        ctx = findUnionBySlug(unionSlug);
        if (!ctx) notFound();

        ward = ctx.union.wards?.find((w) => w.id === wardId || w.slug === wardId);
        if (!ward) notFound();
    }

    return <WardPortalClient ctx={ctx} ward={ward} />;
}

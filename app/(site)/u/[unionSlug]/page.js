import { notFound } from 'next/navigation';
import { findUnionBySlug } from '@/lib/constants/locations';
import UnionPortalClient from '@/components/sections/union/UnionPortalClient';
import { getLocationBySlug, getActiveServices, getChairmanByLocation, getWardsWithDetailsByUnion, getFullContextBySlug } from '@/lib/services/hierarchyService';

export const dynamic = 'force-dynamic';

export default async function UnionPortalPage({ params }) {
    const resolvedParams = await params;
    const { unionSlug } = resolvedParams;

    // 1. Fetch dynamic Location and Services from Supabase
    const locationData = await getLocationBySlug(unionSlug);
    
    let ctx = null;
    let activeServices = [];
    let chairman = null;
    let wards = [];

    if (locationData) {
        wards = await getWardsWithDetailsByUnion(locationData.id);
        
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
        activeServices = await getActiveServices(locationData.id);
        chairman = await getChairmanByLocation(locationData.id);
    } else {
        // Fallback to static constants for backward compatibility
        ctx = findUnionBySlug(unionSlug);
        if (!ctx) notFound();
    }

    return <UnionPortalClient ctx={ctx} activeServices={activeServices} chairman={chairman} />;
}

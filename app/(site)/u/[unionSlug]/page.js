import { notFound } from 'next/navigation';
import { cache } from 'react';
import { findUnionBySlug } from '@/lib/constants/locations';
import UnionPortalClient from '@/components/sections/union/UnionPortalClient';
import {
    buildCleanDemoUnionContext,
    getActiveServices,
    getChairmanByLocation,
    getFullContextBySlug,
    getLocationBySlug,
    getWardsWithDetailsByUnion,
} from '@/lib/services/hierarchyService';

export const dynamic = 'force-dynamic';
const getUnionLocation = cache(getLocationBySlug);

export async function generateMetadata({ params }) {
    const { unionSlug } = await params;
    const demoCtx = buildCleanDemoUnionContext(unionSlug);
    const location = await getUnionLocation(unionSlug);
    const name = demoCtx?.union?.name || location?.name_bn || location?.name_en || findUnionBySlug(unionSlug)?.union?.name || 'ইউনিয়ন';

    return {
        title: `${name} ইউনিয়ন`,
        description: `${name} ইউনিয়নের নাগরিক সেবা, ওয়ার্ড, স্থানীয় সংবাদ, বাজারদর ও জরুরি তথ্য।`,
        alternates: { canonical: `/u/${unionSlug}` },
        openGraph: {
            title: `${name} ইউনিয়ন | DigiGram`,
            description: `${name} ইউনিয়নের ডিজিটাল নাগরিক সেবা ও স্থানীয় তথ্য।`,
        },
    };
}

export default async function UnionPortalPage({ params }) {
    const resolvedParams = await params;
    const { unionSlug } = resolvedParams;

    const demoCtx = buildCleanDemoUnionContext(unionSlug);
    const locationData = await getUnionLocation(unionSlug);

    let ctx = null;
    let activeServices = [];
    let chairman = null;
    let wards = [];

    if (locationData) {
        wards = await getWardsWithDetailsByUnion(locationData.id);
        const fullContext = await getFullContextBySlug(unionSlug);

        ctx = {
            district: fullContext.district,
            upazila: fullContext.upazila,
            union: {
                id: locationData.id,
                slug: locationData.slug,
                name: locationData.name_bn,
                wards,
            },
        };
        activeServices = await getActiveServices(locationData.id);
        chairman = await getChairmanByLocation(locationData.id);
    } else {
        ctx = findUnionBySlug(unionSlug) || demoCtx;
        if (!ctx) notFound();
    }

    return <UnionPortalClient ctx={ctx} activeServices={activeServices} chairman={chairman} />;
}

import { notFound } from 'next/navigation';
import { getWardFullContext } from '@/lib/services/hierarchyService';
import WardPortalClient from '@/components/sections/ward/WardPortalClient';
import { cache } from 'react';

export const dynamic = 'force-dynamic';
const getWard = cache(getWardFullContext);

export async function generateMetadata({ params }) {
    const { id } = await params;
    const data = await getWard(id);
    const name = data?.ward?.name_bn || data?.ward?.name || 'ওয়ার্ড';
    return {
        title: name,
        description: `${name}-এর নাগরিক তথ্য, পরিবার, রক্তদাতা, সংবাদ ও স্থানীয় সেবা।`,
        alternates: { canonical: `/w/${id}` },
    };
}

export default async function FlatWardPortalPage({ params }) {
    const { id } = await params;
    
    // This will work with both UUID IDs and Slugs if we handle it in hierarchyService
    const data = await getWard(id);
    
    if (!data || !data.ward) notFound();

    return <WardPortalClient ctx={data.ctx} ward={data.ward} />;
}

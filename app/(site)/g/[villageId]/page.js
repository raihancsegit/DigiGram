import { notFound } from 'next/navigation';
import { getVillageFullContext } from '@/lib/services/hierarchyService';
import VillagePortalClient from '@/components/sections/village/VillagePortalClient';
import { cache } from 'react';

export const dynamic = 'force-dynamic';
const getVillage = cache(getVillageFullContext);

export async function generateMetadata({ params }) {
    const { villageId } = await params;
    const data = await getVillage(villageId);
    const name = data?.village?.bn_name || data?.village?.name_bn || data?.village?.name || 'গ্রাম';
    return {
        title: name,
        description: `${name}-এর পরিবার, প্রতিষ্ঠান, স্থানীয় সংবাদ ও নাগরিক সেবার ডিজিটাল পোর্টাল।`,
        alternates: { canonical: `/g/${villageId}` },
    };
}

export default async function FlatVillagePortalPage({ params }) {
    const { villageId } = await params;
    
    const data = await getVillage(villageId);
    
    if (!data || !data.village) notFound();

    return <VillagePortalClient ctx={data.ctx} ward={data.ward} village={data.village} />;
}

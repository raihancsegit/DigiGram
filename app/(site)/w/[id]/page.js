import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getWardFullContext } from '@/lib/services/hierarchyService';
import WardPortalClient from '@/components/sections/ward/WardPortalClient';

export const dynamic = 'force-dynamic';

const getWard = cache(getWardFullContext);

function getDemoWardName(id) {
    const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const wardNumber = String(id || '').match(/demo-ward-(\d+)/)?.[1] || '1';
    const wardNumberBn = wardNumber.replace(/\d/g, (digit) => digits[Number(digit)] || digit);
    return `ডেমো ওয়ার্ড ${wardNumberBn}`;
}

export async function generateMetadata({ params }) {
    const { id } = await params;

    if (String(id || '').startsWith('demo-ward')) {
        const name = getDemoWardName(id);
        return {
            title: name,
            description: `${name}-এর নাগরিক তথ্য, পরিবার, রক্তদাতা, সংবাদ ও স্থানীয় সেবা।`,
            alternates: { canonical: `/w/${id}` },
        };
    }

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
    const data = await getWard(id);

    if (!data?.ward) notFound();

    return <WardPortalClient ctx={data.ctx} ward={data.ward} />;
}

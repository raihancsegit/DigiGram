import { notFound } from 'next/navigation';
import { findUnionBySlug, getAllUnionSlugs } from '@/lib/constants/locations';
import WardPortalClient from '@/components/sections/ward/WardPortalClient';

export async function generateStaticParams() {
    const params = [];
    for (const unionSlug of getAllUnionSlugs()) {
        const ctx = findUnionBySlug(unionSlug);
        if (ctx?.union?.wards) {
            for (const ward of ctx.union.wards) {
                params.push({ unionSlug, wardId: ward.id });
            }
        }
    }
    return params;
}

export default async function WardPortalPage({ params }) {
    const { unionSlug, wardId } = await params;
    const ctx = findUnionBySlug(unionSlug);
    if (!ctx) notFound();

    const ward = ctx.union.wards?.find((w) => w.id === wardId);
    if (!ward) notFound();

    return <WardPortalClient ctx={ctx} ward={ward} />;
}

import { notFound } from 'next/navigation';
import { findUnionBySlug, getAllUnionSlugs } from '@/lib/constants/locations';
import UnionPortalClient from '@/components/sections/union/UnionPortalClient';

export async function generateStaticParams() {
    return getAllUnionSlugs().map((unionSlug) => ({ unionSlug }));
}

export default async function UnionPortalPage({ params }) {
    const { unionSlug } = await params;
    const ctx = findUnionBySlug(unionSlug);
    if (!ctx) notFound();

    return <UnionPortalClient ctx={ctx} />;
}

import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { servicePageContent } from '@/lib/content/servicePages';
import ServicePageView from '@/components/templates/ServicePageView';

export async function generateStaticParams() {
    return Object.keys(servicePageContent).map((slug) => ({ slug }));
}

export default async function ServicePage({ params }) {
    const { slug } = await params;
    const data = servicePageContent[slug];
    if (!data) notFound();
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50" aria-busy="true" />}>
            <ServicePageView slug={slug} data={data} />
        </Suspense>
    );
}

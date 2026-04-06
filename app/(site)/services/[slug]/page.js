import { notFound } from 'next/navigation';
import { servicePageContent } from '@/lib/content/servicePages';
import ServicePageView from '@/components/templates/ServicePageView';

export async function generateStaticParams() {
    return Object.keys(servicePageContent).map((slug) => ({ slug }));
}

export default async function ServicePage({ params }) {
    const { slug } = await params;
    const data = servicePageContent[slug];
    if (!data) notFound();
    return <ServicePageView slug={slug} data={data} />;
}

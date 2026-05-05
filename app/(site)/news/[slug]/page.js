import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewsPage({ params }) {
    const { slug } = await params;
    return <div>Debug News Page: {slug}</div>;
}


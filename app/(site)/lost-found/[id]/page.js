import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LostFoundDetailPage({ params }) {
    const { id } = await params;
    return <div>Debug Lost-Found Page: {id}</div>;
}


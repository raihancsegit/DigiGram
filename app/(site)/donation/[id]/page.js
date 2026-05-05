import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DonationDetailPage({ params }) {
    const { id } = await params;
    return <div>Debug Donation Page: {id}</div>;
}


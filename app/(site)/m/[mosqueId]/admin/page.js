import MosqueAdminClient from '@/components/sections/mosque/MosqueAdminClient';

export default async function MosqueAdminPage({ params }) {
    const { mosqueId } = await params;
    return <MosqueAdminClient mosqueId={mosqueId} />;
}

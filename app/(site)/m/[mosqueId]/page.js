import MosquePortalClient from '@/components/sections/mosque/MosquePortalClient';

export default async function MosquePortalPage({ params }) {
    const { mosqueId } = await params;
    
    // In dynamic version, we will fetch DB for Mosque details by ID
    // For now, static mock passing the ID
    return <MosquePortalClient mosqueId={mosqueId} />;
}

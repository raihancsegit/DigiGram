export const dynamic = 'force-dynamic';

export default async function UnionPortalPage({ params }) {
    const { unionSlug } = await params;
    return <div>Debug Union Page: {unionSlug}</div>;
}

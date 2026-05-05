export const dynamic = 'force-dynamic';

export default async function WardPortalPage({ params }) {
    const { wardId } = await params;
    return <div>Debug Ward Page: {wardId}</div>;
}

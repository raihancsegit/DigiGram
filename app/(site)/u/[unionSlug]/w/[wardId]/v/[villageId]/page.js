export const dynamic = 'force-dynamic';

export default async function VillagePortalPage({ params }) {
    const { villageId } = await params;
    return <div>Debug Nested Village Page: {villageId}</div>;
}

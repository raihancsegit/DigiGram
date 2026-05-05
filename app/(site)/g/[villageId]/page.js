export const dynamic = 'force-dynamic';

export default async function FlatVillagePortalPage({ params }) {
    const { villageId } = await params;
    return <div>Debug Village Page: {villageId}</div>;
}

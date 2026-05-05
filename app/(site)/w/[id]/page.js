export const dynamic = 'force-dynamic';

export default async function FlatWardPortalPage({ params }) {
    const { id } = await params;
    return <div>Debug Ward Page: {id}</div>;
}

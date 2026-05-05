export const dynamic = 'force-dynamic';

export default async function TenantHomePage({ params }) {
    const resolvedParams = await params;
    const { domain } = resolvedParams;
    return <div>Debug Domain Page: {domain}</div>;
}

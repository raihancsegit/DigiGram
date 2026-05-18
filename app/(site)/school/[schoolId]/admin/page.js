import SchoolAdminClient from '@/components/sections/school/SchoolAdminClient';

export default async function SchoolAdminPage({ params }) {
    const { schoolId } = await params;
    return <SchoolAdminClient schoolId={schoolId} />;
}

import SchoolPortalShell from '@/components/sections/school/SchoolPortalShell';

export default async function SchoolStudentPage({ params }) {
    const { schoolId } = await params;
    return <SchoolPortalShell schoolId={schoolId} role="student" />;
}

import SchoolPortalShell from '@/components/sections/school/SchoolPortalShell';

export default async function SchoolTeacherPage({ params }) {
    const { schoolId } = await params;
    return <SchoolPortalShell schoolId={schoolId} role="teacher" />;
}

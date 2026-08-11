import { notFound } from 'next/navigation';
import TenantWebsiteClient from '@/components/sections/institution/TenantWebsiteClient';
import {
    getPublicInstitutionById,
    getTenantPage,
    getTenantPublicNotices
} from '@/lib/services/institutionTenantService';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { institutionId } = await params;
    const institution = await getPublicInstitutionById(institutionId);
    return {
        title: institution ? `${institution.name} | DigiGram` : 'প্রতিষ্ঠান পাওয়া যায়নি',
        description: institution ? `${institution.name} এর অফিসিয়াল ওয়েবসাইট` : 'DigiGram প্রতিষ্ঠান'
    };
}

export default async function InstitutionPublicWebsite({ params }) {
    const { institutionId } = await params;
    const institution = await getPublicInstitutionById(institutionId);
    if (!institution) notFound();

    const [page, notices] = await Promise.all([
        getTenantPage(institution.id),
        getTenantPublicNotices(institution.id)
    ]);

    return (
        <TenantWebsiteClient
            domain={institution.subdomain || institution.id}
            initialInstitution={institution}
            initialPage={page || {}}
            initialNotices={notices || []}
        />
    );
}

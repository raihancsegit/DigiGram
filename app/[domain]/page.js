import TenantWebsiteClient from '@/components/sections/institution/TenantWebsiteClient';
import {
    getTenantInstitutionByDomain,
    getTenantPage,
    getTenantPublicNotices
} from '@/lib/services/institutionTenantService';

export const dynamic = 'force-dynamic';

export default async function TenantHomePage({ params }) {
    const { domain } = await params;
    const decodedDomain = decodeURIComponent(domain);
    const subdomain = decodedDomain.replace(/\.localhost(?::\d+)?$/, '');
    const institution = await getTenantInstitutionByDomain(subdomain);
    const [page, notices] = institution
        ? await Promise.all([
            getTenantPage(institution.id),
            getTenantPublicNotices(institution.id)
        ])
        : [null, []];

    return (
        <TenantWebsiteClient
            domain={subdomain}
            initialInstitution={institution}
            initialPage={page}
            initialNotices={notices}
        />
    );
}

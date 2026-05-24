import TenantWebsiteClient from '@/components/sections/institution/TenantWebsiteClient';
import {
    getTenantInstitutionByDomain,
    getTenantPage,
    getTenantPublicNotices
} from '@/lib/services/institutionTenantService';

export const dynamic = 'force-dynamic';

function resolveDomain(domain) {
    const decodedDomain = decodeURIComponent(domain);
    return decodedDomain.replace(/\.localhost(?::\d+)?$/, '');
}

function buildSeo(institution, page, domain) {
    const seo = page?.footer_links?.seo || {};
    const title = seo.title || page?.footer_links?.site_name || page?.hero_title || institution?.name || 'DigiGram Institution';
    const description = seo.description || page?.hero_subtitle || page?.about_text || `${institution?.name || 'Institution'} powered by DigiGram.`;
    const image = seo.share_image_url || page?.banner_image_url || page?.logo_url || null;
    const canonical = institution?.custom_domain
        ? `https://${institution.custom_domain}`
        : `https://${domain}.digigram.com`;

    return { title, description, image, canonical, keywords: seo.keywords, favicon: seo.favicon_url || page?.logo_url };
}

export async function generateMetadata({ params }) {
    const { domain } = await params;
    const subdomain = resolveDomain(domain);
    const institution = await getTenantInstitutionByDomain(subdomain);
    const page = institution ? await getTenantPage(institution.id) : null;

    if (!institution) {
        return {
            title: 'Institution not found | DigiGram',
            description: 'The requested DigiGram institution website was not found.'
        };
    }

    const seo = buildSeo(institution, page, subdomain);

    return {
        title: seo.title,
        description: seo.description,
        keywords: seo.keywords,
        alternates: { canonical: seo.canonical },
        openGraph: {
            title: seo.title,
            description: seo.description,
            url: seo.canonical,
            siteName: seo.title,
            type: 'website',
            images: seo.image ? [{ url: seo.image, width: 1200, height: 630, alt: seo.title }] : []
        },
        twitter: {
            card: seo.image ? 'summary_large_image' : 'summary',
            title: seo.title,
            description: seo.description,
            images: seo.image ? [seo.image] : []
        },
        icons: seo.favicon ? { icon: seo.favicon, shortcut: seo.favicon, apple: seo.favicon } : undefined
    };
}

export default async function TenantHomePage({ params }) {
    const { domain } = await params;
    const subdomain = resolveDomain(domain);
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

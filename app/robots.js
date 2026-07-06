import { getSiteUrl } from '@/lib/utils/siteUrl';

export default function robots() {
    const siteUrl = getSiteUrl();

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/admin/',
                '/api/',
                '/chairman/',
                '/market-manager/',
                '/school/*/admin',
                '/school/*/student',
                '/school/*/teacher',
                '/volunteer/',
                '/ward-member/',
            ],
        },
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    };
}

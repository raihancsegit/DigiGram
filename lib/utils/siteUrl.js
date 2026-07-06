const FALLBACK_SITE_URL = 'http://localhost:3000';

export function getSiteUrl() {
    const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL
        || process.env.VERCEL_PROJECT_PRODUCTION_URL
        || process.env.VERCEL_URL
        || FALLBACK_SITE_URL;
    const withProtocol = /^https?:\/\//i.test(configuredUrl)
        ? configuredUrl
        : `https://${configuredUrl}`;

    return withProtocol.replace(/\/$/, '');
}

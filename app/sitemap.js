import { getSiteUrl } from '@/lib/utils/siteUrl';

const PUBLIC_ROUTES = [
    ['/', 'daily', 1],
    ['/area', 'weekly', 0.9],
    ['/citizen', 'weekly', 0.9],
    ['/track', 'weekly', 0.8],
    ['/pay', 'weekly', 0.8],
    ['/news', 'daily', 0.8],
    ['/lost-found', 'daily', 0.8],
    ['/business', 'weekly', 0.8],
    ['/services/blood', 'daily', 0.8],
    ['/services/e-clinic', 'weekly', 0.8],
    ['/services/emergency', 'monthly', 0.8],
    ['/services/fuel', 'daily', 0.8],
    ['/services/market', 'daily', 0.8],
    ['/services/school', 'weekly', 0.8],
    ['/services/donation', 'weekly', 0.7],
    ['/services/land-guard', 'monthly', 0.7],
    ['/services/vehicle-guard', 'monthly', 0.7],
    ['/roadmap', 'monthly', 0.5],
];

export default function sitemap() {
    const siteUrl = getSiteUrl();

    return PUBLIC_ROUTES.map(([path, changeFrequency, priority]) => ({
        url: `${siteUrl}${path}`,
        changeFrequency,
        priority,
    }));
}

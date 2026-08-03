export function getInstitutionWebsiteHref(institution) {
    const customDomain = institution?.custom_domain?.trim();
    if (customDomain) {
        return /^https?:\/\//i.test(customDomain) ? customDomain : `https://${customDomain}`;
    }
    if (institution?.id) return `/institution/${encodeURIComponent(institution.id)}`;
    if (institution?.subdomain) return `/${encodeURIComponent(institution.subdomain)}`;
    return '/';
}

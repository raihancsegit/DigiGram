import 'server-only';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export async function getTenantInstitutionByDomain(domainString) {
    const cleanDomain = domainString
        .split(':')[0]
        .trim()
        .toLowerCase();

    const { data, error } = await supabaseAdmin
        .from('institutions')
        .select('*')
        .or(`subdomain.eq.${cleanDomain},custom_domain.eq.${cleanDomain}`)
        .eq('website_status', 'active')
        .maybeSingle();

    if (error) {
        console.error('Tenant institution lookup failed:', cleanDomain, error);
        return null;
    }

    return data;
}

export async function getTenantPage(institutionId) {
    const { data, error } = await supabaseAdmin
        .from('institution_pages')
        .select('*')
        .eq('institution_id', institutionId)
        .maybeSingle();

    if (error) {
        console.error('Tenant page lookup failed:', institutionId, error);
        return null;
    }

    return data;
}

export async function getTenantPublicNotices(institutionId) {
    const { data, error } = await supabaseAdmin
        .from('institution_notices')
        .select('*')
        .eq('institution_id', institutionId)
        .eq('audience', 'public')
        .order('published_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Tenant notice lookup failed:', institutionId, error);
        return [];
    }

    return data || [];
}

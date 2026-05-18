import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export async function GET(request) {
    try {
        const domain = request.nextUrl.searchParams.get('domain')?.trim().toLowerCase();
        if (!domain) {
            return NextResponse.json({ error: 'domain is required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('institutions')
            .select('*')
            .or(`subdomain.eq.${domain},custom_domain.eq.${domain}`)
            .maybeSingle();

        if (error) throw error;
        return NextResponse.json({ data });
    } catch (error) {
        console.error('Tenant institution route failed:', error);
        return NextResponse.json({ error: error.message || 'Tenant lookup failed' }, { status: 500 });
    }
}

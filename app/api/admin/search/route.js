import { NextResponse } from 'next/server';
import { requireRequestProfile } from '@/lib/utils/server-auth';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export const dynamic = 'force-dynamic';

function like(value) {
    return `%${String(value || '').replace(/[%_]/g, '').trim()}%`;
}

function isSetupError(error) {
    return ['42P01', '42703', 'PGRST200', 'PGRST204', 'PGRST205'].includes(error?.code);
}

function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function withUuidFilter(baseFilters, q) {
    return isUuid(q) ? `id.eq.${q},${baseFilters}` : baseFilters;
}

async function safeSearch(key, label, queryFactory, mapRow) {
    try {
        const { data, error } = await queryFactory();
        if (error) {
            if (isSetupError(error)) return { key, label, rows: [], skipped: true, error: error.message };
            throw error;
        }
        return {
            key,
            label,
            rows: (data || []).map((row) => ({ ...mapRow(row), group: key, groupLabel: label })),
            skipped: false,
            error: null
        };
    } catch (error) {
        if (isSetupError(error)) return { key, label, rows: [], skipped: true, error: error.message };
        throw error;
    }
}

export async function GET(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin']);
        if (auth.response) return auth.response;

        const { searchParams } = new URL(request.url);
        const q = String(searchParams.get('q') || '').trim();
        if (q.length < 2) {
            return NextResponse.json({ success: true, data: { query: q, groups: [], rows: [] } });
        }

        const pattern = like(q);
        const exact = q;

        const groups = await Promise.all([
            safeSearch(
                'households',
                'Households',
                () => supabaseAdmin
                    .from('households')
                    .select('id,owner_name,house_no,phone,created_at,village:villages(bn_name),ward:locations(name_bn)')
                    .or(withUuidFilter(`owner_name.ilike.${pattern},house_no.ilike.${pattern},phone.ilike.${pattern}`, exact))
                    .order('created_at', { ascending: false })
                    .limit(8),
                (row) => ({
                    id: row.id,
                    title: row.owner_name || 'Household',
                    subtitle: [row.house_no && `House ${row.house_no}`, row.village?.bn_name, row.ward?.name_bn].filter(Boolean).join(' · '),
                    meta: row.phone || '',
                    href: `/h/${row.id}`
                })
            ),
            safeSearch(
                'residents',
                'Residents',
                () => supabaseAdmin
                    .from('residents')
                    .select('id,name,nid,birth_reg_no,phone,household_id,household:households(owner_name,house_no)')
                    .or(withUuidFilter(`name.ilike.${pattern},nid.ilike.${pattern},birth_reg_no.ilike.${pattern},phone.ilike.${pattern}`, exact))
                    .limit(8),
                (row) => ({
                    id: row.id,
                    title: row.name || 'Resident',
                    subtitle: row.household ? `${row.household.owner_name || 'Household'} · ${row.household.house_no || ''}` : 'Resident record',
                    meta: row.nid || row.birth_reg_no || row.phone || '',
                    href: row.household_id ? `/h/${row.household_id}` : ''
                })
            ),
            safeSearch(
                'services',
                'Service Requests',
                () => supabaseAdmin
                    .from('service_requests')
                    .select('id,request_type,status,applicant_name,contact_phone,certificate_no,created_at')
                    .or(isUuid(exact)
                        ? `id.eq.${exact},certificate_no.eq.${exact},applicant_name.ilike.${pattern},contact_phone.ilike.${pattern},request_type.ilike.${pattern}`
                        : `certificate_no.eq.${exact},applicant_name.ilike.${pattern},contact_phone.ilike.${pattern},request_type.ilike.${pattern}`)
                    .order('created_at', { ascending: false })
                    .limit(8),
                (row) => ({
                    id: row.id,
                    title: row.applicant_name || row.request_type || 'Service request',
                    subtitle: `${row.request_type || 'service'} · ${row.status || 'pending'}`,
                    meta: row.certificate_no || row.contact_phone || '',
                    href: `/track/${row.certificate_no || row.id}`
                })
            ),
            safeSearch(
                'complaints',
                'Complaints',
                () => supabaseAdmin
                    .from('citizen_complaints')
                    .select('id,title,status,citizen_name,phone,priority,created_at')
                    .or(withUuidFilter(`title.ilike.${pattern},citizen_name.ilike.${pattern},phone.ilike.${pattern}`, exact))
                    .order('created_at', { ascending: false })
                    .limit(8),
                (row) => ({
                    id: row.id,
                    title: row.title || 'Complaint',
                    subtitle: `${row.status || 'submitted'} · ${row.priority || 'normal'}`,
                    meta: row.citizen_name || row.phone || '',
                    href: `/track?id=${encodeURIComponent(row.id)}&phone=${encodeURIComponent(row.phone || '')}&type=complaint`
                })
            ),
            safeSearch(
                'appointments',
                'Appointments',
                () => supabaseAdmin
                    .from('citizen_appointments')
                    .select('id,title,status,citizen_name,phone,serial_no,preferred_date,created_at')
                    .or(withUuidFilter(`title.ilike.${pattern},citizen_name.ilike.${pattern},phone.ilike.${pattern}`, exact))
                    .order('created_at', { ascending: false })
                    .limit(8),
                (row) => ({
                    id: row.id,
                    title: row.title || 'Office serial',
                    subtitle: `${row.status || 'submitted'}${row.serial_no ? ` · Serial ${row.serial_no}` : ''}`,
                    meta: row.citizen_name || row.phone || '',
                    href: `/track?id=${encodeURIComponent(row.id)}&phone=${encodeURIComponent(row.phone || '')}&type=appointment`
                })
            ),
            safeSearch(
                'institutions',
                'Institutions',
                () => supabaseAdmin
                    .from('institutions')
                    .select('id,name,type,category,subdomain,phone,created_at')
                    .or(withUuidFilter(`name.ilike.${pattern},subdomain.ilike.${pattern},phone.ilike.${pattern}`, exact))
                    .order('created_at', { ascending: false })
                    .limit(8),
                (row) => ({
                    id: row.id,
                    title: row.name || 'Institution',
                    subtitle: [row.type, row.category, row.subdomain].filter(Boolean).join(' · '),
                    meta: row.phone || '',
                    href: row.subdomain ? `https://${row.subdomain}.localhost:3000` : '/admin/institutions'
                })
            ),
            safeSearch(
                'locations',
                'Locations',
                () => supabaseAdmin
                    .from('locations')
                    .select('id,name_bn,name_en,type,slug,parent_id')
                    .or(withUuidFilter(`name_bn.ilike.${pattern},name_en.ilike.${pattern},slug.ilike.${pattern}`, exact))
                    .order('type')
                    .limit(8),
                (row) => ({
                    id: row.id,
                    title: row.name_bn || row.name_en || 'Location',
                    subtitle: `${row.type || 'location'} · ${row.slug || row.id}`,
                    meta: row.name_en || '',
                    href: row.type === 'union' && row.slug ? `/u/${row.slug}` : `/admin/locations`
                })
            )
        ]);

        const rows = groups.flatMap((group) => group.rows);
        return NextResponse.json({ success: true, data: { query: q, groups, rows } });
    } catch (error) {
        console.error('Admin smart search failed:', error);
        return NextResponse.json({ error: error.message || 'Admin smart search failed' }, { status: 500 });
    }
}

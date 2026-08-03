import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { internalServerError } from '@/lib/utils/api-response';

const VALID_CATEGORIES = new Set([
    'doctor', 'pharmacy', 'grocery', 'restaurant', 'transport', 'mechanic',
    'electrician', 'plumber', 'teacher', 'tailor', 'agriculture', 'technology',
    'construction', 'beauty', 'other'
]);
const VALID_PLANS = new Set(['free', 'featured', 'premium']);
const VALID_STATUSES = new Set(['pending', 'approved', 'rejected', 'suspended']);
const PUBLIC_BUSINESS_FIELDS = `
    id,union_id,ward_id,village_id,name,category,description,phone,whatsapp,address,
    service_area,opening_hours,price_note,logo_url,cover_url,website_url,facebook_url,
    latitude,longitude,is_verified,is_featured,featured_until,
    union:locations!local_businesses_union_id_fkey(id,name_bn,name_en,slug),
    ward:locations!local_businesses_ward_id_fkey(id,name_bn,name_en),
    village:locations!local_businesses_village_id_fkey(id,name_bn,name_en)
`;
const MANAGED_BUSINESS_FIELDS = `
    id,union_id,ward_id,village_id,name,category,description,owner_name,phone,whatsapp,
    address,service_area,opening_hours,price_note,logo_url,cover_url,website_url,
    facebook_url,latitude,longitude,plan,status,is_verified,is_featured,featured_until,
    rejection_reason,view_count,contact_click_count,created_at,
    union:locations!local_businesses_union_id_fkey(id,name_bn,name_en,slug),
    ward:locations!local_businesses_ward_id_fkey(id,name_bn,name_en),
    village:locations!local_businesses_village_id_fkey(id,name_bn,name_en)
`;
const PUBLIC_AD_FIELDS = `
    id,business_id,title,subtitle,image_url,target_url,placement,
    business:local_businesses(id,name,phone,category,logo_url)
`;
const MANAGED_AD_FIELDS = `
    id,business_id,title,subtitle,image_url,target_url,placement,status,starts_at,ends_at,
    impression_count,click_count,
    business:local_businesses(id,name,phone,category,logo_url)
`;

function normalizePhone(value) {
    const digits = String(value || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

function cleanText(value, max = 500) {
    return String(value || '').trim().slice(0, max);
}

function bearerToken(request) {
    const header = request.headers.get('authorization') || '';
    return header.startsWith('Bearer ') ? header.slice(7) : null;
}

async function getOfficer(request) {
    const token = bearerToken(request);
    if (!token) return null;

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) return null;

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id,role,access_scope_id')
        .eq('id', authData.user.id)
        .maybeSingle();

    return profile || null;
}

async function resolveScope(locationId) {
    if (!locationId) return null;

    const { data: location, error } = await supabaseAdmin
        .from('locations')
        .select('id,type,parent_id,parent:parent_id(id,type,parent_id)')
        .eq('id', locationId)
        .maybeSingle();
    if (error) throw error;
    if (!location) return null;

    if (location.type === 'union') {
        return { unionId: location.id, wardId: null, villageId: null };
    }
    if (location.type === 'ward') {
        return { unionId: location.parent_id, wardId: location.id, villageId: null };
    }
    if (location.type === 'village') {
        return {
            unionId: location.parent?.parent_id || null,
            wardId: location.parent_id,
            villageId: location.id
        };
    }
    return null;
}

function canManage(officer, business) {
    if (!officer || !business) return false;
    if (officer.role === 'super_admin') return true;
    if (officer.role === 'chairman') return business.union_id === officer.access_scope_id;
    if (officer.role === 'ward_member') return business.ward_id === officer.access_scope_id;
    return false;
}

function isDirectoryMigrationError(error) {
    const code = error?.code;
    const message = String(error?.message || '');
    return ['42P01', '42703', 'PGRST200', 'PGRST204'].includes(code)
        || /local_businesses|business_ads|local_businesses_.*_fkey/i.test(message);
}

function isBackendUnavailableError(error) {
    const message = String(error?.message || '');
    return /fetch failed|eacces|network/i.test(message);
}

export async function GET(request) {
    try {
        const { searchParams } = request.nextUrl;
        const manage = searchParams.get('manage') === '1';
        const unionId = searchParams.get('unionId');
        const category = searchParams.get('category');
        const queryText = cleanText(searchParams.get('q'), 80);
        const limit = Math.min(Math.max(Number(searchParams.get('limit') || 60), 1), 200);
        const officer = manage ? await getOfficer(request) : null;

        let query = supabaseAdmin
            .from('local_businesses')
            .select(manage && officer ? MANAGED_BUSINESS_FIELDS : PUBLIC_BUSINESS_FIELDS)
            .order('is_featured', { ascending: false })
            .order('is_verified', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);

        if (manage && officer) {
            if (officer.role === 'chairman') query = query.eq('union_id', officer.access_scope_id);
            else if (officer.role === 'ward_member') query = query.eq('ward_id', officer.access_scope_id);
            else if (officer.role !== 'super_admin') query = query.eq('status', 'approved');
        } else {
            query = query.eq('status', 'approved');
        }

        if (unionId) query = query.eq('union_id', unionId);
        if (category && VALID_CATEGORIES.has(category)) query = query.eq('category', category);
        if (queryText) {
            const safeQuery = queryText.replace(/[%_,]/g, '');
            query = query.or(`name.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,address.ilike.%${safeQuery}%`);
        }

        const { data: businesses, error } = await query;
        if (error) throw error;

        let ads = [];
        const canReadAds = !manage || !officer || ['super_admin', 'chairman'].includes(officer.role);
        if (canReadAds) {
            let adsQuery = supabaseAdmin
                .from('business_ads')
                .select(manage && officer ? MANAGED_AD_FIELDS : PUBLIC_AD_FIELDS)
                .eq('status', 'active')
                .lte('starts_at', new Date().toISOString())
                .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
                .order('created_at', { ascending: false })
                .limit(12);
            if (manage && officer?.role === 'chairman') adsQuery = adsQuery.eq('union_id', officer.access_scope_id);
            if (unionId) adsQuery = adsQuery.eq('union_id', unionId);

            const { data: activeAds, error: adsError } = await adsQuery;
            if (adsError && adsError.code !== '42P01') throw adsError;
            ads = activeAds || [];
        }

        return NextResponse.json({
            success: true,
            data: businesses || [],
            ads,
            canManage: Boolean(officer && ['super_admin', 'chairman', 'ward_member'].includes(officer.role))
        });
    } catch (error) {
        console.error('Business directory load failed:', error);
        if (isDirectoryMigrationError(error)) {
            return NextResponse.json({
                success: false,
                code: 'BUSINESS_DIRECTORY_MIGRATION_REQUIRED',
                migration: 'database/61_local_business_directory_and_ads.sql',
                error: 'Business directory migration is required'
            }, { status: 503 });
        }
        if (isBackendUnavailableError(error)) {
            return NextResponse.json({
                success: false,
                code: 'BUSINESS_DIRECTORY_BACKEND_UNAVAILABLE',
                error: 'Business directory backend is unavailable'
            }, { status: 503 });
        }
        return internalServerError('Business directory could not be loaded. Please try again.');
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const phone = normalizePhone(body.phone);
        const whatsapp = normalizePhone(body.whatsapp);
        const category = VALID_CATEGORIES.has(body.category) ? body.category : 'other';
        const plan = VALID_PLANS.has(body.plan) ? body.plan : 'free';
        const scope = await resolveScope(body.locationId);

        if (!scope?.unionId) {
            return NextResponse.json({ error: 'সঠিক ইউনিয়ন, ওয়ার্ড বা গ্রাম নির্বাচন করুন' }, { status: 400 });
        }
        if (!cleanText(body.name, 120) || !cleanText(body.ownerName, 120) || !cleanText(body.address, 240)) {
            return NextResponse.json({ error: 'প্রতিষ্ঠানের নাম, মালিকের নাম ও ঠিকানা প্রয়োজন' }, { status: 400 });
        }
        if (!/^01[0-9]{9}$/.test(phone)) {
            return NextResponse.json({ error: 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন' }, { status: 400 });
        }

        const { data: duplicate } = await supabaseAdmin
            .from('local_businesses')
            .select('id,status')
            .eq('union_id', scope.unionId)
            .eq('phone', phone)
            .ilike('name', cleanText(body.name, 120))
            .in('status', ['pending', 'approved'])
            .maybeSingle();
        if (duplicate) {
            return NextResponse.json({ error: 'এই ব্যবসার আবেদন আগে থেকেই আছে' }, { status: 409 });
        }

        const payload = {
            ...scope,
            union_id: scope.unionId,
            ward_id: scope.wardId,
            village_id: scope.villageId,
            name: cleanText(body.name, 120),
            category,
            description: cleanText(body.description, 900),
            owner_name: cleanText(body.ownerName, 120),
            phone,
            whatsapp: /^01[0-9]{9}$/.test(whatsapp) ? whatsapp : null,
            address: cleanText(body.address, 240),
            service_area: cleanText(body.serviceArea, 180),
            opening_hours: cleanText(body.openingHours, 120),
            price_note: cleanText(body.priceNote, 180),
            website_url: cleanText(body.websiteUrl, 300) || null,
            facebook_url: cleanText(body.facebookUrl, 300) || null,
            logo_url: cleanText(body.logoUrl, 500) || null,
            plan,
            status: 'pending',
            is_verified: false,
            is_featured: false
        };
        delete payload.unionId;
        delete payload.wardId;
        delete payload.villageId;

        const { data, error } = await supabaseAdmin
            .from('local_businesses')
            .insert([payload])
            .select('id,name,status,plan')
            .single();
        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Business application failed:', error);
        return internalServerError('Business application failed. Please try again.');
    }
}

export async function PATCH(request) {
    try {
        const officer = await getOfficer(request);
        if (!officer) return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });

        const body = await request.json();
        const { data: business, error: loadError } = await supabaseAdmin
            .from('local_businesses')
            .select('id,union_id,ward_id,name,description,phone,logo_url,cover_url,website_url,plan,status,is_featured')
            .eq('id', body.id)
            .maybeSingle();
        if (loadError) throw loadError;
        if (!canManage(officer, business)) {
            return NextResponse.json({ error: 'এই এলাকার ব্যবসা পরিচালনার অনুমতি নেই' }, { status: 403 });
        }

        if (body.action === 'create_ad') {
            if (!['super_admin', 'chairman'].includes(officer.role)) {
                return NextResponse.json({ error: 'Sponsored ad চালু করতে চেয়ারম্যান অনুমোদন প্রয়োজন' }, { status: 403 });
            }
            if (business.status !== 'approved') {
                return NextResponse.json({ error: 'শুধু approved business-এর বিজ্ঞাপন চালু করা যাবে' }, { status: 400 });
            }

            const days = Math.min(Math.max(Number(body.days || 30), 1), 365);
            const startsAt = new Date();
            const endsAt = new Date(startsAt.getTime() + days * 86400000);
            const { data: ad, error: adError } = await supabaseAdmin
                .from('business_ads')
                .insert([{
                    business_id: business.id,
                    union_id: business.union_id,
                    title: cleanText(body.title, 140) || business.name,
                    subtitle: cleanText(body.subtitle, 220) || business.description,
                    image_url: business.cover_url || business.logo_url,
                    target_url: business.website_url || `tel:${business.phone}`,
                    placement: 'directory_top',
                    total_budget: Number(body.totalBudget || 0),
                    starts_at: startsAt.toISOString(),
                    ends_at: endsAt.toISOString(),
                    status: 'active',
                    approved_by: officer.id
                }])
                .select()
                .single();
            if (adError) throw adError;

            await supabaseAdmin
                .from('local_businesses')
                .update({
                    plan: 'premium',
                    is_featured: true,
                    featured_until: endsAt.toISOString()
                })
                .eq('id', business.id);

            return NextResponse.json({ success: true, data: ad });
        }

        const payload = {};
        if (body.status && VALID_STATUSES.has(body.status)) {
            payload.status = body.status;
            payload.rejection_reason = body.status === 'rejected' ? cleanText(body.reason, 300) : null;
            if (body.status === 'approved') {
                payload.is_verified = true;
                payload.approved_by = officer.id;
                payload.approved_at = new Date().toISOString();
            }
        }
        if (typeof body.isFeatured === 'boolean') {
            payload.is_featured = body.isFeatured;
            payload.plan = body.isFeatured ? (business.plan === 'free' ? 'featured' : business.plan) : business.plan;
            payload.featured_until = body.isFeatured
                ? new Date(Date.now() + Math.max(Number(body.days || 30), 1) * 86400000).toISOString()
                : null;
        }

        const { data, error } = await supabaseAdmin
            .from('local_businesses')
            .update(payload)
            .eq('id', body.id)
            .select(MANAGED_BUSINESS_FIELDS)
            .single();
        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Business moderation failed:', error);
        return internalServerError('Business moderation failed. Please try again.');
    }
}

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { canAccessLocation, requireRequestProfile } from '@/lib/utils/server-auth';

function normalizePhone(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

export async function GET(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin', 'chairman', 'market_manager']);
        if (auth.response) return auth.response;

        const { searchParams } = new URL(request.url);
        const locationId = searchParams.get('locationId');
        const marketId = searchParams.get('marketId');
        const limit = Math.min(Number(searchParams.get('limit') || 30), 100);
        if (
            auth.profile.role !== 'super_admin'
            && (!locationId || !(await canAccessLocation(auth.profile, locationId)))
        ) {
            return NextResponse.json({ error: 'Market complaint scope is outside your assigned area' }, { status: 403 });
        }

        let query = supabaseAdmin
            .from('market_complaints')
            .select('*, market:markets(id, name)')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (locationId) query = query.eq('location_id', locationId);
        if (marketId) query = query.eq('market_id', marketId);

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Market complaints fetch failed:', error);
        return NextResponse.json({ error: error.message || 'Market complaints fetch failed' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const phone = normalizePhone(body.phone);

        if (!body.locationId || !body.name || !body.note) {
            return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
        }
        if (!/^01[0-9]{9}$/.test(phone)) {
            return NextResponse.json({ error: 'Valid mobile number is required' }, { status: 400 });
        }

        const recentCutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const { count: recentCount, error: rateError } = await supabaseAdmin
            .from('market_complaints')
            .select('id', { count: 'exact', head: true })
            .eq('complainant_phone', phone)
            .gte('created_at', recentCutoff);
        if (rateError) throw rateError;
        if (Number(recentCount || 0) > 0) {
            return NextResponse.json({ error: 'Please wait before submitting another complaint' }, { status: 429 });
        }

        const payload = {
            location_id: body.locationId,
            market_id: body.marketId || null,
            complainant_name: body.name,
            complainant_phone: phone,
            complaint_type: body.type || 'high_price',
            note: body.note,
            status: 'pending'
        };

        const { data, error } = await supabaseAdmin
            .from('market_complaints')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Market complaint create failed:', error);
        return NextResponse.json({ error: error.message || 'Market complaint create failed' }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin', 'chairman', 'market_manager']);
        if (auth.response) return auth.response;

        const body = await request.json();
        const allowedStatuses = ['pending', 'reviewing', 'resolved', 'rejected'];

        if (!body.id || !allowedStatuses.includes(body.status)) {
            return NextResponse.json({ error: 'Valid complaint id and status are required' }, { status: 400 });
        }

        const payload = {
            status: body.status,
            officer_note: body.officerNote || null,
            reviewed_at: ['resolved', 'rejected'].includes(body.status) ? new Date().toISOString() : null
        };

        payload.reviewed_by = auth.profile.id;

        const { data: complaint } = await supabaseAdmin
            .from('market_complaints')
            .select('id,location_id')
            .eq('id', body.id)
            .maybeSingle();
        if (!complaint) {
            return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
        }
        if (
            auth.profile.role !== 'super_admin'
            && !(await canAccessLocation(auth.profile, complaint.location_id))
        ) {
            return NextResponse.json({ error: 'Market complaint is outside your assigned area' }, { status: 403 });
        }

        const { data, error } = await supabaseAdmin
            .from('market_complaints')
            .update(payload)
            .eq('id', body.id)
            .select('*, market:markets(id, name)')
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Market complaint update failed:', error);
        return NextResponse.json({ error: error.message || 'Market complaint update failed' }, { status: 500 });
    }
}

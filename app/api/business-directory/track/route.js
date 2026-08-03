import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export async function POST(request) {
    try {
        const body = await request.json();
        const target = body.target === 'ad' ? 'ad' : 'business';
        const validEvents = target === 'ad' ? ['impression', 'click'] : ['view', 'contact'];
        if (!body.id || !validEvents.includes(body.event)) {
            return NextResponse.json({ error: 'Invalid tracking event' }, { status: 400 });
        }

        const table = target === 'ad' ? 'business_ads' : 'local_businesses';
        const column = target === 'ad'
            ? (body.event === 'click' ? 'click_count' : 'impression_count')
            : (body.event === 'contact' ? 'contact_click_count' : 'view_count');
        let query = supabaseAdmin
            .from(table)
            .select(`id,${column}`)
            .eq('id', body.id);

        if (target === 'ad') {
            query = query
                .eq('status', 'active')
                .lte('starts_at', new Date().toISOString())
                .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`);
        } else {
            query = query.eq('status', 'approved');
        }

        const { data: row } = await query.maybeSingle();

        if (row) {
            await supabaseAdmin
                .from(table)
                .update({ [column]: Number(row[column] || 0) + 1 })
                .eq('id', body.id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Business tracking failed:', error);
        return NextResponse.json({ success: false }, { status: 200 });
    }
}

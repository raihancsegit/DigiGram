import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export async function POST(request) {
    try {
        const body = await request.json();
        if (!body.id || !['view', 'contact'].includes(body.event)) {
            return NextResponse.json({ error: 'Invalid tracking event' }, { status: 400 });
        }

        const column = body.event === 'contact' ? 'contact_click_count' : 'view_count';
        const { data: business } = await supabaseAdmin
            .from('local_businesses')
            .select(`id,${column}`)
            .eq('id', body.id)
            .eq('status', 'approved')
            .maybeSingle();

        if (business) {
            await supabaseAdmin
                .from('local_businesses')
                .update({ [column]: Number(business[column] || 0) + 1 })
                .eq('id', body.id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Business tracking failed:', error);
        return NextResponse.json({ success: false }, { status: 200 });
    }
}

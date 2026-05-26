import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

function normalizePhone(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

export async function POST(request) {
    try {
        const body = await request.json();
        const phone = normalizePhone(body.phone);
        const { locationId, marketId, commodityId, alertType = 'any_change', targetPrice } = body;

        if (!/^01[0-9]{9}$/.test(phone)) {
            return NextResponse.json({ error: 'Valid mobile number is required' }, { status: 400 });
        }

        if (!locationId || !marketId || !commodityId) {
            return NextResponse.json({ error: 'Market, union and commodity are required' }, { status: 400 });
        }

        if (alertType === 'target_below' && (!targetPrice || Number(targetPrice) <= 0)) {
            return NextResponse.json({ error: 'Target price is required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('market_price_alert_subscriptions')
            .upsert({
                location_id: locationId,
                market_id: marketId,
                commodity_id: commodityId,
                phone,
                alert_type: alertType,
                target_price: alertType === 'target_below' ? Number(targetPrice) : null,
                is_active: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'location_id,market_id,commodity_id,phone,alert_type' })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Market alert subscription failed:', error);
        return NextResponse.json({ error: error.message || 'Market alert subscription failed' }, { status: 500 });
    }
}

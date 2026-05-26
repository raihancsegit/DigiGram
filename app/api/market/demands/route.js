import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

function normalizePhone(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

async function getUnionHouseholdPhones(locationId) {
    const { data: wards } = await supabaseAdmin
        .from('locations')
        .select('id')
        .eq('parent_id', locationId);

    const wardIds = (wards || []).map((item) => item.id);
    if (wardIds.length === 0) return [];

    const { data: households, error } = await supabaseAdmin
        .from('households')
        .select('phone')
        .in('ward_id', wardIds)
        .not('phone', 'is', null)
        .limit(1000);

    if (error) throw error;
    return [...new Set((households || []).map((item) => normalizePhone(item.phone)).filter((phone) => /^01[0-9]{9}$/.test(phone)))];
}

async function queueDemandSmsBoost({ demand, locationId }) {
    const { data: wallet, error: walletError } = await supabaseAdmin
        .from('sms_wallets')
        .upsert({ owner_type: 'location', owner_id: locationId }, { onConflict: 'owner_type,owner_id' })
        .select()
        .single();

    if (walletError) throw walletError;

    const recipients = await getUnionHouseholdPhones(locationId);
    const sendLimit = Math.min(Number(wallet.balance || 0), 500);
    const sendable = recipients.slice(0, sendLimit);

    if (sendable.length === 0) {
        await supabaseAdmin
            .from('market_demands')
            .update({ sms_boost_status: 'skipped_no_wallet', sms_boost_count: 0 })
            .eq('id', demand.id);
        return { status: 'skipped_no_wallet', count: 0 };
    }

    const typeLabel = demand.demand_type === 'buy' ? 'কিনতে চাই' : 'বিক্রি করব';
    const message = `${typeLabel}: ${demand.title}. পরিমাণ: ${demand.quantity || 'উল্লেখ নেই'}। যোগাযোগ: ${demand.contact_phone}. DigiGram বাজার।`;
    const rows = sendable.map((recipientPhone) => ({
        wallet_id: wallet.id,
        owner_type: 'location',
        owner_id: locationId,
        recipient_phone: recipientPhone,
        message,
        category: 'market_demand_boost',
        source_type: 'market_demands',
        source_id: demand.id
    }));

    const { error: smsError } = await supabaseAdmin.from('sms_messages').insert(rows);
    if (smsError) throw smsError;

    await supabaseAdmin
        .from('sms_wallets')
        .update({ balance: Number(wallet.balance || 0) - sendable.length, updated_at: new Date().toISOString() })
        .eq('id', wallet.id);

    await supabaseAdmin.from('sms_wallet_transactions').insert([{
        wallet_id: wallet.id,
        transaction_type: 'usage',
        credits: -sendable.length,
        reference_type: 'market_demands',
        reference_id: demand.id,
        note: 'market_demand_boost'
    }]);

    await supabaseAdmin
        .from('market_demands')
        .update({ sms_boost_status: 'queued', sms_boost_count: sendable.length })
        .eq('id', demand.id);

    return { status: 'queued', count: sendable.length };
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const locationId = searchParams.get('locationId');
        const marketId = searchParams.get('marketId');
        const limit = Math.min(Number(searchParams.get('limit') || 20), 50);

        let query = supabaseAdmin
            .from('market_demands')
            .select(`
                *,
                commodity:market_commodities(id, name, unit, icon),
                market:markets(id, name)
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (locationId) query = query.eq('location_id', locationId);
        if (marketId) query = query.eq('market_id', marketId);

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Market demands fetch failed:', error);
        return NextResponse.json({ error: error.message || 'Market demands fetch failed' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const phone = normalizePhone(body.contactPhone);

        if (!/^01[0-9]{9}$/.test(phone)) {
            return NextResponse.json({ error: 'Valid mobile number is required' }, { status: 400 });
        }
        if (!body.locationId || !body.title || !body.contactName) {
            return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
        }

        const payload = {
            location_id: body.locationId,
            market_id: body.marketId || null,
            commodity_id: body.commodityId || null,
            demand_type: body.demandType === 'sell' ? 'sell' : 'buy',
            title: body.title,
            quantity: body.quantity || '',
            expected_price: body.expectedPrice ? Number(body.expectedPrice) : null,
            contact_name: body.contactName,
            contact_phone: phone,
            village_name: body.villageName || '',
            note: body.note || '',
            phone_verified: false,
            sms_boost_requested: Boolean(body.smsBoost)
        };

        const { data: demand, error } = await supabaseAdmin
            .from('market_demands')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;

        let boost = null;
        if (body.smsBoost) {
            boost = await queueDemandSmsBoost({ demand, locationId: body.locationId });
        }

        return NextResponse.json({ success: true, data: demand, boost });
    } catch (error) {
        console.error('Market demand create failed:', error);
        return NextResponse.json({ error: error.message || 'Market demand create failed' }, { status: 500 });
    }
}

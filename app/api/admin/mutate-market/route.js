import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { canAccessLocation, requireRequestProfile } from '@/lib/utils/server-auth';

function normalizePhone(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

function shouldNotifyPriceAlert(subscription, price, trend) {
    if (!subscription?.is_active) return false;
    if (subscription.last_notified_at) {
        const last = new Date(subscription.last_notified_at).getTime();
        if (Date.now() - last < 6 * 60 * 60 * 1000) return false;
    }

    if (subscription.alert_type === 'price_down') return trend === 'down';
    if (subscription.alert_type === 'price_up') return trend === 'up';
    if (subscription.alert_type === 'target_below') {
        return Number(subscription.target_price || 0) > 0 && Number(price) <= Number(subscription.target_price);
    }
    return trend !== 'stable';
}

async function queueMarketPriceAlerts(supabaseAdmin, { marketId, commodityId, price, prevPrice, trend, updated }) {
    try {
        const { data: market } = await supabaseAdmin
            .from('markets')
            .select('id, name, location_id')
            .eq('id', marketId)
            .maybeSingle();

        if (!market?.location_id) return { queued: 0, reason: 'market_location_missing' };

        const { data: commodity } = await supabaseAdmin
            .from('market_commodities')
            .select('id, name, unit')
            .eq('id', commodityId)
            .maybeSingle();

        const { data: subscriptions, error: subError } = await supabaseAdmin
            .from('market_price_alert_subscriptions')
            .select('*')
            .eq('market_id', marketId)
            .eq('commodity_id', commodityId)
            .eq('is_active', true);

        if (subError) throw subError;

        const matched = (subscriptions || []).filter((item) => shouldNotifyPriceAlert(item, price, trend));
        if (matched.length === 0) return { queued: 0 };

        const { data: wallet, error: walletError } = await supabaseAdmin
            .from('sms_wallets')
            .upsert({ owner_type: 'location', owner_id: market.location_id }, { onConflict: 'owner_type,owner_id' })
            .select()
            .single();

        if (walletError) throw walletError;

        const available = Number(wallet.balance || 0);
        const sendable = matched.slice(0, Math.max(0, available));
        if (sendable.length === 0) return { queued: 0, reason: 'empty_wallet' };

        const message = `${market.name}: ${commodity?.name || 'পণ্য'} এখন ${price} টাকা/${commodity?.unit || 'unit'}। আগের দর ${prevPrice}। DigiGram বাজারদর।`;
        const rows = sendable.map((item) => ({
            wallet_id: wallet.id,
            owner_type: 'location',
            owner_id: market.location_id,
            recipient_phone: normalizePhone(item.phone),
            message,
            category: 'market_price_alert',
            source_type: 'market_prices',
            source_id: updated?.id || null
        }));

        const { error: smsError } = await supabaseAdmin.from('sms_messages').insert(rows);
        if (smsError) throw smsError;

        const nextBalance = available - sendable.length;
        await supabaseAdmin
            .from('sms_wallets')
            .update({ balance: nextBalance, updated_at: new Date().toISOString() })
            .eq('id', wallet.id);

        await supabaseAdmin.from('sms_wallet_transactions').insert([{
            wallet_id: wallet.id,
            transaction_type: 'usage',
            credits: -sendable.length,
            reference_type: 'market_prices',
            reference_id: updated?.id || null,
            note: 'market_price_alert'
        }]);

        await supabaseAdmin
            .from('market_price_alert_subscriptions')
            .update({ last_notified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .in('id', sendable.map((item) => item.id));

        return { queued: sendable.length, skipped: matched.length - sendable.length };
    } catch (error) {
        console.error('Market price alert queue failed:', error);
        return { queued: 0, error: error.message };
    }
}

export async function POST(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin', 'chairman', 'market_manager']);
        if (auth.response) return auth.response;

        const body = await request.json();
        const { action, data } = body;

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        let targetLocationId = data?.locationId || null;
        if (!targetLocationId && data?.id) {
            const { data: market } = await supabaseAdmin
                .from('markets')
                .select('location_id')
                .eq('id', data.id)
                .maybeSingle();
            targetLocationId = market?.location_id || null;
        }
        if (!targetLocationId && data?.marketId) {
            const { data: market } = await supabaseAdmin
                .from('markets')
                .select('location_id')
                .eq('id', data.marketId)
                .maybeSingle();
            targetLocationId = market?.location_id || null;
        }
        if (!targetLocationId || !(await canAccessLocation(auth.profile, targetLocationId))) {
            return NextResponse.json({ error: 'This market is outside your assigned scope' }, { status: 403 });
        }

        if (action === 'create_market') {
            const { name, type, days, locationId, managerId } = data;
            
            const { data: market, error } = await supabaseAdmin
                .from('markets')
                .insert({
                    name,
                    type,
                    days,
                    location_id: locationId,
                    manager_id: managerId || null
                })
                .select()
                .single();
            
            if (error) throw error;

            // Automatically upgrade the assigned user to 'market_manager'
            if (managerId) {
                await supabaseAdmin
                    .from('profiles')
                    .update({ 
                        role: 'market_manager',
                        access_scope_id: locationId
                    })
                    .eq('id', managerId);
            }

            return NextResponse.json({ success: true, data: market });
        }

        if (action === 'update_market') {
            const { id, name, type, managerId } = data;
            const { data: market, error } = await supabaseAdmin
                .from('markets')
                .update({
                    name,
                    type,
                    manager_id: managerId || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            
            if (managerId) {
                await supabaseAdmin
                    .from('profiles')
                    .update({ role: 'market_manager' }) // access_scope_id remains unchanged here assuming it's already set or not needed to be changed strictly
                    .eq('id', managerId);
            }
            
            return NextResponse.json({ success: true, data: market });
        }

        if (action === 'delete_market') {
            const { id } = data;
            const { error } = await supabaseAdmin
                .from('markets')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'update_price') {
            const { marketId, commodityId, price, supply, updatedBy } = data;

            // 1. Get current price to calculate trend
            const { data: currentRecord } = await supabaseAdmin
                .from('market_prices')
                .select('price')
                .eq('market_id', marketId)
                .eq('commodity_id', commodityId)
                .maybeSingle();
            
            const prevPrice = currentRecord?.price || price;
            let trend = 'stable';
            if (price > prevPrice) trend = 'up';
            else if (price < prevPrice) trend = 'down';

            // 2. Insert or Update the new price
            let updated;
            let error;
            
            const payload = {
                market_id: marketId,
                commodity_id: commodityId,
                price,
                prev_price: prevPrice,
                trend,
                supply,
                updated_at: new Date().toISOString(),
                updated_by: updatedBy
            };

            if (currentRecord) {
                // Update existing
                const res = await supabaseAdmin
                    .from('market_prices')
                    .update(payload)
                    .eq('market_id', marketId)
                    .eq('commodity_id', commodityId)
                    .select()
                    .single();
                updated = res.data;
                error = res.error;
            } else {
                // Insert new
                const res = await supabaseAdmin
                    .from('market_prices')
                    .insert(payload)
                    .select()
                    .single();
                updated = res.data;
                error = res.error;
            }
            
            if (error) throw error;

            // 3. Save to History for date-wise tracking
            await supabaseAdmin
                .from('market_price_history')
                .insert({
                    market_id: marketId,
                    commodity_id: commodityId,
                    price: price,
                    supply: supply,
                    recorded_at: new Date().toISOString()
                });

            const alertResult = await queueMarketPriceAlerts(supabaseAdmin, {
                marketId,
                commodityId,
                price,
                prevPrice,
                trend,
                updated
            });

            return NextResponse.json({ success: true, data: updated, alertResult });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (err) {
        console.error('Mutate Market Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

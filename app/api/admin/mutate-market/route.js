import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { action, data } = body;

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

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

            return NextResponse.json({ success: true, data: updated });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (err) {
        console.error('Mutate Market Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

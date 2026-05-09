import { supabase } from '../utils/supabase';

/**
 * Service for Market (Hat-Bazar) operations.
 */
export const marketService = {
    // 1. Fetch all available commodities
    getCommodities: async () => {
        const { data, error } = await supabase
            .from('market_commodities')
            .select('*')
            .order('category', { ascending: true });
        
        if (error) throw error;
        return data;
    },

    // 2. Fetch markets for a specific union
    getMarketsByUnion: async (unionId, managerId = null) => {
        let query = supabase
            .from('markets')
            .select(`
                *,
                manager:profiles(id, first_name, last_name, phone)
            `)
            .eq('location_id', unionId)
            .eq('is_active', true)
            .order('name', { ascending: true });
            
        if (managerId) {
            query = query.eq('manager_id', managerId);
        }
            
        const { data, error } = await query;
        
        if (error) throw error;
        return data;
    },

    // 3. Fetch latest prices for a market
    getMarketPrices: async (marketId) => {
        const { data, error } = await supabase
            .from('market_prices')
            .select(`
                *,
                commodity:market_commodities(*)
            `)
            .eq('market_id', marketId);
        
        if (error) throw error;
        return data;
    },

    // 4. Fetch price history for comparison
    getPriceHistory: async (marketId, commodityId, days = 30) => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('market_price_history')
            .select('*')
            .eq('market_id', marketId)
            .eq('commodity_id', commodityId)
            .gte('recorded_at', startDate.toISOString())
            .order('recorded_at', { ascending: true });
        
        if (error) throw error;
        return data;
    },

    // 4. Global Market Data (For District Dashboard)
    getGlobalMarketOverview: async () => {
        // Fetch all active markets and their prices
        const { data: markets, error: mError } = await supabase
            .from('markets')
            .select('id, name, type, location_id, slug:locations(slug)')
            .eq('is_active', true);
        
        if (mError) throw mError;

        const { data: prices, error: pError } = await supabase
            .from('market_prices')
            .select(`
                *,
                commodity:market_commodities(id, name, unit, category, icon)
            `);
        
        if (pError) throw pError;

        return { markets, prices };
    },

    // 6. Fetch all markets globally with location info (For Super Admin)
    getAllMarketsGlobal: async () => {
        const { data, error } = await supabase
            .from('markets')
            .select(`
                *,
                location:locations(id, name_bn, slug),
                manager:profiles(id, first_name, last_name, phone)
            `)
            .order('name', { ascending: true });
        
        if (error) throw error;
        return data;
    },

    // 5. Update/Upsert Price (For Market Managers)
    updatePrice: async ({ marketId, commodityId, price, supply, updatedBy }) => {
        const response = await fetch('/api/admin/mutate-market', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update_price',
                data: { marketId, commodityId, price, supply, updatedBy }
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Update failed');
        return result.data;
    },

    // 6. Create Market (For Chairman/Admin)
    createMarket: async (marketData) => {
        const response = await fetch('/api/admin/mutate-market', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create_market',
                data: marketData
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Creation failed');
        return result.data;
    },

    // 7. Update Market
    updateMarket: async (marketData) => {
        const response = await fetch('/api/admin/mutate-market', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update_market',
                data: marketData
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Update failed');
        return result.data;
    },

    // 8. Delete Market
    deleteMarket: async (id) => {
        const response = await fetch('/api/admin/mutate-market', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete_market',
                data: { id }
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Delete failed');
        return true;
    }
};

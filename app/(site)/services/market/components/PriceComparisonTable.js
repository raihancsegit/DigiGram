"use client";

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function PriceComparisonTable({ 
    filterProduct = '', 
    commodities = [], 
    markets = [], 
    prices = [],
    onShowHistory
}) {
    // Process prices into a searchable object: { [marketId]: { [commodityId]: data } }
    const priceMap = prices.reduce((acc, p) => {
        if (!acc[p.market_id]) acc[p.market_id] = {};
        acc[p.market_id][p.commodity_id] = p;
        return acc;
    }, {});

    // Filter commodities based on search input
    const visibleCommodities = commodities.filter(c => 
        !filterProduct || c.name.toLowerCase().includes(filterProduct.toLowerCase())
    );

    return (
        <div className="bg-white overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="py-6 px-8 font-black text-[10px] uppercase tracking-[0.2em] min-w-[220px] border-b border-white/10">পণ্য ও একক</th>
                            {markets.map(market => (
                                <th key={market.id} className="py-6 px-8 font-black text-slate-100 min-w-[200px] border-b border-white/10 border-l border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-sm tracking-tight">{market.name}</span>
                                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-1">{market.type}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {visibleCommodities.length > 0 ? visibleCommodities.map(commodity => {
                            // Find min price for this commodity among these markets
                            let minPrice = Infinity;
                            markets.forEach(m => {
                                const p = priceMap[m.id]?.[commodity.id]?.price;
                                if (p && Number(p) < minPrice) minPrice = Number(p);
                            });

                            return (
                                <tr key={commodity.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="py-6 px-8 border-r border-slate-50 bg-slate-50/30">
                                        <div className="flex items-center gap-4">
                                            <span className="text-4xl bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 border border-slate-100">{commodity.icon}</span>
                                            <div>
                                                <p className="font-black text-slate-800 text-base">{commodity.name}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{commodity.unit}</p>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    {markets.map(market => {
                                        const marketData = priceMap[market.id]?.[commodity.id];
                                        const isCheapest = marketData && Number(marketData.price) === minPrice;
                                        
                                        if (!marketData) {
                                            return <td key={`${commodity.id}-${market.id}`} className="py-6 px-8 text-slate-300 italic text-xs border-l border-slate-50">- তথ্য নেই -</td>;
                                        }

                                        return (
                                            <td 
                                                key={`${commodity.id}-${market.id}`} 
                                                onClick={() => onShowHistory(commodity.id, market.id)}
                                                className={`py-6 px-8 border-l border-slate-50 transition-all cursor-pointer hover:bg-teal-50 group/cell ${isCheapest ? 'bg-emerald-50/50' : ''}`}
                                            >
                                                <div className="flex flex-col">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className={`font-black text-xl tracking-tighter ${isCheapest ? 'text-emerald-700' : 'text-slate-900'}`}>
                                                            ৳{Number(marketData.price).toLocaleString('bn-BD')}
                                                        </span>
                                                        {isCheapest && markets.length > 1 && (
                                                            <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded ml-1 animate-pulse">সেরা দর</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {marketData.trend === 'up' && <TrendingUp size={14} className="text-rose-500" />}
                                                        {marketData.trend === 'down' && <TrendingDown size={14} className="text-emerald-500" />}
                                                        {marketData.trend === 'stable' && <Minus size={14} className="text-slate-300" />}
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                                            marketData.supply === 'High' || marketData.supply === 'Very High' 
                                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                                                : marketData.supply === 'Low' 
                                                                    ? 'bg-rose-100 text-rose-600 border border-rose-200' 
                                                                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                                                        }`}>
                                                            {marketData.supply === 'High' ? 'পর্যাপ্ত' : marketData.supply === 'Low' ? 'সংকট' : 'স্বাভাবিক'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={markets.length + 1} className="py-20 text-center text-slate-400 font-black">
                                    কোনো পণ্য পাওয়া যায়নি
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

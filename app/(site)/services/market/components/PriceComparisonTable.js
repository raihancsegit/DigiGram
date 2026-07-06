"use client";

import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Filter, Package, Wheat, Apple, Beef, Fish, Milk, Sparkles } from 'lucide-react';
import { toBnDigits } from '@/lib/utils/format';

const COMMODITY_ICONS = {
    package: Package,
    wheat: Wheat,
    grain: Wheat,
    fruit: Apple,
    apple: Apple,
    meat: Beef,
    beef: Beef,
    fish: Fish,
    milk: Milk,
};

function CommodityIcon({ value }) {
    const Icon = COMMODITY_ICONS[String(value || '').toLowerCase()];
    if (Icon) return <Icon size={26} aria-hidden="true" />;
    return <span aria-hidden="true">{value || '📦'}</span>;
}

export function PriceComparisonTable({ 
    filterProduct = '', 
    commodities = [], 
    markets = [], 
    prices = [],
    onShowHistory
}) {
    const [selectedUnionSlug, setSelectedUnionSlug] = useState('');

    // Extract unique unions from the markets list to use as filter pills
    const uniqueUnions = useMemo(() => {
        const map = new Map();
        markets.forEach(m => {
            if (m.union?.slug) {
                map.set(m.union.slug, m.union);
            }
        });
        return Array.from(map.values());
    }, [markets]);

    // Filter markets by selected union slug
    const filteredMarkets = useMemo(() => {
        if (!selectedUnionSlug) return markets;
        return markets.filter(m => m.union?.slug === selectedUnionSlug);
    }, [markets, selectedUnionSlug]);

    // Process prices into a searchable object: { [marketId]: { [commodityId]: data } }
    const priceMap = useMemo(() => {
        return prices.reduce((acc, p) => {
            if (!acc[p.market_id]) acc[p.market_id] = {};
            acc[p.market_id][p.commodity_id] = p;
            return acc;
        }, {});
    }, [prices]);

    // Filter commodities based on search input
    const visibleCommodities = useMemo(() => {
        return commodities.filter(c =>
            !filterProduct || c.name.toLowerCase().includes(filterProduct.toLowerCase())
        );
    }, [commodities, filterProduct]);

    return (
        <div className="bg-white overflow-hidden">
            {/* Symmetrical Horizontal Union Filter Pills */}
            {uniqueUnions.length > 1 && (
                <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/30 flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mr-2">
                        <Filter size={12} className="text-violet-600" />
                        ইউনিয়ন ফিল্টার করুন:
                    </span>
                    <button
                        onClick={() => setSelectedUnionSlug('')}
                        className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                            selectedUnionSlug === ''
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        সকল ইউনিয়ন ({markets.length} বাজার)
                    </button>
                    {uniqueUnions.map(union => {
                        const count = markets.filter(m => m.union?.slug === union.slug).length;
                        const isSelected = selectedUnionSlug === union.slug;
                        return (
                            <button
                                key={union.slug}
                                onClick={() => setSelectedUnionSlug(union.slug)}
                                className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                                    isSelected
                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {union.name_bn} ({count} বাজার)
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Price Table Container */}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="py-6 px-8 font-black text-[10px] uppercase tracking-[0.2em] min-w-[220px] border-b border-white/10">پণ্য ও একক</th>
                            {filteredMarkets.map(market => (
                                <th key={market.id} className="py-6 px-8 font-black text-slate-100 min-w-[220px] border-b border-white/10 border-l border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-sm tracking-tight">{market.name}</span>
                                        {market.union?.name_bn && (
                                            <span className="text-[10px] font-bold text-violet-300 tracking-tight mt-0.5">
                                                {market.union.name_bn} ইউনিয়ন
                                            </span>
                                        )}
                                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-1.5">{market.type}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {visibleCommodities.length > 0 ? visibleCommodities.map(commodity => {
                            // Find min price for this commodity among active/filtered markets
                            let minPrice = Infinity;
                            filteredMarkets.forEach(m => {
                                const p = priceMap[m.id]?.[commodity.id]?.price;
                                if (p && Number(p) < minPrice) minPrice = Number(p);
                            });

                            return (
                                <tr key={commodity.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="py-6 px-8 border-r border-slate-50 bg-slate-50/30">
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl bg-white w-14 h-14 rounded-2xl flex items-center justify-center text-teal-600 shadow-sm group-hover:scale-110 transition-transform duration-500 border border-slate-100">
                                                <CommodityIcon value={commodity.icon} />
                                            </span>
                                            <div>
                                                <p className="font-black text-slate-800 text-base">{commodity.name}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{commodity.unit}</p>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    {filteredMarkets.map(market => {
                                        const marketData = priceMap[market.id]?.[commodity.id];
                                        const isCheapest = marketData && Number(marketData.price) === minPrice;
                                        const difference = marketData ? Number(marketData.price) - minPrice : 0;
                                        
                                        if (!marketData) {
                                            return <td key={`${commodity.id}-${market.id}`} className="py-6 px-8 text-slate-300 italic text-xs border-l border-slate-50">- তথ্য নেই -</td>;
                                        }

                                        return (
                                            <td 
                                                key={`${commodity.id}-${market.id}`} 
                                                onClick={() => onShowHistory(commodity.id, market.id)}
                                                className={`py-6 px-8 border-l border-slate-50 transition-all cursor-pointer hover:bg-teal-50/50 group/cell ${
                                                    isCheapest ? 'bg-emerald-50/50 hover:bg-emerald-50' : ''
                                                }`}
                                            >
                                                <div className="flex flex-col">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className={`font-black text-xl tracking-tighter ${
                                                            isCheapest ? 'text-emerald-700' : 'text-slate-900'
                                                        }`}>
                                                            ৳{Number(marketData.price).toLocaleString('bn-BD')}
                                                        </span>
                                                        {isCheapest && filteredMarkets.length > 1 && (
                                                            <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded ml-1.5 animate-pulse">সেরা দর</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                                        {marketData.trend === 'up' && <TrendingUp size={13} className="text-rose-500 shrink-0" />}
                                                        {marketData.trend === 'down' && <TrendingDown size={13} className="text-emerald-500 shrink-0" />}
                                                        {marketData.trend === 'stable' && <Minus size={13} className="text-slate-300 shrink-0" />}

                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest shrink-0 ${
                                                            marketData.supply === 'High' || marketData.supply === 'Very High' 
                                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                                                : marketData.supply === 'Low' 
                                                                    ? 'bg-rose-100 text-rose-600 border border-rose-200' 
                                                                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                                                        }`}>
                                                            {marketData.supply === 'High' ? 'পর্যাপ্ত' : marketData.supply === 'Low' ? 'সংকট' : 'স্বাভাবিক'}
                                                        </span>

                                                        {!isCheapest && difference > 0 && filteredMarkets.length > 1 && (
                                                            <span className="text-[8px] font-black bg-amber-50 text-amber-700 border border-amber-100/60 px-1.5 py-0.5 rounded-full shrink-0">
                                                                +৳{toBnDigits(difference.toLocaleString('bn-BD'))} বেশি
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={filteredMarkets.length + 1} className="py-20 text-center text-slate-400 font-black">
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

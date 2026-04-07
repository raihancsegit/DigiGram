"use client";

import { useState } from 'react';
import { DAILY_PRICES, COMMODITIES, MARKETS_LIST } from '@/lib/constants/marketData';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function PriceComparisonTable({ filterProduct = '', hatIds = null }) {
    // Process data to tabular format (using Hat IDs as columns)
    const activeHatIds = hatIds || MARKETS_LIST.map(h => h.id);
    const activeHats = MARKETS_LIST.filter(h => activeHatIds.includes(h.id));
    
    // Filter commodities based on search input if provided
    const visibleCommodities = COMMODITIES.filter(c => 
        !filterProduct || c.name.toLowerCase().includes(filterProduct.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="py-4 px-6 font-semibold text-gray-700 min-w-[200px]">পণ্য</th>
                            {activeHats.map(market => (
                                <th key={market.id} className="py-4 px-6 font-semibold text-gray-700 min-w-[180px]">
                                    <div className="flex flex-col">
                                        <span>{market.name}</span>
                                        <span className="text-[10px] font-normal text-gray-400 uppercase tracking-wider">{market.type}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {visibleCommodities.length > 0 ? visibleCommodities.map(commodity => (
                            <tr key={commodity.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl bg-gray-50 w-10 h-10 rounded-full flex items-center justify-center">{commodity.icon}</span>
                                        <div>
                                            <p className="font-bold text-gray-800">{commodity.name}</p>
                                            <p className="text-xs text-gray-500">{commodity.unit}</p>
                                        </div>
                                    </div>
                                </td>
                                
                                {activeHatIds.map(hatId => {
                                    const marketData = DAILY_PRICES[hatId]?.[commodity.id];
                                    
                                    if (!marketData) {
                                        return <td key={`${commodity.id}-${hatId}`} className="py-4 px-6 text-gray-400 italic text-sm">-</td>;
                                    }

                                    return (
                                        <td key={`${commodity.id}-${hatId}`} className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-lg text-gray-900 leading-none">৳{marketData.price.toLocaleString('bn-BD')}</span>
                                                <div className="flex items-center gap-1 mt-1.5">
                                                    {marketData.trend === 'up' && <TrendingUp size={14} className="text-red-500" />}
                                                    {marketData.trend === 'down' && <TrendingDown size={14} className="text-green-500" />}
                                                    {marketData.trend === 'stable' && <Minus size={14} className="text-gray-400" />}
                                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                                        marketData.supply === 'High' || marketData.supply === 'Very High' 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : marketData.supply === 'Low' 
                                                                ? 'bg-red-100 text-red-600' 
                                                                : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {marketData.supply === 'High' ? 'প্রচুর' : marketData.supply === 'Low' ? 'কম' : 'স্বাভাবিক'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={activeHatIds.length + 1} className="py-8 text-center text-gray-500">
                                    দুঃখিত, "{filterProduct}" নামে কোনো পণ্যের তথ্য পাওয়া যায়নি।
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

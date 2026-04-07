"use client";

import { useState } from 'react';
import { MARKETS_LIST, DAILY_PRICES, COMMODITIES } from '@/lib/constants/marketData';
import { Search, MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PriceComparisonTable } from './PriceComparisonTable';

export function GlobalMarketDashboard() {
    const [searchQuery, setSearchQuery] = useState('');

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    // Filter active markets today
    const activeMarkets = MARKETS_LIST.filter(market => 
        market.days.includes(today) || market.days.includes('Everyday')
    );

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">জেলা কৃষি মার্কেট ও হাট ڈ্যাশবোর্ড</h1>
                    <p className="text-green-50 opacity-90 max-w-2xl">পুরো জেলার আজকের বাজারদর, হাটের অবস্থান ও পণ্য খুঁজুন এক ক্লিকে।</p>
                    
                    <div className="mt-6 relative max-w-lg">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="উদা: গরুর হাট কোথায় আজ?"
                            className="block w-full pl-10 pr-3 py-3 border-transparent rounded-xl leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-white sm:text-sm shadow-md"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="absolute top-0 right-0 -mt-16 -mr-16 opacity-10">
                    <MapPin size={250} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <MapPin className="text-green-600" /> আজকের জেলাব্যাপী প্রাইস ট্রেন্ড
                    </h2>
                    <PriceComparisonTable filterProduct={searchQuery} />
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">আজকের খোলা হাট ({activeMarkets.length})</h2>
                        {activeMarkets.length > 0 ? (
                            <ul className="space-y-4">
                                {activeMarkets.map((market) => (
                                    <li key={market.id} className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <a href={`/services/market?u=${market.unionSlug}`} className="font-semibold text-gray-800 hover:text-green-600 transition-colors">
                                                {market.name}
                                            </a>
                                            <p className="text-sm text-gray-500">{market.type}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-sm">আজ কোনো উল্লেখযোগ্য হাট নেই।</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

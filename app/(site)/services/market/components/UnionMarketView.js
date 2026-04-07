"use client";

import { useState } from 'react';
import { MARKETS_LIST, DAILY_PRICES, COMMODITIES } from '@/lib/constants/marketData';
import { findUnionBySlug } from '@/lib/constants/locations';
import { MapPin, CalendarDays, TrendingUp, TrendingDown, Minus, Info, CheckCircle2, ChevronRight } from 'lucide-react';
import { MarketReviewSection } from './MarketReviewSection';
import { PriceComparisonTable } from './PriceComparisonTable';

export function UnionMarketView({ unionSlug }) {
    const unionInfo = findUnionBySlug(unionSlug);
    const unionHats = MARKETS_LIST.filter(m => m.unionSlug === unionSlug);
    
    // Default to the first hat, or null
    const [selectedHatId, setSelectedHatId] = useState(unionHats[0]?.id || null);

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    if (!unionInfo) {
        return (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <Info className="mx-auto text-gray-400 mb-4" size={48} />
                <h2 className="text-xl font-bold text-gray-700">ইউনিয়ন খুঁজে পাওয়া যায়নি।</h2>
                <a href="/services/market" className="text-green-600 mt-4 inline-block hover:underline">সব হাটের তালিকা দেখুন</a>
            </div>
        );
    }

    if (unionHats.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-200">
                <MapPin className="mx-auto text-gray-400 mb-4" size={48} />
                <h2 className="text-2xl font-bold text-gray-700">{unionInfo.union.name} ইউনিয়নে এই মুহূর্তে কোনো তালিকাভুক্ত হাট নেই।</h2>
                <a href="/services/market" className="text-green-600 mt-4 inline-block hover:underline">← জেলার সব হাট দেখুন</a>
            </div>
        );
    }

    const selectedHat = unionHats.find(h => h.id === selectedHatId);
    const isMarketOpenToday = selectedHat?.days.includes(today) || selectedHat?.days.includes('Everyday');
    const prices = selectedHat ? DAILY_PRICES[selectedHat.id] : null;

    // Helper: Find if this product is cheapest in union
    const getLowestPriceInUnion = (commodityId) => {
        let minPrice = Infinity;
        let bestHat = null;
        
        unionHats.forEach(hat => {
            const price = DAILY_PRICES[hat.id]?.[commodityId]?.price;
            if (price && price < minPrice) {
                minPrice = price;
                bestHat = hat;
            }
        });
        
        return { price: minPrice, hat: bestHat };
    };

    const renderPriceCard = (comId, data) => {
        const commodity = COMMODITIES.find(c => c.id === comId);
        if (!commodity) return null;

        const lowest = getLowestPriceInUnion(comId);
        const isLowest = lowest.price === data.price;
        const priceDiff = data.price - lowest.price;

        return (
            <div key={comId} className={`relative bg-white p-5 rounded-2xl border transition-all duration-300 ${isLowest ? 'border-green-200 shadow-sm' : 'border-gray-100 hover:border-green-200'}`}>
                {isLowest && unionHats.length > 1 && (
                    <div className="absolute -top-3 left-4 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wider">
                        <CheckCircle2 size={10} /> ইউনিয়নে সবচেয়ে সস্তা
                    </div>
                )}
                
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl bg-green-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner">{commodity.icon}</span>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">{commodity.name}</h3>
                            <p className="text-xs text-gray-400">{commodity.category}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                        {data.trend === 'up' && <TrendingUp size={18} className="text-red-500" />}
                        {data.trend === 'down' && <TrendingDown size={18} className="text-green-500" />}
                        {data.trend === 'stable' && <Minus size={18} className="text-gray-300" />}
                    </div>
                </div>
                
                <div className="flex items-end justify-between">
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-gray-900">৳{data.price.toLocaleString('bn-BD')}</span>
                            <span className="text-xs text-gray-500 font-medium">/{commodity.unit}</span>
                        </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${
                        data.supply === 'High' || data.supply === 'Very High' ? 'bg-green-100 text-green-700' :
                        data.supply === 'Low' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                        সরবরাহ: {data.supply === 'High' || data.supply === 'Very High' ? 'প্রচুর' : data.supply === 'Low' ? 'কম' : 'স্বাভাবিক'}
                    </div>
                </div>

                {!isLowest && priceDiff > 0 && (
                    <div className="mt-4 pt-3 border-t border-dashed border-gray-100">
                        <p className="text-[11px] text-gray-500 flex items-center gap-1">
                            <TrendingDown size={12} className="text-green-600" />
                            <span className="font-semibold text-green-700">{lowest.hat.name}</span>-এ ৳{priceDiff.toLocaleString('bn-BD')} কম দামে পাবেন।
                        </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-10 mb-20 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                        <MapPin size={18} />
                        <span className="text-sm font-bold uppercase tracking-widest">{unionInfo.upazila.name} উপজেলা</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 leading-tight">
                        {unionInfo.union.name} <span className="text-green-600">গ্রাম বাজার</span>
                    </h1>
                    <p className="text-gray-500 max-w-xl">ইউনিয়নের স্থানীয় হাটগুলোর আজকের বাজারদর এবং সরবরাহ পরিস্থিতি এক নজরে দেখে নিন।</p>
                </div>
            </div>

            {/* Hat Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {unionHats.map(hat => {
                    const isOpen = hat.days.includes(today) || hat.days.includes('Everyday');
                    const isSelected = selectedHatId === hat.id;
                    return (
                        <button
                            key={hat.id}
                            onClick={() => setSelectedHatId(hat.id)}
                            className={`group relative p-5 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden ${
                                isSelected 
                                    ? 'border-green-600 bg-white shadow-xl shadow-green-100 ring-1 ring-green-600 translate-y-[-4px]' 
                                    : 'border-white bg-white shadow-sm hover:border-green-200 hover:shadow-md'
                            }`}
                        >
                            {isOpen && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter animate-pulse z-10">
                                    LIVE আজ হাট
                                </div>
                            )}
                            <h3 className={`font-black text-lg transition-colors ${isSelected ? 'text-green-800' : 'text-gray-800 group-hover:text-green-700'}`}>{hat.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${isSelected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {hat.type}
                                </span>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <p className={`text-[11px] font-bold flex items-center gap-1 ${isSelected ? 'text-green-600' : 'text-gray-400'}`}>
                                    <CalendarDays size={12}/> {hat.days.length === 1 ? hat.days[0] : `${hat.days.length} দিন`}
                                </p>
                                <ChevronRight size={16} className={`transition-transform duration-300 ${isSelected ? 'text-green-600 translate-x-1' : 'text-gray-300'}`} />
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Main Content Area */}
            {selectedHat && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                    {/* Price List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                                {selectedHat.name} <span className="text-gray-400 text-lg font-medium">| আজকের দর</span>
                            </h2>
                            <div className="h-1 flex-grow mx-4 bg-gray-100 rounded-full hidden md:block"></div>
                            {isMarketOpenToday ? (
                                <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 border border-red-100">
                                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span> হাট খোলা
                                </span>
                            ) : (
                                <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">আজ হাট বন্ধ</span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {prices ? (
                                Object.entries(prices).map(([comId, data]) => renderPriceCard(comId, data))
                            ) : (
                                <div className="sm:col-span-2 py-20 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 shadow-sm">
                                    <Info size={48} className="mb-4 text-gray-200" />
                                    <p className="font-bold text-gray-500">আজকের কোনো আপডেট পাওয়া যায়নি।</p>
                                    <p className="text-xs max-w-[250px] text-center mt-2">আমাদের প্রতিনিধিরা হাটে গিয়ে তথ্য সংগ্রহ করার পর শীঘ্রই এখানে দাম আপডেট করা হবে।</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar: Reviews & Local Info */}
                    <div className="space-y-8 sticky top-24">
                        <MarketReviewSection unionSlug={unionSlug} hatId={selectedHat.id} marketName={selectedHat.name} />
                    </div>
                </div>
            )}

            {/* Comparison Section (The requested "Comprize" part) */}
            <div className="pt-10 space-y-6">
                <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-green-900/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
                    
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <div>
                                <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                                    <TrendingUp className="text-green-400" /> ইউনিয়ন বাজার দর তুলনা
                                </h2>
                                <p className="text-gray-400 font-medium">{unionInfo.union.name} ইউনিয়নের সবকটি হাটের দাম একসাথে মিলিয়ে দেখুন এবং সাশ্রয় করুন।</p>
                            </div>
                        </div>
                        
                        <PriceComparisonTable hatIds={unionHats.map(h => h.id)} />
                    </div>
                </div>
            </div>
            
            <div className="pt-10 flex justify-center">
                <a href="/services/market" className="group bg-white border border-gray-200 px-8 py-4 rounded-2xl text-gray-700 font-black hover:border-green-500 hover:text-green-600 transition-all flex items-center gap-3 shadow-sm hover:shadow-lg">
                    ← সব ইউনিয়নের তালিকা ও জেলা ড্যাশবোর্ড
                </a>
            </div>
        </div>
    );
}

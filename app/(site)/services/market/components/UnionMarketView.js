"use client";

import { useState } from 'react';
import Link from 'next/link';
import { MARKETS_LIST, DAILY_PRICES, COMMODITIES } from '@/lib/constants/marketData';
import { findUnionBySlug } from '@/lib/constants/locations';
import { MapPin, CalendarDays, TrendingUp, TrendingDown, Minus, Info, CheckCircle2, ChevronRight } from 'lucide-react';
import { MarketReviewSection } from './MarketReviewSection';
import { PriceComparisonTable } from './PriceComparisonTable';
import { toBnDigits } from '@/lib/utils/format';
import { paths } from '@/lib/constants/paths';

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
        <div className="space-y-12 mb-20 animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="relative overflow-hidden p-8 md:p-14 rounded-[50px] bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full w-fit border border-white/10">
                            <MapPin size={16} className="text-emerald-300" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{unionInfo.upazila.name} উপজেলা</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                            {unionInfo.union.name} <span className="text-emerald-400">ডিজিটাল হাট</span>
                        </h1>
                        <p className="text-emerald-100/70 max-w-xl font-medium">ইউনিয়নের স্থানীয় হাটগুলোর লাইভ বাজারদর এবং আজকের সেরা ডিল এক নজরে দেখে নিন।</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest mb-1">মোট বাজার</p>
                            <p className="text-2xl font-black">{toBnDigits(unionHats.length)}টি</p>
                        </div>
                        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest mb-1">আজকের সেরা</p>
                            <p className="text-2xl font-black text-emerald-400">সাশ্রয়</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agri Alerts Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2 p-6 rounded-[32px] bg-amber-50 border border-amber-100 flex items-center gap-6 group hover:shadow-lg transition-all">
                    <div className="p-4 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-amber-900 flex items-center gap-2 uppercase tracking-tight">
                            সতর্কবার্তা: সার ও বীজ আপডেট
                        </h4>
                        <p className="text-xs font-bold text-amber-700 mt-1">দামকুড়া বিএডিসিতে ইউরিয়া ও ডিএপি সারের নতুন চালান এসেছে। সরকারি দামে ডিলারের কাছ থেকে সংগ্রহ করুন।</p>
                    </div>
                </div>
                <div className="p-6 rounded-[32px] bg-sky-50 border border-sky-100 flex items-center gap-4 hover:shadow-lg transition-all">
                    <div className="p-3 rounded-xl bg-sky-500 text-white">
                        <CalendarDays size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-sky-800 uppercase">আবহাওয়া পূর্বাভাস</p>
                        <p className="text-sm font-black text-sky-900">আগামী ৩ দিন রৌদ্রোজ্জ্বল</p>
                    </div>
                </div>
            </div>

            {/* Hat Selection Tabs */}
            <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-800 px-2">ইউনিয়নের সকল হাট</h2>
                <div className="flex flex-wrap gap-4">
                    {unionHats.map(hat => {
                        const isOpen = hat.days.includes(today) || hat.days.includes('Everyday');
                        const isSelected = selectedHatId === hat.id;
                        return (
                            <button
                                key={hat.id}
                                onClick={() => setSelectedHatId(hat.id)}
                                className={`px-6 py-4 rounded-3xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                                    isSelected 
                                        ? 'border-emerald-600 bg-white shadow-xl shadow-emerald-900/10 -translate-y-1' 
                                        : 'border-slate-100 bg-white hover:border-emerald-200'
                                }`}
                            >
                                {isOpen && (
                                    <div className="absolute top-0 right-0 h-1.5 w-full bg-emerald-500">
                                        <div className="absolute inset-0 bg-white/40 animate-pulse" />
                                    </div>
                                )}
                                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}>{hat.type}</p>
                                <h3 className={`font-black tracking-tight ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>{hat.name}</h3>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            {selectedHat && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-2xl font-black text-slate-800">{selectedHat.name} বাজারদর</h3>
                            {isMarketOpenToday ? (
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> আজ হাট খোলা
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">আজ হাট বন্ধ</span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {prices ? Object.entries(prices).map(([comId, data]) => renderPriceCard(comId, data)) : (
                                <div className="sm:col-span-2 py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-400">
                                    <p className="font-black text-lg">তথ্য পাওয়া যায়নি</p>
                                    <p className="text-sm">আজকের আপডেট এখনও আসেনি।</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <MarketReviewSection unionSlug={unionSlug} hatId={selectedHat.id} marketName={selectedHat.name} />
                        
                        <div className="p-8 rounded-[40px] bg-slate-900 text-white relative overflow-hidden group">
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20" />
                            <h4 className="text-emerald-400 font-black uppercase tracking-widest text-[10px] mb-2">ইউনিয়ন প্রতিনিধি</h4>
                            <p className="text-base font-black mb-4">স্বচ্ছ বাজার নিশ্চিত করতে আমাদের প্রতিনিধিরা প্রতিদিন দাম সংগ্রহ করেন।</p>
                            <button className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                                আরও জানুন <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Comparison Section */}
            <section className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800">বাজারদর তুলনা</h2>
                        <p className="text-slate-500 font-medium">পুরো ইউনিয়নের সব হাটের দাম একসাথে দেখে সাশ্রয় করুন।</p>
                    </div>
                </div>
                
                <div className="rounded-[44px] overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/50 bg-white">
                    <PriceComparisonTable hatIds={unionHats.map(h => h.id)} />
                </div>
            </section>
            
            <div className="pt-10 flex justify-center">
                <Link href={paths.home} className="px-10 py-5 rounded-[24px] bg-white border border-slate-200 text-slate-700 font-black hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center gap-3 shadow-xl shadow-slate-200/40">
                    ← হোমে ফিরে যান
                </Link>
            </div>
        </div>

    );
}

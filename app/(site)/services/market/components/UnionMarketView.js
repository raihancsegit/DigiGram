"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { marketService } from '@/lib/services/marketService';
import { adminService } from '@/lib/services/adminService';
import { findUnionBySlug } from '@/lib/constants/locations';
import { MapPin, CalendarDays, TrendingUp, TrendingDown, Minus, Info, CheckCircle2, ChevronRight, Zap, ShoppingBag, Store, Loader2 } from 'lucide-react';
import { MarketReviewSection } from './MarketReviewSection';
import { PriceComparisonTable } from './PriceComparisonTable';
import { toBnDigits } from '@/lib/utils/format';
import { paths } from '@/lib/constants/paths';
import { motion, AnimatePresence } from 'framer-motion';

export function UnionMarketView({ unionSlug }) {
    const unionInfo = findUnionBySlug(unionSlug);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({ markets: [], allPrices: [], commodities: [], union: null });
    const [selectedHatId, setSelectedHatId] = useState(null);

    useEffect(() => {
        async function loadUnionMarketData() {
            try {
                setLoading(true);
                // 1. Get location ID from slug
                const { data: locations } = await adminService.getLocations('union', 1, 100, unionSlug);
                const union = locations.find(l => l.slug === unionSlug);
                
                if (!union) throw new Error("Union not found in database");

                // 2. Fetch markets, commodities, and prices
                const [markets, commodities] = await Promise.all([
                    marketService.getMarketsByUnion(union.id),
                    marketService.getCommodities()
                ]);

                // 3. Fetch prices for all markets in this union
                const pricePromises = markets.map(m => marketService.getMarketPrices(m.id));
                const allPricesResults = await Promise.all(pricePromises);
                const flattenedPrices = allPricesResults.flat();

                setData({ 
                    markets, 
                    allPrices: flattenedPrices, 
                    commodities,
                    union: union
                });
                
                if (markets.length > 0) {
                    setSelectedHatId(markets[0].id);
                }
            } catch (err) {
                console.error("Error loading union markets:", err);
                setError("ইউনিয়নের বাজারের তথ্য লোড করা সম্ভব হয়নি।");
            } finally {
                setLoading(false);
            }
        }
        if (unionSlug) loadUnionMarketData();
    }, [unionSlug]);

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    if ((!loading && !unionInfo && !data.union) || error) {
        return (
            <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                <Info className="mx-auto text-slate-300 mb-6" size={64} />
                <h2 className="text-xl font-black text-slate-800">{error || 'ইউনিয়ন খুঁজে পাওয়া যায়নি।'}</h2>
                <Link href="/services/market" className="text-teal-600 mt-4 inline-flex font-bold hover:underline">সব হাটের তালিকা দেখুন</Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="animate-spin text-teal-600" size={48} />
                <p className="text-slate-500 font-bold">ইউনিয়নের হাটের তথ্য লোড হচ্ছে...</p>
            </div>
        );
    }

    if (data.markets.length === 0) {
        return (
            <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-slate-200">
                <MapPin className="mx-auto text-slate-300 mb-6" size={64} />
                <h2 className="text-2xl font-black text-slate-800">{unionInfo.union.name} ইউনিয়নে এই মুহূর্তে কোনো তালিকাভুক্ত হাট নেই।</h2>
                <Link href="/services/market" className="text-teal-600 mt-4 inline-flex font-bold hover:underline">← জেলার সব হাট দেখুন</Link>
            </div>
        );
    }

    const selectedHat = data.markets.find(h => h.id === selectedHatId);
    const isMarketOpenToday = selectedHat?.days?.includes(today) || selectedHat?.days?.includes('Everyday');
    const selectedHatPrices = data.allPrices.filter(p => p.market_id === selectedHatId);

    // Helper: Find if this product is cheapest in union
    const getLowestPriceInUnion = (commodityId) => {
        let minPrice = Infinity;
        let bestMarket = null;
        
        data.allPrices.forEach(p => {
            if (p.commodity_id === commodityId && Number(p.price) < minPrice) {
                minPrice = Number(p.price);
                bestMarket = data.markets.find(m => m.id === p.market_id);
            }
        });
        
        return { price: minPrice, market: bestMarket };
    };

    const renderPriceCard = (priceData, idx) => {
        const commodity = data.commodities.find(c => c.id === priceData.commodity_id);
        if (!commodity) return null;

        const lowest = getLowestPriceInUnion(priceData.commodity_id);
        const isLowest = Number(priceData.price) === lowest.price;
        const priceDiff = Number(priceData.price) - lowest.price;

        return (
            <motion.div 
                key={priceData.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`relative bg-white p-6 rounded-[32px] border transition-all duration-500 group ${
                    isLowest ? 'border-teal-500/30 shadow-xl shadow-teal-500/5' : 'border-slate-100 hover:border-teal-200 hover:shadow-lg'
                }`}
            >
                {isLowest && data.markets.length > 1 && (
                    <div className="absolute -top-3 left-6 bg-emerald-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg uppercase tracking-wider z-10">
                        <CheckCircle2 size={12} /> ইউনিয়নে সবচেয়ে সাশ্রয়ী
                    </div>
                )}
                
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="text-4xl bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:scale-110 group-hover:bg-teal-50 transition-all duration-500 shadow-inner">
                            {commodity.icon || '📦'}
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg group-hover:text-teal-900 transition-colors">{commodity.name}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{commodity.category}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                        <div className={`p-2 rounded-xl ${
                            priceData.trend === 'up' ? 'bg-rose-50 text-rose-500' : 
                            priceData.trend === 'down' ? 'bg-emerald-50 text-emerald-500' : 
                            'bg-slate-50 text-slate-300'
                        }`}>
                            {priceData.trend === 'up' && <TrendingUp size={20} />}
                            {priceData.trend === 'down' && <TrendingDown size={20} />}
                            {priceData.trend === 'stable' && <Minus size={20} />}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-end justify-between">
                    <div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-slate-900 tracking-tighter">৳{Number(priceData.price).toLocaleString('bn-BD')}</span>
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">/{commodity.unit}</span>
                        </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                        priceData.supply === 'High' || priceData.supply === 'Very High' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        priceData.supply === 'Low' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                        {priceData.supply === 'High' || priceData.supply === 'Very High' ? 'প্রচুর সরবরাহ' : priceData.supply === 'Low' ? 'স্বল্প সরবরাহ' : 'স্বাভাবিক'}
                    </div>
                </div>

                {!isLowest && priceDiff > 0 && (
                    <div className="mt-6 pt-4 border-t border-dashed border-slate-100">
                        <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
                            <TrendingDown size={14} className="text-emerald-600" />
                            <span className="font-black text-emerald-700">{lowest.market?.name}</span>-এ ৳{priceDiff.toLocaleString('bn-BD')} কমে পাবেন।
                        </p>
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className="space-y-12 mb-20 animate-in fade-in duration-700">
            {/* Standardized Hero Section */}
            <div className="relative overflow-hidden p-8 md:p-14 rounded-[50px] bg-slate-900 text-white shadow-2xl border border-white/10 group">
                {/* Modern Mesh Gradient Background */}
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md shadow-lg shadow-emerald-500/5">
                                <Zap size={12} className="animate-bounce" />
                                {unionInfo?.upazila?.name || 'রাজশাহী'}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                                <ShoppingBag size={12} />
                                ডিজিটাল হাট
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-[0.95]">
                            {unionInfo?.union?.name || data.union?.name_bn || 'ইউনিয়ন'} <br />
                            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">বাজার ব্যবস্থাপনা</span>
                        </h1>
                        <p className="text-slate-400 max-w-xl font-bold leading-relaxed text-lg">
                            ইউনিয়নের স্থানীয় হাটগুলোর লাইভ বাজারদর এবং আজকের সেরা সাশ্রয়ী ডিলগুলো এক নজরে দেখে নিন। স্বচ্ছ বাজার নিশ্চিত করতে ইউনিয়ন প্রতিনিধি কাজ করছে।
                        </p>
                    </div>

                    <div className="flex gap-4 shrink-0">
                        <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl text-center group-hover:border-emerald-500/30 transition-all duration-500">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">মোট বাজার</p>
                            <p className="text-4xl font-black tabular-nums">{toBnDigits(data.markets.length)}টি</p>
                        </div>
                        <div className="p-8 rounded-[40px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl shadow-emerald-500/20 text-center transform hover:scale-105 transition-all duration-500">
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-3">আজকের সাশ্রয়</p>
                            <p className="text-4xl font-black tracking-tighter">সেরা</p>
                        </div>
                    </div>
                </div>

                <div className="absolute -right-20 -bottom-20 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-700">
                    <Store size={400} />
                </div>
            </div>

            {/* Agri Alerts Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 p-6 sm:p-8 rounded-[40px] bg-amber-50/50 border border-amber-100/50 flex flex-col sm:flex-row items-center gap-6 group hover:shadow-xl hover:bg-amber-50 transition-all duration-500">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white shadow-xl shadow-amber-200 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                        <TrendingUp size={28} />
                    </div>
                    <div className="text-center sm:text-left">
                        <h4 className="text-sm font-black text-amber-900 flex items-center justify-center sm:justify-start gap-2 uppercase tracking-tight mb-2">
                            সতর্কবার্তা: সার ও বীজ আপডেট
                        </h4>
                        <p className="text-xs font-bold text-amber-700/80 leading-relaxed">দামকুড়া বিএডিসিতে ইউরিয়া ও ডিএপি সারের নতুন চালান এসেছে। সরকারি নির্ধারিত মূল্যে ডিলারের কাছ থেকে সংগ্রহ করতে পারবেন।</p>
                    </div>
                </div>
                <div className="lg:col-span-4 p-8 rounded-[40px] bg-sky-50/50 border border-sky-100/50 flex items-center gap-6 hover:shadow-xl hover:bg-sky-50 transition-all duration-500 group">
                    <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-200 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <CalendarDays size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-sky-800 uppercase tracking-widest mb-1">আবহাওয়া পূর্বাভাস</p>
                        <p className="text-lg font-black text-sky-900 leading-tight">আগামী ৩ দিন <br />রৌদ্রোজ্জ্বল থাকবে</p>
                    </div>
                </div>
            </div>

            {/* Standardized Pill Selection Tabs */}
            <div className="space-y-8">
                <div className="flex items-center gap-4 px-4">
                    <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">ইউনিয়নের সকল বাজার ও হাট</h2>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-[40px] bg-white border border-slate-100 shadow-2xl shadow-slate-200/40 w-fit max-w-full overflow-x-auto no-scrollbar scroll-smooth">
                    {data.markets.map(hat => {
                        const isOpen = hat.days?.includes(today) || hat.days?.includes('Everyday');
                        const isSelected = selectedHatId === hat.id;
                        return (
                            <button
                                key={hat.id}
                                onClick={() => setSelectedHatId(hat.id)}
                                className={`flex flex-col items-center justify-center px-10 py-5 rounded-[32px] transition-all duration-500 min-w-[160px] relative overflow-hidden group ${
                                    isSelected 
                                        ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/40 scale-105 z-10' 
                                        : 'bg-transparent text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-100'
                                }`}
                            >
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>{hat.type}</p>
                                <h3 className="font-black text-base tracking-tight">{hat.name}</h3>
                                {isOpen && !isSelected && (
                                    <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border-2 border-white" />
                                )}
                                {isSelected && (
                                    <motion.div 
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Standardized Content Container */}
            {selectedHat && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="rounded-[40px] bg-white border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
                            {/* Sub-header Bar */}
                            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800">{selectedHat.name} বাজারদর</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">সবশেষ সংগৃহীত তথ্য অনুযায়ী</p>
                                </div>
                                <AnimatePresence mode="wait">
                                    {isMarketOpenToday ? (
                                        <motion.span 
                                            key="open"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> আজ হাট খোলা
                                        </motion.span>
                                    ) : (
                                        <motion.span 
                                            key="closed"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-400 border border-slate-200 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            আজ হাট বন্ধ
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="p-6 sm:p-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {selectedHatPrices.length > 0 ? selectedHatPrices.map((p, idx) => renderPriceCard(p, idx)) : (
                                        <div className="sm:col-span-2 py-20 flex flex-col items-center justify-center text-slate-400 text-center">
                                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                                                <Info size={40} className="text-slate-200" />
                                            </div>
                                            <p className="font-black text-xl text-slate-800">তথ্য পাওয়া যায়নি</p>
                                            <p className="text-sm font-bold mt-2">এই হাটের আজকের আপডেট এখনও পোর্টালে যুক্ত করা হয়নি।</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        <MarketReviewSection unionSlug={unionSlug} hatId={selectedHat.id} marketName={selectedHat.name} />
                        
                        <div className="p-10 rounded-[50px] bg-slate-900 text-white relative overflow-hidden group shadow-2xl border border-white/5">
                            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-[80px] transition-all duration-700 group-hover:scale-150 group-hover:bg-emerald-500/30" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
                                    <Info className="text-emerald-400" size={24} />
                                </div>
                                <h4 className="text-emerald-400 font-black uppercase tracking-[0.2em] text-[10px] mb-4">বাজার প্রতিনিধি</h4>
                                <p className="text-xl font-black mb-4 leading-tight tracking-tight">স্বচ্ছ বাজার নিশ্চিত করতে আমাদের প্রতিনিধিরা প্রতিদিন দাম সংগ্রহ করেন।</p>
                                <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed">কোনো ভুল তথ্য দেখলে বা অস্বাভাবিক দাম বৃদ্ধি পেলে আমাদের সরাসরি জানান।</p>
                                <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center gap-3 active:scale-95 group/btn">
                                    অভিযোগ জানান <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Standardized Comparison Section */}
            <section className="space-y-8">
                <div className="flex items-center gap-4 px-4">
                    <div className="w-1.5 h-8 bg-teal-500 rounded-full" />
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">ইউনিয়ন বাজারদর তুলনা</h2>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">সব হাটের দাম একসাথে দেখে সাশ্রয় করুন</p>
                    </div>
                </div>
                
                <div className="rounded-[44px] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/30 bg-white">
                    <div className="p-2 sm:p-6">
                        <PriceComparisonTable 
                            commodities={data.commodities}
                            markets={data.markets}
                            prices={data.allPrices}
                        />
                    </div>
                </div>
            </section>
            
            <div className="pt-16 pb-10 flex justify-center border-t border-slate-100 mt-20">
                <Link 
                    href={paths.unionPortal(unionSlug)} 
                    className="group relative flex items-center gap-3 px-10 py-4 bg-white border-2 border-slate-900 rounded-full text-slate-900 font-black hover:bg-slate-900 hover:text-white transition-all duration-500 shadow-xl shadow-slate-200 active:scale-95"
                >
                    <motion.span
                        animate={{ x: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-xl"
                    >
                        ←
                    </motion.span>
                    <span className="tracking-tight italic uppercase text-[10px] font-black absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 text-slate-400 border border-slate-100 rounded-full group-hover:bg-slate-900 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">ফিরে যান</span>
                    {unionInfo?.union?.name || data.union?.name_bn || 'ইউনিয়ন'} পোর্টালে ফিরে যান
                </Link>
            </div>
        </div>
    );
}

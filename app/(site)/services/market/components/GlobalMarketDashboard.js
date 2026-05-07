"use client";

import { useState, useEffect } from 'react';
import { marketService } from '@/lib/services/marketService';
import { Search, MapPin, TrendingUp, Minus, Store, Zap, ArrowUpRight, ShoppingBag, Loader2 } from 'lucide-react';
import { PriceComparisonTable } from './PriceComparisonTable';
import { motion } from 'framer-motion';

export function GlobalMarketDashboard() {
    const [searchQuery, setSearchQuery] = useState('');
    const [data, setData] = useState({ markets: [], prices: [], commodities: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadGlobalData() {
            try {
                setLoading(true);
                const [overview, commodities] = await Promise.all([
                    marketService.getGlobalMarketOverview(),
                    marketService.getCommodities()
                ]);
                setData({ 
                    markets: overview.markets, 
                    prices: overview.prices, 
                    commodities: commodities 
                });
            } catch (err) {
                console.error("Failed to load market data:", err);
                setError("বাজারের তথ্য লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
            } finally {
                setLoading(false);
            }
        }
        loadGlobalData();
    }, []);

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-teal-600" size={40} />
                <p className="text-slate-500 font-bold">বাজারের সর্বশেষ তথ্য সংগ্রহ করা হচ্ছে...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20 bg-rose-50 rounded-[40px] border border-rose-100">
                <p className="text-rose-600 font-black">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-2 bg-rose-600 text-white rounded-full font-bold text-sm"
                >
                    আবার চেষ্টা করুন
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Standardized Dark Header */}
            <div className="relative overflow-hidden p-8 md:p-14 rounded-[40px] bg-slate-900 text-white shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                            <Zap size={12} />
                            সরাসরি আপডেট
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                            <ShoppingBag size={12} />
                            জেলা কৃষি মার্কেট
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
                        স্মার্ট ডিজিটাল <span className="text-teal-400 font-black">বাজারদর</span>
                    </h1>
                    <p className="text-slate-400 max-w-xl font-bold leading-relaxed">
                        পুরো জেলার আজকের বাজারদর, হাটের অবস্থান ও পণ্য খুঁজুন এক ক্লিকে। স্বচ্ছ বাজার নিশ্চিত করতে আমাদের বিশেষ ডাটা টিম কাজ করছে।
                    </p>
                    
                    {/* Standardized Pill Filter */}
                    <div className="mt-10 relative max-w-2xl group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-400 text-slate-500">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="কোন পণ্যের দাম জানতে চান? (উদা: আলু, পেঁয়াজ...)"
                            className="block w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-full leading-5 text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500/50 sm:text-sm shadow-2xl transition-all backdrop-blur-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="absolute top-1/2 right-10 -translate-y-1/2 opacity-5 pointer-events-none hidden lg:block">
                    <Store size={320} />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Price Table */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="rounded-[40px] bg-white border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
                        {/* Sub-header Bar */}
                        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <TrendingUp className="text-teal-600" size={20} />
                                    আজকের জেলাব্যাপী বাজারদর
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">লাইভ প্রাইস ট্র্যাক এবং তুলনা</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">আপডেটেড</span>
                            </div>
                        </div>

                        <div className="p-2 sm:p-6">
                            <PriceComparisonTable 
                                filterProduct={searchQuery} 
                                commodities={data.commodities}
                                markets={data.markets}
                                prices={data.prices}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Active Markets */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="rounded-[40px] bg-white border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <MapPin className="text-teal-600" size={18} />
                                আজকের খোলা হাট ({data.markets.length})
                            </h2>
                        </div>
                        
                        <div className="p-8">
                            {data.markets.length > 0 ? (
                                <ul className="space-y-4">
                                    {data.markets.map((market, idx) => (
                                        <motion.li 
                                            key={market.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <a 
                                                href={`/services/market?u=${market.slug?.slug || ''}`} 
                                                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-200 hover:bg-teal-50 transition-all group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-shrink-0 w-11 h-11 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-teal-600 shadow-sm group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-white transition-all">
                                                        <MapPin size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 leading-tight group-hover:text-teal-900 transition-colors">{market.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{market.type}</p>
                                                    </div>
                                                </div>
                                                <ArrowUpRight size={18} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                                            </a>
                                        </motion.li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="py-12 text-center flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                        <Minus size={32} />
                                    </div>
                                    <p className="text-slate-400 font-bold text-sm italic">আজ কোনো উল্লেখযোগ্য হাট নেই।</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick CTA */}
                    <div className="p-8 rounded-[40px] bg-gradient-to-br from-slate-900 to-teal-900 text-white relative overflow-hidden group shadow-xl">
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-teal-500 rounded-full blur-3xl opacity-20 transition-all group-hover:scale-150" />
                        <p className="text-teal-400 font-black uppercase tracking-widest text-[9px] mb-2">ইউনিয়ন প্রতিনিধি</p>
                        <h4 className="text-lg font-black mb-3 leading-snug">আপনার এলাকার পণ্যের সঠিক দাম জানতে ইউনিয়ন পোর্টালে যান</h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">আমাদের প্রতিনিধিরা প্রতিদিন প্রতিটি ইউনিয়ন থেকে বাজারদর সংগ্রহ করেন।</p>
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors">
                            বিস্তারিত জানুন <ArrowUpRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

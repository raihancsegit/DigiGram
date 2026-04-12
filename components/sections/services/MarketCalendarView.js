'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, TrendingUp, TrendingDown, Minus, MapPin, Search, CalendarDays, Clock, Users, Star } from 'lucide-react';
import { MARKETS_LIST, DAILY_PRICES, COMMODITIES } from '@/lib/constants/marketData';

export default function MarketCalendarView() {
    const [selectedHat, setSelectedHat] = useState(MARKETS_LIST[0]);
    const [filterCategory, setFilterCategory] = useState('All');

    const categories = ['All', ...Array.from(new Set(COMMODITIES.map(c => c.category)))];
    
    const renderTrendIcon = (trend) => {
        if (trend === 'up') return <TrendingUp size={16} className="text-rose-500" />;
        if (trend === 'down') return <TrendingDown size={16} className="text-emerald-500" />;
        return <Minus size={16} className="text-slate-400" />;
    };

    const bnMap = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    const toBnNum = (num) => String(num).replace(/[0-9]/g, match => bnMap[match]);

    return (
        <div className="py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">গ্রাম বাজার ও হাট ক্যালেন্ডার</h2>
                    <p className="text-sm font-medium text-slate-500">আপনার এলাকার বাজারের রুটিন, আজকের এক্সক্লুসিভ দরদাম এবং আমদানী আপডেট</p>
                </div>
                <div className="shrink-0 flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                    <Store size={20} className="text-amber-500" />
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">মোট তালিকাভুক্ত হাট</p>
                        <p className="text-lg font-black text-slate-700">{toBnNum(MARKETS_LIST.length)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* ── Sidebar: Market List ── */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2 mb-4">বাজার নির্বাচন করুন</h3>
                    <div className="space-y-3 h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                        {MARKETS_LIST.map((hat) => (
                            <button
                                key={hat.id}
                                onClick={() => setSelectedHat(hat)}
                                className={`w-full text-left p-4 rounded-[24px] transition-all border ${
                                    selectedHat.id === hat.id 
                                    ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20 border-amber-500' 
                                    : 'bg-white border-slate-100 hover:border-amber-300 text-slate-700 hover:shadow-md'
                                }`}
                            >
                                <h4 className="font-black text-lg line-clamp-1 mb-1.5">{hat.name}</h4>
                                <div className={`flex items-center gap-1.5 text-xs font-bold mt-2 ${selectedHat.id === hat.id ? 'text-amber-100' : 'text-slate-400'}`}>
                                    <CalendarDays size={14} className="shrink-0" />
                                    <span className="truncate">{hat.days.join(', ')}</span>
                                </div>
                                <div className={`mt-3 pt-3 border-t flex justify-between items-center ${selectedHat.id === hat.id ? 'border-amber-400/50' : 'border-slate-50'}`}>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase ${
                                        selectedHat.id === hat.id ? 'bg-amber-400/50 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {hat.type}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Star size={10} className={selectedHat.id === hat.id ? 'text-white fill-white' : 'text-amber-400 fill-amber-400'} />
                                        <span className={`text-[10px] font-black ${selectedHat.id === hat.id ? 'text-amber-100' : 'text-slate-500'}`}>{toBnNum(hat.qualityIndex)}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Main Content: Selected Market Details ── */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedHat.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-white rounded-[40px] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col h-full"
                        >
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 border-b border-slate-100 pb-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Store size={120} className="transform rotate-12" />
                                </div>
                                <div className="relative z-10 w-full">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                            {selectedHat.type}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                                            <MapPin size={12} /> {selectedHat.unionSlug}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-800 leading-tight mb-4">{selectedHat.name}</h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-3">
                                            <Clock size={16} className="text-amber-500" />
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">যাওয়ার সেরা সময়</p>
                                                <p className="text-xs font-bold text-slate-700">{selectedHat.bestTimeToVisit}</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-3">
                                            <Users size={16} className="text-amber-500" />
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">সমাগম</p>
                                                <p className="text-xs font-bold text-slate-700">{selectedHat.traderVolume} Volume</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-3">
                                            <CalendarDays size={16} className="text-amber-500" />
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">হাটের রুটিন</p>
                                                <p className="text-xs font-bold text-slate-700">{selectedHat.days.join(', ')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilterCategory(cat)}
                                        className={`shrink-0 px-5 py-2.5 text-xs font-black rounded-full transition-all ${
                                            filterCategory === cat 
                                            ? 'bg-slate-800 text-white shadow-md' 
                                            : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-700'
                                        }`}
                                    >
                                        {cat === 'All' ? 'সব পণ্য' : cat}
                                    </button>
                                ))}
                            </div>

                            {/* Market Prices Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {COMMODITIES
                                    .filter(c => filterCategory === 'All' || c.category === filterCategory)
                                    .map(commodity => {
                                        const priceData = DAILY_PRICES[selectedHat.id]?.[commodity.id];
                                        
                                        if (!priceData) return null;

                                        const change = priceData.price - priceData.previousPrice;
                                        const changePercent = ((Math.abs(change) / priceData.previousPrice) * 100).toFixed(1);

                                        return (
                                            <div key={commodity.id} className="bg-white rounded-3xl p-5 border border-slate-100 hover:border-amber-300 hover:shadow-lg transition-all group relative overflow-hidden">
                                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-9xl">{commodity.icon}</div>
                                                <div className="relative z-10 flex items-center justify-between mb-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl shadow-inner border border-slate-100 group-hover:scale-110 group-hover:bg-amber-50 transition-all">
                                                            {commodity.icon}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-slate-800 text-lg mb-0.5">{commodity.name}</h4>
                                                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{commodity.unit}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="relative z-10 bg-slate-50 p-4 rounded-2xl flex items-end justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">বর্তমান দর</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-2xl font-black text-amber-600 tracking-tight">{toBnNum(priceData.price)} ৳</p>
                                                            {change !== 0 && (
                                                                <div className={`flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded ${change > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                                    {change > 0 ? '+' : '-'}{toBnNum(changePercent)}%
                                                                </div>
                                                            )}
                                                        </div>
                                                        {change !== 0 && (
                                                            <p className="text-[10px] font-bold text-slate-400 mt-1">গত হাটে ছিল: {toBnNum(priceData.previousPrice)} ৳</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center justify-end gap-1">
                                                            ট্রেন্ড {renderTrendIcon(priceData.trend)}
                                                        </p>
                                                        <p className={`text-xs font-black px-3 py-1.5 rounded-lg inline-flex mt-1 ${
                                                            priceData.supply === 'High' ? 'bg-emerald-500 text-white' :
                                                            priceData.supply === 'Low' ? 'bg-rose-500 text-white' :
                                                            'bg-slate-700 text-white'
                                                        }`}>
                                                            {priceData.supply} Supply
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>

                            {Object.keys(DAILY_PRICES[selectedHat.id] || {}).length === 0 && (
                                <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-100 border-dashed mt-4">
                                    <Search size={48} className="text-slate-200 mx-auto mb-4" />
                                    <h4 className="text-lg font-black text-slate-600 mb-1">আজকের দরদামের তথ্য আপডেট হয়নি</h4>
                                    <p className="text-sm font-medium text-slate-400">খুব শিগগিরই ভলান্টিয়াররা প্রাইস আপডেট করবেন।</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, TrendingUp, TrendingDown, Minus, MapPin, Search, CalendarDays } from 'lucide-react';
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
    const toBnNum = (num) => num.toString().replace(/[0-9]/g, match => bnMap[match]);

    return (
        <div className="py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">গ্রাম বাজার ও হাট ক্যালেন্ডার</h2>
                    <p className="text-sm font-medium text-slate-500">আপনার এলাকার বাজারের রুটিন, আজকের দরদাম এবং আমদানী আপডেট</p>
                </div>
                <div className="shrink-0 flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                    <Store size={20} className="text-amber-500" />
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400">মোট তালিকাভুক্ত হাট</p>
                        <p className="text-lg font-black text-slate-700">{toBnNum(MARKETS_LIST.length)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* ── Sidebar: Market List ── */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2 mb-4">বাজার নির্বাচন করুন</h3>
                    <div className="space-y-2 h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                        {MARKETS_LIST.map((hat) => (
                            <button
                                key={hat.id}
                                onClick={() => setSelectedHat(hat)}
                                className={`w-full text-left p-4 rounded-2xl transition-all border ${
                                    selectedHat.id === hat.id 
                                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 border-amber-500' 
                                    : 'bg-white border-slate-100 hover:border-amber-200 text-slate-700'
                                }`}
                            >
                                <h4 className="font-black text-base line-clamp-1 mb-1">{hat.name}</h4>
                                <div className={`flex items-center gap-1.5 text-xs font-bold mt-2 ${selectedHat.id === hat.id ? 'text-amber-100' : 'text-slate-400'}`}>
                                    <CalendarDays size={14} className="shrink-0" />
                                    <span className="truncate">{hat.days.join(', ')}</span>
                                </div>
                                <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase ${
                                    selectedHat.id === hat.id ? 'bg-white/20 text-white text-opacity-90' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {hat.type}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Main Content: Selected Market Details ── */}
                <div className="lg:col-span-3">
                    <motion.div
                        key={selectedHat.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-6 mb-8 border-b border-slate-100 pb-8">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                        {selectedHat.type}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                                        <MapPin size={12} /> {selectedHat.unionSlug}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-black text-slate-800 leading-tight mb-2">{selectedHat.name}</h2>
                                <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                                    <CalendarDays size={16} className="text-amber-500" /> হাটের দিন: {selectedHat.days.join(', ')}
                                </p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    className={`shrink-0 px-4 py-2 text-xs font-black rounded-full transition-all ${
                                        filterCategory === cat 
                                        ? 'bg-slate-800 text-white' 
                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                    }`}
                                >
                                    {cat === 'All' ? 'সব পণ্য' : cat}
                                </button>
                            ))}
                        </div>

                        {/* Market Prices Table/Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {COMMODITIES
                                .filter(c => filterCategory === 'All' || c.category === filterCategory)
                                .map(commodity => {
                                    const priceData = DAILY_PRICES[selectedHat.id]?.[commodity.id];
                                    
                                    if (!priceData) return null;

                                    return (
                                        <div key={commodity.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all group">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                                        {commodity.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-800">{commodity.name}</h4>
                                                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{commodity.unit}</p>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                                                    {renderTrendIcon(priceData.trend)}
                                                </div>
                                            </div>

                                            <div className="flex items-end justify-between mt-6">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">বর্তমান দর</p>
                                                    <p className="text-xl font-black text-amber-600">{toBnNum(priceData.price)} ৳</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">আমদানি</p>
                                                    <p className={`text-xs font-black px-2.5 py-1 rounded-md inline-flex ${
                                                        priceData.supply === 'High' ? 'bg-emerald-100 text-emerald-700' :
                                                        priceData.supply === 'Low' ? 'bg-rose-100 text-rose-700' :
                                                        'bg-slate-200 text-slate-600'
                                                    }`}>
                                                        {priceData.supply}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        {Object.keys(DAILY_PRICES[selectedHat.id] || {}).length === 0 && (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                <Search size={32} className="text-slate-300 mx-auto mb-3" />
                                <h4 className="text-sm font-black text-slate-600">আজকের দরদামের তথ্য আপডেট হয়নি</h4>
                            </div>
                        )}

                    </motion.div>
                </div>
            </div>
        </div>
    );
}

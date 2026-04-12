'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, TrendingUp, TrendingDown, Minus, MapPin, Search, CalendarDays, Clock, Users, Star, Bell, BadgePercent, ArrowRight } from 'lucide-react';
import { MARKETS_LIST, DAILY_PRICES, COMMODITIES } from '@/lib/constants/marketData';

const AnimatedCounter = ({ end, duration = 2, suffix = '' }) => {
    const [count, setCount] = useState(0);

    const bnMap = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    const toBnNum = (num) => String(num).replace(/[0-9]/g, match => bnMap[match]);

    useEffect(() => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [end, duration]);

    return <span>{toBnNum(count)}{suffix}</span>;
};

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
        <div className="pb-16 pt-4">
            {/* 1. Hero Section */}
            <div className="relative rounded-[40px] bg-amber-950 border border-amber-900 overflow-hidden px-6 py-16 md:p-20 mb-16 shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-500/20 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-center md:text-left max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-amber-200 text-xs font-black uppercase tracking-widest mb-6">
                            <BadgePercent size={14} /> লাইভ বাজার দর
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.2] mb-6">
                            গ্রামের সব হাট ও বাজারের <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">খবর এক জায়গায়</span>
                        </h2>
                        <p className="text-lg text-amber-100 font-medium mb-8 leading-relaxed max-w-xl">
                            গরু, ধান, পাট থেকে শুরু করে কাঁচাবাজার—কোন হাটে আজ কীসের দাম কেমন, তা বাড়ি বসেই জেনে নিন।
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button onClick={() => document.getElementById('market-board').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-lg hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 active:scale-95 flex items-center justify-center gap-2">
                                <Search size={20} />
                                দরদাম চেক করুন
                            </button>
                            <button className="w-full sm:w-auto px-8 py-5 rounded-full bg-white/10 text-white font-black text-lg hover:bg-white/20 transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-2">
                                <Bell size={20} />
                                এলার্ট সেট করুন
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md">
                            <Store size={32} className="text-amber-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={MARKETS_LIST.length} /></div>
                            <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest">তালিকাভুক্ত হাট</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md mt-6">
                            <TrendingUp size={32} className="text-orange-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={250} suffix="+" /></div>
                            <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest">ডায়নামিক প্রাইস লগ</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Market Dashboard */}
            <div id="market-board" className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
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
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">যাওয়ার সেরা সময়</p>
                                                <p className="text-sm font-black text-slate-700">{selectedHat.bestTimeToVisit}</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center shrink-0">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">সমাগম বা ভিড়</p>
                                                <p className="text-sm font-black text-slate-700">{selectedHat.traderVolume}</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-500 flex items-center justify-center shrink-0">
                                                <CalendarDays size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">হাটের রুটিন</p>
                                                <p className="text-xs font-black text-slate-700">{selectedHat.days.join(', ')}</p>
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
                                        className={`shrink-0 px-6 py-3 text-sm font-black rounded-full transition-all ${
                                            filterCategory === cat 
                                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                                            : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-700'
                                        }`}
                                    >
                                        {cat === 'All' ? 'সব পণ্য' : cat}
                                    </button>
                                ))}
                            </div>

                            {/* Market Prices Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {COMMODITIES
                                    .filter(c => filterCategory === 'All' || c.category === filterCategory)
                                    .map(commodity => {
                                        const priceData = DAILY_PRICES[selectedHat.id]?.[commodity.id];
                                        
                                        if (!priceData) return null;

                                        const change = priceData.price - priceData.previousPrice;
                                        const changePercent = ((Math.abs(change) / priceData.previousPrice) * 100).toFixed(1);

                                        return (
                                            <div key={commodity.id} className="bg-white rounded-[28px] p-6 border border-slate-100 hover:border-amber-300 hover:shadow-xl transition-all group relative overflow-hidden">
                                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-9xl">{commodity.icon}</div>
                                                <div className="relative z-10 flex items-center justify-between mb-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl shadow-inner border border-amber-100 group-hover:scale-110 group-hover:bg-amber-100 transition-all">
                                                            {commodity.icon}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-slate-800 text-xl mb-1">{commodity.name}</h4>
                                                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{commodity.unit}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="relative z-10 bg-slate-50 p-5 rounded-2xl flex items-end justify-between border border-slate-100/50">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">বর্তমান দর</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-3xl font-black text-slate-800 tracking-tight">{toBnNum(priceData.price)} <span className="text-lg opacity-50">৳</span></p>
                                                            {change !== 0 && (
                                                                <div className={`flex items-center gap-0.5 text-[11px] font-black px-2 py-1 rounded-md ${change > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                                    {change > 0 ? '+' : '-'}{toBnNum(changePercent)}%
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-end gap-1.5">
                                                            ট্রেন্ড {renderTrendIcon(priceData.trend)}
                                                        </p>
                                                        <p className={`text-[11px] font-black px-3 py-1.5 rounded-lg inline-flex mt-1 uppercase tracking-widest shadow-sm ${
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
                                <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-slate-100 border-dashed mt-4">
                                    <Search size={48} className="text-slate-200 mx-auto mb-4" />
                                    <h4 className="text-xl font-black text-slate-600 mb-2">আজকের দরদামের তথ্য আপডেট হয়নি</h4>
                                    <p className="text-sm font-medium text-slate-400">খুব শিগগিরই ভলান্টিয়াররা প্রাইস আপডেট করবেন।</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
            
            {/* 4. Footer Call to Action */}
            <div className="mt-8 bg-gradient-to-r from-orange-50 to-amber-50 rounded-[40px] p-8 md:p-12 border border-orange-100 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-sm">
                <div className="relative z-10 w-full">
                    <h3 className="text-2xl md:text-3xl font-black text-orange-900 mb-3 text-center md:text-left">আপনার এলাকার হাটের ভলান্টিয়ার হোন</h3>
                    <p className="text-orange-800/80 font-bold max-w-lg leading-relaxed text-center md:text-left">
                        প্রতি হাটের দিন সঠিক দরদাম অ্যাপে আপডেট করে এলাকার কৃষক ও ব্যবসায়ীদের সাহায্য করুন। প্রতিটি আপডেটের জন্য পাবেন বিশেষ "ডিজি-পয়েন্ট"।
                    </p>
                </div>
                <div className="shrink-0 w-full md:w-auto relative z-10">
                    <button className="w-full text-center px-8 py-5 rounded-[20px] bg-orange-500 text-white font-black text-lg shadow-lg hover:shadow-xl hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                        ভলান্টিয়ার হিসেবে যুক্ত হোন <ArrowRight size={20} />
                    </button>
                </div>
            </div>

        </div>
    );
}

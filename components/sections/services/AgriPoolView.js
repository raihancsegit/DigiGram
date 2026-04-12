'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tractor, MapPin, Phone, CheckCircle2, XCircle, Search, DollarSign, PenTool, Sprout, Settings, Truck, CalendarClock } from 'lucide-react';
import { getAgriEquipment } from '@/lib/content/agriEquipmentData';

export default function AgriPoolView() {
    const equipmentList = getAgriEquipment();
    const [filter, setFilter] = useState('all'); 
    
    const categories = ['all', ...Array.from(new Set(equipmentList.map(e => e.type)))];
    const filteredList = equipmentList.filter(e => filter === 'all' || e.type === filter);

    const bnMap = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    const toBnNum = (num) => String(num).replace(/[0-9]/g, match => bnMap[match]);

    return (
        <div className="py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">এগ্রি-পুল (কৃষি যন্ত্রপাতি)</h2>
                    <p className="text-sm font-medium text-slate-500">আপনার এলাকার ট্রাক্টর, হারভেস্টর ও সেচ পাম্প মালিকদের ভেরিফাইড তালিকা</p>
                </div>
                <button className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-slate-900 text-white font-black text-sm hover:bg-lime-600 transition-all shadow-lg active:scale-95">
                    <PenTool size={18} />
                    যন্ত্রপাতি ভাড়ায় দিন
                </button>
            </div>

            {/* Stats/Highlight Bar */}
            <div className="bg-gradient-to-r from-lime-50 to-green-50 rounded-2xl p-5 mb-8 border border-lime-100 flex items-start sm:items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-lime-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-lime-500/20">
                    <Sprout size={24} />
                </div>
                <div>
                    <h4 className="text-lime-800 font-black mb-1">স্মার্ট কৃষিতে স্বাগতম</h4>
                    <p className="text-[13px] font-bold text-lime-700 opacity-90 leading-relaxed">দালাল ছাড়াই সরাসরি মালিকের সাথে কথা বলে যন্ত্রপাতি ভাড়া নিন। মেশিনের আসল কন্ডিশন এবং বিস্তারিত স্পেসিফিকেশন চেক করে সিদ্ধান্ত নিন।</p>
                </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                {categories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`shrink-0 px-5 py-2.5 rounded-full text-[13px] font-black transition-all ${
                            filter === cat 
                            ? 'bg-slate-800 text-white shadow-md' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-lime-400 hover:text-lime-700'
                        }`}
                    >
                        {cat === 'all' ? 'সব যন্ত্রপাতি' : cat}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredList.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:border-lime-200 transition-all flex flex-col sm:flex-row group"
                        >
                            <div className="sm:w-2/5 relative h-56 sm:h-auto bg-slate-100 overflow-hidden shrink-0">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute top-4 left-4">
                                    <span className="px-2.5 py-1.5 rounded-lg bg-white/95 backdrop-blur-md text-slate-800 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                        {item.type}
                                    </span>
                                </div>
                                <div className="absolute top-4 right-4 sm:right-auto sm:bottom-4 sm:top-auto sm:left-4">
                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black tracking-widest uppercase shadow-sm ${
                                        item.condition === 'Excellent' ? 'bg-emerald-500 text-white' : 'bg-lime-400 text-slate-900'
                                    }`}>
                                        {item.condition === 'Excellent' ? 'নতুন কন্ডিশন' : 'ভালো কন্ডিশন'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <h3 className="text-xl font-black text-slate-800 leading-snug line-clamp-2 group-hover:text-lime-600 transition-colors">{item.name}</h3>
                                </div>
                                
                                <div className="flex items-center gap-1.5 mb-4 text-[10px] font-black">
                                    <span className={`px-2 py-1 rounded-md flex items-center gap-1 text-white ${
                                        item.available ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}>
                                        {item.available ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                        {item.available ? 'ভাড়ার জন্য প্রস্তুত' : 'ভাড়া দেওয়া আছে'}
                                    </span>
                                </div>

                                <div className="space-y-2.5 mb-4 border-b border-slate-50 pb-4">
                                    <div className="flex items-start gap-2 text-xs font-bold text-slate-600 border border-slate-100 p-2 rounded-xl bg-slate-50">
                                        <Settings size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                        <span className="leading-snug">{item.engineCapacity}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-xs font-bold text-slate-600 border border-slate-100 p-2 rounded-xl bg-slate-50">
                                        <Truck size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                        <span className="leading-snug">{item.deliveryOption}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-xs font-bold text-slate-600 border border-slate-100 p-2 rounded-xl bg-slate-50">
                                        <CalendarClock size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                        <span className="leading-snug text-amber-700">{item.nextAvailableDate}</span>
                                    </div>
                                </div>

                                <div className="mt-auto flex items-end justify-between mb-5">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ভাড়ার হার</p>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-6 h-6 rounded-md bg-lime-100 text-lime-600 flex items-center justify-center">
                                                <DollarSign size={14} />
                                            </div>
                                            <span className="text-lg font-black text-lime-700">{toBnNum(item.rate)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মালিকানা</p>
                                        <span className="text-xs font-bold text-slate-700">{item.owner}</span>
                                    </div>
                                </div>

                                <button 
                                    disabled={!item.available}
                                    className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all shadow-sm ${
                                        item.available 
                                        ? 'bg-lime-500 hover:bg-lime-600 text-white active:scale-95 shadow-lime-500/20' 
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                                    onClick={() => window.location.href = `tel:${item.phone}`}
                                >
                                    <Phone size={18} />
                                    {item.available ? 'মালিককে কল করুন' : 'বর্তমানে ব্যস্ত'}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            
            {filteredList.length === 0 && (
                <div className="text-center py-20">
                    <Search size={48} className="text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-slate-800 mb-2">যন্ত্রপাতি পাওয়া যায়নি</h3>
                    <p className="text-sm text-slate-500 font-medium">এই ক্যাটাগরিতে বর্তমানে কোনো কৃষি যন্ত্রপাতি তালিকাভুক্ত নেই।</p>
                </div>
            )}
        </div>
    );
}

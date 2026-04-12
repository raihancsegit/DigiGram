'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tractor, MapPin, Phone, CheckCircle2, XCircle, Search, DollarSign, PenTool, Sprout } from 'lucide-react';
import { getAgriEquipment } from '@/lib/content/agriEquipmentData';

export default function AgriPoolView() {
    const equipmentList = getAgriEquipment();
    const [filter, setFilter] = useState('all'); 
    
    const categories = ['all', ...Array.from(new Set(equipmentList.map(e => e.type)))];
    const filteredList = equipmentList.filter(e => filter === 'all' || e.type === filter);

    return (
        <div className="py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">এগ্রি-পুল (কৃষি যন্ত্রপাতি)</h2>
                    <p className="text-sm font-medium text-slate-500">আপনার এলাকার ট্রাক্টর, হারভেস্টর ও সেচ পাম্প মালিকদের ভেরিফাইড তালিকা</p>
                </div>
                <button className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-slate-900 text-white font-black text-sm hover:bg-teal-600 transition-all shadow-lg active:scale-95">
                    <PenTool size={18} />
                    যন্ত্রপাতি ভাড়ায় দিন
                </button>
            </div>

            {/* Stats/Highlight Bar */}
            <div className="bg-lime-50 rounded-2xl p-4 sm:p-6 mb-8 border border-lime-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-lime-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-lime-500/20">
                    <Sprout size={24} />
                </div>
                <div>
                    <h4 className="text-lime-800 font-black mb-1">স্মার্ট কৃষিতে স্বাগতম</h4>
                    <p className="text-sm font-bold text-lime-700 opacity-80">দালাল ছাড়াই সরাসরি মালিকের সাথে কথা বলে যন্ত্রপাতি ভাড়া নিন।</p>
                </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                {categories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`shrink-0 px-5 py-2.5 rounded-full text-xs font-black transition-all ${
                            filter === cat 
                            ? 'bg-slate-800 text-white shadow-md' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-lime-300 hover:text-lime-700'
                        }`}
                    >
                        {cat === 'all' ? 'সব যন্ত্রপাতি' : cat}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredList.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:border-lime-200 transition-all flex flex-col group"
                        >
                            <div className="relative h-48 bg-slate-100 overflow-hidden">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-slate-800 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                        {item.type}
                                    </span>
                                </div>
                                <div className="absolute top-4 right-4">
                                    <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest shadow-sm flex items-center gap-1.5 ${
                                        item.available ? 'bg-emerald-500/95 text-white backdrop-blur-md' : 'bg-slate-800/95 text-white backdrop-blur-md'
                                    }`}>
                                        {item.available ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                        {item.available ? 'ভাড়ার জন্য প্রস্তুত' : 'বর্তমানে ভাড়া দেওয়া আছে'}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 flex flex-col flex-1">
                                <h3 className="text-lg font-black text-slate-800 leading-snug mb-3 line-clamp-1">{item.name}</h3>
                                
                                <div className="flex flex-wrap gap-1.5 mb-5">
                                    {item.features.map(feat => (
                                        <span key={feat} className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[10px] font-bold border border-slate-100">
                                            {feat}
                                        </span>
                                    ))}
                                </div>

                                <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-auto">
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase mb-0.5">মালিকের নাম</div>
                                        <div className="text-sm font-bold text-slate-700">{item.owner}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MapPin size={16} className="text-slate-400 shrink-0" />
                                        <span className="text-xs font-bold text-slate-600 truncate">{item.location}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <DollarSign size={16} className="text-lime-500 shrink-0" />
                                        <span className="text-sm font-black text-lime-700">{item.rate}</span>
                                    </div>
                                </div>

                                <button 
                                    disabled={!item.available}
                                    className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all shadow-sm ${
                                        item.available 
                                        ? 'bg-lime-500 hover:bg-lime-600 text-white active:scale-95 shadow-lime-500/20' 
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed hidden md:flex'
                                    }`}
                                    onClick={() => window.location.href = `tel:${item.phone}`}
                                >
                                    <Phone size={18} />
                                    {item.available ? 'ভাড়ার জন্য কল করুন' : 'বর্তমানে ব্যস্ত'}
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

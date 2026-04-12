'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, Phone, CheckCircle2, Wrench, HardHat, GraduationCap, XCircle, DollarSign, PenTool } from 'lucide-react';
import { getLaborers } from '@/lib/content/laborData';

export default function LaborDirectoryView() {
    const laborers = getLaborers();
    const [filter, setFilter] = useState('all'); 
    
    // Calculate categories dynamically
    const categories = ['all', ...Array.from(new Set(laborers.map(l => l.profession)))];

    const filteredList = laborers.filter(l => filter === 'all' || l.profession === filter);

    return (
        <div className="py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">ডিজি-শ্রমিক</h2>
                    <p className="text-sm font-medium text-slate-500">এলাকার বিশ্বস্ত পেশাজীবী ও দক্ষ শ্রমিকদের ভেরিফাইড ডিরেক্টরি</p>
                </div>
                <button className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-slate-900 text-white font-black text-sm hover:bg-teal-600 transition-all shadow-lg active:scale-95">
                    <PenTool size={18} />
                    শ্রমিক হিসেবে যুক্ত হোন
                </button>
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
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-700'
                        }`}
                    >
                        {cat === 'all' ? 'সব পেশা' : cat}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredList.map((person) => (
                        <motion.div
                            key={person.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all flex flex-col group"
                        >
                            <div className="flex items-start justify-between gap-4 mb-6">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                                        <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-full border-2 border-white ${person.available ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                                        {person.available ? <CheckCircle2 size={12} className="text-white" /> : <XCircle size={12} className="text-white" />}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center justify-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg">
                                        <Star size={14} className="text-amber-500 fill-amber-500 mt-[1px]" />
                                        <span className="text-sm font-black text-amber-700">{person.rating}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1">{person.reviews} টি রিভিউ</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-xl font-black text-slate-800 leading-none mb-1.5 group-hover:text-teal-600 transition-colors">{person.name}</h3>
                                <p className="text-sm font-black text-teal-600 mb-3">{person.profession}</p>
                                
                                <div className="flex flex-wrap gap-1.5">
                                    {person.expertise.map(skill => (
                                        <span key={skill} className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[10px] font-bold border border-slate-100">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-auto space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <MapPin size={16} className="text-slate-400 shrink-0" />
                                    <span className="text-xs font-bold text-slate-600 truncate">{person.location}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <DollarSign size={16} className="text-slate-400 shrink-0" />
                                    <span className="text-xs font-bold text-slate-600">{person.dailyRate}</span>
                                </div>
                            </div>

                            <button 
                                disabled={!person.available}
                                className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all shadow-sm ${
                                    person.available 
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95 shadow-emerald-500/20' 
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed hidden md:flex'
                                }`}
                                onClick={() => window.location.href = `tel:${person.phone}`}
                            >
                                <Phone size={18} />
                                {person.available ? 'কল করুন' : 'বর্তমানে ব্যস্ত আছেন'}
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            
            {filteredList.length === 0 && (
                <div className="text-center py-20">
                    <Search size={48} className="text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-slate-800 mb-2">শ্রমিক পাওয়া যায়নি</h3>
                    <p className="text-sm text-slate-500 font-medium">এই পেশার কোনো শ্রমিক বর্তমানে তালিকাভুক্ত নেই।</p>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Phone, MapPin, Search, Plus, 
    ChevronDown, ShieldCheck, HeartPulse, 
    Truck, Flame, Shield, Dog, Zap, Info
} from 'lucide-react';
import { emergencyCategories, emergencyHowTo } from '@/lib/content/emergencyDirectory';

const CATEGORY_ICONS = {
    national: ShieldCheck,
    hospital: HeartPulse,
    ambulance: Truck,
    fire: Flame,
    police: Shield,
    vet: Dog,
    utilities: Zap
};

export default function EmergencyDirectoryView() {
    const [searchTerm, setSearchTerm] = useState('');
    const [openCategory, setOpenCategory] = useState('national');

    const filteredCategories = emergencyCategories.map(cat => ({
        ...cat,
        items: cat.items.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.phones.some(p => p.number.includes(searchTerm))
        )
    })).filter(cat => cat.items.length > 0);

    return (
        <div className="space-y-8">
            {/* Search Bar */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Search size={20} className="text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="হাসপাতাল, অ্যাম্বুলেন্স বা ফায়ার সার্ভিসের নাম লিখে খুঁজুন..."
                    className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[24px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500/50 transition-all font-bold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Emergency Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {emergencyHowTo.map((tip, idx) => (
                    <div key={idx} className="p-5 rounded-3xl bg-teal-50/50 border border-teal-100 flex gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-teal-100 flex items-center justify-center text-teal-600 shrink-0 font-black text-xs">
                            {idx + 1}
                        </div>
                        <div>
                            <h4 className="font-black text-slate-800 text-sm mb-1">{tip.title}</h4>
                            <p className="text-xs font-bold text-slate-500 leading-relaxed">{tip.text}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Categories */}
            <div className="space-y-4">
                {filteredCategories.map((category) => {
                    const Icon = CATEGORY_ICONS[category.id] || Info;
                    const isOpen = openCategory === category.id;

                    return (
                        <div key={category.id} className="rounded-[32px] overflow-hidden bg-white border border-slate-200/60 shadow-sm">
                            <button
                                onClick={() => setOpenCategory(isOpen ? null : category.id)}
                                className={`w-full flex items-center justify-between p-6 sm:p-8 text-left transition-colors ${isOpen ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
                            >
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${isOpen ? 'bg-teal-600 shadow-teal-200' : 'bg-slate-800 shadow-slate-200'}`}>
                                        <Icon size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">{category.title}</h3>
                                        {category.subtitle && <p className="text-xs font-bold text-slate-500 mt-0.5">{category.subtitle}</p>}
                                    </div>
                                </div>
                                <motion.div
                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                    className="p-2 rounded-xl bg-slate-100 text-slate-400"
                                >
                                    <ChevronDown size={20} />
                                </motion.div>
                            </button>

                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    >
                                        <div className="px-6 sm:px-8 pb-8 space-y-4 border-t border-slate-100/50 bg-slate-50/30">
                                            {category.hint && (
                                                <div className="mt-6 flex gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-xs font-bold">
                                                    <Info size={16} className="shrink-0" />
                                                    {category.hint}
                                                </div>
                                            )}
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                                {category.items.map((item, idx) => (
                                                    <div key={idx} className="p-6 rounded-[28px] bg-white border border-slate-200/60 hover:border-teal-200 transition-all flex flex-col group">
                                                        <div className="flex items-start justify-between gap-4 mb-4">
                                                            <div>
                                                                <h4 className="font-black text-slate-800 text-base group-hover:text-teal-700 transition-colors leading-tight">{item.name}</h4>
                                                                {item.subtitle && <p className="text-xs font-bold text-slate-400 mt-1">{item.subtitle}</p>}
                                                            </div>
                                                            {item.badges?.map((b, i) => (
                                                                <span key={i} className="px-2 py-0.5 rounded-full bg-teal-50 text-[9px] font-black text-teal-600 uppercase tracking-tighter border border-teal-100 whitespace-nowrap">
                                                                    {b}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        {item.address && (
                                                            <div className="flex items-start gap-2 text-xs font-bold text-slate-500 mb-4">
                                                                <MapPin size={14} className="text-slate-300 shrink-0 mt-0.5" />
                                                                {item.address}
                                                            </div>
                                                        )}

                                                        <div className="mt-auto pt-4 border-t border-slate-50 flex flex-wrap gap-2">
                                                            {item.phones.map((p, pi) => (
                                                                <a
                                                                    key={pi}
                                                                    href={`tel:${p.number}`}
                                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 hover:bg-teal-600 text-white transition-all shadow-md active:scale-95"
                                                                >
                                                                    <Phone size={14} />
                                                                    <div className="flex flex-col items-start leading-none">
                                                                        <span className="text-[9px] font-black opacity-60 uppercase">{p.label || 'কল দিন'}</span>
                                                                        <span className="text-sm font-black tracking-tight">{p.number}</span>
                                                                    </div>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Help */}
            <div className="p-8 rounded-[40px] bg-gradient-to-br from-slate-900 to-teal-900 text-white relative overflow-hidden text-center sm:text-left">
                <div className="absolute right-0 top-0 w-64 h-64 bg-teal-500 rounded-full blur-[100px] opacity-20 pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row items-center gap-8">
                    <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10">
                        <Plus size={40} className="text-teal-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-2xl font-black mb-2">আপনার এলাকার নম্বর এখানে নেই?</h3>
                        <p className="text-slate-400 font-bold text-sm leading-relaxed max-w-xl">
                            আপনার এলাকায় নতুন কোনো ডাক্তার, ক্লিনিক বা অ্যাম্বুলেন্স সার্ভিস চালু হলে আমাদের ভলান্টিয়ার বা ইউনিয়ন সচিবের সাথে যোগাযোগ করুন। আমরা দ্রুত তালিকায় যুক্ত করে দেব।
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

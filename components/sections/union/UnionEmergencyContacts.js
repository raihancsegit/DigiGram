'use client';

import { useState, useEffect } from 'react';
import { 
    Phone, Ambulance, Shield, Flame, 
    UserPlus, HeartPulse, Pill, Search,
    ArrowUpRight, MapPin, Loader2, PhoneForwarded,
    ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';
import { emergencyService } from '@/lib/services/emergencyService';
import { motion, AnimatePresence } from 'framer-motion';
import { toBnDigits } from '@/lib/utils/format';

const CATEGORY_STYLES = {
    'Ambulance': {
        icon: Ambulance,
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        border: 'border-rose-100',
        gradient: 'from-rose-500 to-rose-600',
        label: 'অ্যাম্বুলেন্স'
    },
    'Fire Service': {
        icon: Flame,
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        border: 'border-orange-100',
        gradient: 'from-orange-500 to-orange-600',
        label: 'ফায়ার সার্ভিস'
    },
    'Police': {
        icon: Shield,
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-100',
        gradient: 'from-blue-600 to-indigo-600',
        label: 'পুলিশ / থানা'
    },
    'Doctor': {
        icon: UserPlus,
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-100',
        gradient: 'from-emerald-500 to-teal-600',
        label: 'চিকিৎসক'
    },
    'Pharmacy': {
        icon: Pill,
        bg: 'bg-teal-50',
        text: 'text-teal-600',
        border: 'border-teal-100',
        gradient: 'from-teal-500 to-emerald-600',
        label: 'ফার্মেসী'
    },
    'Volunteer': {
        icon: HeartPulse,
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        border: 'border-indigo-100',
        gradient: 'from-indigo-500 to-violet-600',
        label: 'স্বেচ্ছাসেবী'
    }
};

export default function UnionEmergencyContacts({ locationId, unionName }) {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    useEffect(() => {
        if (locationId) {
            loadContacts();
        }
    }, [locationId]);

    const loadContacts = async () => {
        setLoading(true);
        try {
            const response = await emergencyService.getContacts(locationId);
            setContacts(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error(err);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['All', ...Object.keys(CATEGORY_STYLES)];

    const filteredContacts = Array.isArray(contacts) 
        ? (filter === 'All' ? contacts : contacts.filter(c => c.category === filter))
        : [];

    if (loading) return (
        <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
            <p className="text-slate-400 font-bold">যোগাযোগের নম্বরগুলো লোড হচ্ছে...</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none">জরুরি যোগাযোগ ও হেল্পলাইন</h2>
                    <p className="text-xs font-bold text-slate-400 mt-2">{unionName} ইউনিয়নের গুরুত্বপূর্ণ সকল নাম্বারসমূহ</p>
                </div>

                <div className="flex bg-white p-1.5 rounded-full border border-slate-200 overflow-x-auto no-scrollbar gap-1 shadow-sm">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => { setFilter(cat); setCurrentPage(1); }}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap transition-all ${
                                filter === cat 
                                ? 'bg-slate-900 text-white shadow-lg' 
                                : 'text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {cat === 'All' ? 'সব নাম্বার' : (CATEGORY_STYLES[cat]?.label || cat)}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {filteredContacts.length > 0 ? (
                    <motion.div 
                        key={filter + currentPage}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredContacts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((contact, idx) => {
                            const style = CATEGORY_STYLES[contact.category] || {
                                icon: Phone,
                                bg: 'bg-slate-50',
                                text: 'text-slate-600',
                                border: 'border-slate-100',
                                gradient: 'from-slate-500 to-slate-600',
                                label: contact.category
                            };
                            const Icon = style.icon;

                            return (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={contact.id}
                                    className="group bg-white rounded-[32px] border border-slate-100 p-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 relative overflow-hidden"
                                >
                                    <div className={`absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform`}>
                                        <Icon size={120} />
                                    </div>

                                    <div className="flex items-start justify-between mb-6">
                                        <div className={`w-14 h-14 rounded-2xl ${style.bg} flex items-center justify-center ${style.text} shadow-sm border ${style.border} group-hover:scale-110 transition-transform duration-500`}>
                                            <Icon size={28} />
                                        </div>
                                        <span className={`px-3 py-1 rounded-full ${style.bg} ${style.text} text-[10px] font-black uppercase tracking-wider border ${style.border}`}>
                                            {style.label}
                                        </span>
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-xl font-black text-slate-800 mb-1 group-hover:text-slate-900 transition-colors">
                                            {contact.name}
                                        </h3>
                                        {contact.address && (
                                            <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                                <MapPin size={14} className="text-slate-300" /> {contact.address}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <a 
                                            href={`tel:${contact.phone}`}
                                            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-br ${style.gradient} text-white shadow-lg group-hover:shadow-xl transition-all active:scale-95`}
                                        >
                                            <PhoneForwarded size={18} className="animate-pulse" />
                                            <span className="text-lg font-black tracking-tighter">{toBnDigits(contact.phone)}</span>
                                        </a>
                                        <button className="p-4 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                                            <ArrowUpRight size={20} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-20 text-center bg-white rounded-[40px] border border-slate-100"
                    >
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search size={32} className="text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold text-lg">এই ক্যাটাগরিতে কোনো নাম্বার পাওয়া যায়নি।</p>
                        <button 
                            onClick={() => { setFilter('All'); setCurrentPage(1); }}
                            className="mt-4 text-teal-600 font-black text-sm hover:underline"
                        >
                            সব নাম্বার দেখুন
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pagination Controls - Shrunk Pill Design */}
            {filteredContacts.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-center gap-4 py-8 border-t border-slate-100 mt-8">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-teal-200 hover:bg-teal-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-sm"
                    >
                        <ChevronLeft size={16} /> আগের পাতা
                    </button>
                    
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">
                        <Calendar size={12} className="text-teal-400" />
                        পাতা: {currentPage} / {Math.ceil(filteredContacts.length / ITEMS_PER_PAGE)}
                    </div>

                    <button 
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredContacts.length / ITEMS_PER_PAGE), p + 1))}
                        disabled={currentPage === Math.ceil(filteredContacts.length / ITEMS_PER_PAGE)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-teal-200 hover:bg-teal-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-sm"
                    >
                        পরের পাতা <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}

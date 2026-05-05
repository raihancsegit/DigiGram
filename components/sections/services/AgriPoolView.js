'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tractor, MapPin, Phone, CheckCircle2, XCircle, Search, DollarSign, PenTool, Sprout, Settings, Truck, CalendarClock, Zap, ArrowRight, Wheat } from 'lucide-react';
import { getAgriEquipment } from '@/lib/content/agriEquipmentData';
import Pagination from '@/components/common/Pagination';

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
        <div className="pb-16 pt-4">
            {/* 1. Hero Section */}
            <div className="relative rounded-[40px] bg-gradient-to-br from-lime-900 to-green-950 border border-lime-800 overflow-hidden px-6 py-16 md:p-20 mb-16 shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lime-500/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
                <div className="absolute top-10 right-10 opacity-10">
                    <Tractor size={200} />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-center md:text-left max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-500/20 border border-lime-500/30 text-lime-300 text-xs font-black uppercase tracking-widest mb-6">
                            <Sprout size={14} /> কৃষি যন্ত্রপাতি হাব
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.2] mb-6">
                            ট্রাক্টর বা হারভেস্টর ভাড়া নিন <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-amber-400">দালাল ছাড়াই সরাসরি</span>
                        </h2>
                        <p className="text-lg text-lime-100/80 font-medium mb-8 leading-relaxed max-w-xl">
                            মেশিনের অরিজিনাল ছবি, বর্তমান কন্ডিশন এবং ডেলিভারি অপশন দেখে সরাসরি মালিককে কল করুন।
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button onClick={() => document.getElementById('agri-directory').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-lime-500 to-green-600 text-white font-black text-lg hover:from-lime-400 hover:to-green-500 transition-all shadow-lg shadow-lime-500/25 active:scale-95 flex items-center justify-center gap-2">
                                <Search size={20} />
                                যন্ত্র ব্রাউজ করুন
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
                        <div className="bg-black/20 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md">
                            <Tractor size={32} className="text-lime-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={120} suffix="+" /></div>
                            <p className="text-[10px] font-black text-lime-200/50 uppercase tracking-widest">লিস্টেড ফ্লিট</p>
                        </div>
                        <div className="bg-black/20 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md mt-6">
                            <Phone size={32} className="text-amber-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={45} suffix="+" /></div>
                            <p className="text-[10px] font-black text-amber-200/50 uppercase tracking-widest">মালিক যুক্ত আছেন</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. How it Works */}
            <div className="mb-20">
                <div className="text-center mb-12">
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-4">ভাড়া নেওয়ার প্রসেস অতি সহজ</h3>
                    <p className="text-slate-500 font-medium max-w-md mx-auto">কৃষি শ্রম এবং সময় বাঁচাতে আধুনিক যন্ত্রপাতির ব্যবহারকে আরও সহজলভ্য করার জন্যই আমাদের এই উদ্যোগ।</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-lime-50/50 rounded-[32px] p-8 border border-lime-100 text-center relative hover:-translate-y-2 transition-transform shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm text-lime-600 flex items-center justify-center mx-auto mb-6">
                            <Wheat size={28} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-3">ক্যাটাগরি সিলেক্ট করুন</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">ধান কাটা, জমি চাষ বা সেচ—আপনার প্রয়োজনীয় ক্যাটাগরির ফিল্টারে ক্লিক করুন।</p>
                    </div>
                    <div className="bg-emerald-50/50 rounded-[32px] p-8 border border-emerald-100 text-center relative hover:-translate-y-2 transition-transform shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm text-emerald-600 flex items-center justify-center mx-auto mb-6">
                            <Settings size={28} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-3">কন্ডিশন যাচাই করুন</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">আসল ছবি, ইঞ্জিন ক্যাপাসিটি এবং কবে মেশিনটি ফাঁকা পাওয়া যাবে তা দেখে নিন।</p>
                    </div>
                    <div className="bg-amber-50/50 rounded-[32px] p-8 border border-amber-100 text-center relative hover:-translate-y-2 transition-transform shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm text-amber-600 flex items-center justify-center mx-auto mb-6">
                            <Phone size={28} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-3">মালিককে কল করুন</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">সরাসরি মালিকের দেওয়া নাম্বারে কল করে দামাদামি করুন এবং অ্যাডভান্স বুক করুন।</p>
                    </div>
                </div>
            </div>

            {/* 3. Directory List */}
            <div id="agri-directory" className="mb-8 pt-8 border-t border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2">উপলব্ধ যন্ত্রপাতি</h2>
                        <p className="text-sm font-medium text-slate-500">আপনার এলাকার ট্রাক্টর, হারভেস্টর ও সেচ পাম্প মালিকদের তালিকা</p>
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`shrink-0 px-6 py-3 rounded-full text-sm font-black transition-all ${
                                filter === cat 
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-lime-400 hover:text-lime-700 hover:shadow-sm'
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
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:border-lime-300 transition-all flex flex-col sm:flex-row group"
                            >
                                <div className="sm:w-[45%] relative h-64 sm:h-auto bg-slate-100 overflow-hidden shrink-0 p-3 pb-0 sm:pb-3 sm:pr-0">
                                    <div className="w-full h-full relative rounded-[28px] overflow-hidden">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                {item.type}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                            <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase shadow-md border border-white/20 backdrop-blur-md ${
                                                item.condition === 'Excellent' ? 'bg-emerald-500/90 text-white' : 'bg-lime-500/90 text-white'
                                            }`}>
                                                {item.condition === 'Excellent' ? 'নতুন কন্ডিশন' : 'ভালো কন্ডিশন'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 md:p-8 flex flex-col flex-1">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <h3 className="text-2xl font-black text-slate-800 leading-snug line-clamp-2 group-hover:text-lime-600 transition-colors">{item.name}</h3>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 mb-5 text-[11px] font-black tracking-widest">
                                        <span className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-white ${
                                            item.available ? 'bg-emerald-500' : 'bg-rose-500'
                                        }`}>
                                            {item.available ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                            {item.available ? 'ভাড়ার জন্য ফ্রি' : 'ভাড়া দেওয়া আছে'}
                                        </span>
                                    </div>

                                    <div className="space-y-3 mb-6 bg-slate-50 p-5 rounded-[24px] border border-slate-100">
                                        <div className="flex items-start gap-3 text-sm font-bold text-slate-600">
                                            <Settings size={18} className="text-slate-400 shrink-0 mt-0.5" />
                                            <span className="leading-snug">{item.engineCapacity}</span>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm font-bold text-slate-600">
                                            <Truck size={18} className="text-slate-400 shrink-0 mt-0.5" />
                                            <span className="leading-snug">{item.deliveryOption}</span>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm font-bold text-slate-600">
                                            <CalendarClock size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                            <span className="leading-snug text-amber-700">{item.nextAvailableDate}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex items-end justify-between mb-6 pt-4 border-t border-slate-100">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ভাড়ার হার</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-lime-100 text-lime-600 flex items-center justify-center">
                                                    <DollarSign size={18} />
                                                </div>
                                                <span className="text-xl font-black text-lime-700">{toBnNum(item.rate)}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">মালিকানা</p>
                                            <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{item.owner}</span>
                                        </div>
                                    </div>

                                    <button 
                                        disabled={!item.available}
                                        className={`w-full py-4 rounded-[20px] flex items-center justify-center gap-2 font-black text-base transition-all shadow-sm ${
                                            item.available 
                                            ? 'bg-slate-900 hover:bg-lime-500 text-white active:scale-95 shadow-slate-900/20' 
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        }`}
                                        onClick={() => window.location.href = `tel:${item.phone}`}
                                    >
                                        <Phone size={18} />
                                        {item.available ? 'সরাসরি কল করুন' : 'বর্তমানে ব্যস্ত'}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <div className="mt-12">
                    <Pagination 
                        currentPage={1}
                        totalCount={filteredList.length}
                        pageSize={12}
                        onPageChange={() => {}}
                    />
                </div>
            </div>

            {/* 4. Footer CTA Banner */}
            <div className="mt-16 bg-white rounded-[40px] p-8 md:p-12 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-xl shadow-slate-200/50">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-lime-100 rounded-full blur-[80px]"></div>
                
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-50 border border-lime-100 text-lime-600 text-xs font-black uppercase tracking-widest mb-6">
                        <PenTool size={16} /> যন্ত্রপাতির মালিকদের জন্য
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-3">আপনার কি ট্রাক্টর বা পাম্প আছে?</h3>
                    <p className="text-slate-600 font-medium max-w-lg leading-relaxed">
                        মাঠে মেশিন বসিয়ে না রেখে, এই অ্যাপে লিস্টিং করে দিন। এলাকার কৃষকরা সরাসরি আপনাকে কল করে বুকিং দিলে আপনার ব্যবসা বাড়বে বহুগুণ।
                    </p>
                </div>
                <div className="shrink-0 w-full md:w-auto relative z-10 flex flex-col gap-3">
                    <button className="w-full text-center px-8 py-5 rounded-[20px] bg-slate-900 text-white font-black text-lg shadow-lg hover:shadow-xl hover:bg-lime-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                        ফ্রি-তে লিস্ট করুন <ArrowRight size={20} />
                    </button>
                    <p className="text-[10px] font-black text-slate-400 text-center">* কোনো লিস্টিং বা কমিশন ফি নেই</p>
                </div>
            </div>
            
        </div>
    );
}

'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Droplet, MapPin, 
    Phone, Calendar, Users, 
    CheckCircle2, Clock, Info,
    UserCircle, ArrowRight, Heart, Activity, LifeBuoy
} from 'lucide-react';
import { ALL_DONORS } from '@/lib/content/donorData';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function BloodBankView() {
    return (
        <Suspense fallback={<div className="py-20 text-center font-bold text-slate-400">Loading Blood Bank...</div>}>
            <BloodBankContent />
        </Suspense>
    );
}

function BloodBankContent() {
    const searchParams = useSearchParams();
    const unionQuery = searchParams.get('u');

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('All');
    
    // Set initial union to the query param if it exists, otherwise 'All'
    const [selectedUnion, setSelectedUnion] = useState(unionQuery || 'All');

    // If there is a union query, we consider the filter "locked" to that union
    const isUnionLocked = !!unionQuery;

    // Optional: if unionQuery changes, update the selection
    useEffect(() => {
        if (unionQuery) {
            setSelectedUnion(unionQuery);
        }
    }, [unionQuery]);

    // Get unique unions for filter
    const unions = useMemo(() => {
        const unique = Array.from(new Set(ALL_DONORS.map(d => d.unionId)));
        return ['All', ...unique];
    }, []);

    const filteredDonors = ALL_DONORS.filter(donor => {
        const matchesGroup = selectedGroup === 'All' || donor.bloodGroup === selectedGroup;
        const matchesUnion = selectedUnion === 'All' || donor.unionId === selectedUnion;
        const matchesSearch = donor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             donor.village.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesGroup && matchesUnion && matchesSearch;
    });

    const totalDonors = filteredDonors.length;
    const availableNow = filteredDonors.filter(d => d.isAvailable).length;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Premium Dark Hero for Blood Bank */}
            <div className="relative pt-24 pb-20 md:pt-32 md:pb-24 px-4 overflow-hidden bg-slate-900 border-b border-slate-800 rounded-b-[48px] md:rounded-b-[80px]">
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/4 animate-pulse" />
                </div>
                
                <div className="max-w-[1200px] mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col lg:flex-row lg:items-end justify-between gap-8"
                    >
                        <div className="flex-1 text-white">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                                <Activity size={14} className="inline mr-1" />
                                Smart Blood Bank
                            </div>
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight mb-4">
                                ডায়নামিক <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">ব্লাড ব্যাংক</span>
                            </h1>
                            <p className="text-xl text-slate-400 font-bold max-w-2xl">
                                {isUnionLocked ? `${unionQuery} ইউনিয়ন ভিত্তিক দাতা তালিকা` : "উপজেলার সকল ইউনিয়নের রক্তদাতার তথ্য এখন এক জায়গায়।"}
                            </p>
                        </div>

                        {/* Top Dashboard Stats inside Hero */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 shrink-0">
                            {[
                                { label: 'রক্তদাতা', value: ALL_DONORS.length, unit: 'জন', icon: Heart, color: 'from-rose-500 to-rose-600' },
                                { label: 'প্রস্তুত', value: availableNow, unit: 'জন', icon: Activity, color: 'from-teal-500 to-teal-600' },
                                { label: 'রক্তদান', value: ALL_DONORS.reduce((acc, curr) => acc + (curr.totalDonations || 0), 0), unit: 'বার', icon: LifeBuoy, color: 'from-blue-500 to-blue-600' },
                            ].map((s, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={s.label}
                                    className="p-4 md:p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl group hover:bg-white/10 transition-all cursor-default"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`p-2 rounded-xl bg-gradient-to-br ${s.color} text-white shadow-lg`}>
                                            <s.icon size={16} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-white">{s.value}</span>
                                        <span className="text-xs font-bold text-slate-500">{s.unit}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 -mt-12 relative z-20 space-y-12">

                {/* Smart Filters Area */}
                <div className="p-4 sm:p-8 rounded-[40px] bg-white border border-slate-100 italicshadow-sm space-y-6 md:space-y-8">
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                        {/* Search Input */}
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                <Search size={22} className="text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="দাতার নাম, রক্তের গ্রুপ বা এলাকা খুঁজুন..."
                                className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500/30 transition-all font-black text-lg"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Union Filter */}
                        <div className="w-full lg:w-72">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                    <MapPin size={22} className={`transition-colors ${isUnionLocked ? 'text-teal-500' : 'text-slate-400 group-focus-within:text-rose-500'}`} />
                                </div>
                                <select
                                    value={selectedUnion}
                                    onChange={(e) => setSelectedUnion(e.target.value)}
                                    disabled={isUnionLocked}
                                    className={`w-full pl-16 pr-6 py-5 border rounded-[24px] font-black focus:outline-none transition-all appearance-none text-lg capitalize ${
                                        isUnionLocked 
                                        ? 'bg-teal-50/50 border-teal-100 text-teal-800 cursor-not-allowed opacity-80' 
                                        : 'bg-slate-50 border-slate-100 text-slate-800 cursor-pointer focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500/30'
                                    }`}
                                >
                                    <option value="All">সব ইউনিয়ন</option>
                                    {unions.filter(u => u !== 'All').map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Blood Group Filter (Horizontal Scroll) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">রক্তের গ্রুপ নির্বাচন করুন</h4>
                            <span className="text-[10px] font-bold text-slate-300">প্রাপ্ত: {totalDonors} জন</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                            {[ 'All', ...BLOOD_GROUPS ].map((group) => (
                                <button
                                    key={group}
                                    onClick={() => setSelectedGroup(group)}
                                    className={`shrink-0 flex items-center gap-2 px-8 py-4 rounded-[22px] font-black text-lg transition-all border-2 ${
                                        selectedGroup === group
                                            ? 'bg-rose-500 text-white border-rose-500 shadow-xl shadow-rose-500/30 scale-105'
                                            : 'bg-white text-slate-600 border-slate-100 hover:bg-rose-50 hover:border-rose-100 shadow-sm'
                                    }`}
                                >
                                    {group === 'All' ? null : <Droplet size={18} className={selectedGroup === group ? 'text-rose-200' : 'text-rose-500'} />}
                                    {group === 'All' ? 'সব গ্রুপ' : group}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode='popLayout'>
                    {filteredDonors.map((donor, idx) => (
                        <motion.div
                            key={donor.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            layout
                            className="group relative bg-white border border-slate-200/60 rounded-[32px] overflow-hidden hover:border-teal-300 hover:shadow-xl transition-all duration-500"
                        >
                            {/* Card Accent */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full pointer-events-none group-hover:bg-rose-500/10 transition-colors" />
                            
                            <div className="p-8 relative">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:border-rose-100 group-hover:bg-rose-50 transition-all overflow-hidden relative z-10">
                                            <UserCircle size={40} className="group-hover:text-rose-200 transition-colors" />
                                        </div>
                                        {/* Status Dot */}
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white z-20 ${donor.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-rose-200">
                                            <span className="drop-shadow-md">{donor.bloodGroup}</span>
                                        </div>
                                        <div className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${donor.isAvailable ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${donor.isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                                            {donor.isAvailable ? 'এখন রক্ত দিতে প্রস্তুত' : 'সাময়িক বিরতি'}
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="space-y-4 mb-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-black text-slate-800 leading-none group-hover:text-rose-600 transition-colors">{donor.name}</h3>
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                        </div>
                                        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-500 mt-2 capitalize">
                                            <MapPin size={16} className="text-slate-400" />
                                            {donor.village}, {donor.unionId}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">মোট রক্তদান</p>
                                            <p className="text-base font-black text-slate-700 flex items-center gap-1">
                                                <Heart size={14} className="text-rose-500" /> 
                                                {donor.totalDonations} বার
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">শেষ দান</p>
                                            <p className="text-base font-black text-slate-700 flex items-center gap-1">
                                                <Calendar size={14} className="text-slate-400" />
                                                {donor.lastDonation}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <a
                                    href={`tel:${donor.phone}`}
                                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-900 group-hover:bg-rose-600 text-white font-black text-sm shadow-lg shadow-slate-200 group-hover:shadow-rose-200 transition-all active:scale-95 z-10 relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 w-full translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                    <Phone size={18} className="relative z-10" />
                                    <span className="relative z-10">সরাসরি কল দিন</span>
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredDonors.length === 0 && (
                    <div className="col-span-full py-20 text-center space-y-4">
                        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-300">
                            <HeartPulse size={48} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">কোনো তথ্য পাওয়া যায়নি</h3>
                            <p className="text-slate-500 font-bold text-base mt-2">ভিন্ন গ্রুপ বা গ্রাম লিখে চেষ্টা করুন।</p>
                        </div>
                        <button 
                            onClick={() => { setSearchTerm(''); setSelectedGroup('All'); setSelectedUnion('All'); }}
                            className="mt-4 px-8 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-sm hover:bg-rose-100 transition-all active:scale-95"
                        >
                            সবগুলো দেখুন
                        </button>
                    </div>
                )}
            </div>

            {/* Donor Registration CTA */}
            <div className="p-10 rounded-[48px] bg-gradient-to-br from-rose-600 to-orange-700 text-white relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 w-96 h-96 bg-white/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="max-w-xl text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md">
                            <HeartPulse size={14} className="text-rose-300" />
                            দাতা হিসেবে যুক্ত হোন
                        </div>
                        <h3 className="text-3xl sm:text-4xl font-black mb-4 leading-tight">
                            আপনার রক্ত একটি <span className="text-rose-300">মূল্যবান জীবন</span> বাঁচাতে পারে
                        </h3>
                        <p className="text-white/70 font-bold text-base leading-relaxed">
                            আপনি কি স্বেচ্ছায় রক্তদান করতে ইচ্ছুক? ডিজিগ্রাম ব্লাড ব্যাংকে নিজের তথ্য যুক্ত করে রাখুন। জরুরি প্রয়োজনে আপনার গ্রামবাসী বা আত্মীয়কে দ্রুত সাহায্য করতে পারবেন।
                        </p>
                    </div>
                    
                    <button className="shrink-0 flex items-center gap-3 px-10 py-5 rounded-[24px] bg-white text-rose-600 font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all">
                        রেজিস্ট্রেশন করুন
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>

            {/* FAQ / Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-teal-600 shadow-sm border border-slate-100">
                            <Clock size={20} />
                        </div>
                        <h4 className="text-lg font-black text-slate-800">রক্তদানের শর্তাবলি</h4>
                    </div>
                    <ul className="space-y-3">
                        {['বয়স ১৮-৬০ বছর', 'ওজন অন্তত ৫০ কেজি', '৪ মাস আগে শেষ রক্তদান', 'সুস্থ ও রোগমুক্ত শরীর'].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                <CheckCircle2 size={16} className="text-emerald-500" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-600 shadow-sm border border-slate-100">
                            <Info size={20} />
                        </div>
                        <h4 className="text-lg font-black text-slate-800">জরুরি পরামর্শ</h4>
                    </div>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed">
                        রক্তদানের পর পর্যাপ্ত পানি ও পুষ্টিকর খাবার গ্রহণ করুন। অন্তত ৩০ মিনিট বিশ্রাম নিন এবং ২৪ ঘণ্টা ভারী পরিশ্রম থেকে বিরত থাকুন। কোনো সমস্যা হলে আমাদের ভলান্টিয়ার বা নিকটস্থ হাসপাতালে যোগাযোগ করুন।
                    </p>
                </div>
            </div>
        </div>
    </div>
    );
}

function HeartPulse({size, className}) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M20.42 4.58a5 5 0 0 0-7.07 0l-.35.35-.35-.35a5 5 0 0 0-7.07 7.07l1.35 1.35.35.35L12 18l4.65-4.65.35-.35 1.35-1.35a5 5 0 0 0 0-7.07Z" />
            <path d="M12 13V18" />
            <path d="M12 6V8" />
        </svg>
    )
}

'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Droplet, MapPin, 
    Phone, Calendar, Users, 
    CheckCircle2, Clock, Info,
    UserCircle, ArrowRight, Heart, HeartPulse, Activity
} from 'lucide-react';
import { ALL_DONORS } from '@/lib/content/donorData';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

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

export default function BloodBankView() {
    return (
        <Suspense fallback={<div className="py-20 text-center font-bold text-slate-400">রক্তদাতা খোঁজা হচ্ছে...</div>}>
            <BloodBankContent />
        </Suspense>
    );
}

function BloodBankContent() {
    const searchParams = useSearchParams();
    const unionQuery = searchParams.get('u');

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('All');
    const [selectedUnion, setSelectedUnion] = useState(unionQuery || 'All');

    const unions = useMemo(() => {
        const u = new Set(ALL_DONORS.map(d => d.unionId));
        return ['All', ...Array.from(u)];
    }, []);

    const filteredDonors = useMemo(() => {
        return ALL_DONORS.filter(donor => {
            const matchesSearch = donor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  donor.village.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesGroup = selectedGroup === 'All' || donor.bloodGroup === selectedGroup;
            const matchesUnion = selectedUnion === 'All' || donor.unionId === selectedUnion;

            return matchesSearch && matchesGroup && matchesUnion;
        });
    }, [searchTerm, selectedGroup, selectedUnion]);

    const activeDonors = ALL_DONORS.filter(d => d.isAvailable).length;

    return (
        <div className="pb-16 pt-4">
            {/* 1. Hero Section */}
            <div className="relative rounded-[40px] bg-rose-950 border border-rose-900 overflow-hidden px-6 py-16 md:p-20 mb-16 shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/30 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/20 blur-[150px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-center md:text-left max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-rose-200 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md shadow-sm">
                            <HeartPulse size={14} className="animate-pulse text-rose-400" /> স্মার্ট ইউনিয়ন ব্লাড ব্যাংক
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.2] mb-6">
                            এক ফোটা রক্ত, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">বাঁচাতে পারে একটি প্রাণ</span>
                        </h2>
                        <p className="text-lg text-rose-100/80 font-medium mb-8 leading-relaxed max-w-xl">
                            আপনার ইউনিয়নের নিবন্ধিত রক্তদাতাদের তালিকা। জরুরি মুহূর্তে সরাসরি কল করে সহজে রক্ত সংগ্রহ করুন।
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button onClick={() => document.getElementById('directory').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-5 rounded-[20px] bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-lg hover:from-rose-400 hover:to-red-500 transition-all shadow-lg shadow-rose-500/25 active:scale-95 flex items-center justify-center gap-2">
                                <Droplet size={20} className="fill-current" />
                                রক্তদাতা খুঁজুন
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md">
                            <Users size={32} className="text-orange-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={ALL_DONORS.length} suffix="+" /></div>
                            <p className="text-[10px] font-black text-rose-200/50 uppercase tracking-widest">নিবন্ধিত দাতা</p>
                        </div>
                        <div className="bg-rose-500/20 border border-rose-500/30 rounded-[32px] p-6 text-center backdrop-blur-md mt-6 relative overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-t from-rose-500/20 to-transparent"></div>
                            <Activity size={32} className="text-rose-400 mx-auto mb-3 relative z-10" />
                            <div className="text-3xl font-black text-white mb-1 relative z-10"><AnimatedCounter end={activeDonors} /></div>
                            <p className="text-[10px] font-black text-rose-200/80 uppercase tracking-widest relative z-10">বর্তমানে প্রস্তুত</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Process / How it Works */}
            <div className="mb-20">
                <div className="text-center mb-12">
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-4">কীভাবে রক্তদাতা পাবেন?</h3>
                    <p className="text-slate-500 font-medium max-w-md mx-auto">জরুরি সময়ে অযথা সময় নষ্ট না করে সঠিক রক্তদাতার কাছে পৌঁছানোর সহজ প্রসেস।</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-rose-50/50 rounded-[32px] p-8 border border-rose-100 text-center relative hover:-translate-y-2 transition-transform shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm text-rose-600 flex items-center justify-center mx-auto mb-6">
                            <Search size={28} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-3">১. গ্রুপ সিলেক্ট করুন</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">আপনার প্রয়োজনীয় রক্তের গ্রুপ এবং ইউনিয়ন নির্বাচন করে ফিল্টার করুন।</p>
                    </div>
                    <div className="bg-orange-50/50 rounded-[32px] p-8 border border-orange-100 text-center relative hover:-translate-y-2 transition-transform shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm text-orange-500 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={28} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-3">২. এভেইলেবিলিটি চেক</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">যিনি রক্ত দেওয়ার জন্য প্রস্তুত আছেন (সবুজ সিগন্যাল) শুধু তাকেই বাছাই করুন।</p>
                    </div>
                    <div className="bg-red-50/50 rounded-[32px] p-8 border border-red-100 text-center relative hover:-translate-y-2 transition-transform shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm text-red-600 flex items-center justify-center mx-auto mb-6">
                            <Phone size={28} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-3">৩. সরাসরি কল করুন</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">প্রোফাইলের নিচে থাকা "সরাসরি কল দিন" বাটনে ক্লিক করে যোগাযোগ করুন।</p>
                    </div>
                </div>
            </div>

            {/* 3. Directory Section */}
            <div id="directory">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2">রক্তদাতাদের তালিকা</h2>
                        <p className="text-sm font-medium text-slate-500">আপনার ইউনিয়ন অনুযায়ী তালিকা ফিল্টার করে দেখুন</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
                    <div className="relative md:col-span-4">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="নাম বা গ্রাম দিয়ে খুঁজুন..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all shadow-sm"
                        />
                    </div>
                    
                    <div className="md:col-span-8 flex flex-col sm:flex-row gap-4">
                        <select
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            className="flex-1 py-3.5 px-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500 appearance-none shadow-sm cursor-pointer"
                        >
                            <option value="All">সব রক্তের গ্রুপ</option>
                            {BLOOD_GROUPS.map(group => (
                                <option key={group} value={group}>{group}</option>
                            ))}
                        </select>

                        <select
                            value={selectedUnion}
                            onChange={(e) => setSelectedUnion(e.target.value)}
                            className="flex-1 py-3.5 px-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500 appearance-none shadow-sm cursor-pointer"
                        >
                            <option value="All">সব ইউনিয়ন (উপজেলা)</option>
                            {unions.filter(u => u !== 'All').map(union => (
                                <option key={union} value={union}>{union}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredDonors.map((donor, idx) => (
                            <motion.div
                                key={donor.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white rounded-[32px] p-6 border border-slate-200 hover:border-rose-300 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-50 to-transparent rounded-bl-full pointer-events-none" />
                                
                                <div className="flex items-center justify-between mb-6 relative z-10">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-rose-100 to-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-black text-2xl shadow-inner shadow-rose-200/50 group-hover:scale-110 transition-transform">
                                            {donor.bloodGroup}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-[10px] font-black tracking-widest uppercase shadow-sm border ${
                                            donor.isAvailable 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                            : 'bg-slate-50 text-slate-500 border-slate-100'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${donor.isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                                            {donor.isAvailable ? 'প্রস্তুত আছেন' : 'সম্প্রতি দিয়েছেন'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8 flex-1 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <h3 className="text-xl font-black text-slate-800 leading-none group-hover:text-rose-600 transition-colors">{donor.name}</h3>
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                        </div>
                                        <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mt-2">
                                            <MapPin size={14} className="text-slate-400" />
                                            {donor.village}, {donor.unionId}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 p-4 rounded-[20px] bg-slate-50 border border-slate-100">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">মোট দান</p>
                                            <p className="text-sm font-black text-slate-700 flex items-center gap-1.5">
                                                <Heart size={14} className="text-rose-500 fill-current" /> 
                                                {donor.totalDonations} বার
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">শেষ দান</p>
                                            <p className="text-sm font-black text-slate-700 flex items-center gap-1.5">
                                                <Calendar size={14} className="text-slate-400" />
                                                {donor.lastDonation}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => window.location.href = `tel:${donor.phone}`}
                                    className="w-full flex items-center justify-center gap-2 py-4 rounded-[20px] bg-slate-900 hover:bg-rose-600 text-white font-black text-sm shadow-xl shadow-slate-900/10 transition-all active:scale-95 relative z-10"
                                >
                                    <Phone size={18} />
                                    সরাসরি কল দিন
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredDonors.length === 0 && (
                        <div className="col-span-full py-20 text-center space-y-4 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-300">
                                <HeartPulse size={48} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800">কোনো রক্তদাতা পাওয়া যায়নি</h3>
                                <p className="text-slate-500 font-bold text-sm mt-2">অন্য গ্রুপের বা অন্য ইউনিয়নের সার্চ করে দেখতে পারেন।</p>
                            </div>
                            <button 
                                onClick={() => { setSearchTerm(''); setSelectedGroup('All'); setSelectedUnion('All'); }}
                                className="mt-4 px-8 py-3 bg-white text-rose-600 border border-rose-200 rounded-full font-black text-sm hover:bg-rose-50 transition-all active:scale-95 shadow-sm"
                            >
                                ফিল্টার ক্লিয়ার করুন
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Footer CTA */}
            <div className="mt-16 p-8 md:p-12 rounded-[40px] bg-gradient-to-br from-rose-600 to-orange-600 text-white relative overflow-hidden group shadow-2xl">
                <div className="absolute right-0 bottom-0 w-[400px] h-[400px] bg-white/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 z-10">
                    <div className="max-w-xl text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/20 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md shadow-sm">
                            <HeartPulse size={14} className="animate-pulse" />
                            একজন হিরো হোন
                        </div>
                        <h3 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                            নতুন রক্তদাতা হিসেবে <span className="text-rose-200">আজই যুক্ত হোন</span>
                        </h3>
                        <p className="text-white/80 font-bold text-sm md:text-base leading-relaxed">
                            আপনার এক ফোটা রক্ত পারে মুমর্ষু রোগীর জীবন বাঁচাতে। এলাকার এই মহৎ উদ্যোগে যুক্ত হতে নিচের বাটনে ক্লিক করে ফর্মটি পূরণ করুন। 
                        </p>
                    </div>
                    
                    <button className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-10 py-5 rounded-[24px] bg-white text-rose-600 font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all">
                        <Heart size={20} className="fill-rose-600" /> নিবন্ধন করুন
                    </button>
                </div>
            </div>
            
        </div>
    );
}

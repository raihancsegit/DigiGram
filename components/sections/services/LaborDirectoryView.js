'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, Phone, CheckCircle2, XCircle, DollarSign, PenTool, ShieldCheck, Briefcase, ChevronRight, HardHat, TrendingUp, Users, ShieldAlert } from 'lucide-react';
import { getLaborers } from '@/lib/content/laborData';

// Animated Counter component
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

export default function LaborDirectoryView() {
    const laborers = getLaborers();
    const [filter, setFilter] = useState('all'); 
    
    const categories = ['all', ...Array.from(new Set(laborers.map(l => l.profession)))];
    const filteredList = laborers.filter(l => filter === 'all' || l.profession === filter);

    const bnMap = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    const toBnNum = (num) => String(num).replace(/[0-9]/g, match => bnMap[match]);

    return (
        <div className="pb-16 pt-4">
            {/* 1. Hero Section */}
            <div className="relative rounded-[40px] bg-slate-900 border border-slate-800 overflow-hidden px-6 py-16 md:p-20 mb-16 shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-teal-500/10 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-1/2 h-full bg-sky-500/10 blur-[100px] rounded-full"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-center md:text-left max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-teal-300 text-xs font-black uppercase tracking-widest mb-6">
                            <ShieldCheck size={14} /> ১০০% ভেরিফাইড প্রোফাইল
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.2] mb-6">
                            আপনার এলাকার <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-sky-400">সেরা মিস্ত্রি ও শ্রমিক</span> খুঁজুন মাত্র এক ক্লিকে
                        </h2>
                        <p className="text-lg text-slate-300 font-medium mb-8 leading-relaxed max-w-xl">
                            দালাল এবং মধ্যস্বত্বভোগী ছাড়াই সরাসরি শ্রমিকের সাথে কথা বলুন। রেটিং, কাজের অভিজ্ঞতা এবং এনআইডি ভেরিফিকেশন দেখে নিরাপদে কাজ দিন।
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button onClick={() => document.getElementById('directory').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-black text-lg hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-teal-500/25 active:scale-95 flex items-center justify-center gap-2">
                                <Search size={20} />
                                শ্রমিক খুঁজুন
                            </button>
                            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 text-white font-black text-lg hover:bg-white/20 transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-2">
                                <PenTool size={20} />
                                শ্রমিক হিসেবে যুক্ত হোন
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md">
                            <Users size={32} className="text-amber-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={350} suffix="+" /></div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">রেজিস্টার্ড শ্রমিক</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md mt-6">
                            <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={1200} suffix="+" /></div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">সম্পন্ন প্রজেক্ট</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. How it Works */}
            <div className="mb-20">
                <div className="text-center mb-12">
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-4">কীভাবে কাজ করে?</h3>
                    <p className="text-slate-500 font-medium max-w-md mx-auto">খুব সহজেই মাত্র ৩টি ধাপে আপনার প্রয়োজনীয় কাজের জন্য সঠিক শ্রমিক নির্বাচন করুন।</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm text-center relative hover:-translate-y-2 transition-transform">
                        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-6">
                            <Search size={28} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-3">১. শ্রমিক খুঁজুন</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">ক্যাটাগরি বা আপনার নিজস্ব এলাকা অনুযায়ী ফিল্টার করে সঠিক মিস্ত্রি নির্বাচন করুন।</p>
                        <div className="absolute top-8 right-8 text-6xl font-black text-slate-50 opacity-50 pointer-events-none">১</div>
                    </div>
                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm text-center relative hover:-translate-y-2 transition-transform">
                        <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck size={28} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-3">২. অভিজ্ঞতা যাচাই করুন</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">শ্রমিকের প্রোফাইল থেকে তার কাজের রেটিং, অভিজ্ঞতা ও রিভিউ চেক করে নিশ্চিত হোন।</p>
                        <div className="absolute top-8 right-8 text-6xl font-black text-slate-50 opacity-50 pointer-events-none">২</div>
                    </div>
                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm text-center relative hover:-translate-y-2 transition-transform">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-6">
                            <Phone size={28} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-3">৩. সরাসরি কল করুন</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">"কল করুন" বাটনে ক্লিক করে সরাসরি শ্রমিকের সাথে দরদাম ও কাজের কথা বলুন।</p>
                        <div className="absolute top-8 right-8 text-6xl font-black text-slate-50 opacity-50 pointer-events-none">৩</div>
                    </div>
                </div>
            </div>

            {/* 3. Directory List */}
            <div id="directory" className="mb-8 pt-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2">ভেরিফাইড শ্রমিক তালিকা</h2>
                        <p className="text-sm font-medium text-slate-500">আপনার প্রয়োজন অনুযায়ী নিচে থেকে ক্যাটাগরি বাছাই লিস্ট দেখুন</p>
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
                                ? 'bg-slate-800 text-white shadow-md' 
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-700 hover:shadow-sm'
                            }`}
                        >
                            {cat === 'all' ? 'সব পেশা' : cat}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredList.map((person) => (
                            <motion.div
                                key={person.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:border-teal-200 transition-all flex flex-col group"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="relative">
                                            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm group-hover:scale-105 transition-transform duration-500">
                                                <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-full border-4 border-white shadow-sm ${person.available ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                                                {person.available ? <CheckCircle2 size={12} className="text-white" /> : <XCircle size={12} className="text-white" />}
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            {person.verified && (
                                                <div className="inline-flex items-center gap-1 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 mb-2">
                                                    <ShieldCheck size={12} className="text-sky-500" />
                                                    <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest">এনআইডি ভেরিফাইড</span>
                                                </div>
                                            )}
                                            <div className="inline-flex items-center justify-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg">
                                                <Star size={14} className="text-amber-500 fill-amber-500 mt-[1px]" />
                                                <span className="text-sm font-black text-amber-700">{person.rating}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1">{toBnNum(person.reviews)} টি রিভিউ</p>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h3 className="text-xl font-black text-slate-800 leading-none mb-1.5 group-hover:text-teal-600 transition-colors">{person.name}</h3>
                                        <p className="text-sm font-black text-teal-600 mb-3">{person.profession}</p>
                                        <p className="text-xs font-medium text-slate-500 leading-relaxed line-clamp-2 italic mb-4">
                                            "{person.bio}"
                                        </p>
                                        
                                        <div className="flex flex-wrap gap-1.5">
                                            {person.expertise.map(skill => (
                                                <span key={skill} className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 text-[11px] font-bold border border-slate-100">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Rich Data Strip */}
                                <div className="grid grid-cols-2 gap-px bg-slate-100 border-y border-slate-100 mb-2">
                                    <div className="bg-white p-3 text-center">
                                        <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                                            <Briefcase size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">অভিজ্ঞতা</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-700">{toBnNum(person.experienceYears)} বছর</p>
                                    </div>
                                    <div className="bg-white p-3 text-center">
                                        <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                                            <CheckCircle2 size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">কাজ করেছেন</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-700">{toBnNum(person.completedJobs)}+ বার</p>
                                    </div>
                                </div>

                                <div className="px-6 pb-6 mt-auto">
                                    <div className="space-y-3 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-slate-400 shrink-0" />
                                                <span className="truncate">{person.location}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <DollarSign size={16} className="text-teal-500 shrink-0" />
                                                <span>{person.dailyRate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            disabled={!person.available}
                                            className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all shadow-sm ${
                                                person.available 
                                                ? 'bg-slate-900 hover:bg-teal-600 text-white active:scale-95 shadow-slate-900/20' 
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                            onClick={() => window.location.href = `tel:${person.phone}`}
                                        >
                                            <Phone size={18} />
                                            {person.available ? 'সরাসরি কল দিন' : 'বর্তমানে ব্যস্ত আছেন'}
                                        </button>
                                        {person.available && (
                                            <button className="w-[56px] h-[56px] rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 hover:bg-teal-500 hover:text-white transition-colors shrink-0">
                                                <ChevronRight size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
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

            {/* 4. Trust Banner Footer Action */}
            <div className="mt-16 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[40px] p-8 md:p-12 border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <ShieldAlert size={200} />
                </div>
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-blue-500 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-500/30">
                        <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-3">দালাল বা মধ্যস্বত্বভোগী থেকে বাঁচুন!</h3>
                    <p className="text-slate-600 font-medium max-w-lg leading-relaxed">
                        ডিজিგრამে লিস্টেড যেকোনো পেশাজীবীকে সরাসরি ফোন দিন। কোনো হিডেন চার্জ বা দালালের ফি নেই। প্রতিটি প্রোফাইলের এনআইডি এবং কাজের ইতিহাস ব্যাকএন্ড থেকে ভেরিফাই করা হয়।
                    </p>
                </div>
                <div className="shrink-0 w-full md:w-auto relative z-10">
                    <button className="w-full text-center px-8 py-5 rounded-2xl bg-white text-blue-600 font-black text-lg shadow-lg hover:shadow-xl transition-all border border-blue-100">
                        আমাদের পলিসি পড়ুন
                    </button>
                </div>
            </div>

        </div>
    );
}

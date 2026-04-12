'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Search, CheckCircle2, MapPin, Users, Target, CalendarDays, ChevronRight, HandHeart, Sparkles, MessageCircle, ArrowRight, ShieldCheck, FileText, PieChart, Activity, BadgeCheck } from 'lucide-react';
import { getDonations } from '@/lib/content/donationData';

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

export default function DonationView() {
    const campaigns = getDonations();
    const [showLedger, setShowLedger] = useState(false);

    const bnMap = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    const toBnNum = (num) => String(num).replace(/[0-9]/g, match => bnMap[match]);

    // Mock Public Ledger Data
    const publicLedger = [
        { id: 1, date: '১০ এপ্রিল ২০২৬', amount: '৫০০ ৳', donor: 'আলী আশরাফ', project: 'রোহান এর চিকিৎসা', method: 'বিকাশ', status: 'ভেরিফাইড' },
        { id: 2, date: '০৯ এপ্রিল ২০২৬', amount: '১০০০ ৳', donor: 'বেনামী', project: 'স্কুলের নতুন ব্যাঞ্চ', method: 'নগদ', status: 'ভেরিফাইড' },
        { id: 3, date: '০৮ এপ্রিল ২০২৬', amount: '২০০ ৳', donor: 'জাহিদ হোসেন', project: 'রোহান এর চিকিৎসা', method: 'বিকাশ', status: 'ভেরিফাইড' },
        { id: 4, date: '০৭ এপ্রিল ২০২৬', amount: '৫০০০ ৳', donor: 'সফটওয়্যার টিম', project: 'টিউবওয়েল স্থাপন', method: 'ব্যাংক', status: 'ভেরিফাইড' },
    ];

    return (
        <div className="pb-16 pt-4">
            {/* 1. Hero Section - Trust First */}
            <div className="relative rounded-[40px] bg-emerald-950 border border-emerald-900 overflow-hidden px-6 py-16 md:p-20 mb-16 shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/20 blur-[150px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-center md:text-left max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md">
                            <BadgeCheck size={14} className="text-emerald-400" /> ১০০% স্বচ্ছ ডোনেশন প্ল্যাটফর্ম
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.2] mb-6">
                            আপনার দান, <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">সঠিক হাতে পৌঁছাবেই</span>
                        </h2>
                        <p className="text-lg text-emerald-100/80 font-medium mb-8 leading-relaxed max-w-xl">
                            দিজিগ্রাম 'স্বচ্ছ দান' উইং-এর মাধ্যমে সংগৃহীত প্রতিটি টাকার হিসাব পাবলিক লেজারে উন্মুক্ত রাখা হয়। মানুষের বিপদে পাশে দাঁড়ান কোনো চিন্তা ছাড়াই।
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button onClick={() => document.getElementById('campaigns').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-10 py-5 rounded-[20px] bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-lg hover:from-emerald-400 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2">
                                <HandHeart size={20} />
                                ফান্ডগুলো দেখুন
                            </button>
                            <button onClick={() => setShowLedger(!showLedger)} className="w-full sm:w-auto px-8 py-5 rounded-[20px] bg-white/10 text-white font-black text-lg hover:bg-white/20 transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-2">
                                <FileText size={20} />
                                পাবলিক লেজার
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md hover:bg-white/10 transition-colors">
                            <Users size={32} className="text-emerald-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={850} suffix="+" /></div>
                            <p className="text-[10px] font-black text-emerald-200/50 uppercase tracking-widest">দাতা সদস্য</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md hover:bg-white/10 transition-colors mt-6">
                            <Activity size={32} className="text-teal-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={12} suffix=" লাখ+" /></div>
                            <p className="text-[10px] font-black text-emerald-200/50 uppercase tracking-widest">সংগৃহীত অনুদান</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Transparency Ledger (Toggleable) */}
            <AnimatePresence>
                {showLedger && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-16 overflow-hidden"
                    >
                        <div className="bg-white rounded-[40px] border-4 border-emerald-100 p-8 shadow-2xl">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-emerald-900">রিয়েল-টাইম পাবলিক লেজার</h3>
                                    <p className="text-sm font-bold text-slate-500">প্রতিটি ডোনেশনের লাইভ লগ (স্বচ্ছতা নিশ্চিত করতে)</p>
                                </div>
                                <button onClick={() => setShowLedger(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors font-black text-slate-400">বন্ধ করুন</button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">তারিখ</th>
                                            <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">দাতার নাম</th>
                                            <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">পরিমাণ</th>
                                            <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">প্রজেক্ট</th>
                                            <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">স্ট্যাটাস</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {publicLedger.map((log) => (
                                            <tr key={log.id} className="hover:bg-emerald-50/50 transition-colors">
                                                <td className="py-5 px-4 text-xs font-bold text-slate-500">{log.date}</td>
                                                <td className="py-5 px-4 text-sm font-black text-slate-800">{log.donor}</td>
                                                <td className="py-5 px-4 text-base font-black text-emerald-600">{log.amount}</td>
                                                <td className="py-5 px-4 text-sm font-bold text-slate-600">{log.project}</td>
                                                <td className="py-5 px-4 text-right">
                                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                                                        {log.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                                <PieChart size={24} className="text-emerald-500 shrink-0" />
                                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                    * আমরা কোনো প্রকার অ্যাডমিন ফি গ্রহণ করি না। আপনার প্রদানকৃত পুরো অর্থই সরাসরি সুবিধাভোগীর কাছে পৌঁছে দেওয়া হয়।
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. Main Campaigns Grid */}
            <div id="campaigns">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 pb-8 border-b border-slate-100">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800">চলমান ফান্ডিং ও উদ্যোগ</h2>
                        <p className="text-sm font-medium text-slate-500">নিচে থেকে যেকোনো একটি উদ্যোগে আপনার সাধ্যমতো অংশ নিন</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <AnimatePresence mode="popLayout">
                        {campaigns.map((camp) => {
                            const progress = Math.min(100, Math.round((camp.raisedAmount / camp.targetAmount) * 100));
                            const isComplete = camp.raisedAmount >= camp.targetAmount;

                            return (
                                <motion.div
                                    key={camp.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-300 group flex flex-col"
                                >
                                    <div className="relative h-64 w-full bg-slate-100 overflow-hidden shrink-0">
                                        <img src={camp.image} alt={camp.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent"></div>
                                        
                                        <div className="absolute top-6 left-6 flex gap-2">
                                            <span className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-lg border border-white/20">
                                                {camp.category}
                                            </span>
                                            {camp.verified && (
                                                <span className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg border border-emerald-400">
                                                    ভেরিফাইড উদ্যোগ
                                                </span>
                                            )}
                                        </div>

                                        <div className="absolute bottom-6 left-6 right-6">
                                            <h3 className="text-2xl font-black text-white leading-tight mb-2 group-hover:text-emerald-400 transition-colors">{camp.title}</h3>
                                            <div className="flex items-center gap-3 text-xs font-bold text-white/70">
                                                <span className="flex items-center gap-1.5"><MapPin size={14} /> {camp.location}</span>
                                                <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                                                <span className="flex items-center gap-1.5"><CalendarDays size={14} /> {camp.deadline}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-10 flex flex-col flex-1">
                                        <p className="text-base font-medium text-slate-500 leading-relaxed mb-8 line-clamp-3">
                                            {camp.description}
                                        </p>

                                        {/* Financial Progress */}
                                        <div className="mb-8 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                            <div className="flex justify-between items-end mb-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">উত্তোলিত অর্থ</p>
                                                    <p className="text-3xl font-black text-emerald-600 tracking-tight">{toBnNum(camp.raisedAmount)} ৳</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">লক্ষ্যমাত্রা</p>
                                                    <p className="text-lg font-black text-slate-400">{toBnNum(camp.targetAmount)} ৳</p>
                                                </div>
                                            </div>
                                            
                                            <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner relative mb-3">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${progress}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 1, ease: 'easeOut' }}
                                                    className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500`}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <span>{toBnNum(progress)}% সম্পূর্ণ</span>
                                                <span className="flex items-center gap-1.5"><Users size={12} /> {toBnNum(camp.donorsCount)} জন দাতা</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto grid grid-cols-5 gap-3">
                                            <button 
                                                className={`col-span-4 py-5 rounded-[24px] font-black text-base flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 ${
                                                    isComplete 
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                                                    : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-slate-900/20'
                                                }`}
                                            >
                                                <HandHeart size={20} />
                                                {isComplete ? 'ফান্ডিং সম্পন্ন হয়েছে' : 'অনুদানে অংশ নিন'}
                                            </button>
                                            <button className="col-span-1 py-5 rounded-[24px] bg-slate-50 hover:bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-100 transition-colors">
                                                <MessageCircle size={24} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* 4. Support Banner */}
            <div className="mt-16 bg-white rounded-[40px] p-8 md:p-14 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden group">
                 <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-emerald-50 rounded-full blur-[80px]"></div>
                 <div className="relative z-10 w-full text-center md:text-left">
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-4">স্বচ্ছ দান-এ যুক্ত হতে চান?</h3>
                    <p className="text-slate-500 font-bold max-w-xl text-base">
                        আপনার পরিচিত কোনো বিশ্বস্ত উদ্যোগ বা মকসুদকে স্বচ্ছ দান-এর আওতায় আনতে আমাদের সাথে যোগাযোগ করুন। সঠিক যাচাইয়ের পর আমরা তা উন্মুক্ত করবো।
                    </p>
                 </div>
                 <div className="shrink-0 w-full md:w-auto relative z-10">
                    <button className="w-full px-10 py-5 rounded-[24px] bg-emerald-600 text-white font-black text-lg shadow-xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2">
                        উদ্যোগ সাবমিট করুন <ArrowRight size={20} />
                    </button>
                 </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Search, CheckCircle2, MapPin, Users, Target, CalendarDays, ChevronRight, HandHeart, Sparkles, MessageCircle, ArrowRight, ShieldCheck } from 'lucide-react';
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
    const [filter, setFilter] = useState('all'); 

    const bnMap = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    const toBnNum = (num) => String(num).replace(/[0-9]/g, match => bnMap[match]);

    return (
        <div className="pb-16 pt-4">
            {/* 1. Hero Section */}
            <div className="relative rounded-[40px] bg-gradient-to-br from-teal-900 to-sky-950 border border-teal-800 overflow-hidden px-6 py-16 md:p-20 mb-16 shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-center md:text-left max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-black uppercase tracking-widest mb-6">
                            <Sparkles size={14} /> Trust-First মডেল
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.2] mb-6">
                            স্বচ্ছতার সাথে <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">দান করুন</span> ও সমাজের পাশে দাঁড়ান
                        </h2>
                        <p className="text-lg text-teal-100/80 font-medium mb-8 leading-relaxed max-w-xl">
                            এখানকার প্রতিটি ফান্ড সম্পূর্ণ ১০০% স্বচ্ছতার সাথে ট্র্যাকিং করা হয়। আপনার টাকা কোথায় এবং কীভাবে খরচ হচ্ছে তার লাইভ আপডেট রসিদসহ দেখুন।
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button onClick={() => document.getElementById('campaigns').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-black text-lg hover:from-teal-400 hover:to-emerald-500 transition-all shadow-lg shadow-teal-500/25 active:scale-95 flex items-center justify-center gap-2">
                                <Heart size={20} className="fill-current" />
                                অনুদানে অংশ নিন
                            </button>
                            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 text-white font-black text-lg hover:bg-white/20 transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-2">
                                নতুন ফান্ড চালু করুন
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
                        <div className="bg-black/20 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md">
                            <Users size={32} className="text-teal-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={700} suffix="+" /></div>
                            <p className="text-[10px] font-black text-teal-200/50 uppercase tracking-widest">মোট ডোনার</p>
                        </div>
                        <div className="bg-black/20 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md mt-6">
                            <ShieldCheck size={32} className="text-emerald-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={8} suffix=".৫ লাখ" /></div>
                            <p className="text-[10px] font-black text-emerald-200/50 uppercase tracking-widest">ফান্ড রেসড</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Trust Guarantee */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-[40px] p-8 md:p-12 mb-16 text-center shadow-sm relative overflow-hidden">
                <div className="absolute -top-16 -right-16 opacity-5"><ShieldCheck size={200} /></div>
                <div className="w-20 h-20 bg-white rounded-3xl shadow-md text-emerald-600 flex items-center justify-center mx-auto mb-8 relative z-10 border-2 border-emerald-100 rotate-12 hover:rotate-0 transition-transform">
                    <CheckCircle2 size={40} />
                </div>
                <div className="relative z-10 max-w-3xl mx-auto">
                    <h3 className="text-2xl font-black text-emerald-900 mb-4">শতভাগ স্বচ্ছতা কীভাবে নিশ্চিত হয়?</h3>
                    <p className="text-emerald-800/80 font-bold leading-relaxed mb-8">
                        এই প্ল্যাটফর্মে ফান্ড রেইজ করতে হলে এডমিনের সরাসরি ভেরিফিকেশন প্রযোজ্য। সংগৃহীত অর্থ সরাসরি সুবিধাভোগীর ব্যাংক বা বিকাশ অ্যাকাউন্টে যায়। কাজ শেষে এর রসিদ বা ভাউচার "পাবলিক লেজারে" আপলোড করা হয়।
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <span className="bg-white text-emerald-700 px-4 py-2 rounded-full text-xs font-black shadow-sm border border-emerald-100"># কোনো লুকানো ফি নেই</span>
                        <span className="bg-white text-emerald-700 px-4 py-2 rounded-full text-xs font-black shadow-sm border border-emerald-100"># পাবলিক লেজার</span>
                        <span className="bg-white text-emerald-700 px-4 py-2 rounded-full text-xs font-black shadow-sm border border-emerald-100"># শতভাগ ভেরিফাইড কেস</span>
                    </div>
                </div>
            </div>

            {/* 3. Directory List */}
            <div id="campaigns" className="mb-8 pt-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2">চলমান ফান্ডিং ও উদ্যোগ</h2>
                        <p className="text-sm font-medium text-slate-500">যে ক্যাম্পেইনগুলোতে আপনার সাহায্য সবচেয়ে বেশি প্রয়োজন</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <AnimatePresence mode="popLayout">
                        {campaigns.map((camp) => {
                            const progress = Math.min(100, Math.round((camp.raisedAmount / camp.targetAmount) * 100));
                            const isComplete = camp.raisedAmount >= camp.targetAmount;

                            return (
                                <motion.div
                                    key={camp.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:border-teal-200 transition-all duration-300 group flex flex-col"
                                >
                                    <div className="relative h-64 w-full bg-slate-100 overflow-hidden shrink-0">
                                        <img src={camp.image} alt={camp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
                                        
                                        <div className="absolute top-5 left-5">
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md border ${
                                                isComplete ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/90 text-slate-900 backdrop-blur-md border-white/20'
                                            }`}>
                                                {isComplete ? 'ফান্ডিং সম্পন্ন' : camp.category}
                                            </span>
                                        </div>
                                        
                                        {camp.verified && !isComplete && (
                                            <div className="absolute top-5 right-5 bg-teal-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-md border border-teal-400/50">
                                                <CheckCircle2 size={14} /> এডমিন ভেরিফাইড
                                            </div>
                                        )}

                                        <div className="absolute bottom-5 left-5 right-5">
                                            <h3 className="text-2xl font-black text-white leading-snug mb-2">{camp.title}</h3>
                                            <div className="flex items-center gap-3 text-[11px] font-bold text-white/80">
                                                <span className="flex items-center gap-1.5"><MapPin size={14} /> {camp.location}</span>
                                                <span className="w-1 h-1 rounded-full bg-white/50"></span>
                                                <span className="flex items-center gap-1.5"><CalendarDays size={14} /> মেয়াদ: {camp.deadline}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 flex flex-col flex-1">
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-3 mb-6">
                                            {camp.description}
                                        </p>

                                        {/* Detailed Impact Banner */}
                                        <div className="bg-amber-50 rounded-[24px] p-5 mb-6 border border-amber-100/50 flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-500">
                                                <Target size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">ইমপ্যাক্ট বা উদ্দেশ্য</p>
                                                <p className="text-xs font-bold text-amber-800 leading-relaxed">{camp.impactStatement}</p>
                                            </div>
                                        </div>

                                        {/* Glowing Progress */}
                                        <div className="mb-8">
                                            <div className="flex justify-between items-end mb-3">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-3xl font-black text-teal-600 tracking-tight">{toBnNum(camp.raisedAmount)} ৳</span>
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">উত্তোলিত</span>
                                                </div>
                                                <div className="text-xs font-black text-slate-500 text-right bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                    লক্ষ্য: {toBnNum(camp.targetAmount)} ৳
                                                </div>
                                            </div>
                                            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${progress}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 1.5, ease: 'easeOut' }}
                                                    className={`absolute top-0 left-0 h-full rounded-full ${isComplete ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-teal-400 to-teal-500'}`}
                                                >
                                                    <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }}></div>
                                                </motion.div>
                                            </div>
                                            <div className="flex justify-between items-center mt-3 text-[11px] font-black text-slate-400">
                                                <div className="flex items-center gap-1.5"><Users size={14} className="text-slate-400" /> {toBnNum(camp.donorsCount)} জন দাতা</div>
                                                <span>{toBnNum(progress)}% সম্পূর্ণ</span>
                                            </div>
                                        </div>

                                        {/* Action area */}
                                        <div className="mt-auto flex flex-col sm:flex-row gap-3">
                                            <button 
                                                disabled={isComplete}
                                                className={`flex-1 py-4 px-6 rounded-2xl flex items-center justify-center gap-2 font-black text-base transition-all shadow-sm ${
                                                    isComplete 
                                                    ? 'bg-emerald-50 text-emerald-600 cursor-not-allowed border border-emerald-100' 
                                                    : 'bg-slate-900 hover:bg-teal-600 text-white active:scale-95 shadow-slate-900/25'
                                                }`}
                                            >
                                                <HandHeart size={20} />
                                                {isComplete ? 'উদ্যোগ সফল হয়েছে' : 'অনুদানে অংশ নিন'}
                                            </button>
                                            {!isComplete && (
                                                <button className="sm:w-16 py-4 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 border border-slate-100 transition-colors shrink-0">
                                                    <MessageCircle size={24} />
                                                </button>
                                            )}
                                        </div>
                                        
                                        {!isComplete && (
                                            <p className="text-center text-[10px] font-bold text-slate-400 mt-4">
                                                সর্বনিম্ন দান: {toBnNum(camp.minDonation)}৳ (বিকাশ/নগদ প্রযোজ্য)
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
            
            {/* 4. Footer CTA */}
            <div className="mt-16 bg-white rounded-[40px] p-8 md:p-12 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-xl shadow-slate-200/50">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-100 rounded-full blur-[80px]"></div>
                
                <div className="relative z-10 w-full">
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-3 text-center md:text-left">আপনার কি কোনো প্রজেক্ট আছে?</h3>
                    <p className="text-slate-600 font-medium max-w-lg leading-relaxed text-center md:text-left">
                        মসজিদ, মাদ্রাসা, চিকিৎসা বা কোনো এতিমখানার জন্য ফান্ড রেইজ করতে চাইলে আমাদের সাথে যোগাযোগ করুন। আমরা সম্পূর্ণ ভেরিফাই করে ফান্ড ওপেন করে দিব।
                    </p>
                </div>
                <div className="shrink-0 w-full md:w-auto relative z-10">
                    <button className="w-full text-center px-8 py-5 rounded-[20px] bg-teal-500 text-white font-black text-lg shadow-lg hover:shadow-xl hover:bg-teal-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                        আবেদন করুন <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

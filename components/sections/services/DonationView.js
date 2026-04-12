'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Search, CheckCircle2, MapPin, Users, Target, CalendarDays, ChevronRight, HandHeart, Sparkles, MessageCircle } from 'lucide-react';
import { getDonations } from '@/lib/content/donationData';

export default function DonationView() {
    const campaigns = getDonations();
    const [filter, setFilter] = useState('all'); 

    const bnMap = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    const toBnNum = (num) => String(num).replace(/[0-9]/g, match => bnMap[match]);

    return (
        <div className="py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">স্বচ্ছ দান ফান্ড (Trust-First)</h2>
                    <p className="text-sm font-medium text-slate-500">আপনার প্রতিটি কন্ট্রিবিউশন এখানে ১০০% স্বচ্ছতার সাথে ট্র্যাকিং করা হবে</p>
                </div>
                <button className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-slate-900 text-white font-black text-sm hover:bg-teal-600 transition-all shadow-lg active:scale-95">
                    <Heart size={18} className="fill-current" />
                    নতুন ফান্ড চালু করুন
                </button>
            </div>

            {/* Trust Banner with High Detail */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-[32px] p-6 lg:p-8 mb-10 border border-teal-100/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                    <ShieldCheckIcon className="w-64 h-64 transform rotate-12" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-start sm:items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-teal-500/30 border-4 border-white">
                            <CheckCircle2 size={32} />
                        </div>
                        <div>
                            <h4 className="text-xl text-teal-900 font-black mb-1.5 flex items-center gap-2">
                                শতভাগ ফান্ড গ্যারান্টি <Sparkles size={16} className="text-amber-500" />
                            </h4>
                            <p className="text-sm font-bold text-teal-700 leading-relaxed max-w-2xl">
                                সংগ্রহীত সমস্ত ফান্ড সরাসরি সুবিধাভোগীর ব্যাংক একাউন্টে জমা হয়। সম্পূর্ণ কাজের ভাউচার বা রসিদ অ্যাডমিন প্যানেলে আপলোড না হওয়া পর্যন্ত ডোনাররা লাইভ আপডেট পাবেন।
                            </p>
                        </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-4 bg-white/60 p-4 rounded-2xl backdrop-blur-sm border border-white">
                        <div className="text-center px-4 border-r border-teal-200">
                            <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">সফল প্রজেক্ট</p>
                            <p className="text-2xl font-black text-teal-800">১২+</p>
                        </div>
                        <div className="text-center px-4">
                            <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">মোট অনুদান</p>
                            <p className="text-2xl font-black text-teal-800">৮.৫ লাখ+</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
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
                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md ${
                                            isComplete ? 'bg-emerald-500 text-white' : 'bg-white/95 text-slate-800 backdrop-blur-md'
                                        }`}>
                                            {isComplete ? 'ফান্ডিং সম্পন্ন' : camp.category}
                                        </span>
                                    </div>
                                    
                                    {camp.verified && !isComplete && (
                                        <div className="absolute top-5 right-5 bg-teal-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-md">
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
                                    <div className="bg-amber-50 rounded-2xl p-4 mb-6 border border-amber-100/50 flex items-start gap-3">
                                        <Target size={18} className="text-amber-500 shrink-0 mt-0.5" />
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
                                                : 'bg-teal-500 hover:bg-teal-600 text-white active:scale-95 shadow-teal-500/25'
                                            }`}
                                        >
                                            <HandHeart size={20} />
                                            {isComplete ? 'উদ্যোগ সফল হয়েছে' : 'অনুদানে অংশ নিন'}
                                        </button>
                                        {!isComplete && (
                                            <button className="sm:w-[72px] py-4 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 border border-slate-100 transition-colors shrink-0">
                                                <MessageCircle size={20} />
                                            </button>
                                        )}
                                    </div>
                                    
                                    {!isComplete && (
                                        <p className="text-center text-[10px] font-bold text-slate-400 mt-4">
                                            সর্বনিম্ন দান: {toBnNum(camp.minDonation)}৳ (যেকোনো মাধ্যমে)
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Icon helper
function ShieldCheckIcon(props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
            <path d="m9 12 2 2 4-4"/>
        </svg>
    )
}

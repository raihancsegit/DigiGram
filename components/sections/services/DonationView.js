'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Search, CheckCircle2, MapPin, Users, Target, CalendarDays, ChevronRight, HandHeart } from 'lucide-react';
import { getDonations } from '@/lib/content/donationData';

export default function DonationView() {
    const campaigns = getDonations();
    const [filter, setFilter] = useState('all'); 

    const bnMap = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    const toBnNum = (num) => num.toString().replace(/[0-9]/g, match => bnMap[match]);

    return (
        <div className="py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">স্বচ্ছ দান ফান্ড (Trust-First)</h2>
                    <p className="text-sm font-medium text-slate-500">আপনার প্রতিটি কন্ট্রিবিউশন এখানে স্বচ্ছভাবে ট্র্যাকিং করা হবে</p>
                </div>
                <button className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-slate-900 text-white font-black text-sm hover:bg-teal-600 transition-all shadow-lg active:scale-95">
                    <Heart size={18} className="fill-current" />
                    নতুন ফান্ড চালু করুন
                </button>
            </div>

            {/* Trust Banner */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-5 mb-8 border border-teal-100 flex items-start sm:items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-teal-500/20">
                    <CheckCircle2 size={20} />
                </div>
                <div>
                    <h4 className="text-teal-800 font-black mb-1">১০০% স্বচ্ছতা গ্যারান্টেড</h4>
                    <p className="text-[13px] font-bold text-teal-700 opacity-80 leading-snug">সকল তথ্য ব্লকচেইন মডেলে সংরক্ষিত। অ্যাডমিন প্যানেল থেকে খরচের রসিদ আপলোড না করা পর্যন্ত ফান্ড রিলিজ হয় না।</p>
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
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all group flex flex-col sm:flex-row"
                            >
                                <div className="sm:w-2/5 relative h-48 sm:h-auto bg-slate-100 overflow-hidden shrink-0">
                                    <img src={camp.image} alt={camp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                            isComplete ? 'bg-emerald-500 text-white' : 'bg-white/95 text-slate-800 backdrop-blur-md'
                                        }`}>
                                            {isComplete ? 'ফান্ডিং সম্পন্ন' : camp.category}
                                        </span>
                                    </div>
                                    {camp.verified && !isComplete && (
                                        <div className="absolute bottom-4 left-4 bg-teal-500/90 backdrop-blur-md text-white px-2 py-1 rounded-md text-[10px] font-black flex items-center gap-1 shadow-sm">
                                            <CheckCircle2 size={12} /> ভেরিফাইড
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="text-xl font-black text-slate-800 leading-snug mb-2 line-clamp-2">{camp.title}</h3>
                                    
                                    <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500">
                                        <MapPin size={14} className="text-slate-400" />
                                        <span className="truncate">{camp.location}</span>
                                    </div>

                                    {/* Progress */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-end mb-2">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-black text-teal-600">{toBnNum(camp.raisedAmount)} ৳</span>
                                                <span className="text-[10px] font-black text-slate-400">উত্তোলিত</span>
                                            </div>
                                            <div className="text-[10px] font-black text-slate-400 text-right">
                                                লক্ষ্য: {toBnNum(camp.targetAmount)} ৳
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${progress}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1, ease: 'easeOut' }}
                                                className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-teal-500'}`}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-6 border-b border-slate-50 pb-4">
                                        <div className="flex items-center gap-1.5"><Users size={14} className="text-slate-400" /> {toBnNum(camp.donorsCount)} দাতা</div>
                                        <div className="flex items-center gap-1.5"><CalendarDays size={14} className="text-slate-400" /> মেয়াদ: {camp.deadline}</div>
                                    </div>

                                    {/* Action button */}
                                    <button 
                                        disabled={isComplete}
                                        className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all shadow-sm mt-auto ${
                                            isComplete 
                                            ? 'bg-emerald-50 text-emerald-600 cursor-not-allowed border border-emerald-100' 
                                            : 'bg-teal-500 hover:bg-teal-600 text-white active:scale-95 shadow-teal-500/20'
                                        }`}
                                    >
                                        <HandHeart size={18} />
                                        {isComplete ? 'লক্ষ্যমাত্রা অর্জিত হয়েছে' : 'অনুদানে অংশ নিন'}
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, Phone, Filter, AlertCircle, CheckCircle2, Image as ImageIcon, PlusCircle, Gift, ShieldAlert, Crosshair, Users, Target, SearchIcon, Award, UserCheck, Heart, AlertTriangle, ArrowRight } from 'lucide-react';
import { getLostFoundPosts } from '@/lib/content/lostFoundData';

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

export default function LostFoundView() {
    const posts = getLostFoundPosts();
    const [filter, setFilter] = useState('all');

    const filteredPosts = posts.filter(post => {
        if (filter === 'all') return true;
        return post.type === filter;
    });

    return (
        <div className="pb-16 pt-4">
            {/* 1. Hero Section */}
            <div className="relative rounded-[40px] bg-indigo-950 border border-indigo-900 overflow-hidden px-6 py-16 md:p-20 mb-16 shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-center md:text-left max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-xs font-black uppercase tracking-widest mb-6 px-4 py-2 backdrop-blur-md">
                            <Target size={14} className="text-rose-400" /> কমিউনিটি হারানো-প্রাপ্তি কেন্দ্র
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.2] mb-6">
                            প্রিয় কিছু হারিয়েছেন? <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">কমিউনিটিকে জানান</span>
                        </h2>
                        <p className="text-lg text-indigo-200/80 font-medium mb-8 leading-relaxed max-w-xl">
                            আপনার হারানো দলিল, গবাদি পশু বা মূল্যবান ইলেকট্রনিক্স পণ্য খুঁজে পেতে এলাকার মানুষের সাহায্য নিন। অথবা কেউ কিছু খুঁজে পেয়ে থাকলে মালিককে ফেরত দিন।
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button className="w-full sm:w-auto px-8 py-5 rounded-[20px] bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black text-lg hover:from-rose-400 transition-all shadow-lg shadow-rose-500/25 active:scale-95 flex items-center justify-center gap-2">
                                <PlusCircle size={20} />
                                বিজ্ঞতি দিন
                            </button>
                            <button className="w-full sm:w-auto px-8 py-5 rounded-[20px] bg-white/10 text-white font-black text-lg hover:bg-white/20 transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-2">
                                <CheckCircle2 size={20} />
                                প্রাপ্তি সংবাদ দিন
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md hover:bg-white/10 transition-colors">
                            <Heart size={32} className="text-emerald-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={150} suffix="+" /></div>
                            <p className="text-[10px] font-black text-indigo-200/50 uppercase tracking-widest">খুঁজে পাওয়া পণ্য</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md hover:bg-white/10 transition-colors mt-6">
                            <SearchIcon size={32} className="text-rose-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={25} suffix="+" /></div>
                            <p className="text-[10px] font-black text-indigo-200/50 uppercase tracking-widest">চলমান বিজ্ঞপ্তি</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Safety First Alert */}
            <div className="bg-rose-50 rounded-[32px] border border-rose-100 p-8 mb-16 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12">
                    <ShieldAlert size={150} />
                </div>
                <div className="w-20 h-20 rounded-[24px] bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                    <AlertTriangle size={40} className="animate-pulse" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-rose-900 mb-2">প্রতারক থেকে সাবধান!</h3>
                    <p className="text-base font-bold text-rose-800/70 leading-relaxed max-w-4xl">
                        কেউ আপনার হারানো বস্তু পাওয়ার কথা বলে যদি অগ্রিম টাকা বা বখশিস দাবি করে, তবে কোনোভাবেই টাকা পাঠাবেন না। 
                        বিপরীত পক্ষকে উপযুক্ত প্রমাণ (যেমন: ছবির প্রুফ বা বিশেষ কোনো চিহ্ন) দেখাতে বলুন এবং সামনাসামনি গিয়ে জিনিস বুঝে পাওয়ার পর কেবল কৃতজ্ঞতাস্বরূপ কিছু দেবেন।
                    </p>
                </div>
            </div>

            {/* 3. Main Dashboard */}
            <div id="directory">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 pb-8 border-b border-slate-100">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800">নোটিশবোর্ড</h2>
                        <p className="text-sm font-medium text-slate-500">আপনার হারানো জিনিসটি লিস্টে আছে কি না দেখুন</p>
                    </div>
                    
                    <div className="flex bg-slate-100 p-2 rounded-2xl w-full md:w-auto">
                        {['all', 'lost', 'found'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={`flex-1 md:w-32 py-3 rounded-xl text-xs font-black transition-all ${
                                    filter === t ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {t === 'all' ? 'সবগুলো' : t === 'lost' ? 'হারানো' : 'প্রাপ্তি'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredPosts.map((post, idx) => (
                            <motion.div
                                key={post.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`bg-white rounded-[32px] border-2 overflow-hidden hover:shadow-2xl transition-all group flex flex-col ${
                                    post.type === 'lost' ? 'border-amber-100 hover:border-amber-200' : 'border-emerald-100 hover:border-emerald-200'
                                }`}
                            >
                                <div className="relative h-64 bg-slate-100 overflow-hidden">
                                     <img src={post.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={post.title} />
                                     <div className={`absolute top-4 left-4 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${
                                         post.type === 'lost' ? 'bg-orange-500' : 'bg-emerald-500'
                                     }`}>
                                         {post.type === 'lost' ? 'হারিয়ে গেছে' : 'কুড়িয়ে পাওয়া'}
                                     </div>
                                </div>
                                
                                <div className="p-8 flex flex-col flex-1">
                                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                        <span className="flex items-center gap-1.5"><Calendar size={14} /> {post.date}</span>
                                        <span className="flex items-center gap-1.5"><MapPin size={14} /> {post.lastSeenArea}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 mb-4 leading-tight group-hover:text-indigo-600 transition-colors uppercase">
                                        {post.title}
                                    </h3>
                                    <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-3 mb-6">
                                        {post.description}
                                    </p>

                                    <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100">
                                        {post.rewardAmount && (
                                            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5 align-middle"><Gift size={14}/> পুরস্কার ঘোষণা</span>
                                                <span className="text-sm font-black text-amber-700">{post.rewardAmount}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                                <UserCheck size={16} className="text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">বিজ্ঞাপনদাতা</p>
                                                <p className="text-xs font-black text-slate-700">{post.contactName}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => window.location.href = `tel:${post.contactPhone}`}
                                        className={`w-full py-4 rounded-[20px] font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg ${
                                            post.type === 'lost' ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                        }`}
                                    >
                                        <Phone size={18} /> সরাসরি কল দিন
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* 4. Footer CTA */}
            <div className="mt-16 bg-white rounded-[40px] p-8 md:p-14 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden shadow-sm">
                <div className="relative z-10 w-full text-center md:text-left">
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-4">কিছু কি কুড়িয়ে পেয়েছেন?</h3>
                    <p className="text-slate-600 font-bold max-w-xl text-base">
                        আপনার সঠিক একটি সংবাদে কারো বিশাল কোনো ক্ষতি পূরণ হতে পারে। আজই প্রাপ্তি সংবাদ দিয়ে মালিককে সহায়তা করুন।
                    </p>
                </div>
                <div className="shrink-0 w-full md:w-auto relative z-10">
                    <button className="w-full px-10 py-5 rounded-[24px] bg-slate-900 text-white font-black text-lg shadow-xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-2">
                        প্রাপ্তি সংবাদ দিন <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

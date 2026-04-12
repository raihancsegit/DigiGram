'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, Phone, Filter, AlertCircle, CheckCircle2, Image as ImageIcon, PlusCircle, Gift, ShieldAlert, Crosshair, Users, Target, SearchIcon, Award, UserCheck } from 'lucide-react';
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
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-xs font-black uppercase tracking-widest mb-6">
                            <Target size={14} /> কমিউনিটি কানেক্ট
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.2] mb-6">
                            হারানো বস্তু খুঁজতে বা প্রাপ্ত জিনিস <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">ফিরিয়ে দিতে সাহায্য করুন</span>
                        </h2>
                        <p className="text-lg text-indigo-200 font-medium mb-8 leading-relaxed max-w-xl">
                            আপনার হারানো মূল্যবান জিনিস, দলিল বা গবাদি পশুর সন্ধানে কমিউনিটিকে জানান। খুঁজে পেলে উপযুক্ত পুরস্কার দিন।
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button className="w-full sm:w-auto px-8 py-5 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black text-lg hover:from-rose-400 hover:to-orange-400 transition-all shadow-lg shadow-rose-500/25 active:scale-95 flex items-center justify-center gap-2">
                                <PlusCircle size={20} />
                                হারানো বিজ্ঞপ্তি দিন
                            </button>
                            <button className="w-full sm:w-auto px-8 py-5 rounded-full bg-white/10 text-white font-black text-lg hover:bg-white/20 transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-2">
                                <CheckCircle2 size={20} />
                                প্রাপ্তি সংবাদ দিন
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md">
                            <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={340} suffix="+" /></div>
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">সাফল্যের সাথে উদ্ধার</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md mt-6">
                            <Award size={32} className="text-amber-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={120} suffix="K+" /></div>
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">পুরস্কার দেওয়া হয়েছে</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Warning Banner */}
            <div className="bg-amber-50 rounded-[32px] p-6 md:p-8 mb-16 border border-amber-200 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-5"><ShieldAlert size={150} /></div>
                <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/30">
                    <ShieldAlert size={32} />
                </div>
                <div className="relative z-10 flex-1">
                    <h4 className="text-xl font-black text-amber-900 mb-2">প্রতারকদের থেকে সাবধান!</h4>
                    <p className="text-sm font-bold text-amber-800/80 leading-relaxed max-w-3xl">
                        কেউ আপনার হারানো বস্তু পাওয়ার কথা বলে যদি বিকাশ/নগদে অ্যাডভান্স টাকা বা বখশিস দাবি করে, তবে কোনোভাবেই টাকা পাঠাবেন না। 
                        সামনাসামনি গিয়ে উপযুক্ত প্রমাণসহ জিনিস বুঝে নেওয়ার পর পুরস্কার প্রদান করুন। সন্দেহ হলে থানায় যোগাযোগ করুন।
                    </p>
                </div>
            </div>

            {/* 3. Directory List */}
            <div id="notices" className="mb-8 border-t border-slate-100 pt-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2">লিস্টেড নোটিশবোর্ড</h2>
                        <p className="text-sm font-medium text-slate-500">আপনার হারানো জিনিস খুঁজুন অথবা কুড়িয়ে পাওয়া জিনিস মালিককে ফেরত দিন</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                    <button 
                        onClick={() => setFilter('all')}
                        className={`shrink-0 px-8 py-3.5 rounded-full text-sm font-black transition-all ${filter === 'all' ? 'bg-indigo-900 text-white shadow-lg shadow-indigo-900/20' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}
                    >
                        সবগুলো
                    </button>
                    <button 
                        onClick={() => setFilter('lost')}
                        className={`shrink-0 px-6 py-3.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${filter === 'lost' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25' : 'bg-white text-slate-600 border border-slate-200 hover:border-rose-300 hover:text-rose-600'}`}
                    >
                        <SearchIcon size={18} />
                        শুধু হারানো
                    </button>
                    <button 
                        onClick={() => setFilter('found')}
                        className={`shrink-0 px-6 py-3.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${filter === 'found' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-600'}`}
                    >
                        <UserCheck size={18} />
                        শুধু প্রাপ্তি
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredPosts.map((post) => (
                            <motion.div
                                key={post.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className={`bg-white rounded-[40px] border-2 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col group ${
                                    post.type === 'lost' ? 'hover:border-rose-200' : 'hover:border-emerald-200'
                                }`}
                            >
                                <div className="relative h-60 bg-slate-100 overflow-hidden shrink-0">
                                    {post.image ? (
                                        <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-50"><ImageIcon size={48} className="text-slate-300" /></div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                                    
                                    <div className="absolute top-5 left-5">
                                        <span className={`px-4 py-2 rounded-[14px] text-[10px] font-black uppercase tracking-widest shadow-md ${
                                            post.type === 'lost' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                                        }`}>
                                            {post.type === 'lost' ? 'হারানো নোটিশ' : 'প্রাপ্তি সংবাদ'}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-5 left-5 right-5">
                                        <h3 className="text-xl font-black text-white leading-snug mb-1.5">{post.title}</h3>
                                        <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                                            <span className="bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-md border border-white/10">{post.category}</span>
                                            <span>•</span>
                                            <span>{post.date}</span>
                                        </div>
                                    </div>

                                    {post.status === 'resolved' && (
                                        <div className="absolute inset-0 bg-white/70 backdrop-blur-md flex items-center justify-center z-20">
                                            <div className="bg-teal-500 text-white px-6 py-3 rounded-full font-black text-lg shadow-xl flex items-center gap-2 transform -rotate-12 border-[3px] border-white ring-4 ring-teal-500/20">
                                                <CheckCircle2 size={24} />
                                                মীমাংসিত
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 md:p-8 flex flex-col flex-1">
                                    <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-3 mb-6">
                                        {post.description}
                                    </p>

                                    {/* Detailed Fields Container */}
                                    <div className="space-y-3 mb-6 bg-slate-50 border border-slate-100 rounded-[20px] p-5">
                                        {post.rewardAmount && post.rewardAmount !== 'প্রযোজ্য নয়' && (
                                            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                                                <div className="flex items-center gap-2 text-xs font-black text-amber-600 uppercase tracking-widest">
                                                    <Gift size={16} /> পুরস্কার ঘোষণা
                                                </div>
                                                <span className="text-sm font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-lg">{post.rewardAmount}</span>
                                            </div>
                                        )}
                                        <div className="flex items-start gap-3 text-xs font-bold text-slate-600 pt-1">
                                            <Crosshair size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                                            <span className="leading-snug">শেষ দেখা/প্রাপ্তি স্পট: {post.lastSeenArea}</span>
                                        </div>
                                        <div className="flex items-start gap-3 text-xs font-bold text-slate-600">
                                            <ShieldAlert size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                            <span>জিডি নাম্বার: <span className="font-mono text-slate-800">{post.gdNumber}</span></span>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-100">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">যোগাযোগের ব্যক্তি</p>
                                            <p className="text-sm font-black text-slate-700">{post.contactName}</p>
                                        </div>
                                        <button 
                                            disabled={post.status === 'resolved'}
                                            onClick={() => window.location.href = `tel:${post.contactPhone}`}
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                                                post.status === 'active' 
                                                ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl active:scale-95' 
                                                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                            }`}
                                        >
                                            <Phone size={24} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
                
                {filteredPosts.length === 0 && (
                    <div className="text-center py-20">
                        <Search size={48} className="text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-slate-800 mb-2">কোনো পোস্ট পাওয়া যায়নি</h3>
                        <p className="text-sm text-slate-500 font-medium">এই ক্যাটাগরিতে বর্তমানে কোনো পোস্ট নেই।</p>
                    </div>
                )}
            </div>
        </div>
    );
}

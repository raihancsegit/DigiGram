'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Bell, Search, Filter, Calendar, User, Clock, ChevronRight, TrendingUp, Megaphone, MapPin, Share2, Bookmark, ArrowRight } from 'lucide-react';
import { ALL_NEWS } from '@/lib/content/newsData';

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

export default function NewsLandingView() {
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const newsCategories = ['All', 'সরকারি ঘোষণা', 'কৃষি', 'স্বাস্থ্য', 'শিক্ষা', 'জরুরি'];

    const filteredNews = useMemo(() => {
        return ALL_NEWS.filter(news => {
            const matchesTab = activeTab === 'All' || news.category.includes(activeTab);
            const matchesSearch = news.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  news.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [activeTab, searchTerm]);

    return (
        <div className="pb-16 pt-4">
            {/* 1. Hero / Featured News Section */}
            <div className="relative rounded-[40px] bg-slate-900 border border-slate-800 overflow-hidden mb-16 shadow-2xl">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3"></div>
                
                <div className="relative z-10 p-8 md:p-20 flex flex-col lg:flex-row gap-12 items-center">
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-black uppercase tracking-widest mb-6">
                            <Megaphone size={16} className="animate-bounce" /> বিশেষ ঘোষণা ও সংবাদ
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.2] mb-6">
                            ইউনিয়নের রিয়েল-টাইম <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-sky-300">তথ্য ও সংবাদ পোর্টাল</span>
                        </h2>
                        <p className="text-lg text-slate-400 font-medium mb-8 leading-relaxed max-w-xl">
                            আপনার গ্রামের কৃষি, শিক্ষা, স্বাস্থ্য এবং সরকারি সকল গুরুত্বপূর্ণ ঘোষণা ও নোটিশ এখন একসাথে এক জায়গায়। সবসময় আপডেট থাকুন।
                        </p>
                        
                        <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 backdrop-blur-md">
                                <p className="text-2xl font-black text-white mb-1">৫০০+</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">মোট সংবাদ</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 backdrop-blur-md">
                                <p className="text-2xl font-black text-white mb-1">২৪/৭</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">লাইভ আপডেট</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-[450px] shrink-0">
                        {/* Featured Quick Panel */}
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-xl">
                            <h3 className="text-sm font-black text-teal-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <TrendingUp size={16} /> বর্তমানে ট্রেন্ডিং
                            </h3>
                            <div className="space-y-4">
                                {ALL_NEWS.slice(0, 3).map((item, i) => (
                                    <div key={i} className="flex gap-4 group cursor-pointer">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                                            <img src={item.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-teal-500 uppercase mb-1">{item.category}</p>
                                            <h4 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-teal-400 transition-colors">{item.title}</h4>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. News Dashboard Section */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* ── Sidebar: News Channels/Tags ── */}
                <div className="w-full lg:w-72 shrink-0 space-y-8">
                    <div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 pl-2">সংবাদ বিভাগ</h3>
                        <div className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
                            {newsCategories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveTab(cat)}
                                    className={`flex items-center justify-between px-6 py-4 rounded-2xl font-black text-sm transition-all text-left whitespace-nowrap ${
                                        activeTab === cat 
                                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20 active:scale-95' 
                                        : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <span>{cat === 'All' ? 'সব খবর' : cat}</span>
                                    {activeTab === cat && <ChevronRight size={16} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 hidden lg:block">
                        <Bell size={32} className="text-teal-500 mb-4" />
                        <h4 className="font-black text-slate-800 mb-2">এসএমএস নিউজ অ্যালার্ট</h4>
                        <p className="text-xs font-bold text-slate-500 leading-relaxed mb-6">আপনার ইউনিয়নের গুরুত্বপূর্ণ খবরগুলো সরাসরি মোবাইলে পেতে সাবস্ক্রাইব করুন।</p>
                        <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-teal-600 transition-colors">শুনিশ্চিত করুন</button>
                    </div>
                </div>

                {/* ── Main Feed: News List ── */}
                <div className="flex-1">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                        <h2 className="text-2xl font-black text-slate-800">সর্বশেষ ফিড</h2>
                        <div className="relative w-full md:w-80">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="খবর খুঁজুন..." 
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredNews.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl hover:border-teal-200 transition-all group flex flex-col"
                                >
                                    <div className="relative h-56 bg-slate-100 overflow-hidden shrink-0">
                                        <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-teal-600 shadow-sm border border-white/20">
                                            {item.category}
                                        </div>
                                    </div>
                                    <div className="p-8 flex flex-col flex-1">
                                        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                            <span className="flex items-center gap-1.5"><Calendar size={12} /> {item.date}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span className="flex items-center gap-1.5"><Clock size={12} /> {item.readTime}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 mb-4 leading-tight group-hover:text-teal-600 transition-colors line-clamp-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-3 mb-6">
                                            {item.excerpt}
                                        </p>
                                        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <User size={14} className="text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">প্রতিবেদক</p>
                                                    <p className="text-xs font-black text-slate-700">{item.author}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 text-slate-400 hover:text-teal-500 hover:bg-teal-50 rounded-lg transition-all"><Bookmark size={16} /></button>
                                                <button className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-all"><Share2 size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {filteredNews.length === 0 && (
                        <div className="text-center py-24 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                            <Newspaper size={48} className="text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-slate-800 mb-2">কোনো সংবাদ পাওয়া যায়নি</h3>
                            <p className="text-sm font-medium text-slate-500">অনুগ্রহ করে ভিন্ন কোনো বিভাগ বা কি-ওয়ার্ড দিয়ে খুঁজুন।</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Footer Banner */}
            <div className="mt-16 bg-gradient-to-r from-teal-500 to-sky-600 rounded-[40px] p-8 md:p-14 text-white relative overflow-hidden shadow-2xl">
                 <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl text-center md:text-left">
                        <h3 className="text-3xl font-black mb-4">সংবাদ বা ঘোষণার আবেদন করুন</h3>
                        <p className="text-white/80 font-bold text-base leading-relaxed">
                            আপনার এলাকায় কোনো বিশেষ খবর বা সরকারি ঘোষণা থাকলে তা ডিজিগ্রাম নিউজ পোর্টালে যুক্ত করতে আমাদের সাথে যোগাযোগ করুন।
                        </p>
                    </div>
                    <button className="shrink-0 px-10 py-5 bg-white text-teal-600 rounded-[20px] font-black text-lg shadow-xl hover:scale-105 transition-all active:scale-95 flex items-center gap-2">
                        যোগাযোগ করুন <ArrowRight size={20} />
                    </button>
                 </div>
                 <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
            </div>
        </div>
    );
}

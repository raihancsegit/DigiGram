import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Bell, Search, Filter, Calendar, User, Clock, ChevronRight, TrendingUp, Megaphone, MapPin, Share2, Bookmark, ArrowRight, Loader2 } from 'lucide-react';
import { ALL_NEWS } from '@/lib/content/newsData';
import { useSearchParams } from 'next/navigation';
import { wardService } from '@/lib/services/wardService';
import { getLocationBySlug } from '@/lib/services/hierarchyService';
import { toBnDigits } from '@/lib/utils/format';

export default function NewsLandingView() {
    const searchParams = useSearchParams();
    const unionSlug = searchParams.get('u');

    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unionName, setUnionName] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [newsTab, setNewsTab] = useState('local'); // 'local' or 'global'
    const [timeframe, setTimeframe] = useState('all');
    const itemsPerPage = 6;

    const TIMEFRAMES = [
        { id: 'all', label: 'সব' },
        { id: 'today', label: 'আজ' },
        { id: '7days', label: '৭ দিন' },
        { id: '15days', label: '১৫ দিন' },
        { id: '30days', label: '৩০ দিন' },
        { id: 'year', label: '১ বছর' },
    ];

    useEffect(() => {
        if (unionSlug) {
            loadNews();
        }
    }, [unionSlug, timeframe, newsTab]);

    const loadNews = async () => {
        setLoading(true);
        try {
            const unionData = await getLocationBySlug(unionSlug);
            if (unionData) {
                setUnionName(unionData.name_bn);
                
                // Get union + its wards
                const { data: wards } = await wardService.getVillagesByWard(unionData.id); // This actually gets children
                // Wait, hierarchyService or wardService should give us all wards of a union
                // For simplicity, let's just get news for the union and global
                // But the service supports multiple IDs
                
                const isGlobalOnly = newsTab === 'global';
                const locationIds = isGlobalOnly ? [] : [unionData.id];
                
                const data = await wardService.getMultipleLocationsNews(locationIds, timeframe);
                
                // Filter by local/global specifically if needed
                const filteredData = isGlobalOnly ? data.filter(n => n.is_global) : data.filter(n => !n.is_global);
                
                setNews(filteredData);
            }
        } catch (err) {
            console.error("Error loading news:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm]);

    const newsCategories = ['All', 'সরকারি ঘোষণা', 'কৃষি', 'স্বাস্থ্য', 'শিক্ষা', 'জরুরি'];

    const filteredNews = useMemo(() => {
        const sourceNews = news.length > 0 ? news : [];
        return sourceNews.filter(item => {
            const matchesTab = activeTab === 'All' || (item.category && item.category.includes(activeTab));
            const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.excerpt && item.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));
            
            return matchesTab && matchesSearch;
        });
    }, [activeTab, searchTerm, news]);

    const paginatedNews = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredNews.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredNews, currentPage]);

    const totalPages = Math.ceil(filteredNews.length / itemsPerPage);

    if (loading) {
        return (
            <div className="py-40 text-center">
                <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">সংবাদ লোড হচ্ছে...</p>
            </div>
        );
    }

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
                            ইউনিয়নের রিয়েল-টাইম <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-sky-300">তথ্য ও সংবাদ পোর্টাল</span>
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
                                {news.slice(0, 3).map((item, i) => (
                                    <div key={i} className="flex gap-4 group cursor-pointer">
                                        <div className={`w-16 h-16 rounded-xl overflow-hidden ${item.image_url ? 'bg-slate-800' : 'bg-black'} shrink-0 flex items-center justify-center`}>
                                            {item.image_url ? (
                                                <img src={item.image_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <Newspaper size={16} className="text-white opacity-20" />
                                            )}
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
                                    className={`flex items-center justify-between px-6 py-4 rounded-2xl font-black text-sm transition-all text-left whitespace-nowrap ${activeTab === cat
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
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 w-full mb-8">
                        <div className="flex items-center gap-6">
                            <h2 className="text-2xl font-black text-slate-800">সর্বশেষ ফিড</h2>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                                <button 
                                    onClick={() => setNewsTab('local')}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${newsTab === 'local' ? 'bg-white text-teal-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    লোকাল নিউজ
                                </button>
                                <button 
                                    onClick={() => setNewsTab('global')}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${newsTab === 'global' ? 'bg-white text-teal-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    গ্লোবাল নিউজ
                                </button>
                            </div>

                            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-[280px] sm:max-w-none scrollbar-hide">
                                {TIMEFRAMES.map((tf) => (
                                    <button
                                        key={tf.id}
                                        onClick={() => setTimeframe(tf.id)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black whitespace-nowrap transition-all ${timeframe === tf.id ? 'bg-white text-teal-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {tf.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        </div>
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
                            {paginatedNews.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl hover:border-teal-200 transition-all group flex flex-col"
                                >
                                    <div className={`relative h-56 ${item.image_url ? 'bg-slate-100' : 'bg-black'} overflow-hidden shrink-0`}>
                                        {item.image_url ? (
                                            <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-20">
                                                <Newspaper size={48} className="text-white" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                            <span className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-teal-600 shadow-sm border border-white/20">
                                                {item.category}
                                            </span>
                                            {item.is_global && (
                                                <span className="bg-sky-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-sky-400">
                                                    গ্লোবাল
                                                </span>
                                            )}
                                        </div>
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md text-[9px] font-bold text-white border border-white/10">
                                                <MapPin size={10} /> {item.location?.name_bn || 'সারাদেশ'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 flex flex-col flex-1">
                                        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                            <span className="flex items-center gap-1.5"><Calendar size={12} /> {toBnDigits(new Date(item.created_at).toLocaleDateString('bn-BD'))}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span className="flex items-center gap-1.5"><Clock size={12} /> ৫ মিনিট পড়া</span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 mb-4 leading-tight group-hover:text-teal-600 transition-colors line-clamp-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-3 mb-6">
                                            {item.content?.substring(0, 150)}...
                                        </p>
                                        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <User size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">প্রতিবেদক</p>
                                                    <p className="text-xs font-black text-slate-700">{item.author_name || 'ডিজিগ্রাম নিউজ'}</p>
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

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-12 flex items-center justify-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-3 rounded-xl bg-white border border-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                            >
                                <ChevronRight className="rotate-180" size={20} />
                            </button>
                            
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-12 h-12 rounded-xl font-black text-sm transition-all ${
                                        currentPage === i + 1 
                                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' 
                                        : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {toBnDigits(i + 1)}
                                </button>
                            ))}

                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-3 rounded-xl bg-white border border-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                            >
                                <ChevronRight size={20} />
                            </button>
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

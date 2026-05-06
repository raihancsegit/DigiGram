'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Newspaper, Calendar, Clock, ArrowRight, 
    Zap, TrendingUp, Search, Filter, Loader2,
    Star, MapPin, Bookmark, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { newsService } from '@/lib/services/newsService';

const CATEGORY_CONFIG = {
    'উন্নয়ন':      { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200/70',  dot: 'bg-emerald-500' },
    'স্বাস্থ্য':   { bg: 'bg-sky-50',      text: 'text-sky-700',      border: 'border-sky-200/70',      dot: 'bg-sky-500' },
    'কৃষি':        { bg: 'bg-lime-50',     text: 'text-lime-700',     border: 'border-lime-200/70',     dot: 'bg-lime-500' },
    'নোটিশ':       { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200/70',    dot: 'bg-amber-500' },
    'জানাজা':      { bg: 'bg-slate-100',   text: 'text-slate-700',    border: 'border-slate-200/70',    dot: 'bg-slate-500' },
    'হারানো-প্রাপ্তি': { bg: 'bg-rose-50', text: 'text-rose-700',     border: 'border-rose-200/70',     dot: 'bg-rose-500' },
};

function CategoryBadge({ category }) {
    const cfg = CATEGORY_CONFIG[category] ?? { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200/70', dot: 'bg-teal-500' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {category}
        </span>
    );
}

export default function GlobalNewsPage() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const TIMEFRAMES = [
        { id: 'all', label: 'সবগুলো' },
        { id: 'today', label: 'আজকের' },
        { id: '7days', label: '৭ দিন' },
        { id: '15days', label: '১৫ দিন' },
        { id: '30days', label: '৩০ দিন' },
    ];

    useEffect(() => {
        const fetchAllNews = async () => {
            setLoading(true);
            try {
                const data = await newsService.getGlobalNews(page, 12, timeframe);
                if (page === 1) {
                    setNews(data);
                } else {
                    setNews(prev => [...prev, ...data]);
                }
                setHasMore(data.length === 12);
            } catch (err) {
                console.error("Error fetching news:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllNews();
    }, [timeframe, page]);

    return (
        <main className="min-h-screen bg-slate-50 pb-24">
            {/* ── Header ── */}
            <div className="bg-slate-900 pt-32 pb-24 relative overflow-hidden rounded-b-[60px] md:rounded-b-[100px]">
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-600 rounded-full blur-[150px] translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-600 rounded-full blur-[150px] -translate-x-1/2 translate-y-1/2" />
                </div>
                
                <div className="dg-section-x max-w-7xl mx-auto px-4 relative z-10 text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/10 text-teal-400 text-[11px] font-black uppercase tracking-[0.3em] border border-white/10 mb-8 backdrop-blur-md">
                            <Bookmark size={18} /> গ্লোবাল নিউজ আর্কাইভ
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-8">
                            সর্বশেষ সংবাদ ও <span className="text-teal-400">ঘোষণা</span>
                        </h1>
                        <p className="max-w-3xl mx-auto text-slate-400 text-lg font-bold leading-relaxed">
                            সারাদেশের সকল ইউনিয়নের গ্লোবাল সংবাদ ও নোটিশগুলো এক পলকে দেখুন। খবরের সত্যতা নিশ্চিত করতে প্রশাসন কাজ করছে।
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="dg-section-x max-w-7xl mx-auto px-4 -mt-8 relative z-20 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-wrap gap-1.5 items-center bg-white p-1.5 rounded-full shadow-xl shadow-slate-200 border border-slate-100 overflow-x-auto max-w-full">
                    {TIMEFRAMES.map((tf) => (
                        <button
                            key={tf.id}
                            onClick={() => { setTimeframe(tf.id); setPage(1); }}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                timeframe === tf.id 
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-300' 
                                    : 'text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>

                <div className="relative group w-full md:w-72">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="সংবাদ খুঁজুন..."
                        className="w-full pl-10 pr-5 py-2.5 rounded-full bg-white border border-slate-200 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:outline-none text-[10px] font-black shadow-xl shadow-slate-200 transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* ── News Container ── */}
            <div className="dg-section-x max-w-7xl mx-auto px-4 mt-10">
                <div className="rounded-[40px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-8 md:px-10 py-8 border-b border-slate-200 bg-slate-50/50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-none">গ্লোবাল অ্যাক্টিভিটি</h3>
                                <p className="mt-2 text-slate-500 font-bold text-xs">সমগ্র বাংলাদেশ থেকে সর্বশেষ তথ্যাদি</p>
                            </div>
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-200">
                                <Calendar size={12} className="text-teal-400" /> পেজ: {page}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 md:p-12">
                        {news.length === 0 && !loading ? (
                            <div className="rounded-[40px] bg-slate-50 border-2 border-dashed border-slate-200 p-20 text-center">
                                <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
                                <p className="text-xl font-black text-slate-800">কোন সংবাদ পাওয়া যায়নি</p>
                                <p className="mt-2 text-slate-500 font-bold">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {news.map((item, idx) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx % 3 * 0.1 }}
                                    >
                                        <Link href={`/news/${item.slug || item.id}`} className="group block h-full">
                                            <div className="h-full overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-teal-200 flex flex-col">
                                                <div className="relative h-56 bg-slate-950 overflow-hidden shrink-0">
                                                    {item.image_url ? (
                                                        <img 
                                                            src={item.image_url} 
                                                            alt={item.title} 
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center opacity-20">
                                                            <Bookmark size={48} className="text-white" />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-4 right-4">
                                                        <CategoryBadge category={item.category || 'নোটিশ'} />
                                                    </div>
                                                    <div className="absolute bottom-4 left-4">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-[10px] font-black text-white border border-white/10 shadow-lg">
                                                            <MapPin size={12} className="text-teal-400" />
                                                            {item.location?.name_bn || 'প্রশাসন'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="p-8 flex-1 flex flex-col">
                                                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                                                        <Calendar size={14} className="text-teal-500" />
                                                        {new Date(item.created_at).toLocaleDateString('bn-BD')}
                                                    </div>
                                                    <h3 className="text-xl font-black text-slate-800 leading-tight mb-4 group-hover:text-teal-700 transition-colors line-clamp-2">
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 font-bold leading-relaxed mb-6 line-clamp-3">
                                                        {item.excerpt || item.description}
                                                    </p>
                                                    
                                                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between text-xs font-black text-teal-600">
                                                        <span className="uppercase tracking-widest opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">বিস্তারিত সংবাদ</span>
                                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                                                            <ArrowRight size={18} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination - Pill Design */}
                    {hasMore && (
                        <div className="flex justify-center py-12 bg-slate-50/50 border-t border-slate-100">
                            <button 
                                onClick={() => setPage(prev => prev + 1)}
                                disabled={loading}
                                className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-teal-600 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} />}
                                আরও সংবাদ লোড করুন
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

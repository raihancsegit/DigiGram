'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Newspaper, Calendar, Clock, ArrowRight, 
    Zap, TrendingUp, Search, Filter, Loader2,
    Star, MapPin
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
            <div className="bg-white border-b border-slate-200 pt-32 pb-16 relative overflow-hidden">
                <div className="dg-section-x max-w-7xl mx-auto px-4 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl"
                    >
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                            <Zap size={12} className="fill-current" />
                            ব্রেকিং আপডেট ও ঘোষণা
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
                            সর্বশেষ সংবাদ ও <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-sky-500 to-rose-500">গুরুত্বপূর্ণ নোটিশ</span>
                        </h1>
                        <p className="text-slate-500 text-lg font-bold">সারাদেশের সকল ইউনিয়নের গ্লোবাল সংবাদ ও নোটিশগুলো এক পলকে দেখুন</p>
                    </motion.div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
                    <Newspaper size={400} className="text-slate-900" />
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
                <div className="dg-section-x max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        {TIMEFRAMES.map((tf) => (
                            <button
                                key={tf.id}
                                onClick={() => { setTimeframe(tf.id); setPage(1); }}
                                className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                    timeframe === tf.id 
                                        ? 'bg-white text-teal-600 shadow-md scale-[1.02]' 
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="সংবাদ খুঁজুন..."
                                className="pl-11 pr-6 py-2.5 rounded-2xl bg-slate-100 border-none focus:ring-2 focus:ring-teal-500 text-sm font-bold w-64"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── News Grid ── */}
            <div className="dg-section-x max-w-7xl mx-auto px-4 mt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {news.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx % 3 * 0.1 }}
                        >
                            <Link href={`/news/${item.slug || item.id}`} className="group block">
                                <div className="bg-white rounded-[40px] border border-slate-200/60 overflow-hidden hover:shadow-2xl hover:border-teal-200 transition-all duration-500">
                                    {/* Image */}
                                    <div className="relative h-64 overflow-hidden bg-black">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-20">
                                                <Newspaper size={64} className="text-white" />
                                            </div>
                                        )}
                                        <div className="absolute top-5 left-5">
                                            <CategoryBadge category={item.category || 'উন্নয়ন'} />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-[9px] font-black text-teal-600 uppercase tracking-widest">
                                                <Star size={10} className="fill-current" />
                                                {item.location?.name_bn || 'গ্লোবাল'}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                <Calendar size={12} /> {new Date(item.created_at).toLocaleDateString('bn-BD')}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 leading-snug mb-4 group-hover:text-teal-700 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-6">
                                            {item.excerpt}
                                        </p>
                                        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <Clock size={12} className="text-teal-500" /> ৩ মিনিট পড়া
                                            </span>
                                            <span className="inline-flex items-center gap-2 text-xs font-black text-teal-600 group-hover:gap-3 transition-all">
                                                বিস্তারিত <ArrowRight size={14} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-teal-600" size={32} />
                    </div>
                )}

                {/* Load More */}
                {!loading && hasMore && (
                    <div className="mt-16 flex justify-center">
                        <button 
                            onClick={() => setPage(prev => prev + 1)}
                            className="px-10 py-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-teal-600 transition-all shadow-xl active:scale-95"
                        >
                            আরও নিউজ দেখুন
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}

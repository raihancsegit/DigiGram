'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ArrowRight, Zap, Clock, ArrowUpRight, Newspaper, TrendingUp, Star, Loader2, AlertCircle } from 'lucide-react';
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

function CategoryBadge({ category, size = 'sm' }) {
    const cfg = CATEGORY_CONFIG[category] ?? { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200/70', dot: 'bg-teal-500' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {category}
        </span>
    );
}

/* ─── Featured (big) card ───────────────────────────────── */
function FeaturedCard({ news }) {
    return (
        <Link href={`/news/${news.slug}`} className="group block h-full">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative h-full rounded-[40px] overflow-hidden border border-slate-200/60 bg-white shadow-[0_24px_48px_-16px_rgba(15,23,42,0.12)] hover:shadow-[0_48px_80px_-24px_rgba(15,23,42,0.2)] hover:border-teal-200 transition-all duration-700"
            >
                {/* Image Section */}
                <div className="relative h-64 sm:h-[420px] overflow-hidden bg-slate-950">
                    {/* Top Badges */}
                    <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
                        <CategoryBadge category={news.category} />
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md text-[9px] font-black text-slate-800 uppercase tracking-widest shadow-xl border border-white/20">
                            <Star size={10} className="text-amber-500 fill-current" />
                            {news.unionName || 'গ্লোবাল নিউজ'}
                        </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent z-10 opacity-80 group-hover:opacity-60 transition-opacity duration-700" />
                    
                    {news.image ? (
                        <img
                            src={news.image}
                            alt={news.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1200ms] ease-out"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                            <Newspaper size={64} className="text-white opacity-10" />
                        </div>
                    )}
                    
                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-8 sm:p-10">
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h3 className="text-2xl sm:text-4xl font-black text-white leading-[1.2] mb-4 group-hover:text-teal-300 transition-colors duration-500">
                                {news.title}
                            </h3>
                            <div className="flex items-center gap-4 text-[11px] font-black text-white/60 uppercase tracking-[0.15em]">
                                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-teal-400" /> {news.date}</span>
                                <span className="flex items-center gap-1.5"><Clock size={14} className="text-teal-400" /> ৩ মিনিট পড়া</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

/* ─── Compact side card ─────────────────────────────────── */
function CompactCard({ news, index }) {
    return (
        <Link href={`/news/${news.slug}`} className="group block">
            <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex gap-5 p-5 rounded-[32px] border border-slate-100 bg-white hover:border-teal-200 hover:shadow-[0_20px_40px_-16px_rgba(13,148,136,0.12)] transition-all duration-500 group"
            >
                {/* Thumb */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 shrink-0 shadow-inner">
                    {news.image ? (
                        <img src={news.image} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                        <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                            <Newspaper size={24} className="text-slate-400 opacity-40" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-teal-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Info */}
                <div className="flex flex-col justify-center min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2.5">
                        <CategoryBadge category={news.category} />
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-[9px] font-black text-teal-600 uppercase tracking-widest">
                            <Star size={10} className="fill-current" />
                            {news.unionName || 'ইউনিয়ন'}
                        </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-slate-800 leading-snug line-clamp-2 group-hover:text-teal-700 transition-colors duration-300">
                        {news.title}
                    </h4>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 mt-3">
                        <span className="flex items-center gap-1.5"><Calendar size={12} className="text-teal-400" /> {news.date}</span>
                        <span className="flex items-center gap-1.5"><Clock size={12} className="text-teal-400" /> ২ মিনিট</span>
                    </div>
                </div>

                <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4 transition-all duration-500">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xl group-hover:bg-teal-600">
                        <ArrowRight size={18} />
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

/* ─── Main Section ──────────────────────────────────────── */
export default function LatestNewsSection() {
    const [globalNews, setGlobalNews] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('all');

    const TIMEFRAMES = [
        { id: 'all', label: 'সবগুলো' },
        { id: 'today', label: 'আজকের' },
        { id: '7days', label: '৭ দিন' },
        { id: '15days', label: '১৫ দিন' },
        { id: '30days', label: '৩০ দিন' },
    ];

    const fetchNews = async (pageNum = 1, isLoadMore = false, currentTimeframe = timeframe) => {
        if (!isLoadMore) setLoading(true);
        console.log("Fetching global news with timeframe:", currentTimeframe, "from URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
        try {
            const data = await newsService.getGlobalNews(pageNum, 10, currentTimeframe);
            const mapped = data.map(n => ({
                id: n.id,
                slug: n.slug || n.id,
                title: n.title,
                excerpt: n.excerpt,
                category: n.category || 'উন্নয়ন',
                image: n.image_url,
                unionName: n.location?.name_bn,
                date: new Date(n.created_at).toLocaleDateString('bn-BD'),
            }));

            if (isLoadMore) {
                setGlobalNews(prev => [...prev, ...mapped]);
            } else {
                setGlobalNews(mapped);
            }

            if (data.length < 10) setHasMore(false);
            else setHasMore(true);
        } catch (err) {
            console.error("Error fetching homepage news:", err);
            setGlobalNews([]); // Clear or keep previous? Usually clear if it's a hard error
        } finally {
            setLoading(false);
        }
    };

    const isFirstRun = useRef(true);

    useEffect(() => {
        // Skip first run if desired, or just handle it
        if (isFirstRun.current) {
            isFirstRun.current = false;
        }
        setPage(1);
        fetchNews(1, false, timeframe);
    }, [timeframe]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchNews(nextPage, true, timeframe);
    };

    const featured = globalNews[0];

    if (loading && page === 1) {
        return (
            <section className="dg-section-x py-20 flex justify-center">
                <Loader2 className="animate-spin text-teal-600" size={40} />
            </section>
        );
    }

    if (globalNews.length === 0 && !loading) {
        return (
            <section className="dg-section-x py-20 text-center">
                <div className="max-w-md mx-auto p-8 rounded-[32px] bg-slate-50 border border-slate-200">
                    <AlertCircle className="mx-auto text-slate-400 mb-4" size={48} />
                    <h3 className="text-xl font-black text-slate-800 mb-2">নিউজ লোড করা সম্ভব হয়নি</h3>
                    <p className="text-slate-500 text-sm mb-6">দয়া করে আপনার ইন্টারনেট সংযোগ চেক করুন এবং আবার চেষ্টা করুন।</p>
                    <button 
                        onClick={() => fetchNews(1, false, timeframe)}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-teal-600 transition-colors"
                    >
                        আবার চেষ্টা করুন
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="dg-section-x py-20 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">

                {/* ── Section Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4"
                        >
                            <Zap size={11} className="fill-current" />
                            ব্রেকিং আপডেট
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.05 }}
                            className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]"
                        >
                            সর্বশেষ সংবাদ ও{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-sky-500 to-rose-500">
                                গুরুত্বপূর্ণ ঘোষণা
                            </span>
                        </motion.h2>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                            {TIMEFRAMES.map((tf) => (
                                <button
                                    key={tf.id}
                                    onClick={() => setTimeframe(tf.id)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        timeframe === tf.id 
                                            ? 'bg-white text-teal-600 shadow-md scale-[1.02]' 
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {tf.label}
                                </button>
                            ))}
                        </div>

                        <Link
                            href="/news"
                            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-[12px] font-black hover:bg-teal-600 transition-colors duration-300 shadow-lg shadow-slate-900/20"
                        >
                            <Newspaper size={14} />
                            সব খবর দেখুন
                        </Link>
                    </div>
                </div>

                {/* ── Layout: Featured Left + Side Right ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

                    {/* Featured card — takes 2/5 on desktop */}
                    {featured && (
                        <div className="lg:col-span-2 h-full">
                            <FeaturedCard news={featured} />
                        </div>
                    )}

                    {/* Side compact list — takes 3/5 on desktop */}
                    <div className="lg:col-span-3 flex flex-col gap-3">
                        {globalNews.slice(1).map((news, i) => (
                            <CompactCard key={news.id} news={news} index={i} />
                        ))}

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="mt-4 flex justify-center lg:justify-start">
                                <button 
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                    className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-sm hover:border-teal-500 hover:text-teal-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <>
                                            আরও নিউজ লোড করুন
                                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Trending strip ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-teal-50 to-sky-50 border border-teal-100"
                >
                    <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-600 text-white text-[10px] font-black uppercase tracking-widest">
                        <TrendingUp size={10} />
                        ট্রেন্ডিং
                    </span>
                    <div className="flex items-center gap-1 text-sm font-bold text-slate-600 truncate">
                        <span className="text-teal-600 font-black shrink-0">#{1}</span>
                        <span className="truncate">{featured?.title}</span>
                    </div>
                    <Link href={`/news/${featured?.slug}`} className="ml-auto shrink-0 inline-flex items-center gap-1 text-[11px] font-black text-teal-600 hover:text-teal-800 transition-colors">
                        পড়ুন <ArrowRight size={12} />
                    </Link>
                </motion.div>

            </div>
        </section>
    );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ArrowRight, Zap, Clock, ArrowUpRight, Newspaper, TrendingUp, Star } from 'lucide-react';
import Link from 'next/link';
import { getGlobalNews } from '@/lib/content/newsData';

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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative h-full rounded-[32px] overflow-hidden border border-slate-200/60 bg-white shadow-[0_8px_40px_-12px_rgba(15,23,42,0.15)] hover:shadow-[0_24px_60px_-16px_rgba(15,23,42,0.22)] hover:border-teal-200 transition-all duration-500"
            >
                {/* Image */}
                <div className="relative h-56 sm:h-72 overflow-hidden bg-slate-900">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent z-10" />
                    <img
                        src={news.image}
                        alt={news.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[800ms]"
                    />
                    {/* Badge on image */}
                    <div className="absolute top-4 left-4 z-20">
                        <CategoryBadge category={news.category} />
                    </div>
                    {/* Featured pill */}
                    <div className="absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                        <Star size={10} className="fill-current" />
                        ফিচার্ড
                    </div>
                    {/* Title overlay on bottom of image */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-5">
                        <h3 className="text-xl sm:text-2xl font-black text-white leading-tight line-clamp-2 drop-shadow-lg">
                            {news.title}
                        </h3>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 sm:p-6">
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-5">{news.excerpt}</p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                            <span className="flex items-center gap-1"><Calendar size={12} className="text-teal-500" /> {news.date}</span>
                            <span className="flex items-center gap-1"><Clock size={12} className="text-teal-500" /> {news.readTime}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[12px] font-black text-teal-600 group-hover:gap-2 transition-all">
                            পড়ুন <ArrowUpRight size={14} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
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
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-teal-200 hover:shadow-[0_8px_28px_-8px_rgba(13,148,136,0.15)] transition-all duration-300"
            >
                {/* Thumb */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img src={news.image} alt={news.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                {/* Text */}
                <div className="flex flex-col justify-between min-w-0 flex-1 py-0.5">
                    <div>
                        <CategoryBadge category={news.category} />
                        <h4 className="text-sm font-black text-slate-800 leading-snug line-clamp-2 mt-2 group-hover:text-teal-700 transition-colors">
                            {news.title}
                        </h4>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1.5">
                        <Calendar size={10} className="text-teal-400 shrink-0" />
                        {news.date}
                        <span className="mx-0.5 text-slate-300">·</span>
                        <Clock size={10} className="text-teal-400 shrink-0" />
                        {news.readTime}
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

/* ─── Main Section ──────────────────────────────────────── */
export default function LatestNewsSection() {
    const globalNews = getGlobalNews();
    const [featured] = globalNews;
    const sideNews = globalNews.slice(1);

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

                    <Link
                        href="/news"
                        className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-[12px] font-black hover:bg-teal-600 transition-colors duration-300 shadow-lg shadow-slate-900/20"
                    >
                        <Newspaper size={14} />
                        সব খবর দেখুন
                    </Link>
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
                        {sideNews.map((news, i) => (
                            <CompactCard key={news.id} news={news} index={i} />
                        ))}
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

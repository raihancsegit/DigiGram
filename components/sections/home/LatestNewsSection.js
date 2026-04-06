'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Zap, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { getGlobalNews } from '@/lib/content/newsData';

export default function LatestNewsSection() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const globalNews = getGlobalNews();
    
    const CARDS_TO_SHOW = 3;
    const TOTAL_NEWS = globalNews.length;
    const GAP_SIZE = 1.5; // in rem (gap-6)

    const nextSlide = () => {
        if (TOTAL_NEWS > CARDS_TO_SHOW) {
            setCurrentIndex((prev) => (prev + 1) % (TOTAL_NEWS - CARDS_TO_SHOW + 1));
        }
    };

    const prevSlide = () => {
        if (TOTAL_NEWS > CARDS_TO_SHOW) {
            setCurrentIndex((prev) => (prev - 1 + (TOTAL_NEWS - CARDS_TO_SHOW + 1)) % (TOTAL_NEWS - CARDS_TO_SHOW + 1));
        }
    };

    return (
        <section className="dg-section-x py-24 bg-slate-50/30 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="max-w-2xl">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-rose-100"
                        >
                            <Zap size={12} className="fill-current" />
                            ব্রেকিং আপডেট
                        </motion.div>
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.05]">
                            সর্বশেষ সংবাদ ও <br/> <span className="text-teal-600">গুরুত্বপূর্ণ ঘোষণা</span>
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={prevSlide} 
                            disabled={TOTAL_NEWS <= CARDS_TO_SHOW}
                            className={`w-14 h-14 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-200 transition-all active:scale-95 shadow-sm ${TOTAL_NEWS <= CARDS_TO_SHOW ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                            <ChevronLeft size={28} />
                        </button>
                        <button 
                            onClick={nextSlide} 
                            disabled={TOTAL_NEWS <= CARDS_TO_SHOW}
                            className={`w-14 h-14 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-200 transition-all active:scale-95 shadow-sm ${TOTAL_NEWS <= CARDS_TO_SHOW ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                            <ChevronRight size={28} />
                        </button>
                    </div>
                </div>

                {/* Slider Window */}
                <div className="relative overflow-hidden">
                    <motion.div 
                        className="flex gap-6"
                        animate={{ 
                            x: `calc(-${currentIndex * (100 / CARDS_TO_SHOW)}% - ${currentIndex * (GAP_SIZE * (CARDS_TO_SHOW - 1) / CARDS_TO_SHOW)}rem)` 
                        }}
                        transition={{ type: "spring", stiffness: 150, damping: 25 }}
                    >
                        {globalNews.map((news) => (
                            <div 
                                key={news.id} 
                                className="w-full md:w-[calc((100%/3)-1rem)] shrink-0"
                            >
                                <Link href={`/news/${news.slug}`} className="group block h-full">
                                    <div className="bg-white h-full rounded-[48px] border border-slate-200/60 p-5 shadow-sm hover:shadow-2xl hover:shadow-slate-200/60 hover:border-teal-200 transition-all duration-500 relative flex flex-col group overflow-hidden">
                                        
                                        {/* Image Area */}
                                        <div className="relative aspect-[16/10] rounded-[36px] overflow-hidden mb-6 bg-slate-100">
                                            <img 
                                                src={news.image} 
                                                alt={news.title}
                                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                            />
                                            <div className="absolute top-4 left-4">
                                                <span className="px-3.5 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-100 text-teal-700 text-[9px] font-black uppercase tracking-widest">
                                                    {news.category}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="px-3 pb-4">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">
                                                <Calendar size={14} className="text-teal-500" />
                                                {news.date}
                                            </div>
                                            <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-[1.25] mb-4 group-hover:text-teal-700 transition-colors line-clamp-2">
                                                {news.title}
                                            </h3>
                                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 line-clamp-2">
                                                {news.excerpt}
                                            </p>
                                            
                                            <div className="flex items-center gap-2 text-xs font-black text-teal-600">
                                                পুরো খবরটি পড়ুন
                                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Indicators Area */}
                <div className="max-w-[120px] mx-auto flex gap-1.5 mt-16">
                    {globalNews.slice(0, Math.max(1, TOTAL_NEWS - CARDS_TO_SHOW + 1)).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                                idx === currentIndex ? 'w-8 bg-teal-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
                            }`}
                        />
                    ))}
                </div>

            </div>
        </section>
    );
}

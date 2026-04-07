import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, MapPin, ChevronLeft, ChevronRight, Bookmark, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getNewsByUnion } from '@/lib/content/newsData';

export default function UnionNewsSection({ unionName = 'দামকুড়া', villages = [] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const { dynamicNews } = useSelector((state) => state.news);

    // In a real app, mapping unionName to ID. For now:
    const unionId = unionName.includes('দামকুড়া') ? 'dumuria' : 'paurashava';
    
    const unionNews = useMemo(() => {
        const staticNews = getNewsByUnion(unionId);
        const filteredDynamic = dynamicNews.filter(n => n.unionId === unionId);
        
        // Map dynamic news to match static structure if needed
        const mappedDynamic = filteredDynamic.map(n => ({
            ...n,
            slug: n.slug || `dynamic-${n.id}`, // Placeholder slug
            village: n.wardName || n.village || 'ইউনিয়ন',
        }));

        return [...mappedDynamic, ...staticNews];
    }, [unionId, dynamicNews]);

    const CARDS_TO_SHOW = 3;
    const TOTAL_NEWS = unionNews.length;

    // Helper to get category-specific styles
    const getCardStyles = (category) => {
        switch (category) {
            case 'জানাজা':
                return {
                    container: 'bg-slate-900 border-slate-800 text-white shadow-xl',
                    accent: 'bg-teal-500',
                    title: 'text-white',
                    excerpt: 'text-slate-400',
                    meta: 'text-slate-500',
                    tag: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                };
            case 'হারানো-প্রাপ্তি':
                return {
                    container: 'bg-amber-50 border-amber-200 text-slate-800 shadow-md',
                    accent: 'bg-amber-500',
                    title: 'text-slate-900',
                    excerpt: 'text-slate-600',
                    meta: 'text-slate-400',
                    tag: 'bg-amber-100 text-amber-700 border-amber-200'
                };
            default:
                return {
                    container: 'bg-white/80 border-slate-200/60 text-slate-800 shadow-sm',
                    accent: 'bg-teal-600/10 group-hover:bg-teal-600',
                    title: 'text-slate-800 group-hover:text-teal-700',
                    excerpt: 'text-slate-500',
                    meta: 'text-slate-400',
                    tag: 'bg-slate-100 text-teal-700 border-slate-200/50'
                };
        }
    };

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
        <section className="py-16 bg-transparent overflow-hidden">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-teal-200">
                        <Bookmark size={28} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase text-teal-600 tracking-widest mb-1 flex items-center gap-2">
                            <span className="w-6 h-[2px] bg-teal-600" />
                            {unionName} ইউনিয়ন তথ্যকেন্দ্র
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 leading-tight">
                            ইউনিয়ন <span className="text-teal-600">নোটিশ বোর্ড</span>
                        </h2>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={prevSlide} 
                        disabled={TOTAL_NEWS <= CARDS_TO_SHOW}
                        className={`w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-200 transition-all active:scale-90 shadow-sm ${TOTAL_NEWS <= CARDS_TO_SHOW ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button 
                        onClick={nextSlide} 
                        disabled={TOTAL_NEWS <= CARDS_TO_SHOW}
                        className={`w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-200 transition-all active:scale-90 shadow-sm ${TOTAL_NEWS <= CARDS_TO_SHOW ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Notice Grid Slider */}
            <div className="relative">
                <motion.div 
                    className="flex gap-6"
                    animate={{ x: `calc(-${currentIndex * (100 / CARDS_TO_SHOW)}% - ${currentIndex * 1.5}rem)` }}
                    transition={{ type: "spring", stiffness: 200, damping: 26 }}
                >
                    {unionNews.map((news) => {
                        const styles = getCardStyles(news.category);
                        return (
                            <div 
                                key={news.id} 
                                className="w-full md:w-[calc(33.333%-1rem)] shrink-0"
                            >
                                <Link href={`/news/${news.slug}`} className="group block h-full">
                                    <div className={`backdrop-blur-sm h-full rounded-[32px] border p-8 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:border-teal-200 transition-all duration-500 relative flex flex-col ${styles.container}`}>
                                        
                                        {/* Sidebar Accent */}
                                        <div className={`absolute left-0 top-12 bottom-12 w-1.5 transition-colors rounded-r-full ${styles.accent}`} />

                                        <div className="pl-4">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${styles.meta}`}>
                                                    <Calendar size={14} className="text-teal-500" />
                                                    {news.date}
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${styles.tag}`}>
                                                    {news.category}
                                                </span>
                                            </div>

                                            <h3 className={`text-xl font-black leading-snug mb-4 transition-colors line-clamp-2 ${styles.title}`}>
                                                {news.title}
                                            </h3>
                                            
                                            <p className={`text-sm font-medium leading-relaxed mb-8 line-clamp-3 ${styles.excerpt}`}>
                                                {news.excerpt}
                                            </p>

                                            <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-100/10">
                                                <div className={`flex items-center gap-1.5 text-[10px] font-bold ${styles.meta}`}>
                                                    <MapPin size={12} className="text-teal-500" />
                                                    {news.village}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-black text-teal-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                                                    দেখুন <ArrowRight size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </motion.div>
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-12">
                {unionNews.slice(0, Math.max(1, TOTAL_NEWS - CARDS_TO_SHOW + 1)).map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentIndex ? 'w-10 bg-teal-600' : 'w-1.5 bg-slate-300'
                        }`}
                    />
                ))}
            </div>

        </section>
    );
}

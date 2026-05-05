'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
    HelpCircle, MapPin, Calendar, Phone, 
    ArrowRight, AlertCircle, CheckCircle2, 
    Loader2, Package, Tag, Clock, Star
} from 'lucide-react';
import Link from 'next/link';
import { lostFoundService } from '@/lib/services/lostFoundService';

export default function GlobalLostFoundSection() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('all');

    const TIMEFRAMES = [
        { id: 'all', label: 'সবগুলো' },
        { id: 'today', label: 'আজকের' },
        { id: '7days', label: '৭ দিন' },
        { id: '15days', label: '১৫ দিন' },
        { id: '30days', label: '৩০ দিন' },
    ];

    const isFirstRun = useRef(true);

    const fetchGlobalPosts = async () => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
        }
        setLoading(true);
        console.log("Fetching global lost & found with timeframe:", timeframe, "from URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
        try {
            const data = await lostFoundService.getGlobalPosts(1, 6, timeframe);
            setPosts(data || []);
        } catch (err) {
            console.error("Error fetching global lost & found:", err);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGlobalPosts();
    }, [timeframe]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-amber-600" size={32} />
            </div>
        );
    }

    if (posts.length === 0 && !loading) {
        return (
            <section className="dg-section-x py-20 text-center">
                <div className="max-w-md mx-auto p-8 rounded-[32px] bg-slate-50 border border-slate-200">
                    <HelpCircle className="mx-auto text-slate-400 mb-4" size={48} />
                    <h3 className="text-xl font-black text-slate-800 mb-2">বিজ্ঞপ্তি লোড করা সম্ভব হয়নি</h3>
                    <p className="text-slate-500 text-sm mb-6">সার্ভারের সাথে সংযোগ স্থাপন করা যাচ্ছে না। দয়া করে আবার চেষ্টা করুন।</p>
                    <button 
                        onClick={() => fetchGlobalPosts()}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-amber-600 transition-colors"
                    >
                        আবার চেষ্টা করুন
                    </button>
                </div>
            </section>
        );
    }

    const featured = posts[0];
    const sidePosts = posts.slice(1, 6);

    return (
        <section className="dg-section-x py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                
                {/* ── Section Header ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="max-w-2xl">
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6 backdrop-blur-md"
                        >
                            <AlertCircle size={14} className="fill-current" />
                            সতর্কতা ও সহায়তা
                        </motion.div>
                        <motion.h2 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]"
                        >
                            হারানো ও <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">প্রাপ্তি সংবাদ</span>
                        </motion.h2>
                    </div>
                    
                    <div className="flex flex-col items-start md:items-end gap-6">
                        <div className="flex items-center bg-slate-100/80 p-1.5 rounded-[20px] border border-slate-200/60 backdrop-blur-sm">
                            {TIMEFRAMES.map((tf) => (
                                <button
                                    key={tf.id}
                                    onClick={() => setTimeframe(tf.id)}
                                    className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                                        timeframe === tf.id 
                                            ? 'bg-white text-amber-600 shadow-[0_4px_12px_rgba(245,158,11,0.2)] scale-[1.05]' 
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {tf.label}
                                </button>
                            ))}
                        </div>

                        <Link 
                            href="/lost-found"
                            className="group inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-900 text-white text-[13px] font-black hover:bg-amber-600 transition-all duration-300 shadow-xl shadow-slate-900/10 active:scale-95"
                        >
                            সব বিজ্ঞপ্তি দেখুন
                            <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* ── Layout: Featured Left + Side Right ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                    
                    {/* Featured card — takes 2/5 on desktop */}
                    {featured && (
                        <div className="lg:col-span-2">
                            <Link 
                                href={featured.location_details?.slug ? `/u/${featured.location_details.slug}?service=lost-found&post=${featured.id}` : '#'}
                                className="group block relative"
                            >
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className={`relative overflow-hidden rounded-[40px] border-2 bg-white p-8 transition-all duration-500 hover:shadow-[0_32px_64px_-16px_rgba(245,158,11,0.15)] ${featured.type === 'lost' ? 'border-orange-100 hover:border-orange-300' : 'border-emerald-100 hover:border-emerald-300'}`}
                                >
                                    {/* Image or Placeholder */}
                                    <div className="relative h-64 sm:h-80 rounded-[32px] overflow-hidden mb-8 bg-slate-100">
                                        {featured.image_url ? (
                                            <>
                                                <img 
                                                    src={featured.image_url} 
                                                    alt={featured.title} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                                <div className={`hidden w-full h-full items-center justify-center bg-gradient-to-br ${featured.type === 'lost' ? 'from-orange-50 to-orange-100' : 'from-emerald-50 to-emerald-100'}`}>
                                                    <Package size={64} className={`${featured.type === 'lost' ? 'text-orange-200' : 'text-emerald-200'}`} />
                                                </div>
                                            </>
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${featured.type === 'lost' ? 'from-orange-50 to-orange-100' : 'from-emerald-50 to-emerald-100'}`}>
                                                <Package size={64} className={`${featured.type === 'lost' ? 'text-orange-200' : 'text-emerald-200'}`} />
                                            </div>
                                        )}
                                        <div className={`absolute top-5 left-5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${featured.type === 'lost' ? 'bg-orange-500' : 'bg-emerald-500'}`}>
                                            {featured.type === 'lost' ? 'হারিয়ে গেছে' : 'কুড়িয়ে পাওয়া'}
                                        </div>
                                        <div className="absolute top-5 right-5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[9px] font-black text-slate-800 uppercase tracking-widest shadow-lg border border-white/20">
                                            গ্লোবাল নিউজ
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                                            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-amber-500" /> {featured.event_date}</span>
                                            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-amber-500" /> {featured.location_details?.name_bn}</span>
                                        </div>
                                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight group-hover:text-amber-700 transition-colors uppercase">
                                            {featured.title}
                                        </h3>
                                        <p className="text-slate-500 font-medium leading-relaxed line-clamp-3">
                                            {featured.description}
                                        </p>
                                        
                                        <div className="pt-6 flex items-center justify-between border-t border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                                    <Tag size={14} className="text-amber-600" />
                                                </div>
                                                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{featured.category}</span>
                                            </div>
                                            <span className="inline-flex items-center gap-2 text-sm font-black text-amber-600 group-hover:gap-3 transition-all">
                                                বিস্তারিত <ArrowRight size={16} />
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        </div>
                    )}

                    {/* Side list — takes 3/5 on desktop */}
                    <div className="lg:col-span-3 flex flex-col gap-4">
                        {sidePosts.map((post, idx) => (
                            <Link 
                                key={post.id}
                                href={post.location_details?.slug ? `/u/${post.location_details.slug}?service=lost-found&post=${post.id}` : '#'}
                                className="group block"
                            >
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.08 }}
                                    className={`flex gap-5 p-5 rounded-[28px] border-2 bg-white transition-all duration-300 hover:shadow-[0_12px_28px_-8px_rgba(15,23,42,0.1)] ${post.type === 'lost' ? 'border-orange-50 hover:border-orange-200' : 'border-emerald-50 hover:border-emerald-200'}`}
                                >
                                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                                        {post.image_url ? (
                                            <>
                                                <img 
                                                    src={post.image_url} 
                                                    alt="" 
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                                <div className={`hidden w-full h-full items-center justify-center bg-gradient-to-br ${post.type === 'lost' ? 'from-orange-50 to-orange-100' : 'from-emerald-50 to-emerald-100'}`}>
                                                    <Package size={32} className={`${post.type === 'lost' ? 'text-orange-200' : 'text-emerald-200'}`} />
                                                </div>
                                            </>
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${post.type === 'lost' ? 'from-orange-50 to-orange-100' : 'from-emerald-50 to-emerald-100'}`}>
                                                <Package size={32} className={`${post.type === 'lost' ? 'text-orange-200' : 'text-emerald-200'}`} />
                                            </div>
                                        )}
                                        <div className={`absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex flex-col justify-center min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest text-white ${post.type === 'lost' ? 'bg-orange-500' : 'bg-emerald-500'}`}>
                                                {post.type === 'lost' ? 'হারানো' : 'প্রাপ্তি'}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-600 uppercase tracking-widest">
                                                <Star size={10} className="fill-current" />
                                                {post.location_details?.name_bn || 'ইউনিয়ন'}
                                            </span>
                                        </div>
                                        <h4 className="text-base sm:text-lg font-black text-slate-800 leading-tight line-clamp-2 group-hover:text-amber-700 transition-colors uppercase">
                                            {post.title}
                                        </h4>
                                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 mt-3">
                                            <span className="flex items-center gap-1"><Calendar size={12} className="text-amber-500" /> {post.event_date}</span>
                                            <span className="flex items-center gap-1"><Clock size={12} className="text-amber-500" /> ২ মিনিট আগে</span>
                                        </div>
                                    </div>

                                    <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4 transition-all duration-300">
                                        <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg">
                                            <ArrowRight size={18} />
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}

                        {posts.length >= 6 && (
                            <Link 
                                href="/lost-found"
                                className="mt-4 flex items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-black text-sm hover:border-amber-500 hover:text-amber-600 transition-all group"
                            >
                                আরও সকল হারানো ও প্রাপ্তি সংবাদ দেখুন
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

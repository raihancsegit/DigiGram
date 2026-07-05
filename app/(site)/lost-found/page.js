'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
    HelpCircle, MapPin, Calendar, Phone, 
    ArrowRight, AlertCircle, CheckCircle2, 
    Loader2, Package, Tag, Clock, Search, Filter, Star, Bookmark, ChevronLeft, ChevronRight, TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { lostFoundService } from '@/lib/services/lostFoundService';
import LostFoundDetailView from '@/components/templates/LostFoundDetailView';
import RelatedServiceLinks from '@/components/common/RelatedServiceLinks';

function GlobalLostFoundPageContent() {
    const searchParams = useSearchParams();
    const postId = searchParams.get('post');
    const [post, setPost] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [totalCount, setTotalCount] = useState(0);

    const toBnDate = (value) => {
        if (!value) return '-';
        try {
            return new Date(value).toLocaleDateString('bn-BD');
        } catch {
            return value;
        }
    };

    const TIMEFRAMES = [
        { id: 'all', label: 'সবগুলো' },
        { id: 'today', label: 'আজকের' },
        { id: '7days', label: '৭ দিন' },
        { id: '15days', label: '১৫ দিন' },
        { id: '30days', label: '৩০ দিন' },
    ];

    useEffect(() => {
        if (postId) {
            const fetchPost = async () => {
                setLoading(true);
                try {
                    const data = await lostFoundService.getPostById(postId);
                    setPost(data);
                } catch (err) {
                    console.error("Error fetching post:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchPost();
            return;
        }

        const delay = setTimeout(() => {
            const fetchGlobalPosts = async () => {
                setLoading(true);
                try {
                    const result = await lostFoundService.getGlobalPosts(page, pageSize, timeframe, searchQuery, typeFilter, true);
                    setPosts(result.data || []);
                    setTotalCount(result.count || 0);
                } catch (err) {
                    console.error("Error fetching global lost & found:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchGlobalPosts();
        }, 300);

        return () => clearTimeout(delay);
    }, [postId, timeframe, page, pageSize, searchQuery, typeFilter]);

    useEffect(() => {
        setPage(1);
    }, [timeframe, pageSize, searchQuery, typeFilter]);

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const resultStart = totalCount === 0 ? 0 : ((page - 1) * pageSize) + 1;
    const resultEnd = Math.min(page * pageSize, totalCount);

    if (postId && post) {
        return <LostFoundDetailView post={post} />;
    }

    if (postId && loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-amber-500" />
            </div>
        );
    }

    if (postId && !post) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 rounded-[32px] bg-slate-100 flex items-center justify-center mb-6">
                    <Package size={48} className="text-slate-400" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">পোস্ট পাওয়া যায়নি</h1>
                <p className="text-slate-500 font-bold max-w-sm">এই পোস্টটি আর উপলব্ধ নেই বা অন্য কোনো সমস্যার কারণে সরিয়ে ফেলা হয়েছে।</p>
                <Link href="/lost-found" className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl shadow-slate-200">
                    সব পোস্ট দেখুন
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 pb-24">
            {/* ── Header ── */}
            <div className="bg-slate-900 pt-32 pb-24 relative overflow-hidden rounded-b-[60px] md:rounded-b-[100px]">
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-600 rounded-full blur-[150px] translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-600 rounded-full blur-[150px] -translate-x-1/2 translate-y-1/2" />
                </div>
                
                <div className="dg-section-x max-w-7xl mx-auto px-4 relative z-10 text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/10 text-amber-400 text-[11px] font-black uppercase tracking-[0.3em] border border-white/10 mb-8 backdrop-blur-md">
                            <Bookmark size={18} /> হারানো ও প্রাপ্তি আপডেট
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-8">
                            হারানো ও <span className="text-amber-400">প্রাপ্তি সংবাদ</span>
                        </h1>
                        <p className="max-w-3xl mx-auto text-slate-400 text-lg font-bold leading-relaxed">
                            সারাদেশের সকল ইউনিয়নের গ্লোবাল হারানো ও প্রাপ্তি বিজ্ঞপ্তিগুলো এক পলকে দেখুন। ছবির অভাবে কালো ব্যাকগ্রাউন্ড ব্যবহার করা হবে।
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="dg-section-x max-w-7xl mx-auto px-4 -mt-8 relative z-20 flex flex-col xl:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap gap-1.5 items-center bg-white p-1.5 rounded-full shadow-xl shadow-slate-200 border border-slate-100 overflow-x-auto max-w-full scrollbar-hide">
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

                <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                <div className="flex rounded-full bg-white p-1.5 shadow-xl shadow-slate-200 border border-slate-100">
                    {[
                        ['all', 'সব'],
                        ['lost', 'হারানো'],
                        ['found', 'প্রাপ্তি']
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setTypeFilter(value)}
                            className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === value ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="relative group w-full sm:w-72">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="বিজ্ঞপ্তি খুঁজুন..."
                        className="w-full pl-10 pr-5 py-2.5 rounded-full bg-white border border-slate-200 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-none text-[10px] font-black shadow-xl shadow-slate-200 transition-all placeholder:text-slate-400"
                    />
                </div>
                </div>
            </div>

            {/* ── Posts Container ── */}
            <div className="dg-section-x max-w-7xl mx-auto px-4 mt-8">
                <RelatedServiceLinks
                    currentKey="lost-found"
                    preset="lostFound"
                    title="হারানো-প্রাপ্তির সাথে দরকারি কাজ"
                    subtitle="Report করার পর Citizen Center, জরুরি নম্বর বা বাজার update-এ দ্রুত যান।"
                />
            </div>

            <div className="dg-section-x max-w-7xl mx-auto px-4 mt-10">
                <div className="rounded-[40px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-8 md:px-10 py-8 border-b border-slate-200 bg-slate-50/50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-none">বিজ্ঞপ্তি তালিকা</h3>
                                <p className="mt-2 text-slate-500 font-bold text-xs">সমগ্র বাংলাদেশ থেকে সর্বশেষ বিজ্ঞপ্তিসমূহ</p>
                            </div>
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-200">
                                <Calendar size={12} className="text-amber-400" /> পেজ: {page} / {totalPages}
                            </span>
                        </div>
                        <div className="mt-5 flex flex-col gap-3 rounded-[24px] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs font-black text-slate-500">
                                মোট {totalCount.toLocaleString('bn-BD')}টি বিজ্ঞপ্তি
                                {totalCount > 0 && <span> · {resultStart.toLocaleString('bn-BD')}-{resultEnd.toLocaleString('bn-BD')} দেখানো হচ্ছে</span>}
                            </p>
                            <select
                                value={pageSize}
                                onChange={(event) => setPageSize(Number(event.target.value))}
                                className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-xs font-black text-slate-600 outline-none"
                            >
                                {[12, 24, 48].map((size) => (
                                    <option key={size} value={size}>{size.toLocaleString('bn-BD')} করে</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="p-4 md:p-12">
                        {posts.length === 0 && !loading ? (
                            <div className="rounded-[40px] bg-slate-50 border-2 border-dashed border-slate-200 p-20 text-center">
                                <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
                                <p className="text-xl font-black text-slate-800">কোন বিজ্ঞপ্তি পাওয়া যায়নি</p>
                                <p className="mt-2 text-slate-500 font-bold">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {posts.map((item, idx) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx % 3 * 0.1 }}
                                    >
                                        <Link href={`/lost-found?post=${item.id}`} className="group block h-full">
                                            <div className="h-full overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-amber-200 flex flex-col">
                                                <div className="relative h-56 bg-slate-950 overflow-hidden shrink-0">
                                                    {item.image_url ? (
                                                        <img 
                                                            src={item.image_url} 
                                                            alt={item.title} 
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center opacity-20">
                                                            <Package size={48} className="text-white" />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-4 right-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg ${
                                                            item.type === 'lost' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                        }`}>
                                                            {item.type === 'lost' ? 'হারানো' : 'প্রাপ্তি'}
                                                        </span>
                                                    </div>
                                                    <div className="absolute bottom-4 left-4">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-[10px] font-black text-white border border-white/10 shadow-lg">
                                                            <MapPin size={12} className="text-amber-400" />
                                                            {item.location_details?.name_bn || 'প্রশাসন'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="p-8 flex-1 flex flex-col">
                                                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                                                        <Calendar size={14} className="text-amber-500" />
                                                        {toBnDate(item.created_at)}
                                                    </div>
                                                    <h3 className="text-xl font-black text-slate-800 leading-tight mb-4 group-hover:text-amber-600 transition-colors line-clamp-2">
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 font-bold leading-relaxed mb-6 line-clamp-3">
                                                        {item.description}
                                                    </p>
                                                    
                                                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between text-xs font-black text-amber-600">
                                                        <span className="uppercase tracking-widest opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">বিস্তারিত দেখুন</span>
                                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
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

                    {totalCount > 0 && (
                        <div className="flex flex-col items-center justify-center gap-4 py-12 bg-slate-50/50 border-t border-slate-100 sm:flex-row">
                            <button 
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                disabled={loading || page <= 1}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-[0.15em] hover:bg-amber-600 hover:text-white transition-all active:scale-95 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600"
                            >
                                <ChevronLeft size={18} />
                                আগের পৃষ্ঠা
                            </button>
                            <span className="rounded-full bg-slate-900 px-5 py-3 text-xs font-black text-white">
                                {page.toLocaleString('bn-BD')} / {totalPages.toLocaleString('bn-BD')}
                            </span>
                            <button 
                                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={loading || page >= totalPages}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white font-black text-xs uppercase tracking-[0.15em] hover:bg-amber-600 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-40"
                            >
                                পরের পৃষ্ঠা
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

export default function GlobalLostFoundPage() {
    return (
        <Suspense
            fallback={(
                <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                    <Loader2 size={40} className="animate-spin text-amber-500" />
                </div>
            )}
        >
            <GlobalLostFoundPageContent />
        </Suspense>
    );
}

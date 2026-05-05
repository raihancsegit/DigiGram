'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
    HelpCircle, MapPin, Calendar, Phone, 
    ArrowRight, AlertCircle, CheckCircle2, 
    Loader2, Package, Tag, Clock, Search, Filter, Star
} from 'lucide-react';
import Link from 'next/link';
import { lostFoundService } from '@/lib/services/lostFoundService';
import LostFoundDetailView from '@/components/templates/LostFoundDetailView';

export default function GlobalLostFoundPage() {
    const searchParams = useSearchParams();
    const postId = searchParams.get('post');
    const [post, setPost] = useState(null);
    const [posts, setPosts] = useState([]);
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
        } else {
            const fetchGlobalPosts = async () => {
                setLoading(true);
                try {
                    const data = await lostFoundService.getGlobalPosts(page, 12, timeframe);
                    if (page === 1) {
                        setPosts(data || []);
                    } else {
                        setPosts(prev => [...prev, ...(data || [])]);
                    }
                    setHasMore(data.length === 12);
                } catch (err) {
                    console.error("Error fetching global lost & found:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchGlobalPosts();
        }
    }, [postId, timeframe, page]);

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
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <Package size={80} className="text-slate-400 mb-4" />
                <h1 className="text-2xl font-black text-slate-900 mb-2">পোস্ট পাওয়া যায়নি</h1>
                <p className="text-slate-500">এই পোস্টটি আর উপলব্ধ নেই বা মুছে ফেলা হয়েছে।</p>
                <Link href="/lost-found" className="mt-6 px-6 py-3 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-400 transition-colors">
                    সব পোস্ট দেখুন
                </Link>
            </div>
        );
    }

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
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                            <AlertCircle size={12} className="fill-current" />
                            সতর্কতা ও সহায়তা
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
                            হারানো ও <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">প্রাপ্তি সংবাদ</span>
                        </h1>
                        <p className="text-slate-500 text-lg font-bold">সারাদেশের সকল ইউনিয়নের হারানো ও প্রাপ্তি বিজ্ঞপ্তিগুলো এখানে দেখুন</p>
                    </motion.div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
                    <Package size={400} className="text-slate-900" />
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
                                        ? 'bg-white text-amber-600 shadow-md scale-[1.02]' 
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
                                placeholder="বিজ্ঞপ্তি খুঁজুন..."
                                className="pl-11 pr-6 py-2.5 rounded-2xl bg-slate-100 border-none focus:ring-2 focus:ring-amber-500 text-sm font-bold w-64"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Posts Grid ── */}
            <div className="dg-section-x max-w-7xl mx-auto px-4 mt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post, idx) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx % 3 * 0.1 }}
                        >
                            <Link 
                                href={post.location_details?.slug ? `/u/${post.location_details.slug}?service=lost-found&post=${post.id}` : '#'}
                                className="group block"
                            >
                                <div className={`relative overflow-hidden rounded-[40px] border-2 bg-white p-8 transition-all duration-500 hover:shadow-2xl ${post.type === 'lost' ? 'border-orange-50 hover:border-orange-200' : 'border-emerald-50 hover:border-emerald-200'}`}>
                                    {/* Image or Fallback */}
                                    <div className="relative h-64 rounded-[32px] overflow-hidden mb-8 bg-slate-100">
                                        {post.image_url ? (
                                            <>
                                                <img 
                                                    src={post.image_url} 
                                                    alt={post.title} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                                <div className={`hidden w-full h-full items-center justify-center bg-gradient-to-br ${post.type === 'lost' ? 'from-orange-50 to-orange-100' : 'from-emerald-50 to-emerald-100'}`}>
                                                    <Package size={64} className={`${post.type === 'lost' ? 'text-orange-200' : 'text-emerald-200'}`} />
                                                </div>
                                            </>
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${post.type === 'lost' ? 'from-orange-50 to-orange-100' : 'from-emerald-50 to-emerald-100'}`}>
                                                <Package size={64} className={`${post.type === 'lost' ? 'text-orange-200' : 'text-emerald-200'}`} />
                                            </div>
                                        )}
                                        <div className={`absolute top-5 left-5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${post.type === 'lost' ? 'bg-orange-500' : 'bg-emerald-500'}`}>
                                            {post.type === 'lost' ? 'হারিয়ে গেছে' : 'কুড়িয়ে পাওয়া'}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600">
                                                <Star size={10} className="fill-current" />
                                                {post.location_details?.name_bn || 'গ্লোবাল'}
                                            </span>
                                            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-amber-500" /> {post.event_date}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-amber-700 transition-colors uppercase">
                                            {post.title}
                                        </h3>
                                        <p className="text-slate-500 font-medium leading-relaxed line-clamp-3">
                                            {post.description}
                                        </p>
                                        
                                        <div className="pt-6 flex items-center justify-between border-t border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <Tag size={14} className="text-amber-600" />
                                                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{post.category}</span>
                                            </div>
                                            <span className="inline-flex items-center gap-2 text-sm font-black text-amber-600 group-hover:gap-3 transition-all">
                                                বিস্তারিত <ArrowRight size={16} />
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
                        <Loader2 className="animate-spin text-amber-600" size={32} />
                    </div>
                )}

                {/* Load More */}
                {!loading && hasMore && (
                    <div className="mt-16 flex justify-center">
                        <button 
                            onClick={() => setPage(prev => prev + 1)}
                            className="px-10 py-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-amber-600 transition-all shadow-xl active:scale-95"
                        >
                            আরও বিজ্ঞপ্তি দেখুন
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}

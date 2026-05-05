'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight, Bookmark, AlertCircle, Loader2 } from 'lucide-react';
import Pagination from '@/components/common/Pagination';
import { newsService } from '@/lib/services/newsService';
import { lostFoundService } from '@/lib/services/lostFoundService';

const TIMEFRAMES = [
    { id: 'all', label: 'সবগুলো' },
    { id: 'today', label: 'আজকের' },
    { id: '7days', label: '৭ দিন' },
    { id: '15days', label: '১৫ দিন' },
    { id: '30days', label: '৩০ দিন' },
];

const NEWS_PAGE_SIZE = 6;
const LOST_FOUND_PAGE_SIZE = 6;

const toBnDate = (value) => {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleDateString('bn-BD');
    } catch {
        return value;
    }
};

const placeholderImage = (
    <div className="absolute inset-0 bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
            <div className="text-5xl font-black opacity-80">?</div>
            <div className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-400">ইমেজ নেই</div>
        </div>
    </div>
);

function DataCard({ item, type }) {
    const title = item.title || item.name || 'বিস্তারিত জানুন';
    const description = item.excerpt || item.description || item.content || 'কোন বিবরণ পাওয়া যায়নি';
    const category = type === 'news' ? (item.category || 'নোটিশ') : (item.type === 'lost' ? 'হারানো' : 'প্রাপ্তি');
    const imageUrl = item.image_url || item.image || null;
    const linkHref = type === 'news'
        ? `/news/${item.slug || item.id}`
        : item.location_details?.slug
            ? `/u/${item.location_details.slug}?service=lost-found&post=${item.id}`
            : `/lost-found?post=${item.id}`;

    return (
        <Link href={linkHref} className="group block">
            <div className="h-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-48 bg-slate-950 overflow-hidden">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : placeholderImage}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/90 to-transparent" />
                    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 shadow-sm backdrop-blur-sm">
                        {category}
                    </div>
                    {item.is_global && (
                        <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg">
                            গ্লোবাল
                        </div>
                    )}
                </div>
                <div className="p-6">
                    <h3 className="text-lg font-black text-slate-900 leading-tight line-clamp-2 mb-3">{title}</h3>
                    <p className="text-sm text-slate-500 leading-6 line-clamp-3">{description}</p>
                    <div className="mt-5 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.18em] text-slate-400 font-black">
                        <span className="inline-flex items-center gap-2">
                            <Calendar size={14} /> {toBnDate(item.created_at || item.updated_at)}
                        </span>
                        <span className="inline-flex items-center gap-2 text-slate-700">
                            বিস্তারিত <ArrowRight size={14} />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function GlobalUpdatesSection() {
    const [timeframe, setTimeframe] = useState('all');
    const [newsPage, setNewsPage] = useState(1);
    const [lostPage, setLostPage] = useState(1);

    const [newsItems, setNewsItems] = useState([]);
    const [newsTotal, setNewsTotal] = useState(0);
    const [lostItems, setLostItems] = useState([]);
    const [lostTotal, setLostTotal] = useState(0);

    const [newsLoading, setNewsLoading] = useState(true);
    const [lostLoading, setLostLoading] = useState(true);

    const fetchNews = async (page = 1, timeframeValue = timeframe) => {
        setNewsLoading(true);
        try {
            const { data, count } = await newsService.getNews(null, page, NEWS_PAGE_SIZE, true, timeframeValue);
            setNewsItems(data || []);
            setNewsTotal(count || (data?.length || 0));
        } catch (error) {
            console.error('Global news fetch error:', error);
            setNewsItems([]);
            setNewsTotal(0);
        } finally {
            setNewsLoading(false);
        }
    };

    const fetchLostPosts = async (page = 1, timeframeValue = timeframe) => {
        setLostLoading(true);
        try {
            const { data, count } = await lostFoundService.getPosts(null, page, LOST_FOUND_PAGE_SIZE, true, timeframeValue);
            setLostItems(data || []);
            setLostTotal(count || (data?.length || 0));
        } catch (error) {
            console.error('Global lost & found fetch error:', error);
            setLostItems([]);
            setLostTotal(0);
        } finally {
            setLostLoading(false);
        }
    };

    useEffect(() => {
        setNewsPage(1);
        setLostPage(1);
        fetchNews(1, timeframe);
        fetchLostPosts(1, timeframe);
    }, [timeframe]);

    useEffect(() => {
        fetchNews(newsPage, timeframe);
    }, [newsPage]);

    useEffect(() => {
        fetchLostPosts(lostPage, timeframe);
    }, [lostPage]);

    const isLoading = newsLoading || lostLoading;

    return (
        <section className="py-20 bg-slate-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-teal-500/10 text-teal-700 text-[10px] font-black uppercase tracking-[0.28em] border border-teal-200/70 mb-4">
                            <Bookmark size={16} /> গ্লোবাল আপডেট
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                            সর্বশেষ সংবাদ ও গুরুত্বপূর্ণ ঘোষণা
                        </h2>
                        <p className="mt-4 max-w-2xl text-slate-500">
                            শুধু গ্লোবাল খবর ও বিজ্ঞপ্তি দেখুন। ছবির অভাবে কালো ব্যাকগ্রাউন্ড ব্যবহার করা হবে এবং পেজিনেশন + টাইমফ্রেম ফিল্টার সব জায়গায় থাকবে।
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                        {TIMEFRAMES.map((tf) => (
                            <button
                                key={tf.id}
                                onClick={() => setTimeframe(tf.id)}
                                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === tf.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-16">
                    <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="px-8 py-8 border-b border-slate-200 bg-slate-50">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">গ্লোবাল সংবাদ ও গুরুত্বপূর্ণ ঘোষণা</h3>
                                    <p className="mt-2 text-sm text-slate-500">সমস্ত ইউনিয়নের গ্লোবাল প্রকাশিত সংবাদগুলো এখানে দেখুন।</p>
                                </div>
                                <span className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em]">
                                    <Calendar size={14} /> পেজ: {newsPage}
                                </span>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="py-24 flex justify-center items-center">
                                <Loader2 className="animate-spin text-teal-600" size={32} />
                            </div>
                        ) : (
                            <div className="p-8">
                                {newsItems.length === 0 ? (
                                    <div className="rounded-[32px] bg-slate-50 border border-slate-200 p-12 text-center text-slate-500">
                                        <AlertCircle size={32} className="mx-auto mb-4 text-slate-400" />
                                        <p className="font-black text-slate-700">কোন গ্লোবাল সংবাদ পাওয়া যায়নি</p>
                                        <p className="mt-2 text-sm">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {newsItems.map((item) => (
                                            <DataCard key={item.id} item={item} type="news" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <Pagination
                            currentPage={newsPage}
                            totalCount={newsTotal}
                            pageSize={NEWS_PAGE_SIZE}
                            onPageChange={(page) => setNewsPage(page)}
                        />
                    </div>

                    <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="px-8 py-8 border-b border-slate-200 bg-slate-50">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">হারানো ও প্রাপ্তি সংবাদ</h3>
                                    <p className="mt-2 text-sm text-slate-500">শুধু গ্লোবাল হারানো/প্রাপ্তি পোস্ট দেখুন।</p>
                                </div>
                                <span className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em]">
                                    <Calendar size={14} /> পেজ: {lostPage}
                                </span>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="py-24 flex justify-center items-center">
                                <Loader2 className="animate-spin text-amber-600" size={32} />
                            </div>
                        ) : (
                            <div className="p-8">
                                {lostItems.length === 0 ? (
                                    <div className="rounded-[32px] bg-slate-50 border border-slate-200 p-12 text-center text-slate-500">
                                        <AlertCircle size={32} className="mx-auto mb-4 text-slate-400" />
                                        <p className="font-black text-slate-700">কোন গ্লোবাল হারানো/প্রাপ্তি পোস্ট নেই</p>
                                        <p className="mt-2 text-sm">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {lostItems.map((item) => (
                                            <DataCard key={item.id} item={item} type="lostfound" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <Pagination
                            currentPage={lostPage}
                            totalCount={lostTotal}
                            pageSize={LOST_FOUND_PAGE_SIZE}
                            onPageChange={(page) => setLostPage(page)}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

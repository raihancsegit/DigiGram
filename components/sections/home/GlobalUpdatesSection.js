'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Bookmark, Calendar, Loader2 } from 'lucide-react';
import Pagination from '@/components/common/Pagination';
import { newsService } from '@/lib/services/newsService';
import { lostFoundService } from '@/lib/services/lostFoundService';
import { repairMojibakeText } from '@/lib/utils/textEncoding';

const TIMEFRAMES = [
    { id: 'all', label: 'সবগুলো' },
    { id: 'today', label: 'আজকের' },
    { id: '7days', label: '৭ দিন' },
    { id: '15days', label: '১৫ দিন' },
    { id: '30days', label: '৩০ দিন' },
];

const PAGE_SIZE = 6;
const cleanText = (value, fallback) => repairMojibakeText(value) || fallback;

function toBnDate(value) {
    if (!value) return 'তারিখ নেই';
    try {
        return new Date(value).toLocaleDateString('bn-BD');
    } catch {
        return cleanText(value, 'তারিখ নেই');
    }
}

function DataCard({ item, type }) {
    const title = cleanText(item.title || item.name, 'বিস্তারিত জানুন');
    const description = cleanText(item.excerpt || item.description || item.content, 'কোনো বিবরণ পাওয়া যায়নি');
    const category = cleanText(
        type === 'news' ? item.category : (item.type === 'lost' ? 'হারানো' : 'প্রাপ্তি'),
        type === 'news' ? 'নোটিশ' : 'হারানো-প্রাপ্তি'
    );
    const imageUrl = item.image_url || item.image || null;
    const href = type === 'news'
        ? `/news/${item.slug || item.id}`
        : item.location_details?.slug
            ? `/u/${item.location_details.slug}?service=lost-found&post=${item.id}`
            : `/lost-found?post=${item.id}`;

    return (
        <Link href={href} className="group block h-full">
            <article className="h-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-48 overflow-hidden bg-slate-950">
                    {imageUrl ? (
                        <img src={imageUrl} alt={title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                            <Bookmark size={42} />
                            <span className="mt-3 text-xs font-black tracking-widest">ছবি নেই</span>
                        </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/90 to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black text-slate-800 shadow-sm">
                        {category}
                    </span>
                    {item.is_global && (
                        <span className="absolute right-4 top-4 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-700 shadow-sm">
                            সারাদেশ
                        </span>
                    )}
                </div>
                <div className="p-5 md:p-6">
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Calendar size={15} className="text-teal-500" />
                        {toBnDate(item.created_at || item.updated_at)}
                    </div>
                    <h3 className="line-clamp-2 text-lg font-black leading-tight text-slate-900">{title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-slate-500">{description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-teal-700">
                        বিস্তারিত দেখুন <ArrowRight size={15} />
                    </span>
                </div>
            </article>
        </Link>
    );
}

function FeedPanel({ title, subtitle, items, loading, page, total, onPageChange, type }) {
    return (
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-6 md:px-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 md:text-2xl">{title}</h3>
                        <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
                    </div>
                    <span className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white">পৃষ্ঠা {page}</span>
                </div>
            </div>
            <div className="p-4 sm:p-8">
                {loading ? (
                    <div className="flex h-52 items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={32} /></div>
                ) : items.length ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {items.map((item) => <DataCard key={item.id} item={item} type={type} />)}
                    </div>
                ) : (
                    <div className="rounded-3xl bg-slate-50 p-12 text-center text-slate-500">
                        <AlertCircle className="mx-auto mb-3" />
                        <p className="font-black">এই সময়ের কোনো তথ্য পাওয়া যায়নি</p>
                    </div>
                )}
            </div>
            <Pagination currentPage={page} totalCount={total} pageSize={PAGE_SIZE} onPageChange={onPageChange} />
        </div>
    );
}

export default function GlobalUpdatesSection() {
    const [timeframe, setTimeframe] = useState('all');
    const [newsPage, setNewsPage] = useState(1);
    const [lostPage, setLostPage] = useState(1);
    const [newsState, setNewsState] = useState({ items: [], total: 0, loading: true });
    const [lostState, setLostState] = useState({ items: [], total: 0, loading: true });

    const loadNews = useCallback(async () => {
        setNewsState((state) => ({ ...state, loading: true }));
        try {
            const { data = [], count = 0 } = await newsService.getNews(null, newsPage, PAGE_SIZE, true, timeframe);
            setNewsState({ items: data, total: count || data.length, loading: false });
        } catch (error) {
            console.error('Global news fetch error:', error);
            setNewsState({ items: [], total: 0, loading: false });
        }
    }, [newsPage, timeframe]);

    const loadLost = useCallback(async () => {
        setLostState((state) => ({ ...state, loading: true }));
        try {
            const { data = [], count = 0 } = await lostFoundService.getPosts(null, lostPage, PAGE_SIZE, true, timeframe);
            setLostState({ items: data, total: count || data.length, loading: false });
        } catch (error) {
            console.error('Global lost-and-found fetch error:', error);
            setLostState({ items: [], total: 0, loading: false });
        }
    }, [lostPage, timeframe]);

    useEffect(() => { loadNews(); }, [loadNews]);
    useEffect(() => { loadLost(); }, [loadLost]);

    function changeTimeframe(value) {
        setTimeframe(value);
        setNewsPage(1);
        setLostPage(1);
    }

    return (
        <section className="overflow-hidden bg-slate-50 py-12 md:py-20">
            <div className="mx-auto max-w-7xl px-4">
                <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-xs font-black text-teal-700 ring-1 ring-teal-100">
                            <Bookmark size={15} /> সর্বশেষ আপডেট
                        </p>
                        <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-5xl">সংবাদ, ঘোষণা ও হারানো-প্রাপ্তি</h2>
                        <p className="mt-3 max-w-2xl font-medium leading-7 text-slate-500">নিজ এলাকার জরুরি খবর, গুরুত্বপূর্ণ ঘোষণা এবং হারানো-প্রাপ্তির তথ্য সহজে দেখুন।</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {TIMEFRAMES.map((option) => (
                            <button key={option.id} onClick={() => changeTimeframe(option.id)} className={`rounded-2xl px-4 py-2 text-xs font-black transition ${timeframe === option.id ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-300'}`}>
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-12">
                    <FeedPanel title="সর্বশেষ সংবাদ ও ঘোষণা" subtitle="সারাদেশের প্রকাশিত গুরুত্বপূর্ণ সংবাদ" {...newsState} page={newsPage} onPageChange={setNewsPage} type="news" />
                    <FeedPanel title="হারানো ও প্রাপ্তির সংবাদ" subtitle="হারানো জিনিস বা খুঁজে পাওয়ার পোস্ট" {...lostState} page={lostPage} onPageChange={setLostPage} type="lostfound" />
                </div>
            </div>
        </section>
    );
}

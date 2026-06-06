"use client";

import { motion } from 'framer-motion';
import { Megaphone, ChevronRight, Radio, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useMemo, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { newsService } from '@/lib/services/newsService';

const FALLBACK_TICKER_ITEMS = [
    {
        id: 'citizen-services',
        text: 'নাগরিক সেবা, আবেদন ও জরুরি তথ্য এখন DigiGram-এ এক জায়গায় পাওয়া যাচ্ছে।',
        union: 'ডিজিগ্রাম',
        href: '/citizen'
    },
    {
        id: 'blood-service',
        text: 'জরুরি রক্তের প্রয়োজন হলে ডিজিটাল ব্লাড ব্যাংক থেকে দ্রুত ডোনার খুঁজুন।',
        union: 'জরুরি সেবা',
        href: '/services/blood'
    },
    {
        id: 'market-update',
        text: 'আপনার এলাকার বাজারদর, চাহিদা ও গুরুত্বপূর্ণ আপডেট নিয়মিত দেখুন।',
        union: 'বাজার',
        href: '/services/market'
    },
    {
        id: 'lost-found',
        text: 'হারানো বা পাওয়া জিনিসের সংবাদ প্রকাশ করে দ্রুত সঠিক মানুষের কাছে পৌঁছে দিন।',
        union: 'জনসেবা',
        href: '/lost-found'
    }
];

export default function NewsTicker() {
    const { selected } = useSelector((state) => state.location);
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const isFirstRun = useRef(true);

    useEffect(() => {
        const fetchNews = async () => {
            if (isFirstRun.current) {
                isFirstRun.current = false;
            }
            try {
                setLoading(true);
                // Fetch Global News (Page 1, Size 10)
                const globalNews = await newsService.getGlobalNews(1, 10);
                
                let combinedNews = [...globalNews];

                // If a union is selected, fetch news for that union as well
                if (selected?.unionId) {
                    const unionResult = await newsService.getNews(selected.unionId, 1, 10);
                    // Filter out duplicates if a news is both global and in union
                    const unionNews = (unionResult.data || []).filter(un => !globalNews.some(gn => gn.id === un.id));
                    combinedNews = [...combinedNews, ...unionNews];
                }

                // Sort by date
                combinedNews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                setNewsItems(combinedNews.map(n => ({
                    id: n.slug || n.id,
                    text: n.excerpt || n.title,
                    union: n.location?.name_bn || (n.is_global ? 'গ্লোবাল' : 'লোকাল'),
                    href: `/news/${n.slug || n.id}`
                })));
            } catch (err) {
                console.error("Error fetching ticker news:", err);
                setNewsItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [selected?.unionId, selected?.unionName]);

    const loopItems = useMemo(() => {
        const items = newsItems.length > 0 ? newsItems : FALLBACK_TICKER_ITEMS;
        return [...items, ...items];
    }, [newsItems]);

    if (loading && newsItems.length === 0) {
        return (
            <div className="relative dg-ticker-bar overflow-hidden h-14 flex items-center justify-center">
                <Loader2 size={16} className="animate-spin text-teal-400 mr-2" />
                <span className="text-xs font-bold text-slate-300">নিউজ আপডেট লোড হচ্ছে...</span>
            </div>
        );
    }

    return (
        <div className="relative dg-ticker-bar overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(45,212,191,0.05)_50%,transparent)] pointer-events-none" />
            <div className="absolute top-0 left-0 h-full w-20 sm:w-28 bg-gradient-to-r from-[color:var(--dg-ticker-b)] to-transparent z-[2] pointer-events-none" />
            <div className="absolute top-0 right-0 h-full w-20 sm:w-28 bg-gradient-to-l from-[color:var(--dg-ticker-b)] to-transparent z-[2] pointer-events-none" />

            <div className="max-w-[1440px] mx-auto px-3 sm:px-4 py-2.5 flex items-stretch gap-2 sm:gap-3">
                <div className="flex items-center gap-2 pl-1 pr-3 sm:pr-4 py-1.5 rounded-full bg-gradient-to-r from-[color:var(--dg-teal)] to-[color:var(--dg-sky)] text-white z-[3] shrink-0 shadow-md shadow-black/20 ring-1 ring-white/15">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/15">
                        <Megaphone size={14} className="shrink-0" />
                    </span>
                    <div className="flex flex-col leading-none">
                        <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-[0.14em] opacity-95">
                            <Radio size={10} className="animate-pulse" />
                            লাইভ
                        </span>
                        <span className="text-[11px] sm:text-xs font-black mt-0.5 whitespace-nowrap">এলাকার খবর</span>
                    </div>
                </div>

                <div className="ticker-container flex-1 min-w-0 flex items-center overflow-hidden mask-[linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
                    <style dangerouslySetInnerHTML={{ __html: `
                        @keyframes tickerMarquee {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                        }
                        .ticker-animate-row {
                            display: flex;
                            align-items: center;
                            gap: 40px;
                            white-space: nowrap;
                            animation: tickerMarquee ${Math.max(28, loopItems.length * 6)}s linear infinite;
                        }
                        .ticker-container:hover .ticker-animate-row {
                            animation-play-state: paused;
                        }
                    `}} />
                    <div className="ticker-animate-row will-change-transform">
                        {loopItems.map((news, i) => (
                            <Link 
                                key={`${news.id}-${i}`} 
                                href={news.href || `/news/${news.id}`}
                                className="flex items-center gap-3 shrink-0 group/item cursor-pointer"
                            >
                                <span className="flex h-2 w-2 rounded-full bg-[color:var(--dg-teal-bright)] shadow-[0_0_10px_rgba(45,212,191,0.55)] group-hover/item:scale-125 transition-transform" />
                                <p className="text-[13px] sm:text-[15px] font-bold text-slate-100/95 tracking-tight flex items-center gap-2">
                                    <span className="text-[color:var(--dg-teal-bright)] font-extrabold">[{news.union}]</span>
                                    {news.text}
                                    <span className="text-[10px] sm:text-xs text-white/50 group-hover/item:text-teal-400 font-black underline underline-offset-4 decoration-white/20 group-hover/item:decoration-teal-400/50 transition-all ml-1">
                                        বিস্তারিত
                                    </span>
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>

                <Link
                    href="/news"
                    className="hidden sm:flex items-center gap-1 self-center ml-1 px-3 py-1.5 rounded-full text-[11px] font-bold text-slate-300/90 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors duration-[var(--dg-duration)] shrink-0 z-[3]"
                >
                    সব খবর
                    <ChevronRight size={14} />
                </Link>
            </div>
        </div>
    );
}

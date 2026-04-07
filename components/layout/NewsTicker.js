"use client";

import { motion } from 'framer-motion';
import { Megaphone, ChevronRight, Radio } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { ALL_NEWS } from '@/lib/content/newsData';

const newsData = ALL_NEWS.map(n => ({
    id: n.id,
    text: n.excerpt || n.title,
    union: n.isGlobal ? 'গ্লোবাল' : n.union
}));

export default function NewsTicker() {
    const { selected } = useSelector((state) => state.location);

    const filteredNews = useMemo(
        () =>
            newsData.filter(
                (news) =>
                    !selected.union
                        ? news.union === "গ্লোবাল"
                        : news.union === "গ্লোবাল" || news.union === selected.union
            ),
        [selected.union]
    );

    const loopItems = useMemo(() => {
        const base = filteredNews.length ? filteredNews : newsData.filter((n) => n.union === "গ্লোবাল");
        return [...base, ...base];
    }, [filteredNews]);

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

                <div className="flex-1 min-w-0 flex items-center overflow-hidden mask-[linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
                    <motion.div
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{
                            repeat: Infinity,
                            duration: Math.max(28, loopItems.length * 6),
                            ease: "linear",
                        }}
                        className="flex items-center gap-10 sm:gap-16 whitespace-nowrap will-change-transform"
                    >
                        {loopItems.map((news, i) => (
                            <div key={`${news.id}-${i}`} className="flex items-center gap-3 shrink-0">
                                <span className="flex h-2 w-2 rounded-full bg-[color:var(--dg-teal-bright)] shadow-[0_0_10px_rgba(45,212,191,0.55)]" />
                                <p className="text-[13px] sm:text-[15px] font-bold text-slate-100/95 tracking-tight">
                                    <span className="text-[color:var(--dg-teal-bright)] font-extrabold mr-2">[{news.union}]</span>
                                    {news.text}
                                </p>
                            </div>
                        ))}
                    </motion.div>
                </div>

                <button
                    type="button"
                    className="hidden sm:flex items-center gap-1 self-center ml-1 px-3 py-1.5 rounded-full text-[11px] font-bold text-slate-300/90 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors duration-[var(--dg-duration)] shrink-0 z-[3]"
                >
                    সব খবর
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}

"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Send, ArrowRight, Mic, ShieldCheck, MapPin, Globe, Home } from 'lucide-react';
import { FEATURED_FOR_HERO } from '@/lib/constants/serviceCategories';
import { paths } from '@/lib/constants/paths';
import { openModal } from '@/lib/store/features/locationSlice';

export default function HomeHeroSection() {
    const dispatch = useDispatch();
    const { selected } = useSelector((s) => s.location);
    const words = ["ব্লাড ডোনার", "জরুরি ডাক্তার", "ইউনিয়ন সেবা", "স্মার্ট স্কুল", "কৃষি তথ্য"];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % words.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    const floatingCards = FEATURED_FOR_HERO;

    return (
        <div className="dg-section-x px-2 md:px-6 mt-3 md:mt-6 mb-1 md:mb-2">
            <section className="dg-hero-panel rounded-[28px] md:rounded-[40px]">
                <div className="dg-hero-panel__mesh" aria-hidden />
                <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-gradient-to-bl from-teal-200/20 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[380px] h-[380px] bg-gradient-to-tr from-sky-200/16 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-teal-400/8 blur-3xl" />

                <div className="relative px-4 py-10 md:py-16 lg:py-20">
                    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                        <div className="flex-[1.15] text-center lg:text-left relative z-[1] w-full">
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-6"
                            >
                                <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-[0.18em] shadow-lg shadow-slate-900/25">
                                    <Sparkles size={13} className="text-teal-300" />
                                    DigiGram
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[color:var(--dg-border)] bg-white/75 text-[11px] font-bold text-[color:var(--dg-ink-muted)] shadow-sm backdrop-blur-sm">
                                    <ShieldCheck size={14} className="text-[color:var(--dg-teal)]" />
                                    Trust-First · ফ্রিমিয়াম
                                </span>
                                {selected.unionSlug ? (
                                    <Link
                                        href={paths.unionPortal(selected.unionSlug)}
                                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-teal-600 to-sky-600 text-white text-[11px] font-extrabold shadow-md hover:brightness-105 transition-all w-full sm:w-auto mt-2 sm:mt-0 justify-center"
                                    >
                                        <Home size={14} className="shrink-0" />
                                        {selected.union} ইউনিয়ন পোর্টাল ও স্থানীয় সেবা
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => dispatch(openModal())}
                                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-teal-600 text-white text-[11px] font-extrabold shadow-md hover:bg-teal-700 transition-all w-full sm:w-auto mt-2 sm:mt-0 justify-center animate-bounce-slow"
                                    >
                                        <MapPin size={14} className="shrink-0" />
                                        আপনার ইউনিয়ন সিলেক্ট করুন
                                    </button>
                                )}
                            </motion.div>

                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[color:var(--dg-ink)] leading-[1.08] tracking-tight mb-3">
                                স্মার্ট পল্লী <br className="hidden sm:block" />
                                <span className="text-gradient-brand">সুপার-অ্যাপ</span>
                            </h1>

                            <p className="text-base sm:text-lg text-[color:var(--dg-ink-muted)] font-semibold max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                                <span className="text-[color:var(--dg-ink)]">“সেবা, শিক্ষা ও সমৃদ্ধির ডিজিটাল সেতুবন্ধন।”</span>
                                <span className="block mt-2 text-[color:var(--dg-muted)] font-medium text-[15px]">
                                    পুরো উপজেলার গ্লোবাল সেবা এবং আপনার নিজের ইউনিয়নের বিশেষ স্থানীয় সেবা—সবই এখন এক জায়গায়।
                                    {!selected.unionSlug && <span className="text-teal-600 font-bold block mt-1">আপনার এলাকা সিলেক্ট করে স্থানীয় সেবাগুলোর সুবিধা নিন।</span>}
                                </span>
                            </p>

                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-8">
                                <div className="flex items-center justify-center lg:justify-start gap-3 min-h-[3rem]">
                                    <span className="text-lg sm:text-xl font-medium text-slate-400">খুঁজুন</span>
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={words[index]}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                            className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[color:var(--dg-ink)] border-b-[3px] border-[color:var(--dg-teal)] pb-0.5"
                                        >
                                            {words[index]}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="relative group max-w-2xl mx-auto lg:mx-0">
                                <div className="absolute inset-0 rounded-[28px] bg-gradient-to-r from-teal-500/18 via-sky-500/12 to-blue-500/14 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                                <div className="relative flex items-stretch rounded-[28px] border-2 border-[color:var(--dg-border)] bg-[color-mix(in_srgb,var(--dg-surface)_95%,transparent)] shadow-[var(--dg-shadow-soft)] group-focus-within:border-[color-mix(in_srgb,var(--dg-teal)_35%,var(--dg-border))] transition-[border-color,box-shadow] duration-[var(--dg-duration)] ease-[var(--dg-ease)]">
                                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[color:var(--dg-teal)] transition-colors duration-300">
                                        <Search size={22} strokeWidth={2.5} />
                                    </div>
                                    <input
                                        type="search"
                                        placeholder="আপনার কি প্রয়োজন? (সেবা, নম্বর, আবেদন...)"
                                        className="flex-1 min-w-0 bg-transparent py-5 sm:py-6 pl-14 pr-3 rounded-[26px] text-base sm:text-lg font-bold text-[color:var(--dg-ink)] placeholder:text-slate-400 placeholder:font-semibold outline-none"
                                    />
                                    <div className="hidden sm:flex items-center pr-2">
                                        <button
                                            type="button"
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[11px] font-bold text-slate-500 hover:text-[color:var(--dg-teal)] hover:bg-teal-50 border border-transparent hover:border-teal-200/80 transition-all duration-200 mr-1"
                                            title="শীঘ্রই: ভয়েসে খুঁজুন"
                                        >
                                            <Mic size={16} className="text-[color:var(--dg-teal)]" />
                                            ভয়েস
                                        </button>
                                        <button
                                            type="button"
                                            className="h-[calc(100%-16px)] my-2 px-6 sm:px-8 rounded-2xl bg-gradient-to-br from-[color:var(--dg-teal)] to-sky-600 text-white font-extrabold shadow-lg shadow-teal-600/25 hover:brightness-105 active:scale-[0.98] transition-all duration-200 flex items-center gap-2"
                                        >
                                            খুঁজুন
                                            <Send size={17} />
                                        </button>
                                    </div>
                                </div>
                                <div className="sm:hidden mt-3 flex gap-2">
                                    <button
                                        type="button"
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[color:var(--dg-border)] bg-white/60 text-sm font-bold text-[color:var(--dg-ink-muted)] active:scale-[0.99] transition-transform"
                                    >
                                        <Mic size={18} className="text-[color:var(--dg-teal)]" />
                                        ভয়েস (শীঘ্রই)
                                    </button>
                                    <button
                                        type="button"
                                        className="flex-[1.2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-br from-[color:var(--dg-teal)] to-sky-600 text-white font-extrabold shadow-md active:scale-[0.99] transition-transform"
                                    >
                                        খুঁজুন
                                        <Send size={17} />
                                    </button>
                                </div>
                            </div>

                            <p className="mt-5 text-sm text-[color:var(--dg-muted)] font-medium max-w-xl mx-auto lg:mx-0">
                                জনসেবা মডিউল <span className="text-[color:var(--dg-teal)] font-bold">১০০% ফ্রি</span> — ব্লাড, জরুরি নম্বর, হারানো-প্রাপ্তি ও স্বচ্ছ দান।
                            </p>
                        </div>

                        <div className="flex-1 w-full max-w-md lg:max-w-none lg:h-[560px] relative hidden lg:block overflow-hidden z-[1]">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="relative h-full"
                            >
                                <motion.div
                                    animate={{ y: ["0%", "-50%"] }}
                                    transition={{
                                        ease: "linear",
                                        duration: 24,
                                        repeat: Infinity,
                                    }}
                                    className="flex flex-col gap-5"
                                >
                                    {[...floatingCards, ...floatingCards].map((card, idx) => (
                                        <Link
                                            key={`${card.id}-${idx}`}
                                            href={card.href}
                                            className="group dg-card-surface flex items-center gap-4 p-5 rounded-[28px] hover:-translate-y-0.5"
                                        >
                                            <div
                                                className={`p-3.5 rounded-2xl ${card.softBg} ${card.iconTint} ring-1 ${card.ring} shadow-inner`}
                                            >
                                                <card.icon size={26} strokeWidth={2.4} />
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">{card.title}</h4>
                                                    {card.level === 'union' ? (
                                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 flex items-center gap-1">
                                                            ইউনিয়ন
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 flex items-center gap-1">
                                                            গ্লোবাল
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-slate-500 text-xs font-semibold">{card.subtitle}</p>
                                            </div>
                                            <ArrowRight size={18} className="text-slate-300 shrink-0 group-hover:text-[color:var(--dg-teal)] transition-colors" />
                                        </Link>
                                    ))}
                                </motion.div>
                                <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[color-mix(in_srgb,var(--dg-surface)_70%,transparent)] to-transparent z-[2] pointer-events-none" />
                                <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[color-mix(in_srgb,var(--dg-surface)_70%,transparent)] to-transparent z-[2] pointer-events-none" />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

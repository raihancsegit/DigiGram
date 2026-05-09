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
    const words = ["ব্লাড ডোনার", "বাজারদর", "জরুরি ডাক্তার", "ইউনিয়ন সেবা", "স্মার্ট স্কুল", "কৃষি তথ্য"];
    const [index, setIndex] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % words.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    const floatingCards = FEATURED_FOR_HERO;

    return (
        <div className="relative pt-20 pb-24 md:pt-32 md:pb-40 px-4 md:px-6 overflow-hidden bg-slate-900 border-b border-slate-800 rounded-b-[48px] md:rounded-b-[80px]">
            {/* Premium Animated Background */}
            <div className="absolute inset-0 opacity-40">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-500/20 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/4 animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.05),transparent_70%)]" />
            </div>

            <div className="max-w-[1200px] mx-auto relative z-10 text-center lg:text-left">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    <div className="flex-[1.2] w-full">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-8"
                        >
                            <span className="px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                                <Sparkles size={14} className="inline mr-1.5" />
                                Digigram Smart App
                            </span>
                            <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[11px] font-black uppercase tracking-widest backdrop-blur-md">
                                <ShieldCheck size={14} className="inline mr-1.5 text-teal-400" />
                                Trust-First Platform
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[0.95] mb-8"
                        >
                            স্মার্ট পল্লী <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-sky-400 to-rose-400">সুপার-অ্যাপ</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-10"
                        >
                            “সেবা, শিক্ষা ও সমৃদ্ধির ডিজিটাল সেতুবন্ধন।” পুরো উপজেলার গ্লোবাল সেবা এবং আপনার নিজের ইউনিয়নের বিশেষ স্থানীয় সেবা—সবই এখন এক জায়গায়।
                        </motion.p>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-10">
                            {mounted && (
                                <>
                                    {selected.unionSlug ? (
                                        <Link
                                            href={paths.unionPortal(selected.unionSlug)}
                                            className="flex items-center gap-3 px-8 py-5 rounded-[24px] bg-teal-500 hover:bg-teal-400 text-white font-black text-base shadow-xl shadow-teal-500/20 transition-all active:scale-95 group"
                                        >
                                            <Home size={20} className="group-hover:animate-bounce" />
                                            {selected.union} ইউনিয়ন পোর্টাল
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={() => dispatch(openModal())}
                                            className="flex items-center gap-3 px-8 py-5 rounded-[24px] bg-teal-500 hover:bg-teal-400 text-white font-black text-base shadow-xl shadow-teal-500/20 transition-all active:scale-95"
                                        >
                                            <MapPin size={20} />
                                            আপনার ইউনিয়ন সিলেক্ট করুন
                                        </button>
                                    )}
                                </>
                            )}
                            <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-4 rounded-[24px] backdrop-blur-xl">
                                <span className="text-slate-400 text-sm font-bold">খুঁজুন:</span>
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={words[index]}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="text-teal-400 font-black text-base md:text-lg min-w-[100px]"
                                    >
                                        {words[index]}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Search Input Upgraded */}
                        <div className="relative group max-w-3xl mx-auto lg:mx-0">
                            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-rose-500 rounded-[32px] blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
                            <div className="relative flex items-center bg-white/10 border border-white/10 backdrop-blur-2xl rounded-[30px] p-2">
                                <div className="pl-6 pr-4">
                                    <Search size={22} className="text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="আপনার কি প্রয়োজন? (সেবা, নম্বর, আবেদন...)"
                                    className="flex-1 bg-transparent py-4 text-white placeholder:text-slate-500 outline-none font-bold lg:text-lg"
                                />
                                <button className="hidden sm:flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-[24px] font-black text-sm hover:bg-teal-400 hover:text-white transition-all shadow-lg active:scale-95">
                                    খুঁজুন
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:block flex-1 w-full relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-500/20 rounded-full blur-[80px]" />
                            <div className="relative z-10 grid grid-cols-1 gap-6">
                                {floatingCards.slice(0, 4).map((card, i) => (
                                    <Link
                                        key={card.id}
                                        href={card.href}
                                        className="flex items-center gap-5 p-5 rounded-[28px] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                                    >
                                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                            <card.icon size={24} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h4 className="text-white font-black text-base">{card.title}</h4>
                                            <p className="text-slate-400 text-xs font-bold mt-1">{card.subtitle}</p>
                                        </div>
                                        <ArrowRight size={18} className="text-white/20 group-hover:text-white transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

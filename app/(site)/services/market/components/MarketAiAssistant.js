"use client";

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Sprout, ShoppingCart, Info, TrendingUp, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarketAiAssistant({ prices = [], markets = [], commodities = [] }) {
    const [bulletin, setBulletin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'farmer', 'buyer'

    // Load AI bulletin from sessionStorage or fetch from API
    const loadAiBulletin = async (forceRefresh = false) => {
        if (!prices || prices.length === 0) {
            setError("বিশ্লেষণ করার জন্য আজকের বাজারের কোনো তথ্য পাওয়া যায়নি।");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const cacheKey = 'digigram_market_ai_bulletin';
            if (!forceRefresh) {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    setBulletin(JSON.parse(cached));
                    setLoading(false);
                    return;
                }
            }

            const response = await fetch('/api/ai/market-bulletin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prices, markets, commodities })
            });

            if (!response.ok) {
                throw new Error("AI analysis failed");
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            setBulletin(data);
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (err) {
            console.error("Gemini Market Bulletin error:", err);
            setError("এআই বাজার বিশ্লেষণ তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAiBulletin();
    }, [prices]);

    const toDisplayText = (value) => {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) {
            return value
                .map((item) => toDisplayText(item))
                .filter(Boolean)
                .join('\n');
        }
        if (typeof value === 'object') {
            return Object.values(value)
                .map((item) => toDisplayText(item))
                .filter(Boolean)
                .join('\n');
        }
        return String(value);
    };

    const formatBulletPoints = (text) => {
        const safeText = toDisplayText(text);
        if (!safeText) return [];
        // Support splitting by common bullet symbols (e.g. *, -, bullet points, or new lines)
        return safeText
            .split(/\n|-[ ]?|\*[ ]?/)
            .map(item => item.trim())
            .filter(item => item.length > 0);
    };

    return (
        <div className="rounded-[40px] border border-violet-100 bg-gradient-to-br from-violet-50/70 via-white to-teal-50/40 p-6 sm:p-8 shadow-xl shadow-slate-100/50 relative overflow-hidden">
            {/* Curved background glowing mesh blobs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header Area */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-violet-100/80 pb-6 mb-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200">
                        <Sparkles size={24} className={loading ? "animate-pulse" : ""} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-widest">
                                GEMINI AI
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                লাইভ বিশ্লেষণ
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mt-1">স্মার্ট এআই বাজার বিশ্লেষণ</h2>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">রিয়েল-টাইম ডাটার ওপর ভিত্তি করে এআই-চালিত পরম সিদ্ধান্ত ও দিকনির্দেশনা।</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => loadAiBulletin(true)}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-violet-100 bg-white hover:bg-violet-50 text-xs font-black text-violet-700 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        নতুন বিশ্লেষণ
                    </button>
                </div>
            </div>

            {/* Content Body */}
            <div className="relative z-10">
                {loading ? (
                    /* Elegant pulsing loading state */
                    <div className="space-y-6 animate-pulse">
                        <div className="h-20 bg-slate-100 rounded-3xl" />
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="h-44 bg-slate-100 rounded-3xl" />
                            <div className="h-44 bg-slate-100 rounded-3xl" />
                        </div>
                    </div>
                ) : error ? (
                    <div className="py-8 text-center flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                            <Info size={24} />
                        </div>
                        <p className="text-rose-600 font-bold text-sm max-w-md">{error}</p>
                        <button
                            onClick={() => loadAiBulletin(true)}
                            className="mt-2 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-full font-black text-xs transition-all shadow-md shadow-violet-200"
                        >
                            আবার চেষ্টা করুন
                        </button>
                    </div>
                ) : bulletin ? (
                    <div className="space-y-6">
                        {/* Summary Block */}
                        <div className="rounded-3xl border border-violet-100 bg-violet-50/30 p-5 sm:p-6 hover:border-violet-200/60 transition-all duration-300">
                            <h4 className="text-xs font-black uppercase tracking-widest text-violet-700 mb-2.5 flex items-center gap-1.5">
                                <Info size={14} />
                                আজকের বাজার সারসংক্ষেপ
                            </h4>
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                {toDisplayText(bulletin.summary)}
                            </p>
                        </div>

                        {/* Two Columns Grid */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Column 1: Farmers Advisory */}
                            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/10 p-5 sm:p-6 hover:bg-emerald-50/20 transition-all duration-300 flex flex-col">
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                        <Sprout size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 leading-none">চাষী ভাইদের জন্য পরামর্শ</h4>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 mt-1 block">FARMER ADVISORY</span>
                                    </div>
                                </div>
                                <ul className="space-y-3 flex-grow">
                                    {formatBulletPoints(bulletin.farmersAdvice).map((point, idx) => (
                                        <li key={idx} className="text-xs font-bold text-slate-600 flex items-start gap-2.5 leading-relaxed">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Column 2: Smart Buyers Guide */}
                            <div className="rounded-3xl border border-teal-100 bg-teal-50/10 p-5 sm:p-6 hover:bg-teal-50/20 transition-all duration-300 flex flex-col">
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                                        <ShoppingCart size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 leading-none">ক্রেতাদের সাশ্রয়ী গাইড</h4>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-teal-600 mt-1 block">SMART BUYER GUIDE</span>
                                    </div>
                                </div>
                                <ul className="space-y-3 flex-grow">
                                    {formatBulletPoints(bulletin.buyersGuide).map((point, idx) => (
                                        <li key={idx} className="text-xs font-bold text-slate-600 flex items-start gap-2.5 leading-relaxed">
                                            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Bottom Quote / Market Slogan */}
                        {bulletin.marketPulse && (
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-center text-center">
                                <p className="text-xs font-black italic text-violet-700/80 bg-violet-50 px-5 py-2.5 rounded-full flex items-center gap-2">
                                    <TrendingUp size={14} className="animate-bounce" />
                                    “{toDisplayText(bulletin.marketPulse)}”
                                </p>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

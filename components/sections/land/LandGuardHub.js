'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ShieldAlert, ScanLine, Calculator, Search, GitBranch,
    ArrowLeft, CheckCircle2, AlertTriangle, ExternalLink,
    ChevronRight, Info, Lock
} from 'lucide-react';
import Link from 'next/link';
import DeedExplainer from './DeedExplainer';
import MutationTools from './MutationTools';

const MODULES = [
    {
        id: 'deed',
        icon: ScanLine,
        title: 'AI দলিল বিশ্লেষক',
        desc: 'দলিলের ছবি তুলুন — AI সহজ বাংলায় ব্যাখ্যা করবে।',
        color: 'from-indigo-500 to-blue-700',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        textColor: 'text-indigo-700',
        badgeColor: 'bg-indigo-100 text-indigo-700',
        badge: 'AI চালিত',
    },
    {
        id: 'mutation',
        icon: Calculator,
        title: 'নামজারি গাইড',
        desc: '১,১৭০ ৳ সরকারি ফি ক্যালকুলেটর ও ধাপে ধাপে গাইড।',
        color: 'from-teal-500 to-emerald-600',
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        textColor: 'text-teal-700',
        badgeColor: 'bg-teal-100 text-teal-700',
        badge: 'ফ্রি গাইড',
    },
    {
        id: 'verify',
        icon: Search,
        title: 'জমি যাচাই (ePorcha)',
        desc: 'খতিয়ান নম্বর দিয়ে সরকারি ePorcha ডাটাবেস চেক করুন।',
        color: 'from-amber-500 to-orange-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        textColor: 'text-amber-700',
        badgeColor: 'bg-amber-100 text-amber-700',
        badge: 'সরকারি লিংক',
    },
    {
        id: 'chain',
        icon: GitBranch,
        title: 'মালিকানা ইতিহাস',
        desc: 'ভায়া দলিলের চেইন দেখুন ও গ্যাপ শনাক্ত করুন।',
        color: 'from-violet-500 to-purple-700',
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        textColor: 'text-violet-700',
        badgeColor: 'bg-violet-100 text-violet-700',
        badge: 'টাইমলাইন',
    },
];

const CHAIN_DATA = [
    { year: '১৯৬৫', name: 'মোঃ হাশেম আলী', action: 'মূল মালিক (CS খতিয়ান)', ok: true },
    { year: '১৯৭৮', name: 'মোঃ আব্দুর রাজ্জাক', action: 'উত্তরাধিকার সূত্রে প্রাপ্ত', ok: true },
    { year: '১৯৯২', name: 'মোঃ সালাম মিয়া', action: 'ক্রয়কৃত (SA খতিয়ান)', ok: true },
    { year: '২০০৫', name: '???', action: 'এই সময়ের দলিল পাওয়া যায়নি', ok: false },
    { year: '২০১৮', name: 'মোঃ রহিম উদ্দিন', action: 'ক্রয়কৃত (RS খতিয়ান)', ok: true },
];

export default function LandGuardHub({ backHref }) {
    const [active, setActive] = useState(null);

    return (
        <div className="space-y-8">

            {/* Back button */}
            {active && (
                <button
                    type="button"
                    onClick={() => setActive(null)}
                    className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft size={16} /> সকল সেবা
                </button>
            )}

            {/* Module Grid */}
            {!active && (
                <motion.div
                    initial="hidden" animate="show"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                    {MODULES.map((m) => (
                        <motion.button
                            key={m.id}
                            type="button"
                            onClick={() => setActive(m.id)}
                            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                            className={`group flex flex-col gap-4 p-6 rounded-[28px] border ${m.border} ${m.bg} hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 text-left`}
                        >
                            <div className="flex items-start justify-between">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                    <m.icon size={22} className="text-white" />
                                </div>
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${m.badgeColor}`}>{m.badge}</span>
                            </div>
                            <div>
                                <p className={`font-black text-base ${m.textColor} mb-1`}>{m.title}</p>
                                <p className="text-xs font-bold text-slate-500 leading-relaxed">{m.desc}</p>
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-black ${m.textColor} group-hover:translate-x-1 transition-transform`}>
                                শুরু করুন <ChevronRight size={14} />
                            </div>
                        </motion.button>
                    ))}
                </motion.div>
            )}

            {/* Active Module Content */}
            {active === 'deed' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
                        <ScanLine size={20} className="text-indigo-600" /> AI দলিল বিশ্লেষক
                    </h2>
                    <p className="text-sm text-slate-500 font-bold mb-6">দলিলের স্পষ্ট ছবি তুলুন, AI আপনার হয়ে বাংলায় পড়ে দেবে।</p>
                    <DeedExplainer />
                </motion.div>
            )}

            {active === 'mutation' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
                        <Calculator size={20} className="text-teal-600" /> নামজারি (খারিজ) গাইড
                    </h2>
                    <p className="text-sm text-slate-500 font-bold mb-6">ধাপে ধাপে জানুন কীভাবে নামজারি করবেন এবং কত টাকা লাগবে।</p>
                    <MutationTools />
                </motion.div>
            )}

            {active === 'verify' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <h2 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
                        <Search size={20} className="text-amber-600" /> জমি যাচাই করুন
                    </h2>
                    <p className="text-sm text-slate-500 font-bold mb-6">সরকারি ePorcha পোর্টাল ব্যবহার করে আপনার জমির খতিয়ান যাচাই করুন।</p>

                    {/* Info Card */}
                    <div className="p-5 rounded-[24px] bg-amber-50 border border-amber-200">
                        <p className="text-xs font-black text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Info size={14} /> কীভাবে যাচাই করবেন
                        </p>
                        {['ePorcha ওয়েবসাইটে যান (eporcha.gov.bd)', 'আপনার বিভাগ, জেলা ও উপজেলা নির্বাচন করুন', 'মৌজা ও খতিয়ান নম্বর দিন', 'খতিয়ানের তথ্য দেখুন ও ডাউনলোড করুন'].map((step, i) => (
                            <div key={i} className="flex items-start gap-3 mb-3">
                                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                <p className="text-xs font-bold text-amber-800 leading-relaxed">{step}</p>
                            </div>
                        ))}
                    </div>

                    <a
                        href="https://eporcha.gov.bd"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full py-4 rounded-[20px] bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-sm shadow-lg shadow-amber-200 hover:opacity-90 transition-opacity"
                    >
                        <Search size={18} />
                        ePorcha পোর্টালে যান
                        <ExternalLink size={14} />
                    </a>
                </motion.div>
            )}

            {active === 'chain' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <h2 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
                        <GitBranch size={20} className="text-violet-600" /> মালিকানার ইতিহাস
                    </h2>
                    <p className="text-sm text-slate-500 font-bold mb-6">ভায়া দলিলের ধারাবাহিক চেইন পরীক্ষা করুন। মাঝখানে গ্যাপ থাকলে সতর্ক থাকুন।</p>

                    {/* Timeline */}
                    <div className="relative pl-8 space-y-0">
                        <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-slate-200" />
                        {CHAIN_DATA.map((c, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="relative flex items-start gap-4 pb-6"
                            >
                                <div className={`absolute -left-4 w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${c.ok ? 'bg-white border-emerald-400' : 'bg-rose-50 border-rose-400'}`}>
                                    {c.ok
                                        ? <CheckCircle2 size={14} className="text-emerald-500" />
                                        : <AlertTriangle size={14} className="text-rose-500" />
                                    }
                                </div>
                                <div className={`flex-1 p-4 rounded-[20px] border ${c.ok ? 'bg-white border-slate-100' : 'bg-rose-50 border-rose-200'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${c.ok ? 'text-slate-400' : 'text-rose-500'}`}>{c.year}</span>
                                    </div>
                                    <p className={`font-black text-sm ${c.ok ? 'text-slate-800' : 'text-rose-700'}`}>{c.name}</p>
                                    <p className={`text-xs font-bold mt-0.5 ${c.ok ? 'text-slate-500' : 'text-rose-600'}`}>{c.action}</p>
                                    {!c.ok && (
                                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-rose-600 bg-rose-100 px-2 py-1 rounded-lg w-fit">
                                            <AlertTriangle size={10} /> বিশেষজ্ঞের পরামর্শ নিন
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="p-4 rounded-2xl bg-violet-50 border border-violet-200">
                        <p className="text-[11px] font-bold text-violet-700 leading-relaxed flex items-start gap-2">
                            <Info size={12} className="mt-0.5 shrink-0" />
                            উপরের টাইমলাইনটি একটি উদাহরণ। ভবিষ্যতে এখানে আপনার নিজের দলিলের ছবি আপলোড করলে AI স্বয়ংক্রিয়ভাবে টাইমলাইন তৈরি করবে।
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import LandGuardHub from '@/components/sections/land/LandGuardHub';

export default function LandGuardPage() {
    return (
        <div className="min-h-screen bg-slate-50">

            {/* Hero Banner */}
            <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pt-16 pb-28 px-4 overflow-hidden">
                {/* Decorative glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-700/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-[1000px] mx-auto relative z-10">
                    {/* Back nav */}
                    <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors mb-8">
                        <ArrowLeft size={16} /> হোমে ফিরুন
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-black uppercase tracking-[0.2em] mb-6"
                    >
                        <ShieldAlert size={14} />
                        DigiGram · ভূমি সেবা
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6"
                    >
                        স্মার্ট{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
                            ভূমি সেবা
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 text-base md:text-lg font-medium leading-relaxed max-w-2xl"
                    >
                        জমি-জমা সংক্রান্ত জটিল সমস্যার সহজ সমাধান। AI দিয়ে দলিল বুঝুন, সরকারি ফি জানুন, দালাল ছাড়াই নামজারি করুন।
                    </motion.p>

                    {/* Trust Badges */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap gap-3 mt-8"
                    >
                        {[
                            '✓ AI দলিল বিশ্লেষণ',
                            '✓ সরকারি ফি: মাত্র ১,১৭০ ৳',
                            '✓ ePorcha সরাসরি লিংক',
                            '✓ দালাল-মুক্ত গাইড',
                        ].map((b) => (
                            <span key={b} className="text-xs font-bold text-indigo-200 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
                                {b}
                            </span>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="max-w-[1000px] mx-auto px-4 -mt-16 relative z-10 pb-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-10"
                >
                    <LandGuardHub />
                </motion.div>
            </div>
        </div>
    );
}

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function GlobalLoading({ isVisible }) {
    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none fixed inset-0 z-[9999]"
            >
                <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '82%' }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 shadow-[0_0_10px_rgba(20,184,166,0.45)]"
                />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-slate-50/95 backdrop-blur-[2px]"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-[28px] border border-slate-200 bg-white/95 px-8 py-7 text-center shadow-2xl shadow-slate-300/60 backdrop-blur"
                >
                    <div className="relative">
                        <Loader2 size={58} className="animate-spin text-teal-600" />
                        <ShieldCheck size={24} className="absolute inset-0 m-auto text-slate-950" />
                    </div>
                    <p className="mt-4 whitespace-nowrap text-sm font-black text-slate-900">লোড হচ্ছে...</p>
                    <p className="mt-1 whitespace-nowrap text-xs font-bold text-slate-500">পোর্টাল প্রস্তুত হচ্ছে</p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

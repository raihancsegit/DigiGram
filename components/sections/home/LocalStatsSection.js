'use client';

import { motion } from 'framer-motion';
import { Users, Heart, School, Activity, ArrowUpRight } from 'lucide-react';

const stats = [
    { label: 'রক্তদাতা', value: '৫০০+', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'জরুরি ডাক্তার', value: '১৫০+', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'শিক্ষাপ্রতিষ্ঠান', value: '৪৫টি', icon: School, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'সেবা গ্রহীতা', value: '১০,০০০+', icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
];

export default function LocalStatsSection() {
    return (
        <section className="dg-section-x py-12">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {stats.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-center md:text-left"
                        >
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${s.bg} flex items-center justify-center mb-4 mx-auto md:mx-0 group-hover:scale-110 transition-transform`}>
                                <s.icon className={s.color} size={24} />
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">{s.value}</h3>
                            <p className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

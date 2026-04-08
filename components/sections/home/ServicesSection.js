"use client"
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/lib/constants/serviceCategories';
import { paths } from '@/lib/constants/paths';
import Section from '@/components/ui/Section';
import { layout, sectionIds } from '@/lib/theme';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.04 },
    },
};

const item = {
    hidden: { opacity: 0, y: 12 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 400, damping: 30 },
    },
};

export default function ServicesSection() {
    return (
        <Section id={sectionIds.services} variant="services">
            <div
                className="mx-auto px-3 sm:px-6 md:px-8"
                style={{ maxWidth: layout.servicesMaxPx }}
            >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 md:mb-16">
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4"
                        >
                            <Sparkles size={12} />
                            সার্ভিস ডিরেক্টরি
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-4"
                        >
                            এক ট্যাপে <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-rose-500">গ্রামের সব সেবা</span>
                        </motion.h2>
                        <p className="text-lg text-slate-500 font-bold leading-relaxed">
                            দেখেই বুঝবেন—পরিষ্কার আইকন, ফ্রি/প্রিমিয়াম ট্যাগ, মোবাইল ফার্স্ট। বয়স্কদের জন্যও সহজ পাঠ।
                        </p>
                    </div>
                    <Link
                        href={paths.service('more')}
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-teal-500 transition-all shadow-xl active:scale-95"
                    >
                        সবগুলো দেখুন
                        <ArrowUpRight size={18} />
                    </Link>
                </div>

                <motion.ul
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-32px', amount: 0.12 }}
                    className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 list-none p-0 m-0"
                >
                    {SERVICE_CATEGORIES.map((cat) => (
                        <motion.li key={cat.id} variants={item} className="h-full min-h-0">
                            <Link
                                href={cat.href}
                                className="group bg-white relative flex h-full flex-col overflow-hidden rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:border-teal-200 transition-all duration-300 hover:-translate-y-2"
                            >
                                <div
                                    className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${cat.gradient} opacity-[0.08] blur-2xl transition-opacity group-hover:opacity-[0.2]`}
                                />
                                <div className="relative flex items-center justify-between mb-6">
                                    <div
                                        className={`flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br ${cat.gradient} text-white shadow-lg ring-4 ring-white group-hover:rotate-6 transition-transform`}
                                    >
                                        <cat.icon size={26} strokeWidth={2.4} />
                                    </div>
                                    <span
                                        className={`shrink-0 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                                            cat.id === 'blood' ? 'bg-rose-100 text-rose-700' :
                                            cat.free ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                                        }`}
                                    >
                                        {cat.free ? 'ফ্রি' : 'প্রিমিয়াম'}
                                    </span>
                                </div>
                                <h3 className="relative mt-auto text-xl font-black text-slate-800 leading-tight group-hover:text-teal-600 transition-colors">
                                    {cat.title}
                                </h3>
                                <p className="relative mt-2 text-xs font-bold text-slate-400 group-hover:text-slate-500 transition-colors leading-relaxed">
                                    {cat.subtitle}
                                </p>
                                <div className="relative mt-6 pt-4 border-t border-slate-50 flex items-center gap-2 text-[11px] font-black text-teal-600 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                                    বিস্তারিত দেখুন
                                    <ArrowUpRight size={14} />
                                </div>
                            </Link>
                        </motion.li>
                    ))}
                </motion.ul>
            </div>
        </Section>
    );
}

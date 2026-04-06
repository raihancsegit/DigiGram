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
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10 md:mb-14">
                    <div className="space-y-3">
                        <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="inline-flex items-center gap-2 rounded-full border border-teal-200/70 bg-white/75 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[color:var(--dg-teal)] shadow-sm backdrop-blur-sm"
                        >
                            <Sparkles size={13} className="text-[color:var(--dg-teal-bright)]" />
                            সার্ভিস ডিরেক্টরি
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.25 }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[color:var(--dg-ink)] tracking-tight leading-[1.15]"
                        >
                            এক ট্যাপে{' '}
                            <span className="text-gradient-brand">গ্রামের সব সেবা</span>
                        </motion.h2>
                        <p className="text-[color:var(--dg-ink-muted)] font-medium text-base max-w-xl leading-relaxed">
                            দেখেই বুঝবেন—পরিষ্কার আইকন, ফ্রি/প্রিমিয়াম ট্যাগ, মোবাইল ফার্স্ট। বয়স্কদের জন্যও সহজ পাঠ।
                        </p>
                    </div>
                    <Link
                        href={paths.service('more')}
                        className="inline-flex items-center justify-center gap-2 self-start sm:self-auto px-7 py-3.5 rounded-2xl bg-[color:var(--dg-ink)] text-white text-sm font-extrabold shadow-xl shadow-slate-900/15 hover:bg-gradient-to-r hover:from-[color:var(--dg-teal)] hover:to-sky-600 transition-all duration-[var(--dg-duration)] ease-[var(--dg-ease)] hover:scale-[1.02] active:scale-[0.98]"
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
                                className="group dg-card-surface relative flex h-full flex-col overflow-hidden rounded-[22px] sm:rounded-[26px] p-4 sm:p-5 hover:-translate-y-1"
                            >
                                <div
                                    className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${cat.gradient} opacity-[0.11] blur-2xl transition-opacity duration-[var(--dg-duration)] ease-[var(--dg-ease)] group-hover:opacity-[0.2]`}
                                />
                                <div className="relative flex items-start justify-between gap-2">
                                    <div
                                        className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.gradient} text-white shadow-lg ring-2 ring-white/30 transition-transform duration-[var(--dg-duration)] ease-[var(--dg-ease)] group-hover:scale-105 group-hover:rotate-3`}
                                    >
                                        <cat.icon size={26} strokeWidth={2.2} className="drop-shadow-sm" />
                                    </div>
                                    <span
                                        className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider ${
                                            cat.free
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-amber-100 text-amber-900'
                                        }`}
                                    >
                                        {cat.free ? 'ফ্রি' : 'প্রিমিয়াম'}
                                    </span>
                                </div>
                                <h3 className="relative mt-4 text-base sm:text-lg font-extrabold text-[color:var(--dg-ink)] leading-snug tracking-tight">
                                    {cat.title}
                                </h3>
                                <p className="relative mt-1.5 text-xs sm:text-sm font-semibold text-[color:var(--dg-muted)] leading-relaxed flex-1">
                                    {cat.subtitle}
                                </p>
                                <div className="relative mt-4 flex items-center gap-1 text-xs font-extrabold text-[color:var(--dg-teal)] opacity-0 translate-y-1 transition-all duration-[var(--dg-duration)] ease-[var(--dg-ease)] group-hover:opacity-100 group-hover:translate-y-0">
                                    খুলুন
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

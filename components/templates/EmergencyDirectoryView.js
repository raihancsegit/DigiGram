'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Phone, MapPin, Clock, ShieldAlert, Stethoscope, Flame, Car, Building2, Search, ArrowRight, Activity, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    emergencyDirectoryContext,
    emergencyCategories,
    emergencyHowTo,
} from '@/lib/content/emergencyDirectory';

const iconMap = {
    national: ShieldAlert,
    hospital: Stethoscope,
    ambulance: Car,
    fire: Flame,
    police: Building2,
    vet: Stethoscope,
    utilities: MapPin,
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const EN_DIGITS = '0123456789';

function bnDigitsToEn(str) {
    return String(str)
        .split('')
        .map((ch) => {
            const i = BN_DIGITS.indexOf(ch);
            return i >= 0 ? EN_DIGITS[i] : ch;
        })
        .join('');
}

function toTelHref(raw) {
    const normalized = bnDigitsToEn(raw);
    const digits = normalized.replace(/[^\d+]/g, '');
    if (!digits.length) return undefined;
    if (digits.startsWith('+')) return `tel:${digits}`;
    return `tel:${digits}`;
}

function PhoneBlock({ phones }) {
    return (
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-100/80">
            {phones.map((p) => {
                const href = toTelHref(p.number);
                const Wrapper = href ? 'a' : 'span';
                return (
                <Wrapper
                    key={`${p.label}-${p.number}`}
                    {...(href ? { href } : {})}
                    className={`inline-flex items-center justify-between gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-slate-800 font-black transition-all w-full group ${
                        href ? 'hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 hover:shadow-md cursor-pointer active:scale-[0.98]' : 'cursor-default'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl transition-colors ${href ? 'bg-rose-100 text-rose-600 group-hover:bg-rose-200' : 'bg-slate-200 text-slate-500'}`}>
                            <Phone size={16} className="shrink-0" />
                        </div>
                        <span className="min-w-0 flex flex-col items-start leading-none gap-1.5">
                            {p.label && <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-rose-400">{p.label}</span>}
                            <span className="text-base tracking-wide">{p.number}</span>
                        </span>
                    </div>
                </Wrapper>
            );
            })}
        </div>
    );
}

export default function EmergencyDirectoryView({ slug }) {
    return (
        <Suspense fallback={<div className="py-20 text-center font-bold text-[color:var(--dg-muted)]">Loading Emergency Directory...</div>}>
            <EmergencyDirectoryContent slug={slug} />
        </Suspense>
    );
}

function EmergencyDirectoryContent({ slug }) {
    const searchParams = useSearchParams();
    const unionQuery = searchParams.get('u');
    const isUnionLocked = !!unionQuery;
    
    const ctx = emergencyDirectoryContext;

    // Use dynamic title based on context
    const displayUnionName = isUnionLocked ? `${unionQuery} ইউনিয়ন (ফিল্টারকৃত)` : 'সকল ইউনিয়ন (গ্লোবাল)';

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Premium Hero Section */}
            <div className="relative pt-24 pb-20 md:pt-32 md:pb-24 px-4 overflow-hidden bg-slate-900 border-b border-slate-800">
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/4" />
                </div>
                
                <div className="max-w-[1200px] mx-auto relative z-10">
                    <Link
                        href="/#services"
                        className="inline-flex items-center gap-2 text-sm font-bold text-rose-300 hover:text-white transition-colors mb-8 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        সার্ভিস ডিরেক্টরিতে ফিরুন
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="max-w-2xl">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-wrap items-center gap-3 mb-6"
                            >
                                <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                    <Activity size={12} />
                                    জরুরি সার্ভিসেস
                                </span>
                                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                    <Phone size={12} />
                                    ফ্রি হটলাইন
                                </span>
                            </motion.div>
                            
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6 capitalize"
                            >
                                জরুরি সেবা ও <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">হটলাইন</span>
                            </motion.h1>

                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed max-w-xl"
                            >
                                {displayUnionName} — {ctx.coverage}
                            </motion.p>
                        </div>

                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="hidden lg:flex w-40 h-40 items-center justify-center rounded-[40px] bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-white/10 backdrop-blur-xl shadow-2xl relative"
                        >
                            <AlertOctagon size={64} className="text-rose-400" />
                            <div className="absolute inset-0 bg-white/5 rounded-[40px] animate-pulse" />
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 -mt-10 relative z-20 space-y-12">
                
                {/* Guidelines Dashboard Style */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-[32px] p-6 sm:p-8 shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col md:flex-row gap-8"
                >
                    <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
                        <div className="inline-flex p-3 rounded-2xl bg-amber-50 text-amber-600 mb-4">
                            <Clock size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2 leading-tight">জরুরি মুহূর্তে<br/>কী করবেন?</h2>
                        <p className="text-sm font-bold text-slate-500">শান্ত থাকুন এবং ধাপে ধাপে কাজ করুন।</p>
                    </div>
                    <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {emergencyHowTo.map((step, i) => (
                            <div key={step.title} className="relative">
                                <div className="text-5xl font-black text-slate-100 absolute -top-4 -left-2 z-0 tracking-tighter">0{i + 1}</div>
                                <div className="relative z-10 mt-2">
                                    <h3 className="text-[15px] font-black text-slate-800 mb-2">{step.title}</h3>
                                    <p className="text-xs font-bold text-slate-500 leading-relaxed">{step.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Categories Sticky Nav */}
                <div className="sticky top-20 z-30 bg-[#F8FAFC]/80 backdrop-blur-xl py-4 border-b border-slate-200/50 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {emergencyCategories.map((cat) => (
                            <a
                                key={cat.id}
                                href={`#em-${cat.id}`}
                                className="shrink-0 px-5 py-2.5 rounded-full text-xs font-black bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm active:scale-95"
                            >
                                {cat.title}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Emergency Entries */}
                <div className="space-y-16">
                    {emergencyCategories.map((cat) => {
                        const Icon = iconMap[cat.id] || Phone;
                        return (
                            <section key={cat.id} id={`em-${cat.id}`} className="scroll-mt-40">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg text-white ${
                                        cat.id === 'national' ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-200' :
                                        cat.id === 'hospital' ? 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-emerald-200' :
                                        cat.id === 'ambulance' ? 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-cyan-200' :
                                        cat.id === 'fire' ? 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-amber-200' :
                                        'bg-gradient-to-br from-slate-700 to-slate-900 shadow-slate-200'
                                    }`}>
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-black text-slate-800">{cat.title}</h2>
                                        {cat.subtitle && <p className="text-sm font-bold text-slate-500 mt-1">{cat.subtitle}</p>}
                                    </div>
                                </div>
                                
                                {cat.hint && (
                                    <div className="mb-6 p-4 rounded-2xl bg-slate-100/80 border border-slate-200 flex items-start gap-3">
                                        <div className="p-1 rounded-full bg-slate-200 shrink-0">
                                            <AlertOctagon size={16} className="text-slate-600" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-600 leading-relaxed">{cat.hint}</p>
                                    </div>
                                )}

                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {cat.items.map((item) => (
                                        <div
                                            key={item.name}
                                            className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl group-hover:bg-rose-50/50 transition-colors pointer-events-none" />
                                            
                                            <div className="relative z-10 flex-1">
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <h3 className="text-[17px] font-black text-slate-800 leading-snug group-hover:text-rose-600 transition-colors">{item.name}</h3>
                                                    {item.badges && item.badges.length > 0 && (
                                                        <span className="shrink-0 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 text-[9px] font-black uppercase tracking-wider">
                                                            {item.badges[0]}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {item.subtitle && <p className="text-xs font-extrabold text-slate-400 mb-4">{item.subtitle}</p>}
                                                
                                                {item.address && (
                                                    <div className="flex items-start gap-2 text-xs font-bold text-slate-500 mt-3 bg-slate-50 p-3 rounded-xl">
                                                        <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                                        <span className="leading-snug">{item.address}</span>
                                                    </div>
                                                )}
                                                
                                                {item.note && (
                                                    <p className="text-[11px] font-bold text-slate-400 mt-4 leading-relaxed pl-3 border-l-2 border-slate-200">
                                                        {item.note}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mt-4 relative z-10">
                                                <PhoneBlock phones={item.phones} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                {/* Footer Alert */}
                <div className="mt-16 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-[32px] p-8 md:p-10 text-center shadow-lg shadow-amber-100/50 relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-200/50 blur-[100px] rounded-full pointer-events-none" />
                    <ShieldAlert size={48} className="mx-auto text-amber-500 mb-6" />
                    <h3 className="text-xl font-black text-amber-950 mb-3">গুরুত্বপূর্ণ সতর্কতা</h3>
                    <p className="text-amber-900/80 font-bold max-w-2xl mx-auto leading-relaxed text-sm md:text-base mb-6">
                        {ctx.disclaimer}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700/60">{ctx.lastUpdatedLabel}</p>
                </div>
            </div>
        </div>
    );
}

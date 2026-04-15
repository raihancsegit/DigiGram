'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
    MapPin, Home, Sparkles, ArrowUpRight, ArrowRight,
    Users, UserCheck, ShieldCheck, School, GraduationCap, 
    BookOpen, Phone, UserCircle, CheckCircle2, LogIn, ChevronLeft, ChevronRight, Building2
} from 'lucide-react';
import { applyLocationSnapshot, openModal } from '@/lib/store/features/locationSlice';
import { SERVICE_CATEGORIES } from '@/lib/constants/serviceCategories';
import { paths } from '@/lib/constants/paths';
import { layout } from '@/lib/theme';
import UnionNewsSection from './UnionNewsSection';
import { Activity, BellRing, Navigation } from 'lucide-react';
import { parseBnInt, toBnDigits } from '@/lib/utils/format';

export default function UnionPortalClient({ ctx }) {
    const dispatch = useDispatch();
    const { district, upazila, union } = ctx;
    const { dynamicWardData } = useSelector((state) => state.wardData);

    // Merge static and dynamic ward data
    const mergedWards = useMemo(() => {
        return (union.wards || []).map(ward => {
            const key = `${union.slug}-${ward.id}`;
            const dynamic = dynamicWardData[key];
            
            // Normalize villages to objects if they are strings
            const villagesSource = dynamic?.villages || ward.villages || [];
            const normalizedVillages = villagesSource.map(v => 
                typeof v === 'string' ? { name: v, population: '0', voters: '0' } : v
            );

            // Per-ward stats aggregation
            const stats = normalizedVillages.reduce((acc, v) => ({
                population: acc.population + parseBnInt(v.population || '0'),
                voters: acc.voters + parseBnInt(v.voters || '0'),
                schools: acc.schools + parseBnInt(v.schools || '0'),
                mosques: acc.mosques + parseBnInt(v.mosques || '0'),
                madrassas: acc.madrassas + parseBnInt(v.madrassas || '0'),
            }), { population: 0, voters: 0, schools: 0, mosques: 0, madrassas: 0 });

            if (!dynamic) return { ...ward, villages: normalizedVillages, stats };
            
            return {
                ...ward,
                member: {
                    ...ward.member,
                    name: dynamic.memberName || ward.member?.name,
                    phone: dynamic.memberPhone || ward.member?.phone,
                },
                villages: normalizedVillages,
                population: toBnDigits(stats.population.toString()), // Dynamic rollup
                voters: toBnDigits(stats.voters.toString()), // Dynamic rollup
                stats, // Included for card display
            };
        });
    }, [union.wards, union.slug, dynamicWardData]);

    // Aggregate all village names for the news section
    const allVillages = mergedWards.reduce((acc, ward) => [
        ...acc, 
        ...(ward.villages || []).map(v => typeof v === 'string' ? v : v.name)
    ], []);

    const WARDS_PER_PAGE = 2;
    const [wardPage, setWardPage] = useState(0);
    const totalWards = mergedWards.length;
    const totalWardPages = Math.ceil(totalWards / WARDS_PER_PAGE);
    const pagedWards = mergedWards.slice(wardPage * WARDS_PER_PAGE, wardPage * WARDS_PER_PAGE + WARDS_PER_PAGE);

    useEffect(() => {
        dispatch(
            applyLocationSnapshot({
                district: district.name,
                districtId: district.id,
                upazila: upazila.name,
                upazilaId: upazila.id,
                union: union.name,
                unionSlug: union.slug,
                village: '',
            })
        );
    }, [dispatch, district.id, district.name, upazila.id, upazila.name, union.name, union.slug]);

    // Aggregate all granular stats
    const aggregatedData = useMemo(() => {
        return mergedWards.reduce((acc, w) => {
            const wardVillages = w.villages || [];
            const villageTotals = wardVillages.reduce((vAcc, v) => ({
                schools: vAcc.schools + parseBnInt(v.schools || '0'),
                mosques: vAcc.mosques + parseBnInt(v.mosques || '0'),
                madrassas: vAcc.madrassas + parseBnInt(v.madrassas || '0'),
                orphanages: vAcc.orphanages + parseBnInt(v.orphanages || '0'),
            }), { schools: 0, mosques: 0, madrassas: 0, orphanages: 0 });

            return {
                population: acc.population + parseBnInt(w.population),
                voters: acc.voters + parseBnInt(w.voters),
                schools: acc.schools + villageTotals.schools,
                mosques: acc.mosques + villageTotals.mosques,
                madrassas: acc.madrassas + villageTotals.madrassas,
                orphanages: acc.orphanages + villageTotals.orphanages,
            };
        }, { population: 0, voters: 0, schools: 0, mosques: 0, madrassas: 0, orphanages: 0 });
    }, [mergedWards]);

    const stats = [
        { label: 'মোট ওয়াড', value: toBnDigits(mergedWards.length.toString()), icon: MapPin, color: 'text-teal-600', bg: 'bg-teal-50' },
        { label: 'মোট গ্রাম', value: toBnDigits(allVillages.length.toString()), icon: MapPin, color: 'text-sky-600', bg: 'bg-sky-50' },
        { label: 'মোট জনসংখ্যা', value: aggregatedData.population > 0 ? `${toBnDigits(aggregatedData.population.toLocaleString())}+` : '৪৫,০০০+', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'মোট ভোটার', value: aggregatedData.voters > 0 ? `${toBnDigits(aggregatedData.voters.toLocaleString())}+` : '২৮,৫০০+', icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    const educationStats = [
        { label: 'প্রাথমিক/উচ্চ বিদ্যালয়', value: aggregatedData.schools > 0 ? `${toBnDigits(aggregatedData.schools.toString())}টি` : '১৮টি', icon: School, color: 'text-orange-600' },
        { label: 'মসজিদ', value: aggregatedData.mosques > 0 ? `${toBnDigits(aggregatedData.mosques.toString())}টি` : '৩৬টি', icon: Building2, color: 'text-rose-600' },
        { label: 'মাদ্রাসা', value: aggregatedData.madrassas > 0 ? `${toBnDigits(aggregatedData.madrassas.toString())}টি` : '১৪টি', icon: BookOpen, color: 'text-sky-600' },
        { label: 'এতিমখানা', value: aggregatedData.orphanages > 0 ? `${toBnDigits(aggregatedData.orphanages.toString())}টি` : '৫টি', icon: Home, color: 'text-amber-600' },
    ];

    return (
        <div className="bg-[#F8FAFC] pb-32">
            
            {/* Edge-to-Edge Hero Background Area */}
            <div className="relative pt-6 md:pt-10 pb-32 md:pb-40 px-4 md:px-6 bg-slate-900 overflow-hidden border-b border-slate-800 rounded-b-[48px] md:rounded-b-[80px]">
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/4" />
                </div>
                
                <div className="max-w-[1200px] mx-auto relative z-10">
                
                {/* Upper Navigation */}
                <div className="flex items-center justify-between gap-3 mb-6">
                    <Link
                        href={paths.home}
                        className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[color:var(--dg-teal)] transition-colors"
                    >
                        <div className="p-2 rounded-xl bg-white border border-slate-200 group-hover:border-teal-200 group-hover:bg-teal-50 transition-all shadow-sm">
                            <Home size={18} />
                        </div>
                        ডিজিটাল গ্রাম হোম
                    </Link>
                    <button
                        type="button"
                        onClick={() => dispatch(openModal())}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-extrabold text-slate-700 hover:border-teal-300 hover:bg-teal-50/80 transition-all shadow-sm active:scale-95"
                    >
                        <MapPin size={16} className="text-teal-600" />
                        ইউনিয়ন বদলান
                    </button>
                </div>

                {/* Hero Dashboard Title */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative mt-8"
                >
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="flex-1 text-white">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-wrap items-center gap-2 mb-6"
                            >
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                                    <Sparkles size={12} />
                                    {district.name} · {upazila.name}
                                </span>
                            </motion.div>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
                                {union.name} <span className="text-teal-400">ইউনিয়ন</span>
                            </h1>
                            <div className="flex flex-wrap gap-3">
                                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur-md border border-white/5 shadow-lg shadow-black/20">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    স্মার্ট পোর্টাল একটিভ
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-2xl bg-teal-500/20 text-teal-100 px-4 py-2 text-xs font-bold border border-teal-500/20 shadow-lg shadow-black/20">
                                    <MapPin size={14} className="text-teal-400" />
                                    {mergedWards.length || 0}টি ওয়াড · {allVillages.length}টি গ্রাম
                                </div>
                            </div>
                        </div>

                        {/* Quick Action Card inside Hero */}
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="hidden lg:block shrink-0 p-6 rounded-[32px] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 w-72 shadow-2xl relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                                <Phone size={100} />
                            </div>
                            <p className="text-[10px] font-black uppercase text-teal-300 mb-4 tracking-widest relative z-10 flex items-center gap-2">
                                <BellRing size={12} />
                                জরুরি যোগাযোগ
                            </p>
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 border border-white/5 mb-2 relative z-10 hover:bg-white/15 transition-colors cursor-pointer active:scale-95">
                                <div className="p-3 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-500/30">
                                    <Phone size={20} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-teal-200">জাতীয় হেল্পলাইন</p>
                                    <p className="text-xl font-black tracking-tighter leading-none text-white mt-1">৩৩৩</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.section>
            </div>
        </div>

            {/* Main Content Area - Pulled up to overlap hero */}
            <div className="max-w-[1200px] mx-auto px-4 -mt-24 relative z-20">

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
                    
                    {/* Left Column */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {stats.map((s, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 + 0.3 }}
                                    key={s.label} 
                                    className="p-5 rounded-[24px] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:border-teal-200 transition-all hover:-translate-y-1 group"
                                >
                                    <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <s.icon className={s.color} size={24} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">{s.label}</p>
                                    <p className="text-xl font-black text-slate-800 tracking-tight">{s.value}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* ===== WARD SECTION ===== */}
                        <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <ShieldCheck className="text-teal-600" />
                                    ইউনিয়নের ওয়াডসমূহ
                                </h2>
                                <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-100 uppercase tracking-wider">
                                    {totalWards} টি ওয়াড
                                </span>
                            </div>

                            <div className="space-y-4">
                                {pagedWards.map((ward, idx) => (
                                    <motion.div
                                        key={ward.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.08 + 0.4 }}
                                    >
                                        <Link
                                            href={`/u/${union.slug}/w/${ward.id}`}
                                            className="block border border-slate-100 rounded-[24px] overflow-hidden group hover:border-teal-300 hover:shadow-xl transition-all duration-300 bg-white"
                                        >
                                            {/* Ward Header */}
                                            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-white relative overflow-hidden">
                                                <div className="absolute right-0 top-0 w-32 h-32 bg-teal-50 rounded-full blur-[40px] group-hover:bg-teal-100 transition-colors pointer-events-none" />
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-teal-200 shrink-0 group-hover:scale-110 transition-transform">
                                                        {wardPage * WARDS_PER_PAGE + idx + 1}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-slate-800 text-lg group-hover:text-teal-700 transition-colors leading-tight">{ward.name}</h3>
                                                        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{ward.villages?.length || 0}টি গ্রাম</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 relative z-10">
                                                    {/* Member Badge */}
                                                    {ward.member && (
                                                        <div className="hidden sm:flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-2 shadow-sm group-hover:border-teal-100 transition-colors">
                                                            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100">
                                                                <UserCircle size={20} className="text-teal-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-teal-600 uppercase tracking-wider leading-none mb-0.5">নির্বাচিত মেম্বার</p>
                                                                <p className="text-sm font-black text-slate-700 leading-none">{ward.member.name}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:border-teal-500 transition-all shadow-sm">
                                                        <ArrowRight size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Ward Stats Bar - Added detailed info */}
                                            <div className="px-5 py-4 border-t border-slate-50 bg-slate-50/50 grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                        <UserCheck size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">ভোটার</p>
                                                        <p className="text-xs font-black text-slate-800 leading-none">{toBnDigits(ward.stats?.voters.toString() || '0')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                                                        <School size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">শিক্ষা প্রতিষ্ঠান</p>
                                                        <p className="text-xs font-black text-slate-800 leading-none">{toBnDigits(ward.stats?.schools.toString() || '0')}টি</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                                        <Building2 size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">মসজিদ</p>
                                                        <p className="text-xs font-black text-slate-800 leading-none">{toBnDigits(ward.stats?.mosques.toString() || '0')}টি</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                                                        <MapPin size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">গ্রাম সংখ্যা</p>
                                                        <p className="text-xs font-black text-slate-800 leading-none">{toBnDigits(ward.villages?.length.toString() || '0')}টি</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Village Pills - Keep compact */}
                                            <div className="px-5 pb-5 pt-3 border-t border-slate-50 bg-white group-hover:bg-slate-50/30 transition-colors">
                                                <div className="flex flex-wrap gap-2">
                                                    {(ward.villages || []).slice(0, 4).map((v) => (
                                                        <span
                                                            key={typeof v === 'string' ? v : v.name}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-500"
                                                        >
                                                            {typeof v === 'string' ? v : v.name}
                                                        </span>
                                                    ))}
                                                    {ward.villages?.length > 4 && (
                                                        <span className="text-[10px] font-black text-teal-600 pt-1">+{toBnDigits((ward.villages.length - 4).toString())} আরো</span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalWardPages > 1 && (
                                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setWardPage((p) => Math.max(0, p - 1))}
                                        disabled={wardPage === 0}
                                        className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft size={16} />
                                        আগের পাতা
                                    </button>
                                    <span className="text-xs font-black text-slate-400">
                                        {wardPage + 1} / {totalWardPages}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setWardPage((p) => Math.min(totalWardPages - 1, p + 1))}
                                        disabled={wardPage === totalWardPages - 1}
                                        className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        পরের পাতা
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}

                            {/* Member Login CTA */}
                            <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-teal-400 mb-1">মেম্বার পোর্টাল</p>
                                    <p className="font-black text-base">আপনি কি নির্বাচিত মেম্বার?</p>
                                    <p className="text-slate-400 text-xs font-bold mt-1">লগইন করুন এবং আপনার ওয়াডের তথ্য আপডেট করুন।</p>
                                </div>
                                <Link
                                    href="/login"
                                    className="shrink-0 flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-black text-sm px-6 py-3 rounded-2xl shadow-lg shadow-teal-900/40 transition-all active:scale-95 whitespace-nowrap"
                                >
                                    <LogIn size={18} />
                                    মেম্বার লগইন
                                </Link>
                            </div>
                        </div>

                        {/* Education Stats */}
                        <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <School className="text-teal-600" />
                                    শিক্ষা প্রতিষ্ঠান
                                </h2>
                                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">ডেটা আপডেট আজ</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {educationStats.map((ed) => (
                                    <div key={ed.label} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-teal-200 transition-all">
                                        <div className="p-3 rounded-xl bg-white shadow-sm group-hover:scale-110 transition-transform">
                                            <ed.icon size={20} className={ed.color} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1.5">{ed.label}</p>
                                            <p className="text-base font-black text-slate-700 leading-none">{ed.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Chairman and Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Chairman Profile Card */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="relative overflow-hidden p-8 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 text-center"
                        >
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-slate-900 to-teal-900 overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500 rounded-full blur-[40px] opacity-30 pointer-events-none" />
                            </div>
                            
                            <div className="relative mt-8 mb-6 mx-auto w-28 h-28 rounded-full p-1 border-4 border-white shadow-xl bg-white">
                                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                    <UserCircle size={80} className="text-slate-300" />
                                </div>
                            </div>
                            
                            <h3 className="text-2xl font-black text-slate-800 mb-1 leading-tight">মোঃ আব্দুর রহমান</h3>
                            <p className="text-xs font-bold text-teal-600 bg-teal-50 px-4 py-1.5 rounded-full w-fit mx-auto mb-6 border border-teal-100">সম্মানিত চেয়ারম্যান</p>
                            
                            <div className="space-y-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex items-center justify-between text-left">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">দায়িত্বকাল</p>
                                    <p className="text-sm font-black text-slate-700">বর্তমান মেয়াদে আছেন</p>
                                </div>
                                <div className="w-full h-px bg-slate-200" />
                                <div className="flex items-center justify-between text-left">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">সাক্ষাতের সময়</p>
                                    <p className="text-sm font-black text-slate-700 text-right">রবি-বৃহঃ<br/>সকাল ১০টা - ৩টা</p>
                                </div>
                            </div>

                            <button className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-teal-600 text-white font-black text-sm shadow-xl shadow-slate-200 hover:shadow-teal-200 active:scale-95 transition-all flex items-center justify-center gap-2 group">
                                <Phone size={18} className="group-hover:animate-bounce" />
                                সরাসরি যোগাযোগ করুন
                            </button>
                        </motion.div>

                        {/* Compact Ward Members List */}
                        <div className="p-6 rounded-[32px] bg-white border border-slate-200/60 shadow-sm">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-teal-600" />
                                ওয়াড মেম্বারগণ
                            </h4>
                            <div className="space-y-3">
                                {mergedWards.map((ward) => (
                                    ward.member && (
                                        <div key={ward.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-100 transition-all">
                                            <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100 shrink-0">
                                                <UserCircle size={20} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-black text-slate-800 truncate">{ward.member.name}</p>
                                                <p className="text-[10px] font-bold text-teal-600">{ward.name}</p>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                        {/* Portal Info */}
                        <div className="p-6 rounded-[32px] bg-slate-900 text-white border border-slate-800 shadow-xl overflow-hidden relative group">
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-teal-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity" />
                            <h4 className="text-sm font-black uppercase tracking-widest text-teal-400 mb-2">ডিজিটাল প্রসেস</h4>
                            <p className="text-xs font-medium text-slate-400 leading-relaxed">এই ইউনিয়নের প্রতিটি গ্রাম ভিত্তিক সেবা আমরা পর্যায়ক্রমে চালু করছি। ওয়াড মেম্বাররা তাদের ওয়াডের তথ্য আপডেট করতে পারবেন।</p>
                        </div>
                    </div>
                </div>

                {/* Union News Section */}
                <UnionNewsSection 
                    unionName={union.name} 
                    villages={allVillages} 
                />

                {/* Services Section */}
                <section>
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                        <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-teal-600 mb-2">
                                ইউনিয়ন সেবাসমূহ
                            </p>
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
                                প্রয়োজনীয় ডিজিটাল সেবা
                            </h2>
                        </div>
                    </div>

                    <motion.ul
                        initial="hidden"
                        animate="show"
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: { staggerChildren: 0.04, delayChildren: 0.05 },
                            },
                        }}
                        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 list-none p-0 m-0"
                    >
                        {SERVICE_CATEGORIES.map((cat) => (
                            <motion.li
                                key={cat.id}
                                variants={{
                                    hidden: { opacity: 0, y: 14 },
                                    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 28 } },
                                }}
                            >
                                <Link
                                    href={`${paths.service(cat.id)}?u=${encodeURIComponent(union.slug)}`}
                                    className="group relative flex h-full flex-col overflow-hidden rounded-[28px] bg-white border border-slate-200/60 p-5 sm:p-6 hover:shadow-xl hover:border-teal-200 hover:-translate-y-1.5 transition-all duration-300"
                                >
                                    <div
                                        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${cat.gradient} opacity-[0.08] blur-2xl transition-opacity group-hover:opacity-[0.15]`}
                                    />
                                    <div className="relative flex items-start justify-between gap-2 mb-4">
                                        <div
                                            className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[20px] bg-gradient-to-br ${cat.gradient} text-white shadow-lg ring-4 ring-white group-hover:scale-110 transition-transform duration-500`}
                                        >
                                            <cat.icon size={24} strokeWidth={2.2} />
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${
                                                cat.free ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900 border border-amber-200'
                                            }`}
                                        >
                                            {cat.free ? 'ফ্রি' : 'প্রিমিয়াম'}
                                        </span>
                                    </div>
                                    <h3 className="relative mt-auto text-base sm:text-lg font-black text-slate-800 leading-tight">
                                        {cat.title}
                                    </h3>
                                    <p className="relative mt-1 text-xs font-bold text-slate-400 group-hover:text-slate-500 transition-colors leading-relaxed">
                                        {cat.subtitle}
                                    </p>
                                    <div className="relative mt-4 flex items-center gap-1.5 text-[11px] font-black text-teal-600 group-hover:translate-x-1 transition-transform">
                                        বিস্তারিত দেখুন
                                        <ArrowUpRight size={14} />
                                    </div>
                                </Link>
                            </motion.li>
                        ))}
                    </motion.ul>
                </section>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { 
    MapPin, Home, Sparkles, ArrowUpRight, 
    Users, UserCheck, ShieldCheck, School, GraduationCap, 
    BookOpen, Phone, UserCircle, CheckCircle2, LogIn, ChevronLeft, ChevronRight
} from 'lucide-react';
import { applyLocationSnapshot, openModal } from '@/lib/store/features/locationSlice';
import { SERVICE_CATEGORIES } from '@/lib/constants/serviceCategories';
import { paths } from '@/lib/constants/paths';
import { layout } from '@/lib/theme';
import UnionNewsSection from './UnionNewsSection';

export default function UnionPortalClient({ ctx }) {
    const dispatch = useDispatch();
    const { district, upazila, union } = ctx;

    // Aggregate all villages from all wards
    const allVillages = union.wards?.reduce((acc, ward) => [...acc, ...(ward.villages || [])], []) || [];

    const WARDS_PER_PAGE = 2;
    const [wardPage, setWardPage] = useState(0);
    const totalWards = union.wards?.length || 0;
    const totalWardPages = Math.ceil(totalWards / WARDS_PER_PAGE);
    const pagedWards = (union.wards || []).slice(wardPage * WARDS_PER_PAGE, wardPage * WARDS_PER_PAGE + WARDS_PER_PAGE);

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

    const stats = [
        { label: 'মোট ওয়াড', value: union.wards?.length || 0, icon: MapPin, color: 'text-teal-600', bg: 'bg-teal-50' },
        { label: 'মোট গ্রাম', value: allVillages.length, icon: MapPin, color: 'text-sky-600', bg: 'bg-sky-50' },
        { label: 'মোট জনসংখ্যা', value: '৪৫,০০০+', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'মোট ভোটার', value: '২৮,৫০০+', icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    const educationStats = [
        { label: 'প্রাথমিক/উচ্চ বিদ্যালয়', value: '১৮টি', icon: School, color: 'text-orange-600' },
        { label: 'কলেজ', value: '২টি', icon: GraduationCap, color: 'text-rose-600' },
        { label: 'দাখিল/আলিম মাদ্রাসা', value: '৫টি', icon: BookOpen, color: 'text-sky-600' },
        { label: 'হাফেজিয়া মাদ্রাসা', value: '৯টি', icon: BookOpen, color: 'text-amber-600' },
    ];

    return (
        <div className="dg-section-x px-2 md:px-6 pb-32 pt-4 md:pt-8 bg-slate-50/50">
            <div className="max-w-[1200px] mx-auto" style={{ maxWidth: layout.servicesMaxPx }}>
                
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
                    className="relative overflow-hidden rounded-[32px] md:rounded-[48px] border-4 border-white bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white shadow-xl mb-10"
                >
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgba(45,212,191,0.4),transparent)] pointer-events-none" />
                    <div className="relative p-8 sm:p-12 md:p-16 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-teal-300/90 text-xs font-black uppercase tracking-[0.2em] mb-4">
                                <Sparkles size={14} />
                                {district.name} · {upazila.name}
                            </div>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
                                {union.name} <span className="text-teal-400">ইউনিয়ন</span>
                            </h1>
                            <div className="flex flex-wrap gap-3">
                                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur-md border border-white/10">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    স্মার্ট পোর্টাল একটিভ
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-2xl bg-teal-500/20 text-teal-100 px-4 py-2 text-xs font-bold border border-teal-500/20">
                                    <CheckCircle2 size={14} className="text-teal-400" />
                                    {union.wards?.length || 0}টি ওয়াড · {allVillages.length}টি গ্রাম
                                </div>
                            </div>
                        </div>

                        {/* Quick Action Card inside Hero */}
                        <div className="hidden lg:block shrink-0 p-6 rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 w-72">
                            <p className="text-[10px] font-black uppercase text-teal-300 mb-4 tracking-widest text-center">জরুরি যোগাযোগ</p>
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 border border-white/5 mb-3">
                                <div className="p-3 rounded-full bg-teal-500 shadow-lg shadow-teal-500/30">
                                    <Phone size={20} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-teal-200">হেল্পলাইন</p>
                                    <p className="text-lg font-black tracking-tighter leading-none">৩৩৩</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>


                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
                    
                    {/* Left Column */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {stats.map((s, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={s.label} 
                                    className="p-5 rounded-3xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className={`w-10 h-10 rounded-2xl ${s.bg} flex items-center justify-center mb-3`}>
                                        <s.icon className={s.color} size={20} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                                    <p className="text-lg font-black text-slate-800">{s.value}</p>
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
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.08 }}
                                    >
                                        <Link
                                            href={`/u/${union.slug}/w/${ward.id}`}
                                            className="block border border-slate-200 rounded-[24px] overflow-hidden group hover:border-teal-300 hover:shadow-lg transition-all duration-300"
                                        >
                                            {/* Ward Header */}
                                            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-white">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-teal-200 shrink-0">
                                                        {wardPage * WARDS_PER_PAGE + idx + 1}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-slate-800 text-base group-hover:text-teal-700 transition-colors">{ward.name}</h3>
                                                        <p className="text-xs font-bold text-slate-400 mt-0.5">{ward.villages?.length || 0}টি গ্রাম</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {/* Member Badge */}
                                                    {ward.member && (
                                                        <div className="hidden sm:flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-2 shadow-sm">
                                                            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100">
                                                                <UserCircle size={20} className="text-teal-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-teal-600 uppercase tracking-wider leading-none mb-0.5">নির্বাচিত মেম্বার</p>
                                                                <p className="text-sm font-black text-slate-700 leading-none">{ward.member.name}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="w-9 h-9 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:border-teal-500 transition-all">
                                                        <ArrowUpRight size={16} className="text-teal-600 group-hover:text-white transition-colors" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Village Pills */}
                                            <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-white/50">
                                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-3">এই ওয়াডের গ্রামসমূহ</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(ward.villages || []).map((v) => (
                                                        <span
                                                            key={v}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-600 group-hover:border-teal-100 transition-all"
                                                        >
                                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                                                            {v}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalWardPages > 1 && (
                                <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
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
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative overflow-hidden p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-lg text-center"
                        >
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-teal-500 to-emerald-600 opacity-10" />
                            <div className="relative mb-6 mx-auto w-24 h-24 rounded-full p-1 border-2 border-teal-500 ring-8 ring-teal-50">
                                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                    <UserCircle size={64} className="text-slate-300" />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-1">চেয়ারম্যান তথ্য</h3>
                            <p className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full w-fit mx-auto mb-6">দায়িত্বরত আছেন</p>
                            
                            <div className="space-y-3 mb-8">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">চেয়ারম্যান নাম</p>
                                    <p className="text-lg font-black text-slate-700">মোঃ আব্দুর রহমান</p>
                                </div>
                                <div className="w-full h-px bg-slate-100" />
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">সাক্ষাতের সময়</p>
                                    <p className="text-sm font-black text-slate-600">প্রতিদিন সকাল ১০টা - ২টা</p>
                                </div>
                            </div>

                            <button className="w-full py-4 rounded-2xl bg-[color:var(--dg-teal)] text-white font-black text-sm shadow-lg shadow-teal-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                                <Phone size={18} />
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
                                {(union.wards || []).map((ward) => (
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
                                প্রয়োজনীয় ডিজিটাল সেবা
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

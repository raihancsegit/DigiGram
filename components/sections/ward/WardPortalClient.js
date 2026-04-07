'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
    MapPin, Home, Sparkles, ArrowUpRight,
    Users, UserCircle, ShieldCheck,
    Phone, CheckCircle2, LogIn, Newspaper, ArrowLeft
} from 'lucide-react';
import { applyLocationSnapshot } from '@/lib/store/features/locationSlice';
import { paths } from '@/lib/constants/paths';
import { layout } from '@/lib/theme';
import PowerWatchSection from '../community/PowerWatchSection';

export default function WardPortalClient({ ctx, ward }) {
    const dispatch = useDispatch();
    const { district, upazila, union } = ctx;
    const { dynamicNews } = useSelector((s) => s.news);
    const { user, isAuthenticated } = useSelector((s) => s.auth);

    const isMyWard = isAuthenticated &&
        user?.role === 'WARD_MEMBER' &&
        user?.wardId === ward.id &&
        user?.unionId === union.slug;

    // Ward-specific news from Redux
    const wardNews = dynamicNews.filter(
        (n) => n.wardId === ward.id && n.unionId === union.slug
    );

    useEffect(() => {
        dispatch(
            applyLocationSnapshot({
                district: district.name,
                districtId: district.id,
                upazila: upazila.name,
                upazilaId: upazila.id,
                union: union.name,
                unionSlug: union.slug,
                ward: ward.name,
                wardId: ward.id,
            })
        );
    }, [dispatch, district, upazila, union, ward]);

    return (
        <div className="dg-section-x px-2 md:px-6 pb-32 pt-4 md:pt-8 bg-slate-50/50">
            <div className="max-w-[1200px] mx-auto" style={{ maxWidth: layout.servicesMaxPx }}>

                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-2 mb-6">
                    <Link href={paths.home} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-teal-50 hover:border-teal-200 transition-all shadow-sm">
                        <Home size={18} className="text-slate-500" />
                    </Link>
                    <span className="text-slate-300">/</span>
                    <Link href={`/u/${union.slug}`} className="text-sm font-bold text-slate-500 hover:text-teal-600 transition-colors">
                        {union.name} ইউনিয়ন
                    </Link>
                    <span className="text-slate-300">/</span>
                    <span className="text-sm font-black text-slate-800">{ward.name}</span>
                </div>

                {/* Hero */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[32px] md:rounded-[48px] border-4 border-white bg-gradient-to-br from-teal-900 via-slate-800 to-slate-900 text-white shadow-xl mb-10"
                >
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_80%_60%_at_80%_0%,rgba(45,212,191,0.5),transparent)] pointer-events-none" />
                    <div className="relative p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-teal-300/90 text-xs font-black uppercase tracking-[0.2em] mb-4">
                                <Sparkles size={14} />
                                {district.name} · {upazila.name} · {union.name}
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1] mb-4">
                                {ward.name} <span className="text-teal-400">পোর্টাল</span>
                            </h1>
                            <div className="flex flex-wrap gap-3 mb-2">
                                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur-md border border-white/10">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    {ward.villages?.length || 0}টি গ্রাম
                                </div>
                                {ward.member && (
                                    <div className="inline-flex items-center gap-2 rounded-2xl bg-teal-500/20 text-teal-100 px-4 py-2 text-xs font-bold border border-teal-500/20">
                                        <ShieldCheck size={14} className="text-teal-400" />
                                        মেম্বার: {ward.member.name}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Member Card or Login CTA */}
                        <div className="hidden lg:block shrink-0 w-72">
                            {isMyWard ? (
                                <Link
                                    href="/ward-member/dashboard"
                                    className="flex flex-col gap-3 p-6 rounded-[28px] bg-teal-500/20 border border-teal-400/30 hover:bg-teal-500/30 transition-all"
                                >
                                    <p className="text-[10px] font-black uppercase text-teal-300 tracking-widest">আপনার ড্যাশবোর্ড</p>
                                    <p className="font-black text-white">খবর ও তথ্য আপডেট করুন</p>
                                    <span className="flex items-center gap-2 text-teal-300 text-sm font-bold">
                                        ড্যাশবোর্ডে যান <ArrowUpRight size={16} />
                                    </span>
                                </Link>
                            ) : (
                                <div className="p-6 rounded-[28px] bg-white/5 border border-white/10">
                                    <p className="text-[10px] font-black uppercase text-teal-300 tracking-widest mb-3">মেম্বার পোর্টাল</p>
                                    <p className="text-sm font-bold text-slate-300 mb-4">আপনি কি এই ওয়াডের নির্বাচিত মেম্বার?</p>
                                    <Link
                                        href="/login"
                                        className="flex items-center gap-2 justify-center bg-teal-500 text-white font-black text-sm px-4 py-3 rounded-2xl hover:bg-teal-400 transition-all"
                                    >
                                        <LogIn size={16} />
                                        মেম্বার লগইন
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.section>

                <div className="mb-10">
                    <PowerWatchSection />
                </div>

                {/* Main 2-col Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left: Villages + News */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Village List */}
                        <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-sm">
                            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                <MapPin className="text-teal-600" />
                                {ward.name}-এর গ্রামসমূহ
                                <span className="text-slate-300 font-black ml-1">({ward.villages?.length || 0})</span>
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {(ward.villages || []).map((v, idx) => (
                                    <motion.div
                                        key={v}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-teal-50 hover:border-teal-200 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-teal-600 font-black text-xs shrink-0 group-hover:border-teal-300">
                                            {idx + 1}
                                        </div>
                                        <span className="font-bold text-slate-700 text-sm group-hover:text-teal-700">{v}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Ward News Feed */}
                        <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <Newspaper className="text-teal-600" />
                                    ওয়াড নিউজ ফিড
                                </h2>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{wardNews.length} টি খবর</span>
                            </div>

                            {wardNews.length === 0 ? (
                                <div className="text-center py-12 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                                    <Newspaper className="mx-auto text-slate-300 mb-3" size={40} />
                                    <p className="font-bold text-slate-400 text-sm">এখনো কোনো খবর পোস্ট হয়নি</p>
                                    {!isMyWard && (
                                        <Link href="/login" className="inline-flex items-center gap-1.5 mt-3 text-teal-600 font-bold text-sm hover:underline">
                                            <LogIn size={14} />
                                            মেম্বার লগইন করুন
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {wardNews.map((news, idx) => (
                                        <motion.div
                                            key={news.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.08 }}
                                            className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-teal-200 hover:shadow-md transition-all"
                                        >
                                            <span className="text-[10px] font-black text-teal-600 uppercase tracking-wider mb-2 block">{news.category}</span>
                                            <h3 className="font-black text-slate-800 text-base leading-tight mb-2">{news.title}</h3>
                                            <p className="text-sm text-slate-500 leading-relaxed mb-3">{news.excerpt}</p>
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                                                <span>{news.author} · {news.date}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Member Profile Card */}
                        {ward.member && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="relative overflow-hidden p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-lg text-center"
                            >
                                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-br from-teal-500 to-emerald-600 opacity-10" />
                                <div className="relative mb-5 mx-auto w-20 h-20 rounded-full p-1 border-2 border-teal-500 ring-8 ring-teal-50">
                                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center">
                                        <UserCircle size={52} className="text-slate-300" />
                                    </div>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 mb-1">নির্বাচিত মেম্বার</p>
                                <h3 className="text-lg font-black text-slate-800 mb-1">{ward.member.name}</h3>
                                <p className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full w-fit mx-auto mb-6">{ward.name} · {union.name}</p>
                                <a
                                    href={`tel:${ward.member.phone}`}
                                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[color:var(--dg-teal)] text-white font-black text-sm shadow-lg shadow-teal-600/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    <Phone size={18} />
                                    যোগাযোগ করুন
                                </a>
                            </motion.div>
                        )}

                        {/* Back to Union */}
                        <Link
                            href={`/u/${union.slug}`}
                            className="flex items-center gap-3 p-5 rounded-[24px] bg-slate-900 text-white border border-slate-800 hover:bg-teal-900 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-teal-500 transition-colors">
                                <ArrowLeft size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{union.name} ইউনিয়ন</p>
                                <p className="font-black text-white text-sm">ইউনিয়ন পোর্টালে ফিরুন</p>
                            </div>
                        </Link>

                        {/* Stats mini card */}
                        <div className="p-6 rounded-[28px] bg-white border border-slate-200/60 shadow-sm space-y-4">
                            <h4 className="text-sm font-black uppercase text-slate-400 tracking-wider">ওয়াড তথ্য</h4>
                            <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                <span className="text-sm font-bold text-slate-600">মোট গ্রাম</span>
                                <span className="text-base font-black text-slate-800">{ward.villages?.length || 0}টি</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                <span className="text-sm font-bold text-slate-600">পোস্ট করা খবর</span>
                                <span className="text-base font-black text-teal-600">{wardNews.length}টি</span>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <span className="text-sm font-bold text-slate-600">ইউনিয়নের ওয়াড</span>
                                <span className="text-base font-black text-slate-800">{ctx.union.wards?.length || 0}টির মধ্যে ১টি</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

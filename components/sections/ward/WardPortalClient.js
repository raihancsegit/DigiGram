'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
    MapPin, Home, Sparkles, ArrowUpRight, ArrowRight as LucideArrowRight,
    Users, UserCheck, ShieldCheck, School, GraduationCap, 
    BookOpen, Phone, UserCircle, CheckCircle2, LogIn, ChevronLeft, ChevronRight, Building2, Droplets,
    Activity, BellRing, Navigation, Heart, MoveRight, Newspaper, ArrowLeft
} from 'lucide-react';
import { applyLocationSnapshot } from '@/lib/store/features/locationSlice';
import { paths } from '@/lib/constants/paths';
import { layout } from '@/lib/theme';
import PowerWatchSection from '../community/PowerWatchSection';
import { parseBnInt, toBnDigits } from '@/lib/utils/format';
import PortalLoginModal from '@/components/modals/PortalLoginModal';

export default function WardPortalClient({ ctx, ward: initialWard }) {
    const dispatch = useDispatch();
    const { district, upazila, union } = ctx;
    const { dynamicNews } = useSelector((s) => s.news);
    const { user, isAuthenticated } = useSelector((s) => s.auth);
    const { dynamicWardData } = useSelector((state) => state.wardData);

    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    // Merge static and dynamic ward data
    const ward = useMemo(() => {
        const key = `${union.slug}-${initialWard.id}`;
        const dynamic = dynamicWardData[key];
        
        const villagesSource = dynamic?.villages || initialWard.villages || [];
        const normalizedVillages = villagesSource.map(v => 
            typeof v === 'string' ? { name: v, population: '0', voters: '0', maleVoters: '0', femaleVoters: '0', schools: '0', mosques: '0', madrassas: '0' } : v
        );

        if (!dynamic) return { ...initialWard, villages: normalizedVillages };

        return {
            ...initialWard,
            member: {
                ...initialWard.member,
                name: dynamic.memberName || initialWard.member?.name,
                phone: dynamic.memberPhone || initialWard.member?.phone,
                avatar_url: dynamic.memberAvatar || initialWard.member?.avatar_url,
            },
            villages: normalizedVillages,
            bloodDonors: dynamic.bloodDonors || [],
            population: dynamic.population || initialWard.population,
            voters: dynamic.voters || initialWard.voters,
        };
    }, [initialWard, union.slug, dynamicWardData]);

    const isMyWard = isAuthenticated && 
        user?.role === 'ward_member' && 
        user?.access_scope_id === ward.id;

    // Aggregate institutional stats for this ward
    const wardStats = useMemo(() => {
        const villages = ward.villages || [];
        return villages.reduce((acc, v) => ({
            population: acc.population + parseBnInt(v.population || '0'),
            voters: acc.voters + parseBnInt(v.voters || '0'),
            schools: acc.schools + parseBnInt(v.schools || '0'),
            mosques: acc.mosques + parseBnInt(v.mosques || '0'),
            madrassas: acc.madrassas + parseBnInt(v.madrassas || '0'),
            orphanages: acc.orphanages + parseBnInt(v.orphanages || '0'),
            maleVoters: acc.maleVoters + parseBnInt(v.maleVoters || '0'),
            femaleVoters: acc.femaleVoters + parseBnInt(v.femaleVoters || '0'),
        }), { population: 0, voters: 0, schools: 0, mosques: 0, madrassas: 0, orphanages: 0, maleVoters: 0, femaleVoters: 0 });
    }, [ward.villages]);

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

    const stats = [
        { label: 'মোট গ্রাম', value: toBnDigits((ward.villages?.length || 0).toString()), icon: MapPin, color: 'text-teal-600', bg: 'bg-teal-50' },
        { label: 'রক্তদাতা', value: toBnDigits((ward.bloodDonors?.length || 0).toString()), icon: Droplets, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'মোট জনসংখ্যা', value: toBnDigits((wardStats.population || parseBnInt(ward.population || '0')).toString()), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'মোট ভোটার', value: toBnDigits((wardStats.voters || parseBnInt(ward.voters || '0')).toString()), icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'স্কুল', value: toBnDigits(wardStats.schools.toString()), icon: School, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'মসজিদ', value: toBnDigits(wardStats.mosques.toString()), icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Hero Section */}
            <div className="relative pt-4 md:pt-10 pb-20 md:pb-40 px-3 md:px-6 bg-slate-900 overflow-hidden border-b border-slate-800 rounded-b-[32px] md:rounded-b-[80px]">
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/4" />
                </div>
                
                <div className="max-w-[1200px] mx-auto relative z-10">
                    <div className="flex items-center justify-between gap-3 mb-6">
                        <Link
                            href={`/u/${union.slug}`}
                            className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-teal-400 transition-colors"
                        >
                            <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:bg-teal-500/10 group-hover:border-teal-500/30 transition-all backdrop-blur-md">
                                <ArrowLeft size={18} className="text-white" />
                            </div>
                            {union.name} ইউনিয়ন পোর্টাল
                        </Link>
                        <button
                            type="button"
                            onClick={() => setIsLoginModalOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-white/10 bg-white/5 text-sm font-extrabold text-white hover:bg-white/10 transition-all backdrop-blur-md shadow-sm active:scale-95"
                        >
                            <LogIn size={16} className="text-teal-400" />
                            মেম্বার লগইন
                        </button>
                    </div>

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
                                        ওয়ার্ড পোর্টাল · {ward.name}
                                    </span>
                                </motion.div>
                                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
                                    {ward.name} <span className="text-teal-400">ড্যাশবোর্ড</span>
                                </h1>
                                <div className="flex flex-wrap gap-3">
                                    <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur-md border border-white/5 shadow-lg">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        ডিজিটাল ওয়ার্ড একটিভ
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-2xl bg-teal-500/20 text-teal-100 px-4 py-2 text-xs font-bold border border-teal-500/20">
                                        <MapPin size={14} className="text-teal-400" />
                                        {ward.villages?.length || 0}টি গ্রাম · {toBnDigits(ward.bloodDonors?.length.toString() || '0')} রক্তদাতা
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mini Stats Grid */}
                        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                            {stats.map((s, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 + 0.3 }}
                                    key={s.label} 
                                    className="flex flex-col items-center text-center p-6 rounded-[32px] bg-white/[0.08] backdrop-blur-xl border border-white/5 hover:bg-white/[0.15] hover:border-white/15 transition-all group"
                                >
                                    <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                        <s.icon className={`${s.color} w-6 h-6`} />
                                    </div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{s.label}</p>
                                    <p className="text-lg font-black text-white">{s.value}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1200px] mx-auto px-4 -mt-12 relative z-20 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Power Watch Section integration */}
                        <div className="rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/50">
                            <PowerWatchSection />
                        </div>

                        {/* Villages List */}
                        <div className="rounded-[32px] bg-white border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                        <Navigation className="text-teal-600" />
                                        ওয়ার্ডের গ্রামসমূহ
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500 font-bold">প্রতিটি গ্রামের ডিজিটাল পোর্টাল</p>
                                </div>
                            </div>
                            <div className="p-6 sm:p-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(ward.villages || []).map((v, idx) => {
                                        const isObj = typeof v === 'object';
                                        const vName = isObj ? v.name : v;
                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                            >
                                                <Link
                                                    href={`/u/${union.slug}/w/${ward.id}/v/${encodeURIComponent(vName)}`}
                                                    className="flex flex-col p-5 rounded-[24px] border border-slate-100 bg-white hover:border-teal-300 hover:shadow-lg transition-all group"
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
                                                                <MapPin size={20} />
                                                            </div>
                                                            <h3 className="font-black text-slate-800 text-lg leading-tight">{vName}</h3>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors">
                                                            <MoveRight size={16} />
                                                        </div>
                                                    </div>
                                                    
                                                    {isObj && (
                                                        <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-slate-50">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">জনসংখ্যা</span>
                                                                <span className="text-xs font-black text-slate-700">{toBnDigits(v.population)}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">ভোটার</span>
                                                                <span className="text-xs font-black text-slate-700">{toBnDigits(v.voters)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Link>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Blood Donors Table */}
                        <div className="rounded-[32px] bg-white border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <Droplets className="text-rose-600" />
                                    রক্তদাতা ডাটাবেস
                                </h2>
                                <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-3 py-1 rounded-full uppercase">
                                    {toBnDigits((ward.bloodDonors?.length || 0).toString())} জন
                                </span>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                                            <th className="p-5 pl-8">রক্তদাতা</th>
                                            <th className="p-5">গ্রুপ</th>
                                            <th className="p-5">গ্রাম</th>
                                            <th className="p-5 pr-8 text-right">যোগাযোগ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {(ward.bloodDonors || []).map((donor, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-5 pl-8 font-black text-slate-800 text-sm">{donor.name}</td>
                                                <td className="p-5">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-black text-xs border border-rose-100">
                                                        {donor.group}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-xs font-bold text-slate-500">{donor.village}</td>
                                                <td className="p-5 pr-8 text-right">
                                                    <a href={`tel:${donor.phone}`} className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-black text-sm">
                                                        <Phone size={14} />
                                                        {toBnDigits(donor.phone)}
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!ward.bloodDonors || ward.bloodDonors.length === 0) && (
                                            <tr>
                                                <td colSpan="4" className="p-12 text-center">
                                                    <Droplets className="mx-auto text-slate-200 mb-3" size={40} />
                                                    <p className="font-bold text-slate-400">এই ওয়াডে এখনো কোনো রক্তদাতা তালিকাভুক্ত হয়নি</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Member Profile */}
                        {ward.member && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 text-center relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-slate-900 to-teal-900" />
                                <div className="relative mt-8 mb-6 mx-auto w-28 h-28 rounded-full p-1 border-4 border-white shadow-xl bg-white">
                                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                        {ward.member.avatar_url ? (
                                            <img src={ward.member.avatar_url} alt={ward.member.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserCircle size={80} className="text-slate-300" />
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-1 leading-tight">{ward.member.name}</h3>
                                <p className="text-xs font-bold text-teal-600 bg-teal-50 px-4 py-1.5 rounded-full w-fit mx-auto mb-6 border border-teal-100">নির্বাচিত মেম্বার</p>
                                <a href={`tel:${ward.member.phone}`} className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-teal-600 text-white font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95">
                                    <Phone size={18} />
                                    সরাসরি যোগাযোগ করুন
                                </a>
                            </motion.div>
                        )}

                        {/* Member Dashboard CTA */}
                        <div className="p-6 rounded-[32px] bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-[40px] group-hover:scale-110 transition-transform" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-teal-100 mb-2">অফিসিয়াল প্যানেল</p>
                            <h4 className="font-black text-lg mb-4 leading-tight">আপনি কি এই ওয়াডের মেম্বার?</h4>
                            {isMyWard ? (
                                <Link href="/ward-member/dashboard" className="w-full py-3 rounded-xl bg-white text-emerald-700 font-black text-sm flex items-center justify-center gap-2 hover:bg-teal-50 transition-colors">
                                    ড্যাশবোর্ডে যান <LucideArrowRight size={16} />
                                </Link>
                            ) : (
                                <button onClick={() => setIsLoginModalOpen(true)} className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-colors">
                                    লগইন করুন <LogIn size={16} />
                                </button>
                            )}
                        </div>

                        {/* Ward News Feed */}
                        <div className="rounded-[32px] bg-white border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <Newspaper size={16} className="text-teal-600" />
                                    ওয়াড নিউজ ফিড
                                </h3>
                                <span className="text-[10px] font-black text-slate-400">{toBnDigits(wardNews.length.toString())}টি খবর</span>
                            </div>
                            <div className="p-6 space-y-4">
                                {wardNews.slice(0, 3).map((news, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-100 transition-all group">
                                        <p className="text-[9px] font-black text-teal-600 uppercase mb-1">{news.category}</p>
                                        <h4 className="text-sm font-black text-slate-800 leading-tight group-hover:text-teal-700 transition-colors">{news.title}</h4>
                                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{news.excerpt}</p>
                                    </div>
                                ))}
                                {wardNews.length === 0 && (
                                    <div className="text-center py-6">
                                        <p className="text-xs font-bold text-slate-400">কোনো খবর নেই</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Breakdown */}
                        <div className="p-8 rounded-[32px] bg-slate-900 text-white border border-slate-800 shadow-xl">
                            <h4 className="text-xs font-black uppercase tracking-widest text-teal-400 mb-6">প্রতিষ্ঠানের তথ্য</h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">মাদ্রাসা</p>
                                    <p className="text-base font-black flex items-center gap-2">
                                        <BookOpen size={16} className="text-teal-500" />
                                        {toBnDigits(wardStats.madrassas.toString())}টি
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">এতিমখানা</p>
                                    <p className="text-base font-black flex items-center gap-2">
                                        <Heart size={16} className="text-rose-500" />
                                        {toBnDigits(wardStats.orphanages.toString())}টি
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">পুরুষ ভোটার</p>
                                    <p className="text-base font-black flex items-center gap-2">
                                        <UserCircle size={16} className="text-blue-500" />
                                        {toBnDigits(wardStats.maleVoters.toString())}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">মহিলা ভোটার</p>
                                    <p className="text-base font-black flex items-center gap-2">
                                        <UserCircle size={16} className="text-violet-500" />
                                        {toBnDigits(wardStats.femaleVoters.toString())}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PortalLoginModal 
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                defaultRole="ward_member"
                locationName={`${ward.name}, ${union.name}`}
            />
        </div>
    );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
    MapPin, Home, Sparkles, Building2, School, BookOpen, Clock, Heart, MoveRight, 
    Newspaper, Phone, Droplets, Users, ArrowLeft, ShieldCheck, UserCircle,
    Store, Sprout, AlertCircle, PhoneCall, Shield, Megaphone
} from 'lucide-react';
import { layout } from '@/lib/theme';
import { paths } from '@/lib/constants/paths';
import { toBnDigits } from '@/lib/utils/format';
import PortalLoginModal from '@/components/modals/PortalLoginModal';

export default function VillagePortalClient({ ctx, ward, village }) {
    const { district, upazila, union, volunteers = [] } = ctx || {};
    const { dynamicNews } = useSelector((s) => s.news);
    const { dynamicWardData } = useSelector((state) => state.wardData);
    const { user, isAuthenticated } = useSelector((s) => s.auth);
    
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    
    // Normalize village data from DB
    const isObj = typeof village === 'object';
    const vName = isObj ? (village.name_bn || village.name) : village;
    const vPop = isObj && village.stats ? toBnDigits(village.stats.population || '0') : '---';
    const vVoters = isObj && village.stats ? toBnDigits(village.stats.voters || '0') : '---';
    
    // Get Ward dynamic data for member & blood donors
    const wardKey = `${union.slug}-${ward.id}`;
    const dWard = dynamicWardData[wardKey] || {};
    
    // Ward member (serves as the village's elected rep)
    const member = {
        name: dWard.memberName || ward.member?.name,
        phone: dWard.memberPhone || ward.member?.phone,
    };

    // Filter Blood donors specific to this village
    const allBloodDonors = dWard.bloodDonors || ward.bloodDonors || [];
    const villageBloodDonors = allBloodDonors.filter(d => 
        d.village === vName || d.village?.includes(vName) || vName.includes(d.village)
    );

    const isMyVillage = isAuthenticated && 
        user?.role === 'volunteer' && 
        user?.access_scope_id === village.id;

    // Mock Village News
    const villageNews = dynamicNews.filter(
        (n) => n.wardId === ward.id && n.unionId === union.slug
    ).slice(0, 3); // Showing generic ward news for this mock, limited to 3

    // Dynamic Institutions from DB
    const stats = village.stats || {};
    const institutions = [
        {
            type: 'mosque',
            label: 'স্মার্ট মসজিদ ও স্বচ্ছ হিসাব',
            subtext: 'আয়-ব্যয়ের হিসাব ও ধর্মীয় সেবা গেইটওয়ে',
            icon: Building2,
            color: 'emerald',
            items: Array.isArray(stats.mosques) ? stats.mosques.map((m, idx) => ({
                id: `mosque-${idx}`,
                name: m,
                features: 'স্বচ্ছ হিসাব · ডিজিটাল পাসবুক',
                url: '#'
            })) : (typeof stats.mosques === 'string' && stats.mosques !== '0' ? [{
                id: 'm-1',
                name: stats.mosques,
                features: 'ডিজিটাল রেকর্ড',
                url: '#'
            }] : [])
        },
        {
            type: 'school',
            label: 'শিক্ষা প্রতিষ্ঠান বিবরণ',
            subtext: 'প্রাথমিক ও মাধ্যমিক বিদ্যালয়',
            icon: School,
            color: 'blue',
            items: Array.isArray(stats.schools) ? stats.schools.map((s, idx) => ({
                id: `school-${idx}`,
                name: s,
                features: 'শিক্ষা তথ্য ও ডিজিটাল হাজিরা',
                url: '#'
            })) : (typeof stats.schools === 'string' && stats.schools !== '0' ? [{
                id: 's-1',
                name: stats.schools,
                features: 'শিক্ষা তথ্য',
                url: '#'
            }] : [])
        },
        {
            type: 'madrassa',
            label: 'মাদরাসা ও এতিমখানা',
            subtext: 'ধর্মীয় শিক্ষা ও সেবা প্রতিষ্ঠান',
            icon: BookOpen,
            color: 'slate',
            items: Array.isArray(stats.madrassas) ? stats.madrassas.map((m, idx) => ({
                id: `madrassa-${idx}`,
                name: m,
                features: 'ডিজিটাল রেকর্ড',
                url: '#'
            })) : (typeof stats.madrassas === 'string' && stats.madrassas !== '0' ? [{
                id: 'md-1',
                name: stats.madrassas,
                features: 'ডিজিটাল রেকর্ড',
                url: '#'
            }] : [])
        },
    ];

    return (
        <div className="dg-section-x px-2 md:px-6 pb-32 pt-4 md:pt-8 bg-slate-50/50">
            <div className="max-w-[1200px] mx-auto" style={{ maxWidth: layout.servicesMaxPx }}>
                
                {/* Breadcrumb Navigation */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <Link href={paths.home} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-teal-50 hover:border-teal-200 transition-all shadow-sm">
                        <Home size={18} className="text-slate-500" />
                    </Link>
                    <span className="text-slate-300">/</span>
                    <Link href={paths.unionPortal(union.slug)} className="text-sm font-bold text-slate-500 hover:text-teal-600 transition-colors">
                        {union.name}
                    </Link>
                    <span className="text-slate-300">/</span>
                    <Link href={paths.wardPortal(ward.id)} className="text-sm font-bold text-slate-500 hover:text-teal-600 transition-colors">
                        {ward.name}
                    </Link>
                    <span className="text-slate-300">/</span>
                    <span className="text-sm font-black text-slate-800 break-words">{vName}</span>
                </div>

                {/* Hero section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[32px] md:rounded-[48px] border-4 border-white bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white shadow-xl mb-10"
                >
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_80%_60%_at_80%_0%,rgba(45,212,191,0.6),transparent)] pointer-events-none" />
                    <div className="relative p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-teal-300 text-xs font-black uppercase tracking-[0.2em] mb-4">
                                <Sparkles size={14} />
                                {union.name} ইউনিয়ন · {ward.name}
                            </div>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6 text-white">
                                {vName} <span className="text-teal-400">গ্রাম</span>
                            </h1>
                            <div className="flex flex-wrap gap-4">
                                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 w-fit min-w-[120px] pr-8">
                                    <p className="text-[10px] font-black uppercase text-teal-300 tracking-wider mb-1 flex items-center gap-1.5"><Users size={12}/> মোট জনসংখ্যা</p>
                                    <p className="text-2xl font-black text-white">{vPop}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-teal-500/20 backdrop-blur-md border border-teal-400/20 w-fit min-w-[120px] pr-8">
                                    <p className="text-[10px] font-black uppercase text-teal-200 tracking-wider mb-1 flex items-center gap-1.5"><Heart size={12}/> মোট ভোটার</p>
                                    <p className="text-2xl font-black text-white">{vVoters}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-800/40 backdrop-blur-md border border-slate-700/50 w-fit min-w-[120px] pr-8">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1.5"><UserCircle size={12}/> পুরুষ ভোটার</p>
                                    <p className="text-2xl font-black text-white">{isObj && village.stats?.maleVoters ? toBnDigits(village.stats.maleVoters) : '---'}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-800/40 backdrop-blur-md border border-slate-700/50 w-fit min-w-[120px] pr-8">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1.5"><UserCircle size={12}/> মহিলা ভোটার</p>
                                    <p className="text-2xl font-black text-white">{isObj && village.stats?.femaleVoters ? toBnDigits(village.stats.femaleVoters) : '---'}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-rose-500/20 backdrop-blur-md border border-rose-400/20 w-fit min-w-[120px] pr-8">
                                    <p className="text-[10px] font-black uppercase text-rose-200 tracking-wider mb-1 flex items-center gap-1.5"><Droplets size={12}/> রক্তদাতা</p>
                                    <p className="text-2xl font-black text-white">{toBnDigits(villageBloodDonors.length)}</p>
                                </div>
                                
                                <div className="flex flex-wrap gap-4 mt-8">
                                    <Link href="/services" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-[22px] font-black text-sm uppercase tracking-widest hover:bg-teal-50 transition-all shadow-xl shadow-black/20 active:scale-95">
                                        সবগুলো সেবা দেখুন
                                    </Link>
                                    {isMyVillage ? (
                                        <Link href="/volunteer/dashboard" className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 text-white rounded-[22px] font-black text-sm uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl shadow-teal-900/20 active:scale-95">
                                            <ShieldCheck size={18} /> ড্যাশবোর্ডে যান
                                        </Link>
                                    ) : (
                                        <button 
                                            onClick={() => setIsLoginModalOpen(true)}
                                            className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white border border-white/20 rounded-[22px] font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all backdrop-blur-md shadow-xl active:scale-95"
                                        >
                                            <Users size={18} /> ভলান্টিয়ার লগইন
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Main 2-Col Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left Column */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* Institutions List */}
                        <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-sm">
                            <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
                                <MapPin className="text-teal-600" />
                                গ্রামের সকল প্রতিষ্ঠান ও সেবাসমূহ
                            </h2>

                            <div className="space-y-10">
                                {institutions.map((inst, i) => (
                                    <div key={i} className="relative">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${inst.color}-100 text-${inst.color}-600`}>
                                                <inst.icon size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800">{inst.label}</h3>
                                                <p className="text-sm font-bold text-slate-500">{inst.subtext}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {inst.items.map((item, idx) => (
                                                <Link key={idx} href={item.url} className="group block focus:outline-none">
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className={`p-6 rounded-[28px] bg-white border border-${inst.color}-100 shadow-sm hover:shadow-xl hover:border-${inst.color}-300 hover:bg-${inst.color}-50/30 transition-all flex flex-col justify-between gap-4 h-full`}
                                                    >
                                                        <div>
                                                            <h4 className={`text-lg font-black text-slate-800 group-hover:text-${inst.color}-700 transition-colors mb-2`}>
                                                                {item.name}
                                                            </h4>
                                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                                <Heart size={14} className={`text-${inst.color}-400`} />
                                                                {item.features}
                                                            </div>
                                                        </div>
                                                        <div className={`mt-2 w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-${inst.color}-500 group-hover:text-white group-hover:rotate-[-45deg] transition-all`}>
                                                            <MoveRight size={18} />
                                                        </div>
                                                    </motion.div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Village Market */}
                        <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-sm overflow-hidden">
                            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-orange-50 text-orange-500">
                                    <Store size={20} />
                                </span>
                                গ্রামের হাট ও কৃষিপণ্য
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-[24px] border border-orange-100 bg-orange-50/30 hover:bg-orange-50 transition-colors flex gap-4">
                                    <div className="w-16 h-16 rounded-[16px] bg-orange-100 flex items-center justify-center shrink-0">
                                        <Sprout className="text-orange-600" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800">তাজা মাছ (রুই-কাতলা)</h4>
                                        <p className="text-xs font-bold text-slate-500 mt-1">রহিম মিয়ার পুকুর থেকে · ২০০ কেজি</p>
                                        <button className="text-xs font-black text-orange-600 mt-2 hover:text-orange-700">কল করুন</button>
                                    </div>
                                </div>
                                <div className="p-4 rounded-[24px] border border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50 transition-colors flex gap-4">
                                    <div className="w-16 h-16 rounded-[16px] bg-emerald-100 flex items-center justify-center shrink-0">
                                        <Sprout className="text-emerald-600" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800">ব্রয়লার মুরগি বিক্রয়</h4>
                                        <p className="text-xs font-bold text-slate-500 mt-1">২০০ পিস · জলিল পোল্ট্রি ফার্ম</p>
                                        <button className="text-xs font-black text-emerald-600 mt-2 hover:text-emerald-700">কল করুন</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Village News Feed & Panchayat Notice */}
                        <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <Newspaper className="text-teal-600" />
                                    গ্রামের খবর ও সালিশ নোটিশ
                                </h2>
                            </div>

                            {/* Panchayat Notice */}
                            <div className="mb-6 p-5 rounded-[20px] bg-rose-50 border-l-4 border-rose-500 font-bold text-rose-800 text-sm flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-rose-200/50 flex items-center justify-center shrink-0">
                                    <Megaphone size={18} className="text-rose-600" />
                                </div>
                                <div>
                                    <p className="font-black text-base text-rose-900">গ্রাম্য সালিশ / উঠান বৈঠক</p>
                                    <p className="text-rose-700 mt-1 leading-relaxed">আগামী শুক্রবার জুম্মার পর প্রাইমারি স্কুল মাঠে জমিজমা সংক্রান্ত একটি জরুরী বৈঠক অনুষ্ঠিত হবে। সবার উপস্থিতি কামনা করছি।</p>
                                </div>
                            </div>

                            {villageNews.length === 0 ? (
                                <div className="text-center py-12 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                                    <Newspaper className="mx-auto text-slate-300 mb-3" size={40} />
                                    <p className="font-bold text-slate-400 text-sm">এই গ্রামের জন্য স্পেসিফিক কোনো খবর নেই</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {villageNews.map((news, idx) => (
                                        <div key={news.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-teal-200 hover:shadow-md transition-all">
                                            <span className="text-[10px] font-black text-teal-600 uppercase tracking-wider mb-2 block">{news.category}</span>
                                            <h3 className="font-black text-slate-800 text-base leading-tight mb-2">{news.title}</h3>
                                            <p className="text-sm text-slate-500 leading-relaxed mb-3">{news.excerpt}</p>
                                            <div className="text-xs font-bold text-slate-400">
                                                <span>{news.author} · {news.date}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Village Blood Donors */}
                        <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-sm overflow-hidden">
                            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-rose-50 text-rose-500">
                                    <Droplets size={20} />
                                </span>
                                গ্রামের রক্তদাতা
                            </h2>
                            
                            {villageBloodDonors.length === 0 ? (
                                <div className="text-center py-12 rounded-2xl bg-rose-50/30 border-2 border-dashed border-rose-100">
                                    <Droplets className="mx-auto text-rose-200 mb-3" size={40} />
                                    <p className="font-bold text-slate-400 text-sm italic">এই গ্রামে এখনো কোনো রক্তদাতা তালিকাভুক্ত হয়নি</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto -mx-6 sm:mx-0">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <th className="p-4 border-b border-slate-100 first:pl-6">রক্তদাতা</th>
                                                <th className="p-4 border-b border-slate-100">গ্রুপ</th>
                                                <th className="p-4 border-b border-slate-100 last:pr-6 text-right">যোগাযোগ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {villageBloodDonors.map((donor, idx) => (
                                                <tr key={donor.id || idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 pl-6">
                                                        <p className="font-black text-slate-800 text-sm">{donor.name}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-black text-xs border border-rose-100">
                                                            {donor.group}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 pr-6 text-right">
                                                        <a href={`tel:${donor.phone}`} className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-black text-sm">
                                                            <Phone size={14} />
                                                            {toBnDigits(donor.phone)}
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Member Profile Card */}
                        {member.name && (
                            <div className="relative overflow-hidden p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-lg text-center">
                                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-br from-teal-500 to-emerald-600 opacity-10" />
                                <div className="relative mb-5 mx-auto w-20 h-20 rounded-full p-1 border-2 border-teal-500 ring-8 ring-teal-50">
                                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center">
                                        <UserCircle size={52} className="text-slate-300" />
                                    </div>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 mb-1">ওয়াড মেম্বার / প্রতিনিধি</p>
                                <h3 className="text-lg font-black text-slate-800 mb-1">{member.name}</h3>
                                <p className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full w-fit mx-auto mb-6">{ward.name} · {union.name}</p>
                                <a
                                    href={`tel:${member.phone}`}
                                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-teal-500 text-white font-black text-sm shadow-lg shadow-teal-600/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    <Phone size={18} />
                                    যোগাযোগ করুন
                                </a>
                            </div>
                        )}

                        {/* Emergency Youth Volunteers */}
                        <div className="p-6 rounded-[32px] bg-slate-900 border border-slate-800 shadow-lg text-white">
                            <h3 className="text-sm font-black text-white flex items-center gap-2 mb-6">
                                <Shield className="text-rose-400" size={18} /> ইমার্জেন্সি ভলান্টিয়ার টিম
                            </h3>
                            <div className="space-y-3">
                                {volunteers.length === 0 ? (
                                    <p className="text-xs font-bold text-slate-500 text-center py-4 italic">কোনো ভলান্টিয়ার লিস্টেড নেই</p>
                                ) : volunteers.map(v => (
                                    <div key={v.id} className="flex items-center justify-between p-4 rounded-[20px] bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 overflow-hidden shrink-0 flex items-center justify-center">
                                                {v.avatar_url ? (
                                                    <img src={v.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserCircle size={20} className="text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-200">{v.first_name} {v.last_name}</p>
                                                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">স্বেচ্ছাসেবক</p>
                                            </div>
                                        </div>
                                        <a 
                                            href={`tel:${v.phone}`}
                                            className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center hover:bg-emerald-500 transition-all group-hover:scale-110"
                                        >
                                            <Phone size={16} className="text-white" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Back Links to Ward and Union */}
                        <div className="space-y-4">
                            <Link href={paths.wardPortal(ward.id)} className="flex items-center gap-4 p-5 rounded-[24px] bg-teal-50 border border-teal-100 hover:bg-teal-100 hover:border-teal-200 transition-all group">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-teal-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <ArrowLeft size={20} className="text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-teal-600 tracking-wider">ফিরে যান</p>
                                    <p className="font-black text-teal-900 text-sm">{ward.name} মেইন পোর্টাল</p>
                                </div>
                            </Link>
                                
                            <Link href={paths.unionPortal(union.slug)} className="flex items-center gap-4 p-5 rounded-[24px] bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all group">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <Home size={20} className="text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">হোমপেজে যান</p>
                                    <p className="font-black text-slate-800 text-sm">{union.name} ইউনিয়ন পোর্টাল</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
            <PortalLoginModal 
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                defaultRole="volunteer"
                locationName={`${vName}, ${union.name}`}
            />
        </div>
    );
}

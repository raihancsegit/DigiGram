"use client";

import { useSelector } from 'react-redux';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
    LayoutDashboard, Newspaper, Settings, LogOut, 
    MapPin, Users, School, Building2, BookOpen, Home,
    Loader2, PlusCircle, ArrowRight, Sparkles, Heart, Clock, MoveUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WardNewsForm from '@/components/sections/ward/WardNewsForm';
import WardManagementSection from '@/components/sections/ward/WardManagementSection';
import WardHouseholdManager from '@/components/sections/ward/WardHouseholdManager';
import { getVillageFullContext } from '@/lib/services/hierarchyService';
import { householdService } from '@/lib/services/householdService';
import { wardService } from '@/lib/services/wardService';
import { toBnDigits } from '@/lib/utils/format';
import { paths } from '@/lib/constants/paths';

export default function VolunteerDashboard() {
    const { user } = useSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState('households');
    const [villageData, setVillageData] = useState(null);
    const [householdVillage, setHouseholdVillage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newsList, setNewsList] = useState([]);

    const loadData = useCallback(async () => {
        if (!user?.access_scope_id) return;
        setLoading(true);
        try {
            const context = await getVillageFullContext(user.access_scope_id);
            setVillageData(context);

            // Fetch news for this village/ward
            if (context?.ward?.id) {
                const news = await wardService.getNewsByLocation(context.ward.id);
                setNewsList(news);
            }

            if (context?.ward?.id && context?.village?.id) {
                try {
                    const syncedVillage = await householdService.getOrCreateVillageForLocation(
                        context.ward.id,
                        context.village
                    );
                    setHouseholdVillage(syncedVillage);
                } catch (syncError) {
                    console.error("Error syncing volunteer household village:", syncError?.message || syncError);
                    setHouseholdVillage(null);
                }
            }
        } catch (err) {
            console.error("Error loading volunteer data:", err?.message || err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center">
                <Loader2 className="text-teal-500 animate-spin mb-4" size={48} />
                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">ড্যাশবোর্ড প্রস্তুত হচ্ছে...</p>
            </div>
        );
    }

    const village = villageData?.village;
    const stats = village?.stats || {};

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            {/* Premium Dark Hero Header */}
            <div className="relative pt-12 pb-24 md:pt-20 md:pb-40 px-4 md:px-8 bg-slate-900 overflow-hidden border-b border-slate-800 rounded-b-[40px] md:rounded-b-[80px]">
                {/* Abstract Glowing Backgrounds */}
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/20 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/4 animate-pulse" />
                </div>
                
                <div className="max-w-[1200px] mx-auto relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-8 text-center md:text-left">
                    <div className="flex-1 text-white">
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6"
                        >
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[11px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                                <Sparkles size={14} />
                                ভলান্টিয়ার ড্যাশবোর্ড
                            </span>
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6"
                        >
                            {village?.name_bn} <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-sky-400">গ্রাম</span>
                        </motion.h1>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-wrap items-center justify-center md:justify-start gap-3"
                        >
                            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur-md border border-white/5 shadow-lg shadow-black/20">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                প্যানেল একটিভ
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-2xl bg-teal-500/20 text-teal-100 px-4 py-2 text-xs font-bold border border-teal-500/20 shadow-lg shadow-black/20">
                                <MapPin size={14} className="text-teal-400" />
                                {villageData?.ward?.name_bn} · {villageData?.ctx?.union?.name}
                            </div>
                            {villageData?.ctx?.union?.slug && villageData?.ward?.id && villageData?.village?.id && (
                                <Link 
                                    href={paths.villagePortal(villageData.ctx.union.slug, villageData.ward.slug || villageData.ward.id, villageData.village.slug || villageData.village.id)}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-5 py-2 text-xs font-black shadow-lg shadow-white/20 hover:bg-teal-50 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    গ্রামের পোর্টালে যান <MoveUpRight size={14} className="text-teal-600" />
                                </Link>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Overlapping Content Section */}
            <div className="max-w-[1200px] mx-auto px-4 md:px-8 -mt-16 md:-mt-24 relative z-20">
                {/* Premium Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
                    {[
                        { label: 'মোট জনসংখ্যা', value: stats.population || '০', icon: Users, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
                        { label: 'মোট ভোটার', value: stats.voters || '০', icon: Heart, gradient: 'from-rose-500 to-orange-500', shadow: 'shadow-rose-500/20' },
                        { label: 'শিক্ষা প্রতিষ্ঠান', value: (stats.schools?.length || 0) + (stats.madrassas?.length || 0), icon: School, gradient: 'from-teal-500 to-emerald-600', shadow: 'shadow-teal-500/20' },
                        { label: 'ধর্মীয় প্রতিষ্ঠান', value: (stats.mosques?.length || 0), icon: Building2, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
                    ].map((s, i) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={i} 
                            className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-200/60 shadow-xl shadow-slate-200/40 group hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-slate-100 transition-colors" />
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6 shadow-lg ${s.shadow} relative z-10`}>
                                <s.icon size={26} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{s.label}</p>
                                <p className="text-3xl md:text-4xl font-black text-slate-800 leading-none">{toBnDigits(s.value.toString())}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Pill Navigation Tabs */}
                <div className="flex justify-center mb-10">
                    <div className="inline-flex items-center gap-2 p-2 bg-white rounded-full border border-slate-200/60 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
                        {[
                            { id: 'households', label: 'বাড়ি এন্ট্রি', icon: Home },
                            { id: 'news', label: 'খবর ও নোটিশ', icon: Newspaper },
                            { id: 'management', label: 'গ্রাম তথ্য', icon: Settings },
                        ].map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-black transition-all duration-300 overflow-hidden ${
                                        isActive ? 'text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div 
                                            layoutId="volunteerTabBackground"
                                            className="absolute inset-0 bg-slate-900 rounded-full"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <tab.icon size={18} className={isActive ? 'text-teal-400' : ''} />
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content Areas */}
                <div className="relative">
                    <AnimatePresence mode="wait">
                        {activeTab === 'news' ? (
                            <motion.div
                                key="news"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                            >
                                <div className="lg:col-span-5">
                                    <div className="bg-white rounded-[40px] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden sticky top-8">
                                        <div className="p-6 md:p-8 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0">
                                                <PlusCircle size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800">নতুন খবর যোগ করুন</h3>
                                                <p className="text-xs font-bold text-slate-500 mt-0.5">গ্রাম বা ওয়ার্ডের প্রয়োজনীয় নোটিশ দিন</p>
                                            </div>
                                        </div>
                                        <div className="p-6 md:p-8">
                                            <WardNewsForm 
                                                user={user}
                                                wardId={villageData?.ward?.id} 
                                                onSuccess={loadData}
                                                villageContext={village?.name_bn}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="lg:col-span-7 space-y-6">
                                    <div className="flex items-center justify-between mb-2 px-2">
                                        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                            <Newspaper className="text-teal-600" />
                                            সাম্প্রতিক আপডেট
                                        </h3>
                                        <span className="text-[10px] font-black uppercase text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full tracking-wider border border-teal-100/50">
                                            {toBnDigits(newsList.length.toString())} টি খবর
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-5">
                                        {newsList.filter(n => n.title.includes(village?.name_bn) || !village?.name_bn).map((news, idx) => (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={news.id} 
                                                className="bg-white p-5 rounded-[32px] border border-slate-200/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group hover:border-teal-400 hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-300"
                                            >
                                                <div className="flex items-start gap-5 flex-1 w-full">
                                                    {news.image_url ? (
                                                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-slate-100 shadow-inner group-hover:shadow-lg transition-shadow">
                                                            <img src={news.image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-300 group-hover:bg-teal-50 transition-colors">
                                                            <Newspaper size={32} />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${news.category === 'emergency' ? 'bg-rose-50 text-rose-600 border-rose-100/50' : 'bg-teal-50 text-teal-600 border-teal-100/50'}`}>
                                                                {news.category === 'emergency' ? 'জরুরী' : news.category || 'সাধারণ'}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                                <Clock size={12} />
                                                                {new Date(news.created_at).toLocaleDateString('bn-BD')}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-lg sm:text-xl font-black text-slate-800 leading-tight group-hover:text-teal-700 transition-colors line-clamp-2 mb-1.5">{news.title}</h4>
                                                        <p className="text-sm text-slate-500 font-medium line-clamp-2">{news.excerpt || news.content}</p>
                                                    </div>
                                                </div>
                                                <button className="w-full sm:w-12 sm:h-12 py-3 sm:py-0 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:bg-teal-500 hover:border-teal-500 hover:text-white transition-all flex items-center justify-center shrink-0">
                                                    <span className="sm:hidden text-sm font-bold mr-2">বিস্তারিত পড়ুন</span>
                                                    <ArrowRight size={20} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ) : activeTab === 'households' ? (
                            <motion.div
                                key="households"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <div className="bg-white rounded-[40px] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
                                    <div className="px-6 md:px-10 py-8 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-[24px] bg-slate-900 flex items-center justify-center text-teal-400 shadow-xl shadow-slate-200 shrink-0">
                                                <Home size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-800 leading-tight">ডিজিটাল বাড়ি এন্ট্রি</h3>
                                                <p className="text-sm font-bold text-slate-500 mt-1">
                                                    {householdVillage?.bn_name || village?.name_bn} গ্রামের প্রতিটি বাড়ির তথ্য সংগ্রহ করুন
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-10">
                                        <WardHouseholdManager
                                            wardId={villageData?.ward?.id}
                                            assignedVillage={householdVillage}
                                            volunteerMode={true}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="management"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <div className="bg-white rounded-[40px] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden p-6 md:p-10">
                                    <WardManagementSection 
                                        user={user}
                                        wardId={villageData?.ward?.id}
                                        villages={[village]}
                                        onUpdate={loadData}
                                        isVolunteerView={true}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

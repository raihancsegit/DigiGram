"use client";

import { useSelector } from 'react-redux';
import { useState, useEffect, useCallback } from 'react';
import { 
    LayoutDashboard, Newspaper, Settings, LogOut, 
    MapPin, Users, School, Building2, BookOpen, Home,
    Loader2, PlusCircle, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WardNewsForm from '@/components/sections/ward/WardNewsForm';
import WardManagementSection from '@/components/sections/ward/WardManagementSection';
import WardHouseholdManager from '@/components/sections/ward/WardHouseholdManager';
import { getVillageFullContext } from '@/lib/services/hierarchyService';
import { householdService } from '@/lib/services/householdService';
import { wardService } from '@/lib/services/wardService';
import { toBnDigits } from '@/lib/utils/format';

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
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="text-teal-500 animate-spin mb-4" size={40} />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">ডাটা লোড হচ্ছে...</p>
            </div>
        );
    }

    const village = villageData?.village;
    const stats = village?.stats || {};

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[24px] bg-slate-900 flex items-center justify-center text-teal-400 shadow-xl shadow-slate-200 ring-8 ring-slate-50">
                        <LayoutDashboard size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">ভলান্টিয়ার ড্যাশবোর্ড</h1>
                        <p className="text-slate-500 font-bold mt-1 flex items-center gap-2">
                            <MapPin size={14} className="text-teal-600" />
                            {village?.name_bn} | {villageData?.ward?.name_bn} | {villageData?.ctx?.union?.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <button 
                        onClick={() => setActiveTab('news')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'news' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Newspaper size={18} />
                        খবর ও নোটিশ
                    </button>
                    <button 
                        onClick={() => setActiveTab('households')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'households' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Home size={18} />
                        বাড়ি এন্ট্রি
                    </button>
                    <button 
                        onClick={() => setActiveTab('management')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'management' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Settings size={18} />
                        গ্রাম তথ্য
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                {[
                    { label: 'মোট জনসংখ্যা', value: stats.population || '০', icon: Users, color: 'text-blue-600 bg-blue-50' },
                    { label: 'মোট ভোটার', value: stats.voters || '০', icon: BookOpen, color: 'text-indigo-600 bg-indigo-50' },
                    { label: 'শিক্ষা প্রতিষ্ঠান', value: (stats.schools?.length || 0) + (stats.madrassas?.length || 0), icon: School, color: 'text-teal-600 bg-teal-50' },
                    { label: 'ধর্মীয় প্রতিষ্ঠান', value: (stats.mosques?.length || 0), icon: Building2, color: 'text-amber-600 bg-amber-50' },
                ].map((s, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:border-teal-500/30 transition-all"
                    >
                        <div className={`w-12 h-12 rounded-2xl ${s.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                            <s.icon size={24} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                        <p className="text-2xl font-black text-slate-900">{toBnDigits(s.value.toString())}</p>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                {activeTab === 'news' ? (
                    <motion.div
                        key="news"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        <div className="lg:col-span-1">
                            <WardNewsForm 
                                user={user}
                                wardId={villageData?.ward?.id} 
                                onSuccess={loadData}
                                villageContext={village?.name_bn}
                            />
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
                                <Newspaper className="text-teal-600" />
                                সাম্প্রতিক খবর ও নোটিশ
                            </h3>
                            {newsList.filter(n => n.title.includes(village?.name_bn) || !village?.name_bn).map((news) => (
                                <div key={news.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-start justify-between group hover:border-teal-500/20 transition-all">
                                    <div className="flex gap-4">
                                        {news.image_url && (
                                            <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-100 shadow-inner">
                                                <img src={news.image_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                            </div>
                                        )}
                                        <div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${news.category === 'emergency' ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'}`}>
                                                {news.category === 'emergency' ? 'জরুরী' : 'সাধারণ'}
                                            </span>
                                            <h4 className="text-lg font-black text-slate-800 mt-2 group-hover:text-teal-600 transition-colors">{news.title}</h4>
                                            <p className="text-sm text-slate-500 font-bold line-clamp-2 mt-1">{news.content}</p>
                                        </div>
                                    </div>
                                    <button className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-teal-500 hover:text-white transition-all">
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : activeTab === 'households' ? (
                    <motion.div
                        key="households"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white rounded-[40px] p-6 md:p-10 border border-slate-200 shadow-sm"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-3xl bg-teal-900 flex items-center justify-center text-teal-400 shadow-xl shrink-0">
                                <Home size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 leading-tight">বাড়ি এন্ট্রি</h3>
                                <p className="text-sm font-bold text-slate-400 mt-1">{householdVillage?.bn_name || village?.name_bn} গ্রামের বাড়ি ও সদস্য যোগ করুন</p>
                            </div>
                        </div>
                        <WardHouseholdManager
                            wardId={villageData?.ward?.id}
                            assignedVillage={householdVillage}
                            volunteerMode={true}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="management"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <WardManagementSection 
                            user={user}
                            wardId={villageData?.ward?.id}
                            villages={[village]}
                            onUpdate={loadData}
                            isVolunteerView={true}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


"use client";

import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PlusCircle, Newspaper, LogOut, ShieldCheck, ArrowLeft, Settings, 
    MessageSquare, TrendingUp, Users, MapPin, CheckCircle2, UserCircle,
    ArrowUpRight, Sparkles, School, Building2, BookOpen, Phone, Search, HandHeart,
    ChevronLeft, ChevronRight, ShoppingBag, FileText, Banknote, ClipboardCheck, AlertTriangle
} from 'lucide-react';
import { performLogout, login } from '@/lib/store/features/authSlice';
import { wardService } from '@/lib/services/wardService';
import { authService } from '@/lib/services/authService';
import { supabase } from '@/lib/utils/supabase';
import { getWardsWithDetailsByUnion, getActiveServices } from '@/lib/services/hierarchyService';

import EmergencyServiceManager from '@/components/sections/admin/EmergencyServiceManager';
import LostFoundManager from '@/components/sections/admin/LostFoundManager';
import NewsManager from '@/components/sections/admin/NewsManager';
import DonationManager from '@/components/sections/admin/DonationManager';
import MarketManagement from '@/components/sections/admin/market/MarketManagement';
import NotificationBell from '@/components/ui/NotificationBell';
import { toBnDigits, parseBnInt } from '@/lib/utils/format';
import UnionManagementSection from '@/components/sections/union/UnionManagementSection';
import UnionServiceManager from '@/components/sections/union/UnionServiceManager';
import UnionTaxDashboard from '@/components/sections/union/UnionTaxDashboard';
import UnionCitizenQualityDashboard from '@/components/sections/union/UnionCitizenQualityDashboard';
import UnionSmsOutbox from '@/components/sections/union/UnionSmsOutbox';
import CitizenComplaintManager from '@/components/sections/citizen/CitizenComplaintManager';
import CitizenAppointmentManager from '@/components/sections/citizen/CitizenAppointmentManager';
import CitizenLifeSupportManager from '@/components/sections/citizen/CitizenLifeSupportManager';
import { unionService } from '@/lib/services/unionService';
import { menuStyles } from '@/components/common/menuStyles';
import OfficerActionCenter from '@/components/common/OfficerActionCenter';

export default function ChairmanDashboard() {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const router = useRouter();
    
    const [activeTab, setActiveTab] = useState('news'); // 'news', 'management', or 'services'
    
    const [unionName, setUnionName] = useState('');
    const [unionSlug, setUnionSlug] = useState('');
    const [unionInfo, setUnionInfo] = useState(null);
    const [wards, setWards] = useState([]);
    const [newsList, setNewsList] = useState([]);
    const [servicePage, setServicePage] = useState(1);
    const SERVICES_PER_PAGE = 6;
    const [activeServices, setActiveServices] = useState([]);
    const [actionQueue, setActionQueue] = useState([]);
    const [unionImpact, setUnionImpact] = useState({ wards: [], families: [], totals: {} });
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const tabClass = (id, tone = 'teal') => `flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all shrink-0 ${menuStyles.tab(activeTab === id, tone)}`;

    const loadData = useCallback(async (currentUser) => {
        if (!currentUser || currentUser.role !== 'chairman') return;
        setLoading(true);
        try {
            const profile = await authService.getProfile(currentUser.id);
            if (profile) {
                dispatch(login({
                    ...currentUser,
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    avatar_url: profile.avatar_url
                }));
            }

            const { data: unionData } = await supabase
                .from('locations')
                .select('name_bn, name_en, slug, survey_status, real_stats, stats')
                .eq('id', currentUser.access_scope_id)
                .single();
            if(unionData) {
                setUnionName(unionData.name_bn);
                setUnionSlug(unionData.slug);
                setUnionInfo(unionData);
            }

            const wardsData = await getWardsWithDetailsByUnion(currentUser.access_scope_id);
            setWards(wardsData);
            
            const news = await wardService.getNewsByLocation(currentUser.access_scope_id);
            setNewsList(news);

            const services = await getActiveServices(currentUser.access_scope_id);
            setActiveServices(services);

            const queue = await loadUnionActionQueue(currentUser.access_scope_id, wardsData.map((ward) => ward.id));
            setActionQueue(queue);

            const impact = await loadUnionImpactBoard(wardsData);
            setUnionImpact(impact);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        let active = true;

        const initializeChairmanPortal = async () => {
            try {
                const { data: { session } } = await getSessionWithTimeout();

                if (!session) {
                    if (active) setAuthChecked(true);
                    router.push('/login');
                    return;
                }

                let currentUser = user;
                if (!isAuthenticated || !currentUser) {
                    const profile = await authService.getProfile(session.user.id);
                    if (!profile || profile.role !== 'chairman') {
                        if (active) setAuthChecked(true);
                        router.push('/login');
                        return;
                    }

                    currentUser = {
                        id: session.user.id,
                        email: session.user.email,
                        role: profile.role,
                        access_scope_id: profile.access_scope_id,
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                        avatar_url: profile.avatar_url
                    };
                    if (active) dispatch(login(currentUser));
                }

                if (currentUser.role !== 'chairman') {
                    if (active) setAuthChecked(true);
                    router.push('/login');
                    return;
                }

                if (active) {
                    setAuthChecked(true);
                    await loadData(currentUser);
                }
            } catch (err) {
                console.error('Chairman portal auth check failed:', err);
                if (active) setAuthChecked(true);
                router.push('/login');
            }
        };

        initializeChairmanPortal();

        return () => {
            active = false;
        };
    }, [dispatch, isAuthenticated, loadData, router, user]);

    const handleDeleteNews = async (newsId) => {
        if(!confirm('আপনি কি সত্যিই এই খবরটি মুছতে চান?')) return;
        try {
            await wardService.deleteNews(newsId);
            setNewsList(newsList.filter(n => n.id !== newsId));
        } catch(err) {
            alert('মুছতে সমস্যা হয়েছে');
        }
    }

    const aggregatedTotals = useMemo(() => {
        if (unionInfo?.survey_status === 'verified' && unionInfo?.real_stats) {
            return {
                population: unionInfo.real_stats.total_members || 0,
                voters: unionInfo.real_stats.voters || 0,
                villages: unionInfo.real_stats.total_houses || 0, // Using total_houses as approximation or we can just sum up the wards' villages
                schools: parseBnInt(unionInfo.stats?.schools || '0'),
                mosques: parseBnInt(unionInfo.stats?.mosques || '0'),
                madrassas: parseBnInt(unionInfo.stats?.madrassas || '0')
            };
        }

        return wards.reduce((acc, w) => {
            let dynamicStats = { population: 0, voters: 0, schools: 0, mosques: 0, madrassas: 0 };
            
            if (w.survey_status === 'verified' && w.real_stats) {
                dynamicStats.population = w.real_stats.total_members || 0;
                dynamicStats.voters = w.real_stats.voters || 0;
                // For institutions, we still rely on stats
                dynamicStats.schools = parseBnInt(w.stats?.schools || '0');
                dynamicStats.mosques = parseBnInt(w.stats?.mosques || '0');
                dynamicStats.madrassas = parseBnInt(w.stats?.madrassas || '0');
            } else {
                dynamicStats = (w.villages || []).reduce((vAcc, v) => ({
                    population: vAcc.population + parseBnInt(v.population || '0'),
                    voters: vAcc.voters + parseBnInt(v.voters || '0'),
                    schools: vAcc.schools + parseBnInt(v.schools || '0'),
                    mosques: vAcc.mosques + parseBnInt(v.mosques || '0'),
                    madrassas: vAcc.madrassas + parseBnInt(v.madrassas || '0')
                }), { population: 0, voters: 0, schools: 0, mosques: 0, madrassas: 0 });
            }

            return {
                population: acc.population + dynamicStats.population,
                voters: acc.voters + dynamicStats.voters,
                villages: acc.villages + (w.villages?.length || 0),
                schools: acc.schools + dynamicStats.schools,
                mosques: acc.mosques + dynamicStats.mosques,
                madrassas: acc.madrassas + dynamicStats.madrassas
            };
        }, { population: 0, voters: 0, villages: 0, schools: 0, mosques: 0, madrassas: 0 });
    }, [wards, unionInfo]);

    const handleActionSelect = (item) => {
        if (item.tab) setActiveTab(item.tab);
    };

    const unionSmsTargetScopes = useMemo(() => {
        const unionLabel = unionName || 'পুরো ইউনিয়ন';
        return [
            { id: user?.access_scope_id, label: `${unionLabel} - সব ওয়ার্ড`, type: 'union' },
            ...(wards || []).flatMap((ward) => [
                {
                    id: ward.id,
                    label: ward.name_bn || ward.name || ward.name_en || 'ওয়ার্ড',
                    type: 'ward'
                },
                ...((ward.villages || []).map((village) => ({
                    id: village.id,
                    label: `${ward.name_bn || ward.name || 'ওয়ার্ড'} / ${village.bn_name || village.name_bn || village.name || 'গ্রাম'}`,
                    type: 'village'
                })))
            ])
        ].filter((item) => item.id);
    }, [user?.access_scope_id, unionName, wards]);

    if (!authChecked || loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="w-16 h-16 rounded-[24px] bg-white border border-slate-200 shadow-xl flex items-center justify-center mb-6">
                        <ShieldCheck className="text-indigo-600 animate-pulse" size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">চেয়ারম্যান পোর্টাল</h2>
                    <p className="text-sm font-bold text-slate-400">ইউনিয়নের তথ্যগুলো প্রস্তুত করা হচ্ছে...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 min-h-16 flex flex-wrap items-center justify-between gap-2 py-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                        <Link href="/" className="shrink-0 p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                        <h1 className="min-w-0 text-sm sm:text-lg font-black text-slate-800 flex flex-wrap items-center gap-2">
                            <ShieldCheck className="shrink-0 text-indigo-600" />
                            সেন্ট্রাল পোর্টাল 
                            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                                চেয়ারম্যান এক্সেস
                            </span>
                        </h1>
                    </div>
                    
                    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                        <Link 
                            href="/chairman/settings"
                            className="flex items-center gap-2 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-100 px-2 sm:px-4 py-2 rounded-xl transition-all"
                        >
                            <Settings size={18} />
                            <span className="hidden sm:inline">সেটিংস</span>
                        </Link>
                        <NotificationBell 
                            role={user?.role} 
                            scopeId={user?.access_scope_id} 
                        />
                        <button 
                            onClick={async () => {
                                await dispatch(performLogout());
                                router.push('/login');
                            }}
                            className="flex items-center gap-2 text-red-500 font-bold text-xs sm:text-sm hover:bg-red-50 px-2 sm:px-4 py-2 rounded-xl transition-all"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">লগআউট</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 px-4 sm:px-6 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                    <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">সার্ভার স্ট্যাটাস:</span>
                            <span className="text-xs font-black text-emerald-600">সংযুক্ত</span>
                        </div>
                    </div>
                    <div className="flex max-w-full items-center gap-3">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{unionName} এডমিন</span>
                    </div>
                </div>

                <OfficerActionCenter
                    title="আজকের ইউনিয়ন priority"
                    subtitle="Citizen request, complaint, SMS ও tax কাজ এক নজরে দেখুন।"
                    items={actionQueue}
                    onSelect={handleActionSelect}
                />

                <UnionImpactBoard
                    impact={unionImpact}
                    onOpenQuality={() => setActiveTab('citizen-quality')}
                    onOpenTax={() => setActiveTab('tax')}
                    onOpenSms={() => setActiveTab('sms-outbox')}
                />

                <ChairmanQuickCommand
                    totals={aggregatedTotals}
                    queueCount={actionQueue.length}
                    onSelect={setActiveTab}
                />
                
                <div className="mb-8">
                    <div
                        className="flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-x-visible p-1.5 bg-slate-200/50 rounded-[24px] md:rounded-[32px] w-full gap-1.5 scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <button 
                            onClick={() => setActiveTab('overview')}
                            className={tabClass('overview', 'teal')}
                        >
                            <Settings size={16} className="sm:w-[18px] sm:h-[18px]" />
                            ওয়াড ওভারভিউ
                        </button>
                        <button 
                            onClick={() => setActiveTab('digital-services')}
                            className={tabClass('digital-services', 'teal')}
                        >
                            <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />
                            ডিজিটাল সেবাসমূহ
                        </button>
                        <button 
                            onClick={() => setActiveTab('news')}
                            className={tabClass('news', 'teal')}
                        >
                            <MessageSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
                            ইউনিয়ন নিউজ
                        </button>
                        
                        <button 
                            onClick={() => setActiveTab('emergency')}
                            className={tabClass('emergency', 'teal')}
                        >
                            <Phone size={16} className="sm:w-[18px] sm:h-[18px]" />
                            জরুরি হটলাইন
                        </button>

                        <button 
                            onClick={() => setActiveTab('lost-found')}
                            className={tabClass('lost-found', 'teal')}
                        >
                            <Search size={16} className="sm:w-[18px] sm:h-[18px]" />
                            হারানো ও প্রাপ্তি
                        </button>

                        <button 
                            onClick={() => setActiveTab('donation')}
                            className={tabClass('donation', 'teal')}
                        >
                            <HandHeart size={16} className="sm:w-[18px] sm:h-[18px]" />
                            স্বচ্ছ দান
                        </button>

                        <button 
                            onClick={() => setActiveTab('service-requests')}
                            className={tabClass('service-requests', 'teal')}
                        >
                            <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                            আবেদনসমূহ
                        </button>

                        <button 
                            onClick={() => setActiveTab('tax')}
                            className={tabClass('tax', 'teal')}
                        >
                            <Banknote size={16} className="sm:w-[18px] sm:h-[18px]" />
                            কর
                        </button>

                        <button 
                            onClick={() => setActiveTab('citizen-quality')}
                            className={tabClass('citizen-quality', 'teal')}
                        >
                            <ClipboardCheck size={16} className="sm:w-[18px] sm:h-[18px]" />
                            নাগরিক মান
                        </button>

                        <button 
                            onClick={() => setActiveTab('complaints')}
                            className={tabClass('complaints', 'rose')}
                        >
                            <AlertTriangle size={16} className="sm:w-[18px] sm:h-[18px]" />
                            অভিযোগ
                        </button>

                        <button 
                            onClick={() => setActiveTab('sms-outbox')}
                            className={tabClass('sms-outbox', 'teal')}
                        >
                            <MessageSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
                            SMS
                        </button>

                        <button 
                            onClick={() => setActiveTab('market')}
                            className={tabClass('market', 'teal')}
                        >
                            <ShoppingBag size={16} className="sm:w-[18px] sm:h-[18px]" />
                            হাট বাজার
                        </button>

                        <button 
                            onClick={() => setActiveTab('management')}
                            className={tabClass('management', 'teal')}
                        >
                            <Settings size={16} className="sm:w-[18px] sm:h-[18px]" />
                            ম্যানেজমেন্ট
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'overview' ? (
                        <motion.div 
                            key="overview"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="bg-white rounded-[28px] sm:rounded-[40px] p-4 sm:p-6 md:p-10 border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <MapPin size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800">ওয়াড ওভারভিউ</h3>
                                        <p className="text-sm font-bold text-slate-400 mt-1">মেম্বারদের দ্বারা অন্তর্ভুক্ত সর্বশেষ তথ্য</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {wards.map((ward) => {
                                        let dynamicStats = { population: 0, voters: 0 };
                                        
                                        if (ward.survey_status === 'verified' && ward.real_stats) {
                                            dynamicStats.population = ward.real_stats.total_members || 0;
                                            dynamicStats.voters = ward.real_stats.voters || 0;
                                        } else {
                                            dynamicStats = (ward.villages || []).reduce((acc, v) => ({
                                                population: acc.population + parseBnInt(v.population || '0'),
                                                voters: acc.voters + parseBnInt(v.voters || '0')
                                            }), { population: 0, voters: 0 });
                                        }
                                        
                                        return (
                                        <div key={ward.id} className="p-6 rounded-[32px] bg-white border border-slate-200 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12" />
                                            <div className="flex items-center justify-between mb-6 relative">
                                                <div>
                                                    <h4 className="font-black text-xl text-slate-800">{ward.name}</h4>
                                                    <p className="text-[10px] font-black uppercase text-indigo-400 mt-1">প্রশাসনিক ইউনিট</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">জনসংখ্যা</p>
                                                    <p className="text-sm font-black text-slate-700">{toBnDigits(dynamicStats.population.toString())}</p>
                                                </div>
                                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">ভোটার</p>
                                                    <p className="text-sm font-black text-slate-700">{toBnDigits(dynamicStats.voters.toString())}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            </div>
                        </motion.div>
                    ) : activeTab === 'digital-services' ? (
                        <motion.div 
                            key="digital-services"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="bg-white rounded-[28px] sm:rounded-[40px] p-4 sm:p-6 md:p-10 border border-slate-200 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {activeServices.map((item, idx) => (
                                        <div key={idx} className="p-6 rounded-[32px] bg-white border border-slate-200 hover:border-indigo-500/30 transition-all">
                                            <h4 className="font-black text-xl text-slate-800 mb-2">{item.services.name}</h4>
                                            <p className="text-xs font-bold text-slate-500">পরিচালনা করতে ক্লিক করুন</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : activeTab === 'emergency' ? (
                        <motion.div key="emergency" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <EmergencyServiceManager locationId={user?.access_scope_id} />
                        </motion.div>
                    ) : activeTab === 'lost-found' ? (
                        <motion.div key="lost-found" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <LostFoundManager locationId={user?.access_scope_id} />
                        </motion.div>
                    ) : activeTab === 'news' ? (
                        <motion.div key="news" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <NewsManager locationId={user?.access_scope_id} isAdmin={false} />
                        </motion.div>
                    ) : activeTab === 'donation' ? (
                        <motion.div key="donation" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <DonationManager unionSlug={unionSlug} />
                        </motion.div>
                    ) : activeTab === 'market' ? (
                        <motion.div key="market" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <MarketManagement />
                        </motion.div>
                    ) : activeTab === 'tax' ? (
                        <motion.div key="tax" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="bg-white rounded-[28px] sm:rounded-[40px] p-4 sm:p-6 md:p-12 border border-slate-200 shadow-sm">
                                <UnionTaxDashboard unionId={user.access_scope_id} />
                            </div>
                        </motion.div>
                    ) : activeTab === 'citizen-quality' ? (
                        <motion.div key="citizen-quality" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="bg-white rounded-[28px] sm:rounded-[40px] p-4 sm:p-6 md:p-12 border border-slate-200 shadow-sm">
                                <UnionCitizenQualityDashboard unionId={user.access_scope_id} />
                            </div>
                        </motion.div>
                    ) : activeTab === 'complaints' ? (
                        <motion.div key="complaints" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="space-y-8">
                                <CitizenAppointmentManager scopeType="union" scopeId={user.access_scope_id} title="ইউনিয়ন office serial queue" />
                                <CitizenLifeSupportManager scopeType="union" scopeId={user.access_scope_id} title="ইউনিয়ন daily life support desk" />
                                <CitizenComplaintManager scopeType="union" scopeId={user.access_scope_id} title="ইউনিয়ন নাগরিক অভিযোগ" />
                            </div>
                        </motion.div>
                    ) : activeTab === 'sms-outbox' ? (
                        <motion.div key="sms-outbox" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="bg-white rounded-[28px] sm:rounded-[40px] p-4 sm:p-6 md:p-12 border border-slate-200 shadow-sm">
                                <UnionSmsOutbox
                                    unionId={user.access_scope_id}
                                    heading="Union SMS Broadcast & Profit Center"
                                    description="পুরো ইউনিয়ন, নির্দিষ্ট ওয়ার্ড বা নির্দিষ্ট গ্রামে জরুরি broadcast, citizen follow-up, service ready ও tax reminder পাঠান।"
                                    ownerLabel={unionName || 'ইউনিয়ন'}
                                    targetScopes={unionSmsTargetScopes}
                                />
                            </div>
                        </motion.div>
                    ) : activeTab === 'management' ? (
                        <motion.div key="management" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <UnionManagementSection user={user} unionInfo={unionInfo} />
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="service-requests"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="bg-white rounded-[28px] sm:rounded-[40px] p-4 sm:p-6 md:p-12 border border-slate-200 shadow-sm">
                                <div className="flex flex-col items-start gap-4 mb-8 sm:mb-10 sm:flex-row sm:items-center">
                                    <div className="w-14 h-14 rounded-3xl bg-teal-900 flex items-center justify-center text-teal-400 shadow-xl shrink-0">
                                        <FileText size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 leading-tight">নাগরিক সেবা ম্যানেজমেন্ট</h3>
                                        <p className="text-sm font-bold text-slate-400 mt-1">আগত আবেদনগুলো পর্যালোচনা এবং অনুমোদন করুন</p>
                                    </div>
                                </div>
                                <UnionServiceManager unionId={user.access_scope_id} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

function UnionImpactBoard({ impact, onOpenQuality, onOpenTax, onOpenSms }) {
    const wards = impact?.wards || [];
    const families = impact?.families || [];
    const totals = impact?.totals || {};
    const estimatedSmsCost = Math.max(0, (totals.priorityFamilies || 0) * 1);

    if (wards.length === 0 && families.length === 0) return null;

    return (
        <section className="mb-8 rounded-[36px] border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-amber-50 p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-700">Union Impact Board</p>
                    <h2 className="text-2xl font-black text-slate-950">কোন ওয়ার্ডে আগে কাজ করলে সবচেয়ে বেশি উপকার হবে</h2>
                    <p className="mt-1 text-sm font-bold text-slate-500">Household data, application, tax ও citizen gap একসাথে দেখে priority বানানো হয়েছে।</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={onOpenQuality} className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-teal-700">
                        Citizen Quality
                    </button>
                    <button onClick={onOpenTax} className="rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-amber-50">
                        Tax Follow-up
                    </button>
                    <button onClick={onOpenSms} className="rounded-2xl bg-teal-600 px-4 py-3 text-xs font-black text-white transition hover:bg-teal-700">
                        SMS Campaign
                    </button>
                </div>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                    ['Priority families', totals.priorityFamilies || 0, 'আজ follow-up দরকার'],
                    ['Data gaps', totals.dataGaps || 0, 'NID/জন্ম/রক্ত তথ্য'],
                    ['Health follow-up', totals.healthFollowUps || 0, 'শিশু/বয়স্ক/checkup'],
                    ['Pending services', totals.pendingRequests || 0, 'চলমান আবেদন'],
                    ['SMS estimate', estimatedSmsCost, 'প্রায় credit লাগবে']
                ].map(([label, value, hint]) => (
                    <div key={label} className="rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
                        <p className="mt-2 text-3xl font-black text-slate-950">{toBnDigits(value)}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">{hint}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[28px] border border-white/80 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-black text-slate-900">Ward-wise ranking</h3>
                        <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-black text-teal-700">{toBnDigits(wards.length)} ward</span>
                    </div>
                    <div className="space-y-3">
                        {wards.slice(0, 6).map((ward, index) => (
                            <div key={ward.id} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Rank {toBnDigits(index + 1)}</p>
                                        <h4 className="mt-1 text-base font-black text-slate-950">{ward.name}</h4>
                                    </div>
                                    <span className={`rounded-2xl px-3 py-2 text-lg font-black ${ward.score >= 80 ? 'bg-rose-50 text-rose-700' : ward.score >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                        {toBnDigits(ward.score)}
                                    </span>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {[
                                        ['Family', ward.priorityFamilies],
                                        ['Gap', ward.dataGaps],
                                        ['Health', ward.healthFollowUps],
                                        ['Service', ward.pendingRequests],
                                        ['Tax', ward.dueTaxes]
                                    ].map(([label, value]) => (
                                        <div key={label} className="rounded-2xl bg-white px-3 py-2">
                                            <p className="text-[9px] font-black uppercase text-slate-400">{label}</p>
                                            <p className="text-sm font-black text-slate-800">{toBnDigits(value || 0)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-[28px] border border-white/80 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-black text-slate-900">Top follow-up families</h3>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-700">impact first</span>
                    </div>
                    <div className="space-y-3">
                        {families.slice(0, 8).map((family) => (
                            <div key={family.id} className="rounded-3xl border border-slate-100 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h4 className="truncate text-sm font-black text-slate-950">{family.owner_name}</h4>
                                        <p className="text-xs font-bold text-slate-400">{family.wardName} · Holding {family.house_no || 'নেই'}</p>
                                    </div>
                                    <span className="rounded-xl bg-slate-950 px-2.5 py-1.5 text-xs font-black text-white">{toBnDigits(family.score)}</span>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {family.reasons.slice(0, 3).map((reason) => (
                                        <span key={reason} className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-600">{reason}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {families.length === 0 && (
                            <div className="rounded-3xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">এখন urgent family follow-up নেই।</div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

function ChairmanQuickCommand({ totals, queueCount, onSelect }) {
    const commands = [
        {
            id: 'citizen-quality',
            title: 'Citizen Quality',
            detail: 'NID, birth, blood ও duplicate review',
            Icon: ClipboardCheck,
            tone: 'bg-teal-50 text-teal-700 border-teal-100'
        },
        {
            id: 'service-requests',
            title: 'Applications',
            detail: 'সনদ, আবেদন ও office serial',
            Icon: FileText,
            tone: 'bg-sky-50 text-sky-700 border-sky-100'
        },
        {
            id: 'sms-outbox',
            title: 'SMS Center',
            detail: 'Reminder, broadcast, service ready',
            Icon: MessageSquare,
            tone: 'bg-indigo-50 text-indigo-700 border-indigo-100'
        },
        {
            id: 'tax',
            title: 'Tax',
            detail: 'Holding tax collection overview',
            Icon: Banknote,
            tone: 'bg-amber-50 text-amber-700 border-amber-100'
        },
        {
            id: 'management',
            title: 'Union Profile',
            detail: 'Profile, phone, service settings',
            Icon: Settings,
            tone: 'bg-slate-50 text-slate-700 border-slate-100'
        }
    ];

    return (
        <section className="mb-8 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[36px] sm:p-6">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-700">Chairman Command</p>
                    <h3 className="text-2xl font-black text-slate-900">আজকের দ্রুত কাজ</h3>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                        {toBnDigits(queueCount || 0)} priority item · {toBnDigits(totals.population || 0)} citizen data · {toBnDigits(totals.voters || 0)} voter
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onSelect('overview')}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-teal-700 sm:w-auto"
                >
                    <ArrowUpRight size={15} />
                    Ward overview
                </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {commands.map((command) => (
                    <button
                        key={command.id}
                        type="button"
                        onClick={() => onSelect(command.id)}
                        className={`flex min-h-[116px] flex-col items-start rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${command.tone}`}
                    >
                        <command.Icon size={22} />
                        <span className="mt-4 text-sm font-black">{command.title}</span>
                        <span className="mt-1 text-xs font-bold opacity-75">{command.detail}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}

function getSessionWithTimeout(timeoutMs = 6000) {
    return Promise.race([
        supabase.auth.getSession(),
        new Promise((resolve) => {
            setTimeout(() => resolve({ data: { session: null }, error: null }), timeoutMs);
        })
    ]);
}

async function loadUnionActionQueue(unionId, wardIds = []) {
    if (!unionId) return [];

    const [
        { data: complaintRows },
        { data: appointmentRows },
        { data: lifeSupportRows },
        { data: wallet },
        { data: households }
    ] = await Promise.all([
        supabase
            .from('citizen_complaints')
            .select('id,priority,status,title,assigned_scope_type,assigned_scope_id,created_at')
            .limit(150),
        supabase
            .from('citizen_appointments')
            .select('id,priority,status,title,assigned_scope_type,assigned_scope_id,scheduled_at,serial_no,created_at')
            .limit(150),
        supabase
            .from('citizen_life_support_cases')
            .select('id,case_type,priority,status,title,assigned_scope_type,assigned_scope_id,scheduled_at,created_at')
            .limit(150),
        supabase
            .from('sms_wallets')
            .select('balance')
            .eq('owner_type', 'location')
            .eq('owner_id', unionId)
            .maybeSingle(),
        wardIds.length > 0
            ? supabase.from('households').select('id').in('ward_id', wardIds).limit(1000)
            : Promise.resolve({ data: [] })
    ]);

    const scopedComplaints = (complaintRows || []).filter((item) =>
        (item.assigned_scope_type === 'union' && item.assigned_scope_id === unionId) ||
        (item.assigned_scope_type === 'ward' && wardIds.includes(item.assigned_scope_id))
    );
    const scopedAppointments = (appointmentRows || []).filter((item) =>
        (item.assigned_scope_type === 'union' && item.assigned_scope_id === unionId) ||
        (item.assigned_scope_type === 'ward' && wardIds.includes(item.assigned_scope_id))
    );
    const scopedLifeSupport = (lifeSupportRows || []).filter((item) =>
        (item.assigned_scope_type === 'union' && item.assigned_scope_id === unionId) ||
        (item.assigned_scope_type === 'ward' && wardIds.includes(item.assigned_scope_id))
    );
    const urgentComplaints = scopedComplaints.filter((item) =>
        ['urgent', 'emergency'].includes(item.priority) && !['resolved', 'closed'].includes(item.status)
    );
    const openAppointments = scopedAppointments.filter((item) => !['completed', 'rejected', 'no_show'].includes(item.status));
    const unscheduledAppointments = openAppointments.filter((item) => !item.scheduled_at);
    const openLifeSupport = scopedLifeSupport.filter((item) => !['completed', 'rejected'].includes(item.status));
    const urgentLifeSupport = openLifeSupport.filter((item) => ['urgent', 'emergency'].includes(item.priority));

    const householdIds = (households || []).map((item) => item.id);
    const [{ data: requestRows }, { data: taxRows }, { data: residentRows }] = householdIds.length > 0 ? await Promise.all([
        supabase
            .from('service_requests')
            .select('id,status,request_type,collection_date,created_at')
            .in('household_id', householdIds)
            .limit(150),
        supabase
            .from('household_taxes')
            .select('id,status,due_date,amount_due,amount_paid')
            .in('household_id', householdIds)
            .limit(150),
        supabase
            .from('residents')
            .select('id,household_id,name,dob,gender,nid,birth_reg_no,blood_group,is_voter,marital_status,disability_status,occupation')
            .in('household_id', householdIds)
            .limit(2500)
    ]) : [{ data: [] }, { data: [] }, { data: [] }];

    const pendingRequests = (requestRows || []).filter((item) => ['pending', 'processing', 'ready'].includes(item.status));
    const readyRequests = pendingRequests.filter((item) => item.status === 'ready' && !item.collection_date);
    const dueTaxes = (taxRows || []).filter((item) => ['due', 'partial'].includes(item.status));
    const smsBalance = Number(wallet?.balance || 0);
    const benefitGaps = buildUnionBenefitGaps(residentRows || [], householdIds);

    return [
        benefitGaps.total > 0 && {
            key: 'union-family-benefit-gaps',
            type: 'benefit',
            tone: benefitGaps.critical > 0 ? 'amber' : 'teal',
            urgent: benefitGaps.critical > 0,
            title: 'Citizen health & benefit detector',
            text: `${toBnDigits(benefitGaps.total.toString())}টি citizen follow-up: NID ${toBnDigits(benefitGaps.missingNid.toString())}, জন্ম ${toBnDigits(benefitGaps.missingBirth.toString())}, স্বাস্থ্য ${toBnDigits(benefitGaps.healthFollowUps.toString())}, সম্ভাব্য ভাতা ${toBnDigits(benefitGaps.potentialBenefits.toString())}।`,
            badge: `${toBnDigits(benefitGaps.households.toString())} family`,
            actionLabel: 'Quality খুলুন',
            tab: 'citizen-quality'
        },
        urgentComplaints.length > 0 && {
            key: 'union-urgent-complaints',
            type: 'complaint',
            tone: 'rose',
            urgent: true,
            title: 'জরুরি citizen complaint',
            text: `${toBnDigits(urgentComplaints.length.toString())}টি জরুরি complaint union/ward scope-এ আছে।`,
            badge: `${toBnDigits(urgentComplaints.length.toString())} urgent`,
            actionLabel: 'অভিযোগ খুলুন',
            tab: 'complaints'
        },
        openAppointments.length > 0 && {
            key: 'union-appointments',
            type: 'appointment',
            tone: unscheduledAppointments.length > 0 ? 'amber' : 'teal',
            urgent: unscheduledAppointments.length > 0,
            title: unscheduledAppointments.length > 0 ? 'Office serial schedule বাকি' : 'Office serial queue',
            text: unscheduledAppointments.length > 0
                ? `${toBnDigits(unscheduledAppointments.length.toString())}টি citizen appointment schedule ছাড়া আছে।`
                : `${toBnDigits(openAppointments.length.toString())}টি appointment চলমান।`,
            badge: `${toBnDigits(openAppointments.length.toString())} serial`,
            actionLabel: 'Serial খুলুন',
            tab: 'complaints'
        },
        openLifeSupport.length > 0 && {
            key: 'union-life-support',
            type: 'support',
            tone: urgentLifeSupport.length > 0 ? 'rose' : 'teal',
            urgent: urgentLifeSupport.length > 0,
            title: urgentLifeSupport.length > 0 ? 'জরুরি life support' : 'Daily life support desk',
            text: `${toBnDigits(openLifeSupport.length.toString())}টি document/benefit/health/job/farmer support request খোলা আছে।`,
            badge: `${toBnDigits(openLifeSupport.length.toString())} support`,
            actionLabel: 'Support খুলুন',
            tab: 'complaints'
        },
        pendingRequests.length > 0 && {
            key: 'union-service-requests',
            type: 'service',
            tone: readyRequests.length > 0 ? 'amber' : 'teal',
            urgent: readyRequests.length > 0,
            title: readyRequests.length > 0 ? 'Collection date সেট করুন' : 'সেবা আবেদন follow-up',
            text: readyRequests.length > 0
                ? `${toBnDigits(readyRequests.length.toString())}টি ready আবেদন collection date ছাড়া আছে।`
                : `${toBnDigits(pendingRequests.length.toString())}টি আবেদন চলমান।`,
            badge: `${toBnDigits(pendingRequests.length.toString())} request`,
            actionLabel: 'আবেদন খুলুন',
            tab: 'service-requests'
        },
        smsBalance <= 10 && {
            key: 'union-sms-low',
            type: 'sms',
            tone: smsBalance <= 0 ? 'rose' : 'amber',
            urgent: smsBalance <= 0,
            title: smsBalance <= 0 ? 'SMS balance শেষ' : 'SMS balance কম',
            text: `বর্তমান balance ${toBnDigits(smsBalance.toString())} credits। Citizen update আটকে যেতে পারে।`,
            badge: `${toBnDigits(smsBalance.toString())} SMS`,
            actionLabel: 'SMS খুলুন',
            tab: 'sms-outbox'
        },
        dueTaxes.length > 0 && {
            key: 'union-tax-due',
            type: 'tax',
            tone: 'amber',
            title: 'Tax due follow-up',
            text: `${toBnDigits(dueTaxes.length.toString())}টি household tax due/partial আছে।`,
            badge: `${toBnDigits(dueTaxes.length.toString())} due`,
            actionLabel: 'Tax খুলুন',
            tab: 'tax'
        }
    ].filter(Boolean);
}

async function loadUnionImpactBoard(wards = []) {
    const wardIds = wards.map((ward) => ward.id).filter(Boolean);
    if (wardIds.length === 0) return { wards: [], families: [], totals: {} };

    const wardNameById = wards.reduce((acc, ward) => {
        acc[ward.id] = ward.name || ward.name_bn || ward.name_en || 'ওয়ার্ড';
        return acc;
    }, {});

    const { data: households } = await supabase
        .from('households')
        .select('id,ward_id,owner_name,house_no,phone,created_at')
        .in('ward_id', wardIds)
        .limit(2500);

    const householdRows = households || [];
    const householdIds = householdRows.map((household) => household.id).filter(Boolean);
    if (householdIds.length === 0) {
        return {
            wards: wards.map((ward) => ({ id: ward.id, name: wardNameById[ward.id], score: 0, priorityFamilies: 0, dataGaps: 0, healthFollowUps: 0, pendingRequests: 0, dueTaxes: 0 })),
            families: [],
            totals: { priorityFamilies: 0, dataGaps: 0, healthFollowUps: 0, pendingRequests: 0, dueTaxes: 0 }
        };
    }

    const [{ data: residents }, { data: requests }, { data: taxes }] = await Promise.all([
        supabase
            .from('residents')
            .select('id,household_id,name,dob,gender,nid,birth_reg_no,blood_group,marital_status,disability_status,occupation')
            .in('household_id', householdIds)
            .limit(6000),
        supabase
            .from('service_requests')
            .select('id,household_id,status,priority,request_type,collection_date,created_at')
            .in('household_id', householdIds)
            .limit(2000),
        supabase
            .from('household_taxes')
            .select('id,household_id,status,amount_due,amount_paid,due_date')
            .in('household_id', householdIds)
            .limit(2000)
    ]);

    const residentsByHouse = groupBy(residents || [], 'household_id');
    const requestsByHouse = groupBy(requests || [], 'household_id');
    const taxesByHouse = groupBy(taxes || [], 'household_id');
    const wardStats = {};
    const familyCards = [];

    wardIds.forEach((wardId) => {
        wardStats[wardId] = {
            id: wardId,
            name: wardNameById[wardId],
            score: 0,
            priorityFamilies: 0,
            dataGaps: 0,
            healthFollowUps: 0,
            pendingRequests: 0,
            dueTaxes: 0
        };
    });

    householdRows.forEach((household) => {
        const houseResidents = residentsByHouse[household.id] || [];
        const houseRequests = requestsByHouse[household.id] || [];
        const houseTaxes = taxesByHouse[household.id] || [];
        const dataGaps = countResidentDataGaps(houseResidents);
        const benefitCandidates = countBenefitCandidates(houseResidents);
        const healthFollowUps = countHealthFollowUps(houseResidents);
        const pendingRequests = houseRequests.filter((request) => ['pending', 'processing', 'ready'].includes(String(request.status || '').toLowerCase())).length;
        const dueTaxes = houseTaxes.filter((tax) => ['due', 'partial', 'pending'].includes(String(tax.status || '').toLowerCase())).length;
        const emptyHousehold = houseResidents.length === 0 ? 1 : 0;
        const score = Math.min(99, (benefitCandidates * 18) + (healthFollowUps * 12) + (dataGaps * 9) + (pendingRequests * 10) + (dueTaxes * 7) + (emptyHousehold * 22));
        const ward = wardStats[household.ward_id];

        if (!ward) return;
        ward.score += score;
        ward.priorityFamilies += score > 0 ? 1 : 0;
        ward.dataGaps += dataGaps + emptyHousehold;
        ward.healthFollowUps += healthFollowUps;
        ward.pendingRequests += pendingRequests;
        ward.dueTaxes += dueTaxes;

        if (score > 0) {
            familyCards.push({
                ...household,
                wardName: ward.name,
                score,
                reasons: [
                    benefitCandidates > 0 ? `${toBnDigits(benefitCandidates)} ভাতা/সহায়তা` : null,
                    healthFollowUps > 0 ? `${toBnDigits(healthFollowUps)} health follow-up` : null,
                    dataGaps > 0 ? `${toBnDigits(dataGaps)} তথ্য ঘাটতি` : null,
                    pendingRequests > 0 ? `${toBnDigits(pendingRequests)} আবেদন` : null,
                    dueTaxes > 0 ? `${toBnDigits(dueTaxes)} tax due` : null,
                    emptyHousehold ? 'সদস্য নেই' : null
                ].filter(Boolean)
            });
        }
    });

    const rankedWards = Object.values(wardStats)
        .map((ward) => ({ ...ward, score: Math.min(99, ward.score) }))
        .sort((a, b) => b.score - a.score);

    const rankedFamilies = familyCards.sort((a, b) => b.score - a.score);
    const totals = rankedWards.reduce((acc, ward) => ({
        priorityFamilies: acc.priorityFamilies + ward.priorityFamilies,
        dataGaps: acc.dataGaps + ward.dataGaps,
        healthFollowUps: acc.healthFollowUps + ward.healthFollowUps,
        pendingRequests: acc.pendingRequests + ward.pendingRequests,
        dueTaxes: acc.dueTaxes + ward.dueTaxes
    }), { priorityFamilies: 0, dataGaps: 0, healthFollowUps: 0, pendingRequests: 0, dueTaxes: 0 });

    return { wards: rankedWards, families: rankedFamilies, totals };
}

function groupBy(rows = [], key) {
    return rows.reduce((acc, row) => {
        const value = row[key];
        if (!value) return acc;
        acc[value] = acc[value] || [];
        acc[value].push(row);
        return acc;
    }, {});
}

function countResidentDataGaps(residents = []) {
    return residents.reduce((total, resident) => {
        const age = getUnionResidentAge(resident.dob);
        return total
            + (age !== null && age >= 18 && !resident.nid ? 1 : 0)
            + (!resident.birth_reg_no ? 1 : 0)
            + (!resident.blood_group ? 1 : 0);
    }, 0);
}

function countBenefitCandidates(residents = []) {
    return residents.reduce((total, resident) => {
        const age = getUnionResidentAge(resident.dob);
        return total + (isUnionBenefitPossible(resident, age) ? 1 : 0);
    }, 0);
}

function countHealthFollowUps(residents = []) {
    return residents.reduce((total, resident) => {
        const age = getUnionResidentAge(resident.dob);
        return total + (isUnionHealthFollowUpNeeded(resident, age) ? 1 : 0);
    }, 0);
}

function getUnionResidentAge(dob) {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
    return age;
}

function buildUnionBenefitGaps(residents = [], householdIds = []) {
    const householdSet = new Set();
    const householdsWithResidents = new Set(residents.map((item) => item.household_id).filter(Boolean));
    let missingNid = 0;
    let missingBirth = 0;
    let missingBlood = 0;
    let potentialBenefits = 0;
    let healthFollowUps = 0;

    residents.forEach((resident) => {
        const age = getUnionResidentAge(resident.dob);
        const nidMissing = age !== null && age >= 18 && !resident.nid;
        const birthMissing = !resident.birth_reg_no;
        const bloodMissing = !resident.blood_group;
        const benefitPossible = isUnionBenefitPossible(resident, age);
        const healthNeeded = isUnionHealthFollowUpNeeded(resident, age);
        if (nidMissing) missingNid += 1;
        if (birthMissing) missingBirth += 1;
        if (bloodMissing) missingBlood += 1;
        if (benefitPossible) potentialBenefits += 1;
        if (healthNeeded) healthFollowUps += 1;
        if (nidMissing || birthMissing || bloodMissing || benefitPossible || healthNeeded) householdSet.add(resident.household_id);
    });

    const emptyHouseholds = householdIds.filter((id) => !householdsWithResidents.has(id)).length;
    return {
        missingNid,
        missingBirth,
        missingBlood,
        potentialBenefits,
        healthFollowUps,
        emptyHouseholds,
        households: householdSet.size + emptyHouseholds,
        critical: missingNid + missingBirth + emptyHouseholds,
        total: missingNid + missingBirth + missingBlood + potentialBenefits + healthFollowUps + emptyHouseholds
    };
}

function isUnionHealthFollowUpNeeded(resident, age) {
    const disability = String(resident.disability_status || '').toLowerCase();
    const disabled = disability && !['none', 'no', 'না', 'নেই', 'n/a'].includes(disability);
    return (age !== null && (age <= 5 || age >= 60)) || disabled || !resident.blood_group;
}

function isUnionBenefitPossible(resident, age) {
    const gender = String(resident.gender || '').toLowerCase();
    const disability = String(resident.disability_status || '').toLowerCase();
    const marital = String(resident.marital_status || '').toLowerCase();
    const occupation = String(resident.occupation || '').toLowerCase();
    const female = ['female', 'নারী', 'মহিলা'].includes(gender);
    const elderly = age !== null && ((female && age >= 62) || (!female && age >= 65));
    const disabled = disability && !['none', 'no', 'না', 'নেই', 'n/a'].includes(disability);
    const widow = female && (marital.includes('widow') || marital.includes('বিধবা'));
    const student = age !== null && age >= 5 && age <= 24 && (occupation.includes('student') || occupation.includes('ছাত্র') || occupation.includes('শিক্ষার্থী'));
    return elderly || disabled || widow || student;
}

function SparklesIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
    )
}

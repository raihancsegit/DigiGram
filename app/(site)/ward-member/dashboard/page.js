
"use client";

import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PlusCircle, Newspaper, LogOut, ShieldCheck, ArrowLeft, Settings, 
    MessageSquare, TrendingUp, ArrowUpRight, ArrowRight, Users, MapPin, School, Building2, BookOpen, Home
} from 'lucide-react';
import { performLogout, login } from '@/lib/store/features/authSlice';
import WardNewsForm from '@/components/sections/ward/WardNewsForm';
import WardManagementSection from '@/components/sections/ward/WardManagementSection';
import WardHouseholdManager from '@/components/sections/ward/WardHouseholdManager';
import { wardService } from '@/lib/services/wardService';
import { getActiveServices } from '@/lib/services/hierarchyService';
import { authService } from '@/lib/services/authService';
import { supabase } from '@/lib/utils/supabase';
import { toBnDigits, parseBnInt } from '@/lib/utils/format';
import { paths } from '@/lib/constants/paths';
import NotificationBell from '@/components/ui/NotificationBell';

export default function WardMemberDashboard() {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('news'); // 'news', 'management', or 'households'
    const [wardInfo, setWardInfo] = useState(null);
    const [newsList, setNewsList] = useState([]);
    const [villages, setVillages] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [activeServices, setActiveServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);

    const loadWardData = useCallback(async (currentUser = user) => {
        if (!currentUser || currentUser.role !== 'ward_member') return;
        setLoading(true);
        try {
            // Sync Profile with DB
            const profile = await authService.getProfile(currentUser.id);
            if (profile) {
                const updatedUser = {
                    ...currentUser,
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    avatar_url: profile.avatar_url
                };
                dispatch(login(updatedUser));
                currentUser = updatedUser;
            }

            const ward = await wardService.getWardStats(currentUser.access_scope_id);
            setWardInfo(ward);

            const vData = await wardService.getVillagesByWard(currentUser.access_scope_id);
            setVillages(vData);

            const volunteerData = await wardService.getVolunteersByWard(vData.map(v => v.id));
            setVolunteers(volunteerData);
            
            const news = await wardService.getNewsByLocation(currentUser.access_scope_id);
            setNewsList(news);

            // Fetch Union's active services using ward's parent_id
            if (ward && ward.parent_id) {
                const services = await getActiveServices(ward.parent_id);
                setActiveServices(services);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user, dispatch]);

    useEffect(() => {
        let active = true;

        const initializeWardPortal = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    if (active) setAuthChecked(true);
                    router.push('/login');
                    return;
                }

                let currentUser = user;
                if (!isAuthenticated || !currentUser) {
                    const profile = await authService.getProfile(session.user.id);
                    if (!profile || profile.role !== 'ward_member') {
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

                if (currentUser.role !== 'ward_member') {
                    if (active) setAuthChecked(true);
                    router.push('/login');
                    return;
                }

                // Auth is valid, now load data
                if (active) {
                    setAuthChecked(true);
                    await loadWardData(currentUser);
                }
            } catch (err) {
                console.error('Ward portal auth check failed:', err);
                if (active) setAuthChecked(true);
                router.push('/login');
            }
        };

        initializeWardPortal();

        return () => {
            active = false;
        };
    }, [dispatch, isAuthenticated, loadWardData, router, user]);

    const aggregatedTotals = useMemo(() => {
        if (wardInfo?.survey_status === 'verified' && wardInfo?.real_stats) {
            return {
                population: wardInfo.real_stats.total_members || 0,
                voters: wardInfo.real_stats.voters || 0,
                schools: parseBnInt(wardInfo.stats?.schools || '0'),
                mosques: parseBnInt(wardInfo.stats?.mosques || '0'),
                madrassas: parseBnInt(wardInfo.stats?.madrassas || '0')
            };
        }

        const getCount = (val) => Array.isArray(val) ? val.length : parseBnInt(val || '0');
        return (villages || []).reduce((acc, v) => ({
            population: acc.population + parseBnInt(v.population || '0'),
            voters: acc.voters + parseBnInt(v.voters || '0'),
            schools: acc.schools + getCount(v.schools),
            mosques: acc.mosques + getCount(v.mosques),
            madrassas: acc.madrassas + getCount(v.madrassas)
        }), { population: 0, voters: 0, schools: 0, mosques: 0, madrassas: 0 });
    }, [villages, wardInfo]);

    const volunteerCount = volunteers.length;

    const handleDeleteNews = async (newsId) => {
        if(!confirm('আপনি কি সত্যিই এই খবরটি মুছতে চান?')) return;
        try {
            await wardService.deleteNews(newsId);
            setNewsList(newsList.filter(n => n.id !== newsId));
        } catch(err) {
            alert('মুছতে সমস্যা হয়েছে');
        }
    }

    if (!authChecked) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="w-16 h-16 rounded-[24px] bg-white border border-slate-200 shadow-xl flex items-center justify-center mb-6">
                        <ShieldCheck className="text-teal-600 animate-pulse" size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">মেম্বার পোর্টাল</h2>
                    <p className="text-sm font-bold text-slate-400">আপনার তথ্যগুলো প্রস্তুত করা হচ্ছে...</p>
                    
                    <div className="mt-8 flex gap-1.5">
                        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 rounded-full bg-teal-500" />
                        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-teal-500/60" />
                        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-teal-500/30" />
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!isAuthenticated || !user || user?.role !== 'ward_member') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="w-16 h-16 rounded-[24px] bg-white border border-slate-200 shadow-xl flex items-center justify-center mb-6">
                        <ShieldCheck className="text-red-600 animate-pulse" size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">প্রবেশাধিকার প্রয়োজন</h2>
                    <p className="text-sm font-bold text-slate-400">আপনার পাসওয়ার্ড রিসেট করতে লগইন করুন।</p>
                    
                    <button
                        onClick={() => router.push('/login')}
                        className="mt-8 px-6 py-3 bg-teal-600 text-white rounded-xl font-black text-sm hover:bg-teal-700 transition-all"
                    >
                        লগইন পৃষ্ঠায় যান
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header / Top Bar */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                        <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <ShieldCheck className="text-teal-600" />
                            অফিসিয়াল পোর্টাল 
                            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-md bg-teal-50 text-teal-600 text-[10px] font-black uppercase tracking-wider border border-teal-100">
                                মেম্বার এক্সেস
                            </span>
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2">
                        <Link 
                            href="/ward-member/settings"
                            className="flex items-center gap-2 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-100 px-3 sm:px-4 py-2 rounded-xl transition-all"
                        >
                            <Settings size={18} />
                            <span className="hidden xs:inline">সেটিংস</span>
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
                            className="flex items-center gap-2 text-red-500 font-bold text-xs sm:text-sm hover:bg-red-50 px-3 sm:px-4 py-2 rounded-xl transition-all"
                        >
                            <LogOut size={18} />
                            <span className="hidden xs:inline">লগআউট</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
                {/* Portal Connection Status Bar */}
                <div className="flex items-center justify-between mb-8 px-6 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500" />
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">সার্ভার স্ট্যাটাস:</span>
                            <span className="text-xs font-black text-emerald-600">সংযুক্ত</span>
                        </div>
                        <div className="hidden md:flex items-center gap-2 border-l border-slate-100 pl-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">লাস্ট সিঙ্ক:</span>
                            <span className="text-xs font-black text-slate-600">{toBnDigits(new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }))}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">ওয়ার্ড {toBnDigits((wardInfo?.name_bn || '').match(/\d+/)?.[0] || '')} এডমিন</span>
                    </div>
                </div>
                
                {/* Hero Greeting */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-slate-900 to-teal-900 rounded-[32px] p-8 md:p-12 text-white shadow-xl mb-10 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <ShieldCheck size={160} strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-2 text-teal-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                                <SparklesIcon />
                                ADMINISTRATIVE DASHBOARD
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-4">
                                {user.avatar_url && (
                                    <div className="w-20 h-20 rounded-[28px] border-4 border-white/20 overflow-hidden shadow-2xl shrink-0 relative">
                                        <Image src={user.avatar_url} alt="Avatar" fill className="object-cover" />
                                    </div>
                                )}
                                <h2 className="text-3xl md:text-5xl font-black leading-tight">
                                    স্বাগতম, <br className="block sm:hidden" />
                                    <span className="text-teal-400">{user.first_name} {user.last_name || ''}</span>
                                </h2>
                            </div>
                            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10 mb-8">
                                <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                                    <MapPin size={16} className="text-teal-400" />
                                </div>
                                <p className="text-slate-100 font-bold text-sm">
                                    ওয়ার্ড পোর্টাল এডিটর: <span className="text-white font-black">{wardInfo?.name_bn || 'ওয়ার্ড'}</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-4 border border-white/10 text-left hover:bg-white/20 transition-all">
                                    <p className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-300 mb-2">
                                        <Users size={12} /> জনসংখ্যা
                                    </p>
                                    <p className="text-2xl font-black">{toBnDigits((aggregatedTotals.population||0).toString())}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-4 border border-white/10 text-left hover:bg-white/20 transition-all">
                                    <p className="flex items-center gap-2 text-[10px] font-black uppercase text-teal-300 mb-2">
                                        <Users size={12} /> ভোটার
                                    </p>
                                    <p className="text-2xl font-black">{toBnDigits((aggregatedTotals.voters||0).toString())}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-4 border border-white/10 text-left hover:bg-white/20 transition-all">
                                    <p className="flex items-center gap-2 text-[10px] font-black uppercase text-orange-300 mb-2">
                                        <School size={12} /> স্কুল
                                    </p>
                                    <p className="text-2xl font-black">{toBnDigits((aggregatedTotals.schools||0).toString())}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-4 border border-white/10 text-left hover:bg-white/20 transition-all">
                                    <p className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-300 mb-2">
                                        <Building2 size={12} /> মসজিদ
                                    </p>
                                    <p className="text-2xl font-black">{toBnDigits((aggregatedTotals.mosques||0).toString())}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-4 border border-white/10 text-left hover:bg-white/20 transition-all">
                                    <p className="flex items-center gap-2 text-[10px] font-black uppercase text-sky-300 mb-2">
                                        <BookOpen size={12} /> ভলান্টিয়ার
                                    </p>
                                    <p className="text-2xl font-black">{toBnDigits(volunteerCount.toString())}</p>
                                </div>
                            </div>
                        </div>
                        
                             <div className="flex flex-col gap-2">
                                <div className="bg-white/10 backdrop-blur-md rounded-[22px] p-4 border border-white/10 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                        <MapPin className="text-teal-300" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-teal-400 leading-none mb-1">মোট গ্রাম</p>
                                        <p className="text-2xl font-black tracking-tighter leading-none">{toBnDigits(villages.length.toString())}</p>
                                    </div>
                                </div>
                                {wardInfo?.parent?.slug && (
                                     <Link
                                         href={paths.wardPortal(wardInfo.parent.slug, wardInfo.slug || wardInfo.id)}
                                         target="_blank"
                                        className="bg-white text-slate-900 px-6 py-4 rounded-[22px] font-black hover:bg-teal-400 hover:text-white transition-all shadow-xl flex items-center gap-3 group whitespace-nowrap"
                                    >
                                        ভিউ মোড
                                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                            <ArrowUpRight size={18} className="text-slate-600 group-hover:text-white" />
                                        </div>
                                    </Link>
                                )}
                            </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                    <div className="xl:col-span-2 bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
                        <h3 className="text-xl font-black text-slate-800 mb-4">ওয়ার্ডের গ্রামভিত্তিক ভলান্টিয়ার</h3>
                        {volunteers.length === 0 ? (
                            <div className="rounded-[24px] border border-dashed border-slate-200 p-10 text-center text-slate-500">
                                <p className="font-black">এই ওয়ার্ডে এখনও কোন ভলান্টিয়ার অ্যাসাইন করা হয়নি</p>
                                <p className="text-sm mt-2">গ্রামের ভলান্টিয়ার অ্যাসাইনমেন্ট চেক করুন অ্যাডমিন পোর্টালে।</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {volunteers.map((vol) => (
                                    <div key={vol.id} className="rounded-3xl border border-slate-100 p-5 bg-slate-50">
                                        <p className="text-sm font-black text-slate-800">{vol.first_name} {vol.last_name}</p>
                                        <p className="text-[11px] text-slate-500 mt-2">ফোন: {vol.phone || 'N/A'}</p>
                                        <p className="text-[11px] text-slate-500 mt-1">গ্রাম আইডি: {vol.access_scope_id}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="xl:col-span-1 bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
                        <h3 className="text-xl font-black text-slate-800 mb-4">গ্রামের সংখ্যা</h3>
                        <p className="text-5xl font-black text-teal-600">{toBnDigits(villages.length.toString())}</p>
                        <p className="text-sm text-slate-500 mt-2">আপনার ওয়ার্ডের মোট গ্রামে ভলান্টিয়ার উপস্থিতি চেক করুন</p>
                    </div>
                </div>

                {/* Tab Switcher - Scrollable on Mobile */}
                <div className="mb-8">
                    <div className="flex flex-wrap p-1.5 bg-slate-200/50 rounded-[24px] w-full gap-1">
                        <button 
                            onClick={() => setActiveTab('news')}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'news' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <MessageSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
                            নিউজ ও আপডেট
                        </button>
                        <button 
                            onClick={() => setActiveTab('services')}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'services' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <ShieldCheck size={16} className="sm:w-[18px] sm:h-[18px]" />
                            ডিজিটাল সেবাসমূহ
                        </button>
                        <button 
                            onClick={() => setActiveTab('households')}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'households' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Home size={16} className="sm:w-[18px] sm:h-[18px]" />
                            হাউসহোল্ড ম্যানেজমেন্ট
                        </button>
                        <button 
                            onClick={() => setActiveTab('management')}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'management' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Settings size={16} className="sm:w-[18px] sm:h-[18px]" />
                            ওয়াড ম্যানেজমেন্ট
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'news' ? (
                        <motion.div 
                            key="news"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                        >
                            {/* Left: Input Form */}
                            <div className="lg:col-span-7 space-y-8">
                                <section className="bg-white rounded-[32px] p-6 md:p-10 border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                                            <PlusCircle size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800">নতুন খবর যোগ করুন</h3>
                                            <p className="text-sm font-bold text-slate-400 leading-none mt-1">আপনার ওয়াডের বাসিন্দাদের আপডেট রাখুন</p>
                                        </div>
                                    </div>
                                    <WardNewsForm user={user} onSuccess={loadWardData} wardId={user.access_scope_id} />
                                </section>
                            </div>

                            {/* Right: Existing News */}
                            <div className="lg:col-span-5 space-y-8">
                                <section className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                            <Newspaper className="text-teal-600" />
                                            আমার শেয়ার করা খবর
                                        </h3>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{newsList.length} টি</span>
                                    </div>

                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                        {newsList.length === 0 ? (
                                            <div className="text-center py-12 px-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                    <TrendingUp className="text-slate-300" />
                                                </div>
                                                <p className="font-bold text-slate-400">এখনো কোনো খবর শেয়ার করেননি!</p>
                                            </div>
                                        ) : (
                                            newsList.map((news, idx) => (
                                                <motion.div 
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    key={news.id} 
                                                    className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-teal-200 hover:shadow-md transition-all group"
                                                >
                                                    <span className="text-[10px] font-black text-teal-600 uppercase mb-2 block">{news.category}</span>
                                                    <h4 className="font-black text-slate-800 text-base leading-tight mb-2 group-hover:text-teal-700 transition-colors">
                                                        {news.title}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mb-3">{news.excerpt}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-400 tracking-tighter">
                                                            {new Date(news.created_at).toLocaleDateString('bn-BD')}
                                                        </span>
                                                        <button 
                                                            onClick={() => handleDeleteNews(news.id)}
                                                            className="text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase"
                                                        >মুছুন</button>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </section>
                            </div>
                        </motion.div>
                    ) : activeTab === 'services' ? (
                        <motion.div 
                            key="services"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="bg-white rounded-[40px] p-6 md:p-10 border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                                        <ShieldCheck size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800">ডিজিটাল সেবাসমূহ</h3>
                                        <p className="text-sm font-bold text-slate-400 mt-1">আপনার ইউনিয়নের জন্য অনুমোদিত সেবাসমূহ</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {activeServices.length === 0 ? (
                                        <div className="col-span-12 text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                            <p className="text-slate-400 font-bold">বর্তমানে কোনো সেবা চালু নেই।</p>
                                        </div>
                                    ) : (
                                        activeServices.map((item, idx) => {
                                            const service = item.services;
                                            return (
                                                <Link 
                                                    href={`${paths.service(service.slug)}?u=${wardInfo?.parent?.slug || ''}`} 
                                                    key={idx} 
                                                    className="block group"
                                                >
                                                    <div className="p-6 rounded-[32px] bg-white border border-slate-200 hover:border-teal-500/30 hover:shadow-xl hover:shadow-teal-500/5 transition-all relative overflow-hidden h-full">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                                            <ShieldCheck size={24} />
                                                        </div>
                                                        <h4 className="font-black text-xl text-slate-800 mb-2">{service.name}</h4>
                                                        <p className="text-xs font-bold text-slate-500">পরিচালনা করতে ক্লিক করুন</p>
                                                    </div>
                                                </Link>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : activeTab === 'management' ? (
                        <motion.div 
                            key="management"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white rounded-[40px] p-6 md:p-12 border border-slate-200 shadow-sm"
                        >
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-14 h-14 rounded-3xl bg-teal-500 flex items-center justify-center text-white shadow-xl shadow-teal-100 shrink-0">
                                    <Settings size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 leading-tight">ওয়াড ম্যানেজমেন্ট</h3>
                                    <p className="text-sm font-bold text-slate-400 mt-1">আপনার ওয়াডের প্রোফাইল এবং পরিসংখ্যান এখান থেকে নিয়ন্ত্রন করুন</p>
                                </div>
                            </div>
                            <WardManagementSection user={user} wardInfo={wardInfo} />
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="households"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="bg-white rounded-[40px] p-6 md:p-12 border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-14 h-14 rounded-3xl bg-teal-900 flex items-center justify-center text-teal-400 shadow-xl shrink-0">
                                        <Home size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 leading-tight">বাড়ি ও জনসংখ্যা ম্যানেজমেন্ট</h3>
                                        <p className="text-sm font-bold text-slate-400 mt-1">গ্রাম ভিত্তিক ভলান্টিয়ার এবং বাড়ির ডাটা কন্ট্রোল করুন</p>
                                    </div>
                                </div>
                                <WardHouseholdManager wardId={user.access_scope_id} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

function SparklesIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
    )
}

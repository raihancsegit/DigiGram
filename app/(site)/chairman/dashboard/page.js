
"use client";

import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PlusCircle, Newspaper, LogOut, ShieldCheck, ArrowLeft, Settings, 
    MessageSquare, TrendingUp, Users, MapPin, CheckCircle2, UserCircle,
    ArrowUpRight, Sparkles, School, Building2, BookOpen, Phone, Search, HandHeart,
    ChevronLeft, ChevronRight, ShoppingBag, FileText
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
import { toBnDigits, parseBnInt } from '@/lib/utils/format';
import UnionNewsForm from '@/components/sections/union/UnionNewsForm';
import UnionManagementSection from '@/components/sections/union/UnionManagementSection';
import UnionServiceManager from '@/components/sections/union/UnionServiceManager';
import { unionService } from '@/lib/services/unionService';

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'chairman') {
            router.push('/login');
            return;
        }
        loadData();
    }, [isAuthenticated, router]);

    const loadData = async () => {
        if (!user || user.role !== 'chairman') return;
        setLoading(true);
        try {
            const profile = await authService.getProfile(user.id);
            if (profile) {
                dispatch(login({
                    ...user,
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    avatar_url: profile.avatar_url
                }));
            }

            const { data: unionData } = await supabase
                .from('locations')
                .select('name_bn, name_en, slug')
                .eq('id', user.access_scope_id)
                .single();
            if(unionData) {
                setUnionName(unionData.name_bn);
                setUnionSlug(unionData.slug);
                setUnionInfo(unionData);
            }

            const wardsData = await getWardsWithDetailsByUnion(user.access_scope_id);
            setWards(wardsData);
            
            const news = await wardService.getNewsByLocation(user.access_scope_id);
            setNewsList(news);

            const services = await getActiveServices(user.access_scope_id);
            setActiveServices(services);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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
        return wards.reduce((acc, w) => {
            const dynamicStats = (w.villages || []).reduce((vAcc, v) => ({
                population: vAcc.population + parseBnInt(v.population || '0'),
                voters: vAcc.voters + parseBnInt(v.voters || '0'),
                schools: vAcc.schools + parseBnInt(v.schools || '0'),
                mosques: vAcc.mosques + parseBnInt(v.mosques || '0'),
                madrassas: vAcc.madrassas + parseBnInt(v.madrassas || '0')
            }), { population: 0, voters: 0, schools: 0, mosques: 0, madrassas: 0 });

            return {
                population: acc.population + dynamicStats.population,
                voters: acc.voters + dynamicStats.voters,
                villages: acc.villages + (w.villages?.length || 0),
                schools: acc.schools + dynamicStats.schools,
                mosques: acc.mosques + dynamicStats.mosques,
                madrassas: acc.madrassas + dynamicStats.madrassas
            };
        }, { population: 0, voters: 0, villages: 0, schools: 0, mosques: 0, madrassas: 0 });
    }, [wards]);

    if (!isAuthenticated || !user || loading) {
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
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                        <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <ShieldCheck className="text-indigo-600" />
                            সেন্ট্রাল পোর্টাল 
                            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                                চেয়ারম্যান এক্সেস
                            </span>
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2">
                        <Link 
                            href="/chairman/settings"
                            className="flex items-center gap-2 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-100 px-3 sm:px-4 py-2 rounded-xl transition-all"
                        >
                            <Settings size={18} />
                            <span className="hidden xs:inline">সেটিংস</span>
                        </Link>
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
                <div className="flex items-center justify-between mb-8 px-6 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">সার্ভার স্ট্যাটাস:</span>
                            <span className="text-xs font-black text-emerald-600">সংযুক্ত</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{unionName} এডমিন</span>
                    </div>
                </div>
                
                <div className="mb-8">
                    <div className="flex flex-wrap p-1.5 bg-slate-200/50 rounded-[24px] w-full gap-1">
                        <button 
                            onClick={() => setActiveTab('overview')}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Settings size={16} className="sm:w-[18px] sm:h-[18px]" />
                            ওয়াড ওভারভিউ
                        </button>
                        <button 
                            onClick={() => setActiveTab('digital-services')}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'digital-services' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />
                            ডিজিটাল সেবাসমূহ
                        </button>
                        <button 
                            onClick={() => setActiveTab('news')}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'news' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <MessageSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
                            ইউনিয়ন নিউজ
                        </button>
                        
                        <button 
                            onClick={() => setActiveTab('emergency')}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'emergency' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Phone size={16} className="sm:w-[18px] sm:h-[18px]" />
                            জরুরি হটলাইন
                        </button>

                        <button 
                            onClick={() => setActiveTab('lost-found')}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'lost-found' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Search size={16} className="sm:w-[18px] sm:h-[18px]" />
                            হারানো ও প্রাপ্তি
                        </button>

                        <button 
                            onClick={() => setActiveTab('donation')}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'donation' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <HandHeart size={16} className="sm:w-[18px] sm:h-[18px]" />
                            স্বচ্ছ দান
                        </button>

                        <button 
                            onClick={() => setActiveTab('service-requests')}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'service-requests' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                            আবেদনসমূহ
                        </button>

                        <button 
                            onClick={() => setActiveTab('market')}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'market' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <ShoppingBag size={16} className="sm:w-[18px] sm:h-[18px]" />
                            হাট বাজার
                        </button>

                        <button 
                            onClick={() => setActiveTab('management')}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'management' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
                            <div className="bg-white rounded-[40px] p-6 md:p-10 border border-slate-200 shadow-sm">
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
                                        const dynamicStats = (ward.villages || []).reduce((acc, v) => ({
                                            population: acc.population + parseBnInt(v.population || '0'),
                                            voters: acc.voters + parseBnInt(v.voters || '0')
                                        }), { population: 0, voters: 0 });
                                        
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
                            <div className="bg-white rounded-[40px] p-6 md:p-10 border border-slate-200 shadow-sm">
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
                            <div className="bg-white rounded-[40px] p-6 md:p-12 border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-4 mb-10">
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

function SparklesIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
    )
}

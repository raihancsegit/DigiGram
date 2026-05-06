
"use client";

import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PlusCircle, Newspaper, LogOut, ShieldCheck, ArrowLeft, Settings, 
    MessageSquare, TrendingUp, Users, MapPin, CheckCircle2, UserCircle,
    ArrowUpRight, Sparkles, School, Building2, BookOpen, Phone, Search, HandHeart
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
import { toBnDigits, parseBnInt } from '@/lib/utils/format';

export default function ChairmanDashboard() {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const router = useRouter();
    
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'news'
    
    const [unionName, setUnionName] = useState('');
    const [unionSlug, setUnionSlug] = useState('');
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
    }, [isAuthenticated, router]); // Removed 'user' to prevent infinite loop

    const loadData = async () => {
        if (!user || user.role !== 'chairman') return;
        setLoading(true);
        try {
            // Sync Profile with DB
            const profile = await authService.getProfile(user.id);
            if (profile) {
                dispatch(login({
                    ...user,
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    avatar_url: profile.avatar_url
                }));
            }

            // Get Union Details
            const { data: unionData } = await supabase
                .from('locations')
                .select('name_bn, name_en, slug')
                .eq('id', user.access_scope_id)
                .single();
            if(unionData) {
                setUnionName(unionData.name_bn);
                setUnionSlug(unionData.slug);
            }

            // Get Wards
            const wardsData = await getWardsWithDetailsByUnion(user.access_scope_id);
            setWards(wardsData);
            
            // Get Union News
            const news = await wardService.getNewsByLocation(user.access_scope_id);
            setNewsList(news);

            // Get Active Services
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
                    
                    <div className="mt-8 flex gap-1.5">
                        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 rounded-full bg-indigo-500" />
                        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-indigo-500/60" />
                        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-indigo-500/30" />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header */}
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
                {/* Portal Connection Status Bar */}
                <div className="flex items-center justify-between mb-8 px-6 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
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
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{unionName} এডমিন</span>
                    </div>
                </div>
                
                {/* Hero Greeting */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[32px] p-8 md:p-12 text-white shadow-xl mb-10 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <ShieldCheck size={160} strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                                <SparklesIcon />
                                CENTRAL ADMINISTRATIVE PORTAL
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-4">
                                {user.avatar_url && (
                                    <div className="w-20 h-20 rounded-[28px] border-4 border-white/20 overflow-hidden shadow-2xl shrink-0">
                                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <h2 className="text-3xl md:text-5xl font-black leading-tight">
                                    স্বাগতম, <br className="block sm:hidden" />
                                    <span className="text-indigo-400">{user.first_name} {user.last_name || ''}</span>
                                </h2>
                            </div>
                            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10 mb-8">
                                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                    <ShieldCheck size={16} className="text-indigo-400" />
                                </div>
                                <p className="text-slate-100 font-bold text-sm">
                                    ইউনিয়ন পোর্টাল এডিটর: <span className="text-white font-black">{unionName}</span>
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
                                    <p className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-300 mb-2">
                                        <MapPin size={12} /> গ্রাম
                                    </p>
                                    <p className="text-2xl font-black">{toBnDigits((aggregatedTotals.villages||0).toString())}</p>
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
                                        <BookOpen size={12} /> মাদ্রাসা
                                    </p>
                                    <p className="text-2xl font-black">{toBnDigits((aggregatedTotals.madrassas||0).toString())}</p>
                                </div>
                            </div>
                        </div>

                         <div className="flex flex-col gap-2">
                            <div className="bg-white/10 backdrop-blur-md rounded-[22px] p-4 border border-white/10 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <MapPin className="text-amber-300" size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-indigo-400 leading-none mb-1">মোট গ্রাম</p>
                                    <p className="text-2xl font-black tracking-tighter leading-none">{toBnDigits((aggregatedTotals.villages||0).toString())}</p>
                                </div>
                            </div>
                            {unionSlug && (
                                <Link
                                    href={`/u/${unionSlug}`}
                                    target="_blank"
                                    className="flex items-center justify-center gap-3 bg-white text-slate-900 px-6 py-4 rounded-[22px] font-black hover:bg-indigo-500 hover:text-white transition-all shadow-2xl group"
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

                {/* Tab Switcher - Scrollable on Mobile */}
                <div className="overflow-x-auto pb-4 -mb-4 scrollbar-hide">
                    <div className="flex p-1 bg-slate-200/50 rounded-2xl w-fit mb-8 gap-1 whitespace-nowrap">
                        <button 
                            onClick={() => { setActiveTab('overview'); setServicePage(1); }}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Settings size={16} className="sm:w-[18px] sm:h-[18px]" />
                            ওয়াড ওভারভিউ
                        </button>
                        <button 
                            onClick={() => { setActiveTab('services'); setServicePage(1); }}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'services' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />
                            ডিজিটাল সেবাসমূহ
                        </button>
                        <button 
                            onClick={() => { setActiveTab('news'); setServicePage(1); }}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'news' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <MessageSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
                            ইউনিয়ন নিউজ ও নোটিশ
                        </button>
                        
                        {activeServices.find(s => s.services.slug === 'emergency-hotline') && (
                            <button 
                                onClick={() => { setActiveTab('emergency'); setServicePage(1); }}
                                className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'emergency' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Phone size={16} className="sm:w-[18px] sm:h-[18px]" />
                                জরুরি হটলাইন
                            </button>
                        )}

                        {activeServices.find(s => s.services.slug === 'lost-found') && (
                            <button 
                                onClick={() => { setActiveTab('lost-found'); setServicePage(1); }}
                                className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'lost-found' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Search size={16} className="sm:w-[18px] sm:h-[18px]" />
                                হারানো ও প্রাপ্তি
                            </button>
                        )}

                        <button 
                            onClick={() => { setActiveTab('donation'); setServicePage(1); }}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === 'donation' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <HandHeart size={16} className="sm:w-[18px] sm:h-[18px]" />
                            স্বচ্ছ দান
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
                                    {wards.length === 0 ? (
                                        <div className="col-span-12 text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                            <p className="text-slate-400 font-bold">কোনো ওয়াড পাওয়া যায়নি।</p>
                                        </div>
                                    ) : (
                                        wards.map((ward) => {
                                            const dynamicStats = (ward.villages || []).reduce((acc, v) => ({
                                                population: acc.population + parseBnInt(v.population || '0'),
                                                voters: acc.voters + parseBnInt(v.voters || '0')
                                            }), { population: 0, voters: 0 });
                                            
                                            return (
                                            <div key={ward.id} className="p-6 rounded-[32px] bg-white border border-slate-200 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-colors" />
                                                
                                                <div className="flex items-center justify-between mb-6 relative">
                                                    <div>
                                                        <h4 className="font-black text-xl text-slate-800">{ward.name}</h4>
                                                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mt-1">প্রশাসনিক ইউনিট</p>
                                                    </div>
                                                    <div className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-600 text-[10px] font-black border border-teal-100 shadow-sm">
                                                        {toBnDigits(ward.villages?.length.toString() || '০')}টি গ্রাম
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-3 mb-6">
                                                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-white transition-colors">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">জনসংখ্যা</p>
                                                        <p className="text-sm font-black text-slate-700">{toBnDigits(dynamicStats.population.toString())}</p>
                                                    </div>
                                                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-white transition-colors">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">ভোটার</p>
                                                        <p className="text-sm font-black text-slate-700">{toBnDigits(dynamicStats.voters.toString())}</p>
                                                    </div>
                                                </div>
 
                                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-all">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:border-indigo-200">
                                                        {ward.member?.avatar_url ? (
                                                            <img src={ward.member.avatar_url} alt={ward.member.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <UserCircle size={20} className="text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-black uppercase text-indigo-400 mb-0.5">দায়িত্বপ্রাপ্ত মেম্বার</p>
                                                        <p className="text-sm font-black text-slate-700 truncate">{ward.member ? ward.member.name : 'নিয়োগ দেয়া হয়নি'}</p>
                                                        {ward.member && ward.member.phone && (
                                                            <a href={`tel:${ward.member.phone}`} className="text-[11px] font-bold text-teal-600 mt-0.5 block hover:underline">
                                                                {toBnDigits(ward.member.phone)}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )})
                                    )}
                                </div>
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
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Sparkles size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800">ডিজিটাল সেবাসমূহ</h3>
                                        <p className="text-sm font-bold text-slate-400 mt-1">এই ইউনিয়নের জন্য চালু থাকা সকল সেবা</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {activeServices.length === 0 ? (
                                        <div className="col-span-12 text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                            <p className="text-slate-400 font-bold">বর্তমানে কোনো সেবা চালু নেই।</p>
                                        </div>
                                    ) : (
                                        activeServices.slice((servicePage - 1) * SERVICES_PER_PAGE, servicePage * SERVICES_PER_PAGE).map((item, idx) => {
                                            const service = item.services;
                                            return (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => {
                                                        if (service.slug === 'emergency-hotline') setActiveTab('emergency');
                                                        else if (service.slug === 'lost-found') setActiveTab('lost-found');
                                                        else if (service.slug === 'donation-portal') setActiveTab('donation');
                                                        else router.push(`/chairman/services/${service.slug}`);
                                                    }}
                                                    className="block group cursor-pointer"
                                                >
                                                    <div className="p-6 rounded-[32px] bg-white border border-slate-200 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden h-full">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                            {service.slug === 'lost-found' ? <Search size={24} /> : service.slug === 'emergency-hotline' ? <Phone size={24} /> : service.slug === 'donation-portal' ? <HandHeart size={24} /> : <Sparkles size={24} />}
                                                        </div>
                                                        <h4 className="font-black text-xl text-slate-800 mb-2">{service.name}</h4>
                                                        <p className="text-xs font-bold text-slate-500">পরিচালনা করতে ক্লিক করুন</p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Services Pagination */}
                                {activeServices.length > SERVICES_PER_PAGE && (
                                    <div className="flex items-center justify-center gap-2 mt-10">
                                        <button 
                                            onClick={() => setServicePage(p => Math.max(1, p - 1))}
                                            disabled={servicePage === 1}
                                            className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <div className="flex gap-1">
                                            {Array.from({ length: Math.ceil(activeServices.length / SERVICES_PER_PAGE) }).map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setServicePage(i + 1)}
                                                    className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${
                                                        servicePage === i + 1 
                                                        ? 'bg-indigo-600 text-white shadow-lg' 
                                                        : 'bg-white border border-slate-200 text-slate-500'
                                                    }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={() => setServicePage(p => Math.min(Math.ceil(activeServices.length / SERVICES_PER_PAGE), p + 1))}
                                            disabled={servicePage === Math.ceil(activeServices.length / SERVICES_PER_PAGE)}
                                            className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : activeTab === 'emergency' ? (
                        <motion.div 
                            key="emergency"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <EmergencyServiceManager locationId={user?.access_scope_id} />
                        </motion.div>
                    ) : activeTab === 'lost-found' ? (
                        <motion.div 
                            key="lost-found"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <LostFoundManager locationId={user?.access_scope_id} />
                        </motion.div>
                    ) : activeTab === 'news' ? (
                        <motion.div 
                            key="news"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <NewsManager locationId={user?.access_scope_id} isAdmin={false} />
                        </motion.div>
                    ) : activeTab === 'donation' ? (
                        <motion.div 
                            key="donation"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <DonationManager unionSlug={unionSlug} />
                        </motion.div>
                    ) : null}
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

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
    MapPin, Home, Sparkles, ArrowUpRight, ArrowRight as LucideArrowRight,
    Users, UserCheck, ShieldCheck, School, GraduationCap, 
    BookOpen, Phone, UserCircle, CheckCircle2, LogIn, ChevronLeft, ChevronRight, Building2, Droplets,
    Activity, BellRing, Navigation, Heart, MoveRight, Newspaper, ArrowLeft, PhoneCall,
    Search, Mic, MicOff, Send, Loader2, SearchX
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { SERVICE_CATEGORIES } from '@/lib/constants/serviceCategories';
import { useRef } from 'react';
import { applyLocationSnapshot } from '@/lib/store/features/locationSlice';
import { paths } from '@/lib/constants/paths';
import { searchLocations } from '@/lib/services/hierarchyService';
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

    // Search Logic for Portals
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const searchRef = useRef(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (!searchQuery || searchQuery.trim().length < 1) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const locationResults = await searchLocations(searchQuery);
                
                const queryLower = searchQuery.toLowerCase();
                const serviceResults = SERVICE_CATEGORIES.filter(s => 
                    s.title.toLowerCase().includes(queryLower) || 
                    s.subtitle.toLowerCase().includes(queryLower) ||
                    (s.id && s.id.includes(queryLower))
                ).map(s => ({ ...s, type: 'service' }));

                const combined = [...serviceResults, ...locationResults];
                setSearchResults(combined.slice(0, 8));
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const startVoiceSearch = () => {
        if (typeof window === 'undefined') return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return alert('ব্রাউজার সাপোর্ট করে না');

        if (isListening) {
            recognitionRef.current?.stop();
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'bn-BD';
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => setSearchQuery(event.results[0][0].transcript);
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
        recognition.start();
    };

    const getResultPath = (item) => {
        if (item.type === 'service') return `${paths.service(item.id)}?u=${encodeURIComponent(union.slug)}`;
        if (item.type === 'union') return paths.unionPortal(item.slug);
        if (item.type === 'ward') return paths.wardPortal(item.union_slug, item.slug || item.id);
        if (item.type === 'village') return paths.villagePortal(item.union_slug, item.ward_slug, item.slug || item.id);
        return '#';
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setSearchResults([]);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        return villages.reduce((acc, v) => {
            const getCount = (val) => Array.isArray(val) ? val.length : parseBnInt(val || '0');
            return {
                population: acc.population + parseBnInt(v.population || '0'),
                voters: acc.voters + parseBnInt(v.voters || '0'),
                schools: acc.schools + getCount(v.schools),
                mosques: acc.mosques + getCount(v.mosques),
                madrassas: acc.madrassas + getCount(v.madrassas),
                orphanages: acc.orphanages + getCount(v.orphanages),
                maleVoters: acc.maleVoters + parseBnInt(v.maleVoters || '0'),
                femaleVoters: acc.femaleVoters + parseBnInt(v.femaleVoters || '0'),
            };
        }, { population: 0, voters: 0, schools: 0, mosques: 0, madrassas: 0, orphanages: 0, maleVoters: 0, femaleVoters: 0 });
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

    const statsList = [
        { label: 'মোট গ্রাম', value: toBnDigits((ward.villages?.length || 0).toString()), icon: MapPin, color: 'text-teal-400', bg: 'bg-teal-500/10' },
        { label: 'রক্তদাতা', value: toBnDigits((ward.bloodDonors?.length || 0).toString()), icon: Droplets, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        { label: 'জনসংখ্যা', value: toBnDigits((wardStats.population || parseBnInt(ward.population || '0')).toString()), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'মোট ভোটার', value: toBnDigits((wardStats.voters || parseBnInt(ward.voters || '0')).toString()), icon: UserCheck, color: 'text-sky-400', bg: 'bg-sky-500/10' },
        { label: 'পুরুষ ভোটার', value: toBnDigits(wardStats.maleVoters.toString()), icon: UserCircle, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { label: 'মহিলা ভোটার', value: toBnDigits(wardStats.femaleVoters.toString()), icon: UserCircle, color: 'text-violet-400', bg: 'bg-violet-500/10' },
        { label: 'স্কুল', value: toBnDigits(wardStats.schools.toString()), icon: School, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        { label: 'মসজিদ', value: toBnDigits(wardStats.mosques.toString()), icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    ];

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Hero Section */}
            <div className="relative pt-4 md:pt-10 pb-20 md:pb-40 px-3 md:px-6 bg-slate-900 border-b border-slate-800 rounded-b-[32px] md:rounded-b-[80px]">
                {/* Background Blobs - Wrapped to prevent overflow */}
                <div className="absolute inset-0 overflow-hidden rounded-b-[32px] md:rounded-b-[80px] pointer-events-none">
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/4" />
                    </div>
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
                                    <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur-md border border-white/5 shadow-lg text-teal-400">
                                        <Sparkles size={14} />
                                        w/{ward.slug || ward.id.substring(0, 8)}
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-2xl bg-teal-500/20 text-teal-100 px-4 py-2 text-xs font-bold border border-teal-500/20">
                                        <MapPin size={14} className="text-teal-400" />
                                        {ward.villages?.length || 0}টি গ্রাম · {toBnDigits(ward.bloodDonors?.length.toString() || '0')} রক্তদাতা
                                    </div>
                                </div>
                                <p className="mt-4 text-slate-400 font-bold max-w-xl text-sm md:text-base leading-relaxed">
                                    এটি {union.name} ইউনিয়নের {ward.name} এর ডিজিটাল প্রশাসনিক পোর্টাল। এখানে ওয়ার্ডের সকল গ্রাম এবং জনগণের সেবা সম্পর্কিত তথ্য পাওয়া যাবে।
                                </p>
                            </div>

                            {/* Quick Action Card inside Hero */}
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="hidden lg:block shrink-0 p-6 rounded-[32px] bg-white/[0.05] backdrop-blur-xl border border-white/10 w-72 shadow-2xl relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                                    <Phone size={100} className="text-white" />
                                </div>
                                <p className="text-[10px] font-black uppercase text-teal-300 mb-4 tracking-widest relative z-10 flex items-center gap-2">
                                    <BellRing size={12} />
                                    জরুরি যোগাযোগ
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 relative z-10 hover:bg-white/10 transition-colors cursor-pointer group/item">
                                        <div className="p-3 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-500/30 group-hover/item:scale-110 transition-transform">
                                            <PhoneCall size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-teal-200">জাতীয় হেল্পলাইন</p>
                                            <p className="text-xl font-black tracking-tighter leading-none text-white mt-1">৩৩৩</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 relative z-10 hover:bg-white/10 transition-colors cursor-pointer group/item">
                                        <div className="p-3 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 shadow-lg shadow-rose-500/30 group-hover/item:scale-110 transition-transform">
                                            <ShieldCheck size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-rose-200">পুলিশ হেল্পলাইন</p>
                                            <p className="text-xl font-black tracking-tighter leading-none text-white mt-1">৯৯৯</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Integrated Stats Grid */}
                        <div className="mt-12 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
                            {statsList.map((s, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 + 0.3 }}
                                    key={i} 
                                    className="flex flex-col items-center text-center p-4 rounded-[28px] bg-white/[0.03] backdrop-blur-xl border border-white/5 hover:bg-white/[0.08] hover:border-white/15 hover:-translate-y-1 transition-all duration-300 group"
                                >
                                    <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-black/20`}>
                                        <s.icon className={`${s.color}`} size={20} />
                                    </div>
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1.5 leading-tight group-hover:text-teal-400 transition-colors">{s.label}</p>
                                    <p className="text-base font-black text-white tracking-tight leading-none">{s.value}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Search Bar Integration */}
                        <div className="mt-12 max-w-3xl relative group z-50" ref={searchRef}>
                            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-rose-500 rounded-[32px] blur opacity-10 group-focus-within:opacity-30 transition duration-500" />
                            <div className="relative flex items-center bg-white/10 border border-white/10 backdrop-blur-2xl rounded-[30px] p-2">
                                <div className="pl-6 pr-4">
                                    <Search size={22} className="text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="আপনার কি প্রয়োজন? (সেবা, নম্বর...)"
                                    className="flex-1 bg-transparent py-3 sm:py-4 text-white placeholder:text-slate-500 outline-none font-bold text-sm sm:text-lg"
                                />
                                <div className="flex items-center gap-2 mr-2">
                                    <button 
                                        onClick={startVoiceSearch}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                            isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/5 text-teal-400 hover:bg-white/10'
                                        }`}
                                    >
                                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                                    </button>
                                    <button className="hidden sm:flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-[24px] font-black text-sm hover:bg-teal-400 hover:text-white transition-all shadow-lg active:scale-95">
                                        খুঁজুন
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Search Results Dropdown */}
                            <AnimatePresence>
                                {(searchQuery.length > 0 || isSearching) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full left-0 right-0 mt-4 p-4 rounded-[32px] bg-slate-900/95 backdrop-blur-2xl border border-white/10 shadow-2xl z-[100] max-h-[400px] overflow-y-auto"
                                    >
                                        {isSearching ? (
                                            <div className="py-12 flex flex-col items-center justify-center text-teal-500">
                                                <Loader2 className="animate-spin mb-4" size={32} />
                                                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">খুঁজছি...</p>
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            <div className="grid gap-2">
                                                {searchResults.map((item, idx) => (
                                                    <Link
                                                        key={item.id || idx}
                                                        href={getResultPath(item)}
                                                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group"
                                                    >
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all group-hover:scale-110 ${
                                                            item.type === 'service' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                                                            item.type === 'union' ? 'bg-teal-500/10 text-teal-500 border-teal-500/20' :
                                                            item.type === 'ward' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                        }`}>
                                                            {item.icon ? <item.icon size={24} /> : <MapPin size={24} />}
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-white font-black text-sm">{item.title || item.name || item.name_bn}</p>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                                                {item.type === 'service' ? (item.subtitle || 'ডিজিটাল সেবা') : 
                                                                 item.type === 'union' ? `${item.upazila_name || ''} উপজেলা` :
                                                                 item.type === 'ward' ? `${item.union_name || ''} ইউনিয়ন` :
                                                                 `${item.ward_name || ''}, ${item.union_name || ''}`}
                                                            </p>
                                                        </div>
                                                        <LucideArrowRight size={16} className="ml-auto text-slate-700 group-hover:text-white transition-colors" />
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-6 text-center">
                                                <SearchX className="mx-auto text-slate-700 mb-2" size={40} />
                                                <p className="text-slate-400 font-bold text-sm">দুঃখিত, আপনার খোঁজা তথ্যটি পাওয়া যায়নি</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.section>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1200px] mx-auto px-4 -mt-12 relative z-20 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Villages Grid with Detailed Stats */}
                        <div className="rounded-[32px] bg-white border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                        <Navigation className="text-teal-600" />
                                        ওয়ার্ডের গ্রাম ও পাড়াসমূহ
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500 font-bold">প্রতিটি গ্রামের বিস্তারিত তথ্য ও ডিজিটাল পোর্টাল</p>
                                </div>
                                <span className="text-[10px] font-black text-white bg-slate-900 px-4 py-2 rounded-full uppercase tracking-wider">
                                    {toBnDigits((ward.villages?.length || 0).toString())} টি গ্রাম
                                </span>
                            </div>

                            <div className="p-6 sm:p-8 space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    {(ward.villages || []).map((v, idx) => {
                                        const isObj = typeof v === 'object';
                                        const vName = isObj ? v.name : v;
                                        const getCount = (val) => Array.isArray(val) ? val.length : parseBnInt(val || '0');
                                        
                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                            >
                                                <div
                                                    onClick={() => isObj && v.id && (window.location.href = paths.villagePortal(union.slug, ward.slug || ward.id, v.slug || v.id))}
                                                    className="block cursor-pointer border border-slate-200/60 rounded-[32px] overflow-hidden group hover:border-teal-400 hover:shadow-2xl hover:shadow-teal-900/5 transition-all duration-300 bg-white"
                                                >
                                                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-white relative overflow-hidden gap-4">
                                                        <div className="flex items-center gap-4 relative z-10">
                                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-teal-200 shrink-0 group-hover:scale-110 transition-transform">
                                                                <MapPin size={24} />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-black text-slate-800 text-xl group-hover:text-teal-700 transition-colors leading-tight">{vName}</h3>
                                                                <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] mt-1">ডিজিটাল গ্রাম পোর্টাল</p>
                                                            </div>
                                                        </div>
                                                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:border-teal-500 transition-all shadow-sm">
                                                            <LucideArrowRight size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="px-6 py-6 border-t border-slate-50 bg-slate-50/30 grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 shadow-sm border border-blue-100/50">
                                                                <Users size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1.5">জনসংখ্যা</p>
                                                                <p className="text-sm font-black text-slate-800 leading-none">{toBnDigits(v.population || '0')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0 shadow-sm border border-teal-100/50">
                                                                <UserCheck size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1.5">ভোটার</p>
                                                                <p className="text-sm font-black text-slate-800 leading-none">{toBnDigits(v.voters || '0')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm border border-indigo-100/50">
                                                                <UserCircle size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1.5">পুরুষ</p>
                                                                <p className="text-sm font-black text-slate-800 leading-none">{toBnDigits(v.maleVoters || '0')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0 shadow-sm border border-violet-100/50">
                                                                <UserCircle size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1.5">মহিলা</p>
                                                                <p className="text-sm font-black text-slate-800 leading-none">{toBnDigits(v.femaleVoters || '0')}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0 shadow-sm border border-orange-100/50">
                                                                <School size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1.5">স্কুল</p>
                                                                <p className="text-sm font-black text-slate-800 leading-none">{toBnDigits(getCount(v.schools).toString())}টি</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-emerald-100/50">
                                                                <Building2 size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1.5">মসজিদ</p>
                                                                <p className="text-sm font-black text-slate-800 leading-none">{toBnDigits(getCount(v.mosques).toString())}টি</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0 shadow-sm border border-sky-100/50">
                                                                <BookOpen size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1.5">মাদ্রাসা</p>
                                                                <p className="text-sm font-black text-slate-800 leading-none">{toBnDigits(getCount(v.madrassas).toString())}টি</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 shadow-sm border border-amber-100/50">
                                                                <Home size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1.5">এতিমখানা</p>
                                                                <p className="text-sm font-black text-slate-800 leading-none">{toBnDigits(getCount(v.orphanages).toString())}টি</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
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

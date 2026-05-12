'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
    MapPin, Home, Sparkles, ArrowUpRight, ArrowRight as LucideArrowRight,
    Users, UserCheck, ShieldCheck, School, GraduationCap, 
    BookOpen, Phone, UserCircle, CheckCircle2, LogIn, ChevronLeft, ChevronRight, Building2, Droplets,
    Activity, BellRing, Navigation, Calendar, 
    Search, Mic, MicOff, Send, Loader2, SearchX, ArrowRight
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { applyLocationSnapshot, openModal } from '@/lib/store/features/locationSlice';
import { SERVICE_CATEGORIES } from '@/lib/constants/serviceCategories';
import { paths } from '@/lib/constants/paths';
import { searchLocations } from '@/lib/services/hierarchyService';
import { layout } from '@/lib/theme';
import UnionNewsSection from './UnionNewsSection';
import { parseBnInt, toBnDigits } from '@/lib/utils/format';
import PortalLoginModal from '@/components/modals/PortalLoginModal';

const DB_SLUG_MAP = {
    'emergency': 'emergency-hotline',
    'blood': 'blood-bank',
    'lost': 'lost-found',
    'school': 'school',
    'fuel': 'fuel',
    'agri-pool': 'agriculture',
    'e-clinic': 'health',
    'islamic': 'mosque',
    'labor': 'labor-directory',
    'news': 'news-updates',
    'donation': 'donation',
    'market': 'village-market',
    'power-watch': 'power-watch',
    'e-up': 'ledger'
};

export default function UnionPortalClient({ ctx, activeServices = [], chairman = null }) {
    const dispatch = useDispatch();
    const router = useRouter();
    const { district, upazila, union } = ctx;
    const { dynamicWardData } = useSelector((state) => state.wardData);
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    // Auth check for this specific union
    const isChairmanOfThisUnion = isAuthenticated && 
        user?.role === 'chairman' && 
        user?.access_scope_id === union.id;

    // Merge static and dynamic ward data
    const mergedWards = useMemo(() => {
        return (union.wards || []).map(ward => {
            const key = `${union.slug}-${ward.id}`;
            const dynamic = dynamicWardData[key];
            
            // Normalize villages to objects if they are strings
            const villagesSource = dynamic?.villages || ward.villages || [];
            const normalizedVillages = villagesSource.map(v => 
                typeof v === 'string' ? { name: v, population: '0', voters: '0' } : v
            );

            // Per-ward stats aggregation
            const stats = normalizedVillages.reduce((acc, v) => {
                const getCount = (val) => Array.isArray(val) ? val.length : parseBnInt(val || '0');
                
                return {
                    population: acc.population + parseBnInt(v.population || '0'),
                    voters: acc.voters + parseBnInt(v.voters || '0'),
                    maleVoters: acc.maleVoters + parseBnInt(v.maleVoters || '0'),
                    femaleVoters: acc.femaleVoters + parseBnInt(v.femaleVoters || '0'),
                    schools: acc.schools + getCount(v.schools),
                    mosques: acc.mosques + getCount(v.mosques),
                    madrassas: acc.madrassas + getCount(v.madrassas),
                };
            }, { 
                population: 0, 
                voters: 0, 
                maleVoters: 0, 
                femaleVoters: 0, 
                schools: 0, 
                mosques: 0, 
                madrassas: 0 
            });

            if (!dynamic) return { ...ward, villages: normalizedVillages, stats, bloodDonorsCount: 0 };
            
            return {
                ...ward,
                member: {
                    ...ward.member,
                    name: dynamic.memberName || ward.member?.name,
                    phone: dynamic.memberPhone || ward.member?.phone,
                },
                villages: normalizedVillages,
                population: toBnDigits(stats.population.toString()),
                voters: toBnDigits(stats.voters.toString()),
                bloodDonorsCount: dynamic.bloodDonors?.length || 0,
                stats, // Included for card display
            };
        });
    }, [union.wards, union.slug, dynamicWardData]);

    // Aggregate all village names for the news section
    const allVillages = mergedWards.reduce((acc, ward) => [
        ...acc, 
        ...(ward.villages || []).map(v => typeof v === 'string' ? v : v.name)
    ], []);

    const WARDS_PER_PAGE = 2;
    const [wardPage, setWardPage] = useState(0);
    const totalWards = mergedWards.length;
    const totalWardPages = Math.ceil(totalWards / WARDS_PER_PAGE);
    const pagedWards = mergedWards.slice(wardPage * WARDS_PER_PAGE, wardPage * WARDS_PER_PAGE + WARDS_PER_PAGE);

    useEffect(() => {
        dispatch(
            applyLocationSnapshot({
                district: district.name,
                districtId: district.id,
                upazila: upazila.name,
                upazilaId: upazila.id,
                union: union.name,
                unionSlug: union.slug,
                village: '',
            })
        );
    }, [dispatch, district.id, district.name, upazila.id, upazila.name, union.name, union.slug]);

    // Aggregate all granular stats for the whole union
    const aggregatedData = useMemo(() => {
        return mergedWards.reduce((acc, w) => {
            return {
                population: acc.population + (w.stats?.population || 0),
                voters: acc.voters + (w.stats?.voters || 0),
                maleVoters: acc.maleVoters + (w.stats?.maleVoters || 0),
                femaleVoters: acc.femaleVoters + (w.stats?.femaleVoters || 0),
                schools: acc.schools + (w.stats?.schools || 0),
                mosques: acc.mosques + (w.stats?.mosques || 0),
                madrassas: acc.madrassas + (w.stats?.madrassas || 0),
                orphanages: acc.orphanages + (w.stats?.orphanages || 0),
                bloodDonors: acc.bloodDonors + (w.bloodDonorsCount || 0),
            };
        }, { population: 0, voters: 0, maleVoters: 0, femaleVoters: 0, schools: 0, mosques: 0, madrassas: 0, orphanages: 0, bloodDonors: 0 });
    }, [mergedWards]);

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

    const allStats = [
        { label: 'মোট ওয়াড', value: toBnDigits(mergedWards.length.toString()), icon: MapPin, color: 'text-teal-600', shadow: 'hover:shadow-teal-500/20', bg: 'bg-teal-50' },
        { label: 'মোট গ্রাম', value: toBnDigits(allVillages.length.toString()), icon: MapPin, color: 'text-sky-600', shadow: 'hover:shadow-sky-500/20', bg: 'bg-sky-50' },
        { label: 'রক্তদাতা', value: toBnDigits(aggregatedData.bloodDonors.toString()), icon: Droplets, color: 'text-rose-600', shadow: 'hover:shadow-rose-500/20', bg: 'bg-rose-50' },
        { label: 'জনসংখ্যা', value: aggregatedData.population > 0 ? toBnDigits(aggregatedData.population.toLocaleString()) : '৪৫,০০০+', icon: Users, color: 'text-blue-600', shadow: 'hover:shadow-blue-500/20', bg: 'bg-blue-50' },
        { label: 'মোট ভোটার', value: aggregatedData.voters > 0 ? toBnDigits(aggregatedData.voters.toLocaleString()) : '২৮,৫০০+', icon: UserCheck, color: 'text-indigo-600', shadow: 'hover:shadow-indigo-500/20', bg: 'bg-indigo-50' },
        { label: 'পুরুষ', value: toBnDigits(aggregatedData.maleVoters.toLocaleString()), icon: UserCircle, color: 'text-blue-500', shadow: 'hover:shadow-blue-500/10', bg: 'bg-blue-50/50' },
        { label: 'মহিলা', value: toBnDigits(aggregatedData.femaleVoters.toLocaleString()), icon: UserCircle, color: 'text-violet-500', shadow: 'hover:shadow-violet-500/10', bg: 'bg-violet-50' },
        { label: 'স্কুল', value: toBnDigits(aggregatedData.schools.toString()), icon: School, color: 'text-orange-600', shadow: 'hover:shadow-orange-500/20', bg: 'bg-orange-50' },
        { label: 'মসজিদ', value: toBnDigits(aggregatedData.mosques.toString()), icon: Building2, color: 'text-emerald-600', shadow: 'hover:shadow-emerald-500/20', bg: 'bg-emerald-50' },
        { label: 'মাদ্রাসা', value: toBnDigits(aggregatedData.madrassas.toString()), icon: BookOpen, color: 'text-sky-600', shadow: 'hover:shadow-sky-500/20', bg: 'bg-sky-50' },
        { label: 'এতিমখানা', value: toBnDigits(aggregatedData.orphanages.toString()), icon: Home, color: 'text-amber-600', shadow: 'hover:shadow-amber-500/20', bg: 'bg-amber-50' },
    ];

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Edge-to-Edge Hero Background Area */}
            <div className="relative pt-4 md:pt-10 pb-12 md:pb-40 px-3 md:px-6 bg-slate-900 border-b border-slate-800 rounded-b-[24px] md:rounded-b-[80px]">
                {/* Background Blobs - Wrapped to prevent overflow */}
                <div className="absolute inset-0 overflow-hidden rounded-b-[24px] md:rounded-b-[80px] pointer-events-none">
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/4" />
                    </div>
                </div>
                
                <div className="max-w-[1200px] mx-auto relative z-10">
                    {/* Upper Navigation */}
                    <div className="flex items-center justify-between gap-3 mb-6">
                        <Link
                            href={paths.home}
                            className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[color:var(--dg-teal)] transition-colors"
                        >
                            <div className="p-2 rounded-xl bg-white border border-slate-200 group-hover:border-teal-200 group-hover:bg-teal-50 transition-all shadow-sm">
                                <Home size={18} />
                            </div>
                            ডিজিটাল গ্রাম হোম
                        </Link>
                        <button
                            type="button"
                            onClick={() => dispatch(openModal())}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-extrabold text-slate-700 hover:border-teal-300 hover:bg-teal-50/80 transition-all shadow-sm active:scale-95"
                        >
                            <MapPin size={16} className="text-teal-600" />
                            ইউনিয়ন বদলান
                        </button>
                    </div>

                    {/* Hero Dashboard Title */}
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
                                        {district.name} · {upazila.name}
                                    </span>
                                </motion.div>
                                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
                                    {union.name} <span className="text-teal-400">ইউনিয়ন</span>
                                </h1>
                                <div className="flex flex-wrap gap-3">
                                    <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur-md border border-white/5 shadow-lg shadow-black/20">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        স্মার্ট পোর্টাল একটিভ
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur-md border border-white/5 shadow-lg shadow-black/20 text-teal-400">
                                        <Sparkles size={14} />
                                        u/{union.slug}
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-2xl bg-teal-500/20 text-teal-100 px-4 py-2 text-xs font-bold border border-teal-500/20 shadow-lg shadow-black/20">
                                        <MapPin size={14} className="text-teal-400" />
                                        {mergedWards.length || 0}টি ওয়াড · {allVillages.length}টি গ্রাম
                                    </div>
                                </div>
                            </div>

                            {/* Quick Action Card inside Hero */}
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="hidden lg:block shrink-0 p-6 rounded-[32px] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 w-72 shadow-2xl relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                                    <Phone size={100} />
                                </div>
                                <p className="text-[10px] font-black uppercase text-teal-300 mb-4 tracking-widest relative z-10 flex items-center gap-2">
                                    <BellRing size={12} />
                                    জরুরি যোগাযোগ
                                </p>
                                <div 
                                    onClick={() => document.getElementById('emergency-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 border border-white/5 mb-2 relative z-10 hover:bg-white/15 transition-colors cursor-pointer active:scale-95"
                                >
                                    <div className="p-3 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-500/30">
                                        <Phone size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-teal-200">জাতীয় হেল্পলাইন</p>
                                        <p className="text-xl font-black tracking-tighter leading-none text-white mt-1">৩৩৩</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Integrated Scaled Vertical Mini-Stats Grid */}
                        <div className="mt-8 md:mt-12 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                            {allStats.map((s, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.03 + 0.4 }}
                                    key={s.label} 
                                    className={`flex flex-col items-center text-center p-2 sm:p-6 rounded-[20px] sm:rounded-[32px] bg-white/[0.08] backdrop-blur-xl border border-white/5 hover:bg-white/[0.15] hover:border-white/15 hover:-translate-y-1 transition-all duration-300 group`}
                                >
                                    <div className={`w-8 h-8 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl ${s.bg} flex items-center justify-center mb-2 sm:mb-4 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                                        <s.icon className={`${s.color} w-[14px] h-[14px] sm:w-[22px] sm:h-[22px]`} />
                                    </div>
                                    <p className="text-[7px] sm:text-[10px] font-black text-white/40 uppercase tracking-[0.05em] sm:tracking-[0.15em] mb-1 leading-tight group-hover:text-teal-400 transition-colors">{s.label}</p>
                                    <p className="text-[10px] sm:text-lg font-black text-white tracking-tight leading-none">{s.value}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Search Bar - Integrated Below Stats */}
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
                                                        <ArrowRight size={16} className="ml-auto text-slate-700 group-hover:text-white transition-colors" />
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
                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
                    {/* Left Column */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* WARD SECTION */}
                        <div className="rounded-[32px] bg-white border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
                                        <ShieldCheck className="text-teal-600" size={20} />
                                        ইউনিয়নের ওয়াডসমূহ
                                    </h2>
                                    <p className="mt-1 text-[10px] sm:text-xs text-slate-500 font-bold">ওয়ার্ডভিত্তিক তথ্য ও সেবা কেন্দ্র</p>
                                </div>
                                <span className="text-[10px] font-black text-white bg-slate-900 px-4 py-2 rounded-full uppercase tracking-wider">
                                    {totalWards} টি ওয়াড
                                </span>
                            </div>

                            <div className="p-6 sm:p-8 space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    {pagedWards.map((ward, idx) => (
                                        <motion.div
                                            key={ward.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <div
                                                onClick={() => router.push(paths.wardPortal(union.slug, ward.slug || ward.id))}
                                                className="block cursor-pointer border border-slate-100 rounded-[24px] overflow-hidden group hover:border-teal-300 hover:shadow-xl transition-all duration-300 bg-white"
                                            >
                                                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-white relative overflow-hidden gap-4">
                                                    <div className="flex items-center gap-3 relative z-10">
                                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-black text-base sm:text-lg shadow-lg shadow-teal-200 shrink-0 group-hover:scale-110 transition-transform">
                                                            {wardPage * WARDS_PER_PAGE + idx + 1}
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                                                            <h3 className="font-black text-slate-800 text-base sm:text-lg group-hover:text-teal-700 transition-colors leading-tight">{ward.name}</h3>
                                                            <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">{ward.villages?.length || 0} টি গ্রাম</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 relative z-10">
                                                        {ward.member && (
                                                            <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-2 shadow-sm group-hover:border-teal-100 transition-colors">
                                                                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100 overflow-hidden shrink-0">
                                                                    {ward.member.avatar_url ? (
                                                                        <img src={ward.member.avatar_url} alt={ward.member.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <UserCircle size={20} className="text-teal-600" />
                                                                    )}
                                                                </div>
                                                                <div className="hidden xs:block">
                                                                    <p className="text-[8px] font-black text-teal-600 uppercase tracking-wider leading-none mb-0.5">মেম্বার</p>
                                                                    <p className="text-xs font-black text-slate-700 leading-none truncate max-w-[80px]">{ward.member.name}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:border-teal-500 transition-all shadow-sm">
                                                            <LucideArrowRight size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="px-4 py-4 sm:px-5 sm:py-5 border-t border-slate-50 bg-slate-50/30 grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-4 sm:gap-x-6">
                                                    {/* Row 1: Demographics */}
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 shadow-sm border border-blue-100/50">
                                                            <Users size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">জনগণ</p>
                                                            <p className="text-[13px] font-black text-slate-800 leading-none">{toBnDigits(ward.stats?.population.toString() || '0')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0 shadow-sm border border-teal-100/50">
                                                            <UserCheck size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">মোট ভোটার</p>
                                                            <p className="text-[13px] font-black text-slate-800 leading-none">{toBnDigits(ward.stats?.voters.toString() || '0')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm border border-indigo-100/50">
                                                            <UserCircle size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">পুরুষ</p>
                                                            <p className="text-[13px] font-black text-slate-800 leading-none">{toBnDigits(ward.stats?.maleVoters.toString() || '0')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0 shadow-sm border border-violet-100/50">
                                                            <UserCircle size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">মহিলা</p>
                                                            <p className="text-[13px] font-black text-slate-800 leading-none">{toBnDigits(ward.stats?.femaleVoters.toString() || '0')}</p>
                                                        </div>
                                                    </div>

                                                    {/* Row 2: Institutions & Social */}
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0 shadow-sm border border-orange-100/50">
                                                            <School size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">স্কুল</p>
                                                            <p className="text-[13px] font-black text-slate-800 leading-none">{toBnDigits(ward.stats?.schools.toString() || '0')}টি</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-emerald-100/50">
                                                            <Building2 size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">মসজিদ</p>
                                                            <p className="text-[13px] font-black text-slate-800 leading-none">{toBnDigits(ward.stats?.mosques.toString() || '0')}টি</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0 shadow-sm border border-sky-100/50">
                                                            <BookOpen size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">মাদ্রাসা</p>
                                                            <p className="text-[13px] font-black text-slate-800 leading-none">{toBnDigits(ward.stats?.madrassas.toString() || '0')}টি</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0 shadow-sm border border-rose-100/50">
                                                            <Droplets size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">রক্তদাতা</p>
                                                            <p className="text-[13px] font-black text-slate-800 leading-none">{toBnDigits(ward.bloodDonorsCount.toString())} জন</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="px-5 pb-5 pt-3 border-t border-slate-50 bg-white group-hover:bg-slate-50/30 transition-colors">
                                                    <div className="flex flex-wrap gap-2">
                                                        {(ward.villages || []).slice(0, 5).map((v) => {
                                                            const isObj = typeof v === 'object';
                                                            const vName = isObj ? v.name : v;
                                                            return (
                                                                <Link
                                                                    key={vName}
                                                                    href={isObj && v.id ? paths.villagePortal(union.slug, ward.slug || ward.id, v.slug || v.id) : '#'}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-500 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600 transition-all"
                                                                >
                                                                    {vName}
                                                                </Link>
                                                            );
                                                        })}
                                                        {ward.villages?.length > 5 && (
                                                            <span className="text-[10px] font-black text-teal-600 pt-1">+{toBnDigits((ward.villages.length - 5).toString())} আরো</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                 {/* Pagination - Pill Design */}
                                {totalWardPages > 1 && (
                                    <div className="flex items-center justify-center gap-3 pt-8 border-t border-slate-100 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setWardPage((p) => Math.max(0, p - 1))}
                                            disabled={wardPage === 0}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-teal-200 hover:bg-teal-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-sm"
                                        >
                                            <ChevronLeft size={14} /> আগের পাতা
                                        </button>
                                        
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">
                                            <Calendar size={12} className="text-teal-400" />
                                            পাতা: {wardPage + 1} / {totalWardPages}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setWardPage((p) => Math.min(totalWardPages - 1, p + 1))}
                                            disabled={wardPage === totalWardPages - 1}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-teal-200 hover:bg-teal-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-sm"
                                        >
                                            পরের পাতা <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Member Login CTA */}
                        <div className="p-6 rounded-[32px] bg-gradient-to-br from-slate-900 to-teal-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500 rounded-full blur-[60px] opacity-20 pointer-events-none" />
                            <div className="relative z-10">
                                <p className="text-xs font-black uppercase tracking-widest text-teal-400 mb-1">অফিসিয়াল পোর্টাল</p>
                                <p className="font-black text-xl mb-1">জনপ্রতিনিধি লগইন</p>
                                <p className="text-slate-400 text-xs font-medium">চেয়ারম্যান বা মেম্বার হিসেবে লগইন করে তথ্য আপডেট করুন।</p>
                            </div>
                            {isChairmanOfThisUnion ? (
                                <Link
                                    href="/chairman/dashboard"
                                    className="relative z-10 shrink-0 flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-black text-sm px-8 py-4 rounded-2xl shadow-lg shadow-teal-900/40 transition-all active:scale-95"
                                >
                                    ড্যাশবোর্ডে যান
                                    <LucideArrowRight size={18} />
                                </Link>
                            ) : (
                                <button
                                    onClick={() => setIsLoginModalOpen(true)}
                                    className="relative z-10 shrink-0 flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-black text-sm px-8 py-4 rounded-2xl shadow-lg shadow-teal-900/40 transition-all active:scale-95"
                                >
                                    পোর্টালে প্রবেশ
                                    <LogIn size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Chairman Profile Card */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-slate-900 to-teal-900" />
                            
                            <div className="relative mt-8 mb-6 mx-auto w-28 h-28 rounded-full p-1 border-4 border-white shadow-xl bg-white">
                                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                    {chairman?.avatar_url ? (
                                        <img src={chairman.avatar_url} alt={chairman.first_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircle size={80} className="text-slate-300" />
                                    )}
                                </div>
                            </div>
                            
                            <h3 className="text-2xl font-black text-slate-800 mb-1 leading-tight">
                                {chairman ? `${chairman.first_name} ${chairman.last_name || ''}` : ctx.union.chairman?.name || 'মোঃ আব্দুর রহমান'}
                            </h3>
                            <p className="text-xs font-bold text-teal-600 bg-teal-50 px-4 py-1.5 rounded-full w-fit mx-auto mb-6 border border-teal-100">সম্মানিত চেয়ারম্যান</p>
                            
                            <div className="space-y-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">সাক্ষাতের সময়</p>
                                    <p className="text-xs font-black text-slate-700">রবি-বৃহঃ ১০টা-৩টা</p>
                                </div>
                            </div>
                            
                            <a href={`tel:${chairman?.phone || ctx.union.chairman?.phone || ''}`} className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-teal-600 text-white font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95">
                                <Phone size={18} />
                                যোগাযোগ করুন
                            </a>
                        </motion.div>

                        {/* Ward Members List */}
                        <div className="rounded-[32px] bg-white border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-teal-600" />
                                    ওয়াড মেম্বারগণ
                                </h4>
                            </div>
                            <div className="p-6 space-y-3">
                                {mergedWards.map((ward) => (
                                    ward.member && (
                                        <div key={ward.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-100 transition-all">
                                            <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100 shrink-0 overflow-hidden">
                                                {ward.member.avatar_url ? (
                                                    <img src={ward.member.avatar_url} alt={ward.member.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserCircle size={20} />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-black text-slate-800 truncate">{ward.member.name}</p>
                                                <p className="text-[10px] font-bold text-teal-600">{ward.name}</p>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                        
                        {/* Digital Process Info */}
                        <div className="p-6 rounded-[32px] bg-slate-900 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-teal-500 rounded-full blur-[60px] opacity-20" />
                            <h4 className="text-sm font-black uppercase tracking-widest text-teal-400 mb-2">ডিজিটাল প্রসেস</h4>
                            <p className="text-xs font-medium text-slate-400 leading-relaxed">ইউনিয়নের প্রতিটি গ্রাম ভিত্তিক সেবা আমরা পর্যায়ক্রমে চালু করছি।</p>
                        </div>
                    </div>
                </div>

                {/* News Section */}
                <div className="mb-20">
                    <UnionNewsSection 
                        unionName={union.name} 
                        unionId={union.id}
                        unionSlug={union.slug}
                        wardIds={mergedWards.map(w => w.id)}
                        villages={allVillages} 
                    />
                </div>

                {/* Services Section */}
                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-teal-600 mb-2">ইউনিয়ন সেবাসমূহ</p>
                            <h2 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight">প্রয়োজনীয় ডিজিটাল সেবা</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {SERVICE_CATEGORIES.map((cat) => {
                            const dbSlug = DB_SLUG_MAP[cat.id] || cat.id;
                            const isActiveFromDB = activeServices.some(s => s.services?.slug === dbSlug);
                            
                            return (
                                <motion.div
                                    key={cat.id}
                                    whileHover={{ y: -5 }}
                                    className="h-full"
                                >
                                    <Link
                                        href={`${paths.service(cat.id === 'market' ? 'market' : cat.id)}?u=${encodeURIComponent(union.slug)}`}
                                        className={`group relative flex h-full flex-col overflow-hidden rounded-[32px] bg-white border ${isActiveFromDB ? 'border-teal-400 shadow-teal-100 shadow-lg' : 'border-slate-200/60'} p-5 sm:p-6 transition-all duration-300`}
                                    >
                                        <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${cat.gradient} opacity-[0.08] blur-2xl group-hover:opacity-[0.15] transition-opacity`} />
                                        
                                        <div className="flex items-start justify-between mb-4 relative z-10">
                                            <div className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.gradient} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                                <cat.icon size={24} />
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                {isActiveFromDB ? (
                                                    <span className="px-2 py-0.5 rounded-full bg-teal-500 text-[8px] font-black uppercase text-white tracking-widest">Active</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[8px] font-black uppercase text-slate-400 tracking-widest">Offline</span>
                                                )}
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${cat.free ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {cat.free ? 'Free' : 'Premium'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-auto relative z-10">
                                            <h3 className="text-base sm:text-lg font-black text-slate-800 leading-tight mb-1">{cat.title}</h3>
                                            <p className="text-xs font-bold text-slate-400 line-clamp-2">{cat.subtitle}</p>
                                            <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-teal-600 group-hover:translate-x-1 transition-transform">
                                                বিস্তারিত দেখুন
                                                <ArrowUpRight size={14} />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <PortalLoginModal 
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                defaultRole="chairman"
                locationName={union.name}
            />
        </div>
    );
}

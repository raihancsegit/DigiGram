'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
    MapPin, Home, Sparkles, Building2, School, BookOpen, Clock, Heart, MoveRight, 
    Newspaper, Phone, Droplets, Users, ArrowLeft, ShieldCheck, UserCircle,
    Store, Sprout, AlertCircle, PhoneCall, Shield, Megaphone, Activity, UserCheck, BellRing, LogIn,
    Search, Mic, MicOff, Send, Loader2, SearchX, ArrowRight
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useRef, useEffect } from 'react';
import { SERVICE_CATEGORIES } from '@/lib/constants/serviceCategories';
import { searchLocations } from '@/lib/services/hierarchyService';
import { layout } from '@/lib/theme';
import { paths } from '@/lib/constants/paths';
import { toBnDigits } from '@/lib/utils/format';
import PortalLoginModal from '@/components/modals/PortalLoginModal';
import WardHouseholdManager from '@/components/sections/ward/WardHouseholdManager';

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

    // Village Stats Grid Logic (Replicating Union portal's "Perfect" design)
    const allStats = [
        { label: 'জনসংখ্যা', value: vPop, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'মোট ভোটার', value: vVoters, icon: UserCheck, color: 'text-teal-400', bg: 'bg-teal-500/10' },
        { label: 'পুরুষ ভোটার', value: isObj && stats.maleVoters ? toBnDigits(stats.maleVoters) : '০', icon: UserCircle, color: 'text-sky-400', bg: 'bg-sky-500/10' },
        { label: 'মহিলা ভোটার', value: isObj && stats.femaleVoters ? toBnDigits(stats.femaleVoters) : '০', icon: UserCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        { label: 'রক্তদাতা', value: toBnDigits(villageBloodDonors.length), icon: Droplets, color: 'text-red-400', bg: 'bg-red-500/10' },
        { label: 'মসজিদ', value: isObj && stats.mosques ? toBnDigits(Array.isArray(stats.mosques) ? stats.mosques.length : stats.mosques) : '০', icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'স্কুল', value: isObj && stats.schools ? toBnDigits(Array.isArray(stats.schools) ? stats.schools.length : stats.schools) : '০', icon: School, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        { label: 'মাদরাসা', value: isObj && stats.madrassas ? toBnDigits(Array.isArray(stats.madrassas) ? stats.madrassas.length : stats.madrassas) : '০', icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    ];

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

    const startVoiceSearch = async () => {
        if (typeof window === 'undefined') return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return alert('আপনার ব্রাউজারে ভয়েস সার্চ সাপোর্ট করে না।');

        if (isListening) {
            recognitionRef.current?.stop();
            return;
        }

        // PWA permission workaround
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
            } catch (err) {
                console.error("Microphone permission error:", err);
                return alert("মাইক্রোফোন ব্যবহারের অনুমতি পাওয়া যায়নি। ডিভাইস বা অ্যাপ সেটিংসে গিয়ে 'Microphone' পারমিশন চালু করুন।");
            }
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
        if (item.type === 'ward') return paths.wardPortal(union.slug, ward.slug || ward.id);
        if (item.type === 'village') return paths.villagePortal(union.slug, ward.slug || ward.id, village.slug || village.id);
        return '#';
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setSearchResults([]);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-slate-50/50 min-h-screen">
            {/* Hero Background with Nature-inspired Gradient */}
            <div className="relative pt-4 md:pt-10 pb-12 md:pb-48 px-3 md:px-6 bg-slate-900 border-b border-emerald-500/20 rounded-b-[32px] md:rounded-b-[80px]">
                {/* Background Blobs - Wrapped to prevent overflow */}
                <div className="absolute inset-0 overflow-hidden rounded-b-[32px] md:rounded-b-[80px] pointer-events-none">
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/4" />
                    </div>
                </div>

                <div className="max-w-[1200px] mx-auto relative z-10">
                    {/* Breadcrumb Navigation */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-10">
                        <div className="flex items-center gap-2">
                            <Link href={paths.home} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-teal-500/10 hover:border-teal-500/30 transition-all backdrop-blur-md shadow-sm">
                                <Home size={18} className="text-white" />
                            </Link>
                            <span className="text-slate-600">/</span>
                            <Link href={paths.unionPortal(union.slug)} className="text-xs font-bold text-slate-400 hover:text-white transition-colors">
                                {union.name}
                            </Link>
                            <span className="text-slate-600">/</span>
                            <Link href={paths.wardPortal(ctx.union.slug, ward.slug || ward.id)} className="text-xs font-bold text-slate-400 hover:text-white transition-colors">
                                {ward.name}
                            </Link>
                            <span className="text-slate-600">/</span>
                            <span className="text-xs font-black text-teal-400">{vName}</span>
                        </div>
                        <button
                            onClick={() => setIsLoginModalOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-white/10 bg-white/5 text-sm font-extrabold text-white hover:bg-white/10 transition-all backdrop-blur-md shadow-sm active:scale-95"
                        >
                            <LogIn size={16} className="text-teal-400" />
                            ভলান্টিয়ার লগইন
                        </button>
                    </div>

                    {/* Hero section Content */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                            <div className="flex-1">
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex flex-wrap items-center gap-2 mb-6"
                                >
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                                        <Sparkles size={12} />
                                        {union.name} ইউনিয়ন · {ward.name}
                                    </span>
                                </motion.div>
                                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-white">
                                    {vName} <span className="text-emerald-400">গ্রাম</span>
                                </h1>
                                <p className="mt-4 text-emerald-100/60 font-bold max-w-xl text-sm md:text-base leading-relaxed">
                                    {union.name} ইউনিয়নের {ward.name} এর অন্তর্গত একটি শান্ত ও সমৃদ্ধ ডিজিটাল গ্রাম। এখানে গ্রামের ঐতিহ্য, কৃষি এবং সেবাসমূহ ডিজিটাল পদ্ধতিতে সংরক্ষিত আছে।
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
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 mb-10">
                            {allStats.map((s, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 + 0.3 }}
                                    key={i} 
                                    className="flex flex-col items-center text-center p-4 rounded-[32px] bg-white/[0.04] backdrop-blur-xl border border-white/5 hover:bg-white/[0.1] hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300 group"
                                >
                                    <div className={`w-12 h-12 rounded-[22px] ${s.bg} flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-lg shadow-black/20`}>
                                        <s.icon className={`${s.color}`} size={20} />
                                    </div>
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1.5 leading-tight group-hover:text-emerald-400 transition-colors">{s.label}</p>
                                    <p className="text-base font-black text-white tracking-tight leading-none">{s.value}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Hero Call-to-Actions (Integrated to fix overlapping) */}
                        <div className="flex flex-wrap items-center gap-4">
                            <Link href="/services" className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-900/40 active:scale-95">
                                <Sparkles size={18} /> সবগুলো সেবা দেখুন
                            </Link>
                            {isMyVillage ? (
                                <Link href="/volunteer/dashboard" className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 text-white border border-white/20 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all backdrop-blur-md shadow-xl active:scale-95">
                                    <ShieldCheck size={18} className="text-emerald-400" /> ড্যাশবোর্ডে যান
                                </Link>
                            ) : (
                                <button 
                                    onClick={() => setIsLoginModalOpen(true)}
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 text-white border border-white/10 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-white/15 transition-all backdrop-blur-md shadow-xl active:scale-95"
                                >
                                    <Users size={18} className="text-amber-400" /> ভলান্টিয়ার লগইন
                                </button>
                            )}
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

            <div className="dg-section-x px-2 md:px-6 relative z-20 -mt-10">
                <div className="max-w-[1200px] mx-auto" style={{ maxWidth: layout.servicesMaxPx }}>
                    
                    {/* Village Features / Context Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                        <div className="flex flex-col items-start gap-4 p-8 rounded-[40px] bg-white border border-emerald-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 transition-all group overflow-hidden relative">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
                            <div className="w-16 h-16 rounded-[22px] bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform relative z-10">
                                <Sprout size={32} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-lg font-black text-slate-800">কৃষি ও সমৃদ্ধি</p>
                                <p className="text-sm text-slate-500 font-bold mt-2 leading-relaxed">উন্নত ধান, তাজা সবজি ও মৎস্য চাষের মাধ্যমে গ্রামের অর্থনৈতিক ভিত্তি মজবুত করা।</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-start gap-4 p-8 rounded-[40px] bg-white border border-amber-100 shadow-sm hover:shadow-2xl hover:shadow-amber-900/5 transition-all group overflow-hidden relative">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
                            <div className="w-16 h-16 rounded-[22px] bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform relative z-10">
                                <Building2 size={32} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-lg font-black text-slate-800">ঐতিহ্য ও সংস্কৃতি</p>
                                <p className="text-sm text-slate-500 font-bold mt-2 leading-relaxed">শতাব্দী প্রাচীন মসজিদ, মঠ ও লোকজ সংস্কৃতির মেলবন্ধনে আমাদের গ্রামের পরিচয়।</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-start gap-4 p-8 rounded-[40px] bg-white border border-sky-100 shadow-sm hover:shadow-2xl hover:shadow-sky-900/5 transition-all group overflow-hidden relative">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-sky-50 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
                            <div className="w-16 h-16 rounded-[22px] bg-sky-50 text-sky-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform relative z-10">
                                <MapPin size={32} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-lg font-black text-slate-800">শান্ত পরিবেশ</p>
                                <p className="text-sm text-slate-500 font-bold mt-2 leading-relaxed">কোলাহলমুক্ত নির্মল বাতাস ও প্রাকৃতিক সৌন্দর্যে ঘেরা এক আদর্শ স্মার্ট গ্রাম।</p>
                            </div>
                        </div>
                    </div>
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

                        {/* Village Households */}
                        <div className="space-y-6">
                            <WardHouseholdManager 
                                wardId={ward.id} 
                                assignedVillage={village}
                                volunteerMode={user?.role === 'volunteer'} 
                            />
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

                        {/* Village Demographics / Charts Placeholder */}
                        <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                        <Activity className="text-teal-600" size={24} />
                                        জনমিতি ও পরিসংখ্যান
                                    </h2>
                                    <p className="text-xs font-bold text-slate-400 mt-1">গ্রামের জনসংখ্যা ও ভোটারের আনুপাতিক চিত্র</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                                            <span>নারী বনাম পুরুষ</span>
                                            <span className="text-teal-600">১০০%</span>
                                        </div>
                                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                                            <div className="h-full bg-emerald-500" style={{ width: '52%' }} />
                                            <div className="h-full bg-rose-400" style={{ width: '48%' }} />
                                        </div>
                                        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
                                            <span>পুরুষ (৫২%)</span>
                                            <span>নারী (৪৮%)</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                                            <span>ভোটার বনাম সাধারণ</span>
                                            <span className="text-teal-600">১০০%</span>
                                        </div>
                                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                                            <div className="h-full bg-indigo-500" style={{ width: '৬৫%' }} />
                                            <div className="h-full bg-slate-200" style={{ width: '৩৫%' }} />
                                        </div>
                                        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
                                            <span>ভোটার (৬৫%)</span>
                                            <span>অপ্রাপ্তবয়স্ক (৩৫%)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-center">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800">স্মার্ট ডাটা ভেরিফাইড</p>
                                            <p className="text-[10px] text-slate-400 font-bold">ভলান্টিয়ার দ্বারা তথ্য যাচাইকৃত</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed italic">&quot;এই গ্রামের তথ্যগুলো নিয়মিত ডিজিটাল ভলান্টিয়ারদের মাধ্যমে আপডেট করা হয়। যেকোনো গরমিল পেলে আমাদের জানান।&quot;</p>
                                </div>
                            </div>
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

                        {/* Public Notice Card */}
                        <div className="p-6 rounded-[32px] bg-white border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
                                <AlertCircle size={24} />
                            </div>
                            <h4 className="text-sm font-black text-slate-800 mb-2">জরুরি ঘোষণা?</h4>
                            <p className="text-[11px] text-slate-400 font-bold leading-relaxed mb-4">আপনার গ্রামের কোনো জরুরি খবর বা ঘোষণা পোর্টালে দিতে চান? মেম্বারের সাথে যোগাযোগ করুন।</p>
                        </div>

                        {/* Back Links to Ward and Union */}
                        <div className="space-y-4">
                            <Link href={paths.wardPortal(ctx.union.slug, ward.slug || ward.id)} className="flex items-center gap-4 p-5 rounded-[24px] bg-teal-50 border border-teal-100 hover:bg-teal-100 hover:border-teal-200 transition-all group">
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

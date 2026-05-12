"use client"
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Send, ArrowRight, Mic, MicOff, ShieldCheck, MapPin, Globe, Home, Loader2, SearchX } from 'lucide-react';
import { FEATURED_FOR_HERO, SERVICE_CATEGORIES } from '@/lib/constants/serviceCategories';
import { paths } from '@/lib/constants/paths';
import { openModal } from '@/lib/store/features/locationSlice';

import { searchLocations } from '@/lib/services/hierarchyService';

export default function HomeHeroSection() {
    const dispatch = useDispatch();
    const { selected } = useSelector((s) => s.location);
    const words = ["ব্লাড ডোনার", "বাজারদর", "জরুরি ডাক্তার", "ইউনিয়ন সেবা", "স্মার্ট স্কুল", "কৃষি তথ্য"];
    const [index, setIndex] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % words.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const searchRef = useRef(null);
    const recognitionRef = useRef(null);

    const floatingCards = FEATURED_FOR_HERO;

    // Search Logic
    useEffect(() => {
        if (!searchQuery || searchQuery.trim().length < 1) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                // 1. Search Locations
                const locationResults = await searchLocations(searchQuery);
                
                // 2. Search Services
                const queryLower = searchQuery.toLowerCase();
                const serviceResults = SERVICE_CATEGORIES.filter(s => 
                    s.title.toLowerCase().includes(queryLower) || 
                    s.subtitle.toLowerCase().includes(queryLower) ||
                    (s.id && s.id.includes(queryLower))
                ).map(s => ({
                    ...s,
                    type: 'service'
                }));

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

    // Voice Search
    const startVoiceSearch = () => {
        if (typeof window === 'undefined') return;

        // Check if HTTPS (SpeechRecognition requires it on mobile)
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            alert("ভয়েস সার্চ শুধুমাত্র সিকিউর (HTTPS) কানেকশনে কাজ করে। অনুগ্রহ করে আপনার সাইটের URL চেক করুন।");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('আপনার ব্রাউজারটি ভয়েস সার্চ সাপোর্ট করে না। অনুগ্রহ করে ক্রোম ব্রাউজার ব্যবহার করুন।');
            return;
        }

        try {
            if (isListening) {
                recognitionRef.current?.stop();
                setIsListening(false);
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.lang = 'bn-BD';
            recognition.interimResults = true;
            recognition.continuous = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setSearchQuery(transcript);
                if (event.results[0].isFinal) {
                    recognition.stop();
                }
            };

            recognition.onerror = (event) => {
                console.error("Voice search error:", event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    alert("মাইক্রোফোন ব্যবহারের অনুমতি পাওয়া যায়নি। ব্রাউজার সেটিংস থেকে অনুমতি দিন।");
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error("Failed to start voice recognition:", err);
            setIsListening(false);
        }
    };

    const getResultPath = (item) => {
        if (item.type === 'service') return `${paths.service(item.id)}?u=${encodeURIComponent(selected.unionSlug || '')}`;
        if (item.type === 'union') return paths.unionPortal(item.slug);
        if (item.type === 'ward') return paths.wardPortal(item.union_slug, item.slug || item.id);
        if (item.type === 'village') return paths.villagePortal(item.union_slug, item.ward_slug, item.slug || item.id);
        return '#';
    };

    // Close results on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchResults([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative pt-12 pb-16 md:pt-32 md:pb-40 px-4 md:px-6 bg-slate-900 border-b border-slate-800 rounded-b-[32px] md:rounded-b-[80px]">
            {/* Premium Animated Background - Wrapped to prevent overflow while allowing search results to stay visible */}
            <div className="absolute inset-0 overflow-hidden rounded-b-[32px] md:rounded-b-[80px] pointer-events-none">
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-500/20 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/4 animate-pulse" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.05),transparent_70%)]" />
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto relative z-10 text-center lg:text-left">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    <div className="flex-[1.2] w-full">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-8"
                        >
                            <span className="px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                                <Sparkles size={14} className="inline mr-1.5" />
                                Digigram Smart App
                            </span>
                            <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[11px] font-black uppercase tracking-widest backdrop-blur-md">
                                <ShieldCheck size={14} className="inline mr-1.5 text-teal-400" />
                                Trust-First Platform
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.1] mb-6"
                        >
                            স্মার্ট পল্লী <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-sky-400 to-rose-400">সুপার-অ্যাপ</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-sm sm:text-lg md:text-xl text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-8"
                        >
                            “সেবা, শিক্ষা ও সমৃদ্ধির ডিজিটাল সেতুবন্ধন।” পুরো উপজেলার গ্লোবাল সেবা এবং আপনার নিজের ইউনিয়নের বিশেষ স্থানীয় সেবা—সবই এখন এক জায়গায়।
                        </motion.p>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-10">
                            {mounted && (
                                <>
                                    {selected.unionSlug ? (
                                        <Link
                                            href={paths.unionPortal(selected.unionSlug)}
                                            className="flex items-center gap-3 px-8 py-5 rounded-[24px] bg-teal-500 hover:bg-teal-400 text-white font-black text-base shadow-xl shadow-teal-500/20 transition-all active:scale-95 group"
                                        >
                                            <Home size={20} className="group-hover:animate-bounce" />
                                            {selected.union} ইউনিয়ন পোর্টাল
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={() => dispatch(openModal())}
                                            className="flex items-center gap-3 px-6 py-4 sm:px-8 sm:py-5 rounded-[20px] sm:rounded-[24px] bg-teal-500 hover:bg-teal-400 text-white font-black text-sm sm:text-base shadow-xl shadow-teal-500/20 transition-all active:scale-95"
                                        >
                                            <MapPin size={18} />
                                            আপনার ইউনিয়ন সিলেক্ট করুন
                                        </button>
                                    )}
                                </>
                            )}
                            <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-4 rounded-[24px] backdrop-blur-xl">
                                <span className="text-slate-400 text-sm font-bold">খুঁজুন:</span>
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={words[index]}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="text-teal-400 font-black text-sm sm:text-lg min-w-[80px] sm:min-w-[100px]"
                                    >
                                        {words[index]}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Search Input Upgraded */}
                        <div className="relative group max-w-3xl mx-auto lg:mx-0 z-50" ref={searchRef}>
                            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-rose-500 rounded-[32px] blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
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
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                                            isListening 
                                            ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-500/20' 
                                            : 'bg-teal-500/10 text-teal-400 border border-teal-500/30 hover:bg-teal-500 hover:text-white'
                                        }`}
                                        title={isListening ? 'শুনছি...' : 'ভয়েস সার্চ'}
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
                                        className="absolute top-full left-0 right-0 mt-4 p-4 rounded-[32px] bg-slate-900/95 backdrop-blur-2xl border border-white/10 shadow-2xl z-[100] max-h-[400px] overflow-y-auto overflow-x-hidden"
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
                        {/* Quick Services Grid for Mobile */}
                        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 lg:hidden">
                            {floatingCards.slice(0, 4).map((card, i) => (
                                <Link
                                    key={card.id}
                                    href={card.href}
                                    className="flex flex-col items-center justify-center p-4 rounded-[24px] bg-white/5 border border-white/5 active:bg-white/10 active:scale-95 transition-all"
                                >
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center mb-3 shadow-lg`}>
                                        <card.icon size={20} />
                                    </div>
                                    <span className="text-[11px] font-black text-white text-center leading-tight">{card.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>


                    <div className="hidden lg:block flex-1 w-full relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-500/20 rounded-full blur-[80px]" />
                            <div className="relative z-10 grid grid-cols-1 gap-6">
                                {floatingCards.slice(0, 4).map((card, i) => (
                                    <Link
                                        key={card.id}
                                        href={card.href}
                                        className="flex items-center gap-5 p-5 rounded-[28px] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                                    >
                                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                            <card.icon size={24} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h4 className="text-white font-black text-base">{card.title}</h4>
                                            <p className="text-slate-400 text-xs font-bold mt-1">{card.subtitle}</p>
                                        </div>
                                        <ArrowRight size={18} className="text-white/20 group-hover:text-white transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

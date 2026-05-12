"use client"
import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { 
    MapPin, Bell, UserCircle, ChevronDown, Clock, BookOpen, 
    Sparkles, LogOut, User, Search, Menu, LayoutDashboard, Settings,
    Globe, ShieldCheck, Zap, Mic, MicOff, SearchX, X, Loader2,
    Droplet, Phone, Store, FileText
} from 'lucide-react';
import { openModal } from '@/lib/store/features/locationSlice';
import { performLogout } from '@/lib/store/features/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { searchLocations } from '@/lib/services/hierarchyService';
import { toBnDigits } from '@/lib/utils/format';
import { HEADER_QUICK_LINKS } from '@/lib/constants/serviceCategories';
import { paths } from '@/lib/constants/paths';
import NewsTicker from '@/components/layout/NewsTicker';
import { SERVICE_CATEGORIES } from '@/lib/constants/serviceCategories';
import NotificationBell from '@/components/ui/NotificationBell';

export default function Header() {
    const pathname = usePathname();
    const showTicker = pathname === '/';
    const dispatch = useDispatch();
    const router = useRouter();
    const { selected } = useSelector((state) => state.location);
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
    const profileWrapRef = useRef(null);
    const searchRef = useRef(null);
    const recognitionRef = useRef(null);

    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            const scrollThreshold = 10;
            if (window.scrollY > scrollThreshold) {
                if (!isScrolled) setIsScrolled(true);
            } else {
                if (isScrolled) setIsScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isScrolled]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const updateMenuPosition = useCallback(() => {
        const el = profileWrapRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setMenuPos({
            top: r.bottom + 12,
            right: Math.max(16, window.innerWidth - r.right),
        });
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour >= 5 && hour < 12) return "শুভ সকাল";
        if (hour >= 12 && hour < 16) return "শুভ দুপুর";
        if (hour >= 16 && hour < 19) return "শুভ সন্ধ্যা";
        return "শুভ রাত্রি";
    };

    useLayoutEffect(() => {
        if (!isProfileOpen) return;
        updateMenuPosition();
        const onWin = () => updateMenuPosition();
        window.addEventListener('resize', onWin);
        window.addEventListener('scroll', onWin, { passive: true });
        return () => {
            window.removeEventListener('resize', onWin);
            window.removeEventListener('scroll', onWin);
        };
    }, [isProfileOpen, updateMenuPosition]);

    useEffect(() => {
        if (!isProfileOpen) return;
        const close = (e) => {
            if (profileWrapRef.current?.contains(e.target)) return;
            const portal = document.getElementById('dg-profile-menu');
            if (portal?.contains(e.target)) return;
            setIsProfileOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [isProfileOpen]);

    const dateStr = currentTime.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' });
    const timeStr = currentTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });

    const handleLogout = async () => {
        await dispatch(performLogout());
        setIsProfileOpen(false);
        router.push('/login');
    };

    useEffect(() => {
        const handleOpenSearch = () => setIsSearchOpen(true);
        window.addEventListener('open-global-search', handleOpenSearch);
        return () => window.removeEventListener('open-global-search', handleOpenSearch);
    }, []);

    // Global Search Logic
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
            if (e.key === '/' && !isSearchOpen && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen]);

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
                
                // 2. Search Services (Local search in constant)
                const queryLower = searchQuery.toLowerCase();
                const serviceResults = SERVICE_CATEGORIES.filter(s => 
                    s.title.toLowerCase().includes(queryLower) || 
                    s.subtitle.toLowerCase().includes(queryLower) ||
                    (s.id && s.id.includes(queryLower))
                ).map(s => ({
                    ...s,
                    type: 'service',
                    name_bn: s.title,
                    meta: s.subtitle
                }));

                const combinedResults = [
                    ...serviceResults.slice(0, 3), // Top 3 services
                    ...locationResults
                ];

                setSearchResults(combinedResults);
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // Voice Search Implementation
    const startVoiceSearch = () => {
        if (typeof window === 'undefined') return;

        // Check if HTTPS (SpeechRecognition requires it on mobile)
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            alert("ভয়েস সার্চ শুধুমাত্র সিকিউর (HTTPS) কানেকশনে কাজ করে। অনুগ্রহ করে আপনার সাইটের URL চেক করুন।");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("আপনার ব্রাউজারে ভয়েস সার্চ সাপোর্ট করে না। অনুগ্রহ করে ক্রোম বা এজ ব্রাউজার ব্যবহার করুন।");
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
            recognition.interimResults = true; // Show results as user speaks
            recognition.continuous = false; // Stop after first sentence for search
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                setIsListening(true);
                // Visual feedback via a toast or status could be added here
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setSearchQuery(transcript);
                
                // If final result, stop listening
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
        if (item.type === 'service') return item.href;
        if (item.type === 'union') return `/u/${item.slug}`;
        if (item.type === 'ward') {
            const unionSlug = item.parent?.slug;
            return unionSlug ? `/u/${unionSlug}/w/${item.id}` : '#';
        }
        if (item.type === 'village') {
            const wardId = item.parent?.id;
            const unionSlug = item.parent?.parent?.slug;
            return (unionSlug && wardId) ? `/u/${unionSlug}/w/${wardId}/v/${item.id}` : '#';
        }
        return '#';
    };

    const getResultMeta = (item) => {
        if (item.type === 'service') return item.meta || 'ডিজিগ্রাম ডিজিটাল সেবা';
        if (item.type === 'union') return 'ইউনিয়ন পোর্টাল';
        if (item.type === 'ward') return `${item.parent?.name_bn || ''} ইউনিয়ন`;
        if (item.type === 'village') return `${item.parent?.parent?.name_bn || ''} ইউনিয়ন · ${item.parent?.name_bn || ''}`;
        return '';
    };

    const profileMenu =
        mounted &&
        createPortal(
            <AnimatePresence>
                {isProfileOpen && (
                    <motion.div
                        key="dg-profile-menu"
                        id="dg-profile-menu"
                        role="menu"
                        initial={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(10px)' }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                        style={{
                            position: 'fixed',
                            top: menuPos.top,
                            right: menuPos.right,
                            zIndex: 9999,
                        }}
                        className="w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-[32px] border border-white/20 bg-slate-900/90 backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]"
                    >
                        <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-br from-white/10 to-transparent">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-400 mb-1.5">অ্যাকাউন্ট প্রোফাইল</p>
                            <p className="text-base font-black text-white truncate">
                                {isAuthenticated && user ? `${user.first_name || ''} ${user.last_name || ''}` : "ভিজিটর ইউজার"}
                            </p>
                        </div>
                        <div className="p-3 space-y-1.5">
                            {isAuthenticated && user ? (
                                <>
                                    {(() => {
                                        const dashLink = user.role === 'super_admin' ? '/admin' : 
                                                       user.role === 'chairman' ? '/chairman/dashboard' : 
                                                       user.role === 'ward_member' ? '/ward-member/dashboard' : 
                                                       user.role === 'volunteer' ? '/volunteer/dashboard' : null;
                                        if (!dashLink) return null;
                                        return (
                                            <Link
                                                href={dashLink}
                                                className="flex items-center gap-3.5 rounded-2xl px-4 py-4 text-sm font-black text-white hover:bg-teal-500 transition-all group"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 group-hover:bg-white group-hover:text-teal-600 transition-all shadow-inner">
                                                    <LayoutDashboard size={20} />
                                                </div>
                                                <div className="flex flex-col leading-tight">
                                                    <span>ড্যাশবোর্ড প্রবেশ</span>
                                                    <span className="text-[10px] font-bold text-teal-400/80 group-hover:text-white/90">ম্যানেজমেন্ট প্যানেল</span>
                                                </div>
                                            </Link>
                                        );
                                    })()}

                                    <Link
                                        href={user.role === 'super_admin' ? '/admin/settings' : 
                                              user.role === 'chairman' ? '/chairman/settings' : 
                                              user.role === 'ward_member' ? '/ward-member/settings' : '/settings'}
                                        className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sm font-black text-slate-300 hover:bg-white/10 hover:text-white transition-all group"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 group-hover:text-white transition-all">
                                            <Settings size={20} />
                                        </div>
                                        প্রোফাইল সেটিংস
                                    </Link>

                                    <div className="h-px bg-white/10 mx-4 my-2" />

                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sm font-black text-rose-400 hover:bg-rose-500 hover:text-white transition-all group"
                                        onClick={handleLogout}
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-white group-hover:text-rose-600 transition-all">
                                            <LogOut size={20} />
                                        </div>
                                        লগআউট
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href={paths.login}
                                    className="flex items-center gap-3.5 rounded-2xl px-4 py-4 text-sm font-black text-white hover:bg-teal-500 transition-all group"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500 text-white shadow-lg shadow-teal-500/20">
                                        <User size={22} />
                                    </div>
                                    লগইন করুন
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body
        );

    return (
        <header className="sticky top-0 z-[200]">
            <div className="py-0 px-0">
                <div className={`mx-auto max-w-[1440px] transition-all duration-500 ease-in-out px-4 sm:px-8 ${
                    isScrolled 
                    ? 'bg-slate-900/95 backdrop-blur-2xl border-b border-white/10 shadow-xl' 
                    : 'bg-white/95 backdrop-blur-md border-b border-slate-100'
                }`}>
                    <nav className="flex w-full items-center justify-between h-16 sm:h-20">
                        
                        {/* Left: Branding & Location */}
                        <div className="flex-1 flex items-center justify-start gap-4 sm:gap-8">
                            <Link href={paths.home} className="flex items-center gap-3 group shrink-0">
                                <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6 ${
                                    isScrolled ? 'bg-teal-500 shadow-[0_0_25px_rgba(20,184,166,0.4)]' : 'bg-slate-900 shadow-xl'
                                }`}>
                                    <Sparkles size={24} className={isScrolled ? 'text-white' : 'text-teal-400'} />
                                </div>
                                <div className="hidden lg:block">
                                    <p className={`text-[9px] font-black uppercase tracking-[0.25em] leading-none mb-1.5 transition-colors ${isScrolled ? 'text-teal-400' : 'text-teal-600'}`}>ডিজিটাল পল্লী</p>
                                    <h1 className={`text-2xl sm:text-3xl font-black leading-none tracking-tight transition-colors ${isScrolled ? 'text-white' : 'text-slate-900'}`}>ডিজিগ্রাম</h1>
                                </div>
                            </Link>

                            <div className={`hidden sm:block w-px h-10 transition-colors ${isScrolled ? 'bg-white/10' : 'bg-slate-200'}`} />

                            {/* Advanced Location Picker - Split Logic */}
                            {mounted && (
                                <div className={`flex items-center rounded-full border transition-all h-9 sm:h-12 overflow-hidden shadow-sm w-fit min-w-[110px] sm:min-w-[180px] ${
                                    isScrolled 
                                    ? 'bg-white/5 border-white/10' 
                                    : 'bg-white border-slate-200'
                                }`}>
                                    {/* Left Part: Navigation Link */}
                                    <Link
                                        href={selected.unionSlug ? `/u/${selected.unionSlug}` : '#'}
                                        onClick={(e) => {
                                            if (!selected.unionSlug) {
                                                e.preventDefault();
                                                dispatch(openModal());
                                            }
                                        }}
                                        className={`flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-5 h-full transition-all hover:bg-slate-50/50 min-w-0 group/loc-text ${
                                            isScrolled ? 'hover:bg-white/5' : ''
                                        }`}
                                    >
                                        <div className={`p-1 sm:p-1.5 rounded-full transition-all shrink-0 ${
                                            isScrolled 
                                            ? 'bg-teal-500/20 text-teal-400 group-hover/loc-text:bg-teal-500 group-hover/loc-text:text-white' 
                                            : 'bg-slate-100 text-slate-500 group-hover/loc-text:bg-teal-500 group-hover/loc-text:text-white'
                                        }`}>
                                            <MapPin size={10} className="sm:w-3.5 sm:h-3.5" />
                                        </div>
                                        <div className="flex flex-col items-start min-w-0 leading-tight">
                                            <span className={`hidden sm:block text-[8px] font-black uppercase tracking-[0.15em] opacity-60 ${isScrolled ? 'text-teal-400' : 'text-slate-500'}`}>
                                                {selected.ward ? `${selected.ward} নং ওয়ার্ড` : 'আপনার অবস্থান'}
                                            </span>
                                            <span className={`text-[10px] sm:text-sm font-black truncate tracking-tight ${isScrolled ? 'text-white' : 'text-slate-900'}`}>
                                                {selected.union || 'নির্বাচন'}
                                            </span>
                                        </div>
                                    </Link>

                                    {/* Right Part: Modal Trigger */}
                                    <button
                                        onClick={() => dispatch(openModal())}
                                        className={`w-7 sm:w-10 h-full border-l flex items-center justify-center transition-all hover:bg-teal-500 hover:text-white group/arrow ${
                                            isScrolled 
                                            ? 'border-white/10 text-teal-400' 
                                            : 'border-slate-100 text-slate-400'
                                        }`}
                                        title="লোকেশন পরিবর্তন করুন"
                                    >
                                        <ChevronDown size={10} className="transition-transform group-hover/arrow:rotate-180" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Middle: Desktop Nav Quick Links */}
                        <div className="flex-1 hidden xl:flex items-center justify-center">
                            <div className={`flex items-center gap-1 p-1 rounded-2xl transition-all duration-500 ${
                                isScrolled ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200/50 shadow-inner'
                            }`}>
                            {HEADER_QUICK_LINKS.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={`flex items-center gap-2.5 px-5 py-2 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                                        isScrolled 
                                        ? 'text-white/70 hover:text-white' 
                                        : 'text-slate-600 hover:text-teal-700'
                                    }`}
                                >
                                    <item.icon size={16} className={`transition-all duration-500 group-hover:scale-125 group-hover:rotate-6 ${isScrolled ? 'text-teal-400' : 'text-teal-600'}`} />
                                    <span className="text-[13px] font-black tracking-tight">{item.title}</span>
                                    {pathname === item.href && (
                                        <motion.div 
                                            layoutId="active-nav"
                                            className={`absolute inset-0 -z-10 rounded-xl ${isScrolled ? 'bg-white/10' : 'bg-white shadow-sm ring-1 ring-slate-200/50'}`}
                                        />
                                    )}
                                </Link>
                            ))}
                            </div>
                        </div>

                        {/* Right: Info & Profile */}
                        <div className="flex-1 flex items-center justify-end gap-3 sm:gap-5">
                            
                            {/* Time & Info (Desktop) */}
                            {mounted && (
                                <div className="hidden lg:flex flex-col text-right leading-tight">
                                    <div className={`flex items-center justify-end gap-1.5 mb-1 ${isScrolled ? 'text-teal-400' : 'text-teal-600'}`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.25em]">{getGreeting()}</span>
                                    </div>
                                    <p className={`text-base font-black tabular-nums tracking-tighter ${isScrolled ? 'text-white' : 'text-slate-800'}`}>{timeStr}</p>
                                </div>
                            )}

                            {/* Search Button */}
                            <button 
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className={`flex w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl transition-all items-center justify-center active:scale-90 group ${
                                    isSearchOpen
                                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                                    : isScrolled 
                                        ? 'bg-white/10 border border-white/10 text-white hover:bg-teal-500' 
                                        : 'bg-white border border-slate-200 text-slate-500 shadow-sm hover:border-teal-400 hover:text-teal-600'
                                }`}
                            >
                                {isSearchOpen ? <X size={18} strokeWidth={2.5} /> : <Search size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />}
                            </button>

                            {/* Profile Wrapper */}
                            <div className="relative" ref={profileWrapRef}>
                                {mounted && (
                                    <button
                                        onClick={() => {
                                            setIsProfileOpen((o) => !o);
                                            requestAnimationFrame(() => updateMenuPosition());
                                        }}
                                        className={`flex items-center gap-3 p-1.5 pl-1.5 pr-4 rounded-2xl transition-all active:scale-95 group/prof ${
                                            isScrolled 
                                            ? 'bg-teal-500 shadow-[0_10px_25px_-5px_rgba(20,184,166,0.5)]' 
                                            : 'bg-slate-900 shadow-xl'
                                        }`}
                                    >
                                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all overflow-hidden border-2 ${
                                            isScrolled 
                                            ? 'bg-white/20 border-white/20 group-hover/prof:border-white' 
                                            : 'bg-white/10 border-white/5 group-hover/prof:border-teal-400'
                                        }`}>
                                            {isAuthenticated && user?.avatar_url ? (
                                                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserCircle size={24} className="text-white" />
                                            )}
                                        </div>
                                        <div className="hidden sm:flex flex-col items-start leading-none">
                                            {isAuthenticated && user && (
                                                <p className="text-[9px] font-black text-white/60 uppercase tracking-tighter mb-1">
                                                    {user.role === 'chairman' ? 'চেয়ারম্যান' : 
                                                     user.role === 'ward_member' ? 'মেম্বার' : 
                                                     user.role === 'super_admin' ? 'এডমিন' : 
                                                     user.role === 'volunteer' ? 'ভলান্টিয়ার' : 'ইউজার'}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-white tracking-tight">
                                                    {isAuthenticated && user ? user.first_name : 'লগইন'}
                                                </span>
                                                <ChevronDown size={12} className={`text-white transition-transform duration-500 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`transition-colors border-b z-[300] relative ${
                            isScrolled ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'
                        }`}
                    >
                        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6">
                            <div className="relative max-w-3xl mx-auto">
                                <div className={`relative flex items-center rounded-3xl transition-all border shadow-sm ${
                                    isScrolled ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                                }`}>
                                    <div className="pl-6 text-teal-500">
                                        <Search size={22} strokeWidth={2.5} />
                                    </div>
                                    <input 
                                        autoFocus
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="ইউনিয়ন, ওয়ার্ড অথবা গ্রামের নাম লিখুন..."
                                        className={`w-full bg-transparent px-4 py-5 outline-none font-black text-lg ${
                                            isScrolled ? 'text-white placeholder-white/30' : 'text-slate-800 placeholder-slate-400'
                                        }`}
                                    />
                                    <div className="flex items-center gap-2 pr-3">
                                        <button 
                                            onClick={startVoiceSearch}
                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                                isListening 
                                                ? 'bg-rose-500 text-white animate-pulse' 
                                                : isScrolled ? 'bg-white/10 text-teal-400 hover:bg-white/20' : 'bg-white text-teal-600 shadow-sm hover:bg-teal-50'
                                            }`}
                                            title={isListening ? 'শুনছি...' : 'ভয়েস সার্চ'}
                                        >
                                            {isListening ? <Mic size={22} className="animate-bounce" /> : <Mic size={22} />}
                                        </button>
                                        {searchQuery && (
                                            <button 
                                                onClick={() => setSearchQuery('')}
                                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                                    isScrolled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-slate-400 shadow-sm hover:bg-slate-50'
                                                }`}
                                            >
                                                <X size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Search Results or Suggestions */}
                                <AnimatePresence>
                                    {(searchQuery.length > 0 || isSearching) ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className={`absolute top-full left-0 right-0 mt-4 p-4 rounded-[32px] border shadow-2xl z-[300] max-h-[60vh] overflow-y-auto ${
                                                isScrolled ? 'bg-slate-900 border-white/10 shadow-black/50' : 'bg-white border-slate-200'
                                            }`}
                                        >
                                            {isSearching ? (
                                                <div className="py-12 flex flex-col items-center justify-center text-teal-500">
                                                    <Loader2 className="animate-spin mb-4" size={32} />
                                                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">খুঁজছি...</p>
                                                </div>
                                            ) : searchResults.length > 0 ? (
                                                <div className="grid gap-2">
                                                    <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-teal-500/60">সার্চ রেজাল্ট</p>
                                                    {searchResults.map((item, idx) => (
                                                        <Link
                                                            key={item.id || idx}
                                                            href={getResultPath(item)}
                                                            onClick={() => {
                                                                setIsSearchOpen(false);
                                                                setSearchQuery('');
                                                            }}
                                                            className={`flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                                                                isScrolled ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all group-hover:scale-110 ${
                                                                item.type === 'service' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                                                                item.type === 'union' ? 'bg-teal-500/10 text-teal-500 border-teal-500/20' :
                                                                item.type === 'ward' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                            }`}>
                                                                {item.icon ? <item.icon size={24} /> : <MapPin size={24} />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className={`text-lg font-black truncate ${isScrolled ? 'text-white' : 'text-slate-800'}`}>
                                                                    {item.name_bn}
                                                                </h4>
                                                                <p className="text-xs font-bold text-slate-500 mt-0.5">
                                                                    {getResultMeta(item)}
                                                                </p>
                                                            </div>
                                                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                                <Zap size={18} className="text-teal-500" />
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                                                    <SearchX size={48} strokeWidth={1} className="mb-4 opacity-20" />
                                                    <p className="text-sm font-bold">দুঃখিত, কোনো ফলাফল পাওয়া যায়নি</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    ) : (
                                        /* Quick Suggestions when empty */
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`absolute top-full left-0 right-0 mt-4 p-6 rounded-[32px] border shadow-2xl z-[300] ${
                                                isScrolled ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
                                            }`}
                                        >
                                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-500 mb-6">জনপ্রিয় অনুসন্ধান</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {[
                                                    { title: 'ব্লাড ব্যাংক', icon: Droplet, href: '/services/blood', color: 'text-rose-500' },
                                                    { title: 'জরুরি নম্বর', icon: Phone, href: '/services/emergency', color: 'text-orange-500' },
                                                    { title: 'ডিজি-বাজার', icon: Store, href: '/services/market', color: 'text-amber-500' },
                                                    { title: 'ই-ইউপি সেবা', icon: FileText, href: '/services/e-up', color: 'text-sky-500' }
                                                ].map((s, i) => (
                                                    <Link 
                                                        key={i}
                                                        href={s.href}
                                                        onClick={() => setIsSearchOpen(false)}
                                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 ${
                                                            isScrolled ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md'
                                                        }`}
                                                    >
                                                        <s.icon className={s.color} size={20} />
                                                        <span className={`text-sm font-black ${isScrolled ? 'text-white' : 'text-slate-700'}`}>{s.title}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                            
                                            <div className="mt-8 flex items-center justify-between px-2">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 border border-slate-200">
                                                        <span className="opacity-70">প্রেশ করুন</span>
                                                        <span className="text-slate-800">/</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400">অথবা</span>
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 border border-slate-200">
                                                        <span className="opacity-70">Ctrl + K</span>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] font-black text-teal-500/60 uppercase tracking-widest italic">ডিজিগ্রাম নেভিগেটর</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showTicker && !isSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <NewsTicker />
                    </motion.div>
                )}
            </AnimatePresence>
            {profileMenu}
        </header>
    );
}

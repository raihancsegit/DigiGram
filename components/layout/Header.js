"use client"
import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { MapPin, Bell, UserCircle, ChevronDown, Clock, BookOpen, Sparkles, LogOut, User, Search, Menu } from 'lucide-react';
import { openModal } from '@/lib/store/features/locationSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { HEADER_QUICK_LINKS } from '@/lib/constants/serviceCategories';
import { paths } from '@/lib/constants/paths';
import NewsTicker from '@/components/layout/NewsTicker';

export default function Header() {
    const pathname = usePathname();
    const showTicker = pathname === '/';
    const dispatch = useDispatch();
    const router = useRouter();
    const { selected } = useSelector((state) => state.location);
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
    const profileWrapRef = useRef(null);

    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const updateMenuPosition = useCallback(() => {
        const el = profileWrapRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setMenuPos({
            top: r.bottom + 10,
            right: Math.max(12, window.innerWidth - r.right),
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
        window.addEventListener('scroll', onWin, true);
        return () => {
            window.removeEventListener('resize', onWin);
            window.removeEventListener('scroll', onWin, true);
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
        document.addEventListener('touchstart', close, { passive: true });
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('touchstart', close);
        };
    }, [isProfileOpen]);

    const dateStr = currentTime.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' });
    const timeStr = currentTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });

    const handleLogout = () => {
        dispatch(logout());
        setIsProfileOpen(false);
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
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        style={{
                            position: 'fixed',
                            top: menuPos.top,
                            right: menuPos.right,
                            zIndex: 9999,
                        }}
                        className="w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_32px_120px_-20px_rgba(15,23,42,0.5)] backdrop-blur-3xl"
                    >
                        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-br from-teal-50/50 to-sky-50/30">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600/80 mb-1">অ্যাকাউন্ট প্রোফাইল</p>
                            <p className="text-sm font-black text-slate-800 truncate">
                                {isAuthenticated ? user.name : "ভিজিটর ইউজার"}
                            </p>
                        </div>
                        <div className="p-2">
                            {isAuthenticated ? (
                                <>
                                    {user.role === 'WARD_MEMBER' && (
                                        <Link
                                            href="/ward-member/dashboard"
                                            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                                <LayoutDashboard size={20} />
                                            </div>
                                            ড্যাশবোর্ড
                                        </Link>
                                    )}
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all"
                                        onClick={handleLogout}
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100/50 text-rose-500">
                                            <LogOut size={20} />
                                        </div>
                                        লগআউট
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href={paths.login}
                                    className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                        <User size={20} />
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
        <header className={`sticky top-0 z-[200] transition-all duration-700 ${
            isScrolled
            ? 'bg-slate-900/98 backdrop-blur-2xl shadow-[0_4px_32px_-8px_rgba(15,23,42,0.45)]'
            : 'bg-white/90 backdrop-blur-xl shadow-[0_2px_20px_-6px_rgba(15,23,42,0.1)]'
        }`}>
            <div className="max-w-[1440px] mx-auto px-1 sm:px-4 md:px-6 py-2 transition-all duration-700">
                <nav className={`relative flex justify-between items-center transition-all duration-700 h-14 sm:h-16 ${
                    isScrolled 
                    ? 'bg-slate-900/95 backdrop-blur-2xl px-4 sm:px-8 rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] border border-white/10' 
                    : 'bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] rounded-[28px] px-4 sm:px-8'}`}>
                    
                    {/* Left: Branding & Location */}
                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                        <Link href={paths.home} className="shrink-0 flex items-center gap-3 group">
                            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-[20px] flex items-center justify-center transition-all duration-500 ${
                                isScrolled 
                                ? 'bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.3)]' 
                                : 'bg-slate-900 shadow-xl'
                            }`}>
                                <Sparkles size={24} className={isScrolled ? 'text-white' : 'text-teal-400'} />
                            </div>
                            <div className="hidden lg:block">
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1 transition-colors ${isScrolled ? 'text-teal-400' : 'text-teal-600'}`}>ডিজিটাল পল্লী</p>
                                <h1 className={`text-2xl font-black leading-none tracking-tight transition-colors ${isScrolled ? 'text-white' : 'text-slate-900'}`}>ডিজিগ্রাম</h1>
                            </div>
                        </Link>

                        <div className={`w-px h-10 transition-colors hidden sm:block ${isScrolled ? 'bg-white/10' : 'bg-slate-200'}`} />

                        {/* High-End Location Widget */}
                        <div className={`flex items-center rounded-xl border transition-all h-10 sm:h-12 overflow-hidden group/location ${
                            isScrolled 
                            ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                            : 'bg-slate-50/50 border-slate-100/80 shadow-inner hover:border-teal-200/50 hover:bg-white'
                        }`}>
                            {selected.unionSlug ? (
                                <button
                                    onClick={() => router.push(paths.unionPortal(selected.unionSlug))}
                                    className="flex items-center gap-3 px-4 sm:px-6 h-full transition-colors min-w-0 md:w-auto"
                                >
                                    <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                                        isScrolled ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-50 text-teal-600'
                                    }`}>
                                        <MapPin size={16} />
                                    </div>
                                    <div className="flex flex-col items-start min-w-0 leading-none">
                                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1 opacity-50 ${isScrolled ? 'text-white' : 'text-slate-500'}`}>
                                            {selected.ward ? selected.ward : 'আপনার ইউনিয়ন'}
                                        </span>
                                        <span className={`text-sm font-black truncate tracking-tight ${isScrolled ? 'text-white' : 'text-slate-900'}`}>
                                            {selected.union}
                                        </span>
                                    </div>
                                </button>
                            ) : (
                                <button
                                    onClick={() => dispatch(openModal())}
                                    className="flex items-center gap-3 px-4 sm:px-6 h-full transition-colors min-w-0"
                                >
                                    <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                                        isScrolled ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-50 text-teal-600'
                                    }`}>
                                        <MapPin size={16} />
                                    </div>
                                    <h3 className={`text-xs sm:text-sm font-black truncate tracking-tight ${isScrolled ? 'text-white' : 'text-slate-800'}`}>অবস্থান নির্বাচন</h3>
                                </button>
                            )}

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    dispatch(openModal());
                                }}
                                className={`px-2.5 sm:px-4 h-full border-l flex items-center justify-center transition-all group/arrow ${
                                    isScrolled 
                                    ? 'bg-white/5 border-white/10 hover:bg-teal-500 text-white' 
                                    : 'bg-slate-100/30 border-slate-100 hover:bg-teal-600 hover:text-white text-slate-400'
                                }`}
                                aria-label="এলাকা পরিবর্তন"
                            >
                                <ChevronDown size={14} className="transition-transform group-hover/arrow:rotate-180" />
                            </button>
                        </div>
                    </div>

                    {/* Middle: Desktop Nav Quick Links */}
                    <div className={`hidden xl:flex items-center gap-0.5 p-0.5 rounded-xl transition-all duration-500 ${
                        isScrolled ? 'bg-white/5 border border-white/10' : 'bg-slate-100/40 border border-slate-100'
                    }`}>
                        {HEADER_QUICK_LINKS.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all duration-300 group ${
                                    isScrolled 
                                    ? 'text-white/60 hover:text-white hover:bg-white/10' 
                                    : 'text-slate-500 hover:text-teal-700 hover:bg-white hover:shadow-sm'
                                }`}
                            >
                                <item.icon size={14} className={`transition-transform duration-500 group-hover:scale-110 ${isScrolled ? 'text-teal-400' : 'text-teal-600/70'}`} />
                                <span className="text-[12px] font-black tracking-tight">{item.title}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Right: Info & Profile */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        
                        {/* Time & Greeting (Desktop) */}
                        <div className="hidden lg:flex flex-col text-right leading-none">
                            <div className={`flex items-center justify-end gap-1 mb-0.5 ${isScrolled ? 'text-teal-400' : 'text-teal-600'}`}>
                                <Sparkles size={10} className="fill-current" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{getGreeting()}</span>
                            </div>
                            <p className={`text-sm font-black tabular-nums tracking-tight ${isScrolled ? 'text-white' : 'text-slate-800'}`}>{timeStr}</p>
                        </div>

                        {/* Search Quick Button */}
                        <button className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center active:scale-95 ${
                            isScrolled 
                            ? 'bg-white/10 border border-white/10 text-white hover:bg-teal-500' 
                            : 'bg-white border border-slate-100 text-slate-400 shadow-sm hover:border-teal-200 hover:text-teal-600'
                        }`}>
                            <Search size={18} strokeWidth={2.5} />
                        </button>

                        {/* Profile Wrapper */}
                        <div className="relative" ref={profileWrapRef}>
                            <button
                                onClick={() => {
                                    setIsProfileOpen((o) => !o);
                                    requestAnimationFrame(() => updateMenuPosition());
                                }}
                                className={`flex items-center gap-2 p-0.5 pl-0.5 pr-2 rounded-xl transition-all active:scale-[0.98] ${
                                    isScrolled 
                                    ? 'bg-teal-500 shadow-lg shadow-teal-500/20' 
                                    : 'bg-slate-900 shadow-lg shadow-slate-900/10'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                    isScrolled ? 'bg-white/20 text-white' : 'bg-white/10 text-teal-400'
                                }`}>
                                    <UserCircle size={22} />
                                </div>
                                <div className="hidden sm:block text-left">
                                    <ChevronDown size={12} className={`text-white transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                        </div>
                    </div>
                </nav>
            </div>
            {showTicker && <NewsTicker />}
            {profileMenu}
        </header>

    );
}

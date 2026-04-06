"use client"
import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { MapPin, Bell, UserCircle, ChevronDown, Clock, BookOpen, Sparkles, LogOut, User, Search, Menu } from 'lucide-react';
import { openModal } from '@/lib/store/features/locationSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { HEADER_QUICK_LINKS } from '@/lib/constants/serviceCategories';
import { paths } from '@/lib/constants/paths';

export default function Header() {
    const dispatch = useDispatch();
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
                                    href="/login"
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
        <header className={`sticky top-0 z-[200] transition-all duration-500 ${isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 py-2 sm:py-3' : 'py-3 sm:py-5 px-3 sm:px-6'}`}>
            <div className={`max-w-[1440px] mx-auto transition-all duration-500 ${isScrolled ? 'px-4 sm:px-8' : ''}`}>
                <nav className={`relative flex justify-between items-center gap-3 transition-all duration-500 ${isScrolled ? '' : 'bg-white/70 backdrop-blur-2xl border border-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] rounded-[32px] px-3 sm:px-6 py-2.5 sm:py-3'}`}>
                    
                    {/* Left: Branding & Location */}
                    <div className="flex items-center gap-3 min-w-0">
                        <Link href={paths.home} className="shrink-0 flex items-center gap-2 group">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-900 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                                <Sparkles size={22} className="text-teal-400" />
                            </div>
                            <div className="hidden lg:block ml-1">
                                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest leading-none mb-0.5">ডিজিটাল পল্লী</p>
                                <h1 className="text-xl font-black text-slate-800 leading-none">ডিজিগ্রাম</h1>
                            </div>
                        </Link>

                        <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block" />

                        {/* Split Location Badge */}
                        <div className="flex items-center rounded-2xl border border-slate-100 bg-white/50 hover:bg-white hover:border-teal-200 transition-all group overflow-hidden shadow-sm">
                            {selected.unionSlug ? (
                                <Link
                                    href={paths.unionPortal(selected.unionSlug)}
                                    className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 transition-colors hover:bg-teal-50/30 min-w-0"
                                >
                                    <div className="p-1.5 rounded-xl bg-teal-50 group-hover:bg-teal-100 transition-colors shrink-0">
                                        <MapPin size={16} className="text-teal-600" />
                                    </div>
                                    <div className="flex flex-col items-start min-w-0">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">
                                            {selected.ward ? selected.ward : 'আপনার ইউনিয়ন'}
                                        </span>
                                        <span className="text-sm font-black text-slate-800 truncate leading-none">
                                            {selected.union}
                                        </span>
                                    </div>
                                </Link>
                            ) : (
                                <button
                                    onClick={() => dispatch(openModal())}
                                    className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 transition-colors min-w-0"
                                >
                                    <div className="p-1.5 rounded-xl bg-teal-50 group-hover:bg-teal-100 transition-colors shrink-0">
                                        <MapPin size={16} className="text-teal-600" />
                                    </div>
                                    <div className="flex flex-col items-start min-w-0 text-left">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">অবস্থান সিলেক্ট করুন</span>
                                        <span className="text-sm font-black text-slate-800 truncate leading-none">সিলেক্ট করুন</span>
                                    </div>
                                </button>
                            )}

                            
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    dispatch(openModal());
                                }}
                                className="h-full px-2 sm:px-3 py-2 sm:py-2.5 border-l border-slate-100 hover:bg-teal-50 text-slate-300 hover:text-teal-600 transition-all flex items-center justify-center"
                                aria-label="এলাকা পরিবর্তন করুন"
                            >
                                <ChevronDown size={14} className="shrink-0" />
                            </button>
                        </div>
                    </div>

                    {/* Middle: Desktop Nav Quick Links */}
                    <div className="hidden xl:flex items-center gap-1 p-1 bg-slate-100/50 rounded-2xl border border-slate-100">
                        {HEADER_QUICK_LINKS.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-white hover:shadow-sm transition-all duration-200 group"
                            >
                                <item.icon size={16} className="text-teal-600/70 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-bold tracking-tight">{item.title}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Right: Info & Profile */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        
                        {/* Time & Greeting (Desktop) */}
                        <div className="hidden md:flex flex-col text-right pr-2">
                            <div className="flex items-center justify-end gap-1.5 text-teal-600">
                                <Sparkles size={12} className="fill-current" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{getGreeting()}</span>
                            </div>
                            <p className="text-[13px] font-black text-slate-800 tabular-nums">{timeStr}</p>
                        </div>

                        {/* Search Quick Button */}
                        <button className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-teal-600 hover:bg-white hover:border-teal-200 transition-all active:scale-95">
                            <Search size={20} strokeWidth={2.5} />
                        </button>

                        {/* Profile Wrapper */}
                        <div className="relative" ref={profileWrapRef}>
                            <button
                                onClick={() => {
                                    setIsProfileOpen((o) => !o);
                                    requestAnimationFrame(() => updateMenuPosition());
                                }}
                                className="flex items-center gap-2 p-1 pl-1 pr-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg hover:shadow-teal-900/20 active:scale-[0.98] transition-all"
                            >
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-teal-400">
                                    <UserCircle size={24} />
                                </div>
                                <div className="hidden sm:block text-left mr-1">
                                    <p className="text-[8px] font-black text-teal-300 uppercase leading-none mb-1">প্রোফাইল</p>
                                    <ChevronDown size={12} className={`text-white transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                        </div>
                    </div>
                </nav>
            </div>
            {profileMenu}
        </header>

    );
}

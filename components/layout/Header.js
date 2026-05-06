"use client"
import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { 
    MapPin, Bell, UserCircle, ChevronDown, Clock, BookOpen, 
    Sparkles, LogOut, User, Search, Menu, LayoutDashboard, Settings,
    Globe, ShieldCheck, Zap
} from 'lucide-react';
import { openModal } from '@/lib/store/features/locationSlice';
import { performLogout } from '@/lib/store/features/authSlice';
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
                    <nav className="flex items-center justify-between h-16 sm:h-20">
                        
                        {/* Left: Branding & Location */}
                        <div className="flex items-center gap-4 sm:gap-8">
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
                                <div className={`flex items-center rounded-full border transition-all h-10 md:h-12 overflow-hidden shadow-sm ${
                                    isScrolled 
                                    ? 'bg-white/5 border-white/10' 
                                    : 'bg-white border-slate-200'
                                }`}>
                                    {/* Left Part: Navigation Link */}
                                    <Link
                                        href={selected.wardId ? `/w/${selected.wardId}` : (selected.unionSlug ? `/u/${selected.unionSlug}` : '#')}
                                        onClick={(e) => {
                                            if (!selected.unionSlug) {
                                                e.preventDefault();
                                                dispatch(openModal());
                                            }
                                        }}
                                        className={`flex items-center gap-2.5 px-4 md:px-5 h-full transition-all hover:bg-slate-50/50 min-w-0 group/loc-text ${
                                            isScrolled ? 'hover:bg-white/5' : ''
                                        }`}
                                    >
                                        <div className={`p-1.5 rounded-full transition-all shrink-0 ${
                                            isScrolled 
                                            ? 'bg-teal-500/20 text-teal-400 group-hover/loc-text:bg-teal-500 group-hover/loc-text:text-white' 
                                            : 'bg-slate-100 text-slate-500 group-hover/loc-text:bg-teal-500 group-hover/loc-text:text-white'
                                        }`}>
                                            <MapPin size={14} />
                                        </div>
                                        <div className="flex flex-col items-start min-w-0 leading-tight">
                                            <span className={`text-[8px] font-black uppercase tracking-[0.15em] opacity-60 ${isScrolled ? 'text-teal-400' : 'text-slate-500'}`}>
                                                {selected.ward ? `${selected.ward} নং ওয়ার্ড` : 'আপনার অবস্থান'}
                                            </span>
                                            <span className={`text-xs md:text-sm font-black truncate tracking-tight ${isScrolled ? 'text-white' : 'text-slate-900'}`}>
                                                {selected.union || 'নির্বাচন করুন'}
                                            </span>
                                        </div>
                                    </Link>

                                    {/* Right Part: Modal Trigger */}
                                    <button
                                        onClick={() => dispatch(openModal())}
                                        className={`w-10 h-full border-l flex items-center justify-center transition-all hover:bg-teal-500 hover:text-white group/arrow ${
                                            isScrolled 
                                            ? 'border-white/10 text-teal-400' 
                                            : 'border-slate-100 text-slate-400'
                                        }`}
                                        title="লোকেশন পরিবর্তন করুন"
                                    >
                                        <ChevronDown size={14} className="transition-transform group-hover/arrow:rotate-180" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Middle: Desktop Nav Quick Links */}
                        <div className={`hidden xl:flex items-center gap-1 p-1 rounded-2xl transition-all duration-500 ${
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

                        {/* Right: Info & Profile */}
                        <div className="flex items-center gap-3 sm:gap-5">
                            
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
                            <button className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl transition-all flex items-center justify-center active:scale-90 group ${
                                isScrolled 
                                ? 'bg-white/10 border border-white/10 text-white hover:bg-teal-500' 
                                : 'bg-white border border-slate-200 text-slate-400 shadow-sm hover:border-teal-400 hover:text-teal-600'
                            }`}>
                                <Search size={20} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
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
                {showTicker && (
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

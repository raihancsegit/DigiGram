"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, MapPin, Search, User, Smartphone } from 'lucide-react';
import { paths } from '@/lib/constants/paths';

const navBtn = "relative p-3 transition-all active:scale-75 rounded-2xl flex flex-col items-center gap-1 group";

export default function BottomNav() {
    const pathname = usePathname();
    const isActive = (p) => {
        if (p === '#search') return false;
        return pathname === p || (p !== '/' && pathname.startsWith(`${p}/`));
    };

    const navItems = [
        { href: paths.home, icon: Home, label: 'হোম' },
        { href: paths.area, icon: MapPin, label: 'এলাকা' },
        { href: '#search', icon: Search, label: 'সার্চ', isSearchTrigger: true },
        { href: paths.citizen, icon: Smartphone, label: 'নাগরিক' },
        { href: paths.login, icon: User, label: 'প্রোফাইল' },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 w-full max-w-md pointer-events-none sm:hidden">
            <motion.nav
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                className="dg-bottom-nav pointer-events-auto px-6 py-2.5 rounded-[35px] flex items-center justify-between shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10"
            >
                {navItems.map((item) => {
                    const active = isActive(item.href) || (item.href === '/services' && pathname.startsWith('/services'));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={(e) => {
                                if (item.isSearchTrigger) {
                                    e.preventDefault();
                                    window.dispatchEvent(new CustomEvent('open-global-search'));
                                }
                            }}
                            aria-current={active ? 'page' : undefined}
                            className={`${navBtn} ${active ? 'text-teal-300' : 'text-slate-400 hover:text-white'}`}
                            aria-label={item.label}
                        >
                            <div className={`relative rounded-2xl p-1 transition-all duration-300 ${active ? 'scale-110 -translate-y-1 bg-teal-500/15' : 'group-hover:scale-110 group-hover:bg-white/10'}`}>
                                <item.icon 
                                    size={24} 
                                    strokeWidth={active ? 2.5 : 2} 
                                    className={active ? 'drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]' : ''} 
                                />
                                {active && (
                                    <motion.div
                                        layoutId="nav-glow"
                                        className="absolute -inset-2 bg-teal-500/20 blur-xl rounded-full -z-10"
                                    />
                                )}
                            </div>
                            <span className={`text-[10px] font-black tracking-tighter transition-all duration-300 ${active ? 'opacity-100' : 'opacity-0 scale-50'}`}>
                                {item.label}
                            </span>
                            {active && (
                                <motion.div
                                    layoutId="nav-dot"
                                    className="absolute -bottom-1 h-1 w-5 rounded-full bg-teal-300"
                                />
                            )}
                        </Link>
                    );
                })}
            </motion.nav>
        </div>
    );
}

"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, MapPin, Search, User } from 'lucide-react';
import { paths } from '@/lib/constants/paths';

const navBtn = "p-1 transition-transform active:scale-95 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--dg-teal-bright)]";

export default function BottomNav() {
    const pathname = usePathname();
    const is = (p) => pathname === p;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-min pointer-events-none">
            <motion.nav
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="dg-bottom-nav pointer-events-auto px-6 sm:px-8 py-3.5 rounded-[40px] flex items-center gap-8 sm:gap-10"
            >
                <Link
                    href={paths.home}
                    className={`${navBtn} ${is(paths.home) ? 'text-[color:var(--dg-teal-bright)]' : 'text-slate-400 hover:text-white'}`}
                    aria-label="হোম"
                >
                    <Home size={26} strokeWidth={is(paths.home) ? 2.5 : 2} />
                </Link>
                <Link
                    href={paths.area}
                    className={`${navBtn} ${is(paths.area) ? 'text-[color:var(--dg-teal-bright)]' : 'text-slate-400 hover:text-white'}`}
                    aria-label="এলাকা"
                >
                    <MapPin size={26} />
                </Link>
                <Link
                    href={paths.service('more')}
                    className={`${navBtn} ${pathname.startsWith('/services') ? 'text-[color:var(--dg-teal-bright)]' : 'text-slate-400 hover:text-white'}`}
                    aria-label="সেবা ও খুঁজুন"
                >
                    <Search size={26} />
                </Link>
                <Link
                    href={paths.login}
                    className={`${navBtn} ${is(paths.login) ? 'text-[color:var(--dg-teal-bright)]' : 'text-slate-400 hover:text-white'}`}
                    aria-label="লগইন"
                >
                    <User size={26} />
                </Link>
            </motion.nav>
        </div>
    );
}

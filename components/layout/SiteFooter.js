"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Activity,
    BellRing,
    Droplet,
    FileText,
    Fuel,
    Globe,
    GraduationCap,
    HelpCircle,
    Mail,
    MapPin,
    Phone,
    School,
    ShieldCheck,
    ShoppingBag,
    Smartphone,
    Store
} from 'lucide-react';
import { SITE_DEVELOPER, SITE_SOCIAL_LINKS } from '@/lib/constants/siteBranding';

const quickLinks = [
    { href: '/', label: 'হোম' },
    { href: '/citizen', label: 'Citizen Center' },
    { href: '/area', label: 'এলাকা' },
    { href: '/news', label: 'নোটিশ' },
    { href: '/business', label: 'ব্যবসা / SMS' },
    { href: '/roadmap', label: 'রোডম্যাপ' },
    { href: '/voice-guide', label: 'Voice Guide' }
];

const citizenLinks = [
    { href: '/citizen', label: 'আবেদন ও SMS inbox', icon: Smartphone },
    { href: '/citizen#complaint', label: 'অভিযোগ জানান', icon: BellRing },
    { href: '/citizen#blood', label: 'Blood emergency', icon: Droplet },
    { href: '/lost-found', label: 'হারানো-প্রাপ্তি claim', icon: HelpCircle }
];

const serviceLinks = [
    { href: '/services/market', label: 'ডিজি-বাজার', icon: Store },
    { href: '/services/blood', label: 'ব্লাড ব্যাংক', icon: Droplet },
    { href: '/services/emergency', label: 'জরুরি নম্বর', icon: Phone },
    { href: '/services/e-up', label: 'ইউপি সেবা', icon: FileText },
    { href: '/services/fuel', label: 'ডিজি-ফুয়েল', icon: Fuel },
    { href: '/services/e-clinic', label: 'ই-ক্লিনিক', icon: Activity },
    { href: '/services/school', label: 'স্কুল / কলেজ', icon: School },
    { href: '/services/learning', label: 'Learning Hub', icon: GraduationCap }
];

const platformLinks = [
    { href: '/business', label: 'SMS business model' },
    { href: '/future-ai', label: 'AI future plan' },
    { href: '/campus', label: 'Campus demo' },
    { href: '/services/vehicle-guard', label: 'Vehicle Guard' },
    { href: '/services/land-guard', label: 'Land Guard' },
    { href: '/services/donation', label: 'স্বচ্ছ দান' }
];

const brandPaths = {
    facebook: 'M13.5 21v-7h2.4l.36-2.8H13.5V9.4c0-.8.22-1.35 1.38-1.35H16.4V5.54c-.26-.03-1.16-.11-2.2-.11-2.18 0-3.67 1.33-3.67 3.78v1.99H8.07V14h2.46v7h2.97Z',
    youtube: 'M21.58 7.19a2.75 2.75 0 0 0-1.94-1.95C17.93 4.78 12 4.78 12 4.78s-5.93 0-7.64.46A2.75 2.75 0 0 0 2.42 7.2C1.96 8.9 1.96 12 1.96 12s0 3.1.46 4.81a2.75 2.75 0 0 0 1.94 1.95c1.71.46 7.64.46 7.64.46s5.93 0 7.64-.46a2.75 2.75 0 0 0 1.94-1.95c.46-1.71.46-4.81.46-4.81s0-3.1-.46-4.81ZM10 15.2V8.8l5.54 3.2L10 15.2Z',
    instagram: 'M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm10.75 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
    linkedin: 'M5.34 3.5A1.84 1.84 0 1 1 5.34 7.18a1.84 1.84 0 0 1 0-3.68ZM3.75 8.75h3.18V20H3.75V8.75Zm5.25 0h3.05v1.54h.04c.42-.8 1.46-1.95 3.01-1.95 3.22 0 3.82 2.12 3.82 4.87V20h-3.18v-5.98c0-1.43-.03-3.27-1.99-3.27-1.99 0-2.3 1.56-2.3 3.17V20H9V8.75Z',
    github: 'M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.6c.85 0 1.7.12 2.5.36 1.9-1.33 2.74-1.05 2.74-1.05.56 1.41.21 2.46.1 2.72.64.72 1.03 1.64 1.03 2.76 0 3.95-2.34 4.82-4.57 5.07.36.32.68.94.68 1.9 0 1.38-.01 2.49-.01 2.83 0 .27.18.59.69.49A10.06 10.06 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z'
};

function BrandIcon({ name, size = 18 }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="currentColor"
        >
            <path d={brandPaths[name]} />
        </svg>
    );
}

export default function SiteFooter() {
    const pathname = usePathname();
    const isActive = (href) => {
        if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.includes('#')) return false;
        return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
    };
    const textLinkClass = (href) => {
        const active = isActive(href);
        return `rounded-xl px-3 py-2 -mx-3 transition-all ${
            active
                ? 'bg-teal-400/15 text-teal-200 ring-1 ring-teal-300/15'
                : 'text-slate-300 hover:bg-white/5 hover:text-teal-200'
        }`;
    };
    const iconLinkClass = (href) => {
        const active = isActive(href);
        return `flex items-center gap-2 rounded-xl px-3 py-2 -mx-3 transition-all ${
            active
                ? 'bg-teal-400/15 text-teal-200 ring-1 ring-teal-300/15'
                : 'text-slate-300 hover:bg-white/5 hover:text-teal-200'
        }`;
    };

    return (
        <footer className="mt-auto border-t border-slate-200 bg-slate-950 text-white">
            <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:px-8 lg:grid-cols-[1.15fr_0.72fr_0.78fr_0.78fr_0.82fr_0.9fr]">
                <div>
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-300 ring-1 ring-teal-300/20">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-300">ডিজিটাল পল্লী</p>
                            <h2 className="text-2xl font-black">ডিজিগ্রাম</h2>
                        </div>
                    </div>
                    <p className="max-w-xl text-sm font-bold leading-7 text-slate-300">
                        ইউনিয়ন, ওয়ার্ড, গ্রাম ও নাগরিক সেবাকে এক জায়গায় আনার জন্য নির্মিত ডিজিটাল প্ল্যাটফর্ম।
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {SITE_SOCIAL_LINKS.map(({ key, label, href }) => {
                            return (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={label}
                                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-teal-300/40 hover:bg-teal-300/10 hover:text-teal-200"
                                >
                                    <BrandIcon name={key} size={18} />
                                </a>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <h3 className="mb-4 text-sm font-black text-white">দ্রুত লিংক</h3>
                    <div className="grid gap-3 text-sm font-bold text-slate-300">
                        {quickLinks.map((item) => (
                            <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={textLinkClass(item.href)}>
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="mb-4 text-sm font-black text-white">নাগরিক কাজ</h3>
                    <div className="grid gap-3 text-sm font-bold text-slate-300">
                        {citizenLinks.map(({ href, label, icon: Icon }) => (
                            <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} className={iconLinkClass(href)}>
                                <Icon size={16} />
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="mb-4 text-sm font-black text-white">প্রয়োজনীয় সেবা</h3>
                    <div className="grid gap-3 text-sm font-bold text-slate-300">
                        {serviceLinks.map(({ href, label, icon: Icon }) => (
                            <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} className={iconLinkClass(href)}>
                                <Icon size={16} />
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="mb-4 text-sm font-black text-white">আরও প্ল্যাটফর্ম</h3>
                    <div className="grid gap-3 text-sm font-bold text-slate-300">
                        {platformLinks.map((item) => (
                            <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={iconLinkClass(item.href)}>
                                <ShoppingBag size={15} />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="mb-4 text-sm font-black text-white">ডেভেলপার</h3>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <p className="text-base font-black text-white">{SITE_DEVELOPER.name}</p>
                        <p className="mt-1 text-sm font-bold text-slate-400">{SITE_DEVELOPER.role}</p>
                        <div className="mt-4 grid gap-2 text-sm font-bold text-slate-300">
                            <a href={SITE_DEVELOPER.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 transition hover:text-teal-300">
                                <Globe size={16} />
                                Website
                            </a>
                            <a href={SITE_DEVELOPER.email} className="flex items-center gap-2 transition hover:text-teal-300">
                                <Mail size={16} />
                                Email
                            </a>
                        </div>
                        <div className="mt-4 flex gap-2">
                            {SITE_DEVELOPER.socialLinks.map(({ key, label, href }) => {
                                return (
                                    <a
                                        key={label}
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label={label}
                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-300 transition hover:bg-teal-300/10 hover:text-teal-200"
                                    >
                                        <BrandIcon name={key} size={16} />
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-white/10">
                <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-5 text-xs font-bold text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <p>© {new Date().getFullYear()} ডিজিগ্রাম। সকল অধিকার সংরক্ষিত।</p>
                    <p className="flex items-center gap-2">
                        <MapPin size={14} />
                        স্থানীয় সেবা, স্বচ্ছ তথ্য, সংযুক্ত নাগরিক
                    </p>
                </div>
            </div>
        </footer>
    );
}

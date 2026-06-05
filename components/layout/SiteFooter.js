"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
    Store,
    Sparkles,
    ArrowRight,
    Heart
} from 'lucide-react';
import { SITE_DEVELOPER, SITE_SOCIAL_LINKS } from '@/lib/constants/siteBranding';
import { subscribeToNewsletter } from '@/lib/actions/subscribeAction';

// Perfectly balanced columns (7, 6, 6, 6 items) for identical, symmetric column heights!
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
    { href: '/lost-found', label: 'হারানো-প্রাপ্তি claim', icon: HelpCircle },
    { href: '/services/e-clinic', label: 'ই-ক্লিনিক', icon: Activity },
    { href: '/services/school', label: 'স্কুল / কলেজ', icon: School }
];

const serviceLinks = [
    { href: '/services/market', label: 'ডিজি-বাজার', icon: Store },
    { href: '/services/blood', label: 'ব্লাড ব্যাংক', icon: Droplet },
    { href: '/services/emergency', label: 'জরুরি নম্বর', icon: Phone },
    { href: '/services/e-up', label: 'ইউপি সেবা', icon: FileText },
    { href: '/services/fuel', label: 'ডিজি-ফুয়েল', icon: Fuel },
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
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState(null); // 'success', 'error', 'warning'
    const [feedbackMessage, setFeedbackMessage] = useState('');

    const isActive = (href) => {
        if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.includes('#')) return false;
        return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
    };

    // Cleaned up link class with no negative margins, ensuring 100% perfect vertical alignment under headings!
    const textLinkClass = (href) => {
        const active = isActive(href);
        return `py-1.5 transition-all duration-300 ${
            active
                ? 'text-teal-300 font-black tracking-wide border-b border-teal-400/40 pb-0.5'
                : 'text-slate-400 hover:text-teal-300 font-bold hover:translate-x-1.5 inline-block'
        }`;
    };

    const iconLinkClass = (href) => {
        const active = isActive(href);
        return `flex items-center gap-2.5 py-1.5 transition-all duration-300 ${
            active
                ? 'text-teal-300 font-black tracking-wide border-b border-teal-400/40 pb-0.5'
                : 'text-slate-400 hover:text-teal-300 font-bold hover:translate-x-1.5'
        }`;
    };

    const handleSubscribe = async (e) => {
        e.preventDefault();
        const trimmedEmail = email.trim();
        if (!trimmedEmail) return;

        setIsSubmitting(true);
        setStatus(null);
        setFeedbackMessage('');

        try {
            const res = await subscribeToNewsletter(trimmedEmail);
            if (res.success) {
                setStatus('success');
                setFeedbackMessage(res.message);
                setEmail('');
                // Reset state after 6 seconds to allow a new subscription
                setTimeout(() => {
                    setStatus(null);
                    setFeedbackMessage('');
                }, 6000);
            } else {
                if (res.errorType === 'duplicate') {
                    setStatus('warning');
                } else {
                    setStatus('error');
                }
                setFeedbackMessage(res.message);
            }
        } catch (error) {
            setStatus('error');
            setFeedbackMessage('একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <footer className="mt-auto border-t border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
            {/* Soft Purple & Teal glowing ambient background auras */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[120px] -translate-y-1/2" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] translate-y-1/2" />
            </div>

            {/* Top Newsletter & Promo Banner */}
            <div className="border-b border-slate-800/60 relative z-10">
                <div className="mx-auto max-w-[1400px] px-6 py-10 sm:px-8 flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10px] font-black uppercase tracking-widest mb-3">
                            <Sparkles size={12} className="animate-pulse" />
                            নাগরিক তথ্য সেবা
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                            ইউনিয়নের সর্বশেষ নোটিশ ও জরুরি আপডেট পান
                        </h3>
                        <p className="text-sm font-bold text-slate-400 mt-2 leading-relaxed">
                            কোনো ফি বা চার্জ ছাড়াই সরাসরি আপনার ফোনে এবং ইমেইলে গুরুত্বপূর্ণ নোটিফিকেশন পৌঁছে দেওয়া হবে।
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full lg:w-auto shrink-0">
                        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-stretch gap-3">
                            <input
                                type="email"
                                placeholder="আপনার ইমেইল এড্রেস..."
                                required
                                disabled={isSubmitting}
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (status) {
                                        setStatus(null);
                                        setFeedbackMessage('');
                                    }
                                }}
                                className={`bg-slate-900/60 border rounded-2xl px-5 py-3.5 text-sm font-bold placeholder-slate-500 focus:outline-none focus:ring-4 transition-all min-w-[280px] ${
                                    status === 'success'
                                        ? 'border-emerald-500/80 focus:ring-emerald-500/10 text-emerald-200'
                                        : status === 'warning'
                                        ? 'border-amber-500/80 focus:ring-amber-500/10 text-amber-200'
                                        : status === 'error'
                                        ? 'border-rose-500/80 focus:ring-rose-500/10 text-rose-200'
                                        : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/10 text-white'
                                }`}
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`inline-flex items-center justify-center gap-2 rounded-2xl active:scale-95 transition-all text-white font-black px-6 py-3.5 text-sm shadow-lg ${
                                    isSubmitting
                                        ? 'bg-teal-600/80 cursor-not-allowed opacity-80'
                                        : status === 'success'
                                        ? 'bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600'
                                        : 'bg-teal-500 shadow-teal-500/20 hover:bg-teal-600'
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        যুক্ত করা হচ্ছে...
                                    </>
                                ) : status === 'success' ? (
                                    'ধন্যবাদ! যুক্ত হয়েছেন'
                                ) : (
                                    'সাবস্ক্রাইব করুন'
                                )}
                                {!isSubmitting && <ArrowRight size={16} />}
                            </button>
                        </form>
                        {feedbackMessage && (
                            <p className={`text-xs font-bold px-1 transition-all duration-300 animate-fadeIn ${
                                status === 'success'
                                    ? 'text-emerald-400'
                                    : status === 'warning'
                                    ? 'text-amber-400'
                                    : 'text-rose-400'
                            }`}>
                                {feedbackMessage}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Links Grid (Optimized column widths and top-aligned columns for perfect vertical spacing!) */}
            <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-16 sm:px-8 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_0.8fr_1fr] items-start relative z-10">

                {/* Brand Column */}
                <div className="flex flex-col justify-start gap-6">
                    <div>
                        <div className="mb-5 flex items-center gap-3.5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-400 ring-1 ring-teal-400/30 shadow-lg shadow-teal-500/5">
                                <ShieldCheck size={26} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-400 leading-none mb-1">স্মার্ট ডিজিটাল ইউপি</p>
                                <h2 className="text-2xl font-black leading-none text-white">ডিজিগ্রাম</h2>
                            </div>
                        </div>
                        <p className="text-sm font-bold leading-7 text-slate-400">
                            ইউনিয়ন, ওয়ার্ড, গ্রাম ও নাগরিক সেবাকে এক ছাদের নিচে এনে স্থানীয় সরকারকে সম্পূর্ণ গতিশীল করার ডিজিটাল রূপকল্প।
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        {SITE_SOCIAL_LINKS.map(({ key, label, href }) => {
                            return (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={label}
                                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400 transition-all duration-300 hover:scale-110 hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-300 hover:shadow-md"
                                >
                                    <BrandIcon name={key} size={18} />
                                </a>
                            );
                        })}
                    </div>
                </div>

                {/* Symmetrically balanced columns with perfectly aligned title lists */}
                <div>
                    <h3 className="mb-5 text-sm font-black text-white uppercase tracking-wider">দ্রুত লিংক</h3>
                    <div className="flex flex-col items-start gap-2.5 text-sm font-bold">
                        {quickLinks.map((item) => (
                            <Link key={item.href} href={item.href} className={textLinkClass(item.href)}>
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="mb-5 text-sm font-black text-white uppercase tracking-wider">নাগরিক কাজ</h3>
                    <div className="flex flex-col items-start gap-2.5 text-sm font-bold">
                        {citizenLinks.map(({ href, label, icon: Icon }) => (
                            <Link key={href} href={href} className={iconLinkClass(href)}>
                                <Icon size={15} />
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="mb-5 text-sm font-black text-white uppercase tracking-wider">প্রয়োজনীয় সেবা</h3>
                    <div className="flex flex-col items-start gap-2.5 text-sm font-bold">
                        {serviceLinks.map(({ href, label, icon: Icon }) => (
                            <Link key={href} href={href} className={iconLinkClass(href)}>
                                <Icon size={15} />
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="mb-5 text-sm font-black text-white uppercase tracking-wider">আরও প্ল্যাটফর্ম</h3>
                    <div className="flex flex-col items-start gap-2.5 text-sm font-bold">
                        {platformLinks.map((item) => (
                            <Link key={item.href} href={item.href} className={iconLinkClass(item.href)}>
                                <ShoppingBag size={14} />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Developer Profile Card */}
                <div>
                    <h3 className="mb-5 text-sm font-black text-white uppercase tracking-wider">সিস্টেম ইঞ্জিনিয়ার</h3>
                    <div className="rounded-[28px] border border-slate-800/80 bg-slate-900/30 p-5 backdrop-blur-sm shadow-xl shadow-slate-950/20 hover:border-teal-500/20 transition-all duration-300 group">
                        <p className="text-base font-black text-white group-hover:text-teal-300 transition-colors">{SITE_DEVELOPER.name}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">{SITE_DEVELOPER.role}</p>
                        <div className="mt-5 flex flex-col gap-3 text-sm font-bold text-slate-400">
                            <a href={SITE_DEVELOPER.website} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 hover:text-teal-300 transition-colors">
                                <Globe size={15} className="text-slate-500" />
                                Website
                            </a>
                            <a href={`mailto:${SITE_DEVELOPER.email}`} className="flex items-center gap-2.5 hover:text-teal-300 transition-colors">
                                <Mail size={15} className="text-slate-500" />
                                Email
                            </a>
                        </div>
                        <div className="mt-5 flex gap-2 pt-4 border-t border-slate-800/60">
                            {SITE_DEVELOPER.socialLinks.map(({ key, label, href }) => {
                                return (
                                    <a
                                        key={label}
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label={label}
                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 transition-all hover:scale-110 hover:border-teal-500/20 hover:bg-teal-500/10 hover:text-teal-300"
                                    >
                                        <BrandIcon name={key} size={15} />
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Copyright Area */}
            <div className="border-t border-slate-900 bg-slate-950/60 py-6 relative z-10">
                <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-6 text-xs font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <p className="flex items-center gap-1.5">
                        © {new Date().getFullYear()} ডিজিগ্রাম। মেড উইথ
                        <Heart size={12} className="text-rose-500 fill-rose-500 animate-pulse" />
                        ইন বাংলাদেশ।
                    </p>
                    <p className="flex items-center gap-2">
                        <MapPin size={14} className="text-teal-500/60" />
                        স্থায়ী শাসন · অবাধ जवाबদিহিতা · সংযুক্ত নাগরিক
                    </p>
                </div>
            </div>
        </footer>
    );
}

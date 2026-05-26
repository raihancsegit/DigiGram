"use client";

import Link from 'next/link';
import {
    BellRing,
    Droplet,
    FileText,
    GraduationCap,
    HelpCircle,
    MapPin,
    PhoneCall,
    ShieldAlert,
    ShoppingBag,
    Smartphone,
    Store
} from 'lucide-react';

const SERVICE_LINKS = [
    {
        key: 'citizen',
        href: '/citizen',
        title: 'Citizen Center',
        text: 'আবেদন, complaint, blood request ও SMS inbox',
        icon: Smartphone,
        tone: 'teal'
    },
    {
        key: 'market',
        href: '/services/market',
        title: 'বাজার দর',
        text: 'হাটের দাম, demand ও price alert',
        icon: ShoppingBag,
        tone: 'amber'
    },
    {
        key: 'lost-found',
        href: '/lost-found',
        title: 'হারানো-প্রাপ্তি',
        text: 'Report, claim ও verified return',
        icon: HelpCircle,
        tone: 'indigo'
    },
    {
        key: 'blood',
        href: '/services/blood',
        title: 'ব্লাড ব্যাংক',
        text: 'ডোনার খুঁজুন বা জরুরি request দিন',
        icon: Droplet,
        tone: 'rose'
    },
    {
        key: 'emergency',
        href: '/services/emergency',
        title: 'জরুরি নম্বর',
        text: 'ইউনিয়ন, স্বাস্থ্য ও নিরাপত্তা contact',
        icon: PhoneCall,
        tone: 'sky'
    },
    {
        key: 'school',
        href: '/services/school',
        title: 'স্কুল / কলেজ',
        text: 'প্রতিষ্ঠান website, portal ও guardian update',
        icon: GraduationCap,
        tone: 'emerald'
    },
    {
        key: 'e-up',
        href: '/services/e-up',
        title: 'ইউপি সেবা',
        text: 'সনদ, আবেদন ও collection tracking',
        icon: FileText,
        tone: 'slate'
    },
    {
        key: 'area',
        href: '/area',
        title: 'এলাকা খুঁজুন',
        text: 'ইউনিয়ন, ওয়ার্ড, গ্রাম ও local portal',
        icon: MapPin,
        tone: 'cyan'
    },
    {
        key: 'business',
        href: '/business',
        title: 'SMS Business',
        text: 'SMS package, recharge ও service alert',
        icon: BellRing,
        tone: 'violet'
    },
    {
        key: 'vehicle-guard',
        href: '/services/vehicle-guard',
        title: 'Vehicle Guard',
        text: 'যানবাহন নিরাপত্তা ও verification',
        icon: ShieldAlert,
        tone: 'orange'
    },
    {
        key: 'shop',
        href: '/market-manager',
        title: 'বাজার ম্যানেজার',
        text: 'দোকান/হাটের price update portal',
        icon: Store,
        tone: 'green'
    }
];

const TONE_CLASSES = {
    amber: 'bg-amber-50 text-amber-700 border-amber-100 group-hover:border-amber-300 group-hover:bg-amber-100/70',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100 group-hover:border-cyan-300 group-hover:bg-cyan-100/70',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:border-emerald-300 group-hover:bg-emerald-100/70',
    green: 'bg-green-50 text-green-700 border-green-100 group-hover:border-green-300 group-hover:bg-green-100/70',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100 group-hover:border-indigo-300 group-hover:bg-indigo-100/70',
    orange: 'bg-orange-50 text-orange-700 border-orange-100 group-hover:border-orange-300 group-hover:bg-orange-100/70',
    rose: 'bg-rose-50 text-rose-700 border-rose-100 group-hover:border-rose-300 group-hover:bg-rose-100/70',
    sky: 'bg-sky-50 text-sky-700 border-sky-100 group-hover:border-sky-300 group-hover:bg-sky-100/70',
    slate: 'bg-slate-50 text-slate-700 border-slate-100 group-hover:border-slate-300 group-hover:bg-slate-100/70',
    teal: 'bg-teal-50 text-teal-700 border-teal-100 group-hover:border-teal-300 group-hover:bg-teal-100/70',
    violet: 'bg-violet-50 text-violet-700 border-violet-100 group-hover:border-violet-300 group-hover:bg-violet-100/70'
};

const PRESETS = {
    citizen: ['market', 'lost-found', 'blood', 'e-up', 'emergency', 'area'],
    market: ['citizen', 'lost-found', 'shop', 'business', 'area', 'emergency'],
    lostFound: ['citizen', 'market', 'emergency', 'blood', 'area', 'business'],
    service: ['citizen', 'market', 'lost-found', 'blood', 'school', 'business'],
    home: ['citizen', 'market', 'lost-found', 'blood', 'school', 'e-up']
};

export default function RelatedServiceLinks({
    currentKey = '',
    preset = 'service',
    title = 'আরও দরকারি কাজ',
    subtitle = 'এই page থেকে related service-গুলোতে দ্রুত যান।',
    limit = 6,
    className = ''
}) {
    const selectedKeys = PRESETS[preset] || PRESETS.service;
    const links = selectedKeys
        .map((key) => SERVICE_LINKS.find((item) => item.key === key))
        .filter(Boolean)
        .filter((item) => item.key !== currentKey)
        .slice(0, limit);

    if (!links.length) return null;

    return (
        <section className={`rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 ${className}`}>
            <div className="mb-4 flex flex-col gap-1 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-600">Quick Access</p>
                    <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">{title}</h2>
                </div>
                <p className="max-w-md text-xs font-bold leading-relaxed text-slate-500 sm:text-right">{subtitle}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {links.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className="group flex min-h-[112px] items-start gap-3 rounded-[24px] border border-slate-100 bg-slate-50/70 p-4 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-slate-200/70"
                        >
                            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all ${TONE_CLASSES[item.tone] || TONE_CLASSES.teal}`}>
                                <Icon size={22} />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-base font-black text-slate-900">{item.title}</span>
                                <span className="mt-1 block text-xs font-bold leading-relaxed text-slate-500">{item.text}</span>
                            </span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

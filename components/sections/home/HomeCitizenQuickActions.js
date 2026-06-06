"use client";

import Link from 'next/link';
import {
    BellRing,
    BriefcaseBusiness,
    CalendarCheck,
    ClipboardCheck,
    Droplets,
    FileSearch,
    HeartPulse,
    HelpCircle,
    IdCard,
    MessageSquareWarning,
    ShoppingBag,
    Smartphone,
    WalletCards
} from 'lucide-react';

const ACTIONS = [
    {
        title: 'আমার কাজ কোথায়?',
        text: 'আবেদন, সনদ, complaint ও SMS update এক inbox-এ দেখুন।',
        href: '/citizen',
        icon: FileSearch,
        color: 'bg-teal-50 text-teal-700 border-teal-100'
    },
    {
        title: 'অভিযোগ জানান',
        text: 'রাস্তা, পানি, লাইট বা ইউনিয়ন সেবার সমস্যা সরাসরি পাঠান।',
        href: '/citizen#complaint',
        icon: MessageSquareWarning,
        color: 'bg-rose-50 text-rose-700 border-rose-100'
    },
    {
        title: 'রক্ত জরুরি',
        text: 'Blood group, রোগী ও হাসপাতাল দিয়ে দ্রুত help request দিন।',
        href: '/citizen#blood',
        icon: Droplets,
        color: 'bg-red-50 text-red-700 border-red-100'
    },
    {
        title: 'বাজার দর',
        text: 'হাট-বাজারের দর, price alert ও কিনতে/বিক্রি করতে চাই পোস্ট।',
        href: '/services/market',
        icon: ShoppingBag,
        color: 'bg-amber-50 text-amber-700 border-amber-100'
    },
    {
        title: 'হারানো-প্রাপ্তি',
        text: 'OTP verified report, claim ও office approval সহ নিরাপদ system।',
        href: '/lost-found',
        icon: HelpCircle,
        color: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    },
    {
        title: 'Tax ও fee payment',
        text: 'OTP দিয়ে বকেয়া দেখুন, payment reference দিন এবং receipt status অনুসরণ করুন।',
        href: '/pay',
        icon: WalletCards,
        color: 'bg-cyan-50 text-cyan-700 border-cyan-100'
    },
    {
        title: 'অফিস serial',
        text: 'চেয়ারম্যান/সচিব/মেম্বারের কাছে যাওয়ার আগে appointment ticket পাঠান।',
        href: '/citizen#appointment',
        icon: CalendarCheck,
        color: 'bg-violet-50 text-violet-700 border-violet-100'
    },
    {
        title: 'Household status',
        text: 'পরিবারের NID, জন্ম নিবন্ধন, voter, blood ও tax status এক জায়গায়।',
        href: '/citizen',
        icon: IdCard,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    {
        title: 'Health follow-up',
        text: 'টিকা, checkup, blood group ও নারী/শিশু স্বাস্থ্য camp update।',
        href: '/services/e-clinic',
        icon: HeartPulse,
        color: 'bg-pink-50 text-pink-700 border-pink-100'
    },
    {
        title: 'Local business',
        text: 'দোকান, service provider, market demand ও SMS alert business route।',
        href: '/services/market',
        icon: BriefcaseBusiness,
        color: 'bg-lime-50 text-lime-700 border-lime-100'
    }
];

export default function HomeCitizenQuickActions() {
    return (
        <section className="relative z-10 -mt-8 px-3 pb-10 md:-mt-14 md:px-6 md:pb-16">
            <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 md:rounded-[40px]">
                <div className="grid gap-5 border-b border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-5 text-white md:grid-cols-[1fr_auto] md:p-7">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-teal-200 ring-1 ring-white/10">
                            <Smartphone size={14} /> Citizen One Tap
                        </p>
                        <h2 className="mt-3 text-2xl font-black tracking-tight md:text-4xl">
                            মানুষের দরকারি কাজ আগে, কম ক্লিকে
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm font-bold leading-relaxed text-slate-300 md:text-base">
                            অফিসে বারবার না গিয়ে status দেখা, অভিযোগ পাঠানো, blood help, বাজার দর, হারানো-প্রাপ্তি ও SMS reminder এক জায়গা থেকে।
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:w-[380px]">
                        <MiniStat icon={ClipboardCheck} value="Track" label="status" />
                        <MiniStat icon={BellRing} value="SMS" label="update" />
                        <MiniStat icon={WalletCards} value="OTP" label="secure" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-6">
                    {ACTIONS.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link
                                key={action.title}
                                href={action.href}
                                className="group flex min-h-[132px] gap-4 rounded-[24px] border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-1 hover:border-teal-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/70"
                            >
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${action.color}`}>
                                    <Icon size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black leading-snug text-slate-900">{action.title}</h3>
                                    <p className="mt-2 text-sm font-bold leading-relaxed text-slate-500">{action.text}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between lg:p-6">
                    <p className="text-sm font-bold text-slate-500">
                        OTP দিয়ে citizen inbox খুললেই application, complaint, blood request, household ও reminder update দেখা যাবে।
                    </p>
                    <Link
                        href="/citizen"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-teal-500/20 transition hover:bg-teal-600"
                    >
                        <WalletCards size={18} />
                        Citizen Center
                    </Link>
                </div>
            </div>
        </section>
    );
}

function MiniStat({ icon: Icon, value, label }) {
    return (
        <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <Icon size={18} className="text-teal-200" />
            <p className="mt-3 text-lg font-black">{value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        </div>
    );
}

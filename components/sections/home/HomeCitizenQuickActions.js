"use client";

import Link from 'next/link';
import {
    BellRing,
    CalendarCheck,
    ClipboardCheck,
    Droplets,
    FileSearch,
    GraduationCap,
    HeartPulse,
    Home,
    IdCard,
    MessageSquareWarning,
    School,
    ShoppingBag,
    WalletCards
} from 'lucide-react';

const PRIMARY_ACTIONS = [
    {
        title: 'পরিবার / Home Profile',
        text: 'বাড়ি ধরে পরিবারের সদস্য, NID, জন্ম নিবন্ধন, ভোটার, রক্ত, স্কুল status এক জায়গায় থাকবে।',
        href: '/citizen',
        icon: Home,
        tone: 'border-emerald-100 bg-emerald-50 text-emerald-700'
    },
    {
        title: 'আবেদন করুন',
        text: 'সনদ, অভিযোগ, appointment, blood help বা ইউনিয়ন সেবা সহজ ফর্মে পাঠান।',
        href: '/citizen#apply',
        icon: ClipboardCheck,
        tone: 'border-sky-100 bg-sky-50 text-sky-700'
    },
    {
        title: 'পড়াশোনা Track',
        text: 'School, college, madrasha, kindergarten website-এর সাথে result, homework, attendance দেখুন।',
        href: '/services/school',
        icon: School,
        tone: 'border-violet-100 bg-violet-50 text-violet-700'
    },
    {
        title: 'Status দেখুন',
        text: 'আবেদন, payment, complaint, admission বা family update কোথায় আছে দ্রুত দেখুন।',
        href: '/track',
        icon: FileSearch,
        tone: 'border-amber-100 bg-amber-50 text-amber-700'
    }
];

const SECONDARY_ACTIONS = [
    { title: 'অভিযোগ', href: '/citizen#complaint', icon: MessageSquareWarning },
    { title: 'রক্ত জরুরি', href: '/citizen#blood', icon: Droplets },
    { title: 'বাজার দর', href: '/services/market', icon: ShoppingBag },
    { title: 'Tax / Fee', href: '/pay', icon: WalletCards },
    { title: 'Office serial', href: '/citizen#appointment', icon: CalendarCheck },
    { title: 'Health follow-up', href: '/services/e-clinic', icon: HeartPulse }
];

export default function HomeCitizenQuickActions() {
    return (
        <section className="relative z-10 bg-slate-50 px-3 py-8 sm:px-6 md:py-12">
            <div className="mx-auto max-w-7xl">
                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr] lg:items-end">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-700 ring-1 ring-slate-200">
                            <BellRing size={14} /> ইউনিয়ন থেকে ঘর পর্যন্ত
                        </p>
                        <h2 className="mt-4 max-w-xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                            আগে মানুষের দরকারি কাজ, তারপর বাকি সব
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-slate-500 sm:text-base">
                            Union, ward, gram, home আর education portal একই data থেকে চলবে। মানুষ যেন কম click-এ আবেদন, status, family update ও পড়াশোনার progress পায়।
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <MiniStat icon={Home} value="Home" label="wise data" />
                        <MiniStat icon={ClipboardCheck} value="Apply" label="easy forms" />
                        <MiniStat icon={GraduationCap} value="Edu" label="progress" />
                    </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {PRIMARY_ACTIONS.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link
                                key={action.title}
                                href={action.href}
                                className="group flex min-h-[190px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-200/70"
                            >
                                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${action.tone}`}>
                                    <Icon size={26} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black leading-snug text-slate-950">{action.title}</h3>
                                    <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{action.text}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                    {SECONDARY_ACTIONS.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link
                                key={action.title}
                                href={action.href}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:border-teal-200 hover:text-teal-700"
                            >
                                <Icon size={15} />
                                {action.title}
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-6 rounded-2xl border border-teal-100 bg-white p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                            <IdCard size={22} />
                        </div>
                        <p className="text-sm font-bold leading-6 text-slate-600">
                            Family member school-e ভর্তি হলে home profile-e mark থাকবে, আর school portal সেই তথ্য দিয়ে student progress চালাবে।
                        </p>
                    </div>
                    <Link
                        href="/citizen"
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-teal-600 sm:mt-0 sm:w-auto"
                    >
                        Citizen Center
                    </Link>
                </div>
            </div>
        </section>
    );
}

function MiniStat({ icon: Icon, value, label }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <Icon size={18} className="text-teal-600" />
            <p className="mt-3 text-lg font-black text-slate-950">{value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        </div>
    );
}

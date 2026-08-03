'use client';

import { useEffect, useState } from 'react';
import { Building2, Home, MapPinned, Users } from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

const ITEMS = [
    { key: 'unions', label: 'ইউনিয়ন', hint: 'সেবা পরিচালনা কেন্দ্র', icon: Building2, tone: 'bg-teal-50 text-teal-700' },
    { key: 'villages', label: 'গ্রাম', hint: 'ডিজিটাল গ্রামের তথ্য', icon: MapPinned, tone: 'bg-sky-50 text-sky-700' },
    { key: 'households', fallback: 'homes', label: 'নিবন্ধিত বাড়ি', hint: 'পরিবার ও সেবার ঠিকানা', icon: Home, tone: 'bg-amber-50 text-amber-700' },
    { key: 'population', label: 'নাগরিক', hint: 'হালনাগাদ জনতথ্য', icon: Users, tone: 'bg-violet-50 text-violet-700' }
];

const bn = (value) => new Intl.NumberFormat('bn-BD').format(Number(value) || 0);

export default function HomeImpactSection() {
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([adminService.getGlobalStats(), adminService.getGlobalLocationStats()])
            .then(([globalStats, locationStats]) => setSummary({ ...globalStats, ...locationStats }))
            .catch((error) => console.error('Home summary load failed:', error))
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="dg-section-x py-10 md:py-16">
            <div className="mx-auto max-w-6xl px-4">
                <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                    <div className="grid gap-6 bg-slate-950 px-6 py-8 text-white md:grid-cols-[1fr_auto] md:items-center md:px-10">
                        <div>
                            <p className="text-xs font-black tracking-[.24em] text-teal-300">একটি বাড়ি, সব নাগরিক সেবা</p>
                            <h2 className="mt-3 text-2xl font-black sm:text-3xl">গ্রামের তথ্য থেকেই সহজ আবেদন</h2>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">বাড়ির সদস্য বাছাই করুন, আবেদন জমা দিন। আবেদন নিজে থেকেই সংশ্লিষ্ট ইউনিয়নে যাবে এবং মোবাইলে অগ্রগতির খবর আসবে।</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 px-5 py-4 text-sm font-bold ring-1 ring-white/15">গ্রাম → ওয়ার্ড → ইউনিয়ন</div>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-slate-200 lg:grid-cols-4">
                        {ITEMS.map(({ key, fallback, label, hint, icon: Icon, tone }) => (
                            <div key={key} className="bg-white p-5 sm:p-7">
                                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}><Icon size={22} /></div>
                                <p className="mt-5 text-2xl font-black text-slate-950 sm:text-3xl">{loading ? '—' : bn(summary[key] ?? summary[fallback])}</p>
                                <p className="mt-1 font-black text-slate-800">{label}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, FileBadge, FolderLock, GraduationCap, HandHeart, HeartPulse, MapPinned, ReceiptText, Search, Siren, Sprout } from 'lucide-react';
import { CITIZEN_SERVICE_GROUPS, CITIZEN_SERVICES } from '@/lib/constants/citizenServices';

const ICONS = { BriefcaseBusiness, FileBadge, FolderLock, GraduationCap, HandHeart, HeartPulse, MapPinned, ReceiptText, Siren, Sprout };

export default function CitizenServicesHub() {
    const [group, setGroup] = useState('all');
    const [query, setQuery] = useState('');
    const services = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        return CITIZEN_SERVICES.filter((service) => {
            const matchesGroup = group === 'all' || service.group === group;
            const matchesQuery = !normalized || `${service.title} ${service.summary} ${service.audience}`.toLowerCase().includes(normalized);
            return matchesGroup && matchesQuery;
        });
    }, [group, query]);

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 md:py-14">
            <div className="mx-auto max-w-7xl">
                <section className="overflow-hidden rounded-[36px] bg-slate-950 p-6 text-white shadow-2xl sm:p-10">
                    <p className="text-xs font-black text-teal-300">এক জায়গায় নাগরিকের প্রয়োজনীয় কাজ</p>
                    <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-6xl">সমন্বিত নাগরিক সেবা কেন্দ্র</h1>
                    <p className="mt-4 max-w-3xl font-medium leading-7 text-slate-300">আবেদন, ভাতা, অভিযোগ, জরুরি সহায়তা, পরিবার, কৃষি, কাজ, স্বাস্থ্য, শিক্ষা ও payment—সঠিক কাজটি খুঁজে সরাসরি শুরু করুন।</p>
                    <label className="mt-7 flex max-w-2xl items-center gap-3 rounded-2xl bg-white px-4 text-slate-900 shadow-xl">
                        <Search size={20} className="text-teal-600" />
                        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="যেমন: বয়স্ক ভাতা, রাস্তার অভিযোগ, স্কুল..." className="h-14 min-w-0 flex-1 bg-transparent font-bold outline-none" />
                    </label>
                </section>

                <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
                    <Filter active={group === 'all'} onClick={() => setGroup('all')}>সব সেবা</Filter>
                    {CITIZEN_SERVICE_GROUPS.map((item) => <Filter key={item.id} active={group === item.id} onClick={() => setGroup(item.id)}>{item.label}</Filter>)}
                </div>

                {services.length ? (
                    <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {services.map((service) => {
                            const Icon = ICONS[service.icon] || FileBadge;
                            return (
                                <Link key={service.id} href={`/citizen/services/${service.id}`} className="group flex min-h-[260px] flex-col rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl">
                                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100"><Icon size={26} /></span>
                                    <h2 className="mt-5 text-2xl font-black leading-tight text-slate-950">{service.title}</h2>
                                    <p className="mt-3 flex-1 text-sm font-medium leading-6 text-slate-500">{service.summary}</p>
                                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-teal-700">বিস্তারিত ও কাজ শুরু করুন <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
                                </Link>
                            );
                        })}
                    </section>
                ) : <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-12 text-center font-bold text-slate-500">এই নামে কোনো সেবা পাওয়া যায়নি। অন্য শব্দ দিয়ে খুঁজুন।</div>}
            </div>
        </main>
    );
}

function Filter({ active, onClick, children }) {
    return <button type="button" onClick={onClick} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-black transition ${active ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-300'}`}>{children}</button>;
}

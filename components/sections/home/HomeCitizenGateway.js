"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowRight,
    BadgeCheck,
    FileSearch,
    Home,
    LockKeyhole,
    LogIn,
    QrCode,
    Search,
    ShieldCheck,
    UserRoundCheck
} from 'lucide-react';

function normalizeLookup(value = '') {
    return String(value).trim();
}

export default function HomeCitizenGateway() {
    const router = useRouter();
    const [trackForm, setTrackForm] = useState({ id: '', phone: '', type: '' });
    const [homeLookup, setHomeLookup] = useState('');

    function submitTrack(event) {
        event.preventDefault();
        const id = normalizeLookup(trackForm.id);
        const phone = normalizeLookup(trackForm.phone);
        if (!id || !phone) return;
        const params = new URLSearchParams({ id, phone });
        if (trackForm.type) params.set('type', trackForm.type);
        router.push(`/track?${params.toString()}`);
    }

    function submitHomeLookup(event) {
        event.preventDefault();
        const lookup = normalizeLookup(homeLookup);
        if (!lookup) return;
        router.push(`/h/${encodeURIComponent(lookup)}`);
    }

    return (
        <section className="bg-white px-3 py-8 sm:px-6 md:py-12">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-teal-700 ring-1 ring-teal-100">
                            <ShieldCheck size={14} />
                            Citizen gateway
                        </p>
                        <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                            Home page thekei status, home profile, portal login
                        </h2>
                        <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-slate-500 sm:text-base">
                            সাধারণ মানুষ tracking ID, phone, household QR/ID দিয়ে নিজের কাজ নিজেই খুঁজে পাবে। চেয়ারম্যান, মেম্বার, ভলান্টিয়ারও এখান থেকে portal-এ যেতে পারবে।
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
                        <MiniSignal icon={FileSearch} value="Track" label="request" />
                        <MiniSignal icon={QrCode} value="QR" label="home" />
                        <MiniSignal icon={LogIn} value="Portal" label="login" />
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <form onSubmit={submitTrack} className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-start gap-3">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                                <FileSearch size={24} />
                            </span>
                            <div>
                                <h3 className="text-xl font-black text-slate-950">আবেদন / অভিযোগ status</h3>
                                <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
                                    Tracking ID আর phone দিলে current status দেখা যাবে।
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr]">
                            <label className="grid gap-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tracking ID</span>
                                <input
                                    value={trackForm.id}
                                    onChange={(event) => setTrackForm((current) => ({ ...current, id: event.target.value }))}
                                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10"
                                    placeholder="Certificate / request ID"
                                />
                            </label>
                            <label className="grid gap-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</span>
                                <input
                                    value={trackForm.phone}
                                    onChange={(event) => setTrackForm((current) => ({ ...current, phone: event.target.value }))}
                                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10"
                                    placeholder="01XXXXXXXXX"
                                    type="tel"
                                />
                            </label>
                            <label className="grid gap-1 sm:col-span-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</span>
                                <select
                                    value={trackForm.type}
                                    onChange={(event) => setTrackForm((current) => ({ ...current, type: event.target.value }))}
                                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10"
                                >
                                    <option value="">Auto detect</option>
                                    <option value="service">Service request</option>
                                    <option value="complaint">Complaint</option>
                                    <option value="appointment">Office serial</option>
                                    <option value="life_support">Life support</option>
                                </select>
                            </label>
                        </div>
                        <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-teal-700">
                            Status দেখুন
                            <ArrowRight size={17} />
                        </button>
                    </form>

                    <div className="grid gap-4">
                        <form onSubmit={submitHomeLookup} className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-4 shadow-sm sm:p-5">
                            <div className="mb-4 flex items-start gap-3">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 ring-1 ring-emerald-100">
                                    <Home size={22} />
                                </span>
                                <div>
                                    <h3 className="text-lg font-black text-slate-950">Home / QR profile</h3>
                                    <p className="mt-1 text-xs font-bold leading-5 text-emerald-800/75">
                                        Household QR ID scan/enter করে family profile খুলুন।
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <input
                                    value={homeLookup}
                                    onChange={(event) => setHomeLookup(event.target.value)}
                                    className="h-12 min-w-0 flex-1 rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-bold outline-none transition focus:border-emerald-400"
                                    placeholder="Household ID / QR code"
                                />
                                <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-950">
                                    <Search size={15} />
                                    Open
                                </button>
                            </div>
                        </form>

                        <div className="grid grid-cols-2 gap-3">
                            <PortalLink href="/login" icon={LogIn} title="Officer Login" text="Chairman, member, volunteer" />
                            <PortalLink href="/citizen" icon={UserRoundCheck} title="Citizen Center" text="Apply, complaint, blood" />
                            <PortalLink href="/track" icon={BadgeCheck} title="Track Center" text="Status page" />
                            <PortalLink href="/services/school" icon={LockKeyhole} title="School Link" text="Student progress" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function MiniSignal({ icon: Icon, value, label }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <Icon size={17} className="text-teal-600" />
            <p className="mt-2 text-sm font-black text-slate-950">{value}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        </div>
    );
}

function PortalLink({ href, icon: Icon, title, text }) {
    return (
        <Link
            href={href}
            className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg"
        >
            <Icon size={20} className="text-teal-700" />
            <p className="mt-3 text-sm font-black text-slate-950">{title}</p>
            <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500">{text}</p>
        </Link>
    );
}

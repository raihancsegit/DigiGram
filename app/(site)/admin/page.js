"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    Bell,
    Building2,
    ClipboardList,
    CreditCard,
    Database,
    GraduationCap,
    Home,
    Loader2,
    Map,
    MessageSquareWarning,
    RefreshCw,
    School,
    ShieldCheck,
    Smartphone,
    Users,
    WalletCards,
    Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { adminService } from '@/lib/services/adminService';

function bnNumber(value) {
    return new Intl.NumberFormat('bn-BD').format(Number(value || 0));
}

function toneClass(tone) {
    return {
        blue: 'bg-blue-500',
        teal: 'bg-teal-500',
        amber: 'bg-amber-500',
        indigo: 'bg-indigo-500',
        rose: 'bg-rose-500',
        emerald: 'bg-emerald-500',
        violet: 'bg-violet-500',
        slate: 'bg-slate-700'
    }[tone] || 'bg-slate-700';
}

function statusTone(value, warningAt = 1) {
    return Number(value || 0) >= warningAt ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700';
}

export default function AdminDashboard() {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function loadOverview() {
        setLoading(true);
        setError('');
        try {
            setOverview(await adminService.getDashboardOverview());
        } catch (err) {
            setError(err.message || 'Dashboard data load failed');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadOverview();
    }, []);

    const counts = useMemo(() => overview?.counts || {}, [overview]);
    const cards = useMemo(() => ([
        { label: 'মোট পরিবার / Home', value: counts.households, icon: Home, tone: 'emerald', meta: `${bnNumber(counts.residents)} জন সদস্য` },
        { label: 'Union / Ward / Gram', value: counts.unions, icon: Map, tone: 'blue', meta: `${bnNumber(counts.wards)} ward · ${bnNumber(counts.villages)} gram` },
        { label: 'শিক্ষা প্রতিষ্ঠান', value: counts.institutions, icon: School, tone: 'teal', meta: `${bnNumber(counts.activeInstitutions)} active website` },
        { label: 'শিক্ষার্থী tracking', value: counts.schoolStudents, icon: GraduationCap, tone: 'violet', meta: `${bnNumber(counts.admissionPending)} pending admission` },
        { label: 'চলতি মাসের SMS', value: counts.smsMonth, icon: Zap, tone: 'amber', meta: `${bnNumber(counts.smsQueued)} queued · ${bnNumber(counts.smsFailed)} failed` },
        { label: 'Open workload', value: counts.openWorkload, icon: ClipboardList, tone: 'rose', meta: `${bnNumber(counts.complaintsOpen)} complaint · ${bnNumber(counts.appointmentsOpen)} appointment` },
        { label: 'Payment review', value: counts.paymentsPending, icon: CreditCard, tone: 'indigo', meta: 'pending/submitted payments' },
        { label: 'Data quality', value: counts.dataQualityOpen, icon: ShieldCheck, tone: 'slate', meta: `${bnNumber(counts.activeDemoBatches)} active demo batch` }
    ]), [counts]);

    const alerts = [
        { label: 'Failed SMS', value: counts.smsFailed, icon: Bell, href: '/admin/sms' },
        { label: 'Low SMS wallet', value: counts.lowSmsWallets, icon: WalletCards, href: '/admin/billing' },
        { label: 'Pending admissions', value: counts.admissionPending, icon: School, href: '/admin/institutions' },
        { label: 'Data quality tasks', value: counts.dataQualityOpen, icon: Database, href: '/admin/data-quality' }
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">অ্যাডমিন ওভারভিউ</h1>
                    <p className="text-slate-500 font-bold">
                        Union, home, education, service, SMS ও payment data live count থেকে দেখানো হচ্ছে।
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={loadOverview}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition hover:shadow-md disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />}
                        Refresh
                    </button>
                    <Link href="/admin/maintenance" className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-teal-200 transition hover:bg-teal-700">
                        <Database size={17} />
                        Demo / Reset
                    </Link>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {(loading && !overview ? Array.from({ length: 8 }) : cards).map((stat, idx) => {
                    const Icon = stat?.icon || Activity;
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            key={stat?.label || idx}
                            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-xl"
                        >
                            {loading && !overview ? (
                                <div className="space-y-4">
                                    <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-100" />
                                    <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                                    <div className="h-8 w-24 animate-pulse rounded bg-slate-100" />
                                </div>
                            ) : (
                                <>
                                    <div className="mb-5 flex items-center justify-between">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg ${toneClass(stat.tone)}`}>
                                            <Icon size={24} />
                                        </div>
                                        <span className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-500">
                                            LIVE
                                        </span>
                                    </div>
                                    <h3 className="mb-1 text-xs font-black uppercase tracking-widest text-slate-400">{stat.label}</h3>
                                    <p className="text-3xl font-black text-slate-900">{bnNumber(stat.value)}</p>
                                    <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{stat.meta}</p>
                                </>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.35fr_0.65fr]">
                <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-6 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Project Health</h3>
                            <p className="mt-1 text-sm font-bold text-slate-500">প্রধান module গুলোর current workload</p>
                        </div>
                        <Link href="/admin/launch" className="flex items-center gap-1 text-xs font-black text-teal-600 hover:underline">
                            Readiness <ArrowUpRight size={14} />
                        </Link>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <HealthRow icon={Users} label="Citizen service requests" value={counts.serviceOpen} href="/admin/operations" />
                        <HealthRow icon={MessageSquareWarning} label="Complaint queue" value={counts.complaintsOpen} href="/admin/governance" />
                        <HealthRow icon={Smartphone} label="SMS queue" value={counts.smsQueued} href="/admin/sms" />
                        <HealthRow icon={Building2} label="Education institutions" value={counts.institutions} href="/admin/institutions" />
                    </div>
                </section>

                <section className="rounded-[32px] bg-slate-900 p-6 text-white shadow-sm md:p-8">
                    <h3 className="mb-6 flex items-center gap-2 text-xl font-black">
                        জরুরি নজরদারি <AlertTriangle size={20} className="text-amber-400" />
                    </h3>
                    <div className="space-y-3">
                        {alerts.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.label} href={item.href} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-teal-200">
                                            <Icon size={18} />
                                        </div>
                                        <p className="text-sm font-black text-slate-100">{item.label}</p>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(item.value)}`}>
                                        {bnNumber(item.value)}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <RecentPanel
                    title="নতুন প্রতিষ্ঠান"
                    empty="এখনো কোনো institution নেই।"
                    rows={overview?.recent?.institutions || []}
                    renderRow={(item) => (
                        <>
                            <div>
                                <p className="font-black text-slate-800">{item.name}</p>
                                <p className="mt-1 text-xs font-bold text-slate-400">{item.type || item.category || 'institution'} · {item.website_status || 'draft'}</p>
                            </div>
                            <School size={18} className="text-teal-600" />
                        </>
                    )}
                />
                <RecentPanel
                    title="সাম্প্রতিক আবেদন"
                    empty="এখনো কোনো service request নেই।"
                    rows={overview?.recent?.requests || []}
                    renderRow={(item) => (
                        <>
                            <div>
                                <p className="font-black text-slate-800">{item.applicant_name || item.request_type || 'আবেদন'}</p>
                                <p className="mt-1 text-xs font-bold text-slate-400">{item.request_type || '-'} · {item.status || 'pending'}</p>
                            </div>
                            <ClipboardList size={18} className="text-indigo-600" />
                        </>
                    )}
                />
            </div>
        </div>
    );
}

function HealthRow({ icon: Icon, label, value, href }) {
    return (
        <Link href={href} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-teal-200 hover:bg-white">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-600">
                    <Icon size={18} />
                </div>
                <p className="text-sm font-black text-slate-700">{label}</p>
            </div>
            <span className="rounded-xl bg-white px-3 py-1 text-sm font-black text-slate-900">{bnNumber(value)}</span>
        </Link>
    );
}

function RecentPanel({ title, empty, rows, renderRow }) {
    return (
        <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
            <h3 className="mb-5 text-xl font-black text-slate-800">{title}</h3>
            <div className="space-y-3">
                {rows.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-400">{empty}</p>
                ) : rows.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        {renderRow(item)}
                    </div>
                ))}
            </div>
        </section>
    );
}

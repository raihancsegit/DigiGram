'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    AlertTriangle,
    Clock3,
    Download,
    ExternalLink,
    FileClock,
    Loader2,
    RefreshCw,
    ShieldCheck
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/utils/authenticated-fetch';

function formatDate(value) {
    if (!value) return 'Deadline নেই';
    return new Date(value).toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

function csvEscape(value) {
    const text = String(value ?? '').replace(/"/g, '""');
    return `"${text}"`;
}

function downloadCsv(filename, rows) {
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

function itemHref(item) {
    if (item.kind === 'service') return `/track/${item.id}`;
    const type = item.kind === 'life-support' ? 'life_support' : item.kind;
    const phone = item.contact_phone || item.phone || '';
    return `/track?id=${encodeURIComponent(item.id)}&phone=${encodeURIComponent(phone)}&type=${encodeURIComponent(type)}`;
}

export default function OperationsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await authenticatedFetch('/api/admin/operations');
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.setupRequired
                    ? `${result.migration} Supabase SQL Editor-এ চালান।`
                    : result.error);
            }
            setData(result.data);
        } catch (loadError) {
            setError(loadError.message || 'Operations data load করা যায়নি');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const urgentQueue = useMemo(() => {
        if (!data) return [];
        return [
            ...(data.services || []).map((item) => ({ ...item, kind: 'service', label: item.request_type })),
            ...(data.complaints || []).map((item) => ({ ...item, kind: 'complaint', label: item.title })),
            ...(data.appointments || []).map((item) => ({ ...item, kind: 'appointment', label: item.title })),
            ...(data.lifeSupport || []).map((item) => ({ ...item, kind: 'life-support', label: item.title }))
        ]
            .filter((item) => item.overdue || Number(item.escalation_level || 0) > 0)
            .sort((a, b) => {
                const escalationDiff = Number(b.escalation_level || 0) - Number(a.escalation_level || 0);
                if (escalationDiff) return escalationDiff;
                return new Date(a.sla_due_at || 0) - new Date(b.sla_due_at || 0);
            })
            .slice(0, 40);
    }, [data]);

    const exportUrgentQueue = useCallback(() => {
        downloadCsv('digigram-operations-urgent-queue.csv', [
            ['type', 'id', 'title', 'citizen', 'status', 'priority', 'sla_due_at', 'overdue', 'escalation_level'],
            ...urgentQueue.map((item) => [
                item.kind,
                item.id,
                item.label || '',
                item.applicant_name || item.citizen_name || item.contact_phone || item.phone || '',
                item.status || '',
                item.priority || '',
                item.sla_due_at || '',
                item.overdue ? 'yes' : 'no',
                item.escalation_level || 0
            ])
        ]);
    }, [urgentQueue]);

    const exportAccessLogs = useCallback(() => {
        downloadCsv('digigram-private-access-log.csv', [
            ['time', 'actor_role', 'resource_type', 'resource_id', 'action', 'citizen_phone', 'channel'],
            ...(data?.accessLogs || []).map((item) => [
                item.created_at,
                item.actor_role || '',
                item.resource_type || '',
                item.resource_id || '',
                item.action || '',
                item.citizen_phone || '',
                item.access_channel || ''
            ])
        ]);
    }, [data?.accessLogs]);

    if (loading) {
        return (
            <div className="flex min-h-[55vh] items-center justify-center">
                <Loader2 className="animate-spin text-teal-600" size={36} />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-16">
            <section className="overflow-hidden rounded-[28px] bg-slate-950 p-6 text-white sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-teal-300">
                            <FileClock size={15} /> Operations command center
                        </div>
                        <h1 className="mt-3 text-3xl font-black sm:text-4xl">SLA ও privacy নজরদারি</h1>
                        <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-300">
                            সময় পেরোনো আবেদন, জরুরি অভিযোগ এবং private data access এক জায়গা থেকে দেখুন।
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={loadData}
                        className="inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 transition hover:bg-teal-100"
                    >
                        <RefreshCw size={17} /> Refresh
                    </button>
                </div>
            </section>

            {error ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 font-bold text-amber-900">
                    {error}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
                        <SummaryCard label="চলমান আবেদন" value={data?.summary?.openServices} tone="slate" />
                        <SummaryCard label="Overdue আবেদন" value={data?.summary?.overdueServices} tone="rose" />
                        <SummaryCard label="চলমান অভিযোগ" value={data?.summary?.openComplaints} tone="slate" />
                        <SummaryCard label="Overdue অভিযোগ" value={data?.summary?.overdueComplaints} tone="amber" />
                        <SummaryCard label="Overdue appointment" value={data?.summary?.overdueAppointments} tone="rose" />
                        <SummaryCard label="Overdue life support" value={data?.summary?.overdueLifeSupport} tone="amber" />
                        <SummaryCard label="High escalation" value={data?.summary?.highEscalations} tone="violet" />
                    </div>

                    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="rounded-2xl bg-rose-50 p-3 text-rose-600"><AlertTriangle size={22} /></div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">আগে যেগুলো ধরতে হবে</h2>
                                <p className="text-sm font-bold text-slate-500">Overdue ও escalated queue</p>
                            </div>
                            <button
                                type="button"
                                onClick={exportUrgentQueue}
                                className="ml-auto inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
                            >
                                <Download size={15} /> CSV
                            </button>
                        </div>

                        {urgentQueue.length === 0 ? (
                            <p className="rounded-2xl bg-emerald-50 p-5 font-bold text-emerald-700">কোনো overdue item নেই।</p>
                        ) : (
                            <div className="grid gap-3 lg:grid-cols-2">
                                {urgentQueue.map((item) => (
                                    <article key={`${item.kind}-${item.id}`} className="rounded-3xl border border-slate-200 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black ${
                                                    item.kind === 'service'
                                                        ? 'bg-teal-50 text-teal-700'
                                                        : item.kind === 'appointment'
                                                            ? 'bg-indigo-50 text-indigo-700'
                                                            : item.kind === 'life-support'
                                                                ? 'bg-amber-50 text-amber-700'
                                                                : 'bg-rose-50 text-rose-700'
                                                }`}>
                                                    {item.kind === 'service'
                                                        ? 'Service'
                                                        : item.kind === 'appointment'
                                                            ? 'Appointment'
                                                            : item.kind === 'life-support'
                                                                ? 'Life support'
                                                                : 'Complaint'}
                                                </span>
                                                <h3 className="mt-2 truncate font-black text-slate-900">{item.label || 'Untitled'}</h3>
                                                <p className="mt-1 text-xs font-bold text-slate-500">
                                                    {item.applicant_name || item.citizen_name || item.contact_phone || item.phone || 'Citizen'}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-rose-50 px-3 py-1 text-[10px] font-black text-rose-700">
                                                Level {item.escalation_level || 1}
                                            </span>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                                            <span className="flex items-center gap-1 text-xs font-black text-rose-600">
                                                <Clock3 size={14} /> {formatDate(item.sla_due_at)}
                                            </span>
                                            <Link href={itemHref(item)} className="inline-flex items-center gap-1 rounded-xl bg-teal-50 px-3 py-2 text-xs font-black text-teal-700">
                                                Open <ExternalLink size={14} />
                                            </Link>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600"><ShieldCheck size={22} /></div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Recent private-data access</h2>
                                <p className="text-sm font-bold text-slate-500">Citizen inbox ও household locker audit trail</p>
                            </div>
                            <button
                                type="button"
                                onClick={exportAccessLogs}
                                className="ml-auto inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
                            >
                                <Download size={15} /> CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-[720px] w-full text-left">
                                <thead className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    <tr>
                                        <th className="px-3 py-3">সময়</th>
                                        <th className="px-3 py-3">Actor</th>
                                        <th className="px-3 py-3">Resource</th>
                                        <th className="px-3 py-3">Action</th>
                                        <th className="px-3 py-3">Citizen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                                    {(data?.accessLogs || []).map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-3 py-3">{formatDate(item.created_at)}</td>
                                            <td className="px-3 py-3">{item.actor_role || 'citizen'}</td>
                                            <td className="px-3 py-3">{item.resource_type}</td>
                                            <td className="px-3 py-3">{item.action}</td>
                                            <td className="px-3 py-3">{item.citizen_phone || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

function SummaryCard({ label, value = 0, tone }) {
    const colors = {
        slate: 'border-slate-200 bg-white text-slate-900',
        rose: 'border-rose-100 bg-rose-50 text-rose-800',
        amber: 'border-amber-100 bg-amber-50 text-amber-800',
        violet: 'border-violet-100 bg-violet-50 text-violet-800'
    };

    return (
        <div className={`rounded-3xl border p-4 sm:p-5 ${colors[tone] || colors.slate}`}>
            <p className="text-[10px] font-black uppercase tracking-wider opacity-60">{label}</p>
            <p className="mt-2 text-3xl font-black">{value || 0}</p>
        </div>
    );
}

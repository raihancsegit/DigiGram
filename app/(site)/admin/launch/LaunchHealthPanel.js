'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    DatabaseZap,
    Download,
    Loader2,
    RefreshCw,
    ServerCog,
    ShieldAlert
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/utils/authenticated-fetch';

const toneClasses = {
    ready: 'border-teal-100 bg-teal-50 text-teal-800',
    warning: 'border-amber-100 bg-amber-50 text-amber-800',
    danger: 'border-rose-100 bg-rose-50 text-rose-800'
};

const pillClasses = {
    ready: 'bg-teal-100 text-teal-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-rose-100 text-rose-800'
};

function formatTime(value) {
    if (!value) return 'Never';
    return new Date(value).toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

function metricValue(metric) {
    if (!metric) return 0;
    return Number(metric.count || 0).toLocaleString('bn-BD');
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

export default function LaunchHealthPanel() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadHealth = useCallback(async ({ quiet = false } = {}) => {
        if (quiet) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError('');

        try {
            const response = await authenticatedFetch('/api/admin/launch/health', { cache: 'no-store' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Launch health load failed');
            setData(result.data);
        } catch (loadError) {
            setError(loadError.message || 'Launch health load failed');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadHealth();
    }, [loadHealth]);

    const metrics = useMemo(() => {
        const counts = data?.counts || {};
        return [
            { label: 'Households', value: metricValue(counts.totalHouseholds), detail: `${metricValue(counts.householdsMissingGps)} GPS missing` },
            { label: 'Residents', value: metricValue(counts.totalResidents), detail: 'Citizen database rows' },
            { label: 'SMS Wallets', value: metricValue(counts.smsWallets), detail: `${metricValue(counts.lowBalanceWallets)} low balance` },
            { label: 'Pending Recharge', value: metricValue(counts.pendingRecharge), detail: 'Waiting admin approval' },
            { label: 'Market Alerts', value: metricValue(counts.activeMarketAlerts), detail: 'Active subscriptions' },
            { label: 'Lost/Found', value: metricValue(counts.activeLostFound), detail: 'Active public posts' },
            { label: 'Institutions', value: metricValue(counts.institutions), detail: 'Pilot growth surface' }
        ];
    }, [data]);

    const exportReadiness = useCallback(() => {
        if (!data) return;
        downloadCsv('digigram-launch-readiness.csv', [
            ['section', 'label', 'value', 'detail', 'tone'],
            ...(data.statusItems || []).map((item) => ['status', item.label, item.value, item.detail, item.tone]),
            ...(data.env || []).map((item) => ['env', item.label, item.configured ? 'configured' : 'missing', item.key, item.group]),
            ...metrics.map((item) => ['metric', item.label, item.value, item.detail, ''])
        ]);
    }, [data, metrics]);

    if (loading) {
        return (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex min-h-48 items-center justify-center gap-3 text-sm font-black text-slate-500">
                    <Loader2 className="animate-spin text-teal-600" size={24} />
                    Live launch health loading...
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <ServerCog size={23} />
                    </span>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Live health</p>
                        <h2 className="text-2xl font-black text-slate-950">Production launch signal</h2>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                            Last checked: {formatTime(data?.generatedAt)}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="rounded-2xl bg-slate-950 px-5 py-3 text-white">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Score</p>
                        <p className="text-3xl font-black text-teal-200">{data?.score || 0}%</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => loadHealth({ quiet: true })}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-800 transition hover:border-teal-200 hover:bg-teal-50"
                    >
                        <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        type="button"
                        onClick={exportReadiness}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-800 transition hover:border-teal-200 hover:bg-teal-50"
                    >
                        <Download size={17} />
                        CSV
                    </button>
                </div>
            </div>

            {error ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                    <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {(data?.statusItems || []).map((item) => (
                            <article key={item.key} className={`rounded-3xl border p-4 ${toneClasses[item.tone] || toneClasses.warning}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="font-black">{item.label}</h3>
                                        <p className="mt-1 text-xs font-bold opacity-80">{item.detail}</p>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${pillClasses[item.tone] || pillClasses.warning}`}>
                                        {item.tone}
                                    </span>
                                </div>
                                <p className="mt-4 text-3xl font-black">{item.value}</p>
                            </article>
                        ))}
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
                        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                            <div className="mb-3 flex items-center gap-2">
                                <DatabaseZap size={19} className="text-teal-700" />
                                <h3 className="font-black text-slate-950">Environment flags</h3>
                            </div>
                            <div className="space-y-2">
                                {(data?.env || []).map((item) => (
                                    <div key={item.key} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2">
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-slate-800">{item.label}</p>
                                            <p className="truncate text-xs font-bold text-slate-400">{item.key}</p>
                                        </div>
                                        {item.configured ? (
                                            <CheckCircle2 size={18} className="shrink-0 text-teal-600" />
                                        ) : (
                                            <ShieldAlert size={18} className="shrink-0 text-amber-600" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                            <div className="mb-3 flex items-center gap-2">
                                <CheckCircle2 size={19} className="text-teal-700" />
                                <h3 className="font-black text-slate-950">Operational counts</h3>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {metrics.map((item) => (
                                    <div key={item.label} className="rounded-2xl bg-white p-3">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{item.label}</p>
                                        <p className="mt-1 text-2xl font-black text-slate-950">{item.value}</p>
                                        <p className="mt-1 text-xs font-bold text-slate-500">{item.detail}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Database,
    FileCode2,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/utils/authenticated-fetch';

export default function MigrationStatusPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [setupFile, setSetupFile] = useState('');

    const loadStatus = useCallback(async () => {
        setLoading(true);
        setError('');
        setSetupFile('');
        try {
            const response = await authenticatedFetch('/api/admin/migrations');
            const result = await response.json();
            if (!response.ok) {
                if (result.setupRequired) setSetupFile(result.migration);
                throw new Error(result.error || 'Migration status load failed');
            }
            setData(result.data);
        } catch (loadError) {
            setError(loadError.message || 'Migration status load failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    return (
        <div className="space-y-6 pb-16">
            <section className="overflow-hidden rounded-[28px] bg-slate-950 p-6 text-white sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-teal-300">
                            <Database size={16} /> Database control
                        </p>
                        <h1 className="mt-3 text-3xl font-black sm:text-4xl">SQL Migration Status</h1>
                        <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-300">
                            কোন database upgrade চালানো হয়েছে এবং কোনটি বাকি, এক জায়গা থেকে যাচাই করুন।
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={loadStatus}
                        className="inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 transition hover:bg-teal-100"
                    >
                        <RefreshCw size={17} /> আবার যাচাই
                    </button>
                </div>
            </section>

            {loading ? (
                <div className="flex min-h-[40vh] items-center justify-center">
                    <Loader2 className="animate-spin text-teal-600" size={36} />
                </div>
            ) : error ? (
                <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-1 shrink-0 text-amber-600" size={22} />
                        <div>
                            <h2 className="font-black text-amber-950">{error}</h2>
                            {setupFile && (
                                <p className="mt-2 text-sm font-bold text-amber-800">
                                    Supabase SQL Editor-এ আগে <code className="rounded bg-white px-2 py-1">{setupFile}</code> চালান।
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            ) : (
                <>
                    <div className="grid grid-cols-3 gap-3">
                        <Summary label="মোট" value={data?.summary?.total} tone="slate" />
                        <Summary label="ইনস্টল হয়েছে" value={data?.summary?.installed} tone="emerald" />
                        <Summary label="বাকি" value={data?.summary?.missing} tone="amber" />
                    </div>

                    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="grid gap-3">
                            {(data?.migrations || []).map((item) => (
                                <article
                                    key={item.migration_id}
                                    className={`rounded-3xl border p-4 sm:p-5 ${
                                        item.installed
                                            ? 'border-emerald-100 bg-emerald-50/60'
                                            : 'border-amber-200 bg-amber-50'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`rounded-2xl p-3 ${
                                            item.installed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {item.installed ? <CheckCircle2 size={21} /> : <FileCode2 size={21} />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs font-black text-slate-400">#{item.migration_id}</span>
                                                <span className={`rounded-full px-3 py-1 text-[10px] font-black ${
                                                    item.installed
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-amber-600 text-white'
                                                }`}>
                                                    {item.installed ? 'INSTALLED' : 'RUN SQL'}
                                                </span>
                                            </div>
                                            <h2 className="mt-2 text-lg font-black text-slate-900">{item.title}</h2>
                                            <p className="mt-1 text-sm font-bold leading-6 text-slate-600">{item.detail}</p>
                                            <code className="mt-3 block overflow-x-auto rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700">
                                                {item.sql_file}
                                            </code>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

function Summary({ label, value = 0, tone }) {
    const styles = {
        slate: 'border-slate-200 bg-white text-slate-900',
        emerald: 'border-emerald-100 bg-emerald-50 text-emerald-800',
        amber: 'border-amber-100 bg-amber-50 text-amber-800'
    };
    return (
        <div className={`rounded-3xl border p-4 sm:p-5 ${styles[tone]}`}>
            <p className="text-[10px] font-black uppercase tracking-wider opacity-60">{label}</p>
            <p className="mt-2 text-3xl font-black">{value || 0}</p>
        </div>
    );
}


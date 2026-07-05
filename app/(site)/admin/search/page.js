'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Database, Loader2, Search, ShieldCheck } from 'lucide-react';
import { authenticatedFetch } from '@/lib/utils/authenticated-fetch';

export default function AdminSmartSearchPage() {
    const [query, setQuery] = useState('');
    const [data, setData] = useState({ groups: [], rows: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const runSearch = useCallback(async (value) => {
        const q = value.trim();
        setError('');
        if (q.length < 2) {
            setData({ groups: [], rows: [] });
            return;
        }

        setLoading(true);
        try {
            const response = await authenticatedFetch(`/api/admin/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Search failed');
            setData(payload.data || { groups: [], rows: [] });
        } catch (searchError) {
            setError(searchError.message || 'Search failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => runSearch(query), 300);
        return () => clearTimeout(timer);
    }, [query, runSearch]);

    const skipped = useMemo(() => (data.groups || []).filter((group) => group.skipped), [data.groups]);

    return (
        <div className="space-y-6 pb-16">
            <section className="rounded-[28px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/60 sm:p-8">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full bg-teal-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-teal-200">
                            <Search size={15} />
                            Smart Search
                        </p>
                        <h1 className="mt-4 text-3xl font-black sm:text-4xl">সব গুরুত্বপূর্ণ ডাটা এক জায়গা থেকে খুঁজুন</h1>
                        <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-300">
                            Household, resident, certificate, service, complaint, appointment, institution, location - ID, phone, name বা certificate no দিয়ে খুঁজুন।
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white/8 px-5 py-4 ring-1 ring-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Results</p>
                        <p className="mt-1 text-3xl font-black text-teal-200">{data.rows?.length || 0}</p>
                    </div>
                </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="নাম, ফোন, NID, certificate no, tracking ID..."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold outline-none transition focus:border-teal-400 focus:bg-white"
                    />
                    {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-teal-600" size={20} />}
                </div>
                {error && <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
                {skipped.length > 0 && (
                    <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
                        {skipped.map((item) => item.label).join(', ')} skipped because related table/migration is unavailable.
                    </p>
                )}
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                        <Database className="text-teal-700" />
                        <h2 className="text-xl font-black text-slate-900">Search coverage</h2>
                    </div>
                    <div className="space-y-2">
                        {(data.groups || []).length === 0 ? (
                            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">কমপক্ষে ২ অক্ষর লিখুন।</p>
                        ) : data.groups.map((group) => (
                            <div key={group.key} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                <span className="text-sm font-black text-slate-800">{group.label}</span>
                                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${group.skipped ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'}`}>
                                    {group.skipped ? 'Skipped' : `${group.rows.length} found`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                        <ShieldCheck className="text-teal-700" />
                        <h2 className="text-xl font-black text-slate-900">Results</h2>
                    </div>
                    <div className="space-y-3">
                        {(data.rows || []).length === 0 ? (
                            <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">
                                এখনো result নেই।
                            </p>
                        ) : data.rows.map((row) => (
                            <Link
                                key={`${row.group}-${row.id}`}
                                href={row.href || '#'}
                                className="block rounded-3xl border border-slate-100 bg-slate-50 p-4 transition hover:border-teal-200 hover:bg-teal-50"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-teal-700">
                                            {row.groupLabel}
                                        </span>
                                        <h3 className="mt-3 truncate text-lg font-black text-slate-900">{row.title}</h3>
                                        <p className="mt-1 text-sm font-bold text-slate-500">{row.subtitle || row.id}</p>
                                        {row.meta && <p className="mt-1 text-xs font-bold text-slate-400">{row.meta}</p>}
                                    </div>
                                    <ArrowRight className="mt-2 shrink-0 text-slate-400" size={18} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    ArchiveRestore, CheckCircle2, DatabaseBackup, Laptop, RefreshCw,
    Search, ShieldCheck, Smartphone, ToggleLeft, ToggleRight, Undo2, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authenticatedFetch } from '@/lib/utils/authenticated-fetch';

const tabs = [
    ['search', 'Citizen Search', Search],
    ['devices', 'Officer Devices', Smartphone],
    ['sms', 'SMS Automation', ToggleRight],
    ['backup', 'Backup & Merge', DatabaseBackup]
];

function Metric({ icon: Icon, label, value, tone }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}><Icon size={20} /></span>
            <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{value || 0}</p>
        </div>
    );
}

function formatDate(value) {
    if (!value) return '—';
    return new Intl.DateTimeFormat('bn-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function GovernancePage() {
    const [tab, setTab] = useState('search');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState('');
    const [query, setQuery] = useState('');

    const api = useCallback(async (url = '/api/admin/governance', options) => {
        const response = await authenticatedFetch(url, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Request failed');
        return result;
    }, []);

    const load = useCallback(async (search = '') => {
        setLoading(true);
        try {
            setData(await api(`/api/admin/governance${search ? `?q=${encodeURIComponent(search)}` : ''}`));
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => { load(); }, [load]);

    const action = async (payload, success) => {
        setWorking(`${payload.action}:${payload.id || ''}`);
        try {
            await api('/api/admin/governance', { method: 'POST', body: JSON.stringify(payload) });
            toast.success(success);
            await load(query);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setWorking('');
        }
    };

    if (loading && !data) {
        return <div className="flex min-h-[420px] items-center justify-center"><RefreshCw className="animate-spin text-teal-600" /></div>;
    }

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-[34px] bg-slate-950 p-6 text-white shadow-xl md:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">Governance Center</p>
                        <h1 className="mt-3 text-3xl font-black md:text-4xl">নাগরিক ডাটা, ডিভাইস ও recovery control</h1>
                        <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-300">
                            এক জায়গা থেকে নাগরিক খোঁজা, officer device revoke, SMS automation, reversible merge এবং database health snapshot দেখুন।
                        </p>
                    </div>
                    <button onClick={() => load(query)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-black hover:bg-white/15">
                        <RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </section>

            {data?.setupRequired && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-black text-amber-800">
                    প্রথমে Supabase SQL Editor-এ <code>database/72_citizen_governance_center.sql</code> চালান।
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric icon={Laptop} label="Active devices" value={data?.summary?.activeDevices} tone="bg-cyan-50 text-cyan-700" />
                <Metric icon={ShieldCheck} label="Granted consents" value={data?.summary?.grantedConsents} tone="bg-emerald-50 text-emerald-700" />
                <Metric icon={ToggleRight} label="Active SMS rules" value={data?.summary?.activeRules} tone="bg-violet-50 text-violet-700" />
                <Metric icon={ArchiveRestore} label="Reversible merges" value={data?.summary?.reversibleMerges} tone="bg-amber-50 text-amber-700" />
            </div>

            <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">
                {tabs.map(([id, label, Icon]) => (
                    <button key={id} onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${tab === id ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                        <Icon size={17} /> {label}
                    </button>
                ))}
            </div>

            {tab === 'search' && (
                <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                    <h2 className="text-xl font-black text-slate-900">Unified Citizen Search</h2>
                    <p className="mt-1 text-sm font-bold text-slate-500">নাম, NID বা জন্ম নিবন্ধন নম্বর দিয়ে সব household থেকে খুঁজুন।</p>
                    <form onSubmit={(event) => { event.preventDefault(); load(query); }} className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <input value={query} onChange={(event) => setQuery(event.target.value)} minLength={2} placeholder="নাম / NID / জন্ম নিবন্ধন" className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-teal-500" />
                        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-6 py-3 font-black text-white hover:bg-teal-700"><Search size={18} /> খুঁজুন</button>
                    </form>
                    <div className="mt-5 grid gap-3 lg:grid-cols-2">
                        {(data?.citizens || []).map((citizen) => (
                            <article key={citizen.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-black text-slate-900">{citizen.bn_name || citizen.name || 'নাম নেই'}</p>
                                        <p className="mt-1 text-xs font-bold text-slate-500">বাড়ি: {citizen.household?.house_no || '—'} · {citizen.household?.owner_name || 'মালিক অজানা'}</p>
                                    </div>
                                    <Users size={20} className="text-teal-600" />
                                </div>
                                <div className="mt-3 grid gap-1 text-xs font-bold text-slate-600 sm:grid-cols-2">
                                    <span>NID: {citizen.nid || 'নেই'}</span>
                                    <span>জন্ম নিবন্ধন: {citizen.birth_reg_no || 'নেই'}</span>
                                    <span>রক্ত: {citizen.blood_group || 'অজানা'}</span>
                                    <span>ফোন: {citizen.household?.phone || 'নেই'}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                    {query.length >= 2 && !(data?.citizens || []).length && <p className="mt-6 text-center text-sm font-bold text-slate-400">কোনো নাগরিক পাওয়া যায়নি।</p>}
                </section>
            )}

            {tab === 'devices' && (
                <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-5"><h2 className="text-xl font-black">Officer Device Management</h2></div>
                    <div className="divide-y divide-slate-100">
                        {(data?.devices || []).map((device) => (
                            <div key={device.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-start gap-3">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700"><Smartphone size={20} /></span>
                                    <div>
                                        <p className="font-black text-slate-900">{device.profile?.first_name} {device.profile?.last_name}</p>
                                        <p className="text-xs font-bold text-slate-500">{device.profile?.role} · {device.device_name || device.platform}</p>
                                        <p className="mt-1 text-xs text-slate-400">শেষ দেখা: {formatDate(device.last_seen_at)}</p>
                                    </div>
                                </div>
                                <button onClick={() => action({ action: device.revoked_at ? 'restore_device' : 'revoke_device', id: device.id }, device.revoked_at ? 'Device restored' : 'Device revoked')} disabled={working.endsWith(device.id)} className={`rounded-xl px-4 py-2 text-xs font-black ${device.revoked_at ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                    {device.revoked_at ? 'Restore' : 'Revoke'}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {tab === 'sms' && (
                <section className="grid gap-4 lg:grid-cols-2">
                    {(data?.rules || []).map((rule) => (
                        <article key={rule.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div><p className="font-black text-slate-900">{rule.title}</p><p className="mt-2 text-sm font-bold leading-6 text-slate-500">{rule.description}</p></div>
                                <button onClick={() => action({ action: 'save_rule', id: rule.id, enabled: !rule.enabled, cooldownHours: rule.cooldown_hours, templateText: rule.template_text }, 'SMS rule updated')} className={rule.enabled ? 'text-teal-600' : 'text-slate-400'}>
                                    {rule.enabled ? <ToggleRight size={34} /> : <ToggleLeft size={34} />}
                                </button>
                            </div>
                            <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-xs font-black text-slate-600">
                                <span>{rule.trigger_type}</span><span>{rule.cooldown_hours}h cooldown</span>
                            </div>
                        </article>
                    ))}
                </section>
            )}

            {tab === 'backup' && (
                <div className="grid gap-5 xl:grid-cols-2">
                    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div><h2 className="text-xl font-black">Recovery checkpoints</h2><p className="mt-1 text-sm font-bold text-slate-500">Critical table count ও system health snapshot রাখুন।</p></div>
                            <button onClick={() => action({ action: 'create_snapshot' }, 'Recovery checkpoint created')} className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-black text-white">Create</button>
                        </div>
                        <div className="mt-5 space-y-3">
                            {(data?.snapshots || []).map((item) => (
                                <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                                    <div className="flex items-center justify-between gap-3"><p className="font-black">{item.label}</p><CheckCircle2 size={17} className="text-emerald-600" /></div>
                                    <p className="mt-1 text-xs font-bold text-slate-400">{formatDate(item.created_at)} · {Object.keys(item.summary || {}).length} tables</p>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-xl font-black">Merge history</h2>
                        <p className="mt-1 text-sm font-bold text-slate-500">Safe merge ভুল হলে এখান থেকে rollback করুন।</p>
                        <div className="mt-5 space-y-3">
                            {(data?.merges || []).map((item) => (
                                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                                    <p className="font-black text-slate-900">{item.duplicate?.bn_name || item.duplicate?.name || 'Duplicate'} → {item.primary?.bn_name || item.primary?.name || 'Primary'}</p>
                                    <p className="mt-1 text-xs font-bold text-slate-400">{formatDate(item.merged_at)} · {item.status}</p>
                                    {item.status === 'completed' && <button onClick={() => action({ action: 'rollback_merge', id: item.id }, 'Merge rolled back')} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700"><Undo2 size={14} /> Rollback</button>}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

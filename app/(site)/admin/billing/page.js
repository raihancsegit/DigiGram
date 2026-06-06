"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle, Banknote, CheckCircle2, Clock3, CreditCard,
    Loader2, RefreshCw, Settings2, ShieldCheck, XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authenticatedFetch } from '@/lib/utils/authenticated-fetch';

const money = (value) => `৳${Number(value || 0).toLocaleString('bn-BD')}`;
const dateText = (value) => value ? new Date(value).toLocaleString('bn-BD') : '';

export default function AdminBillingPage() {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState('');
    const [error, setError] = useState('');
    const [setupRequired, setSetupRequired] = useState(false);
    const [filter, setFilter] = useState('pending');
    const [gateway, setGateway] = useState({
        provider: 'bkash',
        displayName: 'bKash',
        accountNumber: '',
        instructions: 'Payment করে transaction ID জমা দিন।',
        isActive: false,
        testMode: true
    });

    const loadOverview = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await authenticatedFetch('/api/admin/payments', { cache: 'no-store' });
            const result = await response.json();
            if (!response.ok) {
                setSetupRequired(Boolean(result.setupRequired));
                throw new Error(result.error || 'Payment overview failed');
            }
            setOverview(result.data);
            setSetupRequired(false);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOverview();
    }, [loadOverview]);

    const rows = useMemo(() => {
        const list = overview?.transactions || [];
        return filter === 'all' ? list : list.filter((item) => item.status === filter);
    }, [filter, overview]);

    async function review(paymentId, decision) {
        setActionId(paymentId);
        try {
            const response = await authenticatedFetch('/api/admin/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'review', paymentId, decision })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Payment review failed');
            toast.success(decision === 'approve' ? 'Payment verified হয়েছে' : 'Payment rejected হয়েছে');
            await loadOverview();
        } catch (requestError) {
            toast.error(requestError.message);
        } finally {
            setActionId('');
        }
    }

    async function saveGateway(event) {
        event.preventDefault();
        setActionId('gateway');
        try {
            const response = await authenticatedFetch('/api/admin/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'gateway', ...gateway })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Gateway save failed');
            toast.success('Payment method save হয়েছে');
            await loadOverview();
        } catch (requestError) {
            toast.error(requestError.message);
        } finally {
            setActionId('');
        }
    }

    return (
        <div className="space-y-7 pb-20">
            <section className="overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-xl sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-teal-300">
                            <ShieldCheck size={15} /> DigiGram payment control
                        </div>
                        <h1 className="text-3xl font-black sm:text-4xl">Billing ও Payment Center</h1>
                        <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-slate-400">
                            Citizen tax ও service payment verify করুন, revenue দেখুন এবং payment method configure করুন।
                        </p>
                    </div>
                    <button onClick={loadOverview} disabled={loading} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 text-sm font-black hover:bg-white/15">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </section>

            {setupRequired && (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={21} />
                        <div>
                            <h2 className="font-black text-amber-950">Payment database setup চালানো বাকি</h2>
                            <p className="mt-1 text-sm font-bold text-amber-800">
                                Supabase SQL Editor-এ <code className="rounded bg-amber-100 px-1.5 py-1">database/64_unified_payment_center.sql</code> চালান।
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {error && !setupRequired && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose-800">{error}</div>}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat icon={Clock3} label="Pending" value={overview?.stats?.pending || 0} tone="amber" />
                <Stat icon={CheckCircle2} label="Verified" value={overview?.stats?.verified || 0} tone="emerald" />
                <Stat icon={XCircle} label="Rejected" value={overview?.stats?.rejected || 0} tone="rose" />
                <Stat icon={Banknote} label="Revenue" value={money(overview?.stats?.verifiedRevenue || 0)} tone="teal" raw />
            </div>

            <section className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Payment verification</h2>
                        <p className="mt-1 text-sm font-bold text-slate-500">Approve করলে bill, receipt ও payment status update হবে।</p>
                    </div>
                    <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                        {['pending', 'verified', 'rejected', 'all'].map((value) => (
                            <button key={value} onClick={() => setFilter(value)} className={`shrink-0 rounded-xl px-4 py-2 text-xs font-black capitalize ${filter === value ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                {value}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="divide-y divide-slate-100">
                    {loading && !overview ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-teal-600" /></div>
                    ) : rows.length === 0 ? (
                        <p className="p-12 text-center text-sm font-bold text-slate-500">এই status-এ কোনো payment নেই।</p>
                    ) : rows.map((item) => (
                        <div key={item.id} className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1.4fr_.7fr_.8fr_auto] lg:items-center">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-black text-slate-900">{item.payment_no}</p>
                                    <Status status={item.status} />
                                </div>
                                <p className="mt-2 truncate text-sm font-bold text-slate-600">{item.description || item.reference_type}</p>
                                <p className="mt-1 text-xs font-bold text-slate-400">{item.payer_name || 'Citizen'} · {item.payer_phone} · {dateText(item.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Method</p>
                                <p className="mt-1 font-black text-slate-800">{item.provider}</p>
                                <p className="text-xs font-bold text-slate-500">{item.provider_transaction_id || 'No TRX ID'}</p>
                            </div>
                            <p className="text-2xl font-black text-slate-950">{money(item.amount)}</p>
                            {item.status === 'pending' ? (
                                <div className="flex gap-2">
                                    <button onClick={() => review(item.id, 'reject')} disabled={actionId === item.id} className="rounded-xl bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 disabled:opacity-50">Reject</button>
                                    <button onClick={() => review(item.id, 'approve')} disabled={actionId === item.id} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50">
                                        {actionId === item.id && <Loader2 size={13} className="animate-spin" />} Verify
                                    </button>
                                </div>
                            ) : <p className="text-xs font-bold text-slate-400">{dateText(item.reviewed_at)}</p>}
                        </div>
                    ))}
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
                <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="mb-5 flex items-center gap-3">
                        <Settings2 className="text-teal-700" />
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Payment method</h2>
                            <p className="text-sm font-bold text-slate-500">Public payment page-এ কোন method দেখাবে।</p>
                        </div>
                    </div>
                    <form onSubmit={saveGateway} className="grid gap-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input label="Provider key" value={gateway.provider} onChange={(value) => setGateway({ ...gateway, provider: value })} />
                            <Input label="Display name" value={gateway.displayName} onChange={(value) => setGateway({ ...gateway, displayName: value })} />
                        </div>
                        <Input label="Merchant / account number" value={gateway.accountNumber} onChange={(value) => setGateway({ ...gateway, accountNumber: value })} />
                        <label className="grid gap-2 text-sm font-black text-slate-700">
                            Citizen instruction
                            <textarea value={gateway.instructions} onChange={(event) => setGateway({ ...gateway, instructions: event.target.value })} rows={3} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500" />
                        </label>
                        <div className="flex flex-wrap gap-4">
                            <Check label="Active" checked={gateway.isActive} onChange={(checked) => setGateway({ ...gateway, isActive: checked })} />
                            <Check label="Test mode" checked={gateway.testMode} onChange={(checked) => setGateway({ ...gateway, testMode: checked })} />
                        </div>
                        <button disabled={actionId === 'gateway'} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 font-black text-white disabled:opacity-50">
                            {actionId === 'gateway' ? <Loader2 size={17} className="animate-spin" /> : <CreditCard size={17} />}
                            Save method
                        </button>
                    </form>
                </section>

                <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <h2 className="text-xl font-black text-slate-900">Configured gateways</h2>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {(overview?.gateways || []).map((item) => (
                            <button
                                type="button"
                                key={item.id}
                                onClick={() => setGateway({
                                    provider: item.provider,
                                    displayName: item.display_name,
                                    accountNumber: item.account_number || '',
                                    instructions: item.instructions || '',
                                    isActive: item.is_active,
                                    testMode: item.test_mode
                                })}
                                className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-teal-300 hover:bg-teal-50/40"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <p className="font-black text-slate-900">{item.display_name}</p>
                                    <span className={`h-2.5 w-2.5 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                </div>
                                <p className="mt-2 text-xs font-bold text-slate-500">{item.account_number || 'Account number নেই'}</p>
                                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{item.test_mode ? 'Test mode' : 'Live/manual'}</p>
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function Stat({ icon: Icon, label, value, tone, raw }) {
    const tones = {
        amber: 'bg-amber-50 text-amber-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        rose: 'bg-rose-50 text-rose-700',
        teal: 'bg-teal-50 text-teal-700'
    };
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tones[tone]}`}><Icon size={19} /></div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">{raw ? value : Number(value || 0).toLocaleString('bn-BD')}</p>
        </div>
    );
}

function Status({ status }) {
    const classes = status === 'verified'
        ? 'bg-emerald-50 text-emerald-700'
        : status === 'rejected'
            ? 'bg-rose-50 text-rose-700'
            : 'bg-amber-50 text-amber-700';
    return <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${classes}`}>{status}</span>;
}

function Input({ label, value, onChange }) {
    return (
        <label className="grid gap-2 text-sm font-black text-slate-700">
            {label}
            <input value={value} onChange={(event) => onChange(event.target.value)} required className="min-h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-teal-500" />
        </label>
    );
}

function Check({ label, checked, onChange }) {
    return (
        <label className="flex items-center gap-2 text-sm font-black text-slate-700">
            <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-teal-600" />
            {label}
        </label>
    );
}

"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Banknote, CheckCircle2, Clock3, CreditCard,
    FileCheck2, Loader2, Phone, ReceiptText, RefreshCw, ShieldCheck
} from 'lucide-react';

const money = (value) => `৳${Number(value || 0).toLocaleString('bn-BD')}`;
const dateText = (value) => value ? new Date(value).toLocaleString('bn-BD') : '';

async function postJson(url, payload) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
        const error = new Error(result.error || 'Request failed');
        error.setupRequired = result.setupRequired;
        error.migration = result.migration;
        throw error;
    }
    return result;
}

export default function CitizenPaymentPage() {
    const [phone, setPhone] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [debugCode, setDebugCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [overview, setOverview] = useState(null);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [selectedBill, setSelectedBill] = useState(null);
    const [payment, setPayment] = useState({ provider: '', transactionId: '', amount: '' });

    useEffect(() => {
        const value = new URLSearchParams(window.location.search).get('phone');
        if (value) setPhone(value);
    }, []);

    const pendingTransactions = useMemo(
        () => (overview?.transactions || []).filter((item) => item.status === 'pending'),
        [overview]
    );

    async function requestOtp() {
        setLoading(true);
        setError('');
        setNotice('');
        try {
            const result = await postJson('/api/citizen/otp', { phone });
            setDebugCode(result.debugCode || '');
            if (result.debugCode) setOtpCode(result.debugCode);
            setNotice('OTP পাঠানো হয়েছে। কোড দিয়ে payment center খুলুন।');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadOverview() {
        setLoading(true);
        setError('');
        try {
            const result = await postJson('/api/payments/citizen', { action: 'overview', phone, otpCode });
            setOverview(result.data);
            setSelectedBill(null);
            setNotice('আপনার payable bill ও payment history পাওয়া গেছে।');
        } catch (requestError) {
            setError(requestError.setupRequired
                ? `${requestError.message}। Supabase-এ ${requestError.migration} চালান।`
                : requestError.message);
        } finally {
            setLoading(false);
        }
    }

    function chooseBill(type, bill) {
        setSelectedBill({ type, bill });
        setPayment({
            provider: overview?.gateways?.[0]?.provider || '',
            transactionId: '',
            amount: String(bill.outstanding || '')
        });
        window.setTimeout(() => document.getElementById('payment-submit')?.scrollIntoView({ behavior: 'smooth' }), 50);
    }

    async function submitPayment(event) {
        event.preventDefault();
        setLoading(true);
        setError('');
        setNotice('');
        try {
            const result = await postJson('/api/payments/citizen', {
                action: 'submit',
                phone,
                otpCode,
                referenceType: selectedBill.type,
                referenceId: selectedBill.bill.id,
                amount: Number(payment.amount),
                provider: payment.provider,
                providerTransactionId: payment.transactionId
            });
            setNotice(`Payment ${result.data.payment_no} review-এর জন্য জমা হয়েছে।`);
            await loadOverview();
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 pb-24">
            <section className="bg-slate-950 px-4 py-10 text-white sm:py-14">
                <div className="mx-auto max-w-6xl">
                    <Link href="/citizen" className="mb-7 inline-flex items-center gap-2 text-sm font-black text-slate-300 hover:text-white">
                        <ArrowLeft size={17} /> Citizen center
                    </Link>
                    <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-teal-200">
                                <ShieldCheck size={15} /> OTP protected payment
                            </div>
                            <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
                                Tax ও service fee সহজে জমা দিন
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm font-bold leading-7 text-slate-400 sm:text-base">
                                আপনার phone OTP দিয়ে bill দেখুন, payment reference জমা দিন এবং verification status অনুসরণ করুন।
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                            <MiniStep number="১" label="OTP" />
                            <MiniStep number="২" label="Bill" />
                            <MiniStep number="৩" label="Pay" />
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto -mt-5 max-w-6xl space-y-6 px-4">
                <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                            <Phone size={21} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Phone verification</h2>
                            <p className="text-sm font-bold text-slate-500">Household বা application-এ ব্যবহৃত mobile number দিন।</p>
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <input
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="01XXXXXXXXX"
                            inputMode="tel"
                            className="min-h-12 rounded-2xl border border-slate-200 px-4 font-bold outline-none focus:border-teal-500"
                        />
                        <button type="button" onClick={requestOtp} disabled={loading || !phone} className="min-h-12 rounded-2xl bg-slate-900 px-6 font-black text-white disabled:opacity-50">
                            OTP নিন
                        </button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                        <input
                            value={otpCode}
                            onChange={(event) => setOtpCode(event.target.value)}
                            placeholder="OTP code"
                            inputMode="numeric"
                            className="min-h-12 rounded-2xl border border-slate-200 px-4 font-bold outline-none focus:border-teal-500"
                        />
                        <button type="button" onClick={loadOverview} disabled={loading || !otpCode} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-teal-600 px-6 font-black text-white disabled:opacity-50">
                            {loading ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
                            Bill দেখুন
                        </button>
                    </div>
                    {debugCode && <p className="mt-3 text-xs font-black text-amber-700">Development OTP: {debugCode}</p>}
                </section>

                {(notice || error) && (
                    <div className={`rounded-2xl border px-5 py-4 text-sm font-black ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                        {error || notice}
                    </div>
                )}

                {overview && (
                    <>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <BillPanel title="Holding tax" icon={Banknote}>
                                {(overview.taxes || []).length === 0 ? <Empty text="কোনো tax due নেই।" /> : overview.taxes.map((bill) => (
                                    <BillRow
                                        key={bill.id}
                                        title={bill.fiscal_year_label || bill.year || 'Holding tax'}
                                        subtitle={`${bill.household?.owner_name || ''} · Holding ${bill.household?.house_no || 'N/A'}`}
                                        amount={bill.outstanding}
                                        onPay={() => chooseBill('household_tax', bill)}
                                    />
                                ))}
                            </BillPanel>
                            <BillPanel title="Service fee" icon={FileCheck2}>
                                {(overview.services || []).length === 0 ? <Empty text="কোনো service fee due নেই।" /> : overview.services.map((bill) => (
                                    <BillRow
                                        key={bill.id}
                                        title={bill.request_type || 'Service request'}
                                        subtitle={bill.applicant_name || 'Applicant'}
                                        amount={bill.outstanding}
                                        onPay={() => chooseBill('service_request', bill)}
                                    />
                                ))}
                            </BillPanel>
                        </div>

                        {selectedBill && (
                            <form id="payment-submit" onSubmit={submitPayment} className="rounded-[28px] border border-teal-200 bg-white p-5 shadow-sm sm:p-7">
                                <div className="mb-6 flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-teal-700">Selected bill</p>
                                        <h2 className="mt-2 text-2xl font-black text-slate-900">
                                            {selectedBill.type === 'household_tax'
                                                ? selectedBill.bill.fiscal_year_label || 'Holding tax'
                                                : selectedBill.bill.request_type || 'Service fee'}
                                        </h2>
                                    </div>
                                    <span className="rounded-2xl bg-teal-50 px-4 py-2 text-lg font-black text-teal-800">
                                        {money(selectedBill.bill.outstanding)}
                                    </span>
                                </div>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <label className="grid gap-2 text-sm font-black text-slate-700">
                                        Payment method
                                        <select value={payment.provider} onChange={(event) => setPayment({ ...payment, provider: event.target.value })} required className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-teal-500">
                                            <option value="">Select</option>
                                            {(overview.gateways || []).map((gateway) => (
                                                <option key={gateway.provider} value={gateway.provider}>{gateway.display_name}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="grid gap-2 text-sm font-black text-slate-700">
                                        Amount
                                        <input type="number" min="1" max={selectedBill.bill.outstanding} value={payment.amount} onChange={(event) => setPayment({ ...payment, amount: event.target.value })} required className="min-h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-teal-500" />
                                    </label>
                                    <label className="grid gap-2 text-sm font-black text-slate-700">
                                        Transaction ID
                                        <input value={payment.transactionId} onChange={(event) => setPayment({ ...payment, transactionId: event.target.value })} placeholder="Cash হলে খালি রাখুন" className="min-h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-teal-500" />
                                    </label>
                                </div>
                                <button disabled={loading || !payment.provider} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 font-black text-white disabled:opacity-50 sm:w-auto">
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                                    Payment review-তে পাঠান
                                </button>
                            </form>
                        )}

                        <BillPanel title="Payment history" icon={ReceiptText}>
                            {(overview.transactions || []).length === 0 ? <Empty text="এখনও payment জমা হয়নি।" /> : overview.transactions.map((item) => (
                                <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-black text-slate-900">{item.payment_no}</p>
                                        <p className="mt-1 text-xs font-bold text-slate-500">{item.description} · {dateText(item.created_at)}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-black text-slate-900">{money(item.amount)}</span>
                                        <Status status={item.status} />
                                    </div>
                                </div>
                            ))}
                        </BillPanel>

                        {pendingTransactions.length > 0 && (
                            <p className="text-center text-xs font-bold text-slate-500">
                                Pending payment officer verify করার পর receipt ও paid status update হবে।
                            </p>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}

function MiniStep({ number, label }) {
    return (
        <div className="text-center">
            <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-teal-400 text-sm font-black text-slate-950">{number}</span>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-300">{label}</p>
        </div>
    );
}

function BillPanel({ title, icon: Icon, children }) {
    return (
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><Icon size={20} /></div>
                <h2 className="text-xl font-black text-slate-900">{title}</h2>
            </div>
            <div className="space-y-3">{children}</div>
        </section>
    );
}

function BillRow({ title, subtitle, amount, onPay }) {
    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="font-black text-slate-900">{title}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{subtitle}</p>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="font-black text-rose-700">{money(amount)}</span>
                <button type="button" onClick={onPay} className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-black text-white">Pay</button>
            </div>
        </div>
    );
}

function Status({ status }) {
    const verified = status === 'verified';
    const rejected = status === 'rejected';
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase ${
            verified ? 'bg-emerald-50 text-emerald-700' : rejected ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
        }`}>
            {verified ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
            {status}
        </span>
    );
}

function Empty({ text }) {
    return <p className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm font-bold text-slate-500">{text}</p>;
}

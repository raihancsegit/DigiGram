'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    CalendarClock,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    FileSearch,
    Loader2,
    Phone,
    Printer,
    QrCode,
    Search,
    ShieldCheck,
    TicketCheck
} from 'lucide-react';

const STATUS_STEPS = [
    ['submitted', 'Submitted'],
    ['reviewing', 'Reviewing'],
    ['processing', 'Processing'],
    ['ready', 'Ready'],
    ['completed', 'Done']
];

const STATUS_INDEX = {
    pending: 0,
    submitted: 0,
    reviewing: 1,
    assigned: 1,
    processing: 2,
    approved: 2,
    confirmed: 2,
    ready: 3,
    completed: 4,
    resolved: 4,
    closed: 4
};

function formatDate(value) {
    if (!value) return 'Not set';
    return new Date(value).toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

function toBnDigits(value) {
    return String(value ?? '').replace(/\d/g, (digit) => '০১২৩৪৫৬৭৮৯'[digit]);
}

function statusTone(status) {
    if (['completed', 'resolved', 'closed'].includes(status)) return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    if (['rejected', 'cancelled', 'no_show'].includes(status)) return 'border-rose-200 bg-rose-50 text-rose-800';
    if (['ready', 'confirmed', 'approved'].includes(status)) return 'border-teal-200 bg-teal-50 text-teal-800';
    return 'border-amber-200 bg-amber-50 text-amber-800';
}

export default function TrackLookupPage() {
    const [form, setForm] = useState({ trackingId: '', phone: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const currentStep = useMemo(() => {
        if (!result) return 0;
        return STATUS_INDEX[result.status] ?? 0;
    }, [result]);

    const publicTrackUrl = useMemo(() => {
        if (!result || typeof window === 'undefined') return '';
        const params = new URLSearchParams({
            id: result.id,
            phone: form.phone,
            type: result.type
        });
        return `${window.location.origin}/track?${params.toString()}`;
    }, [form.phone, result]);

    const qrImageUrl = publicTrackUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicTrackUrl)}`
        : '';

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const trackingId = params.get('id') || params.get('trackingId') || '';
        const phone = params.get('phone') || '';
        const type = params.get('type') || '';
        if (trackingId || phone || type) {
            setForm({
                trackingId,
                phone,
                type: ['service', 'complaint', 'appointment', 'life_support'].includes(type) ? type : ''
            });
        }
    }, []);

    async function submit(event) {
        event.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const response = await fetch('/api/citizen/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Tracking lookup failed');
            setResult(payload.data);
        } catch (lookupError) {
            setError(lookupError.message || 'Tracking lookup failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#f4f7fb] px-4 py-5 text-slate-900 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-5xl">
                <Link
                    href="/citizen"
                    className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:text-teal-700"
                >
                    <ArrowLeft size={16} />
                    Citizen portal
                </Link>

                <section className="overflow-hidden rounded-[30px] bg-slate-950 text-white shadow-xl shadow-slate-200/70">
                    <div className="grid gap-6 p-6 lg:grid-cols-[1fr_0.9fr] lg:p-8">
                        <div>
                            <p className="inline-flex items-center gap-2 rounded-full bg-teal-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-teal-200">
                                <FileSearch size={15} />
                                Tracking Center
                            </p>
                            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
                                Tracking ID diye citizen request status check korun
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-slate-300">
                                Service request, complaint, office serial, and citizen support status ek jaygay. Phone number match na korle data show hobe na.
                            </p>
                        </div>

                        <form onSubmit={submit} className="rounded-[26px] bg-white p-4 text-slate-900 shadow-2xl sm:p-5">
                            <div className="grid gap-3">
                                <label className="grid gap-1">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Tracking ID</span>
                                    <input
                                        required
                                        value={form.trackingId}
                                        onChange={(event) => setForm((current) => ({ ...current, trackingId: event.target.value }))}
                                        placeholder="Request ID or certificate no"
                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-teal-400"
                                    />
                                </label>
                                <label className="grid gap-1">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Phone</span>
                                    <input
                                        required
                                        type="tel"
                                        value={form.phone}
                                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                                        placeholder="01XXXXXXXXX"
                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-teal-400"
                                    />
                                </label>
                                <label className="grid gap-1">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Type</span>
                                    <select
                                        value={form.type}
                                        onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-teal-400"
                                    >
                                        <option value="">Auto detect</option>
                                        <option value="service">Service request</option>
                                        <option value="complaint">Complaint</option>
                                        <option value="appointment">Office serial</option>
                                        <option value="life_support">Citizen support</option>
                                    </select>
                                </label>
                                <button
                                    disabled={loading}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-black text-white transition hover:bg-teal-700 disabled:opacity-60"
                                >
                                    {loading ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
                                    Check status
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                {error && (
                    <div className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm font-bold text-rose-800">
                        {error}
                    </div>
                )}

                {result && (
                    <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">{result.typeLabel}</p>
                                    <h2 className="mt-2 text-2xl font-black text-slate-950">{result.title}</h2>
                                    <p className="mt-1 break-all text-xs font-bold text-slate-400">ID: {result.id}</p>
                                </div>
                                <span className={`w-fit rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wider ${statusTone(result.status)}`}>
                                    {result.status}
                                </span>
                            </div>

                            <div className="mt-6 grid gap-3 sm:grid-cols-5">
                                {STATUS_STEPS.map(([key, label], index) => {
                                    const done = index <= currentStep;
                                    return (
                                        <div key={key} className={`rounded-2xl border p-3 ${
                                            done ? 'border-teal-200 bg-teal-50 text-teal-800' : 'border-slate-200 bg-slate-50 text-slate-400'
                                        }`}>
                                            <CheckCircle2 size={18} />
                                            <p className="mt-2 text-xs font-black">{label}</p>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="mt-1 shrink-0 text-teal-700" size={22} />
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Next action</p>
                                        <p className="mt-1 text-sm font-black leading-6 text-slate-800">{result.nextAction}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                <MiniInfo icon={Phone} label="Phone" value={result.maskedPhone} />
                                <MiniInfo icon={Clock3} label="Submitted" value={formatDate(result.submittedAt)} />
                                <MiniInfo icon={CalendarClock} label="Target date" value={formatDate(result.sla?.dueDate)} />
                                {result.serialNo && <MiniInfo icon={TicketCheck} label="Serial" value={toBnDigits(result.serialNo)} />}
                                {result.scheduledAt && <MiniInfo icon={CalendarClock} label="Schedule" value={formatDate(result.scheduledAt)} />}
                                {result.collectionDate && <MiniInfo icon={ClipboardCheck} label="Collection" value={formatDate(result.collectionDate)} />}
                            </div>

                            {result.feedback && (
                                <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                                    {result.feedback}
                                </div>
                            )}
                        </div>

                        <aside className="space-y-5">
                            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm print:border-slate-400">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Citizen slip</p>
                                        <h3 className="mt-1 text-xl font-black text-slate-950">Print / QR</h3>
                                    </div>
                                    <QrCode className="text-teal-700" size={24} />
                                </div>
                                <div className="mt-4 flex flex-col items-center rounded-3xl bg-slate-50 p-4">
                                    {qrImageUrl ? (
                                        <div
                                            aria-label="Tracking QR code"
                                            className="h-[180px] w-[180px] rounded-2xl bg-white bg-contain bg-center bg-no-repeat p-3 shadow-sm"
                                            style={{ backgroundImage: `url("${qrImageUrl}")` }}
                                        />
                                    ) : (
                                        <div className="flex h-[180px] w-[180px] items-center justify-center rounded-2xl bg-white text-slate-300">
                                            <QrCode size={80} />
                                        </div>
                                    )}
                                    <p className="mt-3 break-all text-center text-xs font-bold text-slate-500">{publicTrackUrl || result.id}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
                                >
                                    <Printer size={17} />
                                    Print slip
                                </button>
                            </div>

                            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">SLA signal</p>
                                <p className="mt-2 text-4xl font-black text-slate-950">{toBnDigits(result.sla?.progress || 0)}%</p>
                                <p className="mt-1 text-sm font-bold text-slate-500">
                                    {toBnDigits(result.sla?.ageDays || 0)} days passed, target {toBnDigits(result.sla?.targetDays || 0)} days.
                                </p>
                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.min(100, Math.max(6, result.sla?.progress || 0))}%` }} />
                                </div>
                            </div>

                            <div className="rounded-[30px] border border-teal-100 bg-teal-50 p-5">
                                <p className="text-lg font-black text-slate-950">Need full inbox?</p>
                                <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                                    OTP diye Citizen Portal-e login korle sob request, payment, reminder, privacy history ek sathe dekhte parben.
                                </p>
                                <Link href="/citizen" className="mt-4 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
                                    Open citizen portal
                                </Link>
                            </div>
                        </aside>
                    </section>
                )}
            </div>
        </main>
    );
}

function MiniInfo({ icon: Icon, label, value }) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <Icon size={18} className="text-teal-700" />
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-1 break-words text-sm font-black text-slate-900">{value || 'Not set'}</p>
        </div>
    );
}

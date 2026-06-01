"use client";

import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, CheckCircle2, Clock3, Loader2, Search, Send, XCircle } from 'lucide-react';
import { toBnDigits } from '@/lib/utils/format';

const STATUS_META = {
    submitted: { label: 'নতুন', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock3 },
    reviewing: { label: 'রিভিউ', color: 'bg-sky-50 text-sky-700 border-sky-100', icon: Clock3 },
    scheduled: { label: 'সময় নির্ধারিত', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: CalendarCheck },
    completed: { label: 'সম্পন্ন', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
    rejected: { label: 'বন্ধ', color: 'bg-rose-50 text-rose-700 border-rose-100', icon: XCircle },
    no_show: { label: 'আসেনি', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle }
};

const STATUS_OPTIONS = [
    ['submitted', 'নতুন'],
    ['reviewing', 'রিভিউ চলছে'],
    ['scheduled', 'সময় নির্ধারিত'],
    ['completed', 'সম্পন্ন'],
    ['rejected', 'বন্ধ'],
    ['no_show', 'উপস্থিত হয়নি']
];

const PRIORITY_OPTIONS = [
    ['low', 'কম'],
    ['normal', 'সাধারণ'],
    ['urgent', 'জরুরি'],
    ['emergency', 'খুব জরুরি']
];

export default function CitizenAppointmentManager({ scopeType = 'union', scopeId, title = 'Office serial queue' }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('all');
    const [feedback, setFeedback] = useState({});
    const [officerNotes, setOfficerNotes] = useState({});
    const [scheduledAt, setScheduledAt] = useState({});
    const [serialNo, setSerialNo] = useState({});
    const [notice, setNotice] = useState('');

    const loadAppointments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (scopeType) params.set('scopeType', scopeType);
            if (scopeId) params.set('scopeId', scopeId);
            if (status !== 'all') params.set('status', status);
            const response = await fetch(`/api/citizen/appointments/manage?${params.toString()}`);
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Appointment load failed');
            setItems(result.data || []);
        } catch (error) {
            setNotice(error.message || 'Appointment load করা যায়নি।');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, [scopeType, scopeId, status]);

    const filteredItems = useMemo(() => {
        const search = query.trim().toLowerCase();
        if (!search) return items;
        return items.filter((item) => [
            item.title,
            item.citizen_name,
            item.phone,
            item.location_text,
            item.description,
            item.serial_no
        ].some((value) => String(value || '').toLowerCase().includes(search)));
    }, [items, query]);

    const stats = useMemo(() => {
        return items.reduce((acc, item) => {
            acc.total += 1;
            acc[item.status] = (acc[item.status] || 0) + 1;
            if (!['completed', 'rejected', 'no_show'].includes(item.status)) acc.open += 1;
            return acc;
        }, { total: 0, open: 0, submitted: 0, reviewing: 0, scheduled: 0, completed: 0, rejected: 0, no_show: 0 });
    }, [items]);

    const updateAppointment = async (item, nextStatus) => {
        setSavingId(item.id);
        setNotice('');
        try {
            const response = await fetch('/api/citizen/appointments/manage', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: item.id,
                    status: nextStatus,
                    priority: item.priority || 'normal',
                    feedback: feedback[item.id] ?? item.feedback ?? '',
                    officerNote: officerNotes[item.id] ?? item.officer_note ?? '',
                    scheduledAt: scheduledAt[item.id] ?? item.scheduled_at ?? '',
                    serialNo: serialNo[item.id] ?? item.serial_no ?? ''
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Update failed');
            setItems((current) => current.map((row) => row.id === item.id ? result.data : row));
            setNotice('Appointment update হয়েছে। Citizen inbox/SMS update queue হয়েছে।');
        } catch (error) {
            setNotice(error.message || 'Update করা যায়নি।');
        } finally {
            setSavingId(null);
        }
    };

    return (
        <section className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
                            <CalendarCheck size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-500">Citizen Appointment Desk</p>
                            <h3 className="mt-1 text-2xl font-black text-slate-900">{title}</h3>
                            <p className="mt-1 text-sm font-bold text-slate-500">Office visit, chairman/member meeting, certificate help এবং tax help serial manage করুন।</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        {[
                            ['total', 'মোট'],
                            ['open', 'চলমান'],
                            ['submitted', 'নতুন'],
                            ['scheduled', 'সময় দেয়া'],
                            ['completed', 'সম্পন্ন']
                        ].map(([key, label]) => (
                            <div key={key} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
                                <p className="mt-1 text-xl font-black text-slate-900">{toBnDigits(String(stats[key] || 0))}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="নাম, ফোন, serial বা কাজ দিয়ে খুঁজুন"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold outline-none transition focus:border-indigo-300 focus:bg-white"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white"
                    >
                        <option value="all">সব status</option>
                        {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </div>
            </div>

            {notice && <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-black text-teal-700">{notice}</div>}

            {loading ? (
                <div className="rounded-[32px] border border-dashed border-slate-200 bg-white py-16 text-center">
                    <Loader2 className="mx-auto animate-spin text-indigo-500" size={34} />
                    <p className="mt-4 text-sm font-black text-slate-400">Appointment queue load হচ্ছে...</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="rounded-[32px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                    <CalendarCheck className="mx-auto text-slate-300" size={42} />
                    <p className="mt-4 text-lg font-black text-slate-700">এই filter-এ কোনো appointment নেই</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {filteredItems.map((item) => {
                        const meta = STATUS_META[item.status] || STATUS_META.submitted;
                        const Icon = meta.icon;
                        return (
                            <article key={item.id} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-lg">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black ${meta.color}`}>
                                                <Icon size={13} /> {meta.label}
                                            </span>
                                            {item.serial_no && <span className="rounded-full bg-teal-50 px-3 py-1 text-[11px] font-black text-teal-700">Serial {toBnDigits(item.serial_no)}</span>}
                                        </div>
                                        <h4 className="mt-3 text-xl font-black leading-tight text-slate-900">{item.title}</h4>
                                        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-500">{item.description || item.location_text || 'Office visit request'}</p>
                                    </div>
                                    <div className="shrink-0 rounded-2xl bg-slate-50 px-4 py-3 text-left sm:text-right">
                                        <p className="text-[10px] font-black uppercase text-slate-400">Request</p>
                                        <p className="text-sm font-black text-slate-700">{new Date(item.created_at).toLocaleDateString('bn-BD')}</p>
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-1 gap-3 border-y border-slate-100 py-4 sm:grid-cols-3">
                                    <Info label="নাগরিক" value={item.citizen_name || 'নাম নেই'} />
                                    <Info label="মোবাইল" value={item.phone} />
                                    <Info label="পছন্দের সময়" value={[item.preferred_date, item.preferred_time_slot].filter(Boolean).join(' · ') || 'দেওয়া হয়নি'} />
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <input
                                        type="datetime-local"
                                        value={(scheduledAt[item.id] ?? item.scheduled_at ?? '').slice(0, 16)}
                                        onChange={(event) => setScheduledAt((current) => ({ ...current, [item.id]: event.target.value }))}
                                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"
                                    />
                                    <input
                                        type="number"
                                        value={serialNo[item.id] ?? item.serial_no ?? ''}
                                        onChange={(event) => setSerialNo((current) => ({ ...current, [item.id]: event.target.value }))}
                                        placeholder="Serial no"
                                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"
                                    />
                                </div>

                                <textarea
                                    value={feedback[item.id] ?? item.feedback ?? ''}
                                    onChange={(event) => setFeedback((current) => ({ ...current, [item.id]: event.target.value }))}
                                    placeholder="নাগরিককে দেখানোর feedback লিখুন"
                                    rows={3}
                                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold outline-none transition focus:border-indigo-300 focus:bg-white"
                                />
                                <textarea
                                    value={officerNotes[item.id] ?? item.officer_note ?? ''}
                                    onChange={(event) => setOfficerNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                                    placeholder="Internal officer note"
                                    rows={2}
                                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold outline-none transition focus:border-indigo-300"
                                />

                                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                    <select
                                        defaultValue={item.status}
                                        onChange={(event) => updateAppointment(item, event.target.value)}
                                        disabled={savingId === item.id}
                                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
                                    >
                                        {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                    </select>
                                    <select
                                        defaultValue={item.priority || 'normal'}
                                        onChange={(event) => setItems((current) => current.map((row) => row.id === item.id ? { ...row, priority: event.target.value } : row))}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
                                    >
                                        {PRIORITY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                    </select>
                                    <button
                                        onClick={() => updateAppointment(item, item.status)}
                                        disabled={savingId === item.id}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {savingId === item.id ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                        Save
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

function Info({ label, value }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 break-words text-sm font-black text-slate-800">{value}</p>
        </div>
    );
}

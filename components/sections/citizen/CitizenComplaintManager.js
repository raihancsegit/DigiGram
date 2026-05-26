"use client";

import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    Loader2,
    MessageSquareText,
    Search,
    Send,
    ShieldCheck,
    XCircle
} from 'lucide-react';
import { toBnDigits } from '@/lib/utils/format';

const STATUS_META = {
    submitted: { label: 'নতুন', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock3 },
    reviewing: { label: 'পর্যালোচনা', color: 'bg-sky-50 text-sky-700 border-sky-100', icon: MessageSquareText },
    assigned: { label: 'দায়িত্বপ্রাপ্ত', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: ShieldCheck },
    resolved: { label: 'সমাধান', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
    rejected: { label: 'বন্ধ', color: 'bg-rose-50 text-rose-700 border-rose-100', icon: XCircle }
};

const TYPE_LABELS = {
    road: 'রাস্তা',
    electricity: 'বিদ্যুৎ',
    light: 'লাইট',
    water: 'পানি',
    certificate: 'সনদ/সেবা',
    certificate_delay: 'সনদ/আবেদন',
    general: 'সাধারণ'
};

const PRIORITY_META = {
    low: { label: 'কম', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    normal: { label: 'সাধারণ', color: 'bg-teal-50 text-teal-700 border-teal-100' },
    urgent: { label: 'জরুরি', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    emergency: { label: 'খুব জরুরি', color: 'bg-rose-50 text-rose-700 border-rose-100' }
};

const STATUS_OPTIONS = [
    ['submitted', 'নতুন'],
    ['reviewing', 'পর্যালোচনা চলছে'],
    ['assigned', 'দায়িত্ব দেওয়া হয়েছে'],
    ['resolved', 'সমাধান হয়েছে'],
    ['rejected', 'বন্ধ করা হয়েছে']
];

export default function CitizenComplaintManager({ scopeType = 'union', scopeId, title = 'নাগরিক অভিযোগ' }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [feedback, setFeedback] = useState({});
    const [officerNotes, setOfficerNotes] = useState({});
    const [notice, setNotice] = useState('');

    const loadComplaints = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (scopeType) params.set('scopeType', scopeType);
            if (scopeId) params.set('scopeId', scopeId);
            if (status !== 'all') params.set('status', status);

            const response = await fetch(`/api/citizen/complaints/manage?${params.toString()}`);
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Complaint load failed');
            setItems(result.data || []);
        } catch (error) {
            setNotice(error.message || 'অভিযোগ load করা যায়নি।');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadComplaints();
    }, [scopeType, scopeId, status]);

    const filteredItems = useMemo(() => {
        const search = query.trim().toLowerCase();
        return items.filter((item) => {
            if (priorityFilter !== 'all' && (item.priority || 'normal') !== priorityFilter) return false;
            if (!search) return true;
            return [
            item.title,
            item.citizen_name,
            item.phone,
            item.location_text,
            item.description
            ].some((value) => String(value || '').toLowerCase().includes(search));
        });
    }, [items, query, priorityFilter]);

    const stats = useMemo(() => {
        return items.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            acc[item.priority || 'normal'] = (acc[item.priority || 'normal'] || 0) + 1;
            acc.total += 1;
            if (!['resolved', 'rejected'].includes(item.status)) {
                const ageDays = Math.max(0, Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86400000));
                acc.openAgeTotal += ageDays;
                acc.open += 1;
            }
            acc.categories[item.complaint_type || 'general'] = (acc.categories[item.complaint_type || 'general'] || 0) + 1;
            return acc;
        }, { total: 0, open: 0, openAgeTotal: 0, submitted: 0, reviewing: 0, assigned: 0, resolved: 0, rejected: 0, low: 0, normal: 0, urgent: 0, emergency: 0, categories: {} });
    }, [items]);

    const topCategories = useMemo(() => {
        return Object.entries(stats.categories || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);
    }, [stats.categories]);

    const updateComplaint = async (item, nextStatus) => {
        setSavingId(item.id);
        setNotice('');
        try {
            const response = await fetch('/api/citizen/complaints/manage', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: item.id,
                    status: nextStatus,
                    priority: item.priority || 'normal',
                    feedback: feedback[item.id] || item.feedback || '',
                    officerNote: officerNotes[item.id] ?? item.officer_note ?? ''
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Update failed');
            setItems((current) => current.map((row) => row.id === item.id ? result.data : row));
            setNotice('অভিযোগ আপডেট হয়েছে। Citizen inbox-এ আপডেট দেখা যাবে।');
        } catch (error) {
            setNotice(error.message || 'আপডেট করা যায়নি।');
        } finally {
            setSavingId(null);
        }
    };

    return (
        <section className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-rose-50 text-rose-600">
                            <AlertTriangle size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">Citizen Help Desk</p>
                            <h3 className="mt-1 text-2xl font-black text-slate-900">{title}</h3>
                            <p className="mt-1 text-sm font-bold text-slate-500">মানুষ যে সমস্যা submit করবে, এখান থেকে status, feedback এবং সমাধান manage করুন।</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        {[
                            ['total', 'মোট'],
                            ['submitted', 'নতুন'],
                            ['reviewing', 'চলমান'],
                            ['assigned', 'দায়িত্বে'],
                            ['resolved', 'সমাধান']
                        ].map(([key, label]) => (
                            <div key={key} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
                                <p className="mt-1 text-xl font-black text-slate-900">{toBnDigits(String(stats[key] || 0))}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1fr]">
                <div className="rounded-[28px] border border-rose-100 bg-rose-50 p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Urgent queue</p>
                    <p className="mt-2 text-3xl font-black text-rose-700">{toBnDigits(String((stats.urgent || 0) + (stats.emergency || 0)))}</p>
                    <p className="mt-1 text-sm font-bold text-rose-600">জরুরি/খুব জরুরি complaint আগে দেখুন।</p>
                </div>
                <div className="rounded-[28px] border border-amber-100 bg-amber-50 p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Pending age</p>
                    <p className="mt-2 text-3xl font-black text-amber-700">
                        {toBnDigits(String(stats.open ? Math.round(stats.openAgeTotal / stats.open) : 0))} দিন
                    </p>
                    <p className="mt-1 text-sm font-bold text-amber-700">চলমান complaint-এর average বয়স।</p>
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top category</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {topCategories.length === 0 ? (
                            <span className="text-sm font-bold text-slate-400">ডাটা নেই</span>
                        ) : topCategories.map(([type, count]) => (
                            <span key={type} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                                {TYPE_LABELS[type] || type}: {toBnDigits(String(count))}
                            </span>
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
                            placeholder="নাম, ফোন, লোকেশন বা অভিযোগ দিয়ে খুঁজুন"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold outline-none transition focus:border-rose-300 focus:bg-white"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 outline-none transition focus:border-rose-300 focus:bg-white"
                    >
                        <option value="all">সব স্ট্যাটাস</option>
                        {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <select
                        value={priorityFilter}
                        onChange={(event) => setPriorityFilter(event.target.value)}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 outline-none transition focus:border-rose-300 focus:bg-white"
                    >
                        <option value="all">সব Priority</option>
                        <option value="emergency">খুব জরুরি</option>
                        <option value="urgent">জরুরি</option>
                        <option value="normal">সাধারণ</option>
                        <option value="low">কম</option>
                    </select>
                </div>
            </div>

            {notice && (
                <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-black text-teal-700">
                    {notice}
                </div>
            )}

            {loading ? (
                <div className="rounded-[32px] border border-dashed border-slate-200 bg-white py-16 text-center">
                    <Loader2 className="mx-auto animate-spin text-rose-500" size={34} />
                    <p className="mt-4 text-sm font-black text-slate-400">অভিযোগ load হচ্ছে...</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="rounded-[32px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                    <MessageSquareText className="mx-auto text-slate-300" size={42} />
                    <p className="mt-4 text-lg font-black text-slate-700">এই filter-এ কোনো অভিযোগ নেই</p>
                    <p className="mt-1 text-sm font-bold text-slate-400">Citizen center থেকে অভিযোগ এলে এখানে দেখা যাবে।</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {filteredItems.map((item) => {
                        const meta = STATUS_META[item.status] || STATUS_META.submitted;
                        const Icon = meta.icon;
                        return (
                            <article key={item.id} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-rose-200 hover:shadow-lg">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black ${meta.color}`}>
                                                <Icon size={13} /> {meta.label}
                                            </span>
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">
                                                {TYPE_LABELS[item.complaint_type] || item.complaint_type}
                                            </span>
                                            <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${PRIORITY_META[item.priority || 'normal']?.color || PRIORITY_META.normal.color}`}>
                                                {PRIORITY_META[item.priority || 'normal']?.label || 'সাধারণ'}
                                            </span>
                                        </div>
                                        <h4 className="mt-3 text-xl font-black leading-tight text-slate-900">{item.title}</h4>
                                        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-500">{item.description || 'বিস্তারিত দেওয়া হয়নি।'}</p>
                                    </div>
                                    <div className="shrink-0 rounded-2xl bg-slate-50 px-4 py-3 text-left sm:text-right">
                                        <p className="text-[10px] font-black uppercase text-slate-400">তারিখ</p>
                                        <p className="text-sm font-black text-slate-700">{new Date(item.created_at).toLocaleDateString('bn-BD')}</p>
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-1 gap-3 border-y border-slate-100 py-4 sm:grid-cols-3">
                                    <Info label="নাগরিক" value={item.citizen_name || 'নাম নেই'} />
                                    <Info label="মোবাইল" value={item.phone} />
                                    <Info label="লোকেশন" value={item.location_text || 'লোকেশন নেই'} />
                                </div>

                                <textarea
                                    value={feedback[item.id] ?? item.feedback ?? ''}
                                    onChange={(event) => setFeedback((current) => ({ ...current, [item.id]: event.target.value }))}
                                    placeholder="নাগরিককে দেখানোর feedback লিখুন"
                                    rows={3}
                                    className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold outline-none transition focus:border-rose-300 focus:bg-white"
                                />
                                <textarea
                                    value={officerNotes[item.id] ?? item.officer_note ?? ''}
                                    onChange={(event) => setOfficerNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                                    placeholder="Internal officer note লিখুন (নাগরিক দেখবে না)"
                                    rows={2}
                                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold outline-none transition focus:border-rose-300"
                                />

                                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                    <select
                                        defaultValue={item.status}
                                        onChange={(event) => updateComplaint(item, event.target.value)}
                                        disabled={savingId === item.id}
                                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
                                    >
                                        {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                    </select>
                                    <button
                                        onClick={() => updateComplaint(item, item.status)}
                                        disabled={savingId === item.id}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {savingId === item.id ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                        Feedback Save
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

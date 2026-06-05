"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    BadgeCheck, BriefcaseBusiness, Building2, Check, ChevronLeft, ChevronRight,
    Clock3, Crown, ExternalLink, Filter, Loader2, MapPin, Megaphone,
    MessageCircle, Phone, Plus, Search, ShieldCheck, Sparkles, Store, X
} from 'lucide-react';
import { supabase } from '@/lib/utils/supabase';

const CATEGORIES = [
    ['all', 'সব সেবা'], ['doctor', 'ডাক্তার'], ['pharmacy', 'ফার্মেসি'],
    ['grocery', 'মুদি দোকান'], ['restaurant', 'খাবার'], ['transport', 'পরিবহন'],
    ['mechanic', 'মেকানিক'], ['electrician', 'ইলেকট্রিশিয়ান'], ['plumber', 'প্লাম্বার'],
    ['teacher', 'শিক্ষক'], ['tailor', 'দর্জি'], ['agriculture', 'কৃষি সেবা'],
    ['technology', 'প্রযুক্তি'], ['construction', 'নির্মাণ'], ['beauty', 'বিউটি সেবা'],
    ['other', 'অন্যান্য']
];
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES);
const PAGE_SIZE = 9;
const DEMO_LISTINGS = [
    {
        id: 'demo-1', name: 'গ্রাম ডিজিটাল সেবা কেন্দ্র', category: 'technology',
        description: 'অনলাইন আবেদন, প্রিন্ট, ছবি, কম্পিউটার ও মোবাইল সহায়তা।',
        owner_name: 'মোঃ রহমান', phone: '01711000001', whatsapp: '01711000001',
        address: 'ইউনিয়ন পরিষদ বাজার', opening_hours: 'সকাল ৯টা - রাত ৯টা',
        price_note: 'সেবা অনুযায়ী মূল্য', is_verified: true, is_featured: true,
        plan: 'featured', union: { name_bn: 'ডেমো ইউনিয়ন' }, village: { name_bn: 'গ্রাম কেন্দ্র' }
    },
    {
        id: 'demo-2', name: 'নিরাপদ ফার্মেসি', category: 'pharmacy',
        description: 'প্রয়োজনীয় ওষুধ, স্বাস্থ্য সামগ্রী এবং জরুরি ডেলিভারি।',
        owner_name: 'মোঃ কামাল', phone: '01711000002', address: 'প্রধান বাজার',
        opening_hours: 'সকাল ৮টা - রাত ১১টা', price_note: 'হোম ডেলিভারি আছে',
        is_verified: true, is_featured: false, plan: 'free', union: { name_bn: 'ডেমো ইউনিয়ন' }
    },
    {
        id: 'demo-3', name: 'বিশ্বাস ইলেকট্রিক সার্ভিস', category: 'electrician',
        description: 'বাড়ি ও দোকানের wiring, fan, pump এবং জরুরি repair।',
        owner_name: 'সোহেল রানা', phone: '01711000003', whatsapp: '01711000003',
        address: 'কলেজ রোড', opening_hours: '২৪ ঘণ্টা জরুরি সেবা',
        price_note: 'কল চার্জ ২০০ টাকা থেকে', is_verified: true, is_featured: false,
        plan: 'free', union: { name_bn: 'ডেমো ইউনিয়ন' }
    }
];
const INITIAL_FORM = {
    name: '', ownerName: '', phone: '', whatsapp: '', category: 'grocery',
    description: '', unionId: '', wardId: '', villageId: '', address: '',
    serviceArea: '', openingHours: '', priceNote: '', websiteUrl: '',
    facebookUrl: '', logoUrl: '', plan: 'free'
};

function locationLabel(row) {
    return row?.name_bn || row?.name_en || 'নাম পাওয়া যায়নি';
}

function cleanPhone(value) {
    return String(value || '').replace(/[^0-9]/g, '');
}

function Field({ label, value, onChange, type = 'text', ...props }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-black text-slate-700">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                {...props}
            />
        </label>
    );
}

function SelectField({ label, value, onChange, options, placeholder, ...props }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-black text-slate-700">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
            </select>
        </label>
    );
}

function ListingCard({ item, onOpen }) {
    const featured = item.is_featured && (!item.featured_until || new Date(item.featured_until) > new Date());
    const initial = item.name?.trim()?.[0] || 'ব';

    return (
        <article className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all hover:-translate-y-1 hover:shadow-xl ${featured ? 'border-amber-300 shadow-amber-100/70' : 'border-slate-200 shadow-sm'}`}>
            <div className={`h-2 ${featured ? 'bg-amber-400' : 'bg-teal-500'}`} />
            <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start gap-4">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-xl font-black ${featured ? 'bg-amber-100 text-amber-700' : 'bg-teal-50 text-teal-700'}`}>
                        {item.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.logo_url} alt="" className="h-full w-full object-cover" />
                        ) : initial}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
                                {CATEGORY_LABEL[item.category] || 'অন্যান্য'}
                            </span>
                            {item.is_verified && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-teal-700">
                                    <BadgeCheck size={14} /> যাচাইকৃত
                                </span>
                            )}
                            {featured && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">
                                    <Crown size={12} /> Featured
                                </span>
                            )}
                        </div>
                        <h2 className="mt-2 text-lg font-black leading-tight text-slate-900">{item.name}</h2>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">
                            {item.description || 'স্থানীয় বিশ্বস্ত ব্যবসা ও সেবা প্রদানকারী।'}
                        </p>
                    </div>
                </div>

                <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-xs font-bold text-slate-600">
                    <p className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-teal-600" /> {item.address}</p>
                    {item.opening_hours && <p className="flex items-center gap-2"><Clock3 size={15} className="text-teal-600" /> {item.opening_hours}</p>}
                    <p className="flex items-center gap-2"><Building2 size={15} className="text-teal-600" /> {item.village?.name_bn || item.ward?.name_bn || item.union?.name_bn || 'স্থানীয় এলাকা'}</p>
                </div>

                <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-5">
                    <a
                        href={`tel:${item.phone}`}
                        onClick={() => onOpen(item, 'contact')}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white transition hover:bg-teal-700"
                    >
                        <Phone size={16} /> কল করুন
                    </a>
                    {item.whatsapp ? (
                        <a
                            href={`https://wa.me/88${cleanPhone(item.whatsapp)}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => onOpen(item, 'contact')}
                            aria-label="WhatsApp"
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                            <MessageCircle size={18} />
                        </a>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onOpen(item, 'view')}
                            aria-label="বিস্তারিত"
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            <ExternalLink size={17} />
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}

function ApplicationModal({ open, onClose, locations, onSubmitted }) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const unions = useMemo(() => locations.filter((item) => item.type === 'union'), [locations]);
    const wards = useMemo(() => locations.filter((item) => item.type === 'ward' && item.parent_id === form.unionId), [locations, form.unionId]);
    const villages = useMemo(() => locations.filter((item) => item.type === 'village' && item.parent_id === form.wardId), [locations, form.wardId]);

    if (!open) return null;
    const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const locationId = form.villageId || form.wardId || form.unionId;
            const response = await fetch('/api/business-directory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, locationId })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'আবেদন জমা হয়নি');
            setMessage({ type: 'success', text: 'আবেদন জমা হয়েছে। কর্মকর্তা যাচাই করার পর directory-তে প্রকাশ হবে।' });
            setForm(INITIAL_FORM);
            onSubmitted?.();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-5">
            <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">Free listing application</p>
                        <h2 className="text-xl font-black text-slate-900">আপনার ব্যবসা যোগ করুন</h2>
                    </div>
                    <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="বন্ধ করুন">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-6 p-5 sm:p-7">
                    {message && (
                        <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                            {message.text}
                        </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="ব্যবসা/সেবার নাম *" value={form.name} onChange={(value) => update('name', value)} required />
                        <Field label="মালিক/দায়িত্বপ্রাপ্ত ব্যক্তি *" value={form.ownerName} onChange={(value) => update('ownerName', value)} required />
                        <Field label="মোবাইল নম্বর *" value={form.phone} onChange={(value) => update('phone', value)} inputMode="numeric" required />
                        <Field label="WhatsApp নম্বর" value={form.whatsapp} onChange={(value) => update('whatsapp', value)} inputMode="numeric" />
                        <SelectField label="সেবার ধরন" value={form.category} onChange={(value) => update('category', value)} options={CATEGORIES.filter(([key]) => key !== 'all')} />
                        <SelectField label="Listing plan" value={form.plan} onChange={(value) => update('plan', value)} options={[
                            ['free', 'Free - সাধারণ তালিকা'],
                            ['featured', 'Featured - উপরে দেখাবে'],
                            ['premium', 'Premium - বিজ্ঞাপন ও বেশি reach']
                        ]} />
                    </div>
                    <label className="block">
                        <span className="mb-2 block text-xs font-black text-slate-700">সেবা সম্পর্কে সংক্ষিপ্ত বিবরণ</span>
                        <textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={3} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" />
                    </label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-3 text-sm font-black text-slate-900">সঠিক এলাকা নির্বাচন</p>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <SelectField label="ইউনিয়ন *" value={form.unionId} onChange={(value) => setForm((current) => ({ ...current, unionId: value, wardId: '', villageId: '' }))} options={unions.map((item) => [item.id, locationLabel(item)])} placeholder="ইউনিয়ন বাছুন" required />
                            <SelectField label="ওয়ার্ড" value={form.wardId} onChange={(value) => setForm((current) => ({ ...current, wardId: value, villageId: '' }))} options={wards.map((item) => [item.id, locationLabel(item)])} placeholder="ওয়ার্ড বাছুন" />
                            <SelectField label="গ্রাম" value={form.villageId} onChange={(value) => update('villageId', value)} options={villages.map((item) => [item.id, locationLabel(item)])} placeholder="গ্রাম বাছুন" />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="পূর্ণ ঠিকানা *" value={form.address} onChange={(value) => update('address', value)} required />
                        <Field label="কোন এলাকায় সেবা দেন" value={form.serviceArea} onChange={(value) => update('serviceArea', value)} />
                        <Field label="খোলা থাকার সময়" value={form.openingHours} onChange={(value) => update('openingHours', value)} placeholder="যেমন: সকাল ৯টা - রাত ৯টা" />
                        <Field label="মূল্য/কল চার্জ" value={form.priceNote} onChange={(value) => update('priceNote', value)} />
                        <Field label="Facebook page URL" value={form.facebookUrl} onChange={(value) => update('facebookUrl', value)} type="url" />
                        <Field label="Logo image URL" value={form.logoUrl} onChange={(value) => update('logoUrl', value)} type="url" />
                    </div>
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                        <button type="button" onClick={onClose} className="min-h-12 rounded-xl border border-slate-200 px-6 text-sm font-black text-slate-600 hover:bg-slate-50">বাতিল</button>
                        <button disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-600 px-7 text-sm font-black text-white hover:bg-teal-700 disabled:opacity-60">
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            যাচাইয়ের জন্য জমা দিন
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function OfficerQueue({ rows, onChanged }) {
    const [busyId, setBusyId] = useState(null);
    const mutate = async (id, payload) => {
        setBusyId(id);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;
            const response = await fetch('/api/business-directory', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id, ...payload })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Update failed');
            onChanged();
        } catch (error) {
            window.alert(error.message);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700"><ShieldCheck size={22} /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Officer moderation</p>
                        <h2 className="text-xl font-black text-slate-900">Business verification queue</h2>
                    </div>
                </div>
                {rows.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">এই scope-এ কোনো আবেদন নেই।</p>
                ) : (
                    <div className="space-y-3">
                        {rows.map((item) => (
                            <div key={item.id} className="grid gap-4 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-black text-slate-900">{item.name}</h3>
                                        <span className={`rounded-full px-2 py-1 text-[10px] font-black ${item.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : item.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{item.status}</span>
                                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">{item.plan}</span>
                                    </div>
                                    <p className="mt-1 text-xs font-bold text-slate-500">{item.owner_name} · {item.phone} · {item.address}</p>
                                    <p className="mt-2 text-[11px] font-bold text-slate-400">
                                        {Number(item.view_count || 0)} views · {Number(item.contact_click_count || 0)} contact clicks
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {item.status !== 'approved' && <button disabled={busyId === item.id} onClick={() => mutate(item.id, { status: 'approved' })} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white">Approve</button>}
                                    {item.status !== 'rejected' && <button disabled={busyId === item.id} onClick={() => mutate(item.id, { status: 'rejected', reason: 'তথ্য যাচাই প্রয়োজন' })} className="rounded-xl bg-rose-50 px-4 py-2 text-xs font-black text-rose-700">Reject</button>}
                                    {item.status === 'approved' && <button disabled={busyId === item.id} onClick={() => mutate(item.id, { isFeatured: !item.is_featured, days: 30 })} className="rounded-xl bg-amber-100 px-4 py-2 text-xs font-black text-amber-800">{item.is_featured ? 'Unfeature' : 'Feature 30 days'}</button>}
                                    {item.status === 'approved' && item.plan !== 'premium' && (
                                        <button disabled={busyId === item.id} onClick={() => mutate(item.id, { action: 'create_ad', days: 30 })} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white">
                                            Start sponsored ad
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default function LocalBusinessDirectory() {
    const [locations, setLocations] = useState([]);
    const [rows, setRows] = useState([]);
    const [ads, setAds] = useState([]);
    const [managementRows, setManagementRows] = useState([]);
    const [canManage, setCanManage] = useState(false);
    const [loading, setLoading] = useState(true);
    const [usingDemo, setUsingDemo] = useState(false);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [unionId, setUnionId] = useState('');
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const unions = useMemo(() => locations.filter((item) => item.type === 'union'), [locations]);

    const loadLocations = useCallback(async () => {
        const { data } = await supabase
            .from('locations')
            .select('id,type,parent_id,name_bn,name_en')
            .in('type', ['union', 'ward', 'village'])
            .order('name_bn', { ascending: true });
        setLocations(data || []);
    }, []);

    const loadDirectory = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (unionId) params.set('unionId', unionId);
            if (category !== 'all') params.set('category', category);
            if (query.trim()) params.set('q', query.trim());
            const response = await fetch(`/api/business-directory?${params}`);
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            setRows(result.data || []);
            setAds(result.ads || []);
            setUsingDemo(false);
        } catch {
            setRows(DEMO_LISTINGS);
            setAds([]);
            setUsingDemo(true);
        } finally {
            setLoading(false);
        }
    }, [category, query, unionId]);

    const loadManagement = useCallback(async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) return;
        const response = await fetch('/api/business-directory?manage=1&limit=200', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await response.json();
        if (response.ok && result.canManage) {
            setCanManage(true);
            setManagementRows(result.data || []);
        }
    }, []);

    useEffect(() => {
        loadLocations();
        loadManagement();
    }, [loadLocations, loadManagement]);

    useEffect(() => {
        const timer = setTimeout(loadDirectory, 250);
        return () => clearTimeout(timer);
    }, [loadDirectory]);
    useEffect(() => setPage(1), [category, query, unionId]);

    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const track = (item, event) => {
        if (String(item.id).startsWith('demo-')) return;
        fetch('/api/business-directory/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.id, event }),
            keepalive: true
        }).catch(() => {});
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-16">
            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">
                            <BadgeCheck size={14} /> Verified local directory
                        </div>
                        <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-slate-950 sm:text-5xl">কাছের বিশ্বস্ত ব্যবসা ও সেবা এখন এক জায়গায়</h1>
                        <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                            ডাক্তার, ফার্মেসি, মিস্ত্রি, পরিবহন, শিক্ষক বা দোকান খুঁজুন। যাচাইকৃত নম্বরে সরাসরি কল করুন এবং স্থানীয় ব্যবসাকে এগিয়ে নিন।
                        </p>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <button onClick={() => setModalOpen(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-black text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700">
                                <Plus size={18} /> ব্যবসা যোগ করুন
                            </button>
                            <a href="#directory" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 hover:bg-slate-50">
                                <Search size={18} /> সেবা খুঁজুন
                            </a>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            [Store, `${rows.length}+`, 'তালিকাভুক্ত সেবা'],
                            [ShieldCheck, 'Verified', 'কর্মকর্তা যাচাই'],
                            [Phone, '1 Tap', 'সরাসরি যোগাযোগ'],
                            [Megaphone, 'Premium', 'স্থানীয় বিজ্ঞাপন']
                        ].map(([Icon, value, label]) => (
                            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                                <Icon size={21} className="text-teal-600" />
                                <p className="mt-4 text-xl font-black text-slate-900">{value}</p>
                                <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {ads.length > 0 && (
                <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
                    <div className="grid gap-3 md:grid-cols-2">
                        {ads.slice(0, 2).map((ad) => (
                            <a key={ad.id} href={ad.target_url || `tel:${ad.business?.phone}`} target={ad.target_url ? '_blank' : undefined} rel="noreferrer" className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 hover:bg-amber-100">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-amber-950"><Megaphone size={20} /></div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Sponsored</p>
                                    <p className="truncate font-black text-slate-900">{ad.title}</p>
                                    <p className="truncate text-xs font-bold text-slate-600">{ad.subtitle || ad.business?.name}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>
            )}

            <section id="directory" className="mx-auto max-w-7xl scroll-mt-28 px-4 pt-8 sm:px-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="grid gap-3 md:grid-cols-[1fr_240px]">
                        <label className="relative">
                            <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="নাম, সেবা বা ঠিকানা দিয়ে খুঁজুন" className="min-h-13 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" />
                        </label>
                        <label className="relative">
                            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select value={unionId} onChange={(event) => setUnionId(event.target.value)} className="min-h-13 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold outline-none focus:border-teal-500">
                                <option value="">সব ইউনিয়ন</option>
                                {unions.map((item) => <option key={item.id} value={item.id}>{locationLabel(item)}</option>)}
                            </select>
                        </label>
                    </div>
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                        <span className="flex shrink-0 items-center gap-1.5 px-2 text-xs font-black text-slate-400"><Filter size={14} /> ধরন</span>
                        {CATEGORIES.map(([key, label]) => (
                            <button key={key} onClick={() => setCategory(key)} className={`min-h-9 shrink-0 rounded-full px-4 text-xs font-black transition ${category === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}</button>
                        ))}
                    </div>
                </div>

                {usingDemo && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                        Database migration এখনো পাওয়া যায়নি, তাই preview data দেখানো হচ্ছে। `database/61_local_business_directory_and_ads.sql` চালালে live directory চালু হবে।
                    </div>
                )}
                {loading ? (
                    <div className="flex min-h-72 items-center justify-center"><Loader2 size={30} className="animate-spin text-teal-600" /></div>
                ) : visibleRows.length === 0 ? (
                    <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center">
                        <BriefcaseBusiness size={38} className="mx-auto text-slate-300" />
                        <h2 className="mt-4 text-lg font-black text-slate-800">এই filter-এ কোনো ব্যবসা পাওয়া যায়নি</h2>
                        <button onClick={() => setModalOpen(true)} className="mt-4 text-sm font-black text-teal-700">প্রথম ব্যবসাটি যোগ করুন</button>
                    </div>
                ) : (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {visibleRows.map((item) => <ListingCard key={item.id} item={item} onOpen={track} />)}
                    </div>
                )}
                {pages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-3">
                        <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white disabled:opacity-40" aria-label="আগের পেজ"><ChevronLeft size={18} /></button>
                        <span className="min-w-24 text-center text-sm font-black text-slate-700">{page} / {pages}</span>
                        <button disabled={page >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white disabled:opacity-40" aria-label="পরের পেজ"><ChevronRight size={18} /></button>
                    </div>
                )}
            </section>

            <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
                <div className="grid overflow-hidden rounded-3xl bg-slate-950 text-white lg:grid-cols-[1fr_0.9fr]">
                    <div className="p-6 sm:p-9">
                        <div className="inline-flex items-center gap-2 text-xs font-black text-amber-300"><Sparkles size={16} /> DigiGram Business</div>
                        <h2 className="mt-3 text-2xl font-black sm:text-3xl">কম খরচে স্থানীয় গ্রাহকের কাছে পৌঁছান</h2>
                        <p className="mt-3 max-w-xl text-sm font-semibold leading-7 text-slate-300">Free listing দিয়ে শুরু করুন। Featured ও Premium plan-এ directory top placement, ইউনিয়ন campaign এবং SMS promotion request পাওয়া যাবে।</p>
                    </div>
                    <div className="grid grid-cols-3 border-t border-white/10 lg:border-l lg:border-t-0">
                        {[['Free', '৳০'], ['Featured', '৩০ দিন'], ['Premium', 'Ads + SMS']].map(([title, value]) => (
                            <div key={title} className="flex flex-col justify-center border-r border-white/10 p-4 last:border-r-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
                                <p className="mt-2 text-lg font-black text-white">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {canManage && <OfficerQueue rows={managementRows} onChanged={loadManagement} />}
            <ApplicationModal open={modalOpen} onClose={() => setModalOpen(false)} locations={locations} onSubmitted={loadManagement} />
        </div>
    );
}

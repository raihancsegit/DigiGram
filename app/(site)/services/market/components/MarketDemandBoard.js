"use client";

import { useEffect, useMemo, useState } from 'react';
import { HandCoins, Loader2, Phone, Plus, ShoppingCart, Store } from 'lucide-react';

export function MarketDemandBoard({ union, market, commodities = [] }) {
    const [demands, setDemands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        demandType: 'sell',
        commodityId: '',
        title: '',
        quantity: '',
        expectedPrice: '',
        villageName: '',
        contactName: '',
        contactPhone: '',
        note: '',
        smsBoost: false
    });

    const commodityName = useMemo(() => {
        return commodities.find((item) => item.id === form.commodityId)?.name || '';
    }, [commodities, form.commodityId]);

    useEffect(() => {
        loadDemands();
    }, [union?.id, market?.id]);

    async function loadDemands() {
        if (!union?.id) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ locationId: union.id, limit: '12' });
            if (market?.id) params.set('marketId', market.id);
            const response = await fetch(`/api/market/demands?${params.toString()}`, { cache: 'no-store' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Demand load failed');
            setDemands(result.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!union?.id) return;
        setSubmitting(true);
        try {
            const response = await fetch('/api/market/demands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    locationId: union.id,
                    marketId: market?.id || null,
                    title: form.title || commodityName
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Demand save failed');
            setForm({
                demandType: 'sell',
                commodityId: '',
                title: '',
                quantity: '',
                expectedPrice: '',
                villageName: '',
                contactName: '',
                contactPhone: '',
                note: '',
                smsBoost: false
            });
            await loadDemands();
            alert(result.boost?.status === 'queued'
                ? `Demand publish হয়েছে এবং ${result.boost.count} টি SMS queue হয়েছে।`
                : 'Demand publish হয়েছে।');
        } catch (error) {
            alert(error.message || 'Demand save হয়নি');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
            <div className="mb-5 flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-200">
                    <HandCoins size={22} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-900">কিনব / বিক্রি করব</h3>
                    <p className="mt-1 text-xs font-bold leading-relaxed text-slate-500">
                        কৃষক, দোকানদার বা ক্রেতা এখানে চাহিদা পোস্ট করতে পারবেন।
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    {[
                        ['sell', 'বিক্রি করব', Store],
                        ['buy', 'কিনতে চাই', ShoppingCart]
                    ].map(([value, label, Icon]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setForm({ ...form, demandType: value })}
                            className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs font-black transition ${
                                form.demandType === value
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-200 bg-slate-50 text-slate-600'
                            }`}
                        >
                            <Icon size={15} />
                            {label}
                        </button>
                    ))}
                </div>
                <select
                    value={form.commodityId}
                    onChange={(event) => setForm({ ...form, commodityId: event.target.value, title: commodities.find((item) => item.id === event.target.value)?.name || form.title })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500 focus:bg-white"
                >
                    <option value="">পণ্য নির্বাচন করুন</option>
                    {commodities.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </select>
                <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="শিরোনাম" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500 focus:bg-white" />
                <div className="grid grid-cols-2 gap-2">
                    <input value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="পরিমাণ" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500 focus:bg-white" />
                    <input type="number" value={form.expectedPrice} onChange={(event) => setForm({ ...form, expectedPrice: event.target.value })} placeholder="প্রত্যাশিত দর" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500 focus:bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <input required value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} placeholder="নাম" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500 focus:bg-white" />
                    <input required value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} placeholder="017XXXXXXXX" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500 focus:bg-white" />
                </div>
                <input value={form.villageName} onChange={(event) => setForm({ ...form, villageName: event.target.value })} placeholder="গ্রাম/এলাকা" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500 focus:bg-white" />
                <label className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-xs font-bold text-amber-800">
                    <input type="checkbox" checked={form.smsBoost} onChange={(event) => setForm({ ...form, smsBoost: event.target.checked })} className="mt-1" />
                    SMS boost চাই। Wallet balance থাকলে ইউনিয়নের household phone-গুলোতে এই চাহিদা যাবে।
                </label>
                <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-amber-100 transition hover:bg-amber-600 disabled:opacity-50">
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    Demand publish করুন
                </button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-5">
                <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">সর্বশেষ পোস্ট</h4>
                {loading ? (
                    <div className="py-6 text-center text-slate-400"><Loader2 className="mx-auto animate-spin" /></div>
                ) : demands.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-center text-xs font-bold text-slate-400">এখনো কোনো demand নেই</p>
                ) : (
                    <div className="space-y-3">
                        {demands.map((item) => (
                            <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${item.demand_type === 'sell' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                                        {item.demand_type === 'sell' ? 'বিক্রি' : 'কিনব'}
                                    </span>
                                    <a href={`tel:${item.contact_phone}`} className="flex items-center gap-1 text-[10px] font-black text-slate-500">
                                        <Phone size={12} /> কল
                                    </a>
                                </div>
                                <p className="font-black text-slate-900">{item.title}</p>
                                <p className="mt-1 text-xs font-bold text-slate-500">{item.quantity || 'পরিমাণ নেই'} {item.expected_price ? `- ৳${item.expected_price}` : ''}</p>
                                <p className="mt-1 text-[11px] font-bold text-slate-400">{item.village_name || item.market?.name || 'এলাকা উল্লেখ নেই'}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

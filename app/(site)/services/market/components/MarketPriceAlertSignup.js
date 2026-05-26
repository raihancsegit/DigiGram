"use client";

import { useMemo, useState } from 'react';
import { BellRing, Loader2, CheckCircle2 } from 'lucide-react';

export function MarketPriceAlertSignup({ union, market, commodities = [], prices = [] }) {
    const [form, setForm] = useState({
        phone: '',
        commodityId: '',
        alertType: 'price_down',
        targetPrice: ''
    });
    const [status, setStatus] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const pricedCommodities = useMemo(() => {
        const pricedIds = new Set(prices.map((item) => item.commodity_id));
        return commodities.filter((item) => pricedIds.has(item.id));
    }, [commodities, prices]);

    async function handleSubmit(event) {
        event.preventDefault();
        if (!union?.id || !market?.id) {
            setStatus({ type: 'error', text: 'Union বা market পাওয়া যায়নি।' });
            return;
        }

        setSubmitting(true);
        setStatus(null);
        try {
            const response = await fetch('/api/market/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locationId: union.id,
                    marketId: market.id,
                    commodityId: form.commodityId,
                    phone: form.phone,
                    alertType: form.alertType,
                    targetPrice: form.targetPrice
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Alert save failed');
            setStatus({ type: 'success', text: 'দাম পরিবর্তন হলে এই নম্বরে SMS যাবে।' });
            setForm((current) => ({ ...current, targetPrice: '' }));
        } catch (error) {
            setStatus({ type: 'error', text: error.message || 'Alert save হয়নি।' });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="rounded-[36px] border border-emerald-100 bg-emerald-50/70 p-6 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
                    <BellRing size={22} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-900">দাম কমলে SMS পান</h3>
                    <p className="mt-1 text-xs font-bold leading-relaxed text-emerald-800/70">
                        যে পণ্যের দর জানতে চান সেটি সিলেক্ট করুন। দাম কমলে বা আপনার target price এলে SMS যাবে।
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    required
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
                <select
                    required
                    value={form.commodityId}
                    onChange={(event) => setForm({ ...form, commodityId: event.target.value })}
                    className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                >
                    <option value="">পণ্য নির্বাচন করুন</option>
                    {pricedCommodities.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </select>
                <select
                    value={form.alertType}
                    onChange={(event) => setForm({ ...form, alertType: event.target.value })}
                    className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                >
                    <option value="price_down">দাম কমলে জানাবেন</option>
                    <option value="price_up">দাম বাড়লে জানাবেন</option>
                    <option value="any_change">যেকোনো পরিবর্তনে জানাবেন</option>
                    <option value="target_below">Target price হলে জানাবেন</option>
                </select>
                {form.alertType === 'target_below' && (
                    <input
                        required
                        type="number"
                        value={form.targetPrice}
                        onChange={(event) => setForm({ ...form, targetPrice: event.target.value })}
                        placeholder="Target price"
                        className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                )}
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-emerald-700 disabled:opacity-50"
                >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <BellRing size={18} />}
                    SMS Alert চালু করুন
                </button>
            </form>

            {status && (
                <div className={`mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-black ${
                    status.type === 'success' ? 'bg-white text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                    {status.type === 'success' && <CheckCircle2 size={16} />}
                    {status.text}
                </div>
            )}
        </div>
    );
}

'use client';

import { useMemo, useState } from 'react';
import { Calculator, LineChart, Megaphone, TrendingDown, TrendingUp, Wheat } from 'lucide-react';
import { toBnDigits } from '@/lib/utils/format';

function taka(value) {
    return `৳${toBnDigits(Number(value || 0).toLocaleString('bn-BD'))}`;
}

function getCommodityName(price) {
    return price?.commodity?.name || price?.name || 'পণ্য';
}

function buildMarketBulletin(prices = [], markets = []) {
    const marketById = new Map((markets || []).map((market) => [market.id, market]));
    const rising = prices.filter((item) => item.trend === 'up');
    const falling = prices.filter((item) => item.trend === 'down');
    const lowSupply = prices.filter((item) => item.supply === 'Low');
    const highSupply = prices.filter((item) => ['High', 'Very High'].includes(item.supply));
    const topRise = [...rising].sort((a, b) => Math.abs(Number(b.price || 0) - Number(b.prev_price || 0)) - Math.abs(Number(a.price || 0) - Number(a.prev_price || 0)))[0];
    const topDrop = [...falling].sort((a, b) => Math.abs(Number(b.price || 0) - Number(b.prev_price || 0)) - Math.abs(Number(a.price || 0) - Number(a.prev_price || 0)))[0];

    return {
        total: prices.length,
        rising: rising.length,
        falling: falling.length,
        lowSupply: lowSupply.length,
        highSupply: highSupply.length,
        topRise,
        topDrop,
        headline: lowSupply.length > 0
            ? `${toBnDigits(lowSupply.length)}টি পণ্যে supply সংকট দেখা যাচ্ছে`
            : falling.length > rising.length
                ? 'আজ কিছু পণ্যে ক্রেতাদের জন্য সাশ্রয়ী সুযোগ আছে'
                : rising.length > 0
                    ? 'কিছু পণ্যের দাম বাড়ছে, বাজারদর দেখে সিদ্ধান্ত নিন'
                    : 'আজ বাজার মোটামুটি স্থিতিশীল আছে',
        marketName: (item) => marketById.get(item?.market_id)?.name || 'হাট'
    };
}

export default function MarketDecisionTools({ prices = [], markets = [], commodities = [], title = 'Daily Market Bulletin' }) {
    const bulletin = useMemo(() => buildMarketBulletin(prices, markets), [prices, markets]);
    const pricedCommodities = useMemo(() => {
        const map = new Map();
        prices.forEach((price) => {
            const commodity = price.commodity || commodities.find((item) => item.id === price.commodity_id);
            if (commodity && !map.has(commodity.id)) {
                map.set(commodity.id, { ...commodity, latestPrice: Number(price.price || 0) });
            }
        });
        return Array.from(map.values());
    }, [prices, commodities]);
    const [calc, setCalc] = useState({
        commodityId: pricedCommodities[0]?.id || '',
        quantity: '10',
        productionCost: '8000',
        transportCost: '500',
        otherCost: '300'
    });

    const selectedCommodity = pricedCommodities.find((item) => item.id === calc.commodityId) || pricedCommodities[0];
    const marketPrice = Number(selectedCommodity?.latestPrice || 0);
    const quantity = Number(calc.quantity || 0);
    const totalCost = Number(calc.productionCost || 0) + Number(calc.transportCost || 0) + Number(calc.otherCost || 0);
    const revenue = marketPrice * quantity;
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    return (
        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[40px] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-100">
                        <Megaphone size={22} />
                    </span>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">{title}</p>
                        <h2 className="text-2xl font-black text-slate-950">{bulletin.headline}</h2>
                        <p className="mt-1 text-sm font-bold text-slate-500">আজকের দাম, supply এবং trend থেকে auto summary।</p>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                    {[
                        ['দাম বাড়ছে', bulletin.rising, TrendingUp, 'bg-rose-50 text-rose-700'],
                        ['দাম কমছে', bulletin.falling, TrendingDown, 'bg-emerald-50 text-emerald-700'],
                        ['Supply কম', bulletin.lowSupply, Wheat, 'bg-amber-50 text-amber-700'],
                        ['দাম আপডেট', bulletin.total, LineChart, 'bg-sky-50 text-sky-700']
                    ].map(([label, value, Icon, tone]) => (
                        <div key={label} className="rounded-[24px] bg-white p-4 shadow-sm">
                            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}>
                                <Icon size={18} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
                            <p className="mt-1 text-2xl font-black text-slate-950">{toBnDigits(value)}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <BulletinCard title="আজ সবচেয়ে বেশি বেড়েছে" item={bulletin.topRise} marketName={bulletin.marketName} empty="বড় দাম বৃদ্ধি নেই" tone="rose" />
                    <BulletinCard title="আজ সবচেয়ে বেশি কমেছে" item={bulletin.topDrop} marketName={bulletin.marketName} empty="বড় দাম কমেনি" tone="emerald" />
                </div>
            </div>

            <div className="rounded-[40px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <Calculator size={22} />
                    </span>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-700">Profit Calculator</p>
                        <h2 className="text-2xl font-black text-slate-950">ফসল বিক্রি করলে লাভ কত?</h2>
                        <p className="mt-1 text-sm font-bold text-slate-500">বাজারদর অনুযায়ী আনুমানিক লাভ-ক্ষতি হিসাব।</p>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <select
                        value={calc.commodityId || selectedCommodity?.id || ''}
                        onChange={(event) => setCalc({ ...calc, commodityId: event.target.value })}
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none focus:border-teal-400"
                    >
                        {pricedCommodities.map((item) => (
                            <option key={item.id} value={item.id}>{item.name} - {taka(item.latestPrice)}</option>
                        ))}
                    </select>
                    <input
                        value={calc.quantity}
                        onChange={(event) => setCalc({ ...calc, quantity: event.target.value })}
                        type="number"
                        min="0"
                        placeholder="পরিমাণ"
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-teal-400"
                    />
                    <input
                        value={calc.productionCost}
                        onChange={(event) => setCalc({ ...calc, productionCost: event.target.value })}
                        type="number"
                        min="0"
                        placeholder="উৎপাদন খরচ"
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-teal-400"
                    />
                    <input
                        value={calc.transportCost}
                        onChange={(event) => setCalc({ ...calc, transportCost: event.target.value })}
                        type="number"
                        min="0"
                        placeholder="পরিবহন খরচ"
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-teal-400"
                    />
                    <input
                        value={calc.otherCost}
                        onChange={(event) => setCalc({ ...calc, otherCost: event.target.value })}
                        type="number"
                        min="0"
                        placeholder="অন্যান্য খরচ"
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-teal-400 sm:col-span-2"
                    />
                </div>

                <div className="mt-4 rounded-[28px] bg-slate-950 p-5 text-white">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">আয়</p>
                            <p className="mt-1 text-xl font-black">{taka(revenue)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">খরচ</p>
                            <p className="mt-1 text-xl font-black">{taka(totalCost)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">লাভ/ক্ষতি</p>
                            <p className={`mt-1 text-xl font-black ${profit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{taka(profit)}</p>
                        </div>
                    </div>
                    <p className="mt-4 rounded-2xl bg-white/10 p-3 text-sm font-bold text-slate-200">
                        {profit >= 0
                            ? `এই দামে বিক্রি করলে আনুমানিক ${toBnDigits(margin)}% margin থাকতে পারে।`
                            : 'এই দামে বিক্রি করলে ক্ষতি হতে পারে, দাম/খরচ আবার যাচাই করুন।'}
                    </p>
                </div>
            </div>
        </section>
    );
}

function BulletinCard({ title, item, marketName, empty, tone }) {
    const toneClass = tone === 'rose' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700';
    if (!item) {
        return <div className="rounded-[24px] bg-white p-4 text-sm font-bold text-slate-400 shadow-sm">{empty}</div>;
    }
    const diff = Math.abs(Number(item.price || 0) - Number(item.prev_price || 0));
    return (
        <div className="rounded-[24px] bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{title}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                    <p className="text-lg font-black text-slate-950">{getCommodityName(item)}</p>
                    <p className="text-xs font-bold text-slate-500">{marketName(item)}</p>
                </div>
                <span className={`rounded-2xl px-3 py-2 text-sm font-black ${toneClass}`}>{taka(diff)}</span>
            </div>
        </div>
    );
}

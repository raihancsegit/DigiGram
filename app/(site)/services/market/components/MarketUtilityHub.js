"use client";

import { useMemo, useState } from 'react';
import { AlertTriangle, Megaphone, Phone, Send, ShoppingBag, Store, Truck, UsersRound, X } from 'lucide-react';
import { toBnDigits } from '@/lib/utils/format';

const utilityTabs = [
    { key: 'sellers', label: 'বিক্রেতা', Icon: Store },
    { key: 'transport', label: 'পরিবহন', Icon: Truck },
    { key: 'complaint', label: 'অভিযোগ', Icon: AlertTriangle },
    { key: 'broadcast', label: 'বাজার বার্তা', Icon: Megaphone }
];

const demoSellers = [
    { name: 'ধান-চাল পাইকারি ঘর', product: 'চাল, ধান, গম', type: 'পাইকারি', phone: '01700000001', area: 'হাটের মূল গেট' },
    { name: 'সবজি সংগ্রহ কেন্দ্র', product: 'আলু, পেঁয়াজ, কাঁচা মরিচ', type: 'কৃষক/আড়ত', phone: '01700000002', area: 'পশ্চিম শেড' },
    { name: 'মাছ বাজার কমিটি', product: 'দেশি মাছ, পুকুরের মাছ', type: 'খুচরা', phone: '01700000003', area: 'মাছ পট্টি' }
];

const demoTransport = [
    { name: 'লোকাল ভ্যান সার্ভিস', route: 'গ্রাম থেকে হাট', load: '৫০০ কেজি', phone: '01700000011' },
    { name: 'পিকআপ ডেলিভারি', route: 'ইউনিয়ন থেকে উপজেলা', load: '২ টন', phone: '01700000012' },
    { name: 'ঠান্ডা মাছ পরিবহন', route: 'মাছ বাজার থেকে শহর', load: '১ টন', phone: '01700000013' }
];

export default function MarketUtilityHub({ union, market, markets = [], commodities = [] }) {
    const [activeTab, setActiveTab] = useState('sellers');
    const [complaint, setComplaint] = useState({ name: '', phone: '', type: 'high_price', note: '' });
    const [message, setMessage] = useState('');

    const marketName = market?.name || (markets?.length ? `${toBnDigits(markets.length)}টি বাজার` : 'গ্লোবাল বাজার');
    const topCommodities = useMemo(() => commodities.slice(0, 6), [commodities]);

    async function submitComplaint(event) {
        event.preventDefault();
        if (!union?.id) {
            setMessage('Union context পাওয়া যায়নি। ইউনিয়ন বাজার page থেকে অভিযোগ দিলে সরাসরি জমা হবে।');
            return;
        }

        try {
            const response = await fetch('/api/market/complaints', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locationId: union.id,
                    marketId: market?.id || null,
                    ...complaint
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Complaint save failed');
            setMessage('অভিযোগ জমা হয়েছে। Market manager/union desk review করে প্রয়োজন হলে যোগাযোগ করবে।');
            setComplaint({ name: '', phone: '', type: 'high_price', note: '' });
        } catch (error) {
            setMessage(error.message || 'অভিযোগ জমা হয়নি। আবার চেষ্টা করুন।');
        }
    }

    return (
        <section className="rounded-[36px] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/40 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-600">Market Utility Desk</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">বাজারের দরকারি কাজ এক জায়গায়</h2>
                    <p className="mt-1 text-sm font-bold text-slate-500">{marketName} - দোকান, পরিবহন, অভিযোগ ও SMS বার্তা।</p>
                </div>
                <div className="flex w-full gap-2 overflow-x-auto rounded-3xl bg-slate-100 p-2 sm:w-auto">
                    {utilityTabs.map(({ key, label, Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setActiveTab(key)}
                            className={`flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black transition ${
                                activeTab === key ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:text-slate-900'
                            }`}
                        >
                            <Icon size={15} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'sellers' && (
                <div className="grid gap-3 md:grid-cols-3">
                    {demoSellers.map((seller) => (
                        <ContactCard key={seller.phone} item={seller} meta={seller.type} title={seller.name} subtitle={seller.product} />
                    ))}
                </div>
            )}

            {activeTab === 'transport' && (
                <div className="grid gap-3 md:grid-cols-3">
                    {demoTransport.map((transport) => (
                        <ContactCard key={transport.phone} item={transport} meta={transport.load} title={transport.name} subtitle={transport.route} />
                    ))}
                </div>
            )}

            {activeTab === 'complaint' && (
                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-[28px] bg-rose-50 p-5">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white">
                            <AlertTriangle size={22} />
                        </div>
                        <h3 className="text-xl font-black text-slate-950">দাম/ওজন/ভেজাল অভিযোগ</h3>
                        <p className="mt-2 text-sm font-bold leading-relaxed text-rose-900/70">
                            দাম বেশি নেওয়া, ওজনে কম দেওয়া, ভেজাল পণ্য, দোকানদারের আচরণ - এগুলো citizen trust বাড়ানোর জন্য দ্রুত handle করতে হবে।
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-rose-800">
                            <span className="rounded-2xl bg-white px-3 py-2">দাম বেশি</span>
                            <span className="rounded-2xl bg-white px-3 py-2">ওজন কম</span>
                            <span className="rounded-2xl bg-white px-3 py-2">ভেজাল</span>
                            <span className="rounded-2xl bg-white px-3 py-2">রসিদ নেই</span>
                        </div>
                    </div>
                    <form onSubmit={submitComplaint} className="grid gap-3 rounded-[28px] border border-slate-100 bg-slate-50 p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <MarketInput required value={complaint.name} onChange={(value) => setComplaint({ ...complaint, name: value })} placeholder="আপনার নাম" />
                            <MarketInput required value={complaint.phone} onChange={(value) => setComplaint({ ...complaint, phone: value })} placeholder="017XXXXXXXX" />
                        </div>
                        <select
                            value={complaint.type}
                            onChange={(event) => setComplaint({ ...complaint, type: event.target.value })}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-rose-400"
                        >
                            <option value="high_price">দাম বেশি নিয়েছে</option>
                            <option value="low_weight">ওজনে কম দিয়েছে</option>
                            <option value="adulteration">ভেজাল/খারাপ পণ্য</option>
                            <option value="behavior">আচরণ/অন্য অভিযোগ</option>
                        </select>
                        <textarea
                            required
                            value={complaint.note}
                            onChange={(event) => setComplaint({ ...complaint, note: event.target.value })}
                            rows={4}
                            placeholder="কি সমস্যা হয়েছে লিখুন..."
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-rose-400"
                        />
                        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white">
                            <Send size={16} />
                            অভিযোগ পাঠান
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'broadcast' && (
                <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                    <div className="rounded-[28px] bg-slate-950 p-5 text-white">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-300">Daily Bulletin</p>
                        <h3 className="mt-2 text-2xl font-black">আজকের বাজার SMS/notice idea</h3>
                        <p className="mt-3 text-sm font-bold leading-relaxed text-slate-300">
                            {union?.name_bn || 'ইউনিয়ন'} বাজারে আজ {topCommodities.map((item) => item.name).join(', ') || 'প্রধান পণ্য'}-এর দাম update হয়েছে। দাম অস্বাভাবিক হলে citizen price alert পাঠানো যাবে।
                        </p>
                        <div className="mt-5 grid gap-2 sm:grid-cols-3">
                            {['Price alert', 'Farmer demand', 'Shortage notice'].map((item) => (
                                <span key={item} className="rounded-2xl bg-white/10 px-3 py-2 text-center text-xs font-black text-teal-100">{item}</span>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-5">
                        <div className="flex items-center gap-3">
                            <UsersRound className="text-teal-600" />
                            <h3 className="text-lg font-black text-slate-950">কারা সুবিধা পাবে</h3>
                        </div>
                        <ul className="mt-4 space-y-3 text-sm font-bold text-slate-600">
                            <li className="rounded-2xl bg-white p-3">ক্রেতা - কোথায় কম দামে পাওয়া যায় বুঝবে।</li>
                            <li className="rounded-2xl bg-white p-3">কৃষক - বিক্রির demand ও transport পাবে।</li>
                            <li className="rounded-2xl bg-white p-3">ইউনিয়ন - বাজারদর monitor ও complaint handle করবে।</li>
                        </ul>
                    </div>
                </div>
            )}

            {message && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl bg-teal-50 p-4 text-sm font-bold text-teal-800">
                    <ShoppingBag size={18} className="mt-0.5 shrink-0" />
                    <p className="flex-1">{message}</p>
                    <button type="button" onClick={() => setMessage('')} className="text-teal-700"><X size={16} /></button>
                </div>
            )}
        </section>
    );
}

function ContactCard({ item, title, subtitle, meta }) {
    return (
        <div className="rounded-[26px] border border-slate-100 bg-slate-50 p-4">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm">
                <Store size={20} />
            </div>
            <p className="text-lg font-black text-slate-950">{title}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">{subtitle}</p>
            <div className="mt-4 flex items-center justify-between gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-500">{meta}</span>
                <a href={`tel:${item.phone}`} className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-3 py-1.5 text-[10px] font-black text-white">
                    <Phone size={12} />
                    কল
                </a>
            </div>
            <p className="mt-3 text-[11px] font-bold text-slate-400">{item.area || item.route}</p>
        </div>
    );
}

function MarketInput({ value, onChange, placeholder, required = false }) {
    return (
        <input
            required={required}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-teal-400"
        />
    );
}

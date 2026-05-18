'use client';

import { useEffect, useState } from 'react';
import { Loader2, MessageSquare, Plus, WalletCards } from 'lucide-react';
import { smsService } from '@/lib/services/smsService';

export default function AdminSmsPage() {
    const [gateways, setGateways] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [gatewayForm, setGatewayForm] = useState({ name: '', provider: '', senderId: '', apiBaseUrl: '', apiKey: '', isActive: false });
    const [packageForm, setPackageForm] = useState({ name: '', credits: '', price: '', isActive: true });

    useEffect(() => {
        async function load() {
            try {
                const [gatewayData, packageData] = await Promise.all([
                    smsService.getGateways(),
                    smsService.getPackages()
                ]);
                setGateways(gatewayData);
                setPackages(packageData);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    async function handleGatewaySubmit(event) {
        event.preventDefault();
        setSaving(true);
        try {
            const created = await smsService.createGateway(gatewayForm);
            setGateways((current) => [created, ...current]);
            setGatewayForm({ name: '', provider: '', senderId: '', apiBaseUrl: '', apiKey: '', isActive: false });
        } finally {
            setSaving(false);
        }
    }

    async function handlePackageSubmit(event) {
        event.preventDefault();
        setSaving(true);
        try {
            const created = await smsService.createPackage(packageForm);
            setPackages((current) => [...current, created].sort((a, b) => a.credits - b.credits));
            setPackageForm({ name: '', credits: '', price: '', isActive: true });
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-teal-600" /></div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-800">SMS ব্যবস্থাপনা</h1>
                <p className="mt-2 font-bold text-slate-500">Gateway, package এবং wallet system এখান থেকে চালু হবে।</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-[32px] border border-slate-200 bg-white p-6">
                    <div className="mb-5 flex items-center gap-3">
                        <MessageSquare className="text-teal-600" />
                        <h2 className="text-xl font-black text-slate-800">Gateway</h2>
                    </div>
                    <div className="space-y-3">
                        {gateways.length === 0 ? (
                            <p className="text-sm font-bold text-slate-400">এখনও কোনো gateway configure করা হয়নি।</p>
                        ) : gateways.map((gateway) => (
                            <div key={gateway.id} className="rounded-2xl bg-slate-50 p-4">
                                <p className="font-black text-slate-800">{gateway.name}</p>
                                <p className="text-xs font-bold text-slate-400">{gateway.provider} | {gateway.sender_id || 'sender নেই'}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-[32px] border border-slate-200 bg-white p-6">
                    <div className="mb-5 flex items-center gap-3">
                        <WalletCards className="text-teal-600" />
                        <h2 className="text-xl font-black text-slate-800">SMS Package</h2>
                    </div>
                    <div className="space-y-3">
                        {packages.length === 0 ? (
                            <p className="text-sm font-bold text-slate-400">এখনও কোনো package তৈরি হয়নি।</p>
                        ) : packages.map((item) => (
                            <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                                <div>
                                    <p className="font-black text-slate-800">{item.name}</p>
                                    <p className="text-xs font-bold text-slate-400">{item.credits} SMS</p>
                                </div>
                                <p className="font-black text-teal-700">৳ {item.price}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <form onSubmit={handleGatewaySubmit} className="rounded-[32px] border border-slate-200 bg-white p-6">
                    <div className="mb-5 flex items-center gap-3">
                        <Plus className="text-teal-600" />
                        <h2 className="text-xl font-black text-slate-800">নতুন Gateway</h2>
                    </div>
                    <div className="grid gap-3">
                        <input required value={gatewayForm.name} onChange={(e) => setGatewayForm({ ...gatewayForm, name: e.target.value })} placeholder="Gateway name" className="rounded-2xl border border-slate-200 px-4 py-3" />
                        <input required value={gatewayForm.provider} onChange={(e) => setGatewayForm({ ...gatewayForm, provider: e.target.value })} placeholder="Provider" className="rounded-2xl border border-slate-200 px-4 py-3" />
                        <input value={gatewayForm.senderId} onChange={(e) => setGatewayForm({ ...gatewayForm, senderId: e.target.value })} placeholder="Sender ID" className="rounded-2xl border border-slate-200 px-4 py-3" />
                        <input value={gatewayForm.apiBaseUrl} onChange={(e) => setGatewayForm({ ...gatewayForm, apiBaseUrl: e.target.value })} placeholder="API base URL" className="rounded-2xl border border-slate-200 px-4 py-3" />
                        <input value={gatewayForm.apiKey} onChange={(e) => setGatewayForm({ ...gatewayForm, apiKey: e.target.value })} placeholder="API key" className="rounded-2xl border border-slate-200 px-4 py-3" />
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                            <input type="checkbox" checked={gatewayForm.isActive} onChange={(e) => setGatewayForm({ ...gatewayForm, isActive: e.target.checked })} />
                            Active gateway
                        </label>
                        <button disabled={saving} className="rounded-2xl bg-slate-900 px-4 py-3 font-black text-white">Gateway save করুন</button>
                    </div>
                </form>

                <form onSubmit={handlePackageSubmit} className="rounded-[32px] border border-slate-200 bg-white p-6">
                    <div className="mb-5 flex items-center gap-3">
                        <Plus className="text-teal-600" />
                        <h2 className="text-xl font-black text-slate-800">নতুন Package</h2>
                    </div>
                    <div className="grid gap-3">
                        <input required value={packageForm.name} onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })} placeholder="Package name" className="rounded-2xl border border-slate-200 px-4 py-3" />
                        <input required type="number" value={packageForm.credits} onChange={(e) => setPackageForm({ ...packageForm, credits: e.target.value })} placeholder="Credits" className="rounded-2xl border border-slate-200 px-4 py-3" />
                        <input required type="number" value={packageForm.price} onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })} placeholder="Price" className="rounded-2xl border border-slate-200 px-4 py-3" />
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                            <input type="checkbox" checked={packageForm.isActive} onChange={(e) => setPackageForm({ ...packageForm, isActive: e.target.checked })} />
                            Active package
                        </label>
                        <button disabled={saving} className="rounded-2xl bg-teal-600 px-4 py-3 font-black text-white">Package save করুন</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    CheckCircle2,
    Clock3,
    BarChart3,
    AlertTriangle,
    Loader2,
    MessageSquare,
    PackagePlus,
    Plus,
    RefreshCw,
    Send,
    ShieldAlert,
    TrendingUp,
    WalletCards,
    XCircle
} from 'lucide-react';
import { smsService } from '@/lib/services/smsService';
import { toBnDigits } from '@/lib/utils/format';
import SmsAutoFollowUpRules from '@/components/sections/sms/SmsAutoFollowUpRules';
import SmsDeliveryReport from '@/components/sections/sms/SmsDeliveryReport';

function money(value) {
    return `৳ ${toBnDigits(Number(value || 0).toLocaleString('bn-BD'))}`;
}

export default function AdminSmsPage() {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('insights');
    const [gatewayForm, setGatewayForm] = useState({ name: '', provider: '', senderId: '', apiBaseUrl: '', apiKey: '', isActive: false });
    const [packageForm, setPackageForm] = useState({ name: '', credits: '', price: '', description: '', validityDays: '365', sortOrder: '0', isActive: true });

    const pendingRecharges = useMemo(() => (overview?.rechargeRequests || []).filter((item) => item.status === 'pending'), [overview]);

    async function load() {
        setLoading(true);
        try {
            setOverview(await smsService.getAdminOverview());
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function handleGatewaySubmit(event) {
        event.preventDefault();
        setSaving(true);
        try {
            await smsService.createGateway(gatewayForm);
            setGatewayForm({ name: '', provider: '', senderId: '', apiBaseUrl: '', apiKey: '', isActive: false });
            await load();
        } finally {
            setSaving(false);
        }
    }

    async function handlePackageSubmit(event) {
        event.preventDefault();
        setSaving(true);
        try {
            await smsService.createPackage(packageForm);
            setPackageForm({ name: '', credits: '', price: '', description: '', validityDays: '365', sortOrder: '0', isActive: true });
            await load();
        } finally {
            setSaving(false);
        }
    }

    async function reviewRecharge(id, action) {
        setSaving(true);
        try {
            if (action === 'approve') {
                await smsService.approveRecharge(id);
            } else {
                await smsService.rejectRecharge(id, 'Rejected from admin panel');
            }
            await load();
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-teal-600" /></div>;
    }

    const stats = overview?.stats || {};
    const pendingRevenue = pendingRecharges.reduce((sum, item) => sum + Number(item.payable_amount || 0), 0);
    const actionQueue = overview?.actionQueue || [];
    const usageRate = Number(stats.approvedRechargeCredits || 0) > 0
        ? Math.round((Number(stats.usedCredits || 0) / Number(stats.approvedRechargeCredits || 1)) * 100)
        : 0;
    const failedRate = Number(stats.totalQueuedWindow || 0) > 0
        ? Math.round((Number(stats.failedMessages || 0) / Number(stats.totalQueuedWindow || 1)) * 100)
        : 0;
    const estimatedRemainingValue = Number(stats.approvedRechargeCredits || 0) > 0
        ? (Number(stats.totalBalance || 0) * Number(stats.approvedRechargeRevenue || 0)) / Number(stats.approvedRechargeCredits || 1)
        : 0;

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[34px] bg-slate-950 text-white shadow-xl shadow-slate-300/40">
                <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-300">DigiGram SMS Business</p>
                        <h1 className="mt-3 text-3xl font-black sm:text-4xl">SMS Wallet ও Recharge Center</h1>
                        <p className="mt-2 max-w-2xl text-sm font-bold text-slate-300">
                            Package বিক্রি, recharge approval, wallet balance এবং SMS queue এক জায়গা থেকে control করুন।
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={load}
                        className="inline-flex h-fit items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/10 hover:bg-white/15"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
                <div className="grid border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total Wallet" value={stats.totalWallets || 0} />
                    <StatCard label="SMS Balance" value={stats.totalBalance || 0} />
                    <StatCard label="Pending Recharge" value={stats.pendingRecharge || 0} />
                    <StatCard label="Queued SMS" value={stats.queuedMessages || 0} />
                    <StatCard label="Revenue" value={money(stats.approvedRechargeRevenue || 0)} raw />
                    <StatCard label="Used SMS" value={stats.usedCredits || 0} />
                    <StatCard label="Sent SMS" value={stats.sentMessages || 0} />
                    <StatCard label="Low Balance" value={stats.lowBalanceCount || 0} />
                </div>
            </section>

            <div className="flex gap-2 overflow-x-auto rounded-[24px] bg-slate-100 p-2">
                {[
                    ['insights', 'Business Insight', BarChart3],
                    ['recharge', 'Recharge Approval', Clock3],
                    ['wallets', 'Wallets', WalletCards],
                    ['packages', 'Packages', PackagePlus],
                    ['messages', 'Delivery Report', Send],
                    ['gateway', 'Gateway', MessageSquare]
                ].map(([key, label, Icon]) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                            activeTab === key ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <Icon size={17} />
                        {label}
                    </button>
                ))}
            </div>

            <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                            <ShieldAlert size={23} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Action Required</h2>
                            <p className="text-sm font-bold text-slate-400">System নিজে যেসব SMS business কাজ ধরেছে, সেগুলো আগে complete করুন।</p>
                        </div>
                    </div>
                    <span className="w-fit rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
                        {toBnDigits(actionQueue.length)} action
                    </span>
                </div>
                {actionQueue.length === 0 ? (
                    <div className="rounded-3xl bg-teal-50 p-5 text-sm font-bold text-teal-800">
                        আপাতত critical SMS business action নেই। Recharge, gateway এবং queue healthy আছে।
                    </div>
                ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                        {actionQueue.slice(0, 8).map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setActiveTab(item.targetTab || 'insights')}
                                className={`rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${actionTone(item.severity)}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest opacity-60">{item.type}</p>
                                        <h3 className="mt-1 text-lg font-black">{item.title}</h3>
                                    </div>
                                    <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                        {item.severity}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm font-bold leading-relaxed opacity-80">{item.message}</p>
                                {Number(item.amount || 0) > 0 && (
                                    <p className="mt-3 w-fit rounded-full bg-white px-3 py-1 text-xs font-black">
                                        Potential: {money(item.amount)}
                                    </p>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            <SmsAutoFollowUpRules
                title="Platform Auto Follow-up Rules"
                subtitle="DigiGram-এর citizen service, tax, school, support desk ও emergency broadcast কোন event-এ SMS চালাবে তার operational map।"
            />

            {activeTab === 'insights' && (
                <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6">
                        <div className="mb-5 flex items-center gap-3">
                            <TrendingUp className="text-teal-600" />
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">SMS Profit Zone</h2>
                                <p className="text-sm font-bold text-slate-400">কোন service থেকে SMS যাচ্ছে, কোথায় wallet কম, business growth এখানে দেখুন।</p>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <InsightCard label="Approved Revenue" value={money(stats.approvedRechargeRevenue || 0)} />
                            <InsightCard label="Sold Credits" value={`${toBnDigits(stats.approvedRechargeCredits || 0)} SMS`} />
                            <InsightCard label="Used Credits" value={`${toBnDigits(stats.usedCredits || 0)} SMS`} />
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-4">
                            <InsightCard label="Pending Revenue" value={money(pendingRevenue)} tone="amber" />
                            <InsightCard label="Usage Rate" value={`${toBnDigits(usageRate)}%`} tone="teal" />
                            <InsightCard label="Remaining Value" value={money(estimatedRemainingValue)} tone="slate" />
                            <InsightCard label="Failed Rate" value={`${toBnDigits(failedRate)}%`} tone={failedRate > 5 ? 'rose' : 'slate'} />
                        </div>
                        <div className="mt-6 grid gap-3 rounded-3xl border border-teal-100 bg-teal-50 p-4 sm:grid-cols-3">
                            <BusinessHint
                                title="Recharge follow-up"
                                text={`${toBnDigits(pendingRecharges.length)} pending request থেকে ${money(pendingRevenue)} revenue approve হতে পারে।`}
                            />
                            <BusinessHint
                                title="Low balance clients"
                                text={`${toBnDigits(stats.lowBalanceCount || 0)} wallet কম balance-এ আছে। ওদের SMS না গেলে citizen update আটকে যাবে।`}
                            />
                            <BusinessHint
                                title="Queue health"
                                text={`${toBnDigits(stats.queuedMessages || 0)} queued, ${toBnDigits(stats.failedMessages || 0)} failed SMS gateway check দরকার।`}
                            />
                        </div>
                        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
                            <div className="flex flex-col gap-2 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Monthly Revenue Report</p>
                                    <h3 className="text-lg font-black text-slate-900">Recharge income vs SMS use</h3>
                                </div>
                                <span className="w-fit rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-teal-700">
                                    Last 6 months
                                </span>
                            </div>
                            {(overview?.monthlyReport || []).length === 0 ? (
                                <EmptyState text="Monthly report data নেই।" />
                            ) : (
                                <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                                    {overview.monthlyReport.map((item) => (
                                        <div key={item.key} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-sm font-black text-slate-900">{item.label}</p>
                                                <p className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">{money(item.revenue)}</p>
                                            </div>
                                            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                                <MiniMetric label="Sold" value={item.purchasedCredits} />
                                                <MiniMetric label="Used" value={item.usedCredits} />
                                                <MiniMetric label="Sent" value={item.sent} />
                                            </div>
                                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-teal-500"
                                                    style={{ width: `${Math.min(100, Math.round((Number(item.usedCredits || 0) / Math.max(1, Number(item.purchasedCredits || 0))) * 100))}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
                            <div className="bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Service-wise SMS Use</div>
                            {(overview?.categoryStats || []).length === 0 ? (
                                <EmptyState text="এখনো category-wise SMS data নেই।" />
                            ) : overview.categoryStats.map((item) => (
                                <div key={item.category} className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-[1fr_90px_90px_90px] sm:items-center">
                                    <div>
                                        <p className="font-black text-slate-900">{item.category}</p>
                                        <p className="text-xs font-bold text-slate-400">Total {toBnDigits(item.total || 0)} message</p>
                                    </div>
                                    <BadgeStat label="Queued" value={item.queued || 0} tone="amber" />
                                    <BadgeStat label="Sent" value={item.sent || 0} tone="teal" />
                                    <BadgeStat label="Failed" value={item.failed || 0} tone="rose" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-[32px] border border-amber-200 bg-amber-50 p-5 sm:p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <AlertTriangle className="text-amber-600" />
                                <h2 className="text-xl font-black text-slate-900">Low Balance Alert</h2>
                            </div>
                            {(overview?.lowBalanceWallets || []).length === 0 ? (
                                <p className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-500">সব wallet এখন safe আছে।</p>
                            ) : (
                                <div className="space-y-3">
                                    {overview.lowBalanceWallets.slice(0, 8).map((wallet) => (
                                        <div key={wallet.id} className="rounded-2xl bg-white p-4">
                                            <p className="text-sm font-black text-slate-900">
                                                {wallet.owner?.name_bn || wallet.owner?.name || wallet.owner?.name_en || wallet.owner_id}
                                            </p>
                                            <p className="mt-1 text-xs font-bold text-amber-700">
                                                Balance {toBnDigits(wallet.balance || 0)} SMS · Threshold {toBnDigits(wallet.low_balance_threshold || 50)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6">
                            <h2 className="mb-4 text-xl font-black text-slate-900">Top SMS Users</h2>
                            {(overview?.ownerStats || []).length === 0 ? (
                                <EmptyState text="এখনো usage নেই।" />
                            ) : overview.ownerStats.slice(0, 8).map((item) => (
                                <div key={`${item.owner_type}-${item.owner_id}`} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
                                    <div>
                                        <p className="text-sm font-black text-slate-900">{item.owner_name || item.owner_id}</p>
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{item.owner_type}</p>
                                    </div>
                                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">
                                        {toBnDigits(item.total || 0)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {activeTab === 'recharge' && (
                <section className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Pending Recharge</h2>
                            <p className="text-sm font-bold text-slate-400">Payment verify করে approve করলে wallet balance বাড়বে।</p>
                        </div>
                        <span className="w-fit rounded-full bg-amber-50 px-4 py-2 text-xs font-black text-amber-700">
                            {toBnDigits(pendingRecharges.length)} pending
                        </span>
                    </div>
                    {pendingRecharges.length === 0 ? (
                        <EmptyState text="এখন কোনো pending recharge নেই।" />
                    ) : (
                        <div className="grid gap-4">
                            {pendingRecharges.map((item) => (
                                <div key={item.id} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                                    <div className="grid gap-3 sm:grid-cols-4">
                                        <Info label="Package" value={item.package?.name || 'Custom'} />
                                        <Info label="Credits" value={`${toBnDigits(item.requested_credits)} SMS`} />
                                        <Info label="Amount" value={money(item.payable_amount)} />
                                        <Info label="TRX / Phone" value={`${item.transaction_id || 'TRX নেই'} · ${item.payer_phone || 'phone নেই'}`} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            disabled={saving}
                                            onClick={() => reviewRecharge(item.id, 'approve')}
                                            className="flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-black text-white hover:bg-teal-700 disabled:opacity-50"
                                        >
                                            <CheckCircle2 size={17} />
                                            Approve
                                        </button>
                                        <button
                                            disabled={saving}
                                            onClick={() => reviewRecharge(item.id, 'reject')}
                                            className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                        >
                                            <XCircle size={17} />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {activeTab === 'wallets' && (
                <section className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Wallet Business List</h2>
                            <p className="text-sm font-bold text-slate-400">প্রতিটি union/institution কত কিনেছে, কত use করেছে, follow-up দরকার কি না।</p>
                        </div>
                        <span className="w-fit rounded-full bg-teal-50 px-4 py-2 text-xs font-black text-teal-700">
                            Avg {money(Number(stats.averageCreditPrice || 0).toFixed(2))} / SMS
                        </span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {(overview?.walletBusinessRows || overview?.wallets || []).map((wallet) => (
                            <div key={wallet.id} className={`rounded-3xl border p-5 ${wallet.needsFollowup ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{wallet.owner_type}</p>
                                <h3 className="mt-2 text-lg font-black text-slate-900">
                                    {wallet.owner_name || wallet.owner?.name_bn || wallet.owner?.name || wallet.owner?.name_en || wallet.owner_id}
                                </h3>
                                <div className="mt-5 rounded-2xl bg-teal-50 p-4">
                                    <p className="text-xs font-black text-teal-700">Available Balance</p>
                                    <p className="mt-1 text-3xl font-black text-teal-900">{toBnDigits(wallet.balance || 0)} SMS</p>
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                    <MiniMetric label="Bought" value={wallet.purchasedCredits || 0} />
                                    <MiniMetric label="Used" value={wallet.usedCredits || 0} />
                                    <MiniMetric label="Value" value={money(wallet.estimatedBalanceValue || 0)} raw />
                                </div>
                                {wallet.needsFollowup && (
                                    <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold text-amber-800">
                                        Low balance follow-up দরকার।
                                        {wallet.suggestedPackage ? (
                                            <span className="mt-1 block text-xs">
                                                Suggested: {wallet.suggestedPackage.name} · {toBnDigits(wallet.suggestedPackage.credits)} SMS · {money(wallet.suggestedPackage.price)}
                                            </span>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {activeTab === 'packages' && (
                <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
                    <div className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6">
                        <h2 className="mb-5 text-2xl font-black text-slate-900">SMS Packages</h2>
                        <div className="grid gap-4">
                            {(overview?.packages || []).map((item) => (
                                <div key={item.id} className="flex items-center justify-between rounded-3xl bg-slate-50 p-5">
                                    <div>
                                        <p className="font-black text-slate-900">{item.name}</p>
                                        <p className="text-sm font-bold text-slate-500">{toBnDigits(item.credits)} SMS · {item.description || 'No description'}</p>
                                    </div>
                                    <p className="text-xl font-black text-teal-700">{money(item.price)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handlePackageSubmit} className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6">
                        <div className="mb-5 flex items-center gap-3">
                            <Plus className="text-teal-600" />
                            <h2 className="text-xl font-black text-slate-800">নতুন Package</h2>
                        </div>
                        <div className="grid gap-3">
                            <Input required value={packageForm.name} onChange={(value) => setPackageForm({ ...packageForm, name: value })} placeholder="Package name" />
                            <Input required type="number" value={packageForm.credits} onChange={(value) => setPackageForm({ ...packageForm, credits: value })} placeholder="Credits" />
                            <Input required type="number" value={packageForm.price} onChange={(value) => setPackageForm({ ...packageForm, price: value })} placeholder="Price" />
                            <Input value={packageForm.description} onChange={(value) => setPackageForm({ ...packageForm, description: value })} placeholder="Short description" />
                            <button disabled={saving} className="rounded-2xl bg-teal-600 px-4 py-3 font-black text-white disabled:opacity-50">Package save করুন</button>
                        </div>
                    </form>
                </section>
            )}

            {activeTab === 'messages' && (
                <section className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6">
                    <SmsDeliveryReport
                        messages={overview?.messages || []}
                        title="Platform SMS Delivery Report"
                        subtitle="সব wallet/source মিলিয়ে recent SMS status, delivery rate এবং failed queue দেখুন।"
                        onRefresh={load}
                    />
                    <h2 className="mb-5 mt-6 text-2xl font-black text-slate-900">Recent SMS Queue</h2>
                    <div className="divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-100">
                        {(overview?.messages || []).length === 0 ? (
                            <EmptyState text="এখনও SMS queue হয়নি।" />
                        ) : overview.messages.map((item) => (
                            <div key={item.id} className="grid gap-3 p-4 md:grid-cols-[150px_120px_1fr_100px] md:items-center">
                                <Info label="Phone" value={item.recipient_phone} />
                                <Info label="Category" value={item.category} />
                                <p className="text-sm font-bold text-slate-600">{item.message}</p>
                                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-600">{item.status}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {activeTab === 'gateway' && (
                <section className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6">
                        <h2 className="mb-5 text-2xl font-black text-slate-900">Gateway</h2>
                        <div className="space-y-3">
                            {(overview?.gateways || []).length === 0 ? (
                                <EmptyState text="এখনও কোনো gateway configure করা হয়নি।" />
                            ) : overview.gateways.map((gateway) => (
                                <div key={gateway.id} className="rounded-2xl bg-slate-50 p-4">
                                    <p className="font-black text-slate-800">{gateway.name}</p>
                                    <p className="text-xs font-bold text-slate-400">{gateway.provider} | {gateway.sender_id || 'sender নেই'}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleGatewaySubmit} className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6">
                        <div className="mb-5 flex items-center gap-3">
                            <Plus className="text-teal-600" />
                            <h2 className="text-xl font-black text-slate-800">নতুন Gateway</h2>
                        </div>
                        <div className="grid gap-3">
                            <Input required value={gatewayForm.name} onChange={(value) => setGatewayForm({ ...gatewayForm, name: value })} placeholder="Gateway name" />
                            <Input required value={gatewayForm.provider} onChange={(value) => setGatewayForm({ ...gatewayForm, provider: value })} placeholder="Provider" />
                            <Input value={gatewayForm.senderId} onChange={(value) => setGatewayForm({ ...gatewayForm, senderId: value })} placeholder="Sender ID" />
                            <Input value={gatewayForm.apiBaseUrl} onChange={(value) => setGatewayForm({ ...gatewayForm, apiBaseUrl: value })} placeholder="API base URL" />
                            <Input value={gatewayForm.apiKey} onChange={(value) => setGatewayForm({ ...gatewayForm, apiKey: value })} placeholder="API key" />
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                <input type="checkbox" checked={gatewayForm.isActive} onChange={(event) => setGatewayForm({ ...gatewayForm, isActive: event.target.checked })} />
                                Active gateway
                            </label>
                            <button disabled={saving} className="rounded-2xl bg-slate-900 px-4 py-3 font-black text-white disabled:opacity-50">Gateway save করুন</button>
                        </div>
                    </form>
                </section>
            )}
        </div>
    );
}

function StatCard({ label, value, raw = false }) {
    return (
        <div className="border-white/10 p-5 sm:border-l">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-black text-white">{raw ? value : toBnDigits(value)}</p>
        </div>
    );
}

function InsightCard({ label, value, tone = 'slate' }) {
    const tones = {
        teal: 'bg-teal-50 text-teal-950',
        amber: 'bg-amber-50 text-amber-950',
        rose: 'bg-rose-50 text-rose-950',
        slate: 'bg-slate-50 text-slate-900'
    };
    return (
        <div className={`rounded-3xl p-5 ${tones[tone] || tones.slate}`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
        </div>
    );
}

function BusinessHint({ title, text }) {
    return (
        <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black text-slate-900">{title}</p>
            <p className="mt-1 text-xs font-bold leading-relaxed text-slate-500">{text}</p>
        </div>
    );
}

function BadgeStat({ label, value, tone = 'slate' }) {
    const tones = {
        teal: 'bg-teal-50 text-teal-700',
        amber: 'bg-amber-50 text-amber-700',
        rose: 'bg-rose-50 text-rose-700',
        slate: 'bg-slate-100 text-slate-700'
    };
    return (
        <div className={`rounded-2xl px-3 py-2 text-center ${tones[tone] || tones.slate}`}>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{label}</p>
            <p className="text-lg font-black">{toBnDigits(value || 0)}</p>
        </div>
    );
}

function MiniMetric({ label, value, raw = false }) {
    return (
        <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-black text-slate-900">{raw ? value : toBnDigits(value || 0)}</p>
        </div>
    );
}

function actionTone(severity) {
    if (severity === 'critical') return 'border-rose-200 bg-rose-50 text-rose-950';
    if (severity === 'warning') return 'border-amber-200 bg-amber-50 text-amber-950';
    return 'border-sky-200 bg-sky-50 text-sky-950';
}

function Info({ label, value }) {
    return (
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-1 break-words text-sm font-black text-slate-800">{value || 'N/A'}</p>
        </div>
    );
}

function Input({ value, onChange, placeholder, type = 'text', required = false }) {
    return (
        <input
            required={required}
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-teal-400"
        />
    );
}

function EmptyState({ text }) {
    return (
        <p className="rounded-3xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">{text}</p>
    );
}

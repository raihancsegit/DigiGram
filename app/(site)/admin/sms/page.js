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
    Pencil,
    Plus,
    RefreshCw,
    Send,
    ShieldAlert,
    TrendingUp,
    Trash2,
    WalletCards,
    XCircle
} from 'lucide-react';
import { smsService } from '@/lib/services/smsService';
import { toBnDigits } from '@/lib/utils/format';
import SmsAutoFollowUpRules from '@/components/sections/sms/SmsAutoFollowUpRules';
import SmsDeliveryReport from '@/components/sections/sms/SmsDeliveryReport';

const gatewayPresets = {
    mock: {
        name: 'Mock SMS Gateway',
        provider: 'mock',
        senderId: 'DigiGram',
        apiBaseUrl: '',
        apiKey: '',
        timeoutMs: '15000',
        priority: '999',
        webhookEnabled: false,
        isActive: false,
        configText: JSON.stringify({
            note: 'Local/UAT only. Marks queued SMS as sent without external provider.'
        }, null, 2)
    },
    json: {
        name: 'JSON SMS Gateway',
        provider: 'generic_json',
        senderId: 'DigiGram',
        apiBaseUrl: 'https://provider.example.com/api/sms/send',
        apiKey: '',
        timeoutMs: '15000',
        priority: '100',
        webhookEnabled: true,
        isActive: false,
        configText: JSON.stringify({
            method: 'POST',
            payload_mode: 'json',
            recipient_key: 'to',
            message_key: 'message',
            sender_key: 'sender_id',
            headers: {},
            static_payload: {},
            webhook_message_id_path: 'message_id',
            webhook_status_path: 'status',
            webhook_secret_env: 'SMS_WEBHOOK_SECRET'
        }, null, 2)
    },
    form: {
        name: 'Form SMS Gateway',
        provider: 'generic_form',
        senderId: 'DigiGram',
        apiBaseUrl: 'https://provider.example.com/api/sms/send',
        apiKey: '',
        timeoutMs: '15000',
        priority: '200',
        webhookEnabled: true,
        isActive: false,
        configText: JSON.stringify({
            method: 'POST',
            payload_mode: 'form',
            recipient_key: 'mobile',
            message_key: 'message',
            sender_key: 'senderid',
            static_payload: {}
        }, null, 2)
    },
    query: {
        name: 'Query SMS Gateway',
        provider: 'generic_query',
        senderId: 'DigiGram',
        apiBaseUrl: 'https://provider.example.com/api/sms/send',
        apiKey: '',
        timeoutMs: '15000',
        priority: '300',
        webhookEnabled: true,
        isActive: false,
        configText: JSON.stringify({
            method: 'GET',
            payload_mode: 'query',
            recipient_key: 'to',
            message_key: 'text',
            sender_key: 'from',
            static_payload: {}
        }, null, 2)
    }
};

function money(value) {
    return `৳ ${toBnDigits(Number(value || 0).toLocaleString('bn-BD'))}`;
}

export default function AdminSmsPage() {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [processingQueue, setProcessingQueue] = useState(false);
    const [processStatus, setProcessStatus] = useState('');
    const [activeTab, setActiveTab] = useState('insights');
    const [gatewayForm, setGatewayForm] = useState({ name: '', provider: '', senderId: '', apiBaseUrl: '', apiKey: '', timeoutMs: '15000', priority: '100', webhookEnabled: true, isActive: false, configText: '{}' });
    const [editingGatewayId, setEditingGatewayId] = useState('');
    const [packageForm, setPackageForm] = useState({ name: '', credits: '', price: '', description: '', validityDays: '365', sortOrder: '0', isActive: true });
    const [editingPackageId, setEditingPackageId] = useState('');
    const [packageStatus, setPackageStatus] = useState('');
    const [gatewayTestPhones, setGatewayTestPhones] = useState({});
    const [testingGateway, setTestingGateway] = useState('');
    const [gatewayTestResults, setGatewayTestResults] = useState({});
    const [adjustmentWallet, setAdjustmentWallet] = useState(null);
    const [adjustmentForm, setAdjustmentForm] = useState({ credits: '', note: '' });
    const [adjustmentStatus, setAdjustmentStatus] = useState('');
    const [quickTestForm, setQuickTestForm] = useState({
        phone: '',
        message: 'DigiGram SMS quick test successful.'
    });
    const [quickTestStatus, setQuickTestStatus] = useState(null);
    const [quickTesting, setQuickTesting] = useState(false);

    const pendingRecharges = useMemo(() => (overview?.rechargeRequests || []).filter((item) => item.status === 'pending'), [overview]);
    const activeGateway = useMemo(() => (
        (overview?.gateways || [])
            .filter((gateway) => gateway.is_active)
            .sort((a, b) => Number(a.priority || 999) - Number(b.priority || 999))[0] || null
    ), [overview]);

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
            if (editingGatewayId) {
                await smsService.updateGateway(editingGatewayId, gatewayForm);
            } else {
                await smsService.createGateway(gatewayForm);
            }
            resetGatewayForm();
            await load();
        } finally {
            setSaving(false);
        }
    }

    function resetGatewayForm() {
        setEditingGatewayId('');
        setGatewayForm({ name: '', provider: '', senderId: '', apiBaseUrl: '', apiKey: '', timeoutMs: '15000', priority: '100', webhookEnabled: true, isActive: false, configText: '{}' });
    }

    function editGateway(gateway) {
        setEditingGatewayId(gateway.id);
        setGatewayForm({
            name: gateway.name || '',
            provider: gateway.provider || '',
            senderId: gateway.sender_id || '',
            apiBaseUrl: gateway.api_base_url || '',
            apiKey: '',
            timeoutMs: String(gateway.timeout_ms || 15000),
            priority: String(gateway.priority || 100),
            webhookEnabled: gateway.webhook_enabled !== false,
            isActive: Boolean(gateway.is_active),
            configText: JSON.stringify(gateway.config || {}, null, 2)
        });
    }

    async function deleteGateway(gateway) {
        if (!window.confirm(`${gateway.name} gateway মুছে ফেলবেন?`)) return;
        setSaving(true);
        try {
            await smsService.deleteGateway(gateway.id);
            if (editingGatewayId === gateway.id) resetGatewayForm();
            await load();
        } catch (error) {
            setGatewayTestResults((current) => ({
                ...current,
                [gateway.id]: { ok: false, message: error.message || 'Gateway delete failed' }
            }));
        } finally {
            setSaving(false);
        }
    }

    async function handlePackageSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setPackageStatus('');
        try {
            if (editingPackageId) {
                await smsService.updatePackage(editingPackageId, packageForm);
            } else {
                await smsService.createPackage(packageForm);
            }
            resetPackageForm();
            await load();
        } catch (error) {
            setPackageStatus(error.message || 'Package save failed');
        } finally {
            setSaving(false);
        }
    }

    function resetPackageForm() {
        setEditingPackageId('');
        setPackageForm({ name: '', credits: '', price: '', description: '', validityDays: '365', sortOrder: '0', isActive: true });
    }

    function editPackage(item) {
        setEditingPackageId(item.id);
        setPackageStatus('');
        setPackageForm({
            name: item.name || '',
            credits: String(item.credits || ''),
            price: String(item.price || ''),
            description: item.description || '',
            validityDays: String(item.validity_days || 365),
            sortOrder: String(item.sort_order || 0),
            isActive: item.is_active !== false
        });
    }

    async function togglePackage(item) {
        setSaving(true);
        setPackageStatus('');
        try {
            await smsService.togglePackage(item.id, !item.is_active);
            await load();
        } catch (error) {
            setPackageStatus(error.message || 'Package update failed');
        } finally {
            setSaving(false);
        }
    }

    async function deletePackage(item) {
        if (!window.confirm(`${item.name} package মুছে ফেলবেন?`)) return;
        setSaving(true);
        setPackageStatus('');
        try {
            await smsService.deletePackage(item.id);
            if (editingPackageId === item.id) resetPackageForm();
            await load();
        } catch (error) {
            setPackageStatus(error.message || 'Package delete failed');
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

    function openWalletAdjustment(wallet) {
        setAdjustmentWallet(wallet);
        setAdjustmentForm({ credits: '', note: '' });
        setAdjustmentStatus('');
    }

    async function submitWalletAdjustment(event) {
        event.preventDefault();
        const credits = Number(adjustmentForm.credits || 0);
        if (!adjustmentWallet || !credits || !adjustmentForm.note.trim()) {
            setAdjustmentStatus('Credit এবং adjustment-এর কারণ লিখুন।');
            return;
        }
        setSaving(true);
        setAdjustmentStatus('');
        try {
            const result = await smsService.adjustWallet(
                adjustmentWallet.owner_type,
                adjustmentWallet.owner_id,
                credits,
                adjustmentForm.note.trim()
            );
            setAdjustmentStatus(`${toBnDigits(Math.abs(result.appliedCredits || 0))} SMS ${Number(result.appliedCredits) > 0 ? 'যোগ' : 'কাটা'} হয়েছে।`);
            await load();
            setTimeout(() => setAdjustmentWallet(null), 700);
        } catch (error) {
            setAdjustmentStatus(error.message || 'Wallet adjustment failed');
        } finally {
            setSaving(false);
        }
    }

    async function processSmsQueue() {
        setProcessingQueue(true);
        setProcessStatus('');
        try {
            const result = await smsService.processQueue(50);
            setProcessStatus(`Processed ${toBnDigits(result.processed || 0)} SMS: ${toBnDigits(result.sent || 0)} sent, ${toBnDigits(result.retrying || 0)} retrying, ${toBnDigits(result.failed || 0)} failed.`);
            await load();
        } catch (error) {
            setProcessStatus(error.message || 'SMS processing failed');
        } finally {
            setProcessingQueue(false);
        }
    }

    async function retryFailedMessages(messageIds = []) {
        setProcessingQueue(true);
        setProcessStatus('');
        try {
            const result = await smsService.retryFailedMessages(messageIds);
            setProcessStatus(`${toBnDigits(result.retried || 0)} failed SMS আবার queue-তে দেওয়া হয়েছে।`);
            await load();
        } catch (error) {
            setProcessStatus(error.message || 'SMS retry failed');
        } finally {
            setProcessingQueue(false);
        }
    }

    async function toggleGateway(gatewayId, isActive) {
        setSaving(true);
        try {
            await smsService.toggleGateway(gatewayId, isActive);
            await load();
        } finally {
            setSaving(false);
        }
    }

    async function testGateway(gatewayId) {
        const phone = gatewayTestPhones[gatewayId] || '';
        setTestingGateway(gatewayId);
        setGatewayTestResults((current) => ({ ...current, [gatewayId]: null }));
        try {
            const result = await smsService.testGateway(gatewayId, phone);
            setGatewayTestResults((current) => ({
                ...current,
                [gatewayId]: {
                    ok: true,
                    message: result.mocked
                        ? 'Mock test সফল হয়েছে। কোনো বাস্তব SMS পাঠানো হয়নি।'
                        : `Provider SMS গ্রহণ করেছে${result.providerMessageId ? ` (${result.providerMessageId})` : ''}।`
                }
            }));
            await load();
        } catch (error) {
            setGatewayTestResults((current) => ({
                ...current,
                [gatewayId]: { ok: false, message: error.message || 'Gateway test failed' }
            }));
        } finally {
            setTestingGateway('');
        }
    }

    async function submitQuickTest(event) {
        event.preventDefault();
        setQuickTesting(true);
        setQuickTestStatus(null);
        try {
            const result = await smsService.quickTestSms(quickTestForm.phone, quickTestForm.message);
            setQuickTestStatus({
                ok: true,
                message: result.mocked
                    ? `Mock gateway accepted ${result.phone}. Real SMS pathano hoyni.`
                    : `SMS provider accepted ${result.phone}${result.providerMessageId ? ` (${result.providerMessageId})` : ''}.`,
                gatewayName: result.gateway?.name || 'Active gateway'
            });
            await load();
        } catch (error) {
            setQuickTestStatus({
                ok: false,
                message: error.message || 'Quick SMS test failed'
            });
        } finally {
            setQuickTesting(false);
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
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            onClick={processSmsQueue}
                            disabled={processingQueue}
                            className="inline-flex h-fit items-center justify-center gap-2 rounded-2xl bg-teal-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-teal-300 disabled:opacity-60"
                        >
                            {processingQueue ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Process queued SMS
                        </button>
                        <button
                            type="button"
                            onClick={load}
                            className="inline-flex h-fit items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/10 hover:bg-white/15"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>
                </div>
                <div className="grid border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total Wallet" value={stats.totalWallets || 0} />
                    <StatCard label="SMS Balance" value={stats.totalBalance || 0} />
                    <StatCard label="Pending Recharge" value={stats.pendingRecharge || 0} />
                    <StatCard label="Queued SMS" value={stats.queuedMessages || 0} />
                    <StatCard label="Revenue" value={money(stats.approvedRechargeRevenue || 0)} raw />
                    <StatCard label="Used SMS" value={stats.usedCredits || 0} />
                    <StatCard label="Sent SMS" value={stats.sentMessages || 0} />
                    <StatCard label="Delivered" value={stats.deliveredMessages || 0} />
                    <StatCard label="Retrying" value={stats.retryingMessages || 0} />
                    <StatCard label="Low Balance" value={stats.lowBalanceCount || 0} />
                    <StatCard label="Active Gateway" value={stats.activeGatewayCount || 0} />
                </div>
            </section>

            {processStatus && (
                <div className="rounded-[24px] border border-teal-100 bg-teal-50 px-5 py-4 text-sm font-black text-teal-900">
                    {processStatus}
                </div>
            )}

            <section className="grid gap-4 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[0.95fr_1.05fr] lg:p-6">
                <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">Quick SMS test</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">Active gateway diye instant test</h2>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
                        Demo ba launch-er age ek number-e test message pathiye provider/gateway health confirm korun.
                    </p>
                    <div className="mt-4 rounded-2xl bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected gateway</p>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-black text-slate-900">{activeGateway?.name || 'No active gateway'}</p>
                                <p className="text-xs font-bold text-slate-500">
                                    {activeGateway ? `${activeGateway.provider} | priority ${toBnDigits(activeGateway.priority || 100)}` : 'Gateway tab theke ekta gateway active korun.'}
                                </p>
                            </div>
                            <span className={`w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                                activeGateway ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                                {activeGateway ? (activeGateway.health_status || 'active') : 'missing'}
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={submitQuickTest} className="grid gap-3">
                    <Input
                        required
                        type="tel"
                        value={quickTestForm.phone}
                        onChange={(value) => setQuickTestForm((current) => ({ ...current, phone: value }))}
                        placeholder="01XXXXXXXXX"
                    />
                    <Textarea
                        value={quickTestForm.message}
                        onChange={(value) => setQuickTestForm((current) => ({ ...current, message: value.slice(0, 500) }))}
                        placeholder="Test message"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs font-bold text-slate-400">
                            {toBnDigits((quickTestForm.message || '').length)}/500 characters
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('gateway')}
                                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700"
                            >
                                Gateway
                            </button>
                            <button
                                disabled={quickTesting || !activeGateway}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {quickTesting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                Send test
                            </button>
                        </div>
                    </div>
                    {quickTestStatus && (
                        <p className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                            quickTestStatus.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                            {quickTestStatus.gatewayName ? `${quickTestStatus.gatewayName}: ` : ''}{quickTestStatus.message}
                        </p>
                    )}
                </form>
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
                                <button
                                    type="button"
                                    onClick={() => openWalletAdjustment(wallet)}
                                    className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700"
                                >
                                    Balance adjust করুন
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {activeTab === 'packages' && (
                <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
                    <div className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6">
                        <h2 className="mb-5 text-2xl font-black text-slate-900">SMS Packages</h2>
                        {packageStatus && <p className="mb-4 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{packageStatus}</p>}
                        <div className="grid gap-4">
                            {(overview?.packages || []).map((item) => (
                                <div key={item.id} className={`rounded-3xl border p-5 ${item.is_active ? 'border-slate-100 bg-slate-50' : 'border-slate-200 bg-slate-100 opacity-75'}`}>
                                    <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-black text-slate-900">{item.name}</p>
                                        <p className="text-sm font-bold text-slate-500">{toBnDigits(item.credits)} SMS · {item.description || 'No description'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-teal-700">{money(item.price)}</p>
                                        <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                            {item.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-3 gap-2">
                                        <button type="button" onClick={() => editPackage(item)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-600 hover:text-teal-700">
                                            <Pencil size={14} /> Edit
                                        </button>
                                        <button type="button" disabled={saving} onClick={() => togglePackage(item)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-600 disabled:opacity-50">
                                            {item.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button type="button" disabled={saving} onClick={() => deletePackage(item)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-rose-600 disabled:opacity-50">
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handlePackageSubmit} className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6">
                        <div className="mb-5 flex items-center gap-3">
                            <Plus className="text-teal-600" />
                            <h2 className="text-xl font-black text-slate-800">{editingPackageId ? 'Package সম্পাদনা' : 'নতুন Package'}</h2>
                        </div>
                        <div className="grid gap-3">
                            <Input required value={packageForm.name} onChange={(value) => setPackageForm({ ...packageForm, name: value })} placeholder="Package name" />
                            <Input required type="number" value={packageForm.credits} onChange={(value) => setPackageForm({ ...packageForm, credits: value })} placeholder="Credits" />
                            <Input required type="number" value={packageForm.price} onChange={(value) => setPackageForm({ ...packageForm, price: value })} placeholder="Price" />
                            <Input value={packageForm.description} onChange={(value) => setPackageForm({ ...packageForm, description: value })} placeholder="Short description" />
                            <div className="grid grid-cols-2 gap-3">
                                <Input type="number" value={packageForm.validityDays} onChange={(value) => setPackageForm({ ...packageForm, validityDays: value })} placeholder="Validity days" />
                                <Input type="number" value={packageForm.sortOrder} onChange={(value) => setPackageForm({ ...packageForm, sortOrder: value })} placeholder="Display order" />
                            </div>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                <input type="checkbox" checked={packageForm.isActive} onChange={(event) => setPackageForm({ ...packageForm, isActive: event.target.checked })} />
                                Package active
                            </label>
                            <div className="flex gap-2">
                                {editingPackageId && (
                                    <button type="button" onClick={resetPackageForm} className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-600">
                                        বাতিল
                                    </button>
                                )}
                                <button disabled={saving} className="flex-1 rounded-2xl bg-teal-600 px-4 py-3 font-black text-white disabled:opacity-50">
                                    {editingPackageId ? 'Update Package' : 'Package save করুন'}
                                </button>
                            </div>
                        </div>
                    </form>
                </section>
            )}

            {activeTab === 'messages' && (
                <section className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6">
                    <div className="mb-5 flex flex-col gap-3 rounded-3xl border border-teal-100 bg-teal-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-teal-700">Queue Worker</p>
                            <h2 className="mt-1 text-xl font-black text-slate-900">Queued SMS পাঠানোর পরীক্ষা</h2>
                            <p className="mt-1 text-sm font-bold text-slate-500">
                                Active gateway থাকলে queued SMS পাঠাবে। Mock gateway active করলে production SMS না পাঠিয়েও flow test করা যাবে।
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={processSmsQueue}
                            disabled={processingQueue}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-black text-white hover:bg-teal-700 disabled:opacity-60"
                        >
                            {processingQueue ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Process now
                        </button>
                        <button
                            type="button"
                            onClick={() => retryFailedMessages()}
                            disabled={processingQueue || Number(stats.failedMessages || 0) === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <RefreshCw size={16} />
                            Retry failed
                        </button>
                    </div>
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
                            <div key={item.id} className="grid gap-3 p-4 md:grid-cols-[150px_110px_1fr_90px_110px] md:items-center">
                                <Info label="Phone" value={item.recipient_phone} />
                                <Info label="Category" value={item.category} />
                                <p className="text-sm font-bold text-slate-600">{item.message}</p>
                                <Info label="Attempts" value={`${item.attempts || 0}/${item.max_attempts || 4}`} />
                                <div className="flex flex-col items-start gap-2">
                                    <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-600">{item.status}</span>
                                    {item.status === 'failed' && (
                                        <button
                                            type="button"
                                            onClick={() => retryFailedMessages([item.id])}
                                            className="text-xs font-black text-rose-600 hover:text-rose-800"
                                        >
                                            Retry
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {(overview?.deliveryAttempts || []).length > 0 && (
                        <div className="mt-6">
                            <h2 className="mb-4 text-xl font-black text-slate-900">Delivery attempt log</h2>
                            <div className="grid gap-3 lg:grid-cols-2">
                                {overview.deliveryAttempts.slice(0, 12).map((attempt) => (
                                    <div key={attempt.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-black text-slate-900">Attempt {toBnDigits(attempt.attempt_no)}</p>
                                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                                                attempt.status === 'sent'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : attempt.status === 'retry'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-rose-100 text-rose-700'
                                            }`}>
                                                {attempt.status}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs font-bold text-slate-500">
                                            {toBnDigits(attempt.duration_ms || 0)} ms
                                            {attempt.provider_http_status ? ` · HTTP ${attempt.provider_http_status}` : ''}
                                        </p>
                                        {attempt.error_message && <p className="mt-2 line-clamp-2 text-xs font-bold text-rose-600">{attempt.error_message}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {(overview?.deliveryWebhooks || []).length > 0 && (
                        <div className="mt-6">
                            <h2 className="mb-4 text-xl font-black text-slate-900">Provider webhook log</h2>
                            <div className="divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-100">
                                {overview.deliveryWebhooks.slice(0, 12).map((webhook) => (
                                    <div key={webhook.id} className="grid gap-3 p-4 md:grid-cols-[1fr_130px_110px] md:items-center">
                                        <div>
                                            <p className="text-sm font-black text-slate-900">{webhook.provider_message_id || 'Unknown provider message'}</p>
                                            <p className="mt-1 text-xs font-bold text-slate-500">{webhook.provider_status || 'No provider status'}</p>
                                            {webhook.error_message && <p className="mt-1 text-xs font-bold text-rose-600">{webhook.error_message}</p>}
                                        </div>
                                        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-600">
                                            {webhook.normalized_status || 'unknown'}
                                        </span>
                                        <span className={`w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                                            webhook.processed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {webhook.processed ? 'Processed' : 'Review'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="font-black text-slate-800">{gateway.name}</p>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => editGateway(gateway)} className="rounded-xl bg-white p-2 text-slate-500 transition hover:bg-teal-50 hover:text-teal-700" aria-label="Edit gateway">
                                                <Pencil size={15} />
                                            </button>
                                            <button type="button" disabled={saving} onClick={() => deleteGateway(gateway)} className="rounded-xl bg-white p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50" aria-label="Delete gateway">
                                                <Trash2 size={15} />
                                            </button>
                                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                                                gateway.health_status === 'healthy'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : gateway.health_status === 'down'
                                                        ? 'bg-rose-100 text-rose-700'
                                                        : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {gateway.health_status || 'unknown'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400">{gateway.provider} | {gateway.sender_id || 'sender নেই'}</p>
                                    <p className="mt-1 text-xs font-black text-teal-700">Priority {toBnDigits(gateway.priority || 100)}</p>
                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <MiniMetric label="Failures" value={gateway.consecutive_failures || 0} />
                                        <MiniMetric label="API key" value={gateway.has_api_key ? 'Configured' : 'Missing'} raw />
                                    </div>
                                    {gateway.last_error && <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-700">{gateway.last_error}</p>}
                                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery webhook</p>
                                        <code className="mt-1 block break-all text-xs font-bold text-slate-600">/api/sms/webhook/{gateway.id}</code>
                                    </div>
                                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Test gateway</p>
                                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                            <input
                                                type="tel"
                                                value={gatewayTestPhones[gateway.id] || ''}
                                                onChange={(event) => setGatewayTestPhones((current) => ({
                                                    ...current,
                                                    [gateway.id]: event.target.value
                                                }))}
                                                placeholder="01XXXXXXXXX"
                                                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 outline-none transition focus:border-teal-400"
                                            />
                                            <button
                                                type="button"
                                                disabled={testingGateway === gateway.id}
                                                onClick={() => testGateway(gateway.id)}
                                                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
                                            >
                                                {testingGateway === gateway.id ? 'Testing...' : 'Test SMS'}
                                            </button>
                                        </div>
                                        {gatewayTestResults[gateway.id] && (
                                            <p className={`mt-2 rounded-xl px-3 py-2 text-xs font-bold ${
                                                gatewayTestResults[gateway.id].ok
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-rose-50 text-rose-700'
                                            }`}>
                                                {gatewayTestResults[gateway.id].message}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        disabled={saving}
                                        onClick={() => toggleGateway(gateway.id, !gateway.is_active)}
                                        className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-black ${
                                            gateway.is_active ? 'bg-rose-100 text-rose-700' : 'bg-emerald-600 text-white'
                                        }`}
                                    >
                                        {gateway.is_active ? 'Deactivate' : 'Make active'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleGatewaySubmit} className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6">
                        <div className="mb-5 flex items-center gap-3">
                            <Plus className="text-teal-600" />
                            <h2 className="text-xl font-black text-slate-800">{editingGatewayId ? 'Gateway সম্পাদনা' : 'নতুন Gateway'}</h2>
                        </div>
                        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {Object.entries(gatewayPresets).map(([key, preset]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                        setEditingGatewayId('');
                                        setGatewayForm(preset);
                                    }}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                                >
                                    {key.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <div className="grid gap-3">
                            <Input required value={gatewayForm.name} onChange={(value) => setGatewayForm({ ...gatewayForm, name: value })} placeholder="Gateway name" />
                            <Input required value={gatewayForm.provider} onChange={(value) => setGatewayForm({ ...gatewayForm, provider: value })} placeholder="Provider" />
                            <Input value={gatewayForm.senderId} onChange={(value) => setGatewayForm({ ...gatewayForm, senderId: value })} placeholder="Sender ID" />
                            <Input value={gatewayForm.apiBaseUrl} onChange={(value) => setGatewayForm({ ...gatewayForm, apiBaseUrl: value })} placeholder="API base URL" />
                            <Input value={gatewayForm.apiKey} onChange={(value) => setGatewayForm({ ...gatewayForm, apiKey: value })} placeholder="API key" />
                            {editingGatewayId && <p className="-mt-1 text-xs font-bold text-slate-400">API key পরিবর্তন না করলে field খালি রাখুন।</p>}
                            <Input type="number" value={gatewayForm.timeoutMs} onChange={(value) => setGatewayForm({ ...gatewayForm, timeoutMs: value })} placeholder="Timeout (ms)" />
                            <Input type="number" value={gatewayForm.priority} onChange={(value) => setGatewayForm({ ...gatewayForm, priority: value })} placeholder="Priority (1 runs first)" />
                            <Textarea
                                value={gatewayForm.configText}
                                onChange={(value) => setGatewayForm({ ...gatewayForm, configText: value })}
                                placeholder="Gateway config JSON"
                            />
                            <p className="rounded-2xl bg-slate-50 p-3 text-xs font-bold leading-relaxed text-slate-500">
                                Config JSON diye provider payload map korun. payload_mode: json, form, query. recipient_key, message_key, sender_key provider onujayi din.
                            </p>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                <input type="checkbox" checked={gatewayForm.isActive} onChange={(event) => setGatewayForm({ ...gatewayForm, isActive: event.target.checked })} />
                                Active gateway
                            </label>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                <input type="checkbox" checked={gatewayForm.webhookEnabled} onChange={(event) => setGatewayForm({ ...gatewayForm, webhookEnabled: event.target.checked })} />
                                Delivery webhook enabled
                            </label>
                            <div className="flex gap-2">
                                {editingGatewayId && (
                                    <button type="button" onClick={resetGatewayForm} className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-600">
                                        বাতিল
                                    </button>
                                )}
                                <button disabled={saving} className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 font-black text-white disabled:opacity-50">
                                    {editingGatewayId ? 'Update Gateway' : 'Gateway save করুন'}
                                </button>
                            </div>
                        </div>
                    </form>
                </section>
            )}

            {adjustmentWallet && (
                <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5">
                    <form onSubmit={submitWalletAdjustment} className="max-h-[92vh] w-full overflow-y-auto rounded-t-[30px] bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-[30px] sm:p-7">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-600">Wallet adjustment</p>
                                <h2 className="mt-2 text-2xl font-black text-slate-900">
                                    {adjustmentWallet.owner_name || adjustmentWallet.owner?.name_bn || adjustmentWallet.owner?.name || adjustmentWallet.owner_id}
                                </h2>
                                <p className="mt-1 text-sm font-bold text-slate-500">
                                    বর্তমান balance: {toBnDigits(adjustmentWallet.balance || 0)} SMS
                                </p>
                            </div>
                            <button type="button" onClick={() => setAdjustmentWallet(null)} className="rounded-2xl bg-slate-100 p-3 text-slate-500" aria-label="Close">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="mt-6 grid grid-cols-3 gap-2">
                            {[50, 100, 500].map((credits) => (
                                <button
                                    key={credits}
                                    type="button"
                                    onClick={() => setAdjustmentForm((current) => ({ ...current, credits: String(credits) }))}
                                    className="rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-700"
                                >
                                    +{toBnDigits(credits)}
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 grid gap-3">
                            <Input
                                required
                                type="number"
                                value={adjustmentForm.credits}
                                onChange={(value) => setAdjustmentForm({ ...adjustmentForm, credits: value })}
                                placeholder="SMS credit: যোগ করতে positive, কাটতে negative"
                            />
                            <Textarea
                                value={adjustmentForm.note}
                                onChange={(value) => setAdjustmentForm({ ...adjustmentForm, note: value })}
                                placeholder="কারণ লিখুন: bonus, refund, correction..."
                            />
                        </div>

                        {adjustmentStatus && (
                            <p className={`mt-4 rounded-2xl p-3 text-sm font-bold ${adjustmentStatus.includes('হয়েছে') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                {adjustmentStatus}
                            </p>
                        )}

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => setAdjustmentWallet(null)} className="rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-600">
                                বাতিল
                            </button>
                            <button disabled={saving} className="rounded-2xl bg-teal-600 px-4 py-3 font-black text-white disabled:opacity-50">
                                {saving ? 'Saving...' : 'Balance update'}
                            </button>
                        </div>

                        <div className="mt-6 border-t border-slate-100 pt-5">
                            <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Recent adjustments</p>
                            {(overview?.transactions || [])
                                .filter((item) => item.wallet_id === adjustmentWallet.id && item.transaction_type === 'adjustment')
                                .slice(0, 5)
                                .map((item) => (
                                    <div key={item.id} className="flex items-start justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{item.note || 'Manual adjustment'}</p>
                                            <p className="text-xs font-bold text-slate-400">{new Date(item.created_at).toLocaleString('bn-BD')}</p>
                                        </div>
                                        <span className={`text-sm font-black ${Number(item.credits) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            {Number(item.credits) >= 0 ? '+' : ''}{toBnDigits(item.credits)}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </form>
                </div>
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

function Textarea({ value, onChange, placeholder }) {
    return (
        <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            rows={8}
            className="rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm font-bold outline-none focus:border-teal-400"
        />
    );
}

function EmptyState({ text }) {
    return (
        <p className="rounded-3xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">{text}</p>
    );
}

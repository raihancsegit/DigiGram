'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    CheckCircle2,
    Clock3,
    Loader2,
    Megaphone,
    MessageSquareText,
    PackagePlus,
    RefreshCw,
    Send,
    Sparkles,
    WalletCards
} from 'lucide-react';
import { householdService } from '@/lib/services/householdService';
import { smsService } from '@/lib/services/smsService';
import { toBnDigits } from '@/lib/utils/format';

function money(value) {
    return `৳ ${toBnDigits(Number(value || 0).toLocaleString('bn-BD'))}`;
}

const TARGETS = [
    { value: 'all_households', label: 'সব household phone' },
    { value: 'service_applicants', label: 'সেবা আবেদনকারীরা' }
];

const SMART_TARGETS = [
    { value: 'emergency_broadcast', label: 'জরুরি Broadcast', title: 'Emergency broadcast', message: 'DigiGram জরুরি বার্তা: {name}, আপনার এলাকায় গুরুত্বপূর্ণ ঘোষণা আছে। নিরাপদ থাকুন এবং চেয়ারম্যান/ওয়ার্ড মেম্বারের নির্দেশনা অনুসরণ করুন।' },
    { value: 'women_support', label: 'Women Support Desk', title: 'Women Support Desk follow-up', message: 'DigiGram: {name}, নারী সহায়তা, স্বাস্থ্য checkup, বিধবা/মাতৃত্বকালীন ভাতা বা training support যাচাইয়ের জন্য ইউনিয়ন/ওয়ার্ড অফিসে যোগাযোগ করুন।' },
    { value: 'widow_support', label: 'বিধবা ভাতা যাচাই', title: 'Widow allowance support', message: 'DigiGram: {name}, বিধবা ভাতা যাচাই ও প্রয়োজনীয় তথ্য update করার জন্য ওয়ার্ড মেম্বার/ইউনিয়ন অফিসে যোগাযোগ করুন।' },
    { value: 'maternity_support', label: 'মাতৃত্বকালীন support', title: 'Maternity support follow-up', message: 'DigiGram: {name}, মাতৃত্বকালীন স্বাস্থ্য ও সহায়তা সংক্রান্ত তথ্য যাচাইয়ের জন্য নিকটস্থ কমিউনিটি ক্লিনিক/ইউনিয়ন অফিসে যোগাযোগ করুন।' },
    { value: 'health_checkup', label: 'Health checkup', title: 'Health checkup reminder', message: 'DigiGram: {name}, স্বাস্থ্য checkup, টিকা, blood group বা বিশেষ সহায়তা update করার জন্য নির্ধারিত ক্যাম্পে/ওয়ার্ড অফিসে যোগাযোগ করুন।' },
    { value: 'low_completeness', label: 'Low Citizen Score', title: 'Household data update', message: 'DigiGram: {name}, আপনার household তথ্য অসম্পূর্ণ আছে। NID, জন্ম নিবন্ধন, blood group ও প্রয়োজনীয় তথ্য update করতে ওয়ার্ড মেম্বারের সাথে যোগাযোগ করুন।' },
    { value: 'all_households', label: 'সব household phone', title: 'Union notice', message: 'DigiGram: {name}, ইউনিয়নের গুরুত্বপূর্ণ নোটিশ ও সেবা আপডেট পেতে আপনার household তথ্য হালনাগাদ রাখুন।' },
    { value: 'missing_nid', label: 'NID নেই', title: 'NID follow-up', message: 'DigiGram: {name}, আপনার পরিবারের ১৮+ সদস্যের NID তথ্য হালনাগাদ দরকার। ওয়ার্ড মেম্বার/ইউনিয়ন অফিসে যোগাযোগ করুন।' },
    { value: 'missing_birth', label: 'জন্ম নিবন্ধন নেই', title: 'Birth registration follow-up', message: 'DigiGram: {name}, জন্ম নিবন্ধন তথ্য অসম্পূর্ণ আছে। দ্রুত ওয়ার্ড মেম্বার/ইউনিয়ন অফিসে যোগাযোগ করুন।' },
    { value: 'benefit_candidates', label: 'ভাতা/সহায়তা candidate', title: 'Allowance support follow-up', message: 'DigiGram: {name}, সম্ভাব্য ভাতা/সহায়তা যাচাইয়ের জন্য প্রয়োজনীয় তথ্য নিয়ে ওয়ার্ড মেম্বারের সাথে যোগাযোগ করুন।' },
    { value: 'tax_due', label: 'Tax due', title: 'Tax due reminder', message: 'DigiGram: {name}, আপনার household tax বকেয়া/partial আছে। রসিদসহ ইউনিয়ন পরিষদে যোগাযোগ করুন।' },
    { value: 'service_ready', label: 'Application ready', title: 'Certificate collection reminder', message: 'DigiGram: {name}, আপনার আবেদন প্রস্তুত হয়েছে। নির্ধারিত দিনে ইউনিয়ন পরিষদ থেকে সংগ্রহ করুন।' },
    { value: 'service_processing', label: 'Application processing', title: 'Application processing update', message: 'DigiGram: {name}, আপনার আবেদন প্রক্রিয়াধীন আছে। কাজ সম্পন্ন হলে SMS দেওয়া হবে।' },
    { value: 'service_applicants', label: 'সব আবেদনকারী', title: 'Service applicant update', message: 'DigiGram: {name}, আপনার সেবা আবেদনের সর্বশেষ আপডেটের জন্য ইউনিয়ন পরিষদের সাথে যোগাযোগ রাখুন।' }
];

export default function UnionSmsOutbox({ unionId }) {
    const [items, setItems] = useState([]);
    const [walletData, setWalletData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [campaignSending, setCampaignSending] = useState(false);
    const [campaignPreview, setCampaignPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [form, setForm] = useState({ packageId: '', transactionId: '', payerPhone: '', paymentMethod: 'bkash' });
    const [campaignForm, setCampaignForm] = useState({
        title: '',
        targetType: 'all_households',
        templateId: '',
        message: ''
    });

    const selectedPackage = useMemo(() => {
        return (walletData?.packages || []).find((item) => item.id === form.packageId) || null;
    }, [walletData, form.packageId]);

    const selectedTemplate = useMemo(() => {
        return (walletData?.templates || []).find((item) => item.id === campaignForm.templateId) || null;
    }, [walletData, campaignForm.templateId]);

    async function load() {
        setLoading(true);
        try {
            const [outbox, wallet] = await Promise.all([
                householdService.getServiceRequestSmsByUnion(unionId),
                smsService.getWallet('location', unionId)
            ]);
            setItems(outbox || []);
            setWalletData(wallet);
            setForm((current) => ({
                ...current,
                packageId: current.packageId || wallet?.packages?.[0]?.id || ''
            }));
            setCampaignForm((current) => ({
                ...current,
                templateId: current.templateId || wallet?.templates?.[0]?.id || '',
                message: current.message || wallet?.templates?.[0]?.body || ''
            }));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [unionId]);

    function handleTemplateChange(templateId) {
        const template = (walletData?.templates || []).find((item) => item.id === templateId);
        setCampaignForm((current) => ({
            ...current,
            templateId,
            title: current.title || template?.title || '',
            message: template?.body || current.message
        }));
    }

    function handleTargetChange(targetType) {
        const target = SMART_TARGETS.find((item) => item.value === targetType);
        setCampaignForm((current) => ({
            ...current,
            targetType,
            title: target?.title || current.title,
            message: target?.message || current.message
        }));
    }

    async function loadCampaignPreview(targetType = campaignForm.targetType) {
        setPreviewLoading(true);
        try {
            const preview = await smsService.previewCampaign('location', unionId, targetType);
            setCampaignPreview(preview);
        } catch (error) {
            setCampaignPreview({ recipientCount: 0, estimatedCredits: 0, error: error.message });
        } finally {
            setPreviewLoading(false);
        }
    }

    useEffect(() => {
        if (!unionId) return;
        loadCampaignPreview(campaignForm.targetType);
    }, [unionId, campaignForm.targetType]);

    async function handleRecharge(event) {
        event.preventDefault();
        if (!form.packageId) return;
        setSaving(true);
        try {
            await smsService.requestRecharge({
                ownerType: 'location',
                ownerId: unionId,
                packageId: form.packageId,
                transactionId: form.transactionId,
                payerPhone: form.payerPhone,
                paymentMethod: form.paymentMethod
            });
            setForm((current) => ({ ...current, transactionId: '', payerPhone: '' }));
            await load();
            alert('Recharge request জমা হয়েছে। Super admin approve করলে balance যোগ হবে।');
        } finally {
            setSaving(false);
        }
    }

    async function handleCampaign(event) {
        event.preventDefault();
        if (!campaignForm.message.trim()) return;
        setCampaignSending(true);
        try {
            const result = await smsService.sendCampaign({
                ownerType: 'location',
                ownerId: unionId,
                targetType: campaignForm.targetType,
                templateId: campaignForm.templateId || null,
                title: campaignForm.title || selectedTemplate?.title || 'Union SMS Campaign',
                message: campaignForm.message,
                category: selectedTemplate?.category || 'campaign'
            });
            await load();
            await loadCampaignPreview(campaignForm.targetType);
            alert(`${toBnDigits(result.recipientCount || 0)} টি SMS queue হয়েছে। Balance: ${toBnDigits(result.remainingBalance || 0)}`);
        } catch (error) {
            alert(error.message || 'SMS campaign পাঠাতে সমস্যা হয়েছে।');
        } finally {
            setCampaignSending(false);
        }
    }

    if (loading) {
        return <div className="py-16 text-center"><Loader2 className="mx-auto animate-spin text-teal-600" /></div>;
    }

    const wallet = walletData?.wallet || {};
    const pendingRecharge = (walletData?.rechargeRequests || []).filter((item) => item.status === 'pending');
    const balance = Number(wallet.balance || 0);
    const lowThreshold = Number(wallet.low_balance_threshold || 50);
    const isLowBalance = balance <= lowThreshold;
    const recommendedPackage = [...(walletData?.packages || [])]
        .filter((item) => Number(item.credits || 0) >= Math.max(lowThreshold * 4, 100))
        .sort((a, b) => Number(a.price || 0) - Number(b.price || 0))[0] || walletData?.packages?.[0] || null;
    const campaignCount = Number(campaignPreview?.recipientCount || 0);
    const campaignCredits = Number(campaignPreview?.estimatedCredits || campaignCount);
    const canAffordCampaign = balance >= campaignCredits;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                        <MessageSquareText size={22} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800">SMS Wallet, Campaign & Outbox</h3>
                        <p className="text-sm font-bold text-slate-400">Recharge, bulk campaign, service SMS এবং balance এক জায়গায়।</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={load}
                    className="flex w-fit items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-200"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {isLowBalance && (
                <div className="overflow-hidden rounded-[30px] border border-amber-200 bg-amber-50 shadow-sm">
                    <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div className="flex items-start gap-3">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                                <Clock3 size={22} />
                            </span>
                            <div>
                                <p className="text-xl font-black text-slate-900">
                                    SMS balance কম: {toBnDigits(balance)} credit
                                </p>
                                <p className="mt-1 text-sm font-bold text-amber-800">
                                    Complaint, service ready, tax due, school absent SMS পাঠাতে balance দরকার। এখন recharge request দিলে super admin approve করবে।
                                </p>
                            </div>
                        </div>
                        {recommendedPackage && (
                            <button
                                type="button"
                                onClick={() => setForm((current) => ({ ...current, packageId: recommendedPackage.id }))}
                                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-amber-700"
                            >
                                Recommended: {toBnDigits(recommendedPackage.credits)} SMS / {money(recommendedPackage.price)}
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[28px] bg-slate-950 p-6 text-white md:col-span-1">
                    <WalletCards className="text-teal-300" size={28} />
                    <p className="mt-5 text-xs font-black uppercase tracking-widest text-slate-400">Available SMS</p>
                    <p className="mt-2 text-4xl font-black">{toBnDigits(balance)}</p>
                    <p className="mt-2 text-sm font-bold text-slate-300">Low balance alert: {toBnDigits(lowThreshold)} SMS</p>
                    <div className="mt-5 grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-2xl bg-white/10 p-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pending</p>
                            <p className="mt-1 text-xl font-black">{toBnDigits(pendingRecharge.length)}</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Packages</p>
                            <p className="mt-1 text-xl font-black">{toBnDigits(walletData?.packages?.length || 0)}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleRecharge} className="rounded-[28px] border border-slate-200 bg-white p-5 md:col-span-2">
                    <div className="mb-4 flex items-center gap-3">
                        <PackagePlus className="text-teal-600" />
                        <div>
                            <h4 className="text-xl font-black text-slate-900">SMS কিনুন / Recharge Request</h4>
                            <p className="text-xs font-bold text-slate-400">bKash/Nagad payment করে TRX ID দিলে super admin approve করবে।</p>
                        </div>
                    </div>
                    <div className="mb-4 grid gap-3 sm:grid-cols-3">
                        {(walletData?.packages || []).slice(0, 3).map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setForm({ ...form, packageId: item.id })}
                                className={`rounded-2xl border p-4 text-left transition ${
                                    form.packageId === item.id
                                        ? 'border-teal-400 bg-teal-50 text-teal-900'
                                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-teal-200'
                                }`}
                            >
                                <p className="text-lg font-black">{toBnDigits(item.credits)} SMS</p>
                                <p className="mt-1 text-xs font-bold">{item.name}</p>
                                <p className="mt-2 text-sm font-black text-teal-700">{money(item.price)}</p>
                            </button>
                        ))}
                    </div>
                    <div className="grid gap-3 md:grid-cols-4">
                        <select
                            value={form.packageId}
                            onChange={(event) => setForm({ ...form, packageId: event.target.value })}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none focus:border-teal-400 md:col-span-2"
                        >
                            {(walletData?.packages || []).map((item) => (
                                <option key={item.id} value={item.id}>{item.name} - {toBnDigits(item.credits)} SMS / {money(item.price)}</option>
                            ))}
                        </select>
                        <input
                            value={form.payerPhone}
                            onChange={(event) => setForm({ ...form, payerPhone: event.target.value })}
                            placeholder="Payment phone"
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-teal-400"
                        />
                        <input
                            value={form.transactionId}
                            onChange={(event) => setForm({ ...form, transactionId: event.target.value })}
                            placeholder="TRX ID"
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-teal-400"
                        />
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-bold text-slate-500">
                            Selected: {selectedPackage ? `${toBnDigits(selectedPackage.credits)} SMS · ${money(selectedPackage.price)}` : 'Package নেই'}
                        </p>
                        <button disabled={saving || !form.packageId} className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-black text-white hover:bg-teal-700 disabled:opacity-50">
                            {saving ? 'জমা হচ্ছে...' : 'Recharge request দিন'}
                        </button>
                    </div>
                </form>
            </div>

            {pendingRecharge.length > 0 && (
                <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-black text-amber-800">
                        <Clock3 size={18} />
                        {toBnDigits(pendingRecharge.length)} টি recharge approval অপেক্ষায় আছে।
                    </div>
                </div>
            )}

            <form onSubmit={handleCampaign} className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Megaphone className="text-teal-600" />
                        <div>
                            <h4 className="text-xl font-black text-slate-900">Bulk SMS Campaign</h4>
                            <p className="text-xs font-bold text-slate-400">Template select করে নাগরিকদের SMS পাঠান। প্রতিটি recipient = ১ credit।</p>
                        </div>
                    </div>
                    <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-500">
                        {'{name}'} variable support
                    </span>
                </div>

                <div className="mb-5 grid gap-3 md:grid-cols-4">
                    {SMART_TARGETS.slice(0, 8).map((target) => (
                        <button
                            key={target.value}
                            type="button"
                            onClick={() => handleTargetChange(target.value)}
                            className={`rounded-2xl border p-3 text-left transition ${
                                campaignForm.targetType === target.value
                                    ? 'border-teal-400 bg-teal-50 text-teal-900'
                                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-200 hover:bg-white'
                            }`}
                        >
                            <Sparkles size={15} className="mb-2" />
                            <p className="text-xs font-black">{target.label}</p>
                        </button>
                    ))}
                </div>

                <div className="grid gap-3 lg:grid-cols-4">
                    <input
                        value={campaignForm.title}
                        onChange={(event) => setCampaignForm({ ...campaignForm, title: event.target.value })}
                        placeholder="Campaign title"
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-teal-400"
                    />
                    <select
                        value={campaignForm.targetType}
                        onChange={(event) => handleTargetChange(event.target.value)}
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none focus:border-teal-400"
                    >
                        {SMART_TARGETS.map((target) => <option key={target.value} value={target.value}>{target.label}</option>)}
                    </select>
                    <select
                        value={campaignForm.templateId}
                        onChange={(event) => handleTemplateChange(event.target.value)}
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none focus:border-teal-400 lg:col-span-2"
                    >
                        {(walletData?.templates || []).map((template) => (
                            <option key={template.id} value={template.id}>{template.title}</option>
                        ))}
                    </select>
                </div>

                <textarea
                    value={campaignForm.message}
                    onChange={(event) => setCampaignForm({ ...campaignForm, message: event.target.value })}
                    className="mt-3 min-h-[120px] w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm font-bold outline-none focus:border-teal-400"
                    placeholder="SMS message লিখুন..."
                />

                <div className="mt-4 grid gap-3 rounded-3xl bg-slate-50 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Preview</p>
                        <p className="mt-1 text-sm font-bold text-slate-700">
                            {campaignForm.message.replaceAll('{name}', 'রহিম উদ্দিন') || 'Message preview এখানে দেখাবে'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">
                                Recipients: {previewLoading ? '...' : toBnDigits(campaignCount)}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-[11px] font-black ${canAffordCampaign ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                Cost: {toBnDigits(campaignCredits)} credit
                            </span>
                            {campaignPreview?.error && (
                                <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-black text-rose-700">{campaignPreview.error}</span>
                            )}
                        </div>
                    </div>
                    <button
                        disabled={campaignSending || previewLoading || !campaignForm.message.trim() || campaignCount === 0 || !canAffordCampaign}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-teal-700 disabled:opacity-50"
                    >
                        {campaignSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                        SMS Campaign পাঠান
                    </button>
                </div>
            </form>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white">
                    <div className="flex items-center gap-3 border-b border-slate-100 p-5">
                        <Megaphone className="text-teal-600" size={20} />
                        <h4 className="text-lg font-black text-slate-900">Recent Campaigns</h4>
                    </div>
                    {(walletData?.campaigns || []).length === 0 ? (
                        <p className="p-8 text-sm font-bold text-slate-400">এখনও campaign পাঠানো হয়নি।</p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {walletData.campaigns.map((campaign) => (
                                <div key={campaign.id} className="p-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-black text-slate-900">{campaign.title}</p>
                                        <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-black text-teal-700">
                                            {toBnDigits(campaign.recipient_count)} SMS
                                        </span>
                                    </div>
                                    <p className="mt-2 line-clamp-2 text-sm font-bold text-slate-500">{campaign.message}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white">
                    <div className="flex items-center gap-3 border-b border-slate-100 p-5">
                        <Send className="text-teal-600" size={20} />
                        <h4 className="text-lg font-black text-slate-900">Service SMS Outbox</h4>
                    </div>
                    {items.length === 0 ? (
                        <p className="p-8 text-sm font-bold text-slate-400">এখনও কোনো SMS queue হয়নি।</p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {items.map((item) => (
                                <div key={item.id} className="grid gap-3 p-5 md:grid-cols-[130px_90px_1fr_90px] md:items-center">
                                    <div>
                                        <p className="text-sm font-black text-slate-800">{item.phone}</p>
                                        <p className="text-xs font-bold text-slate-400">{item.request?.applicant_name}</p>
                                    </div>
                                    <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-600">
                                        {item.event_key}
                                    </span>
                                    <p className="text-sm font-bold text-slate-600">{item.message}</p>
                                    <span className={`flex w-fit items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                                        item.status === 'sent'
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : item.status === 'failed'
                                                ? 'bg-rose-50 text-rose-600'
                                                : 'bg-amber-50 text-amber-600'
                                    }`}>
                                        {item.status === 'sent' && <CheckCircle2 size={12} />}
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

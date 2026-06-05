'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    AlertCircle,
    Baby,
    Bot,
    CheckCircle2,
    ExternalLink,
    Fingerprint,
    HeartPulse,
    Loader2,
    MessageSquareText,
    Send,
    ShieldCheck,
    UserRoundCheck,
    Users,
    Venus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { householdService } from '@/lib/services/householdService';
import { smsService } from '@/lib/services/smsService';
import { toBnDigits } from '@/lib/utils/format';

const WOMEN_SUPPORT_SMS = 'DigiGram: {name}, নারী সহায়তা, স্বাস্থ্য checkup, বিধবা/মাতৃত্বকালীন ভাতা বা training support যাচাইয়ের জন্য ইউনিয়ন/ওয়ার্ড অফিসে যোগাযোগ করুন।';
const LOW_SCORE_SMS = 'DigiGram: {name}, আপনার household তথ্য অসম্পূর্ণ আছে। NID, জন্ম নিবন্ধন, blood group ও প্রয়োজনীয় তথ্য update করতে ওয়ার্ড মেম্বারের সাথে যোগাযোগ করুন।';

export default function UnionCitizenQualityDashboard({ unionId }) {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creatingKey, setCreatingKey] = useState(null);
    const [smsKey, setSmsKey] = useState(null);

    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            try {
                setLoading(true);
                const data = await householdService.getCitizenQualityDashboardByUnion(unionId);
                if (active) setDashboard(data);
            } catch (err) {
                console.error('Failed to load citizen quality dashboard:', err);
            } finally {
                if (active) setLoading(false);
            }
        }

        loadDashboard();
        return () => {
            active = false;
        };
    }, [unionId]);

    async function handleCreateRequest(item) {
        const key = `${item.id}-${item.type}`;
        try {
            setCreatingKey(key);
            const result = await householdService.createSuggestedServiceRequestForResident(item.id, item.type, unionId);
            setDashboard((current) => ({
                ...current,
                candidates: (current?.candidates || []).map((candidate) => (
                    candidate.id === item.id && candidate.type === item.type
                        ? { ...candidate, activeRequest: result.request }
                        : candidate
                )),
                womenSupport: (current?.womenSupport || []).map((candidate) => (
                    candidate.id === item.id && candidate.type === item.type
                        ? { ...candidate, activeRequest: result.request }
                        : candidate
                ))
            }));
            toast.success(result.alreadyExists ? 'এই case আগে থেকেই চলছে।' : 'নতুন case তৈরি হয়েছে।');
        } catch (err) {
            console.error('Failed to create suggested request:', err);
            toast.error('case তৈরি করা যায়নি।');
        } finally {
            setCreatingKey(null);
        }
    }

    async function handleSendTargetSms(targetType, title, message) {
        try {
            setSmsKey(targetType);
            const result = await smsService.sendCampaign({
                ownerType: 'location',
                ownerId: unionId,
                targetType,
                title,
                message,
                category: 'citizen_quality'
            });
            toast.success(`${toBnDigits(result.recipientCount || 0)}টি SMS queue হয়েছে।`);
        } catch (err) {
            console.error('Failed to send quality SMS:', err);
            toast.error(err.message || 'SMS পাঠানো যায়নি।');
        } finally {
            setSmsKey(null);
        }
    }

    if (loading) {
        return <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-indigo-600" /></div>;
    }

    const summary = dashboard?.summary || {};

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-2xl font-black text-slate-800">নাগরিক তথ্য মান ও Citizen Score</h3>
                <p className="mt-1 text-sm font-bold text-slate-400">NID, জন্ম নিবন্ধন, blood group, নারী সহায়তা এবং household completeness এক জায়গায় দেখুন।</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
                <Stat icon={Users} label="মোট নাগরিক" value={summary.totalResidents} />
                <Stat icon={Fingerprint} label="NID নেই" value={summary.missingNid} />
                <Stat icon={Baby} label="জন্ম সনদ নেই" value={summary.missingBirthReg} />
                <Stat icon={HeartPulse} label="রক্তের গ্রুপ নেই" value={summary.missingBloodGroup} />
                <Stat icon={AlertCircle} label="১৮+ কিন্তু NID নেই" value={summary.voterEligibleWithoutNid} />
                <Stat icon={ShieldCheck} label="Completeness" value={`${toBnDigits(summary.citizenCompleteness || 0)}%`} raw />
            </div>

            <UnionDecisionRoom
                summary={summary}
                wards={dashboard?.wardSummaries || []}
                candidates={dashboard?.candidates || []}
                womenSupport={dashboard?.womenSupport || []}
                lowCompleteness={dashboard?.lowCompleteness || []}
                duplicateGroups={dashboard?.duplicateGroups || []}
            />

            <OfficerDataAssistant dashboard={dashboard} />

            <DuplicateCitizenPanel groups={dashboard?.duplicateGroups || []} />

            <WomenSupportDesk
                summary={summary}
                items={dashboard?.womenSupport || []}
                creatingKey={creatingKey}
                smsKey={smsKey}
                onCreateCase={handleCreateRequest}
                onSendSms={() => handleSendTargetSms('women_support', 'Women Support Desk follow-up', WOMEN_SUPPORT_SMS)}
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
                <WardScoreList wards={dashboard?.wardSummaries || []} />
                <PriorityRequestList
                    items={dashboard?.candidates || []}
                    creatingKey={creatingKey}
                    onCreateCase={handleCreateRequest}
                />
            </div>

            <LowCompletenessHouseholds
                items={dashboard?.lowCompleteness || []}
                smsKey={smsKey}
                onSendSms={() => handleSendTargetSms('low_completeness', 'Household data update', LOW_SCORE_SMS)}
            />
        </div>
    );
}

function OfficerDataAssistant({ dashboard }) {
    const [query, setQuery] = useState('');
    const [answer, setAnswer] = useState('প্রশ্ন করুন অথবা নিচের quick question থেকে একটি বেছে নিন।');
    const summary = dashboard?.summary || {};
    const wards = dashboard?.wardSummaries || [];
    const candidates = dashboard?.candidates || [];
    const womenSupport = dashboard?.womenSupport || [];
    const duplicates = dashboard?.duplicateGroups || [];
    const lowCompleteness = dashboard?.lowCompleteness || [];

    function answerQuery(rawQuery) {
        const text = String(rawQuery || query).trim();
        if (!text) return;
        const normalized = text.toLowerCase();
        const weakestWard = [...wards].sort((a, b) => {
            const aMissing = (a.missingNid || 0) + (a.missingBirthReg || 0) + (a.missingBloodGroup || 0);
            const bMissing = (b.missingNid || 0) + (b.missingBirthReg || 0) + (b.missingBloodGroup || 0);
            return bMissing - aMissing;
        })[0];

        let response;
        if (normalized.includes('nid') || normalized.includes('এনআইডি')) {
            const ward = [...wards].sort((a, b) => (b.missingNid || 0) - (a.missingNid || 0))[0];
            response = ward
                ? `${ward.wardName}-এ NID missing সবচেয়ে বেশি: ${toBnDigits(ward.missingNid || 0)} জন। ইউনিয়ন মোট ${toBnDigits(summary.missingNid || 0)} জন।`
                : 'NID missing data এখনো পাওয়া যায়নি।';
        } else if (normalized.includes('sms') || normalized.includes('ফলো') || normalized.includes('follow')) {
            const urgent = candidates.filter((item) => item.type !== 'blood_group_update' && !item.activeRequest).length;
            response = `আজ প্রথমে ${toBnDigits(urgent)}টি document follow-up, ${toBnDigits(womenSupport.length)}টি women-support case এবং ${toBnDigits(lowCompleteness.length)}টি low-score household-এ SMS দিন।`;
        } else if (normalized.includes('duplicate') || normalized.includes('ডুপ্লিকেট')) {
            response = duplicates.length
                ? `${toBnDigits(duplicates.length)}টি duplicate group review দরকার। NID/birth/phone match দিয়ে শুরু করুন।`
                : 'বর্তমানে duplicate signal পাওয়া যায়নি।';
        } else if (normalized.includes('নারী') || normalized.includes('মহিলা') || normalized.includes('women')) {
            response = `${toBnDigits(womenSupport.length)}টি women-support follow-up আছে; এর মধ্যে ${toBnDigits(summary.widowCandidates || 0)} জন বিধবা ভাতা যাচাই candidate।`;
        } else if (normalized.includes('দুর্বল') || normalized.includes('weak') || normalized.includes('কমপ্লিট')) {
            response = weakestWard
                ? `${weakestWard.wardName} এখন সবচেয়ে বেশি attention চায়। Missing NID, birth certificate ও blood group মিলিয়ে ${toBnDigits((weakestWard.missingNid || 0) + (weakestWard.missingBirthReg || 0) + (weakestWard.missingBloodGroup || 0))} gap আছে।`
                : 'Ward score তৈরি করার মতো data এখনো নেই।';
        } else {
            response = `আজকের brief: ${toBnDigits(candidates.length + womenSupport.length)} priority follow-up, ${toBnDigits(duplicates.length)} duplicate group এবং ${toBnDigits(lowCompleteness.length)} low-score household আছে।`;
        }

        setQuery(text);
        setAnswer(response);
    }

    const quickQuestions = [
        'কোন ওয়ার্ডে NID missing বেশি?',
        'আজ কাকে SMS follow-up দেব?',
        'Duplicate কতটি?',
        'Women support priority কী?'
    ];

    return (
        <section className="overflow-hidden rounded-[34px] bg-slate-950 text-white shadow-xl">
            <div className="grid gap-0 lg:grid-cols-[0.75fr_1.25fr]">
                <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-white">
                            <Bot size={23} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-300">AI Officer Assistant</p>
                            <h4 className="text-xl font-black">Union data-কে প্রশ্ন করুন</h4>
                        </div>
                    </div>
                    <p className="mt-4 text-xs font-bold leading-5 text-slate-400">
                        Live dashboard summary থেকে NID gap, risky ward, duplicate এবং SMS priority-এর উত্তর দেয়।
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {quickQuestions.map((question) => (
                            <button
                                key={question}
                                type="button"
                                onClick={() => answerQuery(question)}
                                className="rounded-full bg-white/5 px-3 py-2 text-[11px] font-black text-slate-300 ring-1 ring-white/10 transition hover:bg-teal-500 hover:text-white"
                            >
                                {question}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-6">
                    <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
                        <div className="flex items-start gap-3">
                            <MessageSquareText className="mt-0.5 shrink-0 text-teal-300" size={20} />
                            <p className="text-sm font-bold leading-6 text-slate-200">{answer}</p>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={(event) => event.key === 'Enter' && answerQuery()}
                            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-teal-400"
                            placeholder="যেমন: কোন ওয়ার্ডে NID missing বেশি?"
                        />
                        <button
                            type="button"
                            onClick={() => answerQuery()}
                            className="rounded-2xl bg-teal-500 px-5 py-3 text-xs font-black text-white transition hover:bg-teal-400"
                        >
                            উত্তর দেখুন
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

function UnionDecisionRoom({ summary, wards, candidates, womenSupport, lowCompleteness, duplicateGroups }) {
    const riskiestWard = [...wards].sort((a, b) => {
        const aMissing = (a.missingNid || 0) + (a.missingBirthReg || 0) + (a.missingBloodGroup || 0);
        const bMissing = (b.missingNid || 0) + (b.missingBirthReg || 0) + (b.missingBloodGroup || 0);
        return bMissing - aMissing;
    })[0];
    const urgentCases = (candidates || []).filter((item) => item.type !== 'blood_group_update').length;
    const decisionCards = [
        {
            title: 'Today priority',
            value: toBnDigits(urgentCases + (womenSupport?.length || 0)),
            text: 'NID, birth registration, women support follow-up আগে ধরুন।',
            tone: 'bg-slate-950 text-white'
        },
        {
            title: 'Weakest ward',
            value: riskiestWard?.wardName || 'No ward',
            text: riskiestWard ? `${toBnDigits((riskiestWard.missingNid || 0) + (riskiestWard.missingBirthReg || 0) + (riskiestWard.missingBloodGroup || 0))} missing data` : 'এখনো data নেই।',
            tone: 'bg-amber-50 text-amber-800'
        },
        {
            title: 'Duplicate warning',
            value: toBnDigits(duplicateGroups?.length || 0),
            text: 'Same NID / birth reg / family match review দরকার।',
            tone: 'bg-rose-50 text-rose-800'
        },
        {
            title: 'Data command',
            value: `${toBnDigits(summary?.citizenCompleteness || 0)}%`,
            text: `${toBnDigits(lowCompleteness?.length || 0)} low-score household আগে update করুন।`,
            tone: 'bg-teal-50 text-teal-800'
        }
    ];

    return (
        <section className="rounded-[34px] border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-600">Union Decision Room</p>
                    <h4 className="mt-1 text-xl font-black text-slate-900">আজ অফিসে কোন কাজ আগে হবে</h4>
                </div>
                <p className="max-w-xl text-xs font-bold leading-5 text-slate-500">
                    Chairman/secretary dashboard খুললেই priority, risky ward, duplicate citizen এবং low-score family এক জায়গায় দেখা যাবে।
                </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {decisionCards.map((card) => (
                    <div key={card.title} className={`rounded-3xl p-5 ${card.tone}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{card.title}</p>
                        <p className="mt-3 text-2xl font-black">{card.value}</p>
                        <p className="mt-2 text-xs font-bold leading-5 opacity-80">{card.text}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function DuplicateCitizenPanel({ groups }) {
    if (!groups?.length) {
        return (
            <section className="rounded-[32px] border border-emerald-100 bg-emerald-50 p-5">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-600" size={22} />
                    <div>
                        <h4 className="text-base font-black text-emerald-900">Duplicate citizen signal পাওয়া যায়নি</h4>
                        <p className="text-xs font-bold text-emerald-700">NID, birth registration এবং family-match data clean আছে।</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-[32px] border border-rose-100 bg-white p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">Duplicate Detection</p>
                    <h4 className="text-lg font-black text-slate-900">সম্ভাব্য duplicate citizen review</h4>
                </div>
                <span className="w-fit rounded-full bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
                    {toBnDigits(groups.length)} group
                </span>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
                {groups.slice(0, 6).map((group) => (
                    <div key={group.key} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-widest text-rose-500">{group.reason}</p>
                        <div className="mt-3 space-y-2">
                            {group.items.slice(0, 4).map((item) => (
                                <div key={item.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white p-3">
                                    <div>
                                        <p className="text-sm font-black text-slate-900">{item.name || item.ownerName || 'Citizen'}</p>
                                        <p className="text-[11px] font-bold text-slate-400">{item.wardName || 'Ward'} · Holding {toBnDigits(item.houseNo || '')}</p>
                                    </div>
                                    {item.householdId && (
                                        <Link href={`/h/${item.householdId}`} className="shrink-0 rounded-full bg-slate-950 px-3 py-2 text-[10px] font-black text-white hover:bg-rose-600">
                                            Open
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function WardScoreList({ wards }) {
    return (
        <section className="rounded-[32px] border border-slate-200 bg-white p-6">
            <h4 className="mb-5 text-lg font-black text-slate-800">ওয়ার্ডভিত্তিক অসম্পূর্ণতা</h4>
            <div className="space-y-4">
                {wards.map((ward) => {
                    const totalFields = Math.max(1, ward.totalResidents * 3);
                    const missing = ward.missingNid + ward.missingBirthReg + ward.missingBloodGroup;
                    const completeness = Math.max(0, Math.min(100, Math.round(((totalFields - missing) / totalFields) * 100)));
                    return (
                        <div key={ward.wardId} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="font-black text-slate-800">{ward.wardName}</p>
                                <p className="text-xs font-bold text-slate-400">{toBnDigits(ward.totalResidents)} জন · Score {toBnDigits(completeness)}%</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs font-bold md:grid-cols-4">
                                <span>NID নেই: {toBnDigits(ward.missingNid)}</span>
                                <span>জন্ম সনদ নেই: {toBnDigits(ward.missingBirthReg)}</span>
                                <span>রক্তের গ্রুপ নেই: {toBnDigits(ward.missingBloodGroup)}</span>
                                <span>নারী follow-up: {toBnDigits(ward.womenHealthCheckups || 0)}</span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                                <div className="h-full rounded-full bg-teal-500" style={{ width: `${completeness}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function PriorityRequestList({ items, creatingKey, onCreateCase }) {
    return (
        <section className="rounded-[32px] border border-slate-200 bg-white p-6">
            <h4 className="mb-5 text-lg font-black text-slate-800">অগ্রাধিকার আবেদন</h4>
            <div className="space-y-3">
                {items.map((item) => (
                    <div key={`${item.id}-${item.type}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-sm font-black text-slate-800">{item.name}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">{item.wardName || 'ওয়ার্ড'} · বাড়ি {toBnDigits(item.houseNo || '')}</p>
                        <p className="mt-2 text-xs font-black text-teal-600">{item.label}</p>
                        {item.type === 'blood_group_update' ? (
                            <p className="mt-3 text-xs font-bold text-slate-400">গ্রাম পর্যায়ে তথ্য আপডেট প্রয়োজন</p>
                        ) : item.activeRequest ? (
                            <RunningBadge />
                        ) : (
                            <button
                                type="button"
                                onClick={() => onCreateCase(item)}
                                disabled={creatingKey === `${item.id}-${item.type}`}
                                className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {creatingKey === `${item.id}-${item.type}` && <Loader2 size={14} className="animate-spin" />}
                                case তৈরি করুন
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

function WomenSupportDesk({ summary, items, creatingKey, smsKey, onCreateCase, onSendSms }) {
    return (
        <section className="rounded-[32px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-violet-50 p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm">
                        <Venus size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">Women Support Desk</p>
                        <h4 className="text-xl font-black text-slate-900">বিধবা ভাতা, মাতৃত্বকালীন সেবা, স্বাস্থ্য checkup ও training follow-up</h4>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onSendSms}
                    disabled={smsKey === 'women_support'}
                    className="inline-flex w-fit items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-black text-white hover:bg-rose-700 disabled:opacity-60"
                >
                    {smsKey === 'women_support' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Women support SMS
                </button>
            </div>
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <MiniStat icon={Users} label="নারী সদস্য" value={summary.femaleResidents || 0} />
                <MiniStat icon={UserRoundCheck} label="বিধবা যাচাই" value={summary.widowCandidates || 0} />
                <MiniStat icon={HeartPulse} label="নারী health follow-up" value={summary.womenHealthCheckups || 0} />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.slice(0, 9).map((item) => (
                    <div key={`${item.id}-${item.type}`} className="rounded-3xl border border-rose-100 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-black text-slate-900">{item.name || 'নারী সদস্য'}</p>
                                <p className="text-xs font-bold text-slate-400">{item.wardName || 'ওয়ার্ড'} · Holding {toBnDigits(item.houseNo || '')}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-[10px] font-black ${item.priority === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-violet-50 text-violet-700'}`}>{item.priority}</span>
                        </div>
                        <p className="mt-3 text-xs font-black text-rose-600">{item.label}</p>
                        {item.phone && <p className="mt-2 text-xs font-bold text-slate-500">SMS/Call: {toBnDigits(item.phone)}</p>}
                        <div className="mt-3 flex flex-wrap gap-2">
                            {item.activeRequest ? (
                                <RunningBadge />
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => onCreateCase(item)}
                                    disabled={creatingKey === `${item.id}-${item.type}`}
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-[11px] font-black text-white hover:bg-rose-700 disabled:opacity-60"
                                >
                                    {creatingKey === `${item.id}-${item.type}` && <Loader2 size={13} className="animate-spin" />}
                                    case open
                                </button>
                            )}
                            {item.householdId && (
                                <Link href={`/h/${item.householdId}`} className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-2 text-[11px] font-black text-slate-700 hover:text-rose-700">
                                    <ExternalLink size={13} />
                                    household
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="rounded-3xl bg-white p-5 text-sm font-bold text-slate-500">Women support candidate পাওয়া যায়নি।</div>
                )}
            </div>
        </section>
    );
}

function LowCompletenessHouseholds({ items, smsKey, onSendSms }) {
    return (
        <section className="rounded-[32px] border border-slate-200 bg-white p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h4 className="text-lg font-black text-slate-800">Low Completeness Households</h4>
                    <p className="text-sm font-bold text-slate-400">যেসব পরিবারের data score কম, আগে তাদের update করলে ইউনিয়নের data দ্রুত ভালো হবে।</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-teal-50 px-3 py-2 text-xs font-black text-teal-700">{toBnDigits(items.length || 0)} family</span>
                    <button
                        type="button"
                        onClick={onSendSms}
                        disabled={smsKey === 'low_completeness'}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white hover:bg-teal-700 disabled:opacity-60"
                    >
                        {smsKey === 'low_completeness' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        SMS পাঠান
                    </button>
                </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((house) => (
                    <div key={house.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-black text-slate-900">{house.ownerName || 'পরিবার'}</p>
                                <p className="text-xs font-bold text-slate-400">{house.wardName || 'ওয়ার্ড'} · Holding {toBnDigits(house.houseNo || '')}</p>
                            </div>
                            <span className={`rounded-2xl px-3 py-2 text-sm font-black ${house.score < 40 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                                {toBnDigits(house.score)}%
                            </span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                            <div className="h-full rounded-full bg-slate-950" style={{ width: `${house.score}%` }} />
                        </div>
                        <p className="mt-2 text-xs font-bold text-slate-500">{toBnDigits(house.missing)}টি তথ্য missing</p>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-black text-slate-500">
                            <span className="rounded-2xl bg-white px-2 py-2">NID {toBnDigits(house.missingNid || 0)}</span>
                            <span className="rounded-2xl bg-white px-2 py-2">Birth {toBnDigits(house.missingBirthReg || 0)}</span>
                            <span className="rounded-2xl bg-white px-2 py-2">Blood {toBnDigits(house.missingBloodGroup || 0)}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Link href={`/h/${house.id}`} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-[11px] font-black text-slate-700 ring-1 ring-slate-200 hover:text-teal-700">
                                <ExternalLink size={13} />
                                Household খুলুন
                            </Link>
                            <button type="button" onClick={onSendSms} className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-2 text-[11px] font-black text-teal-700 hover:bg-teal-100">
                                <Send size={13} />
                                update SMS
                            </button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="rounded-3xl bg-emerald-50 p-5 text-sm font-bold text-emerald-700">সব household score ভালো আছে।</div>
                )}
            </div>
        </section>
    );
}

function RunningBadge() {
    return (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
            <CheckCircle2 size={14} />
            case চলছে
        </div>
    );
}

function MiniStat({ icon: Icon, label, value }) {
    return (
        <div className="rounded-3xl bg-white p-4 shadow-sm">
            <Icon className="mb-3 text-rose-500" size={20} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{toBnDigits(value || 0)}</p>
        </div>
    );
}

function Stat({ icon: Icon, label, value, raw = false }) {
    return (
        <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Icon size={22} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-800">{raw ? value : toBnDigits(value || 0)}</p>
        </div>
    );
}

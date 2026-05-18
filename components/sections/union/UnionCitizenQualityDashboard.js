'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Baby, CheckCircle2, Fingerprint, HeartPulse, Loader2, Users } from 'lucide-react';
import { householdService } from '@/lib/services/householdService';
import { toBnDigits } from '@/lib/utils/format';
import toast from 'react-hot-toast';

export default function UnionCitizenQualityDashboard({ unionId }) {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creatingKey, setCreatingKey] = useState(null);

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

    if (loading) {
        return <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-indigo-600" /></div>;
    }

    const summary = dashboard?.summary || {};

    async function handleCreateRequest(item) {
        const key = `${item.id}-${item.type}`;
        try {
            setCreatingKey(key);
            const result = await householdService.createSuggestedServiceRequestForResident(item.id, item.type, unionId);
            setDashboard((current) => ({
                ...current,
                candidates: current.candidates.map((candidate) => (
                    candidate.id === item.id && candidate.type === item.type
                        ? { ...candidate, activeRequest: result.request }
                        : candidate
                ))
            }));
            toast.success(result.alreadyExists ? 'এই আবেদনটি আগে থেকেই চলছে।' : 'আবেদন তৈরি করা হয়েছে।');
        } catch (err) {
            console.error('Failed to create suggested request:', err);
            toast.error('আবেদন তৈরি করা যায়নি।');
        } finally {
            setCreatingKey(null);
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-2xl font-black text-slate-800">নাগরিক তথ্য মান</h3>
                <p className="mt-1 text-sm font-bold text-slate-400">কোন তথ্য কোথায় অপূর্ণ, আর কার জন্য কোন সেবা আগে দরকার।</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <Stat icon={Users} label="মোট নাগরিক" value={summary.totalResidents} />
                <Stat icon={Fingerprint} label="NID নেই" value={summary.missingNid} />
                <Stat icon={Baby} label="জন্ম সনদ নেই" value={summary.missingBirthReg} />
                <Stat icon={HeartPulse} label="রক্তের গ্রুপ নেই" value={summary.missingBloodGroup} />
                <Stat icon={AlertCircle} label="১৮+ কিন্তু NID নেই" value={summary.voterEligibleWithoutNid} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
                <section className="rounded-[32px] border border-slate-200 bg-white p-6">
                    <h4 className="mb-5 text-lg font-black text-slate-800">ওয়ার্ডভিত্তিক অসম্পূর্ণতা</h4>
                    <div className="space-y-4">
                        {dashboard?.wardSummaries?.map((ward) => (
                            <div key={ward.wardId} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="font-black text-slate-800">{ward.wardName}</p>
                                    <p className="text-xs font-bold text-slate-400">{toBnDigits(ward.totalResidents)} জন</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs font-bold md:grid-cols-4">
                                    <span>NID নেই: {toBnDigits(ward.missingNid)}</span>
                                    <span>জন্ম সনদ নেই: {toBnDigits(ward.missingBirthReg)}</span>
                                    <span>রক্তের গ্রুপ নেই: {toBnDigits(ward.missingBloodGroup)}</span>
                                    <span>১৮+ NID নেই: {toBnDigits(ward.voterEligibleWithoutNid)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-[32px] border border-slate-200 bg-white p-6">
                    <h4 className="mb-5 text-lg font-black text-slate-800">অগ্রাধিকার তালিকা</h4>
                    <div className="space-y-3">
                        {dashboard?.candidates?.map((item) => (
                            <div key={`${item.id}-${item.type}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <p className="text-sm font-black text-slate-800">{item.name}</p>
                                <p className="mt-1 text-xs font-bold text-slate-400">
                                    {item.wardName || 'ওয়ার্ড'} · বাড়ি {toBnDigits(item.houseNo || '')}
                                </p>
                                <p className="mt-2 text-xs font-black text-teal-600">{item.label}</p>
                                {item.type === 'blood_group_update' ? (
                                    <p className="mt-3 text-xs font-bold text-slate-400">গ্রাম পর্যায়ে তথ্য আপডেট প্রয়োজন</p>
                                ) : item.activeRequest ? (
                                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                                        <CheckCircle2 size={14} />
                                        আবেদন চলছে
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleCreateRequest(item)}
                                        disabled={creatingKey === `${item.id}-${item.type}`}
                                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {creatingKey === `${item.id}-${item.type}` && <Loader2 size={14} className="animate-spin" />}
                                        {item.type === 'nid_application' ? 'NID আবেদন তৈরি করুন' : 'জন্ম নিবন্ধন আবেদন তৈরি করুন'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function Stat({ icon: Icon, label, value }) {
    return (
        <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Icon size={22} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-800">{toBnDigits(value || 0)}</p>
        </div>
    );
}

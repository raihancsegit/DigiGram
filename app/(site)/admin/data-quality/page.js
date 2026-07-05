"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/utils/supabase';
import {
    AlertTriangle, CheckCircle2, ClipboardCheck, Droplets, Fingerprint,
    LocateFixed, RefreshCw, Search, ShieldCheck, UsersRound, UserCheck, UserX
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const issueTone = {
    missing_identity: 'bg-rose-50 text-rose-700',
    missing_blood_group: 'bg-fuchsia-50 text-fuchsia-700',
    missing_gps: 'bg-blue-50 text-blue-700',
    missing_village: 'bg-amber-50 text-amber-700',
    missing_creator: 'bg-orange-50 text-orange-700',
    duplicate_resident: 'bg-violet-50 text-violet-700'
};

function Score({ value }) {
    const tone = value >= 85
        ? 'bg-emerald-50 text-emerald-700'
        : value >= 65 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700';
    return <span className={`inline-flex min-w-14 justify-center rounded-full px-3 py-1 text-xs font-black ${tone}`}>{value}%</span>;
}

function MetricCard({ icon: Icon, label, value, detail, tone = 'teal' }) {
    const tones = {
        teal: 'bg-teal-50 text-teal-700',
        rose: 'bg-rose-50 text-rose-700',
        amber: 'bg-amber-50 text-amber-700',
        blue: 'bg-blue-50 text-blue-700',
        violet: 'bg-violet-50 text-violet-700'
    };
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
                <Icon size={21} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{value ?? 0}</p>
            <p className="mt-2 text-xs font-bold text-slate-500">{detail}</p>
        </div>
    );
}

function RankingTable({ rows, type }) {
    if (!rows?.length) {
        return <p className="p-8 text-center text-sm font-bold text-slate-400">এখনও ranking data নেই।</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <tr>
                        <th className="px-5 py-4">এলাকা / কর্মকর্তা</th>
                        <th className="px-5 py-4">স্কোর</th>
                        <th className="px-5 py-4">বাড়ি</th>
                        <th className="px-5 py-4">নাগরিক</th>
                        <th className="px-5 py-4">Identity gap</th>
                        <th className="px-5 py-4">GPS gap</th>
                        <th className="px-5 py-4">Duplicate</th>
                        <th className="px-5 py-4">Task</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((row, index) => (
                        <tr key={`${type}-${row.id}`} className="hover:bg-teal-50/40">
                            <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-500">{index + 1}</span>
                                    <div>
                                        <p className="font-black text-slate-800">{row.name}</p>
                                        {type === 'volunteer' && <p className="text-xs font-bold text-slate-400">ভলান্টিয়ার</p>}
                                    </div>
                                </div>
                            </td>
                            <td className="px-5 py-4"><Score value={row.score} /></td>
                            <td className="px-5 py-4 font-bold text-slate-600">{row.households}</td>
                            <td className="px-5 py-4 font-bold text-slate-600">{row.residents}</td>
                            <td className="px-5 py-4 font-black text-rose-600">{row.missingIdentity}</td>
                            <td className="px-5 py-4 font-black text-blue-600">{row.missingGps}</td>
                            <td className="px-5 py-4 font-black text-violet-600">{row.duplicates}</td>
                            <td className="px-5 py-4 font-black text-amber-600">{row.openTasks}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function DuplicateReviewCard({ group, saving, onReview, onMerge }) {
    const [primaryResidentId, setPrimaryResidentId] = useState(group.primaryResidentId || group.items?.[0]?.id || '');
    const [note, setNote] = useState(group.note || '');
    const decisionTone = group.decision === 'confirmed_duplicate'
        ? 'bg-rose-50 text-rose-700'
        : group.decision === 'different_people'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-amber-50 text-amber-700';
    const decisionLabel = group.decision === 'confirmed_duplicate'
        ? 'ডুপ্লিকেট নিশ্চিত'
        : group.decision === 'different_people' ? 'আলাদা ব্যক্তি' : 'পর্যালোচনা বাকি';

    return (
        <article className="border-b border-slate-100 p-5 last:border-b-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-black text-violet-700">{group.reason}</span>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black ${decisionTone}`}>{decisionLabel}</span>
                        <span className="text-xs font-black text-slate-400">{group.confidence}% confidence</span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-400">{group.items?.length || 0}টি record পাশাপাশি যাচাই করুন</p>
                </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {(group.items || []).map((resident) => (
                    <label key={resident.id} className={`block cursor-pointer rounded-2xl border p-4 transition ${primaryResidentId === resident.id ? 'border-teal-400 bg-teal-50/70' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                        <div className="flex items-start gap-3">
                            <input
                                type="radio"
                                name={`primary-${group.fingerprint}`}
                                checked={primaryResidentId === resident.id}
                                onChange={() => setPrimaryResidentId(resident.id)}
                                className="mt-1 accent-teal-600"
                            />
                            <div className="min-w-0">
                                <p className="font-black text-slate-900">{resident.bn_name || resident.name || 'নাম নেই'}</p>
                                <p className="mt-1 text-xs font-bold text-slate-500">
                                    বাড়ি {resident.household?.houseNo || '—'} · {resident.household?.ownerName || 'মালিক অজানা'}
                                </p>
                                <div className="mt-3 grid gap-1 text-xs font-bold text-slate-500">
                                    <span>NID: {resident.nid || 'নেই'}</span>
                                    <span>জন্ম নিবন্ধন: {resident.birth_reg_no || 'নেই'}</span>
                                    <span>জন্মতারিখ: {resident.dob || 'নেই'}</span>
                                    <span>বাবা: {resident.father_name || 'নেই'} · মা: {resident.mother_name || 'নেই'}</span>
                                    <span>ফোন: {resident.household?.phone || 'নেই'}</span>
                                </div>
                            </div>
                        </div>
                    </label>
                ))}
            </div>

            <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="যাচাই নোট লিখুন (ঐচ্ছিক)"
                rows={2}
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-teal-500"
            />
            <div className="mt-3 flex flex-wrap gap-2">
                <button
                    disabled={saving === group.fingerprint}
                    onClick={() => onReview(group, 'confirmed_duplicate', primaryResidentId, note)}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white hover:bg-rose-700 disabled:opacity-50"
                >
                    <UserCheck size={15} /> ডুপ্লিকেট নিশ্চিত
                </button>
                <button
                    disabled={saving === group.fingerprint}
                    onClick={() => onReview(group, 'different_people', null, note)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                >
                    <UserX size={15} /> আলাদা ব্যক্তি
                </button>
                {group.decision !== 'pending' && (
                    <button
                        disabled={saving === group.fingerprint}
                        onClick={() => onReview(group, 'pending', null, note)}
                        className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                    >
                        সিদ্ধান্ত বাতিল
                    </button>
                )}
                {group.decision === 'confirmed_duplicate' && group.reviewId && (
                    <button
                        disabled={saving === group.fingerprint || !primaryResidentId}
                        onClick={() => onMerge(group, primaryResidentId, note)}
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                        <Fingerprint size={15} /> নিরাপদ merge
                    </button>
                )}
            </div>
        </article>
    );
}

export default function DataQualityPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('union');
    const [issueType, setIssueType] = useState('all');
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(null);
    const [duplicatePage, setDuplicatePage] = useState(1);

    const apiRequest = useCallback(async (options = {}) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error('Session পাওয়া যায়নি। আবার login করুন।');
        const response = await fetch('/api/admin/data-quality', {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...(options.headers || {})
            }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Request failed');
        return result;
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            setData(await apiRequest());
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [apiRequest]);

    useEffect(() => { loadData(); }, [loadData]);

    const filteredIssues = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return (data?.issues || []).filter((item) => {
            if (issueType !== 'all' && item.issueType !== issueType) return false;
            return !needle || `${item.entityName} ${item.issueLabel}`.toLowerCase().includes(needle);
        }).slice(0, 200);
    }, [data?.issues, issueType, search]);

    const createTask = async (issue) => {
        setSaving(issue.key);
        try {
            await apiRequest({
                method: 'POST',
                body: JSON.stringify({ action: 'create_task', issue })
            });
            toast.success('Correction task তৈরি হয়েছে।');
            await loadData();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(null);
        }
    };

    const updateTask = async (id, changes) => {
        setSaving(id);
        try {
            await apiRequest({
                method: 'POST',
                body: JSON.stringify({ action: 'update_task', id, ...changes })
            });
            toast.success('Task update হয়েছে।');
            await loadData();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(null);
        }
    };

    const reviewDuplicate = async (group, decision, primaryResidentId, note) => {
        setSaving(group.fingerprint);
        try {
            await apiRequest({
                method: 'POST',
                body: JSON.stringify({
                    action: 'review_duplicate',
                    fingerprint: group.fingerprint,
                    residentIds: group.items.map((item) => item.id),
                    decision,
                    primaryResidentId,
                    note
                })
            });
            toast.success('Duplicate review সংরক্ষণ হয়েছে।');
            await loadData();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(null);
        }
    };

    const mergeDuplicate = async (group, primaryResidentId, note) => {
        const duplicateResidentIds = group.items.map((item) => item.id).filter((id) => id !== primaryResidentId);
        if (!window.confirm(`${duplicateResidentIds.length}টি duplicate record primary নাগরিকের সাথে merge করবেন? Governance Center থেকে rollback করা যাবে।`)) return;
        setSaving(group.fingerprint);
        try {
            await apiRequest({
                method: 'POST',
                body: JSON.stringify({
                    action: 'merge_duplicate',
                    reviewId: group.reviewId,
                    primaryResidentId,
                    duplicateResidentIds,
                    note
                })
            });
            toast.success('নিরাপদ merge সম্পন্ন হয়েছে।');
            await loadData();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <RefreshCw className="animate-spin text-teal-600" size={34} />
            </div>
        );
    }

    const summary = data?.summary || {};
    const ranking = tab === 'union'
        ? data?.unionRanking
        : tab === 'ward' ? data?.wardRanking : data?.volunteerRanking;
    const duplicateGroups = data?.duplicateGroups || [];
    const duplicatePageSize = 5;
    const duplicatePageCount = Math.max(1, Math.ceil(duplicateGroups.length / duplicatePageSize));
    const pagedDuplicateGroups = duplicateGroups.slice(
        (duplicatePage - 1) * duplicatePageSize,
        duplicatePage * duplicatePageSize
    );

    return (
        <div className="space-y-7 pb-20">
            <section className="overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-xl md:p-9">
                <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-400/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-teal-300">
                            <ShieldCheck size={15} /> Data Quality Command Center
                        </div>
                        <h1 className="max-w-3xl text-3xl font-black leading-tight md:text-5xl">কোন এলাকার ডাটা আগে ঠিক করতে হবে, এক নজরে দেখুন</h1>
                        <p className="mt-4 max-w-2xl text-sm font-bold leading-7 text-slate-400">
                            ইউনিয়ন, ওয়ার্ড ও ভলান্টিয়ারভিত্তিক completeness score, duplicate নাগরিক এবং correction queue।
                        </p>
                    </div>
                    <button onClick={loadData} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-teal-400">
                        <RefreshCw size={17} /> রিপোর্ট রিফ্রেশ
                    </button>
                </div>
            </section>

            {data?.setupRequired && (
                <div className="flex gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-900">
                    <AlertTriangle className="shrink-0" size={20} />
                    Correction task চালু করতে Supabase SQL Editor-এ <code>database/62_data_quality_command_center.sql</code> রান করুন। Ranking এখনই কাজ করবে।
                </div>
            )}

            <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <MetricCard icon={ShieldCheck} label="Quality score" value={`${summary.score || 0}%`} detail="সকল ward-এর weighted score" />
                <MetricCard icon={Fingerprint} label="Identity gap" value={summary.missingIdentity} detail="NID ও জন্ম নিবন্ধন দুটোই নেই" tone="rose" />
                <MetricCard icon={Droplets} label="Blood group gap" value={summary.missingBlood} detail="জরুরি blood data অসম্পূর্ণ" tone="violet" />
                <MetricCard icon={LocateFixed} label="GPS gap" value={summary.missingGps} detail="বাড়ির map pin নেই" tone="blue" />
                <MetricCard icon={UsersRound} label="Duplicate risk" value={summary.duplicates} detail="সম্ভাব্য duplicate resident" tone="amber" />
            </section>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Duplicate Citizen Review</h2>
                        <p className="mt-1 text-sm font-bold text-slate-400">NID, জন্ম নিবন্ধন, ফোন ও পারিবারিক তথ্য মিলিয়ে records পাশাপাশি দেখুন।</p>
                    </div>
                    <span className="w-fit rounded-full bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">{duplicateGroups.length}টি group</span>
                </div>
                {data?.duplicateReviewSetupRequired && (
                    <div className="m-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                        সিদ্ধান্ত সংরক্ষণ করতে Supabase SQL Editor-এ <code>database/71_duplicate_citizen_review.sql</code> চালান।
                    </div>
                )}
                <div>
                    {pagedDuplicateGroups.map((group) => (
                        <DuplicateReviewCard
                            key={group.fingerprint}
                            group={group}
                            saving={saving}
                            onReview={reviewDuplicate}
                            onMerge={mergeDuplicate}
                        />
                    ))}
                    {!duplicateGroups.length && <p className="p-10 text-center text-sm font-bold text-slate-400">কোনো duplicate signal পাওয়া যায়নি।</p>}
                </div>
                {duplicateGroups.length > duplicatePageSize && (
                    <div className="flex items-center justify-between border-t border-slate-100 p-4">
                        <button disabled={duplicatePage <= 1} onClick={() => setDuplicatePage((page) => page - 1)} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 disabled:opacity-40">আগের</button>
                        <span className="text-xs font-black text-slate-400">{duplicatePage} / {duplicatePageCount}</span>
                        <button disabled={duplicatePage >= duplicatePageCount} onClick={() => setDuplicatePage((page) => page + 1)} className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white disabled:opacity-40">পরের</button>
                    </div>
                )}
            </section>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Performance ranking</h2>
                        <p className="mt-1 text-sm font-bold text-slate-400">কম score থাকা এলাকা তালিকার শুরুতে দেখানো হয়েছে।</p>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {[['union', 'ইউনিয়ন'], ['ward', 'ওয়ার্ড'], ['volunteer', 'ভলান্টিয়ার']].map(([key, label]) => (
                            <button key={key} onClick={() => setTab(key)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black ${tab === key ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-800'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <RankingTable rows={ranking} type={tab} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-5">
                        <h2 className="text-xl font-black text-slate-900">Issue explorer</h2>
                        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_230px]">
                            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4">
                                <Search size={18} className="text-slate-400" />
                                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="নাম বা সমস্যায় খুঁজুন" className="h-12 w-full bg-transparent text-sm font-bold outline-none" />
                            </label>
                            <select value={issueType} onChange={(event) => setIssueType(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-teal-500">
                                <option value="all">সব সমস্যা</option>
                                <option value="missing_identity">Identity নেই</option>
                                <option value="missing_blood_group">Blood group নেই</option>
                                <option value="missing_gps">GPS নেই</option>
                                <option value="missing_village">Village mapping নেই</option>
                                <option value="missing_creator">Creator link নেই</option>
                                <option value="duplicate_resident">Duplicate risk</option>
                            </select>
                        </div>
                    </div>
                    <div className="max-h-[620px] divide-y divide-slate-100 overflow-y-auto">
                        {filteredIssues.map((issue) => (
                            <div key={issue.key} className="flex flex-col gap-3 p-5 hover:bg-slate-50 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${issueTone[issue.issueType] || 'bg-slate-100 text-slate-600'}`}>{issue.issueLabel}</span>
                                    <p className="mt-2 truncate font-black text-slate-800">{issue.entityName}</p>
                                    <p className="mt-1 text-xs font-bold text-slate-400">{issue.entityType === 'resident' ? 'নাগরিক' : 'বাড়ি'} · ID {issue.entityId.slice(0, 8)}</p>
                                </div>
                                <button disabled={saving === issue.key || data?.setupRequired} onClick={() => createTask(issue)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40">
                                    <ClipboardCheck size={15} /> Task করুন
                                </button>
                            </div>
                        ))}
                        {!filteredIssues.length && <p className="p-10 text-center text-sm font-bold text-slate-400">এই filter-এ সমস্যা পাওয়া যায়নি।</p>}
                    </div>
                </div>

                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-5">
                        <h2 className="text-xl font-black text-slate-900">Correction queue</h2>
                        <p className="mt-1 text-sm font-bold text-slate-400">{(data?.tasks || []).filter((task) => !['resolved', 'dismissed'].includes(task.status)).length}টি active task</p>
                    </div>
                    <div className="max-h-[720px] divide-y divide-slate-100 overflow-y-auto">
                        {(data?.tasks || []).map((task) => (
                            <div key={task.id} className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-black leading-6 text-slate-800">{task.title}</p>
                                        <p className="mt-1 text-xs font-bold text-slate-400">{task.assignee ? `${task.assignee.first_name || ''} ${task.assignee.last_name || ''}` : 'এখনও assign হয়নি'}</p>
                                    </div>
                                    {task.status === 'resolved'
                                        ? <CheckCircle2 className="shrink-0 text-emerald-500" size={20} />
                                        : <AlertTriangle className="shrink-0 text-amber-500" size={20} />}
                                </div>
                                <div className="mt-4">
                                    <select
                                        value={task.assigned_to || ''}
                                        disabled={saving === task.id}
                                        onChange={(event) => updateTask(task.id, { assignedTo: event.target.value || null })}
                                        className="mb-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-teal-500"
                                    >
                                        <option value="">কর্মকর্তা assign করুন</option>
                                        {(data?.assignees || []).map((assignee) => (
                                            <option key={assignee.id} value={assignee.id}>
                                                {assignee.name} · {assignee.role === 'volunteer' ? 'ভলান্টিয়ার' : 'ওয়ার্ড মেম্বার'}
                                            </option>
                                        ))}
                                    </select>
                                    <button disabled={saving === task.id} onClick={() => updateTask(task.id, { status: task.status === 'resolved' ? 'open' : 'resolved' })} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100">
                                        {task.status === 'resolved' ? 'পুনরায় খুলুন' : 'সমাধান হয়েছে'}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {!data?.tasks?.length && <p className="p-10 text-center text-sm font-bold text-slate-400">এখনও correction task নেই।</p>}
                    </div>
                </div>
            </section>
        </div>
    );
}

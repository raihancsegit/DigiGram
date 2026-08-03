'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, CircleDashed, DatabaseZap, Download, Loader2, RefreshCw, Save, School, Sparkles } from 'lucide-react';
import { authenticatedFetch } from '@/lib/utils/authenticated-fetch';

const statusStyles = {
    ready: 'bg-teal-100 text-teal-800',
    in_progress: 'bg-amber-100 text-amber-800',
    blocked: 'bg-rose-100 text-rose-800'
};

const UAT_ITEMS = [
    ['teacher_login', 'Teacher login'],
    ['student_login', 'Student login'],
    ['guardian_verify', 'Guardian verification'],
    ['attendance', 'Attendance'],
    ['fee_receipt', 'Fee receipt'],
    ['result_card', 'Result card'],
    ['website_mobile', 'Mobile website']
];

function getNextAction(school) {
    const missing = new Set(school.checks.filter((check) => !check.ok).map((check) => check.key));
    if (missing.has('schema') || missing.has('migration')) {
        return { type: 'link', href: '/admin/migrations', label: 'Run migrations', detail: 'Database setup আগে সম্পন্ন করুন' };
    }
    if (missing.has('session') || missing.has('class') || missing.has('people')) {
        return { type: 'seed', label: 'Import verified demo', detail: 'Session, class, teacher ও student pilot data তৈরি করুন' };
    }
    if (missing.has('routine') || missing.has('fees')) {
        return { type: 'link', href: `/school/${school.id}/admin`, label: 'Complete operations', detail: 'Routine ও fee structure যোগ করুন' };
    }
    if (missing.has('website')) {
        return { type: 'link', href: `/school/${school.id}/admin`, label: 'Publish website', detail: 'Website content review করে publish করুন' };
    }
    return { type: 'link', href: `/school/${school.id}/admin`, label: 'Start pilot', detail: 'সব readiness check সম্পন্ন' };
}

function csvCell(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function exportUatReport(school) {
    const signoffs = new Map((school.signoffs || []).map((item) => [item.item_key, item]));
    const rows = [
        ['institution', school.name],
        ['type', school.type],
        ['readiness_score', `${school.score}%`],
        ['approval_status', school.approval?.status || 'pending'],
        ['approved_by', school.approval?.approved_by || ''],
        ['approved_at', school.approval?.approved_at || ''],
        ['exported_at', new Date().toISOString()],
        [],
        ['uat_item', 'completed', 'evidence_note', 'verified_by', 'verified_at'],
        ...UAT_ITEMS.map(([key, label]) => {
            const signoff = signoffs.get(key);
            return [label, signoff?.completed ? 'yes' : 'no', signoff?.note || '', signoff?.verified_by || '', signoff?.verified_at || ''];
        })
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `school-pilot-uat-${school.id}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
}

export default function SchoolPilotReadinessPanel() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [seedingSchoolId, setSeedingSchoolId] = useState('');
    const [actionMessage, setActionMessage] = useState({});
    const [savingSignoff, setSavingSignoff] = useState('');
    const [draftNotes, setDraftNotes] = useState({});
    const [approvingSchoolId, setApprovingSchoolId] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await authenticatedFetch('/api/admin/launch/school-readiness', { cache: 'no-store' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'School readiness load failed');
            setData(result.data);
        } catch (loadError) {
            setError(loadError.message || 'School readiness load failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const seedSchool = useCallback(async (school) => {
        const confirmed = window.confirm(`${school.name}-এ demo class, teacher, student, lesson ও website data import করবেন?`);
        if (!confirmed) return;
        setSeedingSchoolId(school.id);
        setActionMessage((current) => ({ ...current, [school.id]: '' }));
        try {
            const response = await authenticatedFetch('/api/admin/seed-school', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ institutionId: school.id })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Demo import failed');
            const verification = result.data?.verification;
            setActionMessage((current) => ({
                ...current,
                [school.id]: verification?.passed
                    ? `Verified: ${verification.counts.classes} class, ${verification.counts.teachers} teacher, ${verification.counts.students} student`
                    : 'Import finished; readiness refresh করুন'
            }));
            await load();
        } catch (seedError) {
            setActionMessage((current) => ({ ...current, [school.id]: seedError.message || 'Demo import failed' }));
        } finally {
            setSeedingSchoolId('');
        }
    }, [load]);

    const updateSignoff = useCallback(async (school, itemKey, completed, note = '') => {
        const operationKey = `${school.id}:${itemKey}`;
        setSavingSignoff(operationKey);
        setActionMessage((current) => ({ ...current, [school.id]: '' }));
        try {
            const response = await authenticatedFetch('/api/admin/launch/school-readiness', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ institutionId: school.id, itemKey, completed, note })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'UAT sign-off update failed');
            setData((current) => ({
                ...current,
                schools: current.schools.map((item) => {
                    if (item.id !== school.id) return item;
                    const existing = item.signoffs || [];
                    return {
                        ...item,
                        signoffs: [...existing.filter((signoff) => signoff.item_key !== itemKey), result.data]
                    };
                })
            }));
        } catch (signoffError) {
            setActionMessage((current) => ({ ...current, [school.id]: signoffError.message || 'UAT sign-off update failed' }));
        } finally {
            setSavingSignoff('');
        }
    }, []);

    const approveSchool = useCallback(async (school) => {
        if (!window.confirm(`${school.name}-এর pilot final approval দেবেন?`)) return;
        setApprovingSchoolId(school.id);
        try {
            const response = await authenticatedFetch('/api/admin/launch/school-readiness', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ institutionId: school.id, action: 'approve' })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Pilot approval failed');
            setData((current) => ({
                ...current,
                schools: current.schools.map((item) => item.id === school.id ? { ...item, approval: result.data } : item)
            }));
        } catch (approvalError) {
            setActionMessage((current) => ({ ...current, [school.id]: approvalError.message || 'Pilot approval failed' }));
        } finally {
            setApprovingSchoolId('');
        }
    }, []);

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-950 text-white">
                        <School size={23} />
                    </span>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">School pilot</p>
                        <h2 className="text-2xl font-black text-slate-950">Institution readiness board</h2>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                            Migration, data, roles, routine, fees ও published website-এর live অবস্থা।
                        </p>
                    </div>
                </div>
                <button type="button" onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50 disabled:opacity-60">
                    <RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {loading && !data ? (
                <div className="flex min-h-44 items-center justify-center gap-3 text-sm font-black text-slate-500">
                    <Loader2 className="animate-spin text-indigo-600" size={24} /> School readiness loading...
                </div>
            ) : error ? (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                    <AlertTriangle size={20} className="mt-0.5 shrink-0" /> {error}
                </div>
            ) : (
                <div className="mt-5 space-y-5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            ['Total institutions', data?.summary?.total || 0, 'bg-slate-950 text-white'],
                            ['Pilot ready', data?.summary?.ready || 0, 'bg-teal-50 text-teal-900'],
                            ['In progress', data?.summary?.inProgress || 0, 'bg-amber-50 text-amber-900'],
                            ['Blocked', data?.summary?.blocked || 0, 'bg-rose-50 text-rose-900']
                        ].map(([label, value, tone]) => (
                            <div key={label} className={`rounded-2xl p-4 ${tone}`}>
                                <p className="text-xs font-black uppercase tracking-wider opacity-70">{label}</p>
                                <p className="mt-2 text-3xl font-black">{Number(value).toLocaleString('bn-BD')}</p>
                            </div>
                        ))}
                    </div>

                    {!data?.schools?.length ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                            <CircleDashed className="mx-auto text-slate-400" />
                            <p className="mt-3 font-black text-slate-800">কোনো school/college pilot পাওয়া যায়নি</p>
                            <Link href="/admin/institutions" className="mt-3 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Institution তৈরি করুন</Link>
                        </div>
                    ) : (
                        <div className="grid gap-4 xl:grid-cols-2">
                            {data.schools.map((school) => {
                                const nextAction = getNextAction(school);
                                return (
                                <article key={school.id} className="rounded-3xl border border-slate-200 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">{school.type}</p>
                                            <h3 className="text-lg font-black text-slate-950">{school.name}</h3>
                                            <p className="mt-1 text-xs font-bold text-slate-500">
                                                {school.counts.classes} class · {school.counts.teachers} teacher · {school.counts.students} student
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${statusStyles[school.status]}`}>
                                                {school.status.replace('_', ' ')}
                                            </span>
                                            <p className="mt-2 text-2xl font-black text-slate-950">{school.score}%</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {school.checks.map((check) => (
                                            <div key={check.key} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${check.ok ? 'bg-teal-50 text-teal-800' : 'bg-slate-100 text-slate-500'}`}>
                                                {check.ok ? <CheckCircle2 size={15} /> : <CircleDashed size={15} />}
                                                {check.label}
                                            </div>
                                        ))}
                                    </div>
                                    <div className={`mt-4 rounded-2xl p-3 ${school.status === 'ready' ? 'bg-teal-50' : 'bg-indigo-50'}`}>
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-start gap-2">
                                                {nextAction.type === 'seed' ? <Sparkles size={18} className="mt-0.5 text-indigo-700" /> : <DatabaseZap size={18} className="mt-0.5 text-indigo-700" />}
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-wider text-indigo-700">Recommended next</p>
                                                    <p className="text-sm font-bold text-slate-600">{nextAction.detail}</p>
                                                </div>
                                            </div>
                                            {nextAction.type === 'seed' ? (
                                                <button type="button" onClick={() => seedSchool(school)} disabled={Boolean(seedingSchoolId)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-950 px-4 py-2 text-xs font-black text-white disabled:opacity-60">
                                                    {seedingSchoolId === school.id ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                                                    {seedingSchoolId === school.id ? 'Importing...' : nextAction.label}
                                                </button>
                                            ) : (
                                                <Link href={nextAction.href} className="shrink-0 rounded-xl bg-indigo-950 px-4 py-2 text-center text-xs font-black text-white">
                                                    {nextAction.label}
                                                </Link>
                                            )}
                                        </div>
                                        {actionMessage[school.id] && (
                                            <p role="status" className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700">
                                                {actionMessage[school.id]}
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Pilot UAT sign-off</p>
                                                <p className="text-xs font-bold text-slate-400">
                                                    {(school.signoffs || []).filter((item) => item.completed).length}/{UAT_ITEMS.length} verified
                                                </p>
                                            </div>
                                            <span className="text-lg font-black text-slate-900">
                                                {Math.round(((school.signoffs || []).filter((item) => item.completed).length / UAT_ITEMS.length) * 100)}%
                                            </span>
                                        </div>
                                        <button type="button" onClick={() => exportUatReport(school)} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">
                                            <Download size={15} /> Export sign-off CSV
                                        </button>
                                        <div className="mt-3 space-y-2">
                                            {UAT_ITEMS.map(([key, label]) => {
                                                const signoff = (school.signoffs || []).find((item) => item.item_key === key);
                                                const completed = Boolean(signoff?.completed);
                                                const operationKey = `${school.id}:${key}`;
                                                const noteKey = operationKey;
                                                const note = draftNotes[noteKey] ?? signoff?.note ?? '';
                                                return (
                                                    <div key={key} className={`rounded-xl p-3 ${completed ? 'bg-teal-100 text-teal-900' : 'bg-white text-slate-700'}`}>
                                                        <label className="flex cursor-pointer items-center gap-2 text-xs font-black">
                                                            <input
                                                                type="checkbox"
                                                                checked={completed}
                                                                disabled={Boolean(savingSignoff)}
                                                                onChange={(event) => updateSignoff(school, key, event.target.checked, note)}
                                                                className="h-4 w-4 accent-teal-700"
                                                            />
                                                            {savingSignoff === operationKey ? <Loader2 size={14} className="animate-spin" /> : null}
                                                            {label}
                                                        </label>
                                                        <div className="mt-2 flex gap-2">
                                                            <input
                                                                value={note}
                                                                onChange={(event) => setDraftNotes((current) => ({ ...current, [noteKey]: event.target.value }))}
                                                                maxLength={500}
                                                                placeholder="Evidence/note লিখুন"
                                                                aria-label={`${label} evidence note`}
                                                                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400"
                                                            />
                                                            <button type="button" onClick={() => updateSignoff(school, key, completed, note)} disabled={Boolean(savingSignoff)} aria-label={`Save ${label} note`} className="rounded-lg bg-slate-950 px-3 text-white disabled:opacity-60">
                                                                <Save size={14} />
                                                            </button>
                                                        </div>
                                                        {signoff?.verified_at && (
                                                            <p className="mt-2 text-[10px] font-bold opacity-70">
                                                                Verified {new Date(signoff.verified_at).toLocaleString('bn-BD')}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {school.approval?.status === 'approved' ? (
                                            <div className="mt-3 rounded-xl bg-teal-950 px-4 py-3 text-white">
                                                <p className="text-xs font-black uppercase tracking-wider text-teal-200">Pilot approved</p>
                                                <p className="mt-1 text-xs font-bold">
                                                    {new Date(school.approval.approved_at).toLocaleString('bn-BD')}
                                                </p>
                                                {school.approval.certificate_no && (
                                                    <Link href={`/school/pilot/${school.approval.certificate_no}`} target="_blank" className="mt-2 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-black text-teal-950">
                                                        Verify certificate
                                                    </Link>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => approveSchool(school)}
                                                disabled={school.score !== 100 || (school.signoffs || []).filter((item) => item.completed).length !== UAT_ITEMS.length || Boolean(approvingSchoolId)}
                                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                                            >
                                                {approvingSchoolId === school.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                                                Final pilot approval
                                            </button>
                                        )}
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Link href={`/school/${school.id}/admin`} className="rounded-xl bg-indigo-950 px-4 py-2 text-xs font-black text-white">Open school admin</Link>
                                        <Link href="/admin/institutions" className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-800">Manage</Link>
                                    </div>
                                </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

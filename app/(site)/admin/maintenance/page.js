"use client";

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { 
    Database, Trash2, Zap, ShieldAlert, CheckCircle2, 
    Loader2, Users, MapPin, Home, ArrowRight, Download, Upload,
    RefreshCw, AlertTriangle, GitBranch, FileWarning, ExternalLink,
    MessageSquare, Building2, ClipboardList, Gauge
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '@/lib/services/adminService';
import { authenticatedFetch } from '@/lib/utils/authenticated-fetch';

export default function MaintenancePage() {
    const [loadingAction, setLoadingAction] = useState(null);
    const [stats, setStats] = useState(null);
    const [audit, setAudit] = useState(null);
    const [selection, setSelection] = useState({});
    const [demoStatus, setDemoStatus] = useState(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await adminService.getGlobalStats();
            const auditData = await adminService.getMigrationAudit();
            const demoResponse = await authenticatedFetch('/api/admin/demo-data');
            const demoData = await demoResponse.json();
            setStats(data);
            setAudit(auditData);
            setDemoStatus(demoData);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDemoAction = async (action) => {
        const isRemove = action === 'remove';
        const isReset = action === 'reset';
        if (!confirm(
            isReset
                ? 'পুরনো registered demo data থাকলে remove করে নতুন demo data তৈরি হবে। Real data untouched থাকবে। চালাবেন?'
                : isRemove
                ? 'শুধু registry-তে থাকা demo data remove হবে। Real data অপরিবর্তিত থাকবে। চালাবেন?'
                : 'Household, citizen service, market, lost-found, business, school, SMS ও governance demo data তৈরি হবে। চালাবেন?'
        )) return;

        setLoadingAction(`demo-${action}`);
        const loadingToast = toast.loading(
            isReset
                ? 'Demo data reset হচ্ছে...'
                : isRemove ? 'Demo data remove হচ্ছে...' : 'সব module-এর demo data তৈরি হচ্ছে...'
        );
        try {
            const response = await authenticatedFetch('/api/admin/demo-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Demo operation failed');
            toast.success(result.message, { id: loadingToast });
            await loadStats();
        } catch (error) {
            toast.error(error.message, { id: loadingToast });
        } finally {
            setLoadingAction(null);
        }
    };

    const handleAction = async (action) => {
        const confirmMsg = action === 'wipe'
            ? 'সব union, ward, gram, household, institution, school, citizen, SMS data delete হবে। শুধু super admin থাকবে। চালাবেন?'
            : action === 'repair_migration_links'
                ? 'নিরাপদ migration repair চালানো হবে। শুধু নিশ্চিতভাবে মেলানো data update হবে। চালাবেন?'
                : 'সিস্টেম এখন ৪টি ইউনিয়ন, ২৪টি ওয়ার্ড এবং ৪৮টি গ্রাম তৈরি করবে। এতে কিছুক্ষণ সময় লাগতে পারে। আপনি কি নিশ্চিত?';
        
        if (!confirm(confirmMsg)) return;
        let confirmation = null;
        if (action === 'wipe') {
            confirmation = window.prompt('Final confirmation লিখুন: DELETE_ALL_EXCEPT_SUPER_ADMIN');
            if (confirmation !== 'DELETE_ALL_EXCEPT_SUPER_ADMIN') {
                toast.error('Confirmation match করেনি, reset cancel হয়েছে।');
                return;
            }
        }

        setLoadingAction(action);
        const loadingToast = toast.loading(
            action === 'seed'
                ? 'ডাটা জেনারেট হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...'
                : action === 'repair_migration_links'
                    ? 'নিরাপদ repair চালানো হচ্ছে...'
                    : 'ডাটা পরিষ্কার করা হচ্ছে...'
        );
        
        try {
            const response = await authenticatedFetch('/api/admin/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, confirmation })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            toast.success(result.message, { id: loadingToast });
            await loadStats();
        } catch (err) {
            toast.error(err.message || 'কোনো একটি সমস্যা হয়েছে', { id: loadingToast });
        } finally {
            setLoadingAction(null);
        }
    };

    const handleManualFix = async (action, payload, key) => {
        setLoadingAction(key);
        const loadingToast = toast.loading('আপডেট করা হচ্ছে...');

        try {
            const response = await authenticatedFetch('/api/admin/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...payload })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            toast.success(result.message, { id: loadingToast });
            await loadStats();
        } catch (err) {
            toast.error(err.message || 'আপডেট করা যায়নি', { id: loadingToast });
        } finally {
            setLoadingAction(null);
        }
    };

    const handleDocumentMigration = async (documentId, file) => {
        if (!file) return;

        const key = `document-${documentId}`;
        setLoadingAction(key);
        const loadingToast = toast.loading('নথি private locker-এ নেওয়া হচ্ছে...');

        try {
            const formData = new FormData();
            formData.append('documentId', documentId);
            formData.append('file', file);

            const response = await authenticatedFetch('/api/admin/migrate-household-document', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            toast.success(result.message, { id: loadingToast });
            await loadStats();
        } catch (err) {
            toast.error(err.message || 'নথি migrate করা যায়নি', { id: loadingToast });
        } finally {
            setLoadingAction(null);
        }
    };

    const profileOptions = audit?.options?.assignableProfiles || [];
    const villageOptions = audit?.options?.locationVillages || [];
    const readiness = audit?.readiness;
    const security = audit?.security;
    const securityRows = security?.rows || [];
    const householdReadyPercent = readiness?.household?.totalResidents
        ? Math.max(0, Math.round(
            ((readiness.household.totalResidents
                - readiness.household.residentsMissingNid
                - readiness.household.residentsMissingBirth
                - readiness.household.residentsMissingBlood)
                / (readiness.household.totalResidents * 3)) * 100
        ))
        : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
                    <Database size={160} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-widest mb-2">
                        <Zap size={14} /> System Maintenance
                    </div>
                    <h1 className="text-3xl font-black text-slate-800">সিস্টেম টুলস ও ডাটা ম্যানেজমেন্ট</h1>
                    <p className="text-slate-500 font-bold mt-2">এখান থেকে আপনি সিস্টেমের টেস্টিং ডাটা জেনারেট এবং ক্লিন করতে পারবেন।</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<MapPin />} label="ইউনিয়ন" value={stats?.unions} color="indigo" />
                <StatCard icon={<MapPin />} label="ওয়ার্ড" value={stats?.wards} color="teal" />
                <StatCard icon={<Home />} label="গ্রাম" value={stats?.villages} color="blue" />
                <StatCard icon={<Users />} label="ইউজার" value={stats?.users} color="amber" />
            </div>

            <section className="bg-slate-950 rounded-[36px] p-6 md:p-8 text-white shadow-xl shadow-slate-200/60">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-teal-300 font-black text-xs uppercase tracking-widest mb-2">
                            <Gauge size={14} /> Production Readiness
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black">System readiness এক জায়গায়</h2>
                        <p className="mt-2 text-sm font-bold text-slate-400">Household, SMS business, citizen workload ও institution portal gap এখানে দেখা যাবে।</p>
                    </div>
                    <span className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest ${
                        readiness?.status === 'ready' ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-400/15 text-amber-200'
                    }`}>
                        {readiness?.status === 'ready' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                        {readiness?.status === 'ready' ? 'SQL Ready' : 'SQL check needed'}
                    </span>
                </div>

                {readiness?.sqlErrors?.length > 0 && (
                    <div className="mb-6 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm font-bold text-amber-100">
                        {readiness.sqlErrors.slice(0, 2).join(' | ')}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <ReadinessCard
                        icon={<Home />}
                        title="Household Data"
                        main={`${householdReadyPercent}%`}
                        note={`${readiness?.household?.totalHouseholds || 0} homes, ${readiness?.household?.totalResidents || 0} residents`}
                        items={[
                            ['NID missing', readiness?.household?.residentsMissingNid],
                            ['Birth missing', readiness?.household?.residentsMissingBirth],
                            ['Blood missing', readiness?.household?.residentsMissingBlood],
                            ['GPS missing', readiness?.household?.householdsMissingGps]
                        ]}
                    />
                    <ReadinessCard
                        icon={<MessageSquare />}
                        title="SMS Business"
                        main={readiness?.smsBusiness?.wallets || 0}
                        note="wallets active / rechargeable"
                        items={[
                            ['Active gateways', readiness?.smsBusiness?.activeGateways],
                            ['Low balance', readiness?.smsBusiness?.lowBalanceWallets],
                            ['Queued', readiness?.smsBusiness?.queuedMessages],
                            ['Failed', readiness?.smsBusiness?.failedMessages],
                            ['Pending recharge', readiness?.smsBusiness?.pendingRechargeRequests]
                        ]}
                    />
                    <ReadinessCard
                        icon={<ClipboardList />}
                        title="Citizen Workload"
                        main={(readiness?.citizenWorkload?.openComplaints || 0) + (readiness?.citizenWorkload?.openAppointments || 0) + (readiness?.citizenWorkload?.openLifeSupportCases || 0)}
                        note="open items needing officer action"
                        items={[
                            ['Complaints', readiness?.citizenWorkload?.openComplaints],
                            ['Appointments', readiness?.citizenWorkload?.openAppointments],
                            ['Life support', readiness?.citizenWorkload?.openLifeSupportCases],
                            ['Service requests', readiness?.household?.servicePendingRows]
                        ]}
                    />
                    <ReadinessCard
                        icon={<Building2 />}
                        title="Institution Portal"
                        main={readiness?.institution?.institutions || 0}
                        note="schools, colleges, madrasa portals"
                        items={[
                            ['Web pages', readiness?.institution?.websitePages],
                            ['Classes', readiness?.institution?.classes],
                            ['Students', readiness?.institution?.students],
                            ['Lessons', readiness?.institution?.lessons]
                        ]}
                    />
                </div>
            </section>

            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-6 md:flex-row md:items-center md:justify-between md:p-8">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700">
                            <ShieldAlert size={14} /> Role & RLS Security
                        </div>
                        <h2 className="text-2xl font-black text-slate-800">Database access isolation</h2>
                        <p className="mt-2 text-sm font-bold text-slate-500">
                            Critical table-গুলোর RLS, policy এবং unsafe access এক জায়গায় যাচাই করুন।
                        </p>
                    </div>
                    {!security?.setupRequired && !security?.error && (
                        <div className="flex shrink-0 gap-3">
                            <SecurityCount
                                label="Ready"
                                value={security?.readyCount || 0}
                                tone="emerald"
                            />
                            <SecurityCount
                                label="Needs review"
                                value={security?.unsafeCount || 0}
                                tone={security?.unsafeCount > 0 ? 'rose' : 'slate'}
                            />
                        </div>
                    )}
                </div>

                {security?.setupRequired ? (
                    <div className="m-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 md:m-8">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={20} />
                            <div>
                                <h3 className="font-black text-amber-950">Security audit migration চালানো বাকি</h3>
                                <p className="mt-1 text-sm font-bold leading-6 text-amber-800">
                                    Supabase SQL Editor-এ <code className="rounded bg-amber-100 px-1.5 py-1">database/63_role_rls_security_audit.sql</code> চালান।
                                </p>
                            </div>
                        </div>
                    </div>
                ) : security?.error ? (
                    <div className="m-6 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm font-bold text-rose-800 md:m-8">
                        {security.error}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[720px] w-full text-left">
                            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 md:px-8">Table</th>
                                    <th className="px-6 py-4">RLS</th>
                                    <th className="px-6 py-4">Policies</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 md:pr-8">Finding</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {securityRows.map((row) => (
                                    <tr key={row.table_name} className="text-sm font-bold text-slate-700">
                                        <td className="px-6 py-4 font-black text-slate-900 md:px-8">{row.table_name}</td>
                                        <td className="px-6 py-4">{row.rls_enabled ? 'Enabled' : 'Disabled'}</td>
                                        <td className="px-6 py-4">{row.policy_count ?? 0}</td>
                                        <td className="px-6 py-4">
                                            <SecurityStatus status={row.status} />
                                        </td>
                                        <td className="max-w-md px-6 py-4 text-slate-500 md:pr-8">
                                            {row.finding || 'No unsafe policy detected'}
                                        </td>
                                    </tr>
                                ))}
                                {securityRows.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-sm font-bold text-slate-500">
                                            কোনো security audit row পাওয়া যায়নি।
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-teal-600 font-black text-xs uppercase tracking-widest mb-2">
                            <GitBranch size={14} /> Migration Health
                        </div>
                        <h2 className="text-2xl font-black text-slate-800">নতুন data flow-তে যেগুলো এখনও বাকি</h2>
                        <p className="text-sm font-bold text-slate-500 mt-2">
                            সবগুলো শূন্য হলে household, locker, আর volunteer flow পুরোপুরি নতুন model-এ আছে।
                        </p>
                    </div>
                    <button
                        onClick={loadStats}
                        className="shrink-0 p-3 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        aria-label="Refresh migration audit"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>

                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => handleAction('repair_migration_links')}
                        disabled={loadingAction !== null}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
                    >
                        {loadingAction === 'repair_migration_links' ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        নিরাপদ repair চালান
                    </button>
                    <p className="text-xs font-bold text-slate-500">
                        শুধু village mapping আর নিশ্চিত creator match ঠিক করবে; সন্দেহজনক data নিজে থেকে বদলাবে না।
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AuditCard
                        label="পুরনো volunteer row"
                        value={audit?.legacyVolunteerRows}
                        note="profiles table-এ migrate করার পর এগুলো আর নতুন flow-তে দরকার নেই"
                    />
                    <AuditCard
                        label="গ্রাম mapping বাকি household"
                        value={audit?.householdsMissingLocationVillage}
                        note="volunteer village-scope security ঠিক রাখতে এগুলো map হওয়া দরকার"
                    />
                    <AuditCard
                        label="পুরনো volunteer link-সহ household"
                        value={audit?.householdsUsingLegacyVolunteer}
                        note="এগুলোতে এখনও added_by_volunteer_id আছে"
                    />
                    <AuditCard
                        label="creator profile link ছাড়া household"
                        value={audit?.householdsMissingCreator}
                        note="added_by_user_id না থাকলে audit trail অসম্পূর্ণ থাকে"
                    />
                    <AuditCard
                        label="private path ছাড়া locker document"
                        value={audit?.documentsMissingPrivatePath}
                        note="এগুলো এখনও পুরনো public-file model-এ আছে"
                    />
                    <AuditCard
                        label="village scope ছাড়া volunteer"
                        value={audit?.volunteersWithoutVillageScope}
                        note="volunteer-এর scope অবশ্যই নির্দিষ্ট village হওয়া উচিত"
                    />
                </div>

                <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <AuditDetailPanel
                        title="গ্রাম mapping বাকি household"
                        rows={audit?.details?.missingVillageHouseholds}
                        emptyText="সব household-এ location village mapping আছে।"
                        renderRow={(row) => (
                            <HouseholdAuditRow
                                key={row.id}
                                row={row}
                                subtitle={`${row.village?.bn_name || row.village?.name || 'গ্রাম অজানা'} | ${row.ward?.name_bn || 'ওয়ার্ড অজানা'}`}
                            >
                                <InlineSelect
                                    value={selection[`village-${row.id}`] || ''}
                                    onChange={(value) => setSelection((current) => ({ ...current, [`village-${row.id}`]: value }))}
                                    options={villageOptions.filter((village) => village.parent_id === row.ward_id)}
                                    getLabel={(item) => item.name_bn || item.name_en}
                                    placeholder="গ্রাম বাছুন"
                                />
                                <InlineAction
                                    label="সেট"
                                    disabled={!selection[`village-${row.id}`] || loadingAction !== null}
                                    loading={loadingAction === `village-${row.id}`}
                                    onClick={() => handleManualFix(
                                        'assign_household_location_village',
                                        { householdId: row.id, villageId: selection[`village-${row.id}`] },
                                        `village-${row.id}`
                                    )}
                                />
                            </HouseholdAuditRow>
                        )}
                    />
                    <AuditDetailPanel
                        title="creator link ছাড়া household"
                        rows={audit?.details?.missingCreatorHouseholds}
                        emptyText="সব household-এ creator profile link আছে।"
                        renderRow={(row) => (
                            <HouseholdAuditRow
                                key={row.id}
                                row={row}
                                subtitle={row.village?.bn_name || row.village?.name || 'গ্রাম অজানা'}
                            >
                                <InlineSelect
                                    value={selection[`creator-${row.id}`] || ''}
                                    onChange={(value) => setSelection((current) => ({ ...current, [`creator-${row.id}`]: value }))}
                                    options={profileOptions}
                                    getLabel={(item) => `${`${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email || item.phone} (${item.role})`}
                                    placeholder="creator বাছুন"
                                />
                                <InlineAction
                                    label="লিংক"
                                    disabled={!selection[`creator-${row.id}`] || loadingAction !== null}
                                    loading={loadingAction === `creator-${row.id}`}
                                    onClick={() => handleManualFix(
                                        'assign_household_creator',
                                        { householdId: row.id, profileId: selection[`creator-${row.id}`] },
                                        `creator-${row.id}`
                                    )}
                                />
                            </HouseholdAuditRow>
                        )}
                    />
                    <AuditDetailPanel
                        title="পুরনো volunteer link-সহ household"
                        rows={audit?.details?.legacyLinkedHouseholds}
                        emptyText="পুরনো volunteer link আর নেই।"
                        renderRow={(row) => (
                            <HouseholdAuditRow
                                key={row.id}
                                row={row}
                                subtitle={`legacy id: ${row.added_by_volunteer_id}`}
                            >
                                <InlineSelect
                                    value={selection[`legacy-${row.id}`] || ''}
                                    onChange={(value) => setSelection((current) => ({ ...current, [`legacy-${row.id}`]: value }))}
                                    options={profileOptions.filter((profile) => profile.role === 'volunteer')}
                                    getLabel={(item) => `${`${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email || item.phone}`}
                                    placeholder="নতুন volunteer"
                                />
                                <InlineAction
                                    label="লিংক"
                                    disabled={!selection[`legacy-${row.id}`] || loadingAction !== null}
                                    loading={loadingAction === `legacy-${row.id}`}
                                    onClick={() => handleManualFix(
                                        'assign_household_creator',
                                        { householdId: row.id, profileId: selection[`legacy-${row.id}`] },
                                        `legacy-${row.id}`
                                    )}
                                />
                            </HouseholdAuditRow>
                        )}
                    />
                    <AuditDetailPanel
                        title="private path ছাড়া locker document"
                        rows={audit?.details?.documentsMissingPrivatePath}
                        emptyText="সব document private path-এ migrated।"
                        renderRow={(row) => (
                            <div key={row.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-slate-700">{row.title || row.type || 'নথি'}</p>
                                    <p className="truncate text-xs font-bold text-slate-400">
                                        {row.household?.owner_name || 'household অজানা'} | {row.household?.house_no || 'নং নেই'}
                                    </p>
                                </div>
                                <label className="shrink-0">
                                    <input
                                        type="file"
                                        className="hidden"
                                        disabled={loadingAction !== null}
                                        onChange={(event) => handleDocumentMigration(row.id, event.target.files?.[0])}
                                    />
                                    <span className="inline-flex cursor-pointer items-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white transition-colors hover:bg-teal-700">
                                        {loadingAction === `document-${row.id}` ? <Loader2 size={14} className="animate-spin" /> : 're-upload'}
                                    </span>
                                </label>
                            </div>
                        )}
                    />
                    <AuditDetailPanel
                        title="village scope ছাড়া volunteer"
                        rows={audit?.details?.volunteersWithoutVillageScope}
                        emptyText="সব volunteer নির্দিষ্ট village-এ assigned।"
                        renderRow={(row) => (
                            <div key={row.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="truncate text-sm font-black text-slate-700">
                                    {`${row.first_name || ''} ${row.last_name || ''}`.trim() || row.email || row.phone || row.id}
                                </p>
                                <p className="text-xs font-bold text-slate-400">
                                    {row.phone || row.email || 'যোগাযোগ নেই'} | {row.access_scope_id ? `scope: ${row.access_scope_id}` : 'scope দেওয়া নেই'}
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <InlineSelect
                                        value={selection[`scope-${row.id}`] || ''}
                                        onChange={(value) => setSelection((current) => ({ ...current, [`scope-${row.id}`]: value }))}
                                        options={villageOptions}
                                        getLabel={(item) => item.name_bn || item.name_en}
                                        placeholder="গ্রাম বাছুন"
                                    />
                                    <InlineAction
                                        label="assign"
                                        disabled={!selection[`scope-${row.id}`] || loadingAction !== null}
                                        loading={loadingAction === `scope-${row.id}`}
                                        onClick={() => handleManualFix(
                                            'assign_volunteer_scope',
                                            { profileId: row.id, villageId: selection[`scope-${row.id}`] },
                                            `scope-${row.id}`
                                        )}
                                    />
                                </div>
                            </div>
                        )}
                    />
                </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <LaunchChecklistCard
                    title="Role Permission Test"
                    tone="teal"
                    items={[
                        'Ward member: own ward household add/edit/delete',
                        'Ward member: other ward edit blocked',
                        'Volunteer: own village edit allowed',
                        'Volunteer: other village edit blocked',
                        'Chairman: read/process application, household edit blocked'
                    ]}
                />
                <LaunchChecklistCard
                    title="SMS Business Test"
                    tone="amber"
                    items={[
                        'Active gateway configured',
                        'Recharge request submitted and approved',
                        'Queued SMS processed by /api/sms/process',
                        'Failed SMS visible in report',
                        'Low balance wallet follow-up visible'
                    ]}
                />
                <LaunchChecklistCard
                    title="Mobile Field Test"
                    tone="indigo"
                    items={[
                        'Household form fits mobile viewport',
                        'GPS capture works on phone',
                        'Document/photo upload works',
                        'Citizen inbox OTP works',
                        'Portal menus usable with thumb navigation'
                    ]}
                />
            </section>

            <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-6 border-b border-slate-100 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600">
                            <Database size={15} /> Demo Data Lab
                        </div>
                        <h2 className="mt-3 text-2xl font-black text-slate-900 md:text-3xl">এক click-এ পুরো system test করুন</h2>
                        <p className="mt-2 max-w-3xl text-sm font-bold leading-7 text-slate-500">
                            Household, citizen service, market, lost-found, business, school, SMS এবং governance module-এ linked sample data তৈরি হবে।
                            Cleanup শুধু registry-তে থাকা generated row মুছবে।
                        </p>
                    </div>
                    <span className={`w-fit rounded-full px-4 py-2 text-xs font-black ${
                        demoStatus?.activeBatch ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                        {demoStatus?.activeBatch ? 'Demo active' : 'No active demo'}
                    </span>
                </div>

                {demoStatus?.setupRequired && (
                    <div className="m-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-black text-amber-800">
                        প্রথমে Supabase SQL Editor-এ <code>database/73_demo_data_registry.sql</code> চালান।
                    </div>
                )}

                {demoStatus?.activeBatch && (
                    <div className="m-6 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-black text-emerald-900">{demoStatus.activeBatch.batch_key}</p>
                                <p className="mt-1 text-xs font-bold text-emerald-700">
                                    মোট {demoStatus.activeBatch.summary?.created || 0}টি demo row · Test phone: {demoStatus.activeBatch.summary?.demoPhone || '01700009999'}
                                </p>
                            </div>
                            <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">
                                {demoStatus.activeBatch.status}
                            </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {Object.entries(demoStatus.activeBatch.summary?.modules || {}).map(([key, item]) => (
                                <span key={key} title={item.reason || ''} className={`rounded-full px-3 py-1.5 text-[10px] font-black ${
                                    item.status === 'created' || item.status === 'ready'
                                        ? 'bg-white text-emerald-700'
                                        : item.status === 'skipped'
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-rose-100 text-rose-700'
                                }`}>
                                    {key}: {item.count ?? item.status}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
                    <button
                        type="button"
                        onClick={() => handleDemoAction('seed')}
                        disabled={loadingAction !== null || demoStatus?.setupRequired || Boolean(demoStatus?.activeBatch)}
                        className="flex min-h-28 items-center justify-between gap-4 rounded-3xl bg-indigo-600 p-5 text-left text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        <div>
                            <p className="text-lg font-black">সব Demo Data যোগ করুন</p>
                            <p className="mt-1 text-xs font-bold text-indigo-100">সব প্রধান functionality-র linked sample content</p>
                        </div>
                        {loadingAction === 'demo-seed' ? <Loader2 className="animate-spin" /> : <Zap size={25} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDemoAction('reset')}
                        disabled={loadingAction !== null || demoStatus?.setupRequired}
                        className="flex min-h-28 items-center justify-between gap-4 rounded-3xl border-2 border-teal-200 bg-teal-50 p-5 text-left text-teal-800 transition hover:border-teal-300 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        <div>
                            <p className="text-lg font-black">Reset করে Demo দিন</p>
                            <p className="mt-1 text-xs font-bold text-teal-600">Active demo থাকলে remove, তারপর নতুন demo seed</p>
                        </div>
                        {loadingAction === 'demo-reset' ? <Loader2 className="animate-spin" /> : <RefreshCw size={25} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDemoAction('remove')}
                        disabled={loadingAction !== null || !demoStatus?.activeBatch}
                        className="flex min-h-28 items-center justify-between gap-4 rounded-3xl border-2 border-rose-200 bg-rose-50 p-5 text-left text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        <div>
                            <p className="text-lg font-black">সব Demo Data Remove করুন</p>
                            <p className="mt-1 text-xs font-bold text-rose-500">Real data untouched, exact registered rows only</p>
                        </div>
                        {loadingAction === 'demo-remove' ? <Loader2 className="animate-spin" /> : <Trash2 size={25} />}
                    </button>
                </div>
                {!demoStatus?.activeBatch && !demoStatus?.setupRequired && (
                    <p className="-mt-4 px-8 pb-8 text-xs font-bold text-slate-500">
                        Remove button disabled থাকলে active registered demo নেই। নতুন demo দিতে “Reset করে Demo দিন” বা “সব Demo Data যোগ করুন” ব্যবহার করুন।
                    </p>
                )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Seed Tool */}
                <section className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Database size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">টেস্ট ডাটা জেনারেশন</h3>
                            <p className="text-sm font-bold text-slate-400 mt-1">পূর্ণাঙ্গ হাইয়ারার্কি এবং হাউসহোল্ড ডাটা তৈরি করুন</p>
                        </div>
                    </div>

                    <ul className="space-y-4 mb-10 flex-1">
                        <FeatureItem text="৪টি স্যাম্পল ইউনিয়ন তৈরি" />
                        <FeatureItem text="প্রতি ইউনিয়নে ৬টি করে ওয়ার্ড (২৪টি)" />
                        <FeatureItem text="প্রতি ওয়ার্ডে ২টি করে গ্রাম (৪৮টি)" />
                        <FeatureItem text="প্রতি গ্রামে ৫০টি হাউসহোল্ড (২৪০০টি)" />
                        <FeatureItem text="প্রতি হাউসহোল্ডে ৩ জন পর্যন্ত সদস্য" />
                    </ul>

                    <button 
                        onClick={() => handleAction('seed')}
                        disabled={loadingAction !== null}
                        className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:grayscale"
                    >
                        {loadingAction === 'seed' ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                        জেনারেট করুন (Seed)
                    </button>
                </section>

                {/* Wipe Tool */}
                <section className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-600">
                            <Trash2 size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Full Reset</h3>
                            <p className="text-sm font-bold text-slate-400 mt-1">শুধু super admin রেখে সব data delete করুন</p>
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-rose-50 border border-rose-100 text-rose-700 mb-10 flex-1">
                        <div className="flex gap-3">
                            <AlertTriangle className="shrink-0" size={20} />
                            <div>
                                <p className="font-black text-sm uppercase mb-1">সতর্কবাণী</p>
                                <p className="text-xs font-bold leading-relaxed opacity-80">
                                    এটি চালালে union, ward, gram, household, resident, institution, school/college/madrasha, citizen request, SMS, market, donation, lost-found সহ application data delete হবে। শুধু super admin auth/profile থাকবে। এটি undo করা যাবে না।
                                </p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => handleAction('wipe')}
                        disabled={loadingAction !== null}
                        className="w-full py-5 border-2 border-rose-200 text-rose-600 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
                    >
                        {loadingAction === 'wipe' ? <Loader2 className="animate-spin" /> : <Trash2 size={20} />}
                        সব Data Delete করুন
                    </button>
                </section>
            </div>

            {/* Additional Tools */}
            <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden">
                <div className="absolute bottom-0 right-0 p-10 opacity-10">
                    <RefreshCw size={120} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <div>
                        <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                            <Download className="text-indigo-400" /> এক্সপোর্ট ও ব্যাকআপ
                        </h3>
                        <p className="text-slate-400 font-bold mb-8 leading-relaxed">
                            সিস্টেমের বর্তমান ডাটাবেজ স্টেট একটি JSON ফাইল হিসেবে এক্সপোর্ট করে রাখুন। পরবর্তীতে এটি রিস্টোর করতে ব্যবহার করা যাবে।
                        </p>
                        <button className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black transition-all flex items-center gap-3 border border-white/10">
                            ব্যাকআপ ফাইল ডাউনলোড করুন
                        </button>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <Upload size={20} />
                                </div>
                                <h4 className="font-black">রিস্টোর ডাটা</h4>
                            </div>
                            <p className="text-xs font-bold text-slate-500 mb-4">আগে থেকে সেভ করা ব্যাকআপ ফাইল আপলোড করুন</p>
                            <button className="w-full py-3 rounded-xl bg-indigo-600 text-sm font-black hover:bg-indigo-700 transition-all">ফাইল সিলেক্ট করুন</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    const colors = {
        indigo: 'text-indigo-600 bg-indigo-50',
        teal: 'text-teal-600 bg-teal-50',
        blue: 'text-blue-600 bg-blue-50',
        amber: 'text-amber-600 bg-amber-50'
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
                {icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{value || 0}</p>
        </div>
    );
}

function FeatureItem({ text }) {
    return (
        <li className="flex items-center gap-3 text-slate-600 font-bold text-sm">
            <CheckCircle2 size={16} className="text-emerald-500" />
            {text}
        </li>
    );
}

function ReadinessCard({ icon, title, main, note, items = [] }) {
    return (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-lg shadow-black/10">
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-black text-white">{title}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">{note}</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-200">
                    {icon}
                </div>
            </div>
            <p className="mb-5 text-4xl font-black text-teal-200">{main}</p>
            <div className="space-y-2">
                {items.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.05] px-3 py-2">
                        <span className="text-xs font-bold text-slate-400">{label}</span>
                        <span className="text-sm font-black text-white">{value || 0}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SecurityCount({ label, value, tone }) {
    const tones = {
        emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
        rose: 'border-rose-100 bg-rose-50 text-rose-700',
        slate: 'border-slate-200 bg-slate-50 text-slate-600'
    };

    return (
        <div className={`min-w-24 rounded-2xl border px-4 py-3 text-center ${tones[tone] || tones.slate}`}>
            <p className="text-2xl font-black">{value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
        </div>
    );
}

function SecurityStatus({ status }) {
    const states = {
        ok: {
            label: 'Ready',
            className: 'bg-emerald-50 text-emerald-700'
        },
        rls_disabled: {
            label: 'RLS off',
            className: 'bg-rose-50 text-rose-700'
        },
        no_policy: {
            label: 'No policy',
            className: 'bg-amber-50 text-amber-700'
        },
        unsafe_policy: {
            label: 'Unsafe',
            className: 'bg-rose-50 text-rose-700'
        },
        missing_table: {
            label: 'Missing',
            className: 'bg-slate-100 text-slate-600'
        }
    };
    const state = states[status] || {
        label: status || 'Review',
        className: 'bg-slate-100 text-slate-600'
    };

    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${state.className}`}>
            {state.label}
        </span>
    );
}

function LaunchChecklistCard({ title, items = [], tone = 'teal' }) {
    const tones = {
        teal: 'border-teal-100 bg-teal-50/70 text-teal-700',
        amber: 'border-amber-100 bg-amber-50/70 text-amber-700',
        indigo: 'border-indigo-100 bg-indigo-50/70 text-indigo-700'
    };

    return (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className={`mb-5 inline-flex rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-widest ${tones[tone] || tones.teal}`}>
                Launch Gate
            </div>
            <h3 className="mb-4 text-xl font-black text-slate-900">{title}</h3>
            <div className="space-y-3">
                {items.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                        <p className="text-sm font-bold text-slate-600">{item}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AuditCard({ label, value, note }) {
    const count = value || 0;
    const healthy = count === 0;

    return (
        <div className={`rounded-3xl border p-5 ${healthy ? 'border-emerald-100 bg-emerald-50/60' : 'border-amber-100 bg-amber-50/70'}`}>
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-slate-700">{label}</p>
                {healthy ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                ) : (
                    <FileWarning size={18} className="text-amber-600" />
                )}
            </div>
            <p className={`text-3xl font-black mt-4 ${healthy ? 'text-emerald-700' : 'text-amber-700'}`}>{count}</p>
            <p className="text-xs font-bold text-slate-500 mt-3 leading-relaxed">{note}</p>
        </div>
    );
}

function AuditDetailPanel({ title, rows = [], emptyText, renderRow }) {
    return (
        <div className="rounded-3xl border border-slate-200 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-800">{title}</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500">
                    সর্বোচ্চ ১০টি
                </span>
            </div>
            <div className="space-y-3">
                {rows?.length ? rows.map(renderRow) : (
                    <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
                        {emptyText}
                    </p>
                )}
            </div>
        </div>
    );
}

function HouseholdAuditRow({ row, subtitle, children }) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-700">
                        {row.owner_name || 'নাম নেই'} | {row.house_no || 'নং নেই'}
                    </p>
                    <p className="truncate text-xs font-bold text-slate-400">{subtitle}</p>
                </div>
                <Link
                    href={`/h/${row.id}`}
                    className="shrink-0 rounded-xl bg-white p-2 text-slate-500 shadow-sm transition-colors hover:text-teal-600"
                    aria-label="Open household"
                >
                    <ExternalLink size={16} />
                </Link>
            </div>
            {children && <div className="mt-3 flex gap-2">{children}</div>}
        </div>
    );
}

function InlineSelect({ value, onChange, options, getLabel, placeholder }) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-teal-500"
        >
            <option value="">{placeholder}</option>
            {options.map((option) => (
                <option key={option.id} value={option.id}>
                    {getLabel(option)}
                </option>
            ))}
        </select>
    );
}

function InlineAction({ label, disabled, loading, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : label}
        </button>
    );
}

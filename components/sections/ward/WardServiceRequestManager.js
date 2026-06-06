'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
    CalendarDays,
    Clock,
    ExternalLink,
    FileText,
    Loader2,
    MapPin,
    Phone,
    Search,
    User,
    X
} from 'lucide-react';
import { householdService } from '@/lib/services/householdService';
import { toBnDigits } from '@/lib/utils/format';
import { getServiceSla } from '@/lib/utils/serviceSla';

const STATUS_LABELS = {
    pending: 'অপেক্ষমাণ',
    processing: 'প্রক্রিয়াধীন',
    ready: 'প্রস্তুত',
    completed: 'সম্পন্ন',
    rejected: 'বাতিল'
};

const STATUS_STYLES = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    processing: 'bg-sky-50 text-sky-700 ring-sky-200',
    ready: 'bg-teal-50 text-teal-700 ring-teal-200',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 ring-rose-200'
};

const REQUEST_LABELS = {
    birth_registration: 'জন্ম নিবন্ধন',
    death_certificate: 'মৃত্যু সনদ',
    utility_request: 'ইউটিলিটি সেবা'
};

function formatDate(value) {
    if (!value) return 'তারিখ নেই';
    return toBnDigits(new Date(value).toLocaleDateString('bn-BD'));
}

function getSearchText(request) {
    return [
        request.id,
        request.applicant_name,
        request.contact_phone,
        request.request_type,
        request.household?.owner_name,
        request.household?.house_no,
        request.household?.village?.bn_name
    ].filter(Boolean).join(' ').toLowerCase();
}

export default function WardServiceRequestManager({ wardId }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedRequest, setSelectedRequest] = useState(null);

    useEffect(() => {
        let active = true;

        async function loadRequests() {
            try {
                setLoading(true);
                const data = await householdService.getServiceRequestsByWard(wardId);
                if (active) setRequests(data || []);
            } catch (err) {
                console.error('Failed to load ward service requests:', err);
            } finally {
                if (active) setLoading(false);
            }
        }

        loadRequests();

        return () => {
            active = false;
        };
    }, [wardId]);

    const counts = useMemo(() => {
        return requests.reduce((summary, request) => {
            summary.total += 1;
            summary[request.status] = (summary[request.status] || 0) + 1;
            return summary;
        }, { total: 0 });
    }, [requests]);

    const filteredRequests = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return requests.filter((request) => {
            const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
            const matchesSearch = !term || getSearchText(request).includes(term);
            return matchesStatus && matchesSearch;
        });
    }, [requests, searchTerm, statusFilter]);

    if (loading) {
        return (
            <div className="py-20 text-center">
                <Loader2 className="mx-auto animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] bg-gradient-to-br from-slate-950 to-teal-900 p-5 text-white shadow-xl shadow-teal-900/10 sm:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-200">Ward Service Desk</p>
                        <h3 className="mt-3 text-2xl font-black sm:text-3xl">এই ওয়ার্ডের আবেদনসমূহ</h3>
                        <p className="mt-2 max-w-2xl text-sm font-bold text-slate-300">
                            আপনার ওয়ার্ডের গ্রাম থেকে জমা হওয়া আবেদন এখানে দেখা যাবে। অনুমোদন ও প্রসেসিং ইউনিয়ন প্যানেল থেকে হবে।
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <CountPill label="মোট" value={counts.total} />
                        <CountPill label="চলমান" value={(counts.pending || 0) + (counts.processing || 0)} />
                        <CountPill label="প্রস্তুত" value={counts.ready || 0} />
                        <CountPill label="সম্পন্ন" value={counts.completed || 0} />
                    </div>
                </div>
            </div>

            <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[1fr_auto] sm:p-4">
                <label className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <Search size={18} className="text-slate-400" />
                    <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
                        placeholder="নাম, মোবাইল, গ্রাম, tracking ID দিয়ে খুঁজুন..."
                    />
                </label>
                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none focus:border-teal-400"
                >
                    <option value="all">সব অবস্থা</option>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            {filteredRequests.length === 0 ? (
                <div className="rounded-[32px] border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                    <Clock className="mx-auto mb-4 text-slate-300" size={42} />
                    <p className="font-bold text-slate-400">এই filter-এ কোনো আবেদন পাওয়া যায়নি।</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredRequests.map((request) => {
                        const sla = getServiceSla(request);
                        return (
                        <button
                            type="button"
                            key={request.id}
                            onClick={() => setSelectedRequest(request)}
                            className="group rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/5 sm:p-6"
                        >
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                                    <FileText size={22} />
                                </div>
                                <span className={`rounded-full px-3 py-1 text-[10px] font-black ring-1 ${STATUS_STYLES[request.status] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                                    {STATUS_LABELS[request.status] || request.status}
                                </span>
                            </div>

                            <h4 className="text-lg font-black text-slate-800">
                                {REQUEST_LABELS[request.request_type] || request.request_type}
                            </h4>
                            <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-[10px] font-black ${
                                sla.state === 'overdue'
                                    ? 'bg-rose-50 text-rose-700'
                                    : sla.state === 'due_soon'
                                        ? 'bg-amber-50 text-amber-700'
                                        : 'bg-teal-50 text-teal-700'
                            }`}>
                                {sla.state === 'overdue'
                                    ? `${toBnDigits(Math.abs(sla.remainingDays))} দিন overdue`
                                    : `${toBnDigits(Math.max(0, sla.remainingDays))} দিন বাকি`}
                            </span>
                            <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-400">ID: {request.id}</p>

                            <div className="mt-4 space-y-2 text-xs font-bold text-slate-500">
                                <p className="flex items-center gap-2">
                                    <User size={14} />
                                    {request.applicant_name || 'নাম নেই'}
                                </p>
                                <p className="flex items-center gap-2">
                                    <Phone size={14} />
                                    {request.contact_phone || 'মোবাইল নেই'}
                                </p>
                                <p className="flex items-center gap-2">
                                    <MapPin size={14} />
                                    {request.household?.village?.bn_name || 'গ্রাম নেই'}, বাড়ি: {toBnDigits(request.household?.house_no || '')}
                                </p>
                                <p className="flex items-center gap-2">
                                    <CalendarDays size={14} />
                                    {formatDate(request.created_at)}
                                </p>
                            </div>

                            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-black text-teal-700">
                                বিস্তারিত দেখুন
                                <ExternalLink size={15} className="transition group-hover:translate-x-1" />
                            </div>
                        </button>
                        );
                    })}
                </div>
            )}

            {selectedRequest && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
                    <div className="max-h-[92dvh] w-full max-w-2xl overflow-hidden rounded-t-[32px] bg-white shadow-2xl sm:rounded-[32px]">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-teal-600">Application Detail</p>
                                <h4 className="mt-1 text-2xl font-black text-slate-900">
                                    {REQUEST_LABELS[selectedRequest.request_type] || selectedRequest.request_type}
                                </h4>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedRequest(null)}
                                className="rounded-2xl bg-slate-100 p-3 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="max-h-[70dvh] space-y-4 overflow-y-auto p-5 sm:p-6">
                            <div className={`inline-flex rounded-full px-4 py-2 text-xs font-black ring-1 ${STATUS_STYLES[selectedRequest.status] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                                {STATUS_LABELS[selectedRequest.status] || selectedRequest.status}
                            </div>
                            <DetailRow label="Tracking ID" value={selectedRequest.id} />
                            <DetailRow label="আবেদনকারী" value={selectedRequest.applicant_name || 'নাম নেই'} />
                            <DetailRow label="মোবাইল" value={selectedRequest.contact_phone || 'মোবাইল নেই'} />
                            <DetailRow label="গ্রাম/বাড়ি" value={`${selectedRequest.household?.village?.bn_name || 'গ্রাম নেই'} · ${selectedRequest.household?.house_no || 'বাড়ি নেই'}`} />
                            <DetailRow label="জমার তারিখ" value={formatDate(selectedRequest.created_at)} />
                            <DetailRow label="সংগ্রহের তারিখ" value={formatDate(selectedRequest.collection_date)} />
                            {selectedRequest.feedback && <DetailRow label="অফিস নোট" value={selectedRequest.feedback} />}

                            <Link
                                href={`/track/${selectedRequest.id}`}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-teal-700"
                            >
                                Citizen tracking page খুলুন
                                <ExternalLink size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CountPill({ label, value }) {
    return (
        <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{label}</p>
            <p className="mt-1 text-xl font-black text-white">{toBnDigits(value || 0)}</p>
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-1 break-words text-sm font-black text-slate-800">{value || 'তথ্য নেই'}</p>
        </div>
    );
}

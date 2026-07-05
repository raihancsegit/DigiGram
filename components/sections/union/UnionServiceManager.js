'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, CheckCircle, XCircle, Clock, Calendar,
    User, MapPin, Search, Loader2, ChevronRight, Save, PackageCheck, ExternalLink
} from 'lucide-react';
import { householdService } from '@/lib/services/householdService';
import { toBnDigits } from '@/lib/utils/format';
import { getServiceSla } from '@/lib/utils/serviceSla';

const SERVICE_LABELS = {
    birth_registration: 'জন্ম নিবন্ধন',
    death_certificate: 'মৃত্যু সনদ',
    warish_certificate: 'ওয়ারিশ সনদ',
    utility_request: 'ইউটিলিটি সেবা'
};

export default function UnionServiceManager({ unionId }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionForm, setActionForm] = useState({ status: '', collection_date: '', feedback: '' });
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');

    const loadRequests = useCallback(async () => {
        try {
            setLoading(true);
            const data = await householdService.getServiceRequestsByUnion(unionId);
            setRequests(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [unionId]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    async function handleAction() {
        setSaving(true);
        try {
            await householdService.updateRequestStatus(
                selectedRequest.id,
                actionForm.status,
                actionForm.collection_date,
                actionForm.feedback,
                unionId
            );
            setSelectedRequest(null);
            setActionForm({ status: '', collection_date: '', feedback: '' });
            await loadRequests();
        } catch (err) {
            alert("আপডেট করতে সমস্যা হয়েছে।");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-teal-600" /></div>;

    const filteredRequests = requests.filter((request) => {
        const statusMatches = statusFilter === 'all'
            || (statusFilter === 'active' && ['pending', 'processing', 'ready'].includes(request.status))
            || request.status === statusFilter;
        if (!statusMatches) return false;

        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return true;

        return [
            request.id,
            request.applicant_name,
            request.contact_phone,
            request.request_type,
            request.household?.house_no,
            request.household?.owner_name,
            request.household?.village?.bn_name
        ].filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword));
    });

    const statusCounts = requests.reduce((acc, request) => {
        acc[request.status] = (acc[request.status] || 0) + 1;
        return acc;
    }, {});

    const getStatusMeta = (status) => ({
        pending: { label: 'পেন্ডিং', className: 'bg-amber-50 text-amber-600' },
        processing: { label: 'প্রক্রিয়াধীন', className: 'bg-blue-50 text-blue-600' },
        ready: { label: 'প্রস্তুত', className: 'bg-emerald-50 text-emerald-600' },
        rejected: { label: 'বাতিল', className: 'bg-rose-50 text-rose-600' }
    }[status] || { label: 'পেন্ডিং', className: 'bg-amber-50 text-amber-600' });

    const getSlaMeta = (request) => {
        const sla = getServiceSla(request);

        if (sla.state === 'closed') return { ...sla, label: 'Closed', className: 'bg-slate-100 text-slate-500' };
        if (sla.state === 'collection_date_needed') return { ...sla, label: 'Collection date needed', className: 'bg-violet-50 text-violet-700' };
        if (sla.state === 'overdue') return { ...sla, label: `${toBnDigits(Math.abs(sla.remainingDays))} days overdue`, className: 'bg-rose-50 text-rose-700' };
        if (sla.state === 'due_soon') return { ...sla, label: 'Due soon', className: 'bg-amber-50 text-amber-700' };
        return { ...sla, label: `${toBnDigits(sla.remainingDays)} days left`, className: 'bg-teal-50 text-teal-700' };
    };

    const slaSummary = requests.reduce((acc, request) => {
        const sla = getSlaMeta(request);
        if (sla.priority >= 4) acc.overdue += 1;
        if (sla.priority === 3) acc.needCollectionDate += 1;
        if (sla.priority === 2) acc.dueSoon += 1;
        return acc;
    }, { overdue: 0, needCollectionDate: 0, dueSoon: 0 });

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
                <h3 className="text-2xl font-black text-slate-800">আগত আবেদনসমূহ</h3>
                <div className="hidden">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input className="pl-11 pr-6 py-2.5 rounded-xl bg-slate-100 border-none text-sm font-bold w-64" placeholder="আবেদনকারী বা আইডি..." />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full rounded-xl border-none bg-slate-100 py-3 pl-11 pr-4 text-sm font-bold"
                        placeholder="Search applicant, phone, house or ID..."
                    />
                </div>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 outline-none focus:border-teal-500">
                    <option value="active">চলমান ({toBnDigits(((statusCounts.pending || 0) + (statusCounts.processing || 0) + (statusCounts.ready || 0)).toString())})</option>
                    <option value="all">সব ({toBnDigits(requests.length.toString())})</option>
                    <option value="pending">Pending ({toBnDigits((statusCounts.pending || 0).toString())})</option>
                    <option value="processing">Processing ({toBnDigits((statusCounts.processing || 0).toString())})</option>
                    <option value="ready">Ready ({toBnDigits((statusCounts.ready || 0).toString())})</option>
                    <option value="completed">Completed ({toBnDigits((statusCounts.completed || 0).toString())})</option>
                    <option value="rejected">Rejected ({toBnDigits((statusCounts.rejected || 0).toString())})</option>
                </select>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-[24px] border border-rose-100 bg-rose-50 p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Overdue SLA</p>
                    <p className="mt-2 text-3xl font-black text-rose-700">{toBnDigits(slaSummary.overdue)}</p>
                    <p className="mt-1 text-xs font-bold text-rose-600">সময় পার হয়ে গেছে, আগে process করুন।</p>
                </div>
                <div className="rounded-[24px] border border-violet-100 bg-violet-50 p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-500">Collection date missing</p>
                    <p className="mt-2 text-3xl font-black text-violet-700">{toBnDigits(slaSummary.needCollectionDate)}</p>
                    <p className="mt-1 text-xs font-bold text-violet-600">Ready আছে কিন্তু user কবে আসবে সেট করা হয়নি।</p>
                </div>
                <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Due soon</p>
                    <p className="mt-2 text-3xl font-black text-amber-700">{toBnDigits(slaSummary.dueSoon)}</p>
                    <p className="mt-1 text-xs font-bold text-amber-600">আজ/আগামীকাল attention দরকার।</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRequests.map(req => {
                    const currentStatus = getStatusMeta(req.status);
                    const slaMeta = getSlaMeta(req);
                    return (
                    <motion.div 
                        key={req.id}
                        layoutId={req.id}
                        onClick={() => {
                            setSelectedRequest(req);
                            setActionForm({
                                status: req.status || '',
                                collection_date: req.collection_date || '',
                                feedback: req.feedback || ''
                            });
                        }}
                        className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all cursor-pointer group"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                                <FileText size={24} />
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${currentStatus.className}`}>{currentStatus.label}</span>
                        </div>
                        <div className={`mb-4 inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${slaMeta.className}`}>
                            SLA: {slaMeta.label}
                        </div>
                        
                        <h4 className="text-xl font-black text-slate-800 mb-2">
                            {SERVICE_LABELS[req.request_type] || req.request_type}
                        </h4>
                        <div className="space-y-2 mb-6">
                            <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                <User size={14} /> {req.applicant_name}
                            </p>
                            <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                <MapPin size={14} /> {req.household?.village?.bn_name}, বাড়ি: {toBnDigits(req.household?.house_no || '')}
                            </p>
                        </div>

                        <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {new Date(req.created_at).toLocaleDateString('bn-BD')} · {toBnDigits(slaMeta.ageDays)} days
                            </span>
                            <Link
                                href={`/track/${req.id}`}
                                onClick={(event) => event.stopPropagation()}
                                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600 transition hover:bg-teal-50 hover:text-teal-700"
                            >
                                Track <ExternalLink size={12} />
                            </Link>
                            <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </motion.div>
                    );
                })}
                
                {filteredRequests.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                        <Clock className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-400 font-bold italic">বর্তমানে কোনো নতুন আবেদন নেই।</p>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-slate-900/60 p-0 backdrop-blur-md sm:items-center sm:p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative h-[100dvh] max-h-[100dvh] w-full overflow-y-auto bg-white p-5 shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-[40px] sm:p-10"
                        >
                            <button onClick={() => setSelectedRequest(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                            
                            <h3 className="text-2xl font-black text-slate-800 mb-8">আবেদন পর্যালোচনা</h3>
                            
                            <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 sm:gap-8 sm:mb-10">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">আবেদনকারীর তথ্য</p>
                                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="font-black text-slate-800">{selectedRequest.applicant_name}</p>
                                        <p className="text-sm font-bold text-slate-500">{toBnDigits(selectedRequest.contact_phone || selectedRequest.applicant_phone || '')}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">আবেদনের বিষয়</p>
                                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="font-black text-slate-800">{SERVICE_LABELS[selectedRequest.request_type] || selectedRequest.request_type}</p>
                                        <p className="text-xs font-bold text-slate-500 italic">পিতা: {selectedRequest.father_name || 'প্রযোজ্য নয়'}</p>
                                    </div>
                                </div>
                            </div>

                            <Link
                                href={`/track/${selectedRequest.id}`}
                                className="mb-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-50 px-5 py-4 text-sm font-black text-teal-700 ring-1 ring-teal-100 transition hover:bg-teal-600 hover:text-white"
                            >
                                Citizen tracking page দেখুন
                                <ExternalLink size={16} />
                            </Link>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                    <button 
                                        onClick={() => setActionForm({...actionForm, status: 'processing'})}
                                        className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${actionForm.status === 'processing' ? 'bg-amber-500 text-white shadow-xl' : 'bg-slate-100 text-slate-500 hover:bg-amber-50'}`}
                                    >
                                        <Clock size={18} /> প্রক্রিয়াধীন
                                    </button>
                                    <button 
                                        onClick={() => setActionForm({...actionForm, status: 'ready'})}
                                        className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${actionForm.status === 'ready' ? 'bg-emerald-600 text-white shadow-xl' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50'}`}
                                    >
                                        <CheckCircle size={18} /> অনুমোদন
                                    </button>
                                    <button 
                                        onClick={() => setActionForm({...actionForm, status: 'rejected'})}
                                        className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${actionForm.status === 'rejected' ? 'bg-rose-600 text-white shadow-xl' : 'bg-slate-100 text-slate-500 hover:bg-rose-50'}`}
                                    >
                                        <XCircle size={18} /> বাতিল করুন
                                    </button>
                                    <button
                                        onClick={() => setActionForm({...actionForm, status: 'completed'})}
                                        className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${actionForm.status === 'completed' ? 'bg-teal-600 text-white shadow-xl' : 'bg-slate-100 text-slate-500 hover:bg-teal-50'}`}
                                    >
                                        <PackageCheck size={18} /> Collected
                                    </button>
                                </div>

                                {actionForm.status === 'ready' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">সনদ সংগ্রহের তারিখ (Collection Date)</label>
                                        <input 
                                            type="date"
                                            value={actionForm.collection_date}
                                            onChange={(e) => setActionForm({...actionForm, collection_date: e.target.value})}
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                                        />
                                    </motion.div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ফিডব্যাক / নোট</label>
                                    <textarea 
                                        value={actionForm.feedback}
                                        onChange={(e) => setActionForm({...actionForm, feedback: e.target.value})}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold min-h-[100px]"
                                        placeholder="ইউজারকে কিছু জানাতে চাইলে লিখুন..."
                                    />
                                </div>

                                <button 
                                    disabled={!actionForm.status || saving}
                                    onClick={handleAction}
                                    className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                    পরিবর্তন সেভ করুন
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

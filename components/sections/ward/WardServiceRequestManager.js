'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Clock, FileText, Loader2, MapPin, User } from 'lucide-react';
import { householdService } from '@/lib/services/householdService';
import { toBnDigits } from '@/lib/utils/format';

const STATUS_LABELS = {
    pending: 'অপেক্ষমাণ',
    processing: 'প্রক্রিয়াধীন',
    ready: 'প্রস্তুত',
    completed: 'সম্পন্ন',
    rejected: 'বাতিল'
};

const REQUEST_LABELS = {
    birth_registration: 'জন্ম নিবন্ধন',
    death_certificate: 'মৃত্যু সনদ',
    utility_request: 'ইউটিলিটি সেবা'
};

export default function WardServiceRequestManager({ wardId }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        async function loadRequests() {
            try {
                setLoading(true);
                const data = await householdService.getServiceRequestsByWard(wardId);
                if (active) setRequests(data);
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

    if (loading) {
        return (
            <div className="py-20 text-center">
                <Loader2 className="mx-auto animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-black text-slate-800">এই ওয়ার্ডের আবেদনসমূহ</h3>
                <p className="mt-1 text-sm font-bold text-slate-400">
                    আপনার ওয়ার্ডের গ্রামগুলো থেকে জমা হওয়া আবেদন এখানে দেখা যাবে। অনুমোদন ও প্রসেসিং ইউনিয়ন প্যানেল থেকে হবে।
                </p>
            </div>

            {requests.length === 0 ? (
                <div className="rounded-[32px] border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                    <Clock className="mx-auto mb-4 text-slate-300" size={42} />
                    <p className="font-bold text-slate-400">এখনও কোনো আবেদন জমা হয়নি।</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {requests.map((request) => (
                        <div key={request.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                                    <FileText size={22} />
                                </div>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">
                                    {STATUS_LABELS[request.status] || request.status}
                                </span>
                            </div>

                            <h4 className="text-lg font-black text-slate-800">
                                {REQUEST_LABELS[request.request_type] || request.request_type}
                            </h4>

                            <div className="mt-4 space-y-2 text-xs font-bold text-slate-500">
                                <p className="flex items-center gap-2">
                                    <User size={14} />
                                    {request.applicant_name || 'নাম নেই'}
                                </p>
                                <p className="flex items-center gap-2">
                                    <MapPin size={14} />
                                    {request.household?.village?.bn_name || 'গ্রাম নেই'}, বাড়ি: {toBnDigits(request.household?.house_no || '')}
                                </p>
                                <p className="flex items-center gap-2">
                                    <CalendarDays size={14} />
                                    {toBnDigits(new Date(request.created_at).toLocaleDateString('bn-BD'))}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

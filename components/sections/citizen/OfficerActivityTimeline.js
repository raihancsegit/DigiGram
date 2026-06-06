"use client";

import { AlertTriangle, CheckCircle2, Clock3, History } from 'lucide-react';

function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

export function CitizenQueueSla({ item }) {
    if (!item?.sla_due_at) return null;

    const closed = ['completed', 'rejected', 'no_show'].includes(item.status);
    const escalated = Number(item.escalation_level || 0) > 0;
    const overdue = !closed && Boolean(item.sla_breached_at || escalated);

    return (
        <div className={`mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 ${
            overdue || escalated
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : closed
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
                    : 'border-amber-100 bg-amber-50 text-amber-800'
        }`}>
            <span className="inline-flex items-center gap-2 text-xs font-black">
                {overdue || escalated
                    ? <AlertTriangle size={15} />
                    : closed
                        ? <CheckCircle2 size={15} />
                        : <Clock3 size={15} />}
                {closed ? 'কাজ বন্ধ/সম্পন্ন' : overdue ? 'SLA সময় পার হয়েছে' : 'কাজের নির্ধারিত সময়'}
            </span>
            <span className="text-xs font-black">
                {formatDate(item.sla_due_at)}
                {escalated ? ` · Level ${item.escalation_level}` : ''}
            </span>
        </div>
    );
}

export default function OfficerActivityTimeline({ events = [] }) {
    if (events.length === 0) return null;

    return (
        <details className="group mt-4 rounded-2xl border border-slate-200 bg-slate-50">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black text-slate-700">
                <span className="inline-flex items-center gap-2">
                    <History size={16} className="text-teal-600" />
                    Officer history ({events.length})
                </span>
                <span className="text-xs text-slate-400 group-open:hidden">দেখুন</span>
                <span className="hidden text-xs text-slate-400 group-open:inline">বন্ধ করুন</span>
            </summary>
            <div className="border-t border-slate-200 px-4 py-3">
                <ol className="space-y-3">
                    {events.map((event) => (
                        <li key={event.id} className="relative border-l-2 border-teal-200 pl-4">
                            <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-teal-500" />
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-xs font-black text-slate-800">
                                    {event.actor_name || event.actor_role || 'Officer'}
                                </p>
                                <time className="text-[10px] font-bold text-slate-400">{formatDate(event.created_at)}</time>
                            </div>
                            <p className="mt-1 text-xs font-bold text-slate-600">
                                {event.from_status && event.to_status && event.from_status !== event.to_status
                                    ? `${event.from_status} → ${event.to_status}`
                                    : event.action === 'details_updated'
                                        ? 'তথ্য আপডেট'
                                        : event.action}
                            </p>
                            {event.note && <p className="mt-1 text-xs leading-5 text-slate-500">{event.note}</p>}
                        </li>
                    ))}
                </ol>
            </div>
        </details>
    );
}

'use client';

import { AlertTriangle, CheckCircle2, Clock3, MessageSquareText, RefreshCw, XCircle } from 'lucide-react';
import { toBnDigits } from '@/lib/utils/format';

const STATUS_META = {
    queued: { label: 'Queue', icon: Clock3, pill: 'bg-amber-50 text-amber-700', bar: 'bg-amber-400' },
    sent: { label: 'Sent', icon: CheckCircle2, pill: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500' },
    failed: { label: 'Failed', icon: XCircle, pill: 'bg-rose-50 text-rose-700', bar: 'bg-rose-500' },
    skipped: { label: 'Skipped', icon: AlertTriangle, pill: 'bg-slate-100 text-slate-600', bar: 'bg-slate-400' }
};

function normalizeStatus(status) {
    const key = String(status || 'queued').toLowerCase();
    return STATUS_META[key] ? key : 'queued';
}

function formatDate(value) {
    if (!value) return 'সময় নেই';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'সময় নেই';
    return date.toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

export default function SmsDeliveryReport({
    messages = [],
    campaigns = [],
    title = 'SMS Delivery Report',
    subtitle = 'কোন SMS queue, sent বা failed আছে এক নজরে দেখুন।',
    onRefresh
}) {
    const rows = Array.isArray(messages) ? messages : [];
    const campaignRows = Array.isArray(campaigns) ? campaigns : [];
    const counts = rows.reduce((acc, item) => {
        const status = normalizeStatus(item.status);
        acc[status] = (acc[status] || 0) + 1;
        acc.total += 1;
        return acc;
    }, { total: 0, queued: 0, sent: 0, failed: 0, skipped: 0 });
    const deliveryRate = counts.total > 0 ? Math.round((counts.sent / counts.total) * 100) : 0;
    const failedRate = counts.total > 0 ? Math.round((counts.failed / counts.total) * 100) : 0;
    const recentRows = rows.slice(0, 12);

    return (
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-4 border-b border-slate-100 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                        <MessageSquareText size={22} />
                    </span>
                    <div>
                        <h3 className="text-xl font-black text-slate-900">{title}</h3>
                        <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{subtitle}</p>
                    </div>
                </div>
                {onRefresh && (
                    <button
                        type="button"
                        onClick={onRefresh}
                        className="inline-flex w-fit items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-200"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                )}
            </div>

            <div className="grid gap-3 p-5 md:grid-cols-5">
                <Metric label="Total" value={counts.total} />
                <Metric label="Queued" value={counts.queued} tone="queued" />
                <Metric label="Sent" value={counts.sent} tone="sent" />
                <Metric label="Failed" value={counts.failed} tone="failed" />
                <Metric label="Delivery" value={`${toBnDigits(deliveryRate)}%`} raw tone={failedRate > 10 ? 'failed' : 'sent'} />
            </div>

            <div className="px-5 pb-5">
                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50">
                    <div className="grid grid-cols-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <div className="border-r border-white p-3">Queued</div>
                        <div className="border-r border-white p-3">Sent</div>
                        <div className="p-3">Failed</div>
                    </div>
                    <div className="grid h-3 grid-cols-3 bg-white">
                        <div className="bg-amber-400" style={{ opacity: counts.total ? 1 : 0.25, width: `${counts.total ? 100 : 0}%` }} />
                        <div className="bg-emerald-500" style={{ opacity: counts.total ? 1 : 0.25, width: `${counts.total ? 100 : 0}%` }} />
                        <div className="bg-rose-500" style={{ opacity: counts.total ? 1 : 0.25, width: `${counts.total ? 100 : 0}%` }} />
                    </div>
                </div>
            </div>

            {campaignRows.length > 0 && (
                <div className="border-t border-slate-100 p-5">
                    <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Recent campaigns</p>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {campaignRows.slice(0, 6).map((campaign) => (
                            <div key={campaign.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <p className="font-black leading-tight text-slate-900">{campaign.title}</p>
                                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-teal-700">
                                        {toBnDigits(campaign.recipient_count || 0)}
                                    </span>
                                </div>
                                <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{campaign.message}</p>
                                <p className="mt-3 text-[11px] font-black text-slate-400">{formatDate(campaign.created_at)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="border-t border-slate-100">
                {recentRows.length === 0 ? (
                    <p className="p-8 text-center text-sm font-bold text-slate-400">এখনও কোনো SMS delivery data নেই।</p>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {recentRows.map((item) => {
                            const status = normalizeStatus(item.status);
                            const meta = STATUS_META[status];
                            const Icon = meta.icon;
                            return (
                                <div key={item.id} className="grid gap-3 p-4 md:grid-cols-[150px_110px_1fr_150px] md:items-center">
                                    <div>
                                        <p className="text-sm font-black text-slate-900">{item.recipient_phone || item.phone}</p>
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{item.category || item.event_key || 'general'}</p>
                                    </div>
                                    <span className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase ${meta.pill}`}>
                                        <Icon size={12} />
                                        {meta.label}
                                    </span>
                                    <p className="line-clamp-2 text-sm font-bold leading-6 text-slate-600">{item.message}</p>
                                    <p className="text-xs font-bold text-slate-400">{formatDate(item.sent_at || item.queued_at || item.created_at)}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}

function Metric({ label, value, tone = 'slate', raw = false }) {
    const meta = STATUS_META[tone] || { pill: 'bg-slate-50 text-slate-900' };
    return (
        <div className={`rounded-3xl p-4 ${meta.pill}`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
            <p className="mt-2 text-2xl font-black">{raw ? value : toBnDigits(value)}</p>
        </div>
    );
}

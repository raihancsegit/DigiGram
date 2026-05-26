'use client';

import Link from 'next/link';
import {
    AlertTriangle,
    ArrowRight,
    Banknote,
    Bell,
    CheckCircle2,
    ClipboardList,
    FileText,
    HeartPulse,
    MessageSquareWarning,
    ShieldCheck,
    Users
} from 'lucide-react';
import { toBnDigits } from '@/lib/utils/format';

const ICONS = {
    benefit: Users,
    complaint: MessageSquareWarning,
    health: HeartPulse,
    service: FileText,
    sms: Bell,
    tax: Banknote,
    default: ShieldCheck
};

const TONES = {
    amber: {
        card: 'border-amber-100 bg-amber-50 text-amber-950 hover:bg-amber-100',
        icon: 'bg-amber-100 text-amber-700',
        pill: 'bg-white/85 text-amber-800'
    },
    rose: {
        card: 'border-rose-100 bg-rose-50 text-rose-950 hover:bg-rose-100',
        icon: 'bg-rose-100 text-rose-700',
        pill: 'bg-white/85 text-rose-800'
    },
    slate: {
        card: 'border-slate-200 bg-slate-50 text-slate-950 hover:bg-slate-100',
        icon: 'bg-slate-100 text-slate-700',
        pill: 'bg-white text-slate-700'
    },
    teal: {
        card: 'border-teal-100 bg-teal-50 text-teal-950 hover:bg-teal-100',
        icon: 'bg-teal-100 text-teal-700',
        pill: 'bg-white/85 text-teal-800'
    }
};

export default function OfficerActionCenter({
    title = 'আজকের কাজের বোর্ড',
    subtitle,
    items = [],
    onSelect
}) {
    const activeItems = items.filter(Boolean);
    const urgentCount = activeItems.filter((item) => item.urgent).length;
    const warningCount = activeItems.filter((item) => item.tone === 'amber' && !item.urgent).length;
    const regularCount = Math.max(0, activeItems.length - urgentCount - warningCount);
    const pressureScore = activeItems.length === 0
        ? 100
        : Math.max(8, Math.round(((regularCount + warningCount * 0.5) / activeItems.length) * 100));
    const nextAction = activeItems[0];

    return (
        <section className="mb-8 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
                <aside className="border-b border-slate-100 bg-slate-950 p-5 text-white sm:p-6 lg:border-b-0 lg:border-r">
                    <div className="flex items-start gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-400/15 text-teal-300 ring-1 ring-teal-300/20">
                            <ClipboardList size={24} />
                        </span>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-300">
                                Officer Daily Workboard
                            </p>
                            <h2 className="mt-1 text-2xl font-black leading-tight">{title}</h2>
                            {subtitle && <p className="mt-2 text-sm font-bold leading-6 text-slate-300">{subtitle}</p>}
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                        <Metric label="urgent" value={urgentCount} tone="rose" />
                        <Metric label="watch" value={warningCount} tone="amber" />
                        <Metric label="task" value={activeItems.length} tone="teal" />
                    </div>

                    <div className="mt-5 rounded-3xl bg-white/8 p-4 ring-1 ring-white/10">
                        <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-300">
                            <span>আজকের কাজের চাপ</span>
                            <span>{toBnDigits(pressureScore)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                                className={`h-full rounded-full ${urgentCount > 0 ? 'bg-rose-400' : warningCount > 0 ? 'bg-amber-300' : 'bg-teal-300'}`}
                                style={{ width: `${pressureScore}%` }}
                            />
                        </div>
                        <p className="mt-3 text-xs font-bold leading-5 text-slate-400">
                            জরুরি কাজ আগে শেষ করুন। তারপর SMS follow-up, household update বা service review চালানো যাবে।
                        </p>
                    </div>
                </aside>

                <div className="p-4 sm:p-6">
                    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryTile label="মোট খোলা কাজ" value={activeItems.length} />
                        <SummaryTile label="জরুরি" value={urgentCount} tone="rose" />
                        <SummaryTile label="নজরে রাখুন" value={warningCount} tone="amber" />
                        <SummaryTile label="পরবর্তী কাজ" value={nextAction?.badge || 'সব পরিষ্কার'} compact />
                    </div>

                    {activeItems.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <>
                            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-black text-slate-900">Next actions</p>
                                    <p className="text-xs font-bold text-slate-400">
                                        urgent বা high-impact কাজ আগে খুলুন, তারপর regular follow-up করুন।
                                    </p>
                                </div>
                                <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {toBnDigits(activeItems.length)} open
                                </span>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {activeItems.map((item, index) => (
                                    <ActionCard
                                        key={item.key || `${item.title}-${index}`}
                                        item={item}
                                        index={index}
                                        onSelect={onSelect}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}

function ActionCard({ item, index, onSelect }) {
    const tone = TONES[item.tone] || TONES.slate;
    const Icon = ICONS[item.type] || ICONS.default;
    const CardTag = item.href ? Link : 'button';
    const props = item.href ? { href: item.href } : { type: 'button' };

    return (
        <CardTag
            {...props}
            onClick={() => onSelect?.(item)}
            className={`group flex min-h-[190px] flex-col rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${tone.card}`}
        >
            <div className="flex items-start justify-between gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone.icon}`}>
                    <Icon size={21} />
                </span>
                {item.urgent ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-rose-700">
                        <AlertTriangle size={12} />
                        জরুরি
                    </span>
                ) : (
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${tone.pill}`}>
                        Task {toBnDigits(index + 1)}
                    </span>
                )}
            </div>
            <p className="mt-4 text-lg font-black leading-tight">{item.title}</p>
            <p className="mt-2 line-clamp-3 text-sm font-bold leading-6 opacity-80">{item.text}</p>
            <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${tone.pill}`}>
                    {item.badge}
                </span>
                <span className="flex items-center gap-1 text-xs font-black">
                    {item.actionLabel || 'খুলুন'} <ArrowRight size={14} />
                </span>
            </div>
        </CardTag>
    );
}

function EmptyState() {
    return (
        <div className="flex min-h-[220px] items-center justify-center rounded-[28px] border border-dashed border-teal-200 bg-teal-50 p-6 text-teal-900">
            <div className="max-w-md text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm">
                    <CheckCircle2 size={28} />
                </div>
                <p className="text-xl font-black">এখন জরুরি pending task নেই</p>
                <p className="mt-2 text-sm font-bold leading-6 text-teal-700">
                    regular monitoring, notice, household update বা service review নিচের tab থেকে চালিয়ে যেতে পারেন।
                </p>
            </div>
        </div>
    );
}

function Metric({ label, value, tone }) {
    const toneClass = {
        amber: 'text-amber-200',
        rose: 'text-rose-200',
        teal: 'text-teal-200'
    }[tone] || 'text-slate-200';

    return (
        <div className="rounded-2xl bg-white/8 px-3 py-3 ring-1 ring-white/10">
            <p className={`text-xl font-black ${toneClass}`}>{toBnDigits(value)}</p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        </div>
    );
}

function SummaryTile({ label, value, tone = 'slate', compact = false }) {
    const toneClass = {
        amber: 'bg-amber-50 text-amber-800 border-amber-100',
        rose: 'bg-rose-50 text-rose-800 border-rose-100',
        slate: 'bg-slate-50 text-slate-900 border-slate-200'
    }[tone];

    return (
        <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
            <p className="text-[11px] font-black uppercase tracking-widest opacity-60">{label}</p>
            <p className={`${compact ? 'text-base' : 'text-2xl'} mt-1 truncate font-black`}>
                {typeof value === 'number' ? toBnDigits(value) : value}
            </p>
        </div>
    );
}

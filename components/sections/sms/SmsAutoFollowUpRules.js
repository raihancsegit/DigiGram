'use client';

import { BellRing, CheckCircle2, Clock3, FileText, HeartPulse, ReceiptText, ShieldAlert, UserRoundCheck } from 'lucide-react';
import { toBnDigits } from '@/lib/utils/format';

const DEFAULT_RULES = [
    {
        key: 'service_ready',
        title: 'Application ready SMS',
        text: 'সনদ/আবেদন ready হলে citizen-কে collection date সহ SMS যাবে।',
        trigger: 'service_requests.status = ready',
        category: 'service',
        icon: FileText,
        enabled: true
    },
    {
        key: 'service_processing',
        title: 'Application processing update',
        text: 'আবেদন processing হলে citizen বুঝবে কাজ চলছে, অফিসে বারবার আসতে হবে না।',
        trigger: 'pending -> processing',
        category: 'service',
        icon: Clock3,
        enabled: true
    },
    {
        key: 'tax_due',
        title: 'Tax due reminder',
        text: 'বকেয়া tax/holding bill থাকলে মাসিক reminder যাবে।',
        trigger: 'tax.status = due/partial',
        category: 'tax',
        icon: ReceiptText,
        enabled: true
    },
    {
        key: 'low_completeness',
        title: 'Citizen score low',
        text: 'NID, জন্ম নিবন্ধন বা blood group missing থাকলে পরিবারকে update reminder যাবে।',
        trigger: 'household completeness < target',
        category: 'household',
        icon: UserRoundCheck,
        enabled: true
    },
    {
        key: 'women_support',
        title: 'Women Support Desk follow-up',
        text: 'বিধবা, মাতৃত্বকালীন, training বা health support candidate পেলে SMS follow-up।',
        trigger: 'resident profile match',
        category: 'support',
        icon: HeartPulse,
        enabled: true
    },
    {
        key: 'emergency_broadcast',
        title: 'Emergency Broadcast',
        text: 'ঝড়, বন্যা, পানি, টিকা ক্যাম্প বা জরুরি সভায় ward/village-wise broadcast।',
        trigger: 'manual one-click',
        category: 'emergency',
        icon: ShieldAlert,
        enabled: true
    }
];

export default function SmsAutoFollowUpRules({
    rules = DEFAULT_RULES,
    title = 'Auto Follow-up Rules',
    subtitle = 'যে কাজগুলোতে SMS automatically বা one-click follow-up যাবে।',
    compact = false
}) {
    const activeRules = (rules || DEFAULT_RULES).filter(Boolean);
    const enabledCount = activeRules.filter((rule) => rule.enabled !== false).length;

    return (
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-4 border-b border-slate-100 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                        <BellRing size={22} />
                    </span>
                    <div>
                        <h3 className="text-xl font-black text-slate-900">{title}</h3>
                        <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{subtitle}</p>
                    </div>
                </div>
                <span className="w-fit rounded-full bg-teal-50 px-4 py-2 text-xs font-black text-teal-700">
                    {toBnDigits(enabledCount)} active
                </span>
            </div>

            <div className={`grid gap-3 p-5 ${compact ? 'lg:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
                {activeRules.map((rule) => {
                    const Icon = rule.icon || BellRing;
                    const enabled = rule.enabled !== false;
                    return (
                        <div
                            key={rule.key || rule.title}
                            className={`rounded-3xl border p-4 ${enabled ? 'border-teal-100 bg-teal-50/60' : 'border-slate-200 bg-slate-50 opacity-70'}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${enabled ? 'bg-white text-teal-700' : 'bg-white text-slate-500'}`}>
                                    <Icon size={19} />
                                </span>
                                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase ${enabled ? 'bg-white text-teal-700' : 'bg-white text-slate-500'}`}>
                                    {enabled && <CheckCircle2 size={12} />}
                                    {enabled ? 'Ready' : 'Off'}
                                </span>
                            </div>
                            <p className="mt-4 text-base font-black leading-tight text-slate-900">{rule.title}</p>
                            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{rule.text}</p>
                            <div className="mt-4 rounded-2xl bg-white px-3 py-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trigger</p>
                                <p className="mt-1 text-xs font-black text-slate-700">{rule.trigger}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}


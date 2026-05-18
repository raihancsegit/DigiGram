'use client';

import { useEffect, useState } from 'react';
import { Banknote, Clock3, Loader2, Receipt, TrendingUp } from 'lucide-react';
import { taxService } from '@/lib/services/taxService';
import { toBnDigits } from '@/lib/utils/format';

function money(value) {
    return `৳${toBnDigits(Number(value || 0).toLocaleString('en-US'))}`;
}

export default function UnionTaxDashboard({ unionId }) {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            try {
                setLoading(true);
                const data = await taxService.getTaxDashboardByUnion(unionId);
                if (active) setDashboard(data);
            } catch (err) {
                console.error('Failed to load union tax dashboard:', err);
            } finally {
                if (active) setLoading(false);
            }
        }

        loadDashboard();

        return () => {
            active = false;
        };
    }, [unionId]);

    if (loading) {
        return (
            <div className="py-20 text-center">
                <Loader2 className="mx-auto animate-spin text-indigo-600" />
            </div>
        );
    }

    const summary = dashboard?.summary || {};

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-2xl font-black text-slate-800">ইউপি কর ড্যাশবোর্ড</h3>
                <p className="mt-1 text-sm font-bold text-slate-400">দাবি, আদায়, বকেয়া এবং ওয়ার্ডভিত্তিক অগ্রগতি এক নজরে।</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={Banknote} label="মোট দাবি" value={money(summary.totalDue)} tone="indigo" />
                <StatCard icon={Receipt} label="মোট আদায়" value={money(summary.totalPaid)} tone="emerald" />
                <StatCard icon={Clock3} label="মোট বকেয়া" value={money(summary.totalOutstanding)} tone="rose" />
                <StatCard icon={TrendingUp} label="আদায়ের হার" value={`${toBnDigits(summary.totalDue > 0 ? Math.round((summary.totalPaid / summary.totalDue) * 100) : 0)}%`} tone="amber" />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
                <section className="rounded-[32px] border border-slate-200 bg-white p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <h4 className="text-lg font-black text-slate-800">ওয়ার্ডভিত্তিক আদায়</h4>
                        <span className="text-xs font-bold text-slate-400">{toBnDigits(dashboard?.wardSummaries?.length || 0)} ওয়ার্ড</span>
                    </div>

                    <div className="space-y-4">
                        {dashboard?.wardSummaries?.length ? dashboard.wardSummaries.map((ward) => (
                            <div key={ward.wardId} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                                <div className="mb-3 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-black text-slate-800">{ward.wardName}</p>
                                        <p className="text-xs font-bold text-slate-400">
                                            {toBnDigits(ward.totalRecords)} বিল · {toBnDigits(ward.paidCount)} পরিশোধিত · {toBnDigits(ward.partialCount)} আংশিক
                                        </p>
                                    </div>
                                    <p className="text-lg font-black text-indigo-600">{toBnDigits(ward.collectionRate)}%</p>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${ward.collectionRate}%` }} />
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-3 text-xs font-bold">
                                    <p>দাবি: {money(ward.totalDue)}</p>
                                    <p className="text-emerald-600">আদায়: {money(ward.totalPaid)}</p>
                                    <p className="text-rose-600">বকেয়া: {money(ward.totalOutstanding)}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="rounded-3xl border-2 border-dashed border-slate-200 py-14 text-center text-sm font-bold text-slate-400">
                                এখনও কোনো কর বিল তৈরি হয়নি।
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-[32px] border border-slate-200 bg-white p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <h4 className="text-lg font-black text-slate-800">সাম্প্রতিক রসিদ</h4>
                        <span className="text-xs font-bold text-slate-400">সর্বশেষ ৮টি</span>
                    </div>

                    <div className="space-y-3">
                        {dashboard?.recentPayments?.length ? dashboard.recentPayments.map((payment) => (
                            <div key={payment.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-black text-slate-800">{payment.tax?.household?.owner_name || 'নাম নেই'}</p>
                                        <p className="text-xs font-bold text-slate-400">
                                            {payment.tax?.household?.ward?.name_bn || 'ওয়ার্ড'} · রসিদ {toBnDigits(payment.receipt_no)}
                                        </p>
                                    </div>
                                    <p className="font-black text-emerald-600">{money(payment.amount)}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="rounded-3xl border-2 border-dashed border-slate-200 py-14 text-center text-sm font-bold text-slate-400">
                                এখনও কোনো রসিদ নেই।
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, tone }) {
    const toneMap = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        rose: 'bg-rose-50 text-rose-600',
        amber: 'bg-amber-50 text-amber-600'
    };

    return (
        <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${toneMap[tone]}`}>
                <Icon size={22} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-800">{value}</p>
        </div>
    );
}

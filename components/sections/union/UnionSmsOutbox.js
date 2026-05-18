'use client';

import { useEffect, useState } from 'react';
import { Loader2, MessageSquareText } from 'lucide-react';
import { householdService } from '@/lib/services/householdService';

export default function UnionSmsOutbox({ unionId }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                setItems(await householdService.getServiceRequestSmsByUnion(unionId));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [unionId]);

    if (loading) {
        return <div className="py-16 text-center"><Loader2 className="mx-auto animate-spin text-teal-600" /></div>;
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                    <MessageSquareText size={22} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-800">SMS Outbox</h3>
                    <p className="text-sm font-bold text-slate-400">আবেদনের status অনুযায়ী queued message</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white">
                {items.length === 0 ? (
                    <p className="p-8 text-sm font-bold text-slate-400">এখনও কোনো SMS queue হয়নি।</p>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {items.map((item) => (
                            <div key={item.id} className="grid gap-3 p-5 md:grid-cols-[160px_120px_1fr_110px] md:items-center">
                                <div>
                                    <p className="text-sm font-black text-slate-800">{item.phone}</p>
                                    <p className="text-xs font-bold text-slate-400">{item.request?.applicant_name}</p>
                                </div>
                                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-600">
                                    {item.event_key}
                                </span>
                                <p className="text-sm font-bold text-slate-600">{item.message}</p>
                                <span className={`w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                                    item.status === 'sent'
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : item.status === 'failed'
                                            ? 'bg-rose-50 text-rose-600'
                                            : 'bg-amber-50 text-amber-600'
                                }`}>
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

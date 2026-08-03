'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/utils/supabase';
import ModalPortal from '@/components/common/ModalPortal';

export default function UnionServiceSettingsModal({ union, onClose }) {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    async function callApi(options = {}) {
        const { data } = await supabase.auth.getSession();
        return fetch(`/api/admin/union-service-settings?unionId=${union.id}`, {
            ...options,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token}`, ...options.headers }
        });
    }

    useEffect(() => {
        callApi().then((res) => res.json()).then((body) => setServices(body.services || []))
            .catch(() => setMessage('সেবা সেটিং লোড করা যায়নি')).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [union.id]);

    const change = (index, key, value) => setServices((items) => items.map((item, i) => i === index ? { ...item, [key]: value } : item));
    const save = async () => {
        setSaving(true); setMessage('');
        try {
            const response = await callApi({ method: 'PUT', body: JSON.stringify({ unionId: union.id, services }) });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error);
            setServices(body.services || services); setMessage('সেটিং সংরক্ষণ হয়েছে');
        } catch (error) { setMessage(error.message || 'সংরক্ষণ করা যায়নি'); }
        finally { setSaving(false); }
    };

    return <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                <header className="flex items-center justify-between border-b px-5 py-4 sm:px-7">
                    <div><h2 className="text-xl font-black text-slate-900">ইউনিয়নের সেবা ও ফি</h2><p className="text-sm text-slate-500">{union.name_bn} — প্রতিটি সেবার নিজস্ব নিয়ম দিন</p></div>
                    <button onClick={onClose} className="rounded-xl bg-slate-100 p-2"><X /></button>
                </header>
                <div className="overflow-y-auto p-4 sm:p-7">
                    {loading ? <div className="flex justify-center p-16"><Loader2 className="animate-spin" /></div> :
                        <div className="space-y-3">{services.map((service, index) => <div key={service.request_type} className="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1.5fr_.55fr_.55fr_auto] lg:items-center">
                            <div><input value={service.title} onChange={(e) => change(index, 'title', e.target.value)} className="w-full rounded-xl border px-3 py-2 font-bold" /><textarea value={service.instructions || ''} onChange={(e) => change(index, 'instructions', e.target.value)} placeholder="আবেদনকারীকে প্রয়োজনীয় নির্দেশনা" className="mt-2 min-h-16 w-full rounded-xl border px-3 py-2 text-sm" /></div>
                            <label className="text-xs font-bold text-slate-500">ফি (৳)<input type="number" min="0" value={service.fee_amount} onChange={(e) => change(index, 'fee_amount', e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-base text-slate-900" /></label>
                            <label className="text-xs font-bold text-slate-500">সময় (দিন)<input type="number" min="0" max="365" value={service.estimated_days} onChange={(e) => change(index, 'estimated_days', e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-base text-slate-900" /></label>
                            <div className="grid gap-2 text-sm font-bold"><label><input type="checkbox" checked={service.is_active} onChange={(e) => change(index, 'is_active', e.target.checked)} /> চালু</label><label><input type="checkbox" checked={service.sms_enabled} onChange={(e) => change(index, 'sms_enabled', e.target.checked)} /> SMS</label><label><input type="checkbox" checked={service.online_payment_enabled} onChange={(e) => change(index, 'online_payment_enabled', e.target.checked)} /> অনলাইন পেমেন্ট</label></div>
                        </div>)}</div>}
                </div>
                <footer className="flex items-center justify-between border-t bg-slate-50 px-5 py-4 sm:px-7"><p className="text-sm font-bold text-teal-700">{message}</p><button disabled={saving || loading} onClick={save} className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-black text-white disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} সংরক্ষণ</button></footer>
            </div>
        </div>
    </ModalPortal>;
}

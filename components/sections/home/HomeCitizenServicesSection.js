'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Home, QrCode, ShieldCheck, Users } from 'lucide-react';

export default function HomeCitizenServicesSection() {
    const router = useRouter();
    const [householdId, setHouseholdId] = useState('');
    const [error, setError] = useState('');

    function openHousehold(event) {
        event.preventDefault();
        const value = householdId.trim();
        if (!value) {
            setError('বাড়ির ID বা QR নম্বর লিখুন।');
            return;
        }
        setError('');
        router.push(`/h/${encodeURIComponent(value)}`);
    }

    return (
        <section id="citizen-services" className="bg-slate-50 px-4 py-12 sm:px-6 md:py-20">
            <div className="mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-slate-950 text-white shadow-2xl">
                <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[0.9fr_1.1fr] lg:p-12">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black text-teal-300 ring-1 ring-white/10"><Home size={15} /> আমার বাড়ি, আমার সেবা</p>
                        <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">সব আবেদন নিজের বাড়ি থেকেই</h1>
                        <p className="mt-4 max-w-xl font-medium leading-7 text-slate-300">পরিবারের তথ্য একবার তৈরি থাকলেই নাম, ঠিকানা ও সদস্যের তথ্য বারবার লিখতে হবে না। বাড়ি খুলে সদস্য বাছাই করুন, সেবা নিন এবং status দেখুন।</p>
                        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs font-black text-slate-300">
                            <span className="rounded-2xl bg-white/5 p-3"><Users className="mx-auto mb-2 text-teal-300" size={20} />সদস্য বাছাই</span>
                            <span className="rounded-2xl bg-white/5 p-3"><ShieldCheck className="mx-auto mb-2 text-teal-300" size={20} />তথ্য Auto-fill</span>
                            <span className="rounded-2xl bg-white/5 p-3"><QrCode className="mx-auto mb-2 text-teal-300" size={20} />এক ID-তে সব</span>
                        </div>
                    </div>

                    <form onSubmit={openHousehold} className="self-center rounded-[30px] bg-white p-5 text-slate-950 shadow-xl sm:p-7">
                        <div className="flex items-center gap-3">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><QrCode size={24} /></span>
                            <div><h2 className="text-xl font-black">নিজের বাড়ি খুলুন</h2><p className="mt-1 text-xs font-bold text-slate-500">বাড়ির QR scan করুন অথবা ID লিখুন</p></div>
                        </div>
                        <label className="mt-6 grid gap-2 text-sm font-black text-slate-700">বাড়ির ID / QR নম্বর
                            <input value={householdId} onChange={(event) => setHouseholdId(event.target.value)} placeholder="যেমন: Household ID" autoComplete="off" className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-bold outline-none focus:border-teal-500 focus:bg-white" />
                        </label>
                        {error && <p className="mt-2 text-sm font-bold text-rose-600">{error}</p>}
                        <button className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 font-black text-white transition hover:bg-slate-950">বাড়িতে প্রবেশ করুন <ArrowRight size={18} /></button>
                        <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold">
                            <Link href="/area" className="text-teal-700 hover:underline">ID জানি না—এলাকা থেকে খুঁজুন</Link>
                            <Link href="/track" className="text-slate-500 hover:text-teal-700">আবেদন দেখুন</Link>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}

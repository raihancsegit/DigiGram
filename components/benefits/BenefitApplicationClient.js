'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, FileCheck2, Info, Printer } from 'lucide-react';

const SERVICES = {
    maternity: {
        title: 'মাতৃত্বকালীন ভাতা',
        eligibility: ['আবেদনকারী গর্ভবতী বা সদ্য সন্তান প্রসব করেছেন', 'জাতীয় পরিচয়পত্র/জন্মনিবন্ধন আছে', 'নিজ এলাকার স্থায়ী বাসিন্দা'],
        documents: ['জাতীয় পরিচয়পত্রের কপি', 'গর্ভকালীন/জন্মসংক্রান্ত চিকিৎসা সনদ', 'ব্যাংক বা মোবাইল আর্থিক হিসাবের তথ্য', 'পাসপোর্ট সাইজ ছবি'],
    },
    elderly: {
        title: 'বয়স্ক ভাতা',
        eligibility: ['প্রযোজ্য সরকারি বয়সসীমা পূরণ হয়েছে', 'নিজ এলাকার স্থায়ী বাসিন্দা', 'অন্য কোনো সমজাতীয় সরকারি ভাতা গ্রহণ করছেন না'],
        documents: ['জাতীয় পরিচয়পত্রের কপি', 'বয়সের প্রমাণপত্র', 'নাগরিকত্ব/বাসিন্দা সনদ', 'ব্যাংক বা মোবাইল আর্থিক হিসাবের তথ্য'],
    },
    widow: {
        title: 'বিধবা ও স্বামী নিগৃহীতা ভাতা',
        eligibility: ['আবেদনকারী বিধবা বা স্বামী নিগৃহীতা নারী', 'নিজ এলাকার স্থায়ী বাসিন্দা', 'আর্থিক সহায়তার প্রয়োজন রয়েছে'],
        documents: ['জাতীয় পরিচয়পত্রের কপি', 'স্বামীর মৃত্যু সনদ বা প্রাসঙ্গিক প্রত্যয়ন', 'নাগরিকত্ব/বাসিন্দা সনদ', 'ব্যাংক বা মোবাইল আর্থিক হিসাবের তথ্য'],
    },
    disability: {
        title: 'প্রতিবন্ধী ভাতা',
        eligibility: ['প্রতিবন্ধিতা শনাক্তকরণ/নিবন্ধন আছে', 'নিজ এলাকার স্থায়ী বাসিন্দা', 'প্রযোজ্য সরকারি শর্ত পূরণ হয়'],
        documents: ['জাতীয় পরিচয়পত্র বা জন্মনিবন্ধনের কপি', 'প্রতিবন্ধী পরিচয়পত্র/সনদ', 'নাগরিকত্ব/বাসিন্দা সনদ', 'ব্যাংক বা মোবাইল আর্থিক হিসাবের তথ্য'],
    },
};

const EMPTY_FORM = { name: '', guardian: '', nid: '', birthDate: '', phone: '', address: '', ward: '', account: '', notes: '' };

export default function BenefitApplicationClient({ initialService = 'maternity' }) {
    const [serviceId, setServiceId] = useState(SERVICES[initialService] ? initialService : 'maternity');
    const [form, setForm] = useState(EMPTY_FORM);
    const [confirmed, setConfirmed] = useState({});
    const [showSummary, setShowSummary] = useState(false);
    const service = SERVICES[serviceId];
    const requiredComplete = useMemo(() => form.name.trim() && form.phone.trim() && form.address.trim(), [form]);

    function updateField(event) {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
        setShowSummary(false);
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 print:bg-white print:p-0 sm:px-6 md:py-14">
            <div className="mx-auto max-w-5xl">
                <Link href="/#benefit-applications" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-slate-600 print:hidden"><ArrowLeft size={16} /> হোমে ফিরুন</Link>
                <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-8 lg:p-10">
                    <div className="print:hidden">
                        <p className="text-xs font-black text-teal-700">ভাতা আবেদন সহায়িকা</p>
                        <h1 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">আবেদন প্রস্তুত করুন</h1>
                        <p className="mt-3 max-w-3xl font-medium leading-7 text-slate-500">আপনার তথ্য browser-এ স্থায়ীভাবে সংরক্ষণ করা হয় না। পূরণ শেষে প্রিন্ট বা PDF করে সংশ্লিষ্ট অফিসে জমা দিন।</p>
                    </div>

                    <section className="mt-8 print:hidden">
                        <label className="text-sm font-black text-slate-700" htmlFor="service">সেবা নির্বাচন</label>
                        <select id="service" value={serviceId} onChange={(event) => { setServiceId(event.target.value); setShowSummary(false); }} className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-teal-500">
                            {Object.entries(SERVICES).map(([id, item]) => <option key={id} value={id}>{item.title}</option>)}
                        </select>
                    </section>

                    <div className="mt-8 grid gap-6 lg:grid-cols-2 print:hidden">
                        <Checklist title="প্রাথমিক যোগ্যতা" items={service.eligibility} confirmed={confirmed} setConfirmed={setConfirmed} prefix="eligible" />
                        <Checklist title="প্রয়োজনীয় কাগজপত্র" items={service.documents} confirmed={confirmed} setConfirmed={setConfirmed} prefix="document" />
                    </div>

                    <section className="mt-8 print:hidden">
                        <h2 className="text-xl font-black text-slate-950">আবেদনকারীর তথ্য</h2>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <Field label="পূর্ণ নাম *" name="name" value={form.name} onChange={updateField} />
                            <Field label="পিতা/মাতা/স্বামীর নাম" name="guardian" value={form.guardian} onChange={updateField} />
                            <Field label="জাতীয় পরিচয়পত্র/জন্মনিবন্ধন" name="nid" value={form.nid} onChange={updateField} />
                            <Field label="জন্মতারিখ" name="birthDate" type="date" value={form.birthDate} onChange={updateField} />
                            <Field label="মোবাইল নম্বর *" name="phone" type="tel" value={form.phone} onChange={updateField} placeholder="01XXXXXXXXX" />
                            <Field label="ওয়ার্ড/ইউনিয়ন" name="ward" value={form.ward} onChange={updateField} />
                            <Field label="ব্যাংক/মোবাইল হিসাব" name="account" value={form.account} onChange={updateField} />
                            <Field label="বর্তমান ঠিকানা *" name="address" value={form.address} onChange={updateField} />
                        </div>
                        <label className="mt-4 grid gap-2 text-sm font-black text-slate-700">অতিরিক্ত তথ্য<textarea name="notes" value={form.notes} onChange={updateField} rows={3} className="rounded-2xl border border-slate-200 p-4 font-medium outline-none focus:border-teal-500" /></label>
                    </section>

                    <div className="mt-8 flex flex-wrap gap-3 print:hidden">
                        <button type="button" disabled={!requiredComplete} onClick={() => setShowSummary(true)} className="rounded-2xl bg-teal-600 px-6 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-40">আবেদন সারাংশ তৈরি করুন</button>
                        {showSummary && <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 font-black text-white"><Printer size={18} /> প্রিন্ট / PDF</button>}
                    </div>
                    {!requiredComplete && <p className="mt-3 text-sm font-bold text-rose-600 print:hidden">নাম, মোবাইল নম্বর ও ঠিকানা পূরণ করুন।</p>}

                    {showSummary && <ApplicationSummary service={service} form={form} documents={service.documents} confirmed={confirmed} />}
                </div>
            </div>
        </main>
    );
}

function Checklist({ title, items, confirmed, setConfirmed, prefix }) {
    return <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200"><h2 className="flex items-center gap-2 text-lg font-black text-slate-900"><FileCheck2 size={20} className="text-teal-600" />{title}</h2><div className="mt-4 space-y-3">{items.map((item, index) => { const key = `${prefix}-${index}`; return <label key={key} className="flex cursor-pointer items-start gap-3 text-sm font-bold leading-6 text-slate-600"><input type="checkbox" checked={Boolean(confirmed[key])} onChange={(event) => setConfirmed((current) => ({ ...current, [key]: event.target.checked }))} className="mt-1 h-4 w-4 accent-teal-600" />{item}</label>; })}</div></div>;
}

function Field({ label, ...props }) {
    return <label className="grid gap-2 text-sm font-black text-slate-700">{label}<input {...props} className="h-12 rounded-2xl border border-slate-200 px-4 font-medium outline-none focus:border-teal-500" /></label>;
}

function ApplicationSummary({ service, form, documents, confirmed }) {
    return <section className="mt-10 border-t-2 border-slate-900 pt-8 print:mt-0 print:border-0 print:pt-0"><div className="text-center"><p className="text-sm font-bold">আবেদন প্রস্তুতি সারাংশ</p><h2 className="mt-2 text-3xl font-black">{service.title}</h2></div><div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 text-sm"><Summary label="আবেদনকারীর নাম" value={form.name} /><Summary label="পিতা/মাতা/স্বামী" value={form.guardian} /><Summary label="NID/জন্মনিবন্ধন" value={form.nid} /><Summary label="জন্মতারিখ" value={form.birthDate} /><Summary label="মোবাইল" value={form.phone} /><Summary label="ওয়ার্ড/ইউনিয়ন" value={form.ward} /><Summary label="ঠিকানা" value={form.address} /><Summary label="হিসাবের তথ্য" value={form.account} /></div>{form.notes && <div className="mt-5"><p className="text-xs font-black text-slate-500">অতিরিক্ত তথ্য</p><p className="mt-1">{form.notes}</p></div>}<div className="mt-8"><h3 className="font-black">সংযুক্তির তালিকা</h3><ul className="mt-3 space-y-2">{documents.map((document, index) => <li key={document} className="flex items-center gap-2 text-sm"><CheckCircle2 size={16} className={confirmed[`document-${index}`] ? 'text-teal-600' : 'text-slate-300'} />{document} — {confirmed[`document-${index}`] ? 'প্রস্তুত' : 'বাকি'}</li>)}</ul></div><div className="mt-8 flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900 print:border print:border-amber-300"><Info className="shrink-0" size={20} />এটি আবেদন প্রস্তুতির সারাংশ, সরকারি অনুমোদনপত্র নয়। সংশ্লিষ্ট ইউনিয়ন ডিজিটাল সেন্টার/উপজেলা সমাজসেবা বা মহিলা বিষয়ক অফিসে প্রয়োজনীয় নথিসহ জমা দিন।</div><div className="mt-16 grid grid-cols-2 gap-16 text-center text-sm font-bold"><span className="border-t border-slate-500 pt-2">আবেদনকারীর স্বাক্ষর</span><span className="border-t border-slate-500 pt-2">গ্রহণকারীর স্বাক্ষর</span></div></section>;
}

function Summary({ label, value }) { return <div className="border-b border-slate-200 pb-2"><p className="text-xs font-black text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-900">{value || '—'}</p></div>; }

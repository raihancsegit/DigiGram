'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle2, Circle, ExternalLink, Calculator,
    FileText, ArrowRight, Info, Shield
} from 'lucide-react';

const STEPS = [
    {
        step: '০১',
        title: 'দলিল নিবন্ধন নিশ্চিত করুন',
        desc: 'সাব-রেজিস্ট্রি অফিস থেকে মূল নিবন্ধিত দলিল সংগ্রহ করুন এবং DCR রশিদ সংরক্ষণ করুন।',
        docs: ['মূল বিক্রয় দলিল', 'DCR রশিদ'],
        color: 'from-blue-500 to-indigo-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
    },
    {
        step: '০২',
        title: 'প্রয়োজনীয় কাগজপত্র প্রস্তুত করুন',
        desc: 'নামজারির আবেদনের জন্য নিচের সকল কাগজপত্র প্রস্তুত রাখুন।',
        docs: ['ভায়া দলিলের কপি (আগের মালিকদের দলিল)', 'পুরাতন খতিয়ান (CS/SA/RS)', 'আবেদনকারীর NID কপি', 'হালনাগাদ ভূমি উন্নয়ন কর রশিদ'],
        color: 'from-teal-500 to-emerald-600',
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        text: 'text-teal-700',
    },
    {
        step: '০৩',
        title: 'অনলাইনে আবেদন করুন',
        desc: 'সরকারি ভূমি সেবা পোর্টালে গিয়ে নামজারির আবেদন করুন। সরকারি ফি মাত্র ১,১৭০ টাকা।',
        docs: ['land.gov.bd পোর্টালে লগইন করুন'],
        color: 'from-orange-500 to-amber-500',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        link: 'https://land.gov.bd',
        linkLabel: 'land.gov.bd তে যান',
    },
    {
        step: '০৪',
        title: 'নোটিশ ও শুনানি',
        desc: 'আবেদনের পর AC Land অফিস থেকে নোটিশ আসবে। নির্ধারিত তারিখে সকল কাগজ নিয়ে উপস্থিত হন।',
        docs: ['নোটিশ পত্র', 'মূল দলিল ও সকল কপি'],
        color: 'from-violet-500 to-purple-600',
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        text: 'text-violet-700',
    },
    {
        step: '০৫',
        title: 'নামজারি খতিয়ান সংগ্রহ',
        desc: 'মঞ্জুর হওয়ার পর ইউনিয়ন ভূমি অফিস বা পোর্টাল থেকে নতুন নামজারি খতিয়ান সংগ্রহ করুন।',
        docs: ['নামজারি খতিয়ান (ROR)'],
        color: 'from-emerald-500 to-teal-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
    },
];

const FEE_ITEMS = [
    { label: 'কোর্ট ফি', amount: 20 },
    { label: 'নোটিশ ফি', amount: 50 },
    { label: 'রেকর্ড সংশোধন ফি', amount: 1000 },
    { label: 'খতিয়ান ফি', amount: 100 },
];

export default function MutationTools() {
    const [activeStep, setActiveStep] = useState(null);
    const total = FEE_ITEMS.reduce((s, f) => s + f.amount, 0);

    return (
        <div className="space-y-8">

            {/* Fee Calculator */}
            <div className="p-6 rounded-[28px] bg-gradient-to-br from-slate-900 to-indigo-950 text-white overflow-hidden relative">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500 rounded-full blur-[60px] opacity-20" />
                <div className="flex items-center gap-2 mb-6 relative z-10">
                    <Calculator size={18} className="text-indigo-400" />
                    <h3 className="font-black text-sm uppercase tracking-widest text-indigo-300">সরকারি ফি ক্যালকুলেটর</h3>
                </div>
                <div className="space-y-3 mb-5 relative z-10">
                    {FEE_ITEMS.map((f) => (
                        <div key={f.label} className="flex items-center justify-between py-2 border-b border-white/10">
                            <span className="text-sm font-bold text-slate-300">{f.label}</span>
                            <span className="font-black text-white tabular-nums">{f.amount.toLocaleString('bn-BD')} ৳</span>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 relative z-10">
                    <span className="font-black text-sm text-indigo-200">মোট সরকারি ফি</span>
                    <span className="text-2xl font-black text-emerald-400 tabular-nums">{total.toLocaleString('bn-BD')} ৳</span>
                </div>
                <div className="mt-4 flex items-start gap-2 relative z-10">
                    <Shield size={14} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                        সতর্কতা: কোনো দালাল যদি এর বেশি টাকা চায়, তাহলে সরাসরি AC Land অফিসে অভিযোগ করুন।
                    </p>
                </div>
            </div>

            {/* Step-by-Step Roadmap */}
            <div>
                <h3 className="font-black text-slate-800 text-base mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-indigo-600" />
                    নামজারির ধাপে ধাপে গাইড
                </h3>
                <div className="space-y-3">
                    {STEPS.map((s, i) => (
                        <motion.div
                            key={s.step}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.07 }}
                        >
                            <button
                                type="button"
                                onClick={() => setActiveStep(activeStep === i ? null : i)}
                                className={`w-full flex items-center gap-4 p-4 rounded-[20px] border transition-all text-left ${
                                    activeStep === i ? `${s.bg} ${s.border}` : 'bg-white border-slate-100 hover:border-slate-200'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md`}>
                                    {s.step}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-black text-sm ${activeStep === i ? s.text : 'text-slate-700'}`}>{s.title}</p>
                                </div>
                                <ArrowRight size={16} className={`shrink-0 transition-transform ${activeStep === i ? 'rotate-90 ' + s.text : 'text-slate-300'}`} />
                            </button>

                            {activeStep === i && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className={`mx-2 px-5 py-4 rounded-b-[20px] ${s.bg} border-x border-b ${s.border} -mt-2`}
                                >
                                    <p className="text-xs font-bold text-slate-600 leading-relaxed mb-3">{s.desc}</p>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">প্রয়োজনীয় কাগজ:</p>
                                    <ul className="space-y-1.5">
                                        {s.docs.map((d) => (
                                            <li key={d} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                                <CheckCircle2 size={12} className={s.text} />
                                                {d}
                                            </li>
                                        ))}
                                    </ul>
                                    {s.link && (
                                        <a
                                            href={s.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${s.color} text-white text-xs font-black shadow-md hover:opacity-90 transition-opacity`}
                                        >
                                            {s.linkLabel}
                                            <ExternalLink size={12} />
                                        </a>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

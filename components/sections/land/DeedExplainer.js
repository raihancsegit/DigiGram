'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, ScanLine, CheckCircle2, AlertTriangle,
    User, Hash, MapPin, FileWarning, Sparkles, RefreshCw
} from 'lucide-react';

const MOCK_RESULT = {
    donor: 'মোঃ আব্দুল করিম (পিতা: মোঃ ইউসুফ আলী)',
    recipient: 'মোঃ রহিম উদ্দিন (পিতা: মোঃ সালাম)',
    plot: '৪৫৬/খ',
    khatian: '১২৩৪',
    mouza: 'বড়পাড়া মৌজা',
    area: '৩৩ শতাংশ',
    year: '২০১৫',
    warnings: ['দলিলের ৩ নং পৃষ্ঠায় একটি অংশ ঝাপসা — যাচাই করুন।'],
    clean: false,
};

export default function DeedExplainer() {
    const [stage, setStage] = useState('idle'); // idle | scanning | done
    const [preview, setPreview] = useState(null);
    const inputRef = useRef(null);

    function handleFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setPreview(URL.createObjectURL(file));
        setStage('scanning');
        setTimeout(() => setStage('done'), 3200);
    }

    function reset() {
        setStage('idle');
        setPreview(null);
        if (inputRef.current) inputRef.current.value = '';
    }

    return (
        <div className="space-y-6">
            {/* Upload Zone */}
            <AnimatePresence mode="wait">
                {stage === 'idle' && (
                    <motion.label
                        key="upload"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        htmlFor="deed-upload"
                        className="flex flex-col items-center justify-center gap-4 p-10 rounded-[28px] border-2 border-dashed border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer group"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Upload size={28} className="text-white" />
                        </div>
                        <div className="text-center">
                            <p className="font-black text-slate-700 text-base">দলিলের ছবি আপলোড করুন</p>
                            <p className="text-xs text-slate-400 font-medium mt-1">JPG, PNG সাপোর্টেড · সর্বোচ্চ ৫ MB</p>
                        </div>
                        <input ref={inputRef} id="deed-upload" type="file" accept="image/*" className="hidden" onChange={handleFile} />
                    </motion.label>
                )}

                {stage === 'scanning' && (
                    <motion.div
                        key="scanning"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="relative rounded-[28px] overflow-hidden border border-indigo-200 bg-slate-900"
                    >
                        {preview && <img src={preview} alt="deed" className="w-full max-h-64 object-cover opacity-40" />}
                        {/* Laser scan line */}
                        <motion.div
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 2.5, ease: 'linear', repeat: Infinity }}
                            className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_16px_4px_rgba(99,102,241,0.5)]"
                            style={{ top: '0%' }}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                                <ScanLine size={40} className="text-indigo-400" />
                            </motion.div>
                            <p className="text-white font-black text-sm tracking-widest uppercase">AI বিশ্লেষণ চলছে…</p>
                        </div>
                    </motion.div>
                )}

                {stage === 'done' && (
                    <motion.div
                        key="done"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-[28px] border border-emerald-200 bg-white overflow-hidden shadow-lg"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-emerald-600" />
                                <span className="font-black text-emerald-700 text-sm">বিশ্লেষণ সম্পন্ন</span>
                            </div>
                            <button onClick={reset} className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 hover:text-indigo-600 transition-colors">
                                <RefreshCw size={12} /> নতুন দলিল
                            </button>
                        </div>

                        {/* Result Grid */}
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { icon: User, label: 'দাতা (বিক্রেতা)', value: MOCK_RESULT.donor, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { icon: User, label: 'গ্রহীতা (ক্রেতা)', value: MOCK_RESULT.recipient, color: 'text-teal-600', bg: 'bg-teal-50' },
                                { icon: Hash, label: 'দাগ নম্বর', value: MOCK_RESULT.plot, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                { icon: Hash, label: 'খতিয়ান নম্বর', value: MOCK_RESULT.khatian, color: 'text-violet-600', bg: 'bg-violet-50' },
                                { icon: MapPin, label: 'মৌজা', value: MOCK_RESULT.mouza, color: 'text-orange-600', bg: 'bg-orange-50' },
                                { icon: MapPin, label: 'পরিমাণ / সাল', value: `${MOCK_RESULT.area} · ${MOCK_RESULT.year}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            ].map((r) => (
                                <div key={r.label} className={`flex items-start gap-3 p-3 rounded-2xl ${r.bg} border border-white`}>
                                    <div className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm`}>
                                        <r.icon size={14} className={r.color} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{r.label}</p>
                                        <p className="text-xs font-black text-slate-800 leading-snug">{r.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Warnings */}
                        {MOCK_RESULT.warnings.length > 0 && (
                            <div className="mx-6 mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileWarning size={16} className="text-amber-600" />
                                    <span className="text-xs font-black text-amber-700 uppercase tracking-wider">সতর্কতা</span>
                                </div>
                                {MOCK_RESULT.warnings.map((w, i) => (
                                    <p key={i} className="text-xs font-bold text-amber-700 leading-relaxed">{w}</p>
                                ))}
                            </div>
                        )}

                        {/* Disclaimer */}
                        <div className="mx-6 mb-6 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                            <Sparkles size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                                এই বিশ্লেষণ AI-চালিত এবং শুধু প্রাথমিক তথ্যের জন্য। আইনগত সিদ্ধান্তের জন্য অবশ্যই একজন নিবন্ধিত আইনজীবীর পরামর্শ নিন।
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

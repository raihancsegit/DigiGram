'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, ScanLine, CheckCircle2, AlertTriangle,
    User, Hash, MapPin, FileWarning, Sparkles,
    RefreshCw, FileText, Info
} from 'lucide-react';

/** Convert a browser File to base64 string (data portion only, no prefix) */
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // result = "data:image/jpeg;base64,AAAA..."
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function DeedExplainer() {
    const [stage, setStage] = useState('idle'); // idle | scanning | done | error
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const inputRef = useRef(null);

    async function handleFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        setPreview(URL.createObjectURL(file));
        setStage('scanning');
        setResult(null);
        setErrorMsg('');

        try {
            const imageBase64 = await fileToBase64(file);
            const mimeType = file.type || 'image/jpeg';

            const res = await fetch('/api/analyze-deed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64, mimeType }),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                throw new Error(data.error || 'API request failed');
            }

            if (data.parseError) {
                // Gemini returned text but not valid JSON — show raw
                setResult({ raw: data.raw });
            } else {
                setResult(data);
            }
            setStage('done');
        } catch (err) {
            setErrorMsg(err.message || 'বিশ্লেষণ করতে সমস্যা হয়েছে।');
            setStage('error');
        }
    }

    function reset() {
        setStage('idle');
        setPreview(null);
        setResult(null);
        setErrorMsg('');
        if (inputRef.current) inputRef.current.value = '';
    }

    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">

                {/* ── IDLE: Upload Zone ── */}
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
                        <div className="flex flex-wrap justify-center gap-2 mt-1">
                            {['ক্রয় দলিল', 'হেবা দলিল', 'খতিয়ান', 'বায়া দলিল'].map((t) => (
                                <span key={t} className="text-[10px] font-bold text-indigo-500 bg-indigo-100 px-2.5 py-1 rounded-full">{t}</span>
                            ))}
                        </div>
                        <input ref={inputRef} id="deed-upload" type="file" accept="image/*" className="hidden" onChange={handleFile} />
                    </motion.label>
                )}

                {/* ── SCANNING ── */}
                {stage === 'scanning' && (
                    <motion.div
                        key="scanning"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="relative rounded-[28px] overflow-hidden border border-indigo-200 bg-slate-900 min-h-[220px]"
                    >
                        {preview && (
                            <img src={preview} alt="deed preview" className="w-full max-h-64 object-cover opacity-30" />
                        )}
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
                            <p className="text-white font-black text-sm tracking-widest uppercase">Gemini AI বিশ্লেষণ চলছে…</p>
                            <p className="text-slate-400 text-xs font-bold">দলিলটি পড়া হচ্ছে, একটু অপেক্ষা করুন</p>
                        </div>
                    </motion.div>
                )}

                {/* ── ERROR ── */}
                {stage === 'error' && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-center"
                    >
                        <AlertTriangle size={32} className="text-rose-500 mx-auto mb-3" />
                        <p className="font-black text-rose-700 text-sm mb-1">বিশ্লেষণ ব্যর্থ হয়েছে</p>
                        <p className="text-xs text-rose-500 font-bold mb-4">{errorMsg}</p>
                        <button onClick={reset} className="px-5 py-2 rounded-2xl bg-rose-500 text-white text-xs font-black hover:bg-rose-600 transition-colors">
                            আবার চেষ্টা করুন
                        </button>
                    </motion.div>
                )}

                {/* ── DONE ── */}
                {stage === 'done' && result && (
                    <motion.div
                        key="done"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-[28px] border border-emerald-200 bg-white overflow-hidden shadow-lg"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-emerald-600" />
                                <span className="font-black text-emerald-700 text-sm">Gemini AI বিশ্লেষণ সম্পন্ন</span>
                            </div>
                            <button onClick={reset} className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 hover:text-indigo-600 transition-colors">
                                <RefreshCw size={12} /> নতুন দলিল
                            </button>
                        </div>

                        {/* Raw text fallback */}
                        {result.raw ? (
                            <div className="p-6">
                                <p className="text-xs font-bold text-slate-500 leading-relaxed whitespace-pre-wrap">{result.raw}</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary Banner */}
                                {result.summary && (
                                    <div className="mx-6 mt-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                            <Sparkles size={10} /> দলিলের সারমর্ম
                                        </p>
                                        <p className="text-xs font-bold text-indigo-800 leading-relaxed">{result.summary}</p>
                                    </div>
                                )}

                                {/* Extracted Fields Grid */}
                                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { icon: User,     label: 'দাতা / বিক্রেতা',     value: result.donor,     color: 'text-blue-600',    bg: 'bg-blue-50' },
                                        { icon: User,     label: 'গ্রহীতা / ক্রেতা',    value: result.recipient, color: 'text-teal-600',    bg: 'bg-teal-50' },
                                        { icon: Hash,     label: 'দাগ নম্বর',             value: result.plot,      color: 'text-indigo-600',  bg: 'bg-indigo-50' },
                                        { icon: Hash,     label: 'খতিয়ান নম্বর',         value: result.khatian,   color: 'text-violet-600',  bg: 'bg-violet-50' },
                                        { icon: MapPin,   label: 'মৌজা',                 value: result.mouza,     color: 'text-orange-600',  bg: 'bg-orange-50' },
                                        { icon: MapPin,   label: 'পরিমাণ',               value: result.area,      color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                        { icon: FileText, label: 'দলিলের ধরন',           value: result.docType,   color: 'text-rose-600',    bg: 'bg-rose-50' },
                                        { icon: FileText, label: 'সন / তারিখ',            value: result.year,      color: 'text-amber-600',   bg: 'bg-amber-50' },
                                    ].map((r) => (
                                        r.value && r.value !== 'পাওয়া যায়নি' ? (
                                            <div key={r.label} className={`flex items-start gap-3 p-3 rounded-2xl ${r.bg} border border-white`}>
                                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                                                    <r.icon size={14} className={r.color} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{r.label}</p>
                                                    <p className="text-xs font-black text-slate-800 leading-snug">{r.value}</p>
                                                </div>
                                            </div>
                                        ) : null
                                    ))}
                                </div>

                                {/* Warnings */}
                                {result.warnings?.length > 0 && (
                                    <div className="mx-6 mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileWarning size={16} className="text-amber-600" />
                                            <span className="text-xs font-black text-amber-700 uppercase tracking-wider">AI সতর্কতা</span>
                                        </div>
                                        {result.warnings.map((w, i) => (
                                            <p key={i} className="text-xs font-bold text-amber-700 leading-relaxed flex items-start gap-1.5 mb-1">
                                                <AlertTriangle size={11} className="mt-0.5 shrink-0" /> {w}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Disclaimer */}
                        <div className="mx-6 mb-6 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                            <Info size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                                এই বিশ্লেষণ Google Gemini AI দ্বারা স্বয়ংক্রিয়ভাবে তৈরি এবং শুধু প্রাথমিক তথ্যের জন্য। আইনগত সিদ্ধান্তের জন্য অবশ্যই একজন নিবন্ধিত আইনজীবীর পরামর্শ নিন।
                            </p>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}

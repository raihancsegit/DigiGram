"use client";

import { useState, useEffect } from 'react';
import { 
    Database, Trash2, Zap, ShieldAlert, CheckCircle2, 
    Loader2, Users, MapPin, Home, ArrowRight, Download, Upload,
    RefreshCw, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '@/lib/services/adminService';

export default function MaintenancePage() {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await adminService.getGlobalStats();
            // Also get household stats
            const { count: hCount } = await adminService.getGlobalLocationStats(); // This is a bit different, but let's use global stats for now
            setStats(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAction = async (action) => {
        const confirmMsg = action === 'wipe' 
            ? 'আপনি কি নিশ্চিত যে আপনি সব টেস্ট ডাটা মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না!' 
            : 'সিস্টেম এখন ৪টি ইউনিয়ন, ২৪টি ওয়ার্ড এবং ৪৮টি গ্রাম তৈরি করবে। এতে কিছুক্ষণ সময় লাগতে পারে। আপনি কি নিশ্চিত?';
        
        if (!confirm(confirmMsg)) return;

        setLoading(true);
        setStatus({ type: 'info', message: action === 'seed' ? 'ডাটা জেনারেট হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...' : 'ডাটা পরিষ্কার করা হচ্ছে...' });
        
        try {
            const response = await fetch('/api/admin/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            setStatus({ type: 'success', message: result.message });
            await loadStats();
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
                    <Database size={160} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-widest mb-2">
                        <Zap size={14} /> System Maintenance
                    </div>
                    <h1 className="text-3xl font-black text-slate-800">সিস্টেম টুলস ও ডাটা ম্যানেজমেন্ট</h1>
                    <p className="text-slate-500 font-bold mt-2">এখান থেকে আপনি সিস্টেমের টেস্টিং ডাটা জেনারেট এবং ক্লিন করতে পারবেন।</p>
                </div>
            </div>

            {/* Status Alert */}
            <AnimatePresence>
                {status.message && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-2xl flex items-center gap-3 border ${
                            status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                            status.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                            'bg-blue-50 border-blue-100 text-blue-700'
                        }`}
                    >
                        {status.type === 'success' ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
                        <p className="font-bold text-sm">{status.message}</p>
                        <button onClick={() => setStatus({ type: '', message: '' })} className="ml-auto text-xs font-black uppercase">বন্ধ করুন</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<MapPin />} label="ইউনিয়ন" value={stats?.unions} color="indigo" />
                <StatCard icon={<MapPin />} label="ওয়ার্ড" value={stats?.wards} color="teal" />
                <StatCard icon={<Home />} label="গ্রাম" value={stats?.villages} color="blue" />
                <StatCard icon={<Users />} label="ইউজার" value={stats?.users} color="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Seed Tool */}
                <section className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Database size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">টেস্ট ডাটা জেনারেশন</h3>
                            <p className="text-sm font-bold text-slate-400 mt-1">পূর্ণাঙ্গ হাইয়ারার্কি এবং হাউসহোল্ড ডাটা তৈরি করুন</p>
                        </div>
                    </div>

                    <ul className="space-y-4 mb-10 flex-1">
                        <FeatureItem text="৪টি স্যাম্পল ইউনিয়ন তৈরি" />
                        <FeatureItem text="প্রতি ইউনিয়নে ৬টি করে ওয়ার্ড (২৪টি)" />
                        <FeatureItem text="প্রতি ওয়ার্ডে ২টি করে গ্রাম (৪৮টি)" />
                        <FeatureItem text="প্রতি গ্রামে ৫০টি হাউসহোল্ড (২৪০০টি)" />
                        <FeatureItem text="প্রতি হাউসহোল্ডে ৩ জন পর্যন্ত সদস্য" />
                    </ul>

                    <button 
                        onClick={() => handleAction('seed')}
                        disabled={loading}
                        className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:grayscale"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                        জেনারেট করুন (Seed)
                    </button>
                </section>

                {/* Wipe Tool */}
                <section className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-600">
                            <Trash2 size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">সিস্টেম ক্লিনআপ</h3>
                            <p className="text-sm font-bold text-slate-400 mt-1">সব টেস্ট ডাটা মুছে দিয়ে ফ্রেশ স্টার্ট করুন</p>
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-rose-50 border border-rose-100 text-rose-700 mb-10 flex-1">
                        <div className="flex gap-3">
                            <AlertTriangle className="shrink-0" size={20} />
                            <div>
                                <p className="font-black text-sm uppercase mb-1">সতর্কবাণী</p>
                                <p className="text-xs font-bold leading-relaxed opacity-80">
                                    এটি ডিলিট করলে সব টেস্ট ইউনিয়ন, ওয়ার্ড, গ্রাম এবং সংশ্লিষ্ট সকল হাউসহোল্ড ও সদস্যদের ডাটা পার্মানেন্টলি মুছে যাবে। এটি রিয়েল ডাটার ওপর প্রভাব ফেলবে না (শুধু TEST- প্রিফিক্স যুক্ত ডাটা)।
                                </p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => handleAction('wipe')}
                        disabled={loading}
                        className="w-full py-5 border-2 border-rose-200 text-rose-600 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Trash2 size={20} />}
                        সব টেস্ট ডাটা মুছুন (Wipe)
                    </button>
                </section>
            </div>

            {/* Additional Tools */}
            <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden">
                <div className="absolute bottom-0 right-0 p-10 opacity-10">
                    <RefreshCw size={120} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <div>
                        <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                            <Download className="text-indigo-400" /> এক্সপোর্ট ও ব্যাকআপ
                        </h3>
                        <p className="text-slate-400 font-bold mb-8 leading-relaxed">
                            সিস্টেমের বর্তমান ডাটাবেজ স্টেট একটি JSON ফাইল হিসেবে এক্সপোর্ট করে রাখুন। পরবর্তীতে এটি রিস্টোর করতে ব্যবহার করা যাবে।
                        </p>
                        <button className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black transition-all flex items-center gap-3 border border-white/10">
                            ব্যাকআপ ফাইল ডাউনলোড করুন
                        </button>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <Upload size={20} />
                                </div>
                                <h4 className="font-black">রিস্টোর ডাটা</h4>
                            </div>
                            <p className="text-xs font-bold text-slate-500 mb-4">আগে থেকে সেভ করা ব্যাকআপ ফাইল আপলোড করুন</p>
                            <button className="w-full py-3 rounded-xl bg-indigo-600 text-sm font-black hover:bg-indigo-700 transition-all">ফাইল সিলেক্ট করুন</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    const colors = {
        indigo: 'text-indigo-600 bg-indigo-50',
        teal: 'text-teal-600 bg-teal-50',
        blue: 'text-blue-600 bg-blue-50',
        amber: 'text-amber-600 bg-amber-50'
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
                {icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{value || 0}</p>
        </div>
    );
}

function FeatureItem({ text }) {
    return (
        <li className="flex items-center gap-3 text-slate-600 font-bold text-sm">
            <CheckCircle2 size={16} className="text-emerald-500" />
            {text}
        </li>
    );
}

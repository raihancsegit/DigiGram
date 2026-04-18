"use client";

import { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, QrCode, CheckCircle2, AlertCircle,
    Clock, Fuel, UserCheck, ArrowRight, ShieldCheck,
    History, Users, RefreshCcw, Settings, FileDown,
    Lock, CheckCircle, Store, MapPin
} from 'lucide-react';
import { toBnDigits } from '@/lib/utils/format';
import {
    verifyBikeAction, authorizeRefillAction, getLiveQueueAction,
    getFuelLogsAction, updateOperatorPasswordAction,
    updateUnionFuelSettingsAction, getUnionFuelSettingsAction
} from '../actions';

export default function PumpOperatorPanel({ unionSlug, onLogout }) {
    const [activeTab, setActiveTab] = useState('verify'); // verify, queue, logs, settings
    const [searchQuery, setSearchQuery] = useState('');
    const [verificationResult, setVerificationResult] = useState(null);
    const [queue, setQueue] = useState([]);
    const [logs, setLogs] = useState([]);
    const [newPassword, setNewPassword] = useState('');
    const [rationingLimit, setRationingLimit] = useState(500);
    const [rationingDays, setRationingDays] = useState(3);
    const [isPending, startTransition] = useTransition();
    const [isRefilling, startRefillTransition] = useTransition();
    const [isUpdatingSettings, startSettingsTransition] = useTransition();

    useEffect(() => {
        setSearchQuery('');
    }, [activeTab]);

    // Fetch queue and logs
    const fetchQueue = async () => {
        const res = await getLiveQueueAction(unionSlug);
        if (res.success) setQueue(res.data);
    };

    const fetchLogs = async () => {
        const res = await getFuelLogsAction(unionSlug);
        if (res.success) setLogs(res.data);
    };

    const fetchSettings = async () => {
        const res = await getUnionFuelSettingsAction(unionSlug);
        if (res.success) {
            setRationingLimit(res.data.limit);
            setRationingDays(res.data.days);
        }
    };

    useEffect(() => {
        fetchQueue();
        fetchSettings();
        if (activeTab === 'logs') fetchLogs();
        const interval = setInterval(fetchQueue, 30000);
        return () => clearInterval(interval);
    }, [unionSlug, activeTab]);

    const handleVerify = async (e) => {
        e?.preventDefault();
        if (!searchQuery) return;

        startTransition(async () => {
            const res = await verifyBikeAction(searchQuery);
            if (res.success) {
                setVerificationResult(res.data);
            } else {
                alert(res.error);
            }
        });
    };

    const handleConfirmRefill = async () => {
        if (!verificationResult || verificationResult.status !== 'eligible') return;

        startRefillTransition(async () => {
            const res = await authorizeRefillAction(verificationResult.bikeNumber, rationingLimit, unionSlug);
            if (res.success) {
                setVerificationResult(null);
                setSearchQuery('');
                fetchQueue();
                fetchLogs();
                alert('তেল বরাদ্দ সফলভাবে নথিভুক্ত করা হয়েছে!');
            } else {
                alert(res.error);
            }
        });
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (newPassword.length < 4) return alert('কমপক্ষে ৪ ডিজিট লিখুন।');

        const res = await updateOperatorPasswordAction(unionSlug, newPassword);
        if (res.success) {
            alert('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।');
            setNewPassword('');
        } else {
            alert(res.error);
        }
    };

    const handleSettingsUpdate = async (e) => {
        // ... handled previously
        e.preventDefault();
        startSettingsTransition(async () => {
            const res = await updateUnionFuelSettingsAction(unionSlug, {
                limit: parseInt(rationingLimit),
                days: parseInt(rationingDays)
            });
            if (res.success) {
                alert('রেশনিং সেটিংস আপডেট করা হয়েছে।');
            } else {
                alert(res.error);
            }
        });
    };

    const handleCompleteRefill = async (bike) => {
        startRefillTransition(async () => {
            const res = await authorizeRefillAction(bike, rationingLimit, unionSlug);
            if (res.success) {
                fetchQueue();
                if (activeTab === 'logs') fetchLogs();
            } else {
                alert(res.error);
            }
        });
    };

    const downloadCSV = () => {
        const headers = ["Date", "Action", "Details"];
        const rows = logs.map(log => [
            new Date(log.created_at).toLocaleString('bn-BD'),
            log.action_type,
            JSON.stringify(log.details).replace(/,/g, ';')
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `fuel_logs_${unionSlug}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-slate-900 overflow-hidden rounded-[40px] shadow-2xl">
                <div className="p-8 flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-amber-500 rounded-[20px] shadow-lg shadow-amber-500/20 flex items-center justify-center">
                            <Fuel size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight leading-none">ডিজি-ফুয়েল প্যানেল</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <ShieldCheck size={12} className="text-emerald-500" /> ওপারেটর: {unionSlug}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {onLogout && (
                            <button onClick={onLogout} className="px-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest hidden md:block">
                                লগআউট
                            </button>
                        )}
                        <button onClick={fetchQueue} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all">
                            <RefreshCcw size={20} className={isPending ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Sub-Nav */}
                <div className="px-4 pb-4 overflow-x-auto no-scrollbar w-full">
                    <div className="flex gap-2 w-max">
                        {[
                            { id: 'verify', label: 'ভেরিফিকেশন', icon: Search },
                            { id: 'queue', label: 'লাইভ সিরিয়াল', icon: Users },
                            { id: 'logs', label: 'অ্যাক্টিভিটি লগ', icon: History },
                            { id: 'settings', label: 'সেটিংস', icon: Settings },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full font-black text-xs transition-all shrink-0 ${activeTab === tab.id ? 'bg-amber-500 text-slate-900 shadow-xl shadow-amber-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'verify' && (
                    <motion.div
                        key="verify"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                    >
                        {/* Left: Verification Section */}
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
                                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                    <Search size={20} className="text-amber-500" /> বাইক যাচাই করুন
                                </h3>

                                <form onSubmit={handleVerify} className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="বাইক নম্বর লিখুন..."
                                            className="w-full pl-14 pr-6 py-5 rounded-3xl bg-slate-50 border border-slate-200 focus:border-amber-500 outline-none font-black text-lg transition-all"
                                        />
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                                            <QrCode size={24} />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isPending}
                                        className="w-full py-5 rounded-3xl bg-slate-900 text-white font-black text-lg shadow-xl shadow-slate-200 active:scale-95 transition-all"
                                    >
                                        {isPending ? 'যাচাই হচ্ছে...' : 'ভেরিফাই করুন'}
                                    </button>
                                </form>
                            </div>

                            {/* Result Card */}
                            <AnimatePresence mode="wait">
                                {verificationResult && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className={`p-8 rounded-[40px] border shadow-2xl ${verificationResult.status === 'eligible'
                                                ? 'bg-emerald-50 border-emerald-100'
                                                : 'bg-rose-50 border-rose-100'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-8">
                                            <div className={`p-4 rounded-2xl ${verificationResult.status === 'eligible' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                                {verificationResult.status === 'eligible' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase">বাইক নম্বর</p>
                                                <p className="text-xl font-black text-slate-800">{verificationResult.bikeNumber}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <h4 className={`text-xl font-black ${verificationResult.status === 'eligible' ? 'text-emerald-800' : 'text-rose-800'}`}>
                                                {verificationResult.message}
                                            </h4>

                                            {verificationResult.token && (
                                                <div className="p-4 rounded-2xl bg-white/50 border border-white flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase">সিরিয়াল</p>
                                                        <p className="text-2xl font-black text-slate-800">{toBnDigits(verificationResult.token.serial_number)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase">স্লট</p>
                                                        <p className="text-sm font-black text-slate-800">{verificationResult.token.slot_time}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {verificationResult.status === 'eligible' && (
                                            <button
                                                onClick={handleConfirmRefill}
                                                disabled={isRefilling}
                                                className="w-full py-5 rounded-3xl bg-emerald-600 text-white font-black text-lg shadow-xl shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isRefilling ? 'প্রসেসিং...' : <>তেল বরাদ্দ সম্পন্ন <ArrowRight size={20} /></>}
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'queue' && (
                    <motion.div
                        key="queue"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl"
                    >
                        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center justify-between">
                            <span className="flex items-center gap-2"><Users size={20} className="text-amber-500" /> লাইভ সিরিয়াল লিস্ট</span>
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-3 py-1 rounded-full">{toBnDigits(queue.length)} জন বাকি</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {queue.map((item) => (
                                <div key={item.id} className="p-5 rounded-[24px] bg-slate-50 border border-slate-100 flex flex-col md:flex-row items-center justify-between group hover:bg-white hover:border-amber-200 transition-all gap-4">
                                    <div className="flex items-center w-full md:w-auto gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-slate-400 font-black text-2xl group-hover:text-amber-600 shadow-sm transition-all border border-slate-100 group-hover:border-amber-100">
                                            {toBnDigits(item.serial_number)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm md:text-base font-black text-slate-800">{item.bike_number}</p>
                                            <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-1"><Clock size={12} className="text-amber-500"/> {item.slot_time}</p>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-auto flex gap-2">
                                        <button 
                                            onClick={() => handleCompleteRefill(item.bike_number)}
                                            disabled={isRefilling}
                                            className="w-full md:w-auto px-6 py-4 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 active:scale-95"
                                        >
                                            তেল দেওয়া হয়েছে
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'logs' && (
                    <motion.div
                        key="logs"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <History size={20} className="text-amber-500" /> কার্যক্রমের লগ
                            </h3>
                            <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 font-black text-xs hover:bg-emerald-100 transition-all">
                                <FileDown size={14} /> এক্সপোর্ট (CSV)
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {logs.map((log) => (
                                <div key={log.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${
                                            log.action_type === 'REFILL_CONFIRMED' ? 'bg-emerald-100 text-emerald-600' :
                                            log.action_type === 'TOKEN_ISSUED' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                            <History size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 mb-1">
                                                {log.action_type === 'REFILL_CONFIRMED' ? 'তেল প্রদান সম্পন্ন' :
                                                 log.action_type === 'TOKEN_ISSUED' ? 'টোকেন ইস্যু করা হয়েছে' : 'সেটিংস আপডেট'}
                                            </p>
                                            <p className="text-xs font-bold text-slate-500">
                                                {log.details.bike ? `বাইক: ${log.details.bike}` : 'সিস্টেম অ্যাক্টিভিটি'} |  {new Date(log.created_at).toLocaleString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                            log.action_type === 'REFILL_CONFIRMED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            log.action_type === 'TOKEN_ISSUED' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                        }`}>
                                        {log.action_type === 'REFILL_CONFIRMED' ? '+ রিফিল' :
                                         log.action_type === 'TOKEN_ISSUED' ? 'টোকেন' : 'অন্যান্য'}
                                    </div>
                                </div>
                            ))}
                            {logs.length === 0 && <p className="text-center text-slate-400 p-10 font-bold">কোনো লগ পাওয়া যায়নি।</p>}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div
                        key="settings"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        {/* Password Update */}
                        <form onSubmit={handlePasswordUpdate} className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                    <Lock size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800">অপারেটর পিন</h3>
                            </div>
                            <div className="space-y-4">
                                <p className="text-xs font-medium text-slate-500 italic">৪ ডিজিটের নতুন পিন কোড সেট করুন।</p>
                                <input
                                    type="password"
                                    maxLength={4}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="নতুন পিন"
                                    className="w-full px-8 py-5 rounded-[24px] bg-slate-50 border border-slate-200 outline-none focus:border-amber-500 font-black text-2xl text-center tracking-[0.5em]"
                                />
                                <button type="submit" className="w-full py-5 rounded-[24px] bg-slate-900 text-white font-black hover:bg-amber-600 transition-all shadow-xl shadow-slate-200">পিন আপডেট করুন</button>
                            </div>
                        </form>

                        {/* Rationing Config */}
                        <form onSubmit={handleSettingsUpdate} className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                                    <ShieldCheck size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800">রেশনিং রুলস</h3>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">সর্বোচ্চ বরাদ্দ (টাকা)</label>
                                    <input
                                        type="number"
                                        value={rationingLimit}
                                        onChange={(e) => setRationingLimit(e.target.value)}
                                        placeholder="৫০০"
                                        className="w-full px-8 py-4 rounded-[24px] bg-slate-50 border border-slate-200 outline-none focus:border-amber-500 font-black text-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">রেশনিং সময় (দিন)</label>
                                    <input
                                        type="number"
                                        value={rationingDays}
                                        onChange={(e) => setRationingDays(e.target.value)}
                                        placeholder="৩"
                                        className="w-full px-8 py-4 rounded-[24px] bg-slate-50 border border-slate-200 outline-none focus:border-amber-500 font-black text-xl"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isUpdatingSettings}
                                    className="w-full py-5 rounded-[24px] bg-amber-500 text-slate-900 font-black hover:bg-amber-600 transition-all shadow-xl shadow-amber-200"
                                >
                                    {isUpdatingSettings ? 'আপডেট হচ্ছে...' : 'সেটিংস সেভ করুন'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Info Banner */}
            <div className="p-6 bg-slate-100 rounded-[32px] border border-slate-200 flex items-start gap-4 mt-8">
                <ShieldCheck size={24} className="text-slate-400 shrink-0" />
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                    Smart Fuel Rationing Audit: Every action is logged for security.
                </p>
            </div>
        </div>
    );
}

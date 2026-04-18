"use client";

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck, Car, Search, QrCode, 
    AlertTriangle, History, Calendar, 
    FileText, Camera, CheckCircle2, 
    ArrowRight, MessageSquare, ExternalLink,
    Loader2, Trash2
} from 'lucide-react';
import { toBnDigits } from '@/lib/utils/format';
import { analyzeVehicleDocAction } from '../actions';

export default function VehicleGuardView({ unionSlug }) {
    const [activeTab, setActiveTab] = useState('verify');
    const [isPending, startTransition] = useTransition();
    const [scanResult, setScanResult] = useState(null);
    const [bikeSearch, setBikeSearch] = useState('');

    // Mock Vehicles for UI representation (In real app, fetch from Supabase)
    const [myVehicles, setMyVehicles] = useState([
        { id: 1, bike_number: 'ঢাকা মেট্রো-হ ১১-২২৩৩', owner: 'মোঃ আব্দুল কাইয়ুম', expiry: '2026-05-15', status: 'valid' },
        { id: 2, bike_number: 'ঢাকা মেট্রো-ল ৪৪-৫৫৬৬', owner: 'মোঃ আব্দুল কাইয়ুম', expiry: '2026-04-10', status: 'expired' }
    ]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        startTransition(async () => {
            const res = await analyzeVehicleDocAction(formData);
            if (res.success) {
                setScanResult(res.data);
                // Add to mock list for demo
                setMyVehicles([{
                    id: Date.now(),
                    bike_number: res.data.bike_number,
                    owner: res.data.owner_name,
                    expiry: res.data.expiry_date,
                    status: new Date(res.data.expiry_date) > new Date() ? 'valid' : 'expired'
                }, ...myVehicles]);
            } else {
                alert(res.error);
            }
        });
    };

    const sendSmsVerification = (number) => {
        const format = `BRTA REG ${number}`;
        window.location.href = `sms:26969?body=${encodeURIComponent(format)}`;
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="relative overflow-hidden p-8 md:p-14 rounded-[48px] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 bg-indigo-500/10 backdrop-blur-md px-4 py-1.5 rounded-full w-fit border border-indigo-500/20">
                            <ShieldCheck size={16} className="text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">ডিজি-বাহন সুরক্ষা মডিউল</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                            স্মার্ট <span className="text-indigo-400">বাহন-গার্ড</span>
                        </h1>
                        <p className="text-slate-400 max-w-xl font-medium">গাড়ির বৈধতা যাচাই করুন, আল ফরোয়ার্ডের মাধ্যমে কাগজের মেয়াদ ট্র্যাক করুন এবং জালিয়াতি মুক্ত কেনা-বেচা নিশ্চিত করুন।</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-4 p-2 bg-slate-100 rounded-[32px] w-fit">
                {[
                    { id: 'verify', label: 'ভেরিফিকেশন', icon: Search },
                    { id: 'my-vehicles', label: 'আমার বাহন', icon: Car },
                    { id: 'ai-scanner', label: 'এআই স্ক্যানার', icon: Camera },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-6 py-4 rounded-[24px] font-black text-sm transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            <AnimatePresence mode="wait">
                {activeTab === 'verify' && (
                    <motion.div key="verify" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-10 rounded-[48px] bg-white border border-slate-100 shadow-xl space-y-6">
                            <h3 className="text-xl font-black text-slate-800">BRTA ভেরিফিকেশন (SMS)</h3>
                            <p className="text-slate-500 text-sm font-medium">নিচে বাইক নম্বর দিন, অ্যাপ অটোমেটিক সরকারি ফরম্যাটে SMS তৈরি করে দিবে।</p>
                            <input 
                                value={bikeSearch}
                                onChange={(e) => setBikeSearch(e.target.value)}
                                placeholder="উদা: ঢাকা মেট্রো-হ ১১-২২৩৩"
                                className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500 font-bold"
                            />
                            <button 
                                onClick={() => sendSmsVerification(bikeSearch)}
                                className="w-full py-5 rounded-3xl bg-slate-900 text-white font-black flex items-center justify-center gap-3 active:scale-95 transition-all"
                            >
                                <MessageSquare size={20} /> SMS পাঠান (২৬৯৬৯)
                            </button>
                        </div>

                        <div className="p-10 rounded-[48px] bg-indigo-50 border border-indigo-100 shadow-xl space-y-6 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-black text-indigo-900">সরাসরি ওয়েব ট্র্যাকিং</h3>
                                <p className="text-indigo-800/70 text-sm font-medium mt-2">BRTA সার্ভিস পোর্টাল থেকে বিস্তারিত তথ্য জানার জন্য নিচের বাটনটি ব্যবহার করুন।</p>
                            </div>
                            <a 
                                href="https://bsp.brta.gov.bd/" 
                                target="_blank"
                                className="w-full py-5 rounded-3xl bg-white text-indigo-600 border border-indigo-200 font-black flex items-center justify-center gap-3 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            >
                                <ExternalLink size={20} /> BRTA পোর্টাল খুলুন
                            </a>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'my-vehicles' && (
                    <motion.div key="my-vehicles" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {myVehicles.map(vehicle => {
                            const isExpired = new Date(vehicle.expiry) < new Date();
                            const daysLeft = Math.ceil((new Date(vehicle.expiry) - new Date()) / (1000 * 60 * 60 * 24));

                            return (
                                <div key={vehicle.id} className="p-8 rounded-[40px] bg-white border border-slate-100 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 group">
                                    <div className="flex items-center gap-6 w-full">
                                        <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center ${isExpired ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                            <Car size={36} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-2xl font-black text-slate-800">{vehicle.bike_number}</h4>
                                                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isExpired ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                                    {isExpired ? ' expired ' : ' active '}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 font-bold text-xs">{vehicle.owner}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">ট্যাক্স টোকেন মেয়াদ</p>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className={isExpired ? 'text-rose-500' : 'text-emerald-500'} />
                                                <p className={`font-black ${isExpired ? 'text-rose-600' : 'text-slate-800'}`}>
                                                    {new Date(vehicle.expiry).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <p className={`text-[10px] font-bold mt-1 ${isExpired ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {isExpired ? `${Math.abs(daysLeft)} দিন আগে শেষ হয়েছে` : `${daysLeft} দিন অবশিষ্ট`}
                                            </p>
                                        </div>
                                        <button className="p-4 rounded-2xl bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                )}

                {activeTab === 'ai-scanner' && (
                    <motion.div key="ai-scanner" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
                        {!scanResult ? (
                            <div className="p-12 rounded-[50px] bg-white border-2 border-dashed border-slate-200 text-center space-y-8 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 space-y-6">
                                    <div className="w-24 h-24 bg-indigo-50 rounded-[40px] flex items-center justify-center mx-auto text-indigo-500">
                                        <Camera size={48} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-slate-800">স্মার্ট ডকুমেন্ট স্ক্যানার</h3>
                                        <p className="text-slate-500 font-medium">আপনার ট্যাক্স টোকেনের ছবি আপলোড করুন। Gemini AI স্বয়ংক্রিয়ভাবে তথ্য বের করে নিবে।</p>
                                    </div>
                                    
                                    <label className="block w-full">
                                        <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                                        <div className="w-full py-6 rounded-3xl bg-indigo-600 text-white font-black text-lg shadow-xl shadow-indigo-200 cursor-pointer active:scale-95 transition-all">
                                            {isPending ? <Loader2 className="animate-spin mx-auto" /> : 'ফাইল আপলোড করুন'}
                                        </div>
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-10 rounded-[50px] bg-emerald-50 border border-emerald-100 shadow-2xl space-y-8 text-center">
                                <CheckCircle2 size={64} className="text-emerald-500 mx-auto" />
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black text-slate-800">স্ক্যান সফল হয়েছে!</h3>
                                    <p className="text-emerald-700 font-bold">AI স্বয়ংক্রিয়ভাবে বাহনটি সেভ করে নিয়েছে।</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <div className="p-6 rounded-3xl bg-white border border-emerald-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">বাহন নম্বর</p>
                                        <p className="text-lg font-black text-slate-800">{scanResult.bike_number}</p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-white border border-emerald-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">মালিকের নাম</p>
                                        <p className="text-lg font-black text-slate-800">{scanResult.owner_name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setScanResult(null)} className="text-slate-400 font-black text-sm uppercase tracking-widest">নতুন স্ক্যান</button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-10 rounded-[48px] bg-indigo-900 text-white flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-2xl font-black italic">FuelPass Protection সচল আছে!</h3>
                    <p className="text-indigo-300 font-medium">কাগজের মেয়াদ না থাকলেও তেল পাবেন, তবে পাম্পে ভলান্টিয়ারের কাছে সতর্কবার্তা যাবে।</p>
                </div>
                <div className="px-8 py-4 rounded-2xl bg-indigo-500/20 border border-indigo-400/50 backdrop-blur-md">
                    <p className="text-xs font-black uppercase tracking-widest">Auto Verification: Active</p>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FUEL_PUMPS, FUEL_RETAILERS } from '@/lib/constants/fuelData';
import { findUnionBySlug } from '@/lib/constants/locations';
import { 
    Clock, Fuel, UserCheck, ArrowRight, ShieldCheck, 
    Ticket, QrCode, ArrowRight as ArrowRightIcon, UserCheck as UserCheckIcon, 
    BarChart3, AlertTriangle, Phone, Map as MapIcon, Info, X, Store, MapPin, AlertCircle
} from 'lucide-react';
import { toBnDigits } from '@/lib/utils/format';
import { 
    requestFuelTokenAction, getLivePumpsAction, authorizeRefillAction, 
    getFuelPassAction, getLiveQueueAction 
} from '../actions';

export function FuelPortalView({ unionSlug }) {
    const unionInfo = findUnionBySlug(unionSlug);
    const [activeTab, setActiveTab] = useState('tracker'); 
    const [isPending, startTransition] = useTransition();
    const [token, setToken] = useState(null);
    const [error, setError] = useState(null);
    const [pumps, setPumps] = useState([]);
    const [bikeNumber, setBikeNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [passData, setPassData] = useState(null);
    const [isSearchingPass, setIsSearchingPass] = useState(false);
    const [queue, setQueue] = useState([]);
    const [isLoadingQueue, setIsLoadingQueue] = useState(false);
    
    // Admin/Volunteer Simulation State
    const [isVolunteerMode, setIsVolunteerMode] = useState(false);
    const [volunteerPin, setVolunteerPin] = useState('');
    const [showReportModal, setShowReportModal] = useState(null);

    const unionRetailers = FUEL_RETAILERS.filter(r => r.unionSlug === unionSlug);

    // Demonstration of Batch Loading (N+1 Prevention)
    useEffect(() => {
        const loadData = async () => {
            const result = await getLivePumpsAction(unionSlug);
            if (result.success) setPumps(result.data);
            else setPumps(FUEL_PUMPS.filter(p => p.unionSlug === unionSlug));
        };
        loadData();
    }, [unionSlug]);

    const handleGenerateToken = async (e) => {
        e.preventDefault();
        setError(null);

        const formData = new FormData();
        formData.append('bikeNumber', bikeNumber);
        formData.append('phone', phoneNumber);
        formData.append('unionSlug', unionSlug);

        startTransition(async () => {
            const result = await requestFuelTokenAction(formData);
            if (result.success) {
                setToken(result.data);
                setError(null);
            } else {
                setError(result.error);
                setToken(null);
            }
        });
    };

    const handleVolunteerRefill = async (bike, amount) => {
        startTransition(async () => {
            const result = await authorizeRefillAction(bike, amount);
            if (result.success) {
                alert(result.message);
                if (passData && passData.bikeNumber === bike) handleFetchPass(bike);
            } else {
                alert(result.error);
            }
        });
    };

    const handleFetchPass = async (bike = bikeNumber) => {
        if (!bike) return;
        setIsSearchingPass(true);
        const result = await getFuelPassAction(bike, unionSlug);
        setIsSearchingPass(false);
        if (result.success) {
            setPassData(result.data);
            setActiveTab('pass');
        } else {
            alert(result.error);
        }
    };

    const fetchQueue = async () => {
        setIsLoadingQueue(true);
        const res = await getLiveQueueAction(unionSlug);
        if (res.success) setQueue(res.data);
        setIsLoadingQueue(false);
    };

    useEffect(() => {
        if (activeTab === 'pass' && bikeNumber && !passData) {
            handleFetchPass(bikeNumber);
        }
        if (activeTab === 'queue') {
            fetchQueue();
        }
    }, [activeTab]);

    if (!unionInfo) return null;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Sleek Mobile-First Hero Header */}
            <div className="relative overflow-hidden p-6 md:p-12 rounded-[32px] md:rounded-[48px] bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full w-fit border border-white/10">
                        <Fuel size={14} className="text-amber-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-100">{unionInfo.name} ফুয়েল সার্ভিস</span>
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                            ডিজিটাল <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500">ফুয়েল পাস</span>
                        </h1>
                        <p className="text-slate-300 max-w-sm mt-3 text-sm md:text-base font-medium leading-relaxed">স্মার্ট তেলের লাইন! সিরিয়াল বুক করুন এবং আপনার জ্বালানির রেকর্ড ডিজিটালভাবে সেভ রাখুন।</p>
                    </div>
                </div>
            </div>

            {/* Volunteer Mode Banner */}
            <AnimatePresence>
                {isVolunteerMode && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-6 bg-rose-600 text-white rounded-[32px] flex items-center justify-between shadow-2xl shadow-rose-900/20 max-w-2xl mx-auto"
                    >
                        <div className="flex items-center gap-4 text-left">
                            <div className="p-3 rounded-2xl bg-white/10">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h4 className="font-black italic">ভলান্টিয়ার মোড সক্রিয়</h4>
                                <p className="text-[10px] text-rose-100 font-bold uppercase tracking-widest">বাইক নম্বর দিয়ে সরাসরি তেল বরাদ্দ দিন।</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsVolunteerMode(false)}
                            className="px-6 py-2 rounded-xl bg-white/20 font-black text-xs hover:bg-white/30 transition-all uppercase tracking-widest"
                        >বন্ধ করুন</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Horizontal Scrollable Navigation Tabs */}
            <div className="w-full overflow-x-auto no-scrollbar py-2 -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex gap-2 bg-slate-100 p-2 rounded-[32px] w-max border border-slate-200/50">
                    {[
                        { id: 'token', label: 'ই-টোকেন', icon: Ticket },
                        { id: 'queue', label: 'লাইভ সিরিয়াল', icon: Clock },
                        { id: 'pass', label: 'ফুয়েল পাস', icon: QrCode },
                        { id: 'tracker', label: 'ফুয়েল ট্র্যাকার', icon: BarChart3 },
                        { id: 'retailers', label: 'বিক্রেতা', icon: Store },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-[24px] font-black text-sm transition-all shrink-0 ${activeTab === tab.id ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xl shadow-amber-500/20' : 'bg-transparent text-slate-500 hover:bg-white hover:text-slate-800'}`}
                        >
                            <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'tracker' && (
                    <motion.div
                        key="tracker"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {isVolunteerMode && (
                            <div className="p-10 rounded-[48px] bg-white border-2 border-dashed border-rose-200 text-center space-y-6 shadow-inner">
                                <div className="space-y-2">
                                    <p className="font-black text-slate-800 text-xl tracking-tight">ভলান্টিয়ার: সরাসরি তেল বরাদ্দ দিন</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">ইউজারের বাইক নম্বর যাচাই করে ৫ লিটার তেল রিফিল নথিভুক্ত করুন।</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                                    <input 
                                        placeholder="বাইক নম্বর লিখুন (উদা: ঢাকা মেট্রো-হ ১১-২২৩৩)" 
                                        className="flex-1 px-8 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-rose-300 font-bold text-sm" 
                                        id="vol_bike" 
                                    />
                                    <button 
                                        onClick={() => handleVolunteerRefill(document.getElementById('vol_bike').value, 5)}
                                        className="px-8 py-4 bg-rose-600 text-white font-black rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all uppercase text-xs tracking-widest"
                                    >Refill 5L</button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pumps.map((pump) => (
                                <div key={pump.id} className="p-8 rounded-[48px] bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 hover:-translate-y-2 transition-transform duration-500 overflow-hidden relative group">
                                    <div className={`absolute top-0 left-0 w-2 h-full ${pump.status === 'Available' ? 'bg-emerald-500' : pump.status === 'Low' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                    
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="p-4 rounded-3xl bg-slate-50 text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 shadow-inner transition-colors">
                                            <Fuel size={32} />
                                        </div>
                                        <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${pump.status === 'Available' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : pump.status === 'Low' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                            {pump.status === 'Available' ? 'তেল আছে' : pump.status === 'Low' ? 'সীমিত' : 'শেষ'}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{pump.name}</h3>
                                            <p className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                                                <MapPin size={12} /> {pump.location} · {pump.distance}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 py-4 border-y border-slate-50">
                                            {['octane', 'diesel', 'petrol'].map((type) => (
                                                <div key={type} className="space-y-1 text-center">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{type === 'octane' ? 'অকটেন' : type === 'diesel' ? 'ডিজেল' : 'পেট্রোল'}</p>
                                                    <div className={`w-1.5 h-1.5 rounded-full mx-auto ${pump[type]?.status === 'Available' ? 'bg-emerald-500' : pump[type]?.status === 'Low' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                                    <p className="text-[9px] font-black text-slate-900">৳{toBnDigits(pump[type]?.price || 0)}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                    <Clock size={14} />
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-400 italic">আপডেট: {toBnDigits(2)} ঘণ্টা আগে</p>
                                            </div>
                                            <button className="p-3 rounded-2xl bg-slate-900 text-white hover:bg-amber-600 transition-all shadow-lg">
                                                <MapIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'token' && (
                    <motion.div
                        key="token"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-2xl mx-auto"
                    >
                        {!token ? (
                            <form onSubmit={handleGenerateToken} className="p-10 rounded-[48px] bg-white border border-slate-100 shadow-2xl text-center space-y-8">
                                <div className="w-20 h-20 bg-amber-50 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
                                    <Ticket size={40} className="text-amber-600" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">ই-টোকেন সিরিয়াল নিন</h2>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">পাম্পে লাইনে দাঁড়িয়ে না থেকে আগেই আপনার সিরিয়াল এবং স্লট নিশ্চিত করুন।</p>
                                </div>
                                
                                <div className="space-y-5 text-left">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2">বাইক/গাড়ির নম্বর</label>
                                        <input 
                                            type="text" 
                                            value={bikeNumber}
                                            onChange={(e) => setBikeNumber(e.target.value)}
                                            placeholder="উদা: ঢাকা মেট্রো-হ ১১-২২৩৩"
                                            required
                                            className="w-full px-6 py-5 rounded-full bg-slate-50 border-2 border-slate-100 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all font-black text-lg placeholder:text-slate-300 md:text-xl"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2">মোবাইল নম্বর</label>
                                        <input 
                                            type="tel" 
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="উদা: 01xxxxxxxxx"
                                            required
                                            className="w-full px-6 py-5 rounded-full bg-slate-50 border-2 border-slate-100 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all font-black text-lg placeholder:text-slate-300 md:text-xl"
                                        />
                                    </div>
                                    {error && (
                                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex gap-3 italic text-xs font-black">
                                            <AlertTriangle size={16} /> {error}
                                        </motion.div>
                                    )}
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full py-6 rounded-[24px] bg-slate-900 text-white font-black text-base relative overflow-hidden group active:scale-95 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {isPending ? "যাচাই করা হচ্ছে..." : <>টোকেন জেনারেট করুন <ArrowRight size={20} /></>}
                                    </span>
                                </button>
                            </form>
                        ) : (
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-white rounded-[48px] p-10 text-center shadow-2xl border border-slate-100 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                     <h3 className="text-xl font-black text-slate-800 mb-1">টোকেন সফলভাবে ইস্যু করা হয়েছে!</h3>
                                     <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-10">পাম্পে উপস্থিত হওয়ার আগে সিরিয়ালটি সংরক্ষণ করুন</p>
                                     <p className="text-[10px] font-black text-amber-600 mb-4 bg-amber-50 py-2 rounded-xl">তারিখ: {token.date}</p>
                                     
                                     <div className="grid grid-cols-2 gap-4 mb-8">
                                         <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 text-right">
                                             <p className="text-[10px] font-black text-slate-400 uppercase mb-1">সিরিয়াল নম্বর</p>
                                             <p className="text-4xl font-black text-amber-600 leading-none">{toBnDigits(token.serial)}</p>
                                         </div>
                                         <div className="p-8 rounded-[32px] bg-slate-900 border border-slate-800 text-left text-white">
                                             <p className="text-[10px] font-black text-slate-500 uppercase mb-1">বাইক নম্বর</p>
                                             <p className="text-sm font-black italic">{token.bikeNumber}</p>
                                         </div>
                                     </div>

                                     <div className="p-8 rounded-[32px] bg-emerald-50 border border-emerald-100 space-y-2 mb-8">
                                         <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">আপনার নির্ধারিত টাইম স্লট</p>
                                         <p className="text-3xl font-black text-slate-800">{token.slot}</p>
                                         <p className="text-[10px] font-bold text-emerald-600 italic">আইডি: {token.id}</p>
                                     </div>

                                     {token.warning && (
                                         <div className="p-6 rounded-[32px] bg-rose-50 border border-rose-100 text-rose-600 space-y-2 mb-8 animate-pulse text-left">
                                             <div className="flex items-center gap-2">
                                                 <AlertTriangle size={20} />
                                                 <p className="font-black text-sm">গুরুত্বপূর্ণ সতর্কবার্তা</p>
                                             </div>
                                             <p className="text-xs font-bold leading-relaxed">{token.warning}</p>
                                         </div>
                                     )}

                                <button 
                                    onClick={() => {setToken(null); setBikeNumber(''); setPhoneNumber('');}}
                                    className="text-slate-400 text-xs font-black hover:text-slate-600 transition-colors uppercase tracking-widest"
                                >নতুন টোকেন নিন</button>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'pass' && (
                    <motion.div
                        key="pass"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-md mx-auto space-y-8"
                    >
                        {!passData ? (
                            <div className="p-10 rounded-[48px] bg-white border border-slate-100 shadow-2xl text-center space-y-6">
                                <div className="w-20 h-20 bg-amber-50 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
                                    <QrCode size={40} className="text-amber-600" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">পাস যাচাই করুন</h3>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">আপনার বাইক নম্বর দিয়ে রেশনিং তথ্য দেখুন।</p>
                                </div>
                                <div className="space-y-6">
                                    <input 
                                        type="text" 
                                        value={bikeNumber}
                                        onChange={(e) => setBikeNumber(e.target.value)}
                                        placeholder="উদা: ঢাকা মেট্রো-হ ১১-২২৩৩"
                                        className="w-full px-6 py-5 rounded-full bg-slate-50 border-2 border-slate-100 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all font-black text-lg md:text-xl text-center placeholder:text-slate-300"
                                    />
                                    <button 
                                        onClick={() => handleFetchPass()}
                                        disabled={isSearchingPass}
                                        className="w-full py-6 rounded-[24px] bg-slate-900 text-white font-black hover:bg-amber-600 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 text-base"
                                    >
                                        {isSearchingPass ? 'একটি মুহূর্ত...' : 'পাস লোড করুন'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative p-10 rounded-[50px] bg-slate-900 text-white overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10 space-y-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                                <QrCode size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black leading-none">ডিজিটাল ফুয়েল পাস</h4>
                                                <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-1">Smart Rationing System</p>
                                            </div>
                                        </div>
                                        <ShieldCheck className={passData.eligible ? "text-emerald-400" : "text-amber-400"} size={24} />
                                    </div>

                                    <div className="bg-white p-8 rounded-[40px] shadow-2xl flex items-center justify-center">
                                        <div className="relative w-52 h-52 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center overflow-hidden">
                                            <QrCode size={160} className={`text-slate-800 ${passData.eligible ? 'opacity-20' : 'opacity-5'}`} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="p-5 bg-white rounded-3xl shadow-xl">
                                                    <Fuel size={40} className={passData.eligible ? "text-amber-500" : "text-slate-300"} />
                                                </div>
                                            </div>
                                            {!passData.eligible && (
                                                <div className="absolute inset-0 bg-rose-500/10 backdrop-blur-[2px] flex items-center justify-center">
                                                    <div className="bg-rose-600 text-white px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg">Limit Exceeded</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-4">
                                            <p className="text-[10px] font-black text-slate-500 uppercase">বাইক নম্বর</p>
                                            <p className="text-sm font-black italic text-amber-400">{passData.bikeNumber}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 rounded-3xl bg-white/5 border border-white/5">
                                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">মোট বরাদ্দ ({toBnDigits(passData.rationingDays)} দিন)</p>
                                                <p className="text-xl font-black text-amber-400">৳{toBnDigits(passData.totalQuota)}</p>
                                            </div>
                                            <div className="p-5 rounded-3xl bg-white/5 border border-white/5">
                                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">অবশিষ্ট</p>
                                                <p className={`text-xl font-black ${passData.remainingQuota > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>৳{toBnDigits(passData.remainingQuota)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {!passData.eligible && passData.nextEligible && (
                                        <div className="flex flex-col gap-3 p-6 rounded-[32px] bg-rose-500/10 border border-rose-500/20">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle size={20} className="text-rose-500" />
                                                <p className="text-[10px] font-black text-rose-200">আপনি {toBnDigits(passData.rationingDays)} দিনের বরাদ্দসীমা অতিক্রম করেছেন।</p>
                                            </div>
                                            <div className="pt-2 border-t border-white/10">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">পরবর্তী যোগ্য তারিখ</p>
                                                <p className="text-sm font-black text-emerald-400">
                                                    {new Date(passData.nextEligible).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <button 
                                        onClick={() => setPassData(null)}
                                        className="w-full text-slate-500 text-[10px] font-black hover:text-white transition-colors uppercase tracking-widest italic"
                                    >অন্য বাইক চেক করুন</button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'queue' && (
                    <motion.div
                        key="queue"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-4xl mx-auto space-y-6"
                    >
                        <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-white rounded-[32px] shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <Clock size={24} className="text-amber-500" />
                                লাইভ সিরিয়াল লিস্ট
                            </h3>
                            <button onClick={fetchQueue} disabled={isLoadingQueue} className="px-6 py-3 mt-4 md:mt-0 w-full md:w-auto bg-slate-100 font-bold text-xs rounded-xl hover:bg-slate-200 uppercase flex justify-center items-center gap-2 disabled:opacity-50 transition-colors">
                                리ফ্রেশ <Clock size={16} className={isLoadingQueue ? "animate-spin" : ""}/>
                            </button>
                        </div>
                        <div className="flex flex-col gap-4">
                            {queue.map((item) => (
                                <div key={item.id} className="p-6 rounded-[28px] bg-white shadow-xl shadow-slate-200/40 border border-slate-100 hover:border-amber-200 hover:-translate-y-1 transition-all flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-5 w-full md:w-auto">
                                        <div className="w-16 h-16 rounded-[20px] bg-amber-50 text-amber-600 border border-amber-100 font-black text-3xl flex items-center justify-center shrink-0 shadow-inner">
                                            {toBnDigits(item.serial_number)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm md:text-base font-black text-slate-800">{item.bike_number}</p>
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                                <p className="text-xs font-bold text-slate-500">স্লট: <span className="text-amber-600">{item.slot_time}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-auto text-[10px] uppercase font-black px-6 py-3 text-center bg-slate-50 text-slate-400 rounded-xl whitespace-nowrap">
                                        অপেক্ষমান
                                    </div>
                                </div>
                            ))}
                            {queue.length === 0 && !isLoadingQueue && (
                                <div className="text-center p-12 bg-white rounded-[32px] border border-dashed border-slate-200 shadow-sm">
                                    <Users size={32} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-bold">বর্তমানে কোনো সিরিয়াল নেই।</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'retailers' && (
                    <motion.div
                        key="retailers"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                         {unionRetailers.map(r => (
                             <div key={r.id} className="p-8 rounded-[40px] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col sm:flex-row items-center justify-between gap-8 group hover:-translate-y-1 transition-all duration-500">
                                 <div className="flex items-center gap-6">
                                     <div className="w-20 h-20 rounded-[32px] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                                         <Store size={32} />
                                     </div>
                                     <div>
                                         <div className="flex items-center gap-2 mb-1">
                                             <h4 className="text-2xl font-black text-slate-800 leading-none">{r.name}</h4>
                                             {r.authorized && <UserCheck size={18} className="text-emerald-500" />}
                                         </div>
                                         <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><MapPin size={14}/> {r.location}</p>
                                         <div className="mt-3 flex gap-2">
                                             <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">{r.type}</span>
                                             <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-600 text-[10px] font-black uppercase tracking-widest border border-teal-100">Authorized</span>
                                         </div>
                                     </div>
                                 </div>

                                 <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
                                     <div className="text-right hidden sm:block">
                                         <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">মজুত পরিমাণ</p>
                                         <p className="font-black text-slate-800 text-lg">{r.currentStock}</p>
                                     </div>
                                     <div className="flex gap-2 w-full sm:w-auto">
                                         <a href={`tel:${r.phone}`} className="flex-1 sm:flex-none p-5 rounded-[20px] bg-slate-900 text-white hover:bg-amber-600 transition-all shadow-lg">
                                             <Phone size={20} />
                                         </a>
                                         <button 
                                            onClick={() => setShowReportModal(r)}
                                            className="flex-1 sm:flex-none px-6 p-5 rounded-[20px] bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100"
                                         >
                                             রিপোর্ট
                                         </button>
                                     </div>
                                 </div>
                             </div>
                         ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Report Modal */}
            <AnimatePresence>
                {showReportModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md bg-white rounded-[48px] p-10 relative overflow-hidden shadow-2xl"
                        >
                            <button onClick={() => setShowReportModal(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"><X size={24}/></button>
                            <div className="space-y-8 text-center">
                                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
                                    <AlertTriangle size={40} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900 leading-none">অভিযোগ দাখিল করুন</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">{showReportModal.name}</p>
                                </div>
                                <div className="space-y-4 text-left">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 italic">অভিযোগের ধরন</label>
                                        <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm">
                                            <option>বেশি দাম নেওয়া হচ্ছে</option>
                                            <option>পরিমাপে কম দেওয়া হচ্ছে</option>
                                            <option>ভেজাল তেল</option>
                                            <option>অন্যান্য</option>
                                        </select>
                                    </div>
                                    <textarea placeholder="বিস্তারিত লিখুন..." className="w-full h-32 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs resize-none" />
                                </div>
                                <button 
                                    onClick={() => { alert('আপনার অভিযোগটি গ্রহণ করা হয়েছে। ইউনিয়ন প্রশাসন দ্রুত ব্যবস্থা নেবে।'); setShowReportModal(null); }}
                                    className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black hover:bg-rose-600 transition-all shadow-xl shadow-slate-200"
                                >অভিযোগ জমা দিন</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Admin/Operator Page Link */}
            <div className="pt-20 flex flex-col items-center justify-center gap-4">
                <div className="w-full h-px bg-slate-100 mb-6" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">ডিজিগ্রাম অথরিটি কন্ট্রোল</p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={() => {
                            const pin = prompt('ভলান্টিয়ার পিন লিখুন:');
                            if (pin === '1234') setIsVolunteerMode(true);
                            else alert('ভুল পিন!');
                        }}
                        className="flex items-center gap-3 px-8 py-4 rounded-[20px] bg-rose-50 border border-rose-100 text-rose-500 font-black text-xs hover:bg-white hover:shadow-xl transition-all uppercase tracking-widest group"
                    >
                        <UserCheckIcon size={18} /> ভলান্টিয়ার মোড
                    </button>
                    <a 
                        href={`/services/fuel/operator?u=${unionSlug}`}
                        className="flex items-center gap-3 px-8 py-4 rounded-[20px] bg-slate-50 border border-slate-200 text-slate-500 font-black text-xs hover:bg-white hover:shadow-xl transition-all uppercase tracking-widest group"
                    >
                        <ShieldCheck size={18} className="text-slate-400 group-hover:text-amber-500" />
                        পাম্প অপারেটর ড্যাশবোর্ড
                    </a>
                </div>
            </div>
        </div>
    );
}

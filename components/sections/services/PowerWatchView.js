'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ZapOff, AlertTriangle, Clock, MapPin, RefreshCw, Info, PhoneCall, Gauge, Wrench, ShieldAlert, FileWarning, HelpCircle } from 'lucide-react';
import { getPowerSchedule } from '@/lib/content/powerWatchData';

const AnimatedCounter = ({ end, duration = 2, suffix = '' }) => {
    const [count, setCount] = useState(0);

    const bnMap = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    const toBnNum = (num) => String(num).replace(/[0-9]/g, match => bnMap[match]);

    useEffect(() => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [end, duration]);

    return <span>{toBnNum(count)}{suffix}</span>;
};

export default function PowerWatchView() {
    const data = getPowerSchedule();
    const [selectedArea, setSelectedArea] = useState(data.areas[0]);

    const bnMap = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    const toBnNum = (num) => String(num).replace(/[0-9]/g, match => bnMap[match]);

    return (
        <div className="pb-16 pt-4">
            {/* 1. Hero Section */}
            <div className="relative rounded-[40px] bg-slate-900 border border-slate-800 overflow-hidden px-6 py-16 md:p-20 mb-16 shadow-2xl">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-center md:text-left max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-black uppercase tracking-widest mb-6 backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${data.overallStatus === 'normal' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${data.overallStatus === 'normal' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            </span>
                            গ্রিড স্ট্যাটাস: {data.overallStatus === 'normal' ? 'স্বাভাবিক' : 'সংকটপূর্ণ'}
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.2] mb-6">
                            লোডশেডিং ট্র্যাকার <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">পাওয়ার-ওয়াচ</span>
                        </h2>
                        <p className="text-lg text-slate-300 font-medium mb-8 leading-relaxed max-w-xl">
                            এলাকাভিত্তিক লোডশেডিংয়ের সম্ভাব্য সময়, দৈনিক সরবরাহ স্কোরের এনালাইসিস এবং সরাসরি বিদ্যুৎ অফিসে অভিযোগ জানানোর প্ল্যাটফর্ম।
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button onClick={() => document.getElementById('tracker').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-lg hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/25 active:scale-95 flex items-center justify-center gap-2">
                                <MapPin size={20} />
                                আপনার এলাকা খুঁজুন
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto relative">
                        <div className="bg-white/10 border border-white/20 rounded-[32px] p-6 text-center backdrop-blur-xl shadow-2xl relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 opacity-10"><Zap size={100} /></div>
                            <div className="relative z-10">
                                <Gauge size={32} className="text-emerald-400 mx-auto mb-3" />
                                <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={92} suffix="%" /></div>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">গড় রিলায়েবিলিটি</p>
                            </div>
                        </div>
                        <div className="bg-white/10 border border-white/20 rounded-[32px] p-6 text-center backdrop-blur-xl shadow-2xl relative overflow-hidden mt-6">
                            <div className="absolute -right-4 -bottom-4 opacity-10"><FileWarning size={100} /></div>
                            <div className="relative z-10">
                                <AlertTriangle size={32} className="text-rose-400 mx-auto mb-3" />
                                <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={34} suffix=" টি" /></div>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">সমাধানকৃত অভিযোগ</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                <div className={`p-8 rounded-[32px] border-2 shadow-sm flex flex-col justify-center ${
                    data.overallStatus === 'normal' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-amber-50 border-amber-100 text-amber-900'
                }`}>
                    <div className="flex items-start gap-5">
                        <div className={`p-4 rounded-2xl bg-white shadow-sm shrink-0 ${data.overallStatus === 'normal' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {data.overallStatus === 'normal' ? <Info size={32} /> : <AlertTriangle size={32} />}
                        </div>
                        <div>
                            <h4 className="font-black text-xl mb-2">{data.region} আপডেট</h4>
                            <p className="text-sm font-bold opacity-80 leading-relaxed mb-4">{data.message}</p>
                            <p className="text-xs font-black uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                                <RefreshCw size={14} /> 
                                শেষ আপডেট: {data.lastUpdate}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-[32px] bg-sky-50 border-2 border-sky-100 text-sky-900 shadow-sm flex flex-col justify-center">
                    <div className="flex items-start gap-5">
                        <div className="p-4 rounded-2xl bg-white shadow-sm shrink-0 text-sky-500">
                            <HelpCircle size={32} />
                        </div>
                        <div>
                            <h4 className="font-black text-xl mb-2">সমস্যা হচ্ছে? সরাসরি জানান</h4>
                            <p className="text-sm font-bold opacity-80 leading-relaxed mb-4">টানা লোডশেডিং, লাইনে ত্রুটি, মিটার সমস্যা বা ভোল্টেজ ওঠা-নামার অভিযোগ সরাসরি কন্ট্রোল রুমে কল করে জানান।</p>
                            <button onClick={() => window.location.href = `tel:${data.localOfficePhone}`} className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-black transition-colors shadow-lg shadow-sky-600/20 active:scale-95">
                                <PhoneCall size={16} /> কল করুন: {data.localOfficePhone}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Main Tracker App */}
            <div id="tracker" className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-slate-100 pt-16">
                {/* ── Area Selector ── */}
                <div className="lg:col-span-4 space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">আপনার এলাকা নির্বাচন করুন</h3>
                    <div className="space-y-3">
                        {data.areas.map((area) => (
                            <button
                                key={area.id}
                                onClick={() => setSelectedArea(area)}
                                className={`w-full text-left p-5 rounded-[24px] border-2 transition-all flex flex-col gap-3 group ${
                                    selectedArea.id === area.id 
                                    ? 'bg-slate-900 border-slate-900 shadow-xl text-white' 
                                    : 'bg-white border-slate-100 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <MapPin size={20} className={selectedArea.id === area.id ? 'text-amber-400' : 'text-slate-400'} />
                                        <span className="font-black text-lg tracking-tight">{area.name}</span>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shrink-0 ${
                                        area.currentStatus === 'on' 
                                        ? (selectedArea.id === area.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                                        : (selectedArea.id === area.id ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700')
                                    }`}>
                                        {area.currentStatus === 'on' ? 'বিদ্যুৎ আছে' : 'বিদ্যুৎ নেই'}
                                    </div>
                                </div>
                                <div className={`flex items-center gap-5 text-[11px] font-bold ${selectedArea.id === area.id ? 'opacity-80 text-slate-300' : 'text-slate-500'} pl-8`}>
                                    <span className="flex items-center gap-1.5"><Gauge size={14} /> স্কোর: {toBnNum(area.reliabilityScore)}%</span>
                                    <span className="flex items-center gap-1.5 opacity-50"><Wrench size={14} /> টাস্ক: {area.schedule.length}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Schedule details for selected area ── */}
                <div className="lg:col-span-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedArea.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-white rounded-[40px] p-6 md:p-10 border border-slate-100 shadow-sm h-full flex flex-col"
                        >
                            <div className="flex flex-col md:flex-row justify-between gap-6 pb-8 border-b border-slate-100 mb-8">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-800 mb-4">{selectedArea.name}</h3>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2">
                                            <Gauge size={16} className="text-teal-500" />
                                            সাপ্তাহিক রিলায়েবিলিটি স্কোর: {toBnNum(selectedArea.reliabilityScore)}%
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2">
                                            <Wrench size={16} className="text-amber-500" />
                                            পরবর্তী সংস্কার: {selectedArea.nextMaintenance}
                                        </div>
                                    </div>
                                </div>

                                <div className={`shrink-0 flex items-center gap-5 px-8 py-5 rounded-[28px] ${
                                    selectedArea.currentStatus === 'on' 
                                    ? 'bg-gradient-to-br from-emerald-50 to-teal-100 border border-emerald-200 text-emerald-900 shadow-inner' 
                                    : 'bg-gradient-to-br from-rose-50 to-orange-100 border border-rose-200 text-rose-900 shadow-inner'
                                }`}>
                                    {selectedArea.currentStatus === 'on' ? <Zap size={40} className="text-emerald-500" /> : <ZapOff size={40} className="text-rose-500" />}
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">অবস্থা</p>
                                        <p className="text-2xl font-black">{selectedArea.currentStatus === 'on' ? 'সরবরাহ স্বাভাবিক' : 'লোডশেডিং চলছে'}</p>
                                    </div>
                                </div>
                            </div>

                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">আজকের সম্ভাব্য শেডিং শিডিউল</h4>
                            
                            <div className="space-y-4 flex-1">
                                {selectedArea.schedule.map((slot, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[24px] bg-slate-50 border border-slate-100 group hover:bg-white hover:border-amber-200 hover:shadow-lg transition-all relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-slate-100 to-transparent opacity-50 group-hover:from-amber-100 transition-colors pointer-events-none"></div>
                                        <div className="relative z-10 flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm text-slate-400 flex items-center justify-center group-hover:text-amber-500 transition-colors shrink-0">
                                                <Clock size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">সময়কাল</p>
                                                <span className="font-black text-xl text-slate-800">{slot.time}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="relative z-10 flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                                            <div className={`px-4 py-2 rounded-xl text-[11px] font-black flex items-center gap-1.5 self-start sm:self-end ${
                                                slot.status === 'scheduled' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                                {slot.status === 'scheduled' ? 'সম্ভাব্য লোডশেডিং' : 'জরুরি মেরামত'}
                                            </div>
                                            <p className="text-xs font-bold text-slate-500">{slot.detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <p className="text-[11px] text-slate-400 font-bold bg-slate-50 px-3 py-2 rounded-lg">
                                    * জাতীয় গ্রিডের চাহিদার উপর ভিত্তি করে শিডিউল পরিবর্তিত হতে পারে।
                                </p>
                                <button className="shrink-0 text-xs font-black text-white bg-slate-900 px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors active:scale-95 shadow-lg flex items-center gap-2 justify-center">
                                    <ShieldAlert size={14} /> রিপোর্ট করুন
                                </button>
                            </div>

                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

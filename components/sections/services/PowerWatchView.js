'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ZapOff, AlertTriangle, Clock, MapPin, RefreshCw, Info, PhoneCall, Gauge, Wrench } from 'lucide-react';
import { getPowerSchedule } from '@/lib/content/powerWatchData';

export default function PowerWatchView() {
    const data = getPowerSchedule();
    const [selectedArea, setSelectedArea] = useState(data.areas[0]);

    const bnMap = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    const toBnNum = (num) => String(num).replace(/[0-9]/g, match => bnMap[match]);

    return (
        <div className="py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">পাওয়ার-ওয়াচ</h2>
                    <p className="text-sm font-medium text-slate-500">এলাকা ভিত্তিক লোডশেডিং শিডিউল এবং বর্তমান অবস্থা</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => window.location.href = `tel:${data.localOfficePhone}`} className="shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full border border-slate-200 transition-colors">
                        <PhoneCall size={14} className="text-slate-500" />
                        <span className="text-xs font-black tracking-widest">{data.localOfficePhone}</span>
                    </button>
                    <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
                        <span className="relative flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${data.overallStatus === 'normal' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${data.overallStatus === 'normal' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        </span>
                        <span className="text-xs font-bold text-slate-600">লাইভ স্ট্যাটাস</span>
                    </div>
                </div>
            </div>

            {/* Warning / Message Bar */}
            <div className={`mb-8 p-5 rounded-[24px] border border-b-4 flex items-start gap-4 ${
                data.overallStatus === 'normal' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
                {data.overallStatus === 'normal' ? <Info className="shrink-0 mt-0.5" /> : <AlertTriangle className="shrink-0 mt-0.5" />}
                <div className="flex-1">
                    <h4 className="font-black text-lg mb-1">{data.region}</h4>
                    <p className="text-[13px] font-bold opacity-90 leading-relaxed mb-3">{data.message}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-emerald-200/50">
                        <p className="text-[10px] font-black uppercase opacity-70 flex items-center gap-1.5">
                            <RefreshCw size={12} /> 
                            শেষ আপডেট: {data.lastUpdate}
                        </p>
                        <button className="text-[10px] font-black underline hover:opacity-80">
                            বিস্তারিত রিপোর্ট দেখুন
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── Area Selector ── */}
                <div className="lg:col-span-4 space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">আপনার এলাকা নির্বাচন করুন</h3>
                    <div className="space-y-3">
                        {data.areas.map((area) => (
                            <button
                                key={area.id}
                                onClick={() => setSelectedArea(area)}
                                className={`w-full text-left p-4 rounded-[24px] border-2 transition-all flex flex-col gap-3 group ${
                                    selectedArea.id === area.id 
                                    ? 'bg-slate-900 border-slate-900 shadow-xl text-white' 
                                    : 'bg-white border-slate-100 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <MapPin size={18} className={selectedArea.id === area.id ? 'text-teal-400' : 'text-slate-400'} />
                                        <span className="font-black text-base">{area.name}</span>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-md text-[10px] font-black flex items-center gap-1 shrink-0 ${
                                        area.currentStatus === 'on' 
                                        ? (selectedArea.id === area.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                                        : (selectedArea.id === area.id ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700')
                                    }`}>
                                        {area.currentStatus === 'on' ? 'বিদ্যুৎ আছে' : 'বিদ্যুৎ নেই'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-bold opacity-80 pl-8">
                                    <span className="flex items-center gap-1"><Gauge size={12} /> স্কোর: {toBnNum(area.reliabilityScore)}%</span>
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
                                    <h3 className="text-3xl font-black text-slate-800 mb-3">{selectedArea.name}</h3>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                            <Gauge size={14} className="text-teal-500" />
                                            সাপ্তাহিক রিলায়েবিলিটি: {toBnNum(selectedArea.reliabilityScore)}%
                                        </div>
                                        <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                            <Wrench size={14} className="text-amber-500" />
                                            পরবর্তী সংস্কার: {selectedArea.nextMaintenance}
                                        </div>
                                    </div>
                                </div>

                                <div className={`shrink-0 flex items-center gap-4 px-8 py-5 rounded-[28px] ${
                                    selectedArea.currentStatus === 'on' 
                                    ? 'bg-gradient-to-br from-emerald-50 to-teal-100 border border-emerald-200 text-emerald-900 shadow-inner' 
                                    : 'bg-gradient-to-br from-rose-50 to-orange-100 border border-rose-200 text-rose-900 shadow-inner'
                                }`}>
                                    {selectedArea.currentStatus === 'on' ? <Zap size={36} className="text-emerald-500" /> : <ZapOff size={36} className="text-rose-500" />}
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">অবস্থা</p>
                                        <p className="text-xl font-black">{selectedArea.currentStatus === 'on' ? 'সরবরাহ স্বাভাবিক' : 'লোডশেডিং চলছে'}</p>
                                    </div>
                                </div>
                            </div>

                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">আজকের সম্ভাব্য শেডিং শিডিউল</h4>
                            
                            <div className="space-y-4 flex-1">
                                {selectedArea.schedule.map((slot, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[24px] bg-slate-50 border border-slate-100 group hover:bg-white hover:border-teal-200 hover:shadow-lg transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors shrink-0">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">সময়কাল</p>
                                                <span className="font-black text-lg text-slate-800">{slot.time}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center sm:justify-end gap-3 w-full sm:w-auto">
                                            <div className="text-left sm:text-right flex-1 sm:flex-none">
                                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">কারণ</p>
                                                <p className="text-xs font-bold text-slate-600">{slot.detail}</p>
                                            </div>
                                            <div className={`shrink-0 px-4 py-2 rounded-xl text-[11px] font-black flex items-center gap-1.5 ${
                                                slot.status === 'scheduled' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                                {slot.status === 'scheduled' ? 'সম্ভাব্য লোডশেডিং' : 'জরুরি মেরামত'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                <p className="text-xs text-slate-400 font-bold">
                                    * জাতীয় গ্রিডের চাহিদার উপর ভিত্তি করে শিডিউল পরিবর্তিত হতে পারে।
                                </p>
                                <button className="text-xs font-black text-rose-500 bg-rose-50 px-4 py-2 rounded-full hover:bg-rose-500 hover:text-white transition-colors">
                                    বিভ্রাটের রিপোর্ট করুন
                                </button>
                            </div>

                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

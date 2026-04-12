'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ZapOff, AlertTriangle, Clock, MapPin, RefreshCw, Info } from 'lucide-react';
import { getPowerSchedule } from '@/lib/content/powerWatchData';

export default function PowerWatchView() {
    const data = getPowerSchedule();
    const [selectedArea, setSelectedArea] = useState(data.areas[0]);

    return (
        <div className="py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">পাওয়ার-ওয়াচ</h2>
                    <p className="text-sm font-medium text-slate-500">এলাকা ভিত্তিক লোডশেডিং শিডিউল এবং বর্তমান অবস্থা</p>
                </div>
                <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200">
                    <span className="relative flex h-3 w-3">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${data.overallStatus === 'normal' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${data.overallStatus === 'normal' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    </span>
                    <span className="text-xs font-bold text-slate-600">লাইভ স্ট্যাটাস</span>
                </div>
            </div>

            {/* Warning / Message Bar */}
            <div className={`mb-8 p-4 rounded-2xl border flex items-start gap-4 ${
                data.overallStatus === 'normal' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'
            }`}>
                {data.overallStatus === 'normal' ? <Info className="shrink-0 mt-0.5" /> : <AlertTriangle className="shrink-0 mt-0.5" />}
                <div>
                    <h4 className="font-bold mb-1">{data.region}</h4>
                    <p className="text-sm font-medium opacity-90">{data.message}</p>
                    <p className="text-[10px] font-black uppercase mt-3 opacity-60 flex items-center gap-1">
                        <RefreshCw size={10} /> 
                        শেষ আপডেট: {data.lastUpdate}
                    </p>
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
                                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                                    selectedArea.id === area.id 
                                    ? 'bg-slate-900 border-slate-900 shadow-lg text-white' 
                                    : 'bg-white border-slate-100 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <MapPin size={18} className={selectedArea.id === area.id ? 'text-teal-400' : 'text-slate-400'} />
                                    <span className="font-bold">{area.name}</span>
                                </div>
                                
                                <div className={`px-2.5 py-1 rounded-md text-[10px] font-black flex items-center gap-1 ${
                                    area.currentStatus === 'on' 
                                    ? (selectedArea.id === area.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                                    : (selectedArea.id === area.id ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700')
                                }`}>
                                    {area.currentStatus === 'on' ? 'বিদ্যুৎ আছে' : 'বিদ্যুৎ নেই'}
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-sm h-full"
                        >
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100 mb-8">
                                <div className="text-center sm:text-left">
                                    <h3 className="text-2xl font-black text-slate-800 mb-2">{selectedArea.name}</h3>
                                    <p className="text-sm font-bold text-slate-400">আজকের সম্ভাব্য শেডিং শিডিউল</p>
                                </div>

                                <div className={`flex items-center gap-4 px-6 py-4 rounded-3xl ${
                                    selectedArea.currentStatus === 'on' 
                                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-800' 
                                    : 'bg-gradient-to-r from-rose-50 to-red-50 border border-rose-100 text-rose-800'
                                }`}>
                                    {selectedArea.currentStatus === 'on' ? <Zap size={32} className="text-emerald-500" /> : <ZapOff size={32} className="text-rose-500" />}
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">অবস্থা</p>
                                        <p className="text-lg font-black">{selectedArea.currentStatus === 'on' ? 'বিদ্যুৎ সরবরাহ স্বাভাবিক' : 'লোডশেডিং চলছে'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {selectedArea.schedule.map((slot, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-teal-200 hover:shadow-md transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                                                <Clock size={18} />
                                            </div>
                                            <span className="font-black text-lg text-slate-700">{slot.time}</span>
                                        </div>
                                        
                                        <div className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 ${
                                            slot.status === 'scheduled' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                        }`}>
                                            {slot.status === 'scheduled' ? 'সম্ভাব্য লোডশেডিং' : 'জরুরি মেরামত'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-slate-50">
                                <p className="text-xs text-slate-400 font-bold text-center">
                                    * জাতীয় গ্রিডের চাহিদার উপর ভিত্তি করে এই শিডিউল যেকোনো সময় পরিবর্তিত হতে পারে।
                                </p>
                            </div>

                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

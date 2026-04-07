"use client";

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ZapOff, Clock, MapPin, AlertTriangle, RefreshCw, Info } from 'lucide-react';

export default function PowerWatchSection() {
    const { selected } = useSelector((s) => s.location);
    const [status, setStatus] = useState('online'); // 'online' or 'offline'
    const [lastUpdated, setLastUpdated] = useState('এখনই');
    const [isReporting, setIsReporting] = useState(false);

    // Mock data based on location
    useEffect(() => {
        if (selected.unionSlug === 'horipur') {
            setStatus('offline');
            setLastUpdated('১০ মিনিট আগে');
        } else {
            setStatus('online');
            setLastUpdated('৫ মিনিট আগে');
        }
    }, [selected.unionSlug]);

    const handleReport = () => {
        setIsReporting(true);
        setTimeout(() => {
            setIsReporting(false);
            setLastUpdated('এইমাত্র (আপনার রিপোর্টে)');
        }, 1500);
    };

    return (
        <section className="dg-section-x py-12 md:py-16">
            <div className="max-w-7xl mx-auto px-4">
                <div className="relative group overflow-hidden rounded-[40px] border border-slate-200/60 bg-white/50 backdrop-blur-xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] p-8 md:p-12">
                    
                    {/* Background Mesh */}
                    <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none transition-colors duration-1000 ${status === 'online' ? 'bg-teal-500/10' : 'bg-amber-500/10'}`} />
                    <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none transition-colors duration-1000 ${status === 'online' ? 'bg-sky-500/10' : 'bg-rose-500/10'}`} />

                    <div className="relative flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        
                        {/* Status Visual */}
                        <div className="flex-1 text-center lg:text-left">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-xl shadow-slate-900/20"
                            >
                                <Zap size={14} className={status === 'online' ? 'text-teal-400' : 'text-amber-400'} />
                                Power Watch · লাইভ আপডেট
                            </motion.div>

                            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none mb-6">
                                বর্তমানে আপনার এলাকায় <br />
                                <span className={status === 'online' ? 'text-teal-600' : 'text-amber-600'}>
                                    {status === 'online' ? 'বিদ্যুৎ আছে' : 'বিদ্যুৎ নেই (লোডশেডিং)'}
                                </span>
                            </h2>

                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-8">
                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100/80 border border-slate-200/50 text-slate-600 text-sm font-bold">
                                    <MapPin size={16} className="text-slate-400" />
                                    {selected.union ? `${selected.union}${selected.ward ? ` · ${selected.ward}` : ''}` : 'আপনার ইউনিয়ন সিলেক্ট করুন'}
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-600 text-sm font-bold shadow-sm">
                                    <Clock size={16} className="text-slate-400" />
                                    আপডেট: {lastUpdated}
                                </div>
                            </div>

                            <p className="text-slate-500 font-medium text-lg max-w-xl mb-10 leading-relaxed">
                                ডিজিটাল গ্রাম গঠনে আপনার একটি রিপোর্ট অন্যের বড় উপকারে আসতে পারে। বিদ্যুৎ না থাকলে রিপোর্ট করে অন্যকে সতর্ক করুন।
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button 
                                    onClick={handleReport}
                                    disabled={isReporting}
                                    className={`w-full sm:w-auto px-10 py-5 rounded-[24px] font-black text-white shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${status === 'online' ? 'bg-slate-900 shadow-slate-900/20 hover:bg-slate-800' : 'bg-amber-600 shadow-amber-600/20 hover:bg-amber-700'}`}
                                >
                                    {isReporting ? (
                                        <RefreshCw size={20} className="animate-spin" />
                                    ) : (
                                        <RefreshCw size={20} />
                                    )}
                                    {status === 'online' ? 'বিদ্যুৎ নেই? রিপোর্ট করুন' : 'বিদ্যুৎ এসেছে? রিপোর্ট দিন'}
                                </button>
                                
                                <button className="w-full sm:w-auto px-10 py-5 rounded-[24px] border-2 border-slate-200 font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 text-sm">
                                    বিস্তারিত গ্রাফ দেখুন
                                </button>
                            </div>
                        </div>

                        {/* Visual Icon Area */}
                        <div className="relative w-full max-w-[400px] aspect-square flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={status}
                                    initial={{ opacity: 0, rotate: -20, scale: 0.8 }}
                                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                    exit={{ opacity: 0, rotate: 20, scale: 0.8 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                    className={`relative z-10 w-64 h-64 md:w-80 md:h-80 rounded-[60px] flex items-center justify-center shadow-inner ring-1 ring-white/50 ${status === 'online' ? 'bg-gradient-to-br from-teal-500 to-sky-600 text-white' : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'}`}
                                >
                                    {status === 'online' ? (
                                        <Zap size={120} strokeWidth={2.5} className="drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]" />
                                    ) : (
                                        <ZapOff size={120} strokeWidth={2.5} className="drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]" />
                                    )}
                                    
                                    {/* Pulse effect */}
                                    <div className={`absolute inset-0 rounded-[60px] animate-ping opacity-20 ${status === 'online' ? 'bg-teal-400' : 'bg-amber-400'}`} />
                                </motion.div>
                            </AnimatePresence>

                            {/* Floating decorative cards */}
                            <motion.div 
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute -top-4 -right-4 bg-white p-4 rounded-3xl shadow-xl border border-slate-100 flex items-center gap-3 z-20"
                            >
                                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                                    <RefreshCw size={18} />
                                </div>
                                <div className="pr-2">
                                    <p className="text-[10px] font-black text-slate-400 leading-none">ভেরিফিকেশন</p>
                                    <p className="text-xs font-black text-slate-800 leading-tight">৯৭% নির্ভুল</p>
                                </div>
                            </motion.div>

                            <motion.div 
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                                className="absolute -bottom-4 -left-4 bg-white p-4 rounded-3xl shadow-xl border border-slate-100 flex items-center gap-3 z-20"
                            >
                                <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                                    <AlertTriangle size={18} />
                                </div>
                                <div className="pr-2">
                                    <p className="text-[10px] font-black text-slate-400 leading-none">সর্বশেষ রিপোর্ট</p>
                                    <p className="text-xs font-black text-slate-800 leading-tight">{selected.union || 'লোকাল'} এরিয়া</p>
                                </div>
                            </motion.div>
                        </div>

                    </div>

                    {/* Community Tip */}
                    <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                                    <img src={`https://i.pravatar.cc/100?u=user${i}`} alt="user" />
                                </div>
                            ))}
                        </div>
                        <p className="text-sm font-bold text-slate-500">
                            আপনার এলাকার <span className="text-slate-800 font-black">১২০ জন মানুষ</span> বর্তমানে পাওয়ার-ওয়াচ ব্যবস্থার সাথে যুক্ত আছেন।
                        </p>
                        <div className="sm:ml-auto">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 text-[10px] font-black uppercase tracking-widest border border-teal-100">
                                <Info size={12} /> ট্রাস্ট স্কোর: ৯.৮/১০
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

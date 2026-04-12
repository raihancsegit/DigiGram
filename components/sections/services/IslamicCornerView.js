'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Sunrise, Compass, BookOpen, Heart, Info, Clock, CheckCircle2, ChevronRight, CalendarDays, Star } from 'lucide-react';

export default function IslamicCornerView() {
    const [currentTime, setCurrentTime] = useState('');
    const [countdown, setCountdown] = useState('০২:৪৫:৩০'); // Mock countdown

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const PRAYER_TIMES = [
        { name: 'ফজর', time: '০৪:৪৩ এএম', icon: Sunrise, current: false },
        { name: 'যোহর', time: '১২:০৬ পিএম', icon: Sun, current: true },
        { name: 'আসর', time: '০৩:৩৩ পিএম', icon: Sun, current: false },
        { name: 'মাগরিব', time: '০৬:১৫ পিএম', icon: Moon, current: false },
        { name: 'এশা', time: '০৭:৩১ পিএম', icon: Moon, current: false },
    ];

    const HADITH_OF_DAY = {
        arabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ",
        bangla: "নিশ্চয়ই প্রতিটি কাজ নিয়তের উপর নির্ভরশীল।",
        reference: "সহীহ বুখারী, হাদিস নং: ১",
        narrator: "উমর বিন খাত্তাব (রা.)"
    };

    const DAILY_DUA = {
        title: 'মসজিদে প্রবেশের দোয়া',
        arabic: 'أَعُوذُ بِاللَّهِ الْعَظِيمِ، وَبِوَجْهِهِ الْكَرِيمِ، وَسُلْطَانِهِ الْقَدِيمِ، مِنَ الشَّيْطَانِ الرَّجِيمِ',
        bangla: 'বিতারিত শয়তান থেকে মহান আল্লাহর, তাঁর সম্মানিত চেহারার এবং তাঁর অনাদি-অনন্ত কর্তৃত্বের আশ্রয় প্রার্থনা করছি।'
    };

    const NOORANI_STEPS = [
        { title: 'হরফ পরিচিতি', desc: 'আরবি ২৯টি হরফের সঠিক উচ্চারণ ও মাখরাজ শিক্ষা।' },
        { title: 'হরকত ও তানভীন', desc: 'যবর, যের, পেশ এবং দুই যবর, দুই যের, দুই পেশ।' },
        { title: 'জযম ও তাশদীদ', desc: 'শব্দ মিলিয়ে পড়া এবং তাশদীদের মাধ্যমে দ্বিত্ব করে পড়া।' },
        { title: 'মাদ ও গুন্নাহ', desc: 'টেনে পড়া এবং নাকি সুরে পড়ার সঠিক তাজবীদ।' }
    ];

    return (
        <div className="py-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">ইসলামিক কর্নার</h2>
                    <p className="text-sm font-medium text-slate-500">নামাজের সময়সূচি, দৈনন্দিন আমল এবং ইসলামের মৌলিক শিক্ষা (রাজশাহী সময়)</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                        <CalendarDays size={20} className="text-amber-500" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">হিজরি তারিখ</p>
                            <p className="text-sm font-black text-slate-700">২৫ শাওয়াল, ১৪৪৭</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                        <Clock size={20} className="text-emerald-500" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">বর্তমান সময়</p>
                            <p className="text-sm font-black text-slate-700">{currentTime || '...'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-8">
                {/* ── Left Column: Prayer Times ── */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group">
                        {/* Abstract Background Design */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="text-center mb-10 mt-4">
                                <p className="text-emerald-200 text-sm font-bold uppercase tracking-widest mb-2">পরবর্তী ওয়াক্ত: আসর</p>
                                <div className="text-5xl font-black tracking-wider drop-shadow-md font-mono">{countdown}</div>
                            </div>

                            <div className="space-y-3 mb-8">
                                {PRAYER_TIMES.map((prayer, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`flex items-center justify-between p-4 rounded-[20px] transition-all duration-300 ${
                                            prayer.current 
                                            ? 'bg-white text-emerald-900 shadow-xl transform scale-105 my-4 border-2 border-emerald-300 ring-4 ring-emerald-500/20' 
                                            : 'bg-white/5 text-emerald-50 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${prayer.current ? 'bg-emerald-100 text-emerald-600' : 'bg-white/10'}`}>
                                                <prayer.icon size={18} />
                                            </div>
                                            <span className="font-bold text-lg">{prayer.name}</span>
                                        </div>
                                        <span className={`font-black text-lg tracking-wide ${prayer.current ? 'text-emerald-800' : 'opacity-90' }`}>
                                            {prayer.time}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-auto flex items-start gap-3 bg-black/20 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
                                <Info size={18} className="text-emerald-300 shrink-0 mt-0.5" />
                                <p className="text-[11px] font-medium text-emerald-100/90 leading-relaxed">
                                    রাজশাহীর জন্য হিসাবকৃত। আপনার উপজেলায় ১-২ মিনিট পার্থক্য হতে পারে। আজ সূর্যোদয় ০৫:৫৮, সূর্যাস্ত ০৬:০৭।
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right Column: Content ── */}
                <div className="xl:col-span-8 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Daily Hadith */}
                        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] transform group-hover:scale-110 transition-transform duration-1000">
                                <BookOpen size={180} />
                            </div>
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
                                    <Star size={20} className="fill-current" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">আজকের হাদিস</h3>
                            </div>
                            
                            <div className="flex-1 flex flex-col justify-center text-center px-4 relative z-10">
                                <p className="text-3xl font-arabic text-teal-700 leading-loose mb-4">
                                    {HADITH_OF_DAY.arabic}
                                </p>
                                <p className="text-base font-bold text-slate-700 leading-relaxed mb-6">
                                    "{HADITH_OF_DAY.bangla}"
                                </p>
                            </div>

                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 relative z-10">
                                <span>{HADITH_OF_DAY.reference}</span>
                                <span>{HADITH_OF_DAY.narrator}</span>
                            </div>
                        </div>

                        {/* Daily Dua */}
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[32px] p-8 border border-blue-100 shadow-sm flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
                                    <Heart size={20} className="fill-current" />
                                </div>
                                <h3 className="text-lg font-black text-indigo-900 uppercase tracking-widest">দৈনন্দিন দোয়া</h3>
                            </div>
                            
                            <div className="flex-1 flex flex-col justify-center text-center">
                                <h4 className="text-sm font-black text-indigo-800 mb-4 bg-white/60 inline-block px-4 py-1.5 rounded-full mx-auto">{DAILY_DUA.title}</h4>
                                <p className="text-2xl font-arabic text-indigo-900 leading-loose mb-4">
                                    {DAILY_DUA.arabic}
                                </p>
                                <p className="text-[13px] font-bold text-indigo-700/80 leading-relaxed">
                                    অর্থ: {DAILY_DUA.bangla}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Noorani Learning Steps */}
                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex-1">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 mb-1">নূরানী কুরআন শিক্ষা</h3>
                                <p className="text-xs font-bold text-slate-400">শুদ্ধভাবে কুরআন তেলাওয়াত শিখুন, ঘরে বসেই</p>
                            </div>
                            <button className="text-[11px] font-black tracking-widest uppercase text-white bg-slate-900 px-6 py-3 rounded-full hover:bg-teal-600 transition-colors shadow-lg active:scale-95 flex items-center gap-2">
                                কন্টিনিউ <ChevronRight size={14} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {NOORANI_STEPS.map((step, idx) => (
                                <div key={idx} className="flex flex-col gap-4 p-5 rounded-[24px] bg-slate-50 border border-slate-100 hover:border-teal-300 hover:shadow-md transition-all group cursor-pointer relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-teal-100 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 font-black flex items-center justify-center shrink-0 shadow-sm group-hover:bg-teal-500 group-hover:text-white transition-colors relative z-10">
                                        ০{idx + 1}
                                    </div>
                                    <div className="relative z-10">
                                        <h4 className="text-sm font-black text-slate-800 mb-2">{step.title}</h4>
                                        <p className="text-xs font-medium text-slate-500 leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

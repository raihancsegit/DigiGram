'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Sunrise, Compass, BookOpen, Heart, Info, Clock, CheckCircle2 } from 'lucide-react';

export default function IslamicCornerView() {
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // Realistic static data for Rajshahi Timezone
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

    const NOORANI_STEPS = [
        { title: 'হরফ পরিচিতি', desc: 'আরবি ২৯টি হরফের সঠিক উচ্চারণ ও মাখরাজ শিক্ষা।' },
        { title: 'হরকত ও তানভীন', desc: 'যবর, যের, পেশ এবং দুই যবর, দুই যের, দুই পেশের ব্যবহার।' },
        { title: 'জযম ও তাশদীদ', desc: 'শব্দ মিলিয়ে পড়া এবং তাশদীদের মাধ্যমে দ্বিত্ব করে পড়ার নিয়ম।' },
        { title: 'মাদ ও গুন্নাহ', desc: 'টেনে পড়া এবং নাকি সুরে পড়ার সঠিক তাজবীদ।' }
    ];

    return (
        <div className="py-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">ইসলামিক কর্নার</h2>
                    <p className="text-sm font-medium text-slate-500">নামাজের সময়সূচি, দৈনন্দিন আমল এবং ইসলামের মৌলিক শিক্ষা (রাজশাহী সময় অনুযায়ী)</p>
                </div>
                <div className="shrink-0 flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                    <Clock size={20} className="text-emerald-500" />
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400">বর্তমান সময়</p>
                        <p className="text-lg font-black text-slate-700">{currentTime || '...'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                {/* ── Left Column: Prayer Times ── */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-[32px] p-8 text-white shadow-xl shadow-emerald-700/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Moon size={120} />
                        </div>
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-8">
                                <Compass size={24} className="text-emerald-200" />
                                <h3 className="text-xl font-black">আজকের নামাজের সময়সূচি</h3>
                            </div>

                            <div className="space-y-4">
                                {PRAYER_TIMES.map((prayer, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                                            prayer.current 
                                            ? 'bg-white text-emerald-700 shadow-md transform scale-105 border border-emerald-100' 
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-xl ${prayer.current ? 'bg-emerald-50 text-emerald-500' : 'bg-white/20'}`}>
                                                <prayer.icon size={18} />
                                            </div>
                                            <span className="font-bold text-lg">{prayer.name}</span>
                                        </div>
                                        <span className={`font-black text-lg ${prayer.current ? 'text-emerald-700' : 'text-emerald-100' }`}>
                                            {prayer.time}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-8 flex items-start gap-2 bg-black/10 rounded-xl p-3 border border-white/10">
                                <Info size={16} className="text-emerald-200 shrink-0 mt-0.5" />
                                <p className="text-[11px] font-medium text-emerald-100">
                                    এটি রাজশাহী জেলার জন্য হিসাবকৃত। আপনার উপজেলার সাথে ১-২ মিনিট পার্থক্য হতে পারে। আজ সূর্যোদয় ০৫:৫৮ এএম, সূর্যাস্ত ০৬:০৭ পিএম।
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right Column: Hadith & Learning ── */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Hadith Area */}
                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600">
                                <BookOpen size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">আজকের হাদিস</h3>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 py-10 px-8 rounded-3xl text-center relative">
                            <p className="text-3xl font-arabic text-emerald-700 leading-loose mb-6 drop-shadow-sm font-bold">
                                {HADITH_OF_DAY.arabic}
                            </p>
                            <p className="text-xl font-bold text-slate-800 leading-relaxed mb-4">
                                "{HADITH_OF_DAY.bangla}"
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 mt-6">
                                <span className="text-teal-600 bg-teal-50 px-3 py-1 rounded-full">{HADITH_OF_DAY.reference}</span>
                                <span className="px-3 py-1 border border-slate-200 rounded-full">বর্ণনায়: {HADITH_OF_DAY.narrator}</span>
                            </div>
                        </div>
                    </div>

                    {/* Noorani Learning Steps */}
                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none w-64 h-64 translate-x-1/4 translate-y-1/4">
                            <Heart className="w-full h-full" />
                        </div>
                        
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                                    <Heart size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800">নূরানী পদ্ধতিতে কুরআন শিক্ষা</h3>
                            </div>
                            <button className="text-xs font-black text-teal-600 bg-teal-50 px-4 py-2 rounded-full hover:bg-teal-500 hover:text-white transition-colors">
                                শুরু করুন
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {NOORANI_STEPS.map((step, idx) => (
                                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-200 transition-colors cursor-pointer">
                                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 font-black flex items-center justify-center shrink-0 shadow-inner">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 mb-1">{step.title}</h4>
                                        <p className="text-[12px] font-medium text-slate-500 leading-relaxed">{step.desc}</p>
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

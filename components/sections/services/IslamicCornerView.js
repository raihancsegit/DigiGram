'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Sunrise, Compass, BookOpen, Heart, Info, Clock, CheckCircle2, ChevronRight, CalendarDays, Star, BookOpenCheck, Bookmark, ChevronDown } from 'lucide-react';

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
        <div className="pb-16 pt-4">
            {/* 1. Hero Section */}
            <div className="relative rounded-[40px] bg-[#0f2115] border border-emerald-900 overflow-hidden px-6 py-16 md:p-20 mb-16 shadow-2xl">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/20 blur-[150px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/20 blur-[150px] rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
                
                {/* Decorative Islamic Pattern */}
                <div className="absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cpath d=\\'M54.627 0l.83.83-25.048 25.048-25.048-25.048.83-.83 24.218 24.218L54.627 0zm-49.254 60l-.83-.83 25.048-25.048 25.048 25.048-.83.83-24.218-24.218L5.373 60zm49.254-60l.83.83-23.774 23.774 23.774 23.774-.83.83-24.604-24.604L4.567.83l.83-.83 23.774 23.774L54.627 0z\\' fill=\\'%23ffffff\\' fill-opacity=\\'1\\' fill-rule=\\'evenodd\\'/%3E%3C/svg%3E')" }}></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-center md:text-left max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md shadow-sm">
                            <Moon size={14} className="fill-emerald-300" /> স্মার্ট ইসলামিক সেবা
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.2] mb-6">
                            ইসলামিক টাইমলাইন ও <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">স্মার্ট ইবাদত গাইড</span>
                        </h2>
                        <p className="text-lg text-emerald-100/80 font-medium mb-8 leading-relaxed max-w-xl">
                            এলাকার নামাজের সঠিক সময়সূচি, কিবলা দিকনির্দেশনা, দৈনিক হাদিস, কোরআন শিক্ষা এবং যাকাত ক্যালকুলেট করার এক কমপ্লিট সল্যুশন।
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button onClick={() => document.getElementById('prayer-times').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-lg hover:from-emerald-400 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2">
                                <Clock size={20} />
                                আজকের সময়সূচি
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Compass size={32} className="text-emerald-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={100} suffix="%" /></div>
                            <p className="text-[10px] font-black text-emerald-200/50 uppercase tracking-widest">এলাকা ভিত্তিক সঠিকতা</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md mt-6 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <BookOpenCheck size={32} className="text-teal-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={30} suffix="+" /></div>
                            <p className="text-[10px] font-black text-teal-200/50 uppercase tracking-widest">দৈনিক ইসলামিক কন্টেন্ট</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Highlight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                <div className="bg-gradient-to-br from-white to-emerald-50 p-8 rounded-[32px] border border-emerald-100 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                            <CalendarDays size={24} />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">আজকের হিজরি তারিখ</h4>
                        <p className="text-2xl font-black text-emerald-900">২৫ শাওয়াল, ১৪৪৭ হিজরি</p>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-white to-teal-50 p-8 rounded-[32px] border border-teal-100 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-4">
                            <Clock size={24} />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-teal-600 mb-1">বর্তমান সময়</h4>
                        <p className="text-3xl font-black text-teal-900 font-mono tracking-tight">{currentTime || '...'}</p>
                    </div>
                </div>
            </div>

            <div id="prayer-times" className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-16">
                {/* ── Left Column: Prayer Times ── */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-gradient-to-b from-emerald-900 to-[#0a150d] rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group border border-emerald-800 h-full">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="text-center mb-10 mt-4 bg-black/20 p-6 rounded-[24px] border border-white/5 backdrop-blur-md">
                                <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                                    <Clock size={14} /> পরবর্তী ওয়াক্ত: আসর
                                </p>
                                <div className="text-5xl font-black tracking-wider drop-shadow-md font-mono text-white">{countdown}</div>
                            </div>

                            <div className="space-y-3 mb-8 flex-1">
                                {PRAYER_TIMES.map((prayer, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`flex items-center justify-between p-5 rounded-[24px] transition-all duration-300 ${
                                            prayer.current 
                                            ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 transform scale-105 my-4 border-[3px] border-emerald-400' 
                                            : 'bg-white/5 text-emerald-50 border border-white/5 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${prayer.current ? 'bg-white/20' : 'bg-black/20 text-emerald-400'}`}>
                                                <prayer.icon size={20} />
                                            </div>
                                            <span className="font-bold text-xl">{prayer.name}</span>
                                        </div>
                                        <span className={`font-black text-xl tracking-wide ${prayer.current ? 'text-white' : 'opacity-80 font-mono text-lg' }`}>
                                            {prayer.time}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-auto flex items-start gap-4 bg-black/30 rounded-[20px] p-5 border border-white/10 backdrop-blur-md">
                                <Info size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] font-bold text-slate-300 leading-relaxed">
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
                        <div className="bg-white rounded-[40px] p-8 md:p-10 border border-slate-100 shadow-sm flex flex-col relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] transform group-hover:scale-110 transition-transform duration-1000">
                                <BookOpen size={250} />
                            </div>
                            <div className="flex items-center gap-3 mb-8 relative z-10">
                                <div className="p-3 rounded-2xl bg-teal-50 text-teal-600 shadow-inner">
                                    <Star size={20} className="fill-current" />
                                </div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">আজকের হাদিস</h3>
                            </div>
                            
                            <div className="flex-1 flex flex-col justify-center text-center px-4 relative z-10">
                                <p className="text-3xl lg:text-4xl font-arabic text-teal-800 leading-normal mb-6 font-medium">
                                    {HADITH_OF_DAY.arabic}
                                </p>
                                <p className="text-lg font-bold text-slate-700 leading-relaxed mb-6">
                                    "{HADITH_OF_DAY.bangla}"
                                </p>
                            </div>

                            <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest relative z-10">
                                <span className="bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Bookmark size={12}/> {HADITH_OF_DAY.reference}</span>
                                <span>বর্ণনায়: {HADITH_OF_DAY.narrator}</span>
                            </div>
                        </div>

                        {/* Daily Dua */}
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[40px] p-8 md:p-10 border border-blue-100 shadow-sm flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10 mix-blend-overlay"></div>
                            
                            <div className="flex items-center gap-3 mb-8 relative z-10">
                                <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-600 shadow-inner">
                                    <Heart size={20} className="fill-current" />
                                </div>
                                <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest">দৈনন্দিন দোয়া</h3>
                            </div>
                            
                            <div className="flex-1 flex flex-col justify-center text-center relative z-10 px-4">
                                <h4 className="text-[10px] font-black text-indigo-500 mb-6 bg-white shadow-sm inline-block px-4 py-2 rounded-full mx-auto uppercase tracking-widest border border-indigo-100">{DAILY_DUA.title}</h4>
                                <p className="text-3xl lg:text-4xl font-arabic text-indigo-900 leading-normal mb-6 font-medium">
                                    {DAILY_DUA.arabic}
                                </p>
                                <p className="text-sm font-bold text-indigo-800/80 leading-relaxed bg-white/50 p-4 rounded-2xl border border-white">
                                    <span className="text-indigo-500 uppercase tracking-widest text-[9px] block mb-1">অর্থ</span>
                                    {DAILY_DUA.bangla}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Noorani Learning Steps */}
                    <div className="bg-white rounded-[40px] p-8 md:p-10 border border-slate-100 shadow-sm flex-1 relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2">নূরানী কুরআন শিক্ষা</h3>
                                <p className="text-sm font-medium text-slate-500">শুদ্ধভাবে কুরআন তেলাওয়াত শিখুন, ঘরে বসেই ধাপে ধাপে</p>
                            </div>
                            <button className="text-sm font-black text-white bg-slate-900 px-8 py-4 rounded-[20px] hover:bg-teal-600 transition-colors shadow-lg active:scale-95 flex items-center gap-2">
                                কোর্স শুরু করুন <ChevronRight size={18} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                            {NOORANI_STEPS.map((step, idx) => (
                                <div key={idx} className="flex flex-col gap-4 p-6 rounded-[28px] bg-slate-50 border border-slate-100 hover:border-teal-300 hover:bg-teal-50 hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden">
                                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-teal-100 rounded-full opacity-0 group-hover:opacity-50 transition-opacity blur-xl"></div>
                                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm text-teal-600 font-black text-xl flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:text-white transition-colors relative z-10 border border-slate-100 group-hover:border-teal-500">
                                        ০{idx + 1}
                                    </div>
                                    <div className="relative z-10">
                                        <h4 className="text-base font-black text-slate-800 mb-2">{step.title}</h4>
                                        <p className="text-xs font-bold text-slate-500 leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Additional Tools */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 rounded-[32px] p-8 border border-emerald-100 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-100 hover:shadow-lg transition-all">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm mb-4">
                        <Compass size={28} />
                    </div>
                    <h4 className="font-black text-emerald-900 mb-2">কিবলা কম্পাস</h4>
                    <p className="text-[11px] font-bold text-emerald-700/80">মোবাইলের জিপিএস ব্যবহার করে সঠিক দিক নির্ণয়</p>
                </div>
                <div className="bg-amber-50 rounded-[32px] p-8 border border-amber-100 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-100 hover:shadow-lg transition-all">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-amber-600 shadow-sm mb-4">
                        <Star size={28} />
                    </div>
                    <h4 className="font-black text-amber-900 mb-2">যাকাত ক্যালকুলেটর</h4>
                    <p className="text-[11px] font-bold text-amber-700/80">সহজেই হিসাব করুন আপনার বাৎসরিক যাকাত</p>
                </div>
                <div className="bg-indigo-50 rounded-[32px] p-8 border border-indigo-100 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-100 hover:shadow-lg transition-all">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm mb-4">
                        <BookOpen size={28} />
                    </div>
                    <h4 className="font-black text-indigo-900 mb-2">ডিজিটাল তাসবিহ</h4>
                    <p className="text-[11px] font-bold text-indigo-700/80"> স্ক্রিনে ট্যাপ করে অনায়াসে জিকির গণনা</p>
                </div>
            </div>

        </div>
    );
}

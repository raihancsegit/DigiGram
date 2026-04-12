'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MonitorSmartphone, FileText, Banknote, Users, CheckCircle2, ArrowRight, ShieldCheck, Landmark, Globe, Smartphone, Clock, Database, Phone } from 'lucide-react';

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

export default function UpSebaView() {
    return (
        <div className="pb-16 pt-4">
            {/* 1. Hero Section */}
            <div className="relative rounded-[40px] bg-sky-950 border border-sky-900 overflow-hidden px-6 py-16 md:p-20 mb-16 shadow-2xl">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/20 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/20 blur-[150px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="text-center lg:text-left max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sky-200 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md shadow-sm">
                            <Landmark size={14} className="text-sky-400" /> স্মার্ট ইউনিয়ন ম্যানেজমেন্ট সিস্টেম
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.2] mb-6">
                            ইউনিয়ন পরিষদের সকল সেবা <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">এখন আপনার গুগল ট্যাবে</span>
                        </h2>
                        <p className="text-lg text-sky-100/80 font-medium mb-8 leading-relaxed max-w-xl">
                            ডিজিগ্রাম ই-ইউপি সেবা (E-UP Seba) হলো একটি স্বয়ংসম্পূর্ণ সফটওয়্যার সিস্টেম। இதன் মাধ্যমে ডিজিটাল সনদপত্র প্রদান, হোল্ডিং ট্যাক্স আদায় এবং নাগরিক সেবা দেওয়া যায় আরও দ্রুত ও স্বচ্ছতার সাথে।
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button className="w-full sm:w-auto px-10 py-5 rounded-[20px] bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-lg hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/30 active:scale-95 flex items-center justify-center gap-3">
                                ই-ইউপি পোর্টালে লগইন <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="relative w-full max-w-lg lg:w-[45%] shrink-0 perspective-1000">
                        {/* Mockup Presentation */}
                        <div className="relative bg-slate-900 rounded-[32px] p-4 border-[8px] border-slate-800 shadow-2xl transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700">
                            <div className="w-full h-8 bg-slate-800 rounded-t-xl mb-3 flex items-center px-4 gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            </div>
                            <div className="bg-slate-50 rounded-xl overflow-hidden relative">
                                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop" className="w-full h-auto opacity-90" alt="Software Dashboard" />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-sky-900/90 flex flex-col justify-end p-6">
                                    <div className="flex items-center gap-2 text-white font-black text-lg">
                                        <ShieldCheck className="text-emerald-400" /> সিকিউরড ড্যাশবোর্ড
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Core Features */}
            <div className="mb-20">
                <div className="text-center mb-16">
                    <h3 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">ডিজিগ্রাম ই-ইউপি সফটওয়্যারের মূল ফিচারসমূহ</h3>
                    <p className="text-slate-500 font-medium max-w-2xl mx-auto">নাগরিক সেবা সহজীকরণ এবং ইউনিয়ন পরিষদের দাপ্তরিক কাজ শতভাগ পেপারলেস করতে আমাদের সফটওয়্যারের জুড়ি নেই।</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-sky-200 transition-all group">
                        <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all">
                            <FileText size={28} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-3">ডিজিটাল সনদপত্র ইস্যু</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">জন্ম নিবন্ধন, ট্রেড লাইসেন্স, নাগরিকত্ব সনদ, চারিত্রিক সনদ, উত্তরাধিকার সনদসহ প্রায় ২০টির বেশি সনদপত্র ১ ক্লিকেই প্রিন্ট করুন ও পেমেন্ট রিসিভ দিন।</p>
                    </div>

                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <Banknote size={28} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-3">হোল্ডিং ট্যাক্স কালেকশন</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">ওয়ার্ড ভিত্তিক সকল বসতবাড়ির ডেটাবেস, স্বয়ংক্রিয় ট্যাক্স ক্যালকুলেশন এবং বকেয়া নোটিশ প্রদান। ট্যাক্স কালেক্টরদের জন্য রয়েছে বিশেষ মোবাইল ভিউ।</p>
                    </div>

                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                            <Users size={28} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-3">দরিদ্র ভাতা ও নাগরিক তালিকা</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">দুস্থ, বয়স্ক ও বিধবা ভাতাভোগীদের ডিজিটাল তালিকা। ভুল বা ডাবল এন্ট্রি রোধে সরাসরি এনআইডি ও জন্ম নিবন্ধন ভেরিফিকেশন সিস্টেম।</p>
                    </div>

                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all group">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all">
                            <Database size={28} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-3">কাস্টম ডেটাবেস ও আর্কাইভ</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">পুরোনো খসড়া বা খাতা আর খুঁজতে হবে না। ক্লাউড সার্ভারে সকল তথ্য আজীবনের জন্য সুরক্ষিত। যেকোনো সময় যেকোনো ডেটা সার্চ করে বের করুন।</p>
                    </div>

                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-rose-200 transition-all group">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all">
                            <Clock size={28} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-3">স্বয়ংক্রিয় রিপোর্টিং</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">দৈনিক বা মাসিক কত টাকা আয় হলো, কতগুলো সনদ ইস্যু হলো তার অটোমেটেড ড্যাশবোর্ড এবং রিয়েল-টাইম গ্রাফিক্যাল রিপোর্ট।</p>
                    </div>

                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all group">
                        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-white transition-all">
                            <Smartphone size={28} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-3">এসএমএস ইন্টিগ্রেশন ও পেমেন্ট</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">সনদ রেডি হলে বা ট্যাক্স জমা দিলে নাগরিকের মোবাইলে সাথে সাথে এসএমএস অ্যালার্ট চলে যাবে। ডিজিটাল পেমেন্ট গেটওয়ের সুবিধা রয়েছে।</p>
                    </div>
                </div>
            </div>

            {/* 3. Statistical Punching / Authority Banner */}
            <div className="mb-20 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-sky-50 rounded-[40px] p-10 md:p-14 border border-sky-100 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Globe size={200} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black text-sky-900 mb-4 leading-tight">স্মার্ট বাংলাদেশ বিনির্মাণে<br />ডিজিটাল ইউনিয়ন পরিষদ</h3>
                        <p className="text-base font-bold text-sky-800/80 mb-8 max-w-xl">
                            এপ্রিল ২০২৬ এর মধ্যে আমরা টার্গেট করেছি অন্তত ৫০+ ইউনিয়ন পরিষদকে আমাদের ডিজিটাল সফটওয়্যারের আওতায় আনার। কাগজ-কলমের হিসাব বাদ দিয়ে আজই আপনার পরিষদকে ডিজিটালাইজ করুন।
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-xs font-black text-sky-700 shadow-sm border border-sky-100">
                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> ১০০% ক্লাউড ব্যাকআপ
                            </div>
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-xs font-black text-sky-700 shadow-sm border border-sky-100">
                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> ২৪/৭ সাপোর্ট
                            </div>
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-xs font-black text-sky-700 shadow-sm border border-sky-100">
                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> কাস্টম মডিউল
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-slate-900 rounded-[40px] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden text-white shadow-xl">
                    <div className="w-20 h-20 bg-sky-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-sky-500/30">
                        <MonitorSmartphone size={36} />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-sky-400 mb-2">সিস্টেম প্রস্তুত</h4>
                    <p className="text-3xl font-black mb-4"><AnimatedCounter end={100} suffix="%" /></p>
                    <p className="text-sm font-bold text-slate-300">আমাদের ই-ইউপি সফটওয়্যার লাইভ পরিবেশের জন্য শতভাগ প্রস্তুত এবং পরীক্ষিত।</p>
                </div>
            </div>

            {/* 4. Footer CTA */}
            <div className="mt-8 bg-gradient-to-tr from-sky-600 to-blue-700 rounded-[40px] p-8 md:p-14 border border-blue-500 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-cyan-400/20 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="relative z-10 w-full text-center md:text-left">
                    <h3 className="text-3xl md:text-4xl font-black text-white mb-4 line-relaxed">
                        আপনার ইউনিয়ন পরিষদে কি <br/><span className="text-cyan-300">সিস্টেমটি ইন্টিগ্রেট করতে চান?</span>
                    </h3>
                    <p className="text-sky-100 font-medium max-w-xl text-base md:text-lg">
                        সিস্টেমের ডেমো দেখতে অথবা আপনার পরিষদের জন্য কাস্টমাইজেশন নিয়ে আলোচনা করতে আমাদের সাথে সরাসরি যোগাযোগ করুন।
                    </p>
                </div>
                <div className="shrink-0 w-full md:w-auto relative z-10 flex flex-col gap-4">
                    <button className="w-full px-8 py-5 rounded-[20px] bg-white text-blue-700 font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2">
                        আমাদের সাথে কথা বলুন <Phone size={20} />
                    </button>
                    <button className="w-full px-8 py-4 rounded-[20px] bg-white/10 border border-white/20 text-white font-black text-base hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2 backdrop-blur-md">
                        সফটওয়্যার ডেমো দেখুন
                    </button>
                </div>
            </div>

        </div>
    );
}

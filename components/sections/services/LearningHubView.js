'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, GraduationCap, Laptop, Presentation, Code, Globe, PlayCircle, Trophy, Star, Target, Users, CheckCircle2, ArrowRight, Award } from 'lucide-react';

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

const COURSES = [
    { title: 'ফ্রিল্যান্সিং ও আউটসোর্সিং', category: 'ক্যারিয়ার', icon: Laptop, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'ওয়েব ও অ্যাপ ডেভেলপমেন্ট', category: 'প্রোগ্রামিং', icon: Code, color: 'text-purple-500', bg: 'bg-purple-50' },
    { title: 'গ্রাফিক ও ইউআই/ইউএক্স ডিজাইন', category: 'ক্রিয়েটিভ', icon: Presentation, color: 'text-rose-500', bg: 'bg-rose-50' },
    { title: 'ডিজিটাল মার্কেটিং', category: 'মার্কেটিং', icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

export default function LearningHubView() {
    return (
        <div className="pb-16 pt-4">
            {/* 1. Hero Section */}
            <div className="relative rounded-[40px] bg-indigo-950 border border-indigo-900 overflow-hidden px-6 py-16 md:p-20 mb-16 shadow-2xl">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/20 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/20 blur-[150px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-center md:text-left max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md shadow-sm">
                            <GraduationCap size={14} className="text-cyan-400" /> ডিজিগ্রাম লার্নিং ও ক্যারিয়ার হাব
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.2] mb-6">
                            নিজের দক্ষতাকে শাণিত করুন, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300">ভবিষ্যতকে করুন সুরক্ষিত</span>
                        </h2>
                        <p className="text-lg text-indigo-100/80 font-medium mb-8 leading-relaxed max-w-xl">
                            একাডেমিক পড়াশোনার পাশাপাশি চাকরি বাজার কিংবা ফ্রিল্যান্সিংয়ের জন্য নিজেকে প্রস্তুত করতে আজই এনরোল করুন আমাদের ফ্রি কোর্সসমূহে।
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button className="w-full sm:w-auto px-8 py-5 rounded-[20px] bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-lg hover:from-cyan-400 transition-all shadow-lg shadow-cyan-500/25 active:scale-95 flex items-center justify-center gap-2">
                                <PlayCircle size={20} className="fill-current" />
                                শিখতে শুরু করুন
                            </button>
                            <button className="w-full sm:w-auto px-8 py-5 rounded-[20px] bg-white/10 text-white font-black text-lg hover:bg-white/20 transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-2">
                                ক্যারিয়ার গাইডলাইন দেখুন
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
                        <div className="bg-black/20 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md">
                            <Trophy size={32} className="text-amber-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={12} /></div>
                            <p className="text-[10px] font-black text-indigo-200/50 uppercase tracking-widest">স্কিল ডেভেলপমেন্ট কোর্স</p>
                        </div>
                        <div className="bg-black/20 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md mt-6">
                            <Users size={32} className="text-cyan-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={8} suffix=".৫ লাখ" /></div>
                            <p className="text-[10px] font-black text-indigo-200/50 uppercase tracking-widest">ভর্তি হওয়া শিক্ষার্থী</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Top Skills Section */}
            <div className="mb-20">
                <div className="text-center mb-12">
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-4">ডিজিটাল স্কিলসমূহ আয়ত্ত করুন</h3>
                    <p className="text-slate-500 font-medium max-w-md mx-auto">ভবিষ্যতের সেরা ক্যারিয়ার গড়তে যেসব স্কিলগুলো শেখা অত্যন্ত জরুরি।</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {COURSES.map((course, idx) => (
                         <div key={idx} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                             <div className={`w-16 h-16 rounded-2xl ${course.bg} ${course.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                 <course.icon size={28} />
                             </div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{course.category}</p>
                             <h4 className="text-xl font-black text-slate-800 mb-4">{course.title}</h4>
                             <button className="flex items-center gap-2 text-sm font-black text-slate-400 group-hover:text-blue-600 transition-colors">
                                 প্রিভিউ দেখুন <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                             </button>
                         </div>
                    ))}
                </div>
            </div>

            {/* 3. Success Methods */}
            <div className="bg-blue-50 border border-blue-100 rounded-[40px] p-10 md:p-14 mb-16 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                    <Target size={250} />
                </div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h3 className="text-3xl font-black text-blue-900 mb-6 leading-tight">কেন আমাদের লার্নিং হাব সেরা?</h3>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-blue-600 flex items-center justify-center shrink-0">
                                    <Star size={24} />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-800 text-lg mb-1">ইন্ডাস্ট্রি এক্সপার্ট মেন্টরশিপ</h4>
                                    <p className="text-sm font-bold text-slate-500 leading-relaxed">শীর্ষ আইটি কোম্পানির এক্সপার্টদের তৈরি মানসম্মত টিউটোরিয়াল এবং গাইডলাইন।</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-blue-600 flex items-center justify-center shrink-0">
                                    <BookOpen size={24} />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-800 text-lg mb-1">প্র্যাক্টিক্যাল প্রজেক্ট-বেজড লার্নিং</h4>
                                    <p className="text-sm font-bold text-slate-500 leading-relaxed">কেবল থিওরি নয়, হাতে কলমে রিয়েল লাইফ প্রজেক্ট করে শেখার সুবিধা রয়েছে।</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-blue-600 flex items-center justify-center shrink-0">
                                    <Award size={24} />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-800 text-lg mb-1">সার্টিফিকেট ও জব প্লেসমেন্ট</h4>
                                    <p className="text-sm font-bold text-slate-500 leading-relaxed">সফলভাবে কোর্স শেষ করার পর মক ইন্টারভিউ এবং জব প্লেসমেন্টে সরাসরি সহায়তা।</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="bg-white p-4 rounded-[32px] border-[8px] border-white shadow-2xl relative z-10 transform md:rotate-2 hover:rotate-0 transition-transform">
                            <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden relative group cursor-pointer flex items-center justify-center">
                                <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" alt="Video cover" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                        <PlayCircle size={40} className="text-white ml-2" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-blue-200/50 rounded-full blur-[40px] pointer-events-none"></div>
                    </div>
                </div>
            </div>

            {/* 4. CTA */}
            <div className="mt-8 bg-slate-900 rounded-[40px] p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="relative z-10 w-full text-center md:text-left">
                    <h3 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                        ক্যারিয়ারের পরবর্তী ধাপের জন্য<br/><span className="text-cyan-400">আপনি কি প্রস্তুত?</span>
                    </h3>
                    <p className="text-slate-300 font-medium max-w-lg text-base">
                        আজই ফ্রি একাউন্ট তৈরি করুন এবং যেকোনো কোর্স সিলেক্ট করে শেখা শুরু করে দিন।
                    </p>
                </div>
                <div className="shrink-0 w-full md:w-auto relative z-10">
                    <button className="w-full px-10 py-5 rounded-[24px] bg-cyan-500 text-slate-900 font-black text-lg shadow-xl shadow-cyan-500/20 hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2">
                        ফ্রি এনরোল করুন <ArrowRight size={20} />
                    </button>
                </div>
            </div>

        </div>
    );
}

"use client"
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
    Sparkles, Camera, Activity, Mic, 
    ShieldCheck, Box, Cpu,
    ArrowUpRight, Info, User, Search
} from 'lucide-react';

const AI_MODULES = [
    {
        id: 'agri-vision',
        title: 'Agri-Vision AI',
        desc: 'ফসলের পাতার ছবি থেকে তাৎক্ষণিক রোগ শনাক্তকরণ ও সঠিক প্রতিকার পরামর্শ।',
        icon: Camera,
        progress: 85,
        status: 'বেটা টেস্টিং',
        color: 'from-emerald-500 to-teal-600',
    },
    {
        id: 'health-ocr',
        title: 'Health-OCR Assistant',
        desc: 'প্রেসক্রিপশন স্ক্যান করে বাংলা ভাষায় ওষুধের ডোজ ও নিয়মাবলী ব্যাখ্যা।',
        icon: Activity,
        progress: 60,
        status: 'ডেভেলপমেন্ট',
        color: 'from-blue-500 to-indigo-600',
    },
    {
        id: 'voice-portal',
        title: 'Regional Voice Guide',
        desc: 'আঞ্চলিক ভাষায় ভয়েস কমান্ডের মাধ্যমে সরকারি ফরম পূরণ ও সেবা অনুসন্ধান।',
        icon: Mic,
        progress: 45,
        status: 'গবেষণা',
        color: 'from-amber-500 to-orange-600',
    },
    {
        id: 'smart-tutor',
        title: 'Adaptive Tutor AI',
        desc: 'শিক্ষার্থীদের মেধা যাচাই ও কুইজ রেজাল্ট অনুযায়ী ব্যক্তিগত পড়াশোনা পরিকল্পনা।',
        icon: Sparkles,
        progress: 70,
        status: 'বেটা টেস্টিং',
        color: 'from-violet-500 to-purple-600',
    },
    {
        id: 'fraud-shield',
        title: 'Fraud Alert AI',
        desc: 'সমিতি ও লেনদেনের প্যাটার্ন মনিটরিং করে আর্থিক জালিয়াতি শনাক্তকরণ।',
        icon: ShieldCheck,
        progress: 30,
        status: 'গবেষণা',
        color: 'from-rose-500 to-red-600',
    }
];

export default function FutureAiPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white pb-32">
            
            {/* AI Hero Banner */}
            <div className="relative pt-24 pb-32 px-4 overflow-hidden">
                {/* Tech Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[150px]" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px]" />
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                </div>

                <div className="max-w-[1200px] mx-auto text-center relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-black uppercase tracking-[0.2em] mb-8"
                    >
                        <Sparkles size={14} className="animate-pulse" />
                        DigiAI · ইনোভেশন ল্যাব
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-black mb-8 leading-[1.1] tracking-tight"
                    >
                        গ্রামের সেবায় <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-sky-400 to-indigo-400">স্মার্ট আর্টিফিশিয়াল ইন্টেলিজেন্স</span>
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 font-medium leading-relaxed"
                    >
                        আমরা কাজ করছি অত্যাধুনিক এআই নিয়ে যা সরাসরি গ্রাম বাংলার মানুষের জীবন সহজ করবে। নিচের মডিউলগুলো পর্যায়ক্রমে আপনার ডিভাইসে যুক্ত হবে।
                    </motion.p>
                </div>
            </div>

            {/* AI Modules Grid */}
            <div className="max-w-[1200px] mx-auto px-4 -mt-16 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {AI_MODULES.map((module, i) => (
                        <motion.div
                            key={module.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[32px] p-8 hover:border-teal-500/50 transition-all duration-500 overflow-hidden"
                        >
                            {/* Scanning Animation Effect */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                                <motion.div 
                                    animate={{ y: ['-100%', '200%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="w-full h-20 bg-gradient-to-b from-transparent via-teal-500/20 to-transparent"
                                />
                            </div>

                            <div className="relative z-10">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center text-white mb-8 shadow-lg ring-4 ring-slate-900 group-hover:scale-110 transition-transform duration-500`}>
                                    <module.icon size={32} />
                                </div>
                                
                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <h3 className="text-xl font-black">{module.title}</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                        {module.status}
                                    </span>
                                </div>

                                <p className="text-sm font-medium text-slate-400 leading-relaxed mb-8">
                                    {module.desc}
                                </p>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <span>ডেভেলপমেন্ট প্রগ্রেস</span>
                                        <span className="text-teal-400 tabular-nums">{module.progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${module.progress}%` }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className={`h-full bg-gradient-to-r ${module.color}`}
                                        />
                                    </div>
                                </div>

                                <button className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-teal-400 hover:text-teal-300 transition-colors">
                                    বিস্তারিত জানুন
                                    <ArrowUpRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {/* Placeholder Card */}
                    <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[32px] p-8 flex flex-col items-center justify-center text-center group cursor-help">
                        <div className="w-16 h-16 rounded-full border-2 border-slate-800 flex items-center justify-center text-slate-700 mb-4 group-hover:border-teal-500/30 group-hover:text-teal-500/50 transition-colors">
                            <Box size={32} />
                        </div>
                        <h4 className="text-sm font-black text-slate-600 uppercase tracking-widest">নতুন এআই আইডিয়া?</h4>
                        <p className="text-xs font-bold text-slate-700 mt-2">আপনার এলাকার জন্য কী ধরনের এআই প্রয়োজন আমাদের জানান।</p>
                    </div>
                </div>
            </div>

            {/* Technical Context */}
            <div className="max-w-[800px] mx-auto mt-24 px-4 text-center">
                <div className="inline-flex items-center gap-6 px-8 py-4 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <Cpu size={16} className="text-slate-500" />
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">TensorFlow Ready</span>
                    </div>
                    <div className="w-px h-4 bg-slate-800" />
                    <div className="flex items-center gap-2">
                        <Box size={16} className="text-slate-500" />
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">LLM Pipeline</span>
                    </div>
                    <div className="w-px h-4 bg-slate-800" />
                    <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-500" />
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Village OCR</span>
                    </div>
                </div>
                <p className="mt-8 text-xs font-bold text-slate-600">পাওয়ারড বাই: Google Gemini & OpenAI Vision APIs। ফেজ-৫ ডেপ্লয়মেন্টের জন্য নির্ধারিত।</p>
            </div>
        </div>
    );
}

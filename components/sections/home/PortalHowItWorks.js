'use client';

import { motion } from 'framer-motion';
import { MousePointer2, LayoutDashboard, Zap, ArrowRight } from 'lucide-react';

const steps = [
    {
        title: 'এলাকা নির্বাচন করুন',
        desc: 'আপনার জেলা, উপজেলা ও ইউনিয়ন সিলেক্ট করে পোর্টালে প্রবেশ করুন।',
        icon: MousePointer2,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
    },
    {
        title: 'আপনার পোর্টাল',
        desc: 'আপনার ইউনিয়নের সব সেবা (ব্লাড, ই-ইউপি, স্কুল) এক স্ক্রিনে চলে আসবে।',
        icon: LayoutDashboard,
        iconSize: 24,
        color: 'text-teal-600',
        bg: 'bg-teal-50',
    },
    {
        title: 'দ্রুত সেবা নিন',
        desc: 'এখন আপনি সরাসরি আপনার ইউনিয়ন ও গ্রাম ভিত্তিক সেবাগুলো ব্যবহার করতে পারবেন।',
        icon: Zap,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
    },
];

export default function PortalHowItWorks() {
    return (
        <section className="dg-section-x py-10 md:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-xs font-black uppercase tracking-[0.2em] mb-4"
                    >
                        <Zap size={14} className="fill-current" />
            ডিজিগ্র্যাম পোর্টাল
                    </motion.div>
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-4">
                        কিভাবে কাজ করে?
                    </h2>
                    <p className="text-sm sm:text-lg text-slate-500 max-w-2xl mx-auto font-medium">
                        আপনার এরিয়া সিলেক্ট করার সাথে সাথেই পুরো অ্যাপটি আপনার ইউনিয়নের পোর্টালে রূপান্তর হবে।
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connection Lines (Desktop) */}
                    <div className="hidden md:block absolute top-1/2 left-[20%] right-[20%] h-0.5 border-t-2 border-dashed border-slate-100 -translate-y-12 z-0" />

                    {steps.map((step, i) => (
                        <motion.div
                            key={step.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2 }}
                            className="relative z-10 flex flex-col items-center text-center group"
                        >
                            <div className={`w-20 h-20 rounded-[32px] ${step.bg} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                                <step.icon className={step.color} size={32} />
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                                    ০{i + 1}
                                </span>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">{step.title}</h3>
                            </div>
                            <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-[240px]">
                                {step.desc}
                            </p>
                            
                            {i < steps.length - 1 && (
                                <div className="md:hidden mt-6 text-slate-200">
                                    <ArrowRight className="rotate-90" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-12 md:mt-20 p-6 md:p-8 rounded-[32px] md:rounded-[40px] bg-gradient-to-br from-slate-900 to-teal-900 text-white text-center relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                    <div className="relative z-10">
                        <h4 className="text-xl sm:text-2xl font-black mb-4">আপনার ইউনিয়ন কি এখনো যুক্ত হয়নি?</h4>
                        <p className="text-sm sm:text-base text-teal-100/70 mb-8 max-w-xl mx-auto font-medium">
                            আমরা সারা বাংলাদেশে ধাপে ধাপে আমাদের স্মার্ট পোর্টালগুলো চালু করছি। অপেক্ষায় থাকুন!
                        </p>
                        <button className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-slate-900 font-extrabold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-teal-900/40">
                            অনুরোধ পাঠান
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

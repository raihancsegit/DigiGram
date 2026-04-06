"use client";

import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/store/features/authSlice';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
    Globe, Users, Phone, ArrowRight, 
    ShieldCheck, Smartphone, Sparkles, LogIn 
} from 'lucide-react';


export default function LoginPage() {
    const router = useRouter();
    const dispatch = useDispatch();

    return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col md:flex-row bg-white overflow-hidden">
            
            {/* Left: Branding & Welcome (Desktop Only or Responsive Overlay) */}
            <div className="relative w-full md:w-1/2 lg:w-[55%] bg-slate-900 overflow-hidden flex flex-col justify-center p-8 sm:p-12 md:p-20">
                {/* Background Decor */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-teal-500 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[150px] translate-x-1/2 translate-y-1/2" />
                </div>

                <div className="relative z-10 max-w-lg">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-16 h-16 rounded-2xl bg-teal-500/20 backdrop-blur-xl border border-teal-500/30 flex items-center justify-center mb-8"
                    >
                        <ShieldCheck className="text-teal-400" size={32} />
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-8"
                    >
                        আপনার গ্রাম, <br />
                        এখন <span className="text-teal-400">ডিজিটাল।</span>
                    </motion.h1>

                    <motion.ul 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-4 mb-12"
                    >
                        {[
                            'তাত্ক্ষণিক ইউনিয়ন পরিষদ সেবা',
                            'সকল নোটিশ ও খবরের লাইভ আপডেট',
                            'এআই চালিত স্মার্ট কৃষি ও স্বাস্থ্য গাইড',
                            'নিরাপদ ও আধুনিক কমিউনিটি প্ল্যাটফর্ম'
                        ].map((item, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-slate-300 font-bold">
                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                {item}
                            </li>
                        ))}
                    </motion.ul>

                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-sm font-medium text-slate-500"
                    >
                        &copy; ২০২৬ ডিজিগ্রাম প্ল্যাটফর্ম। সেবা, শিক্ষা ও সমৃদ্ধির ডিজিটাল সেতুবন্ধন।
                    </motion.p>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="w-full md:w-1/2 lg:w-[45%] flex items-center justify-center p-6 sm:p-12 md:p-16 bg-slate-50">
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                    className="w-full max-w-sm"
                >
                    <div className="mb-10 text-center md:text-left">
                        <h2 className="text-3xl font-black text-slate-800 mb-2 flex items-center gap-2 justify-center md:justify-start">
                            স্বাগতম! <LogIn className="text-teal-600" size={24} />
                        </h2>
                        <p className="text-sm font-bold text-slate-500">
                            পাসওয়ার্ড ছাড়াই সরাসরি প্রবেশ করুন
                        </p>
                    </div>

                    <div className="space-y-4 mb-10">
                        {/* Google Button */}
                        <button className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-200 transition-all font-black text-slate-700 active:scale-[0.98] group">
                            <div className="w-6 h-6 flex items-center justify-center">
                                <Globe size={20} className="text-red-500 group-hover:scale-110 transition-transform" />
                            </div>
                            Google দিয়ে প্রবেশ করুন
                        </button>

                        {/* Facebook Button */}
                        <button className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-[#1877F2] text-white shadow-md hover:shadow-xl hover:bg-[#166FE5] transition-all font-black active:scale-[0.98] group">
                            <div className="w-6 h-6 flex items-center justify-center">
                                <Users size={20} className="group-hover:scale-110 transition-transform" />
                            </div>
                            Facebook দিয়ে প্রবেশ করুন
                        </button>
                    </div>

                    <div className="relative mb-10 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <span className="relative px-4 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            অথবা ফোন নম্বর
                        </span>
                    </div>

                    {/* Phone Input */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10 transition-all">
                                <Smartphone size={20} className="text-slate-400" />
                                <span className="text-sm font-black text-slate-800 border-r border-slate-200 pr-3 tabular-nums">+৮৮০</span>
                                <input 
                                    id="phone-input"
                                    type="tel" 
                                    placeholder="১XXX-XXXXXX"
                                    className="flex-1 bg-transparent border-none focus:outline-none text-sm font-black tracking-widest placeholder:text-slate-300 placeholder:font-black"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                const phone = document.getElementById('phone-input').value;
                                if (phone === '১৭০০০০০০০০' || phone === '1700000000') {
                                    dispatch(login({
                                        role: 'WARD_MEMBER',
                                        name: 'মোঃ মেম্বার আলী',
                                        unionId: 'dumuria',
                                        unionName: 'দামকুড়া',
                                        wardId: 'ward-1',
                                        wardName: 'ওয়াড নং ১'
                                    }));
                                    router.push('/ward-member/dashboard');
                                } else {
                                    alert('সাধারণ ইউজার লগইন সিমুলেশন (মেম্বার লগইনের জন্য ১৭০০০০০০০০ ব্যবহার করুন)');
                                }
                            }}
                            className="w-full flex items-center justify-center gap-2 p-5 rounded-[20px] bg-slate-900 text-white font-black text-sm shadow-xl shadow-slate-900/20 hover:bg-teal-600 transition-all active:scale-95"
                        >
                            OTP পাঠান
                            <ArrowRight size={18} />
                        </button>
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-xs font-bold text-slate-400">
                            অ্যাকাউন্ট নেই? <Link href="/register" className="text-teal-600 hover:underline">নতুন খুলুন</Link>
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Mobile Footer Decor */}
            <div className="md:hidden p-8 text-center bg-slate-900">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">প্লাটফর্ম পার্টনার</p>
                 <div className="flex justify-center gap-4 opacity-50 grayscale">
                    <div className="w-8 h-8 rounded bg-white/10" />
                    <div className="w-8 h-8 rounded bg-white/10" />
                    <div className="w-8 h-8 rounded bg-white/10" />
                 </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/store/features/authSlice';
import { authService } from '@/lib/services/authService';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe, Users, Phone, ArrowRight,
    ShieldCheck, Smartphone, Sparkles, LogIn,
    Mail, Lock, Loader2, AlertCircle
} from 'lucide-react';


export default function LoginPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const [loginType, setLoginType] = useState('citizen'); // 'citizen' or 'admin'

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { user, profile } = await authService.loginWithEmail(email, password);
            
            if (!profile) {
                setError('আপনার ইমেইলটি নিবন্ধিত কিন্তু ড্যাশবোর্ড প্রোফাইল পাওয়া যায়নি। অনুগ্রহ করে সুপার অ্যাডমিনের সাথে যোগাযোগ করুন।');
                setLoading(false);
                return;
            }

            // Dispatch to Redux
            dispatch(login({
                id: user.id,
                email: user.email,
                role: profile.role,
                access_scope_id: profile.access_scope_id,
                first_name: profile.first_name,
                last_name: profile.last_name
            }));

            // Redirect based on role
            if (profile.role === 'super_admin') router.push('/admin');
            else if (profile.role === 'chairman') router.push('/chairman/dashboard');
            else if (profile.role === 'ward_member') router.push('/ward-member/dashboard');
            else if (profile.role === 'institution_admin') router.push('/admin/institution');
            else if (profile.role === 'market_manager') router.push('/market-manager');
            else router.push('/');

        } catch (err) {
            setError(err.message || 'লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider) => {
        try {
            await authService.loginWithSocial(provider);
        } catch (err) {
            setError(err.message);
        }
    };

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
                    <div className="mb-10">
                        <h2 className="text-3xl font-black text-slate-800 mb-2 flex items-center gap-2">
                            স্বাগতম! <LogIn className="text-teal-600" size={24} />
                        </h2>
                        <p className="text-sm font-bold text-slate-500 mb-6">
                            আপনার ভূমিকার ওপর ভিত্তি করে প্রবেশ করুন
                        </p>

                        {/* Login Type Tabs */}
                        <div className="flex bg-white p-1 rounded-2xl border border-slate-200">
                            <button
                                onClick={() => setLoginType('citizen')}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${loginType === 'citizen' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                সাধারণ নাগরিক
                            </button>
                            <button
                                onClick={() => setLoginType('admin')}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${loginType === 'admin' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                জনপ্রতিনিধি / এডমিন
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-shake">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {loginType === 'citizen' ? (
                            <motion.div
                                key="citizen"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="space-y-4 mb-10 text-center md:text-left">
                                    {/* Google Button */}
                                    <button
                                        onClick={() => handleSocialLogin('google')}
                                        className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-200 transition-all font-black text-slate-700 active:scale-[0.98] group"
                                    >
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            <Globe size={20} className="text-red-500 group-hover:scale-110 transition-transform" />
                                        </div>
                                        Google দিয়ে প্রবেশ করুন
                                    </button>

                                    {/* Facebook Button */}
                                    <button
                                        onClick={() => handleSocialLogin('facebook')}
                                        className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-[#1877F2] text-white shadow-md hover:shadow-xl hover:bg-[#166FE5] transition-all font-black active:scale-[0.98] group"
                                    >
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            <Users size={20} className="group-hover:scale-110 transition-transform" />
                                        </div>
                                        Facebook দিয়ে প্রবেশ করুন
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="admin"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onSubmit={handleAdminLogin}
                                className="space-y-4"
                            >
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">ইমেইল ঠিকানা</label>
                                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10 transition-all">
                                            <Mail size={18} className="text-slate-400" />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="admin@digigram.com"
                                                className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">পাসওয়ার্ড</label>
                                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10 transition-all">
                                            <Lock size={18} className="text-slate-400" />
                                            <input
                                                type="password"
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 p-5 rounded-[20px] bg-slate-900 text-white font-black text-sm shadow-xl shadow-slate-900/20 hover:bg-teal-600 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                যাচাই করা হচ্ছে...
                                            </>
                                        ) : (
                                            <>
                                                প্রবেশ করুন
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className="mt-12 text-center">
                        <p className="text-xs font-bold text-slate-400">
                            লগইন করতে সমস্যা হচ্ছে? <Link href="/help" className="text-teal-600 hover:underline">সহায়তা নিন</Link>
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

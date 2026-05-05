'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ShieldCheck, Mail, Lock, 
    Loader2, AlertCircle, ArrowRight as LucideArrowRight,
    CheckCircle2
} from 'lucide-react';
import { login } from '@/lib/store/features/authSlice';
import { authService } from '@/lib/services/authService';
import ModalPortal from '@/components/common/ModalPortal';

export default function PortalLoginModal({ 
    isOpen, 
    onClose, 
    defaultRole = 'chairman', 
    locationName = '' 
}) {
    const dispatch = useDispatch();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { user, profile } = await authService.loginWithEmail(email, password);
            
            if (!profile) {
                throw new Error('প্রোফাইল তথ্য পাওয়া যায়নি।');
            }

            dispatch(login({
                id: user.id,
                email: user.email,
                role: profile.role,
                access_scope_id: profile.access_scope_id,
                first_name: profile.first_name,
                last_name: profile.last_name,
                avatar_url: profile.avatar_url
            }));

            // Redirect based on role
            if (profile.role === 'chairman') router.push('/chairman/dashboard');
            else if (profile.role === 'ward_member') router.push('/ward-member/dashboard');
            else if (profile.role === 'super_admin') router.push('/admin');
            else router.push('/');

            onClose();
        } catch (err) {
            setError(err.message || 'লগইন করতে সমস্যা হয়েছে।');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white w-full max-w-[380px] rounded-3xl overflow-hidden shadow-2xl relative border border-slate-100"
            >
                {/* Simplified Header */}
                <div className="bg-slate-900 p-6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-teal-500 rounded-full blur-[40px] -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-3">
                        <ShieldCheck className="text-teal-400" size={24} />
                    </div>
                    <h2 className="text-lg font-black text-white tracking-tight">প্রতিনিধি লগইন</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-teal-400/80">{locationName || 'ডিজিগ্রাম পোর্টাল'}</p>
                    
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-[11px] font-bold">
                            <AlertCircle size={14} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">ইমেইল</label>
                            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 focus-within:border-teal-500 focus-within:bg-white transition-all">
                                <Mail size={16} className="text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="flex-1 bg-transparent border-none focus:outline-none text-xs font-bold text-slate-700 placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">পাসওয়ার্ড</label>
                            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 focus-within:border-teal-500 focus-within:bg-white transition-all">
                                <Lock size={16} className="text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="flex-1 bg-transparent border-none focus:outline-none text-xs font-bold text-slate-700 placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        {/* Remember Me Toggle */}
                        <div className="flex items-center justify-between px-1">
                            <button 
                                type="button"
                                onClick={() => setRememberMe(!rememberMe)}
                                className="flex items-center gap-2 group cursor-pointer"
                            >
                                <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${rememberMe ? 'bg-teal-500 border-teal-500' : 'bg-slate-50 border-slate-200 group-hover:border-teal-400'}`}>
                                    {rememberMe && <CheckCircle2 size={12} className="text-white" />}
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">তথ্য সেভ রাখুন</span>
                            </button>
                            
                            <button type="button" className="text-[10px] font-black text-teal-600 uppercase tracking-wider hover:underline">পাসওয়ার্ড ভুলে গেছেন?</button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-900 text-white font-black text-xs shadow-lg shadow-slate-200 hover:bg-teal-600 transition-all active:scale-95 disabled:opacity-70 group"
                        >
                            {loading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <>
                                    লগইন করুন
                                    <LucideArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-[9px] font-bold text-center text-slate-300 uppercase tracking-[0.2em]">
                        DIGIGRAM SECURITY PROTOCOL ENFORCED
                    </p>
                </div>
            </motion.div>
            </div>
        </ModalPortal>
    );
}

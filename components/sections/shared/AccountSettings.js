'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { 
    User, Phone, Mail, Camera, ShieldCheck, 
    Save, Loader2, AlertCircle, CheckCircle2,
    Lock, KeyRound, Eye, EyeOff, UserCircle, ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { adminService } from '@/lib/services/adminService';
import { authService } from '@/lib/services/authService';
import { updateUser } from '@/lib/store/features/authSlice';

export default function AccountSettings({ title = "অ্যাকাউন্ট সেটিংস", subtitle = "আপনার ব্যক্তিগত তথ্য এবং সিকিউরিটি ম্যানেজ করুন" }) {
    const dispatch = useDispatch();
    const router = useRouter();
    const { user } = useSelector((state) => state.auth);
    
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        avatar_url: ''
    });
    
    const [passwordData, setPasswordData] = useState({
        new_password: '',
        confirm_password: ''
    });
    
    const [submitting, setSubmitting] = useState(false);
    const [passSubmitting, setPassSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [passStatus, setPassStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                phone: user.phone || '',
                avatar_url: user.avatar_url || ''
            });
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus({ type: '', message: '' });
        
        try {
            await adminService.mutateUser(user.id, 'update_profile', {
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
                avatar_url: formData.avatar_url
            });
            
            // Update local Redux state
            dispatch(updateUser(formData));
            
            setStatus({ type: 'success', message: 'আপনার প্রোফাইল সফলভাবে আপডেট হয়েছে।' });
        } catch (err) {
            console.error("Update error:", err);
            setStatus({ type: 'error', message: 'আপডেট করতে সমস্যা হয়েছে: ' + err.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            setPassStatus({ type: 'error', message: 'পাসওয়ার্ড দুটি মিলছে না।' });
            return;
        }
        if (passwordData.new_password.length < 6) {
            setPassStatus({ type: 'error', message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' });
            return;
        }

        setPassSubmitting(true);
        setPassStatus({ type: '', message: '' });

        try {
            await authService.updatePassword(passwordData.new_password);
            setPassStatus({ type: 'success', message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।' });
            setPasswordData({ new_password: '', confirm_password: '' });
        } catch (err) {
            setPassStatus({ type: 'error', message: 'পাসওয়ার্ড পরিবর্তনে সমস্যা: ' + err.message });
        } finally {
            setPassSubmitting(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('দয়া করে একটি ইমেজ ফাইল সিলেক্ট করুন।');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('ইমেজ সাইজ ২ মেগাবাইটের কম হতে হবে।');
            return;
        }

        setUploading(true);
        try {
            const publicUrl = await authService.uploadAvatar(user.id, file);
            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
            
            // Auto save to profile
            await adminService.mutateUser(user.id, 'update_profile', {
                avatar_url: publicUrl
            });
            dispatch(updateUser({ avatar_url: publicUrl }));
            
            setStatus({ type: 'success', message: 'প্রোফাইল পিকচার সফলভাবে আপডেট হয়েছে।' });
        } catch (err) {
            alert('আপলোড করতে সমস্যা: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const getRoleLabel = (role) => {
        const labels = {
            'super_admin': 'সুপার অ্যাডমিন',
            'chairman': 'চেয়ারম্যান',
            'ward_member': 'ওয়ার্ড মেম্বার',
            'institution_admin': 'প্রতিষ্ঠান অ্যাডমিন'
        };
        return labels[role] || 'ইউজার';
    };

    const getBackPath = () => {
        if (user?.role === 'chairman') return '/chairman/dashboard';
        if (user?.role === 'ward_member') return '/ward-member/dashboard';
        if (user?.role === 'super_admin') return '/admin';
        return '/';
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => router.push(getBackPath())}
                    className="flex items-center gap-2 text-slate-500 font-bold hover:text-teal-600 transition-colors group"
                >
                    <div className="p-2 rounded-xl bg-white border border-slate-200 group-hover:border-teal-200 group-hover:bg-teal-50 transition-all">
                        <ArrowLeft size={20} />
                    </div>
                    ড্যাশবোর্ডে ফিরে যান
                </button>
            </div>
            {/* Header */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[28px] bg-teal-50 flex items-center justify-center border border-teal-100 text-teal-600 shadow-lg shadow-teal-500/10">
                        <UserCircle size={40} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 mb-1">{title}</h1>
                        <p className="text-slate-500 font-bold">{subtitle}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Avatar & Info */}
                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm text-center">
                        <div className="relative inline-block mb-6 group">
                            <div className="w-32 h-32 rounded-[40px] bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden relative">
                                {uploading ? (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                                        <Loader2 className="animate-spin text-teal-600" size={32} />
                                    </div>
                                ) : formData.avatar_url ? (
                                    <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={60} className="text-slate-300" />
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 p-3 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-teal-600 transition-all border-4 border-white cursor-pointer group-hover:scale-110 active:scale-95">
                                <Camera size={18} />
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        <h2 className="text-xl font-black text-slate-800">{user?.first_name} {user?.last_name}</h2>
                        <p className="text-xs font-black text-teal-600 uppercase tracking-widest mt-1">{getRoleLabel(user?.role)}</p>
                        
                        <div className="mt-8 pt-8 border-t border-slate-100 space-y-4 text-left">
                            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <Mail size={16} className="text-slate-400" />
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ইমেইল অ্যাড্রেস</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{user?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Password Change Card */}
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                                <KeyRound size={20} />
                            </div>
                            <h3 className="font-black text-slate-800">পাসওয়ার্ড পরিবর্তন</h3>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">নতুন পাসওয়ার্ড</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        required
                                        type={showPass ? "text" : "password"} 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-12 text-sm font-bold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 outline-none transition-all"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">পাসওয়ার্ড নিশ্চিত করুন</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        required
                                        type={showPass ? "text" : "password"} 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 outline-none transition-all"
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                                    />
                                </div>
                            </div>

                            {passStatus.message && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`p-3 rounded-xl flex items-center gap-2 text-[11px] font-black ${
                                        passStatus.type === 'success' ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'
                                    }`}
                                >
                                    {passStatus.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                    {passStatus.message}
                                </motion.div>
                            )}

                            <button 
                                disabled={passSubmitting}
                                type="submit" 
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-rose-600 transition-all shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50"
                            >
                                {passSubmitting ? 'প্রসেসিং...' : 'পাসওয়ার্ড সেট করুন'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right: Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">নামের প্রথম অংশ</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            required
                                            type="text" 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">নামের শেষ অংশ</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">ফোন নাম্বার</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="tel" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                            </div>

                            {status.message && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-2xl flex items-center gap-3 ${
                                        status.type === 'success' ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                    }`}
                                >
                                    {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    <p className="text-xs font-black">{status.message}</p>
                                </motion.div>
                            )}

                            <button 
                                disabled={submitting}
                                type="submit" 
                                className="w-full py-5 bg-slate-900 text-white rounded-[20px] font-black text-sm hover:bg-teal-600 transition-all shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        আপডেট হচ্ছে...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        পরিবর্তন সেভ করুন
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

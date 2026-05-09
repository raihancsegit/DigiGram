'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Home, Users, MapPin, Droplets, Zap, ShieldCheck, 
    ArrowLeft, FileText, Heart, AlertCircle, Loader2, QrCode
} from 'lucide-react';
import { householdService } from '@/lib/services/householdService';
import { toBnDigits } from '@/lib/utils/format';
import Link from 'next/link';
import ServiceRequestModal from '@/components/sections/service/ServiceRequestModal';

export default function HouseholdPublicProfile() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeService, setActiveService] = useState(null); // 'birth_registration', etc.

    useEffect(() => {
        async function loadProfile() {
            try {
                setLoading(true);
                const profile = await householdService.getPublicHouseholdProfile(id);
                setData(profile);
            } catch (err) {
                console.error(err);
                setError("বাড়ির তথ্য পাওয়া যায়নি। কিউআর কোডটি সঠিক কিনা যাচাই করুন।");
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
                <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
                <p className="text-slate-500 font-black">তথ্য লোড হচ্ছে...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle size={40} />
                </div>
                <h1 className="text-2xl font-black text-slate-800 mb-4">দুঃখিত!</h1>
                <p className="text-slate-500 font-bold mb-8">{error || "এই আইডির কোনো বাড়ি খুঁজে পাওয়া যায়নি।"}</p>
                <Link href="/" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest">হোমে ফিরে যান</Link>
            </div>
        );
    }

    const bloodGroups = [...new Set(data.residents_summary?.map(r => r.blood_group).filter(Boolean))];

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Top Bar */}
            <div className="bg-white px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 z-30">
                <button onClick={() => router.back()} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <QrCode size={20} className="text-teal-600" />
                    <span className="text-sm font-black text-slate-800 tracking-tight">ডিজিটাল প্রোফাইল</span>
                </div>
                <div className="w-10" />
            </div>

            <main className="max-w-md mx-auto px-6 py-8 space-y-6">
                {/* House Info Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Home size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
                            <ShieldCheck size={12} /> ভেরিফাইড হাউসহোল্ড
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 mb-2 leading-tight">
                            {data.owner_name} <br /> 
                            <span className="text-slate-400 text-lg">এর বাড়ি</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-400 flex items-center gap-2 mb-8">
                            <MapPin size={14} /> 
                            {data.village?.bn_name || data.village?.name}, {toBnDigits(data.house_no || '')}
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    <Users size={12} /> সদস্য
                                </div>
                                <p className="text-2xl font-black text-slate-800">{toBnDigits((data.stats?.total_members || 0).toString())}</p>
                            </div>
                            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    <ShieldCheck size={12} /> ভোটার
                                </div>
                                <p className="text-2xl font-black text-slate-800">{toBnDigits((data.stats?.voters || 0).toString())}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Blood Group Info */}
                {bloodGroups.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-rose-50 rounded-[32px] p-8 border border-rose-100"
                    >
                        <h3 className="text-sm font-black text-rose-600 uppercase tracking-widest flex items-center gap-2 mb-4">
                            <Heart size={16} fill="currentColor" /> ব্লাড গ্রুপ প্রাপ্যতা
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {bloodGroups.map(bg => (
                                <span key={bg} className="px-4 py-2 bg-white rounded-xl text-rose-600 font-black shadow-sm border border-rose-100">
                                    {bg}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Services Section */}
                <div className="space-y-4 pt-4">
                    <h3 className="px-4 text-xs font-black text-slate-400 uppercase tracking-widest">নাগরিক সেবা আবেদন</h3>
                    
                    <button 
                        onClick={() => setActiveService('birth_registration')}
                        className="w-full p-6 rounded-[32px] bg-white border border-slate-200 hover:border-teal-500 transition-all flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                <FileText size={24} />
                            </div>
                            <div className="text-left">
                                <p className="font-black text-slate-800">জন্ম নিবন্ধন আবেদন</p>
                                <p className="text-[10px] font-bold text-slate-400">নতুন সদস্যের জন্য আবেদন করুন</p>
                            </div>
                        </div>
                        <ArrowLeft className="rotate-180 text-slate-300" size={20} />
                    </button>

                    <button 
                        onClick={() => setActiveService('death_certificate')}
                        className="w-full p-6 rounded-[32px] bg-white border border-slate-200 hover:border-teal-500 transition-all flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                <AlertCircle size={24} />
                            </div>
                            <div className="text-left">
                                <p className="font-black text-slate-800">মৃত্যু সনদ আবেদন</p>
                                <p className="text-[10px] font-bold text-slate-400">মৃত্যু সংবাদ রিপোর্ট করুন</p>
                            </div>
                        </div>
                        <ArrowLeft className="rotate-180 text-slate-300" size={20} />
                    </button>

                    <button 
                        onClick={() => setActiveService('utility_request')}
                        className="w-full p-6 rounded-[32px] bg-white border border-slate-200 hover:border-teal-500 transition-all flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Zap size={24} />
                            </div>
                            <div className="text-left">
                                <p className="font-black text-slate-800">বিদ্যুৎ মিটার আবেদন</p>
                                <p className="text-[10px] font-bold text-slate-400">নতুন সংযোগের জন্য অনুরোধ</p>
                            </div>
                        </div>
                        <ArrowLeft className="rotate-180 text-slate-300" size={20} />
                    </button>
                </div>

                {/* Footer Info */}
                <div className="pt-10 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">DIGIGRAM SMART GOVERNANCE</p>
                </div>
            </main>

            {/* Application Modal */}
            <AnimatePresence>
                {activeService && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full flex justify-center"
                        >
                            <ServiceRequestModal 
                                householdId={id}
                                serviceType={activeService}
                                onClose={() => setActiveService(null)}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

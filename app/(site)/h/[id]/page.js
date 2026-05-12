'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Home, Users, MapPin, Droplets, Zap, ShieldCheck, 
    ArrowLeft, FileText, Heart, AlertCircle, Loader2, QrCode,
    Plus, Trash2, Download, File, Lock, Unlock, Eye
} from 'lucide-react';
import { householdService } from '@/lib/services/householdService';
import { toBnDigits } from '@/lib/utils/format';
import Link from 'next/link';
import ServiceRequestModal from '@/components/sections/service/ServiceRequestModal';
import HouseholdEntryForm from '@/components/sections/ward/HouseholdEntryForm';
import { notificationService } from '@/lib/services/notificationService';

export default function HouseholdPublicProfile() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeService, setActiveService] = useState(null); // 'birth_registration', etc.
    
    // Locker States
    const [showLockerModal, setShowLockerModal] = useState(false);
    const [lockerPin, setLockerPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [isLockerUnlocked, setIsLockerUnlocked] = useState(false);
    const [verifying, setVerifying] = useState(false);
    
    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [fullData, setFullData] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);

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

    const handleUnlockLocker = async (e) => {
        e.preventDefault();
        setVerifying(true);
        setPinError('');
        try {
            const fullProfile = await householdService.getFullHouseholdProfile(id, lockerPin);
            setFullData(fullProfile);
            
            // Load documents
            const docs = await householdService.getHouseholdDocuments(id);
            setDocuments(docs);
            
            setIsLockerUnlocked(true);
            setShowLockerModal(false);
            // setIsEditing(true); // Don't auto-edit, show storage first
        } catch (err) {
            setPinError('ভুল পিন নম্বর! আবার চেষ্টা করুন।');
        } finally {
            setVerifying(false);
        }
    };

    const handleEditSuccess = async () => {
        setIsEditing(false);
        setLoading(true);
        try {
            // Reload basic profile
            const profile = await householdService.getPublicHouseholdProfile(id);
            setData(profile);
            
            // Send notification
            await notificationService.createNotification({
                user_id: data.added_by_volunteer_id || null, // Will also need ward member, but volunteer is good for now
                type: 'household_update',
                title: 'বাড়ির তথ্য আপডেট করা হয়েছে',
                message: `${data.owner_name}-এর বাড়ির তথ্য ডিজিটাল লকার থেকে আপডেট করা হয়েছে।`,
                reference_id: id
            });
            alert('আপনার তথ্য সফলভাবে আপডেট করা হয়েছে!');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const title = prompt('ফাইলের নাম দিন (যেমন: এনআইডি, জন্ম সনদ):') || 'নথি';
            await householdService.uploadDocument(id, file, 'General', title);
            const docs = await householdService.getHouseholdDocuments(id);
            setDocuments(docs);
            alert('ফাইল সফলভাবে আপলোড হয়েছে!');
        } catch (err) {
            alert('আপলোড করতে সমস্যা হয়েছে: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDoc = async (docId) => {
        if (!confirm('আপনি কি এই ফাইলটি ডিলিট করতে চান?')) return;
        try {
            await householdService.deleteDocument(docId);
            setDocuments(documents.filter(d => d.id !== docId));
        } catch (err) {
            alert('ডিলিট করতে সমস্যা হয়েছে');
        }
    };

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
            <div className="bg-white px-4 md:px-6 py-4 md:py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 z-30">
                <button onClick={() => router.back()} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <QrCode size={20} className="text-teal-600" />
                    <span className="text-sm font-black text-slate-800 tracking-tight">ডিজিটাল প্রোফাইল</span>
                </div>
                <div className="w-10" />
            </div>

            <main className="max-w-md mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
                {/* House Info Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Home size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
                            <ShieldCheck size={12} /> ভেরিফাইড হাউসহোল্ড
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-2 leading-tight">
                            {data.owner_name} <br /> 
                            <span className="text-slate-400 text-base md:text-lg">এর বাড়ি</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-400 flex items-center gap-2 mb-8">
                            <MapPin size={14} /> 
                            {data.village?.bn_name || data.village?.name}, {toBnDigits(data.house_no || '')}
                        </p>

                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div className="p-4 md:p-5 rounded-2xl md:rounded-3xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">
                                    <Users size={12} /> সদস্য
                                </div>
                                <p className="text-xl md:text-2xl font-black text-slate-800">{toBnDigits((data.stats?.total_members || 0).toString())}</p>
                            </div>
                            <div className="p-4 md:p-5 rounded-2xl md:rounded-3xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">
                                    <ShieldCheck size={12} /> ভোটার
                                </div>
                                <p className="text-xl md:text-2xl font-black text-slate-800">{toBnDigits((data.stats?.voters || 0).toString())}</p>
                            </div>
                        </div>

                        {!isLockerUnlocked ? (
                            <button 
                                onClick={() => setShowLockerModal(true)}
                                className="mt-6 w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20"
                            >
                                <Lock size={18} /> লকার আনলক করুন
                            </button>
                        ) : (
                            <div className="mt-6 p-4 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center">
                                        <Unlock size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-teal-900">লকার আনলকড</p>
                                        <p className="text-[10px] font-bold text-teal-600">সব তথ্য দেখা যাচ্ছে</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 bg-white text-teal-600 rounded-xl font-black text-xs uppercase border border-teal-100 shadow-sm"
                                >
                                    তথ্য এডিট
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Locker Storage Section */}
                {isLockerUnlocked && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 border-2 border-teal-500/20 shadow-xl shadow-teal-900/5"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-800">ডিজিটাল লকার স্টোরেজ</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1">আপনার প্রয়োজনীয় নথিপত্র এখানে রাখুন</p>
                            </div>
                            <label className="cursor-pointer">
                                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-200 hover:scale-110 active:scale-95 transition-all">
                                    {uploading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={24} />}
                                </div>
                            </label>
                        </div>

                        <div className="space-y-3">
                            {documents.length === 0 ? (
                                <div className="py-10 text-center rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                                    <File size={32} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-xs font-bold text-slate-400">কোনো নথি আপলোড করা হয়নি</p>
                                </div>
                            ) : (
                                documents.map(doc => (
                                    <div key={doc.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-teal-600 shadow-sm">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs md:text-sm font-black text-slate-800 truncate max-w-[120px] sm:max-w-[150px]">{doc.title}</p>
                                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">{(doc.file_size / 1024).toFixed(1)} KB · {doc.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a 
                                                href={doc.file_url} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="p-2 text-slate-400 hover:text-teal-600 transition-colors"
                                            >
                                                <Eye size={18} />
                                            </a>
                                            <button 
                                                onClick={() => handleDeleteDoc(doc.id)}
                                                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

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
                
                {/* Locker PIN Modal */}
                {showLockerModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-sm bg-white rounded-[32px] p-8 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                <ShieldCheck size={100} />
                            </div>
                            <div className="relative z-10 text-center">
                                <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <ShieldCheck size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">ডিজিটাল লকার আনলক</h3>
                                <p className="text-xs font-bold text-slate-400 mb-6">নিরাপত্তার স্বার্থে আপনার লকার পিন দিন</p>
                                
                                <form onSubmit={handleUnlockLocker} className="space-y-4">
                                    <input 
                                        type="password" 
                                        maxLength="4"
                                        required
                                        value={lockerPin}
                                        onChange={(e) => setLockerPin(e.target.value)}
                                        placeholder="৪-ডিজিটের পিন" 
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none text-center font-black tracking-[0.5em] text-lg transition-all"
                                    />
                                    {pinError && <p className="text-xs text-rose-500 font-bold">{pinError}</p>}
                                    
                                    <div className="flex gap-3 pt-4">
                                        <button 
                                            type="button"
                                            onClick={() => setShowLockerModal(false)}
                                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-black text-sm hover:bg-slate-200 transition-colors"
                                        >
                                            বাতিল
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={verifying || lockerPin.length !== 4}
                                            className="flex-1 py-4 bg-teal-600 text-white rounded-xl font-black text-sm hover:bg-teal-700 disabled:opacity-50 transition-all flex justify-center items-center"
                                        >
                                            {verifying ? <Loader2 className="animate-spin" size={20} /> : 'আনলক করুন'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Edit Form Modal */}
                {isEditing && isLockerUnlocked && fullData && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full flex justify-center"
                        >
                            <HouseholdEntryForm 
                                wardId={data.ward_id}
                                villageId={data.village_id}
                                initialData={fullData}
                                onSuccess={handleEditSuccess}
                                onCancel={() => setIsEditing(false)}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

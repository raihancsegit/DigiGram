'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
    Lock, Shield, Eye, EyeOff, Upload, Trash2, FileText, 
    CheckCircle, Loader2, X, Plus, Info, Home, User, Phone, Zap, Droplets, Unlock, Users, MapPin, Maximize2, Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { householdService } from '@/lib/services/householdService';
import { supabase } from '@/lib/utils/supabase';
import { toBnDigits } from '@/lib/utils/format';

const inputStyles = "w-full px-5 py-4 rounded-[20px] bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-700 text-sm";
const labelStyles = "text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1.5 block";

export default function HouseholdLockerManager({ household, onUpdate, onClose }) {
    // Locker State
    const { user } = useSelector((state) => state.auth);
    const isSuperAdmin = user?.role === 'super_admin';

    const [pin, setPin] = useState(household?.locker_pin || '');
    const [enteredPin, setEnteredPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [isLockerUnlocked, setIsLockerUnlocked] = useState(false);
    
    // Auto-unlock for Super Admin if no PIN is set, or if PIN is already verified
    useEffect(() => {
        if (!household?.locker_pin && isSuperAdmin) {
            setIsLockerUnlocked(true);
        }
    }, [household?.locker_pin, isSuperAdmin]);

    const [pinError, setPinError] = useState(false);
    const [showVisualTree, setShowVisualTree] = useState(false);
    const [isLockerExpanded, setIsLockerExpanded] = useState(false);
    
    // Data State
    const [documents, setDocuments] = useState([]);
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [savingPin, setSavingPin] = useState(false);
    
    // Upload form
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [uploadForm, setUploadForm] = useState({ title: '', type: 'nid', file: null });

    useEffect(() => {
        loadData();
    }, [household.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const docs = await householdService.getHouseholdDocuments(household.id);
            setDocuments(docs || []);

            const { data: resData } = await supabase
                .from('residents')
                .select('*')
                .eq('household_id', household.id)
                .order('created_at', { ascending: true });
            
            setResidents(resData || []);
        } catch (err) {
            console.error("Error loading data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlock = (e) => {
        e.preventDefault();
        if (enteredPin === household.locker_pin) {
            setIsLockerUnlocked(true);
            setPinError(false);
            setEnteredPin('');
        } else {
            setPinError(true);
            setEnteredPin('');
        }
    };

    const handleUpdatePin = async () => {
        if (!pin || pin.length !== 4) {
            alert("অনুগ্রহ করে ৪ ডিজিটের পিন দিন");
            return;
        }
        setSavingPin(true);
        try {
            await householdService.updateHousehold(household.id, { locker_pin: pin });
            alert("পিন সফলভাবে আপডেট হয়েছে");
            onUpdate();
        } catch (err) {
            alert("পিন আপডেট করতে সমস্যা হয়েছে");
        } finally {
            setSavingPin(false);
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!uploadForm.file) return;
        
        setUploading(true);
        try {
            await householdService.uploadDocument(
                household.id, 
                uploadForm.file, 
                uploadForm.type, 
                uploadForm.title || uploadForm.type.toUpperCase()
            );
            setUploadForm({ title: '', type: 'nid', file: null });
            setShowUploadForm(false);
            await loadData();
            alert("ডকুমেন্ট আপলোড সফল হয়েছে");
        } catch (err) {
            alert("আপলোড করতে সমস্যা হয়েছে: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDoc = async (docId) => {
        if (!confirm("আপনি কি নিশ্চিতভাবে এই ডকুমেন্টটি ডিলিট করতে চান?")) return;
        try {
            await householdService.deleteDocument(docId);
            await loadData();
        } catch (err) {
            alert("ডিলিট করতে সমস্যা হয়েছে");
        }
    };

    // Family Tree Logic
    const head = residents.find(r => r.relation_with_head === 'Head') || residents[0];
    const spouse = residents.filter(r => r.relation_with_head === 'Wife' || r.relation_with_head === 'Husband');
    const children = residents.filter(r => r.relation_with_head === 'Son' || r.relation_with_head === 'Daughter');
    const parents = residents.filter(r => r.relation_with_head === 'Father' || r.relation_with_head === 'Mother');
    const others = residents.filter(r => !['Head', 'Wife', 'Husband', 'Son', 'Daughter', 'Father', 'Mother'].includes(r.relation_with_head) && r.id !== head?.id);

    const ResidentCard = ({ resident, title, icon: Icon, colorClass }) => {
        if (!resident) return null;
        return (
            <div className={`p-4 rounded-[20px] border ${colorClass} bg-white shadow-sm flex items-center gap-4 relative overflow-hidden group`}>
                <div className="absolute right-0 top-0 opacity-5">
                    <Icon size={64} />
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${colorClass.replace('border-', 'bg-').replace('200', '50').replace('500', '100')} ${colorClass.replace('border-', 'text-').replace('200', '600').replace('500', '700')}`}>
                    <Icon size={24} />
                </div>
                <div className="relative z-10">
                    <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-0.5">{title}</p>
                    <h4 className="text-sm font-black text-slate-800">{resident.name}</h4>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-2">
                        <span>{resident.gender === 'Male' ? 'পুরুষ' : resident.gender === 'Female' ? 'নারী' : 'অন্যান্য'}</span>
                        {resident.is_voter && <span className="bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded text-[8px] uppercase">ভোটার</span>}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4 sm:gap-8 flex-1 overflow-y-auto custom-scrollbar p-1">
                
                {/* Left Column: Family Tree & Info */}
                <div className={`lg:col-span-1 xl:col-span-3 space-y-6 flex-col ${isLockerExpanded ? 'hidden' : 'flex'}`}>
                    <div className="p-4 sm:p-8 rounded-[24px] md:rounded-[32px] bg-slate-50 border border-slate-100 shadow-sm flex flex-col flex-1 h-full">
                        
                        {/* Header & Toggle */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 pb-8 border-b border-slate-200">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-200 shrink-0">
                                    <Home size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">{household.owner_name} এর পরিবার</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">প্রোফাইল আইডি: {household.qr_code_id}</p>
                                </div>
                            </div>

                            <div className="flex p-1.5 bg-slate-200/50 rounded-[16px] shrink-0">
                                <button 
                                    onClick={() => setShowVisualTree(false)}
                                    className={`px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest font-black transition-all ${!showVisualTree ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                >সম্পূর্ণ তথ্য</button>
                                <button 
                                    onClick={() => setShowVisualTree(true)}
                                    className={`px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest font-black transition-all ${showVisualTree ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                >ফ্যামিলি ট্রি</button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-x-auto overflow-y-visible pb-4 custom-scrollbar relative min-h-[300px]">
                            
                            <AnimatePresence mode="wait">
                                {!showVisualTree ? (
                                    <motion.div 
                                        key="info"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-8"
                                    >
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <div>
                                                <label className={labelStyles}>হোল্ডিং নম্বর</label>
                                                <p className="text-sm font-black text-slate-700">{household.house_no || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className={labelStyles}>মোবাইল নম্বর</label>
                                                <p className="text-sm font-black text-slate-700">{toBnDigits(household.phone || 'মোবাইল নেই')}</p>
                                            </div>
                                            <div>
                                                <label className={labelStyles}>ধর্ম</label>
                                                <p className="text-sm font-black text-slate-700">{household.religion === 'Islam' ? 'ইসলাম' : household.religion === 'Hindu' ? 'হিন্দু' : household.religion === 'Buddhist' ? 'বৌদ্ধ' : household.religion === 'Christian' ? 'খ্রিস্টান' : 'অন্যান্য'}</p>
                                            </div>
                                            <div>
                                                <label className={labelStyles}>অর্থনৈতিক অবস্থা</label>
                                                <p className="text-sm font-black text-slate-700">{household.economic_status === 'Poor' ? 'দরিদ্র' : household.economic_status === 'Middle Class' ? 'মধ্যবিত্ত' : 'উচ্চবিত্ত'}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
                                            <div>
                                                <label className={labelStyles}>ঘরের ধরণ</label>
                                                <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                                                    <Home size={14} className="text-teal-500" />
                                                    {household.housing_type === 'Paka' ? 'পাকা' : household.housing_type === 'Semi-Paka' ? 'আধা-পাকা' : 'কাঁচা'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className={labelStyles}>বিদ্যুৎ</label>
                                                <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                                                    <Zap size={14} className={household.electricity_meter ? 'text-amber-500' : 'text-slate-300'} />
                                                    {household.electricity_meter ? 'আছে' : 'নেই'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className={labelStyles}>পানির উৎস</label>
                                                <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                                                    <Droplets size={14} className="text-blue-500" />
                                                    {household.water_source === 'Tubewell' ? 'টিউবওয়েল' : household.water_source === 'Supply' ? 'সাপ্লাই পানি' : 'পুকুর/নদী'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className={labelStyles}>স্যানিটেশন</label>
                                                <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                                                    <Shield size={14} className={household.sanitation_type === 'Paka' ? 'text-emerald-500' : 'text-slate-400'} />
                                                    {household.sanitation_type === 'Paka' ? 'পাকা' : household.sanitation_type === 'Kacha' ? 'কাঁচা' : 'উন্মুক্ত'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-8 mt-8 border-t border-slate-200">
                                            <div className="flex items-center justify-between mb-6">
                                                <h4 className="font-black text-slate-800 flex items-center gap-2">
                                                    <Users size={20} className="text-teal-600" /> 
                                                    পরিবারের সদস্যবৃন্দ ({toBnDigits((residents.length).toString())} জন)
                                                </h4>
                                                <div className="flex gap-4">
                                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">মোট পুরুষ: {toBnDigits((household.stats?.males || 0).toString())}</span>
                                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">মোট নারী: {toBnDigits((household.stats?.females || 0).toString())}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {residents.map((r, idx) => (
                                                    <ResidentCard key={idx} resident={r} title={
                                                        r.relation_with_head === 'Head' ? 'খানা প্রধান' : 
                                                        r.relation_with_head === 'Wife' ? 'স্ত্রী' : 
                                                        r.relation_with_head === 'Husband' ? 'স্বামী' : 
                                                        r.relation_with_head === 'Son' ? 'ছেলে' : 
                                                        r.relation_with_head === 'Daughter' ? 'মেয়ে' : 
                                                        r.relation_with_head === 'Father' ? 'পিতা' : 
                                                        r.relation_with_head === 'Mother' ? 'মাতা' : 'অন্যান্য'
                                                    } icon={r.relation_with_head === 'Head' ? Home : User} colorClass={r.relation_with_head === 'Head' ? 'border-teal-200' : 'border-slate-200'} />
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="tree"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="flex justify-center min-w-[600px] py-10"
                                    >
                                        <div className="flex flex-col items-center">
                                            
                                            {/* Level 1: Parents */}
                                            {parents.length > 0 && (
                                                <div className="flex flex-col items-center">
                                                    <div className="flex justify-center gap-8 relative z-10">
                                                        {parents.map((p, i) => (
                                                            <ResidentCard key={i} resident={p} title={p.relation_with_head === 'Father' ? 'পিতা' : 'মাতা'} icon={User} colorClass="border-amber-200" />
                                                        ))}
                                                    </div>
                                                    {/* Vertical connection to Level 2 */}
                                                    <div className="w-0.5 h-8 bg-slate-300" />
                                                </div>
                                            )}

                                            {/* Level 2: Core (Head & Spouse) */}
                                            <div className="flex flex-col items-center">
                                                <div className="flex justify-center items-center gap-4 relative z-10">
                                                    <ResidentCard resident={head} title="খানা প্রধান" icon={Home} colorClass="border-teal-200" />
                                                    {spouse.map((s, i) => (
                                                        <div key={i} className="flex items-center gap-4">
                                                            {/* Horizontal connection between Head and Spouse */}
                                                            <div className="w-4 h-0.5 bg-pink-300" />
                                                            <ResidentCard resident={s} title={s.relation_with_head === 'Wife' ? 'স্ত্রী' : 'স্বামী'} icon={Users} colorClass="border-pink-200" />
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Vertical connection to Level 3 */}
                                                {(children.length > 0 || others.length > 0) && (
                                                    <div className="w-0.5 h-8 bg-slate-300" />
                                                )}
                                            </div>

                                            {/* Level 3: Children */}
                                            {children.length > 0 && (
                                                <div className="flex flex-col items-center w-full">
                                                    <div className="flex justify-center relative pt-4 w-full">
                                                        {/* Horizontal Branching Line */}
                                                        {children.length > 1 && (
                                                            <div className="absolute top-0 h-0.5 bg-slate-300" 
                                                                style={{ 
                                                                    left: `${100 / (children.length * 2)}%`, 
                                                                    right: `${100 / (children.length * 2)}%` 
                                                                }} 
                                                            />
                                                        )}
                                                        
                                                        {children.map((c, i) => (
                                                            <div key={i} className="flex flex-col items-center px-4 w-full relative">
                                                                {/* Vertical line down to child */}
                                                                <div className={`w-0.5 h-4 bg-slate-300 ${children.length === 1 ? 'absolute top-0 -mt-8 h-12' : ''}`} />
                                                                <div className="w-full max-w-[200px]">
                                                                    <ResidentCard resident={c} title={c.relation_with_head === 'Son' ? 'ছেলে' : 'মেয়ে'} icon={User} colorClass="border-blue-200" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Level 4: Others (Relatives) */}
                                            {others.length > 0 && (
                                                <div className="flex flex-col items-center mt-8 pt-8 border-t-2 border-dashed border-slate-200 w-full relative">
                                                    <div className="absolute -top-3 px-4 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">অন্যান্য আত্মীয়</div>
                                                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                                                        {others.map((o, i) => (
                                                            <ResidentCard key={i} resident={o} title="অন্যান্য" icon={User} colorClass="border-slate-200" />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>
                    </div>
                </div>

                {/* Right Column: Digital Locker */}
                <div className={`space-y-6 flex flex-col h-full ${isLockerExpanded ? 'lg:col-span-2 xl:col-span-5' : 'lg:col-span-1 xl:col-span-2'}`}>
                    
                    {/* PIN Management (Restricted to Super Admin) */}
                    {isSuperAdmin && (
                        <>
                            {household.locker_pin && isLockerUnlocked && (
                                <div className="p-6 rounded-[24px] bg-slate-900 text-white shadow-xl shrink-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                                                <Lock size={16} />
                                            </div>
                                            <h4 className="font-black text-sm">লকার পিন (PIN) আপডেট</h4>
                                        </div>
                                        <button onClick={() => setShowPin(!showPin)} className="text-slate-400 hover:text-white transition-colors">
                                            {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <input 
                                            type={showPin ? "text" : "password"}
                                            maxLength={4}
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                                            className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-xl font-black text-center tracking-[0.5em] focus:bg-white/20 outline-none transition-all"
                                            placeholder="****"
                                        />
                                        <button 
                                            onClick={handleUpdatePin}
                                            disabled={savingPin || pin === household.locker_pin}
                                            className="px-6 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap"
                                        >
                                            {savingPin ? 'আপডেট হচ্ছে...' : 'সেভ করুন'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!household.locker_pin && (
                                <div className="p-6 rounded-[24px] bg-amber-50 border border-amber-200 text-amber-800 shadow-sm shrink-0">
                                    <div className="flex items-start gap-3">
                                        <Info size={20} className="text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-black text-sm mb-1">লকার পিন সেট করা নেই</h4>
                                            <p className="text-xs font-bold opacity-80 mb-4">ডিজিটাল লকারটি সুরক্ষিত রাখতে একটি পিন সেট করুন।</p>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="password"
                                                    maxLength={4}
                                                    value={pin}
                                                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                                                    className="w-full bg-white border border-amber-200 rounded-xl py-2 px-4 text-center tracking-[0.5em] font-black outline-none focus:border-amber-500"
                                                    placeholder="****"
                                                />
                                                <button 
                                                    onClick={handleUpdatePin}
                                                    disabled={savingPin || pin.length !== 4}
                                                    className="px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap"
                                                >
                                                    পিন সেট করুন
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Non-Admin View for Missing PIN */}
                    {!isSuperAdmin && !household.locker_pin && (
                        <div className="p-6 rounded-[24px] bg-slate-100 border border-slate-200 text-slate-500 shadow-sm shrink-0 flex items-center gap-3">
                            <Shield size={20} className="text-slate-400" />
                            <p className="text-xs font-black uppercase tracking-widest">Locker Not Configured</p>
                        </div>
                    )}

                    {/* Digital Locker Content Area */}
                    <div className="p-5 md:p-8 rounded-[24px] md:rounded-[32px] bg-white border border-slate-100 shadow-sm flex-1 flex flex-col relative overflow-hidden">
                        
                        {/* Lock Screen */}
                        {!isLockerUnlocked && (
                            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center">
                                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-teal-400 mb-6 shadow-xl shadow-teal-500/10">
                                    <Lock size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                                    {!household.locker_pin ? 'লকার সেটআপ করা নেই' : 'লকার সুরক্ষিত আছে'}
                                </h3>
                                <p className="text-sm font-bold text-slate-400 mb-8 max-w-[250px]">
                                    {!household.locker_pin 
                                        ? 'এই বাড়ির ডিজিটাল লকারটি এখনো কনফিগার করা হয়নি। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।' 
                                        : 'ডকুমেন্টস দেখতে বা আপলোড করতে এই বাড়ির সঠিক পিন প্রদান করুন।'}
                                </p>
                                
                                {household.locker_pin ? (
                                    <form onSubmit={handleUnlock} className="w-full max-w-[240px] space-y-4">
                                        <input 
                                            type="password"
                                            maxLength={4}
                                            value={enteredPin}
                                            onChange={(e) => {
                                                setEnteredPin(e.target.value.replace(/[^0-9]/g, ''));
                                                setPinError(false);
                                            }}
                                            className={`w-full bg-white/10 border ${pinError ? 'border-rose-500' : 'border-white/10'} rounded-2xl py-4 px-6 text-2xl font-black text-center tracking-[0.5em] text-white focus:bg-white/20 outline-none transition-all placeholder:text-slate-600`}
                                            placeholder="****"
                                        />
                                        {pinError && <p className="text-xs font-bold text-rose-400">পিন ভুল হয়েছে, আবার চেষ্টা করুন</p>}
                                        <button 
                                            type="submit"
                                            disabled={enteredPin.length !== 4}
                                            className="w-full py-4 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-teal-500/20"
                                        >
                                            আনলক করুন
                                        </button>
                                    </form>
                                ) : (
                                    <div className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                        ACCESS RESTRICTED
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Unlocked Content */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <Unlock size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-black text-slate-800">ডিজিটাল লকার</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">গৃহীত সকল ডকুমেন্টস</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setShowUploadForm(true)}
                                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center gap-2 shadow-lg"
                                >
                                    <Plus size={14} /> <span className="hidden sm:inline">নতুন আপলোড</span>
                                </button>
                                <button 
                                    onClick={() => setIsLockerExpanded(!isLockerExpanded)}
                                    className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all shadow-sm hidden lg:block"
                                    title={isLockerExpanded ? "ছোট করুন" : "বড় করুন"}
                                >
                                    {isLockerExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                </button>
                            </div>
                        </div>

                        {showUploadForm && (
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8 p-6 rounded-[24px] bg-slate-50 border border-slate-100 relative shrink-0"
                            >
                                <button onClick={() => setShowUploadForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500">
                                    <X size={20} />
                                </button>
                                <h5 className="font-black text-slate-800 mb-6">নতুন ডকুমেন্ট আপলোড</h5>
                                <form onSubmit={handleFileUpload} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelStyles}>ডকুমেন্ট ধরণ</label>
                                            <select 
                                                value={uploadForm.type}
                                                onChange={(e) => setUploadForm({...uploadForm, type: e.target.value})}
                                                className={inputStyles}
                                            >
                                                <option value="nid">এনআইডি (NID)</option>
                                                <option value="birth_cert">জন্ম সনদ</option>
                                                <option value="tax">ট্যাক্স রশিদ</option>
                                                <option value="other">অন্যান্য</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelStyles}>টাইটেল (ঐচ্ছিক)</label>
                                            <input 
                                                value={uploadForm.title}
                                                onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                                                className={inputStyles}
                                                placeholder="উদা: এনআইডি ফ্রন্ট"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelStyles}>ফাইল নির্বাচন করুন</label>
                                        <input 
                                            required
                                            type="file"
                                            onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})}
                                            className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                                        />
                                    </div>
                                    <button 
                                        disabled={uploading}
                                        className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 transition-all shadow-lg shadow-teal-500/20"
                                    >
                                        {uploading ? 'আপলোড হচ্ছে...' : 'আপলোড নিশ্চিত করুন'}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="animate-spin text-teal-600" size={32} />
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-100 rounded-[24px]">
                                    <FileText className="text-slate-200 mb-4" size={40} />
                                    <p className="text-slate-400 font-black">কোনো ডকুমেন্ট পাওয়া যায়নি</p>
                                </div>
                            ) : documents.map((doc) => (
                                <div key={doc.id} className="p-4 rounded-[20px] bg-slate-50 border border-slate-100 flex items-center justify-between group hover:border-teal-200 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-teal-600 shadow-sm shrink-0">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 line-clamp-1">{doc.title}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{doc.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a 
                                            href={doc.file_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-white text-slate-400 hover:text-teal-600 shadow-sm transition-all"
                                        >
                                            <Eye size={16} />
                                        </a>
                                        <button 
                                            onClick={() => handleDeleteDoc(doc.id)}
                                            className="p-2 rounded-lg bg-white text-slate-400 hover:text-rose-500 shadow-sm transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

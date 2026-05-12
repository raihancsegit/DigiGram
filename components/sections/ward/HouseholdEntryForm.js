'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Home, User, Phone, MapPin, Zap, Droplets, 
    Plus, Trash2, Save, Loader2, CheckCircle, Navigation,
    ChevronDown, ChevronUp, Lock, Shield, ArrowRight, ArrowLeft, X
} from 'lucide-react';
import { householdService } from '@/lib/services/householdService';
import { getVillageFullContext } from '@/lib/services/hierarchyService';
import { toBnDigits } from '@/lib/utils/format';

const inputStyles = "w-full px-5 py-4 rounded-[20px] bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-700 text-sm";
const labelStyles = "text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1.5 block";

export default function HouseholdEntryForm({ wardId, villageId, initialData, onSuccess, onCancel }) {
    const { user } = useSelector((state) => state.auth);
    const isEditMode = !!initialData;
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1); // 1: House, 2: Residents, 3: Locker
    const [householdId, setHouseholdId] = useState(initialData?.id || null);

    const [houseForm, setHouseForm] = useState(() => {
        if (!initialData) return {
            house_no: '', owner_name: '', phone: '',
            electricity_meter: false, water_source: 'tube-well',
            housing_type: 'Semi-Paka', economic_status: 'Middle', religion: 'Islam',
            locker_pin: '', lat: '', lng: '', qr_code_id: ''
        };
        
        return {
            ...initialData,
            house_no: initialData.house_no || '',
            owner_name: initialData.owner_name || '',
            phone: initialData.phone || '',
            electricity_meter: !!initialData.electricity_meter,
            water_source: initialData.water_source || 'tube-well',
            housing_type: initialData.housing_type || 'Semi-Paka',
            economic_status: initialData.economic_status || 'Middle',
            religion: initialData.religion || 'Islam',
            locker_pin: initialData.locker_pin || '',
            lat: initialData.lat || '',
            lng: initialData.lng || ''
        };
    });

    const defaultResident = { 
        name: '', gender: 'Male', is_voter: false, 
        relation_with_head: 'Head', dob: '', nid: '', birth_reg_no: '',
        education_level: '', occupation: '', marital_status: 'Married', disability_status: 'None',
        expanded: false 
    };

    const [residents, setResidents] = useState(() => {
        if (!initialData?.residents || initialData.residents.length === 0) {
            return [{ ...defaultResident }];
        }
        return initialData.residents.map(r => ({
            ...defaultResident,
            ...r,
            dob: r.dob ? new Date(r.dob).toISOString().split('T')[0] : '',
            expanded: false
        }));
    });
    const [deletedResidentIds, setDeletedResidentIds] = useState([]);
    const [hierarchy, setHierarchy] = useState(null);

    useEffect(() => {
        async function fetchHierarchy() {
            try {
                const full = await getVillageFullContext(villageId);
                setHierarchy(full);

                if (!isEditMode && full && !houseForm.qr_code_id) {
                    const union = full.ctx?.union;
                    const ward = full.ward;
                    const village = full.village;

                    const uName = union?.name_en || 'UNK';
                    const uPrefix = uName.substring(0, 3).toUpperCase();
                    const uNo = (union?.name_bn?.match(/\d+/) || ['01'])[0].padStart(2, '0');
                    
                    const wNo = (ward?.name_bn?.match(/\d+/) || ['01'])[0].padStart(2, '0');
                    
                    const vName = village?.name || village?.name_en || 'VIL';
                    const vPrefix = vName.substring(0, 3).toUpperCase();

                    const existing = await householdService.getHouseholdsByVillage(villageId);
                    const serial = (existing.length + 1).toString().padStart(2, '0');

                    const generatedId = `${uPrefix}${uNo}Ward${wNo}${vPrefix}${serial}`;
                    setHouseForm(prev => ({ ...prev, qr_code_id: generatedId }));
                }
            } catch (err) {
                console.error("Error fetching hierarchy for ID generation:", err);
            }
        }
        fetchHierarchy();
    }, [villageId, isEditMode]);

    async function handleGetLocation() {
        if (!navigator.geolocation) {
            alert("আপনার ব্রাউজার জিপিএস সাপোর্ট করে না");
            return;
        }
        navigator.geolocation.getCurrentPosition((position) => {
            setHouseForm({
                ...houseForm,
                lat: position.coords.latitude,
                lng: position.coords.longitude
            });
            alert("লোকেশন সেট করা হয়েছে!");
        }, (err) => {
            alert("লোকেশন পাওয়া যায়নি। অনুগ্রহ করে পারমিশন চেক করুন।");
        });
    }

    async function handleSaveHouse() {
        setSaving(true);
        try {
            const submitData = {
                ...houseForm,
                ward_id: wardId,
                village_id: villageId
            };
            delete submitData.residents; // cleanup if from initialData
            delete submitData.id;
            delete submitData.village;
            delete submitData.stats;
            delete submitData.created_at;
            delete submitData.updated_at;

            if (submitData.lat === '') submitData.lat = null;
            if (submitData.lng === '') submitData.lng = null;

            if (isEditMode) {
                await householdService.updateHousehold(householdId, submitData);
            } else {
                const data = await householdService.createHousehold(submitData);
                setHouseholdId(data.id);
            }
            setStep(2);
        } catch (err) {
            console.error("Supabase Error (House):", err?.message || JSON.stringify(err, null, 2), err);
            alert("বাড়ি সেভ করতে সমস্যা হয়েছে: " + (err?.message || "Unknown error"));
        } finally {
            setSaving(false);
        }
    }

    async function handleSaveResidents() {
        if (user?.role === 'super_admin') {
            setStep(3); // Move to locker pin step
        } else {
            handleFinalize();
        }
    }

    async function handleFinalize() {
        setSaving(true);
        try {
            if (houseForm.locker_pin) {
                const { supabase } = await import('@/lib/utils/supabase');
                await supabase.from('households').update({ locker_pin: houseForm.locker_pin }).eq('id', householdId);
            }

            for (const r of residents) {
                if (r.name) {
                    const { expanded, ...residentData } = r; 
                    if (residentData.dob === '') residentData.dob = null;
                    if (residentData.nid === '') residentData.nid = null;
                    if (residentData.birth_reg_no === '') residentData.birth_reg_no = null;
                    
                    if (residentData.id) {
                        await householdService.updateResident(residentData.id, residentData);
                    } else {
                        await householdService.createResident({
                            ...residentData,
                            household_id: householdId
                        });
                    }
                }
            }

            for (const delId of deletedResidentIds) {
                await householdService.deleteResident(delId, householdId);
            }

            // Sync one final time to be safe
            await householdService.syncHouseholdStats(householdId);
            onSuccess();
        } catch (err) {
            console.error("Supabase Error (Residents/Locker):", err?.message || JSON.stringify(err, null, 2), err);
            alert("ডাটা সেভ করতে সমস্যা হয়েছে: " + (err?.message || "Unknown error"));
        } finally {
            setSaving(false);
        }
    }

    function updateResident(idx, field, value) {
        const newR = [...residents];
        newR[idx][field] = value;
        setResidents(newR);
    }

    function removeResident(idx) {
        const resToRemove = residents[idx];
        if (resToRemove.id) {
            setDeletedResidentIds([...deletedResidentIds, resToRemove.id]);
        }
        setResidents(residents.filter((_, i) => i !== idx));
    }

    return (
        <div className="bg-white rounded-[24px] md:rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col relative overflow-hidden">
            <button 
                onClick={onCancel}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors z-20"
            >
                <X size={20} />
            </button>

            {/* HEADER - Fixed at top */}
            <div className="p-5 md:p-8 pb-3 md:pb-4 shrink-0 bg-white z-10 border-b border-slate-50 relative">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-200">
                            {step === 1 && <Home size={20} className="md:w-6 md:h-6" />}
                            {step === 2 && <User size={20} className="md:w-6 md:h-6" />}
                            {step === 3 && <Shield size={20} className="md:w-6 md:h-6" />}
                        </div>
                        <div>
                            <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">
                                {step === 1 ? 'বাড়ির তথ্য' : step === 2 ? 'সদস্যদের তথ্য' : 'নিরাপত্তা সেটআপ'}
                            </h3>
                            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                ধাপ {toBnDigits(step.toString())} / ৩
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map((s) => (
                            <div 
                                key={s}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                                    step === s ? 'bg-teal-600 w-8' : step > s ? 'bg-teal-200' : 'bg-slate-100'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {step > 1 && (
                    <button 
                        onClick={() => setStep(step - 1)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-teal-600 transition-colors"
                    >
                        <ArrowLeft size={14} /> আগের ধাপে ফিরে যান
                    </button>
                )}
            </div>

            {/* BODY - Scrollable */}
            <div className="p-5 md:p-8 py-4 overflow-y-auto custom-scrollbar flex-1 relative z-0">
                {step === 1 && (
                    <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="space-y-6">
                        <div>
                            <label className={labelStyles}>ডিজিটাল প্রোফাইল আইডি (QR CODE ID)</label>
                            <div className="relative">
                                <input 
                                    readOnly={isEditMode}
                                    value={houseForm.qr_code_id} 
                                    onChange={(e) => setHouseForm({...houseForm, qr_code_id: e.target.value.toUpperCase()})}
                                    className={inputStyles + " bg-slate-100 border-slate-200 text-teal-700 tracking-widest uppercase font-black pr-12"} 
                                    placeholder="ID জেনারেট হচ্ছে..." 
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Shield size={20} />
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 mt-2 ml-1">
                                * এটি এই বাড়ির ইউনিক আইডি, যা দিয়ে সব জায়গায় সার্চ করা যাবে।
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className={labelStyles}>বাড়ির হোল্ডিং নম্বর</label>
                                <input value={houseForm.house_no} onChange={(e) => setHouseForm({...houseForm, house_no: e.target.value})} className={inputStyles} placeholder="উদা: ৪২/ক" />
                            </div>
                            <div>
                                <label className={labelStyles}>মালিকের মোবাইল</label>
                                <input value={houseForm.phone} onChange={(e) => setHouseForm({...houseForm, phone: e.target.value})} className={inputStyles} placeholder="017XXXXXXXX" />
                            </div>
                        </div>
                        <div>
                            <label className={labelStyles}>খানা প্রধানের নাম <span className="text-rose-500">*</span></label>
                            <input required value={houseForm.owner_name} onChange={(e) => setHouseForm({...houseForm, owner_name: e.target.value})} className={inputStyles} placeholder="উদা: মোঃ আবুল হোসেন" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className={labelStyles}>বাড়ির ধরণ</label>
                                <select value={houseForm.housing_type} onChange={(e) => setHouseForm({...houseForm, housing_type: e.target.value})} className={inputStyles + " appearance-none cursor-pointer"}>
                                    <option value="Kacha">কাঁচা (মাটির)</option>
                                    <option value="Semi-Paka">আধা-পাকা</option>
                                    <option value="Paka">পাকা (দালান)</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelStyles}>অর্থনৈতিক অবস্থা</label>
                                <select value={houseForm.economic_status} onChange={(e) => setHouseForm({...houseForm, economic_status: e.target.value})} className={inputStyles + " appearance-none cursor-pointer"}>
                                    <option value="Lower">নিম্নবিত্ত</option>
                                    <option value="Middle">মধ্যবিত্ত</option>
                                    <option value="Upper">উচ্চবিত্ত</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelStyles}>ধর্ম</label>
                                <select value={houseForm.religion} onChange={(e) => setHouseForm({...houseForm, religion: e.target.value})} className={inputStyles + " appearance-none cursor-pointer"}>
                                    <option value="Islam">ইসলাম</option>
                                    <option value="Hindu">হিন্দু</option>
                                    <option value="Christian">খ্রিস্টান</option>
                                    <option value="Buddhist">বৌদ্ধ</option>
                                    <option value="Other">অন্যান্য</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-6 rounded-[24px] bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 flex items-center justify-between group hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-teal-600 shadow-sm">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-800">ম্যাপ লোকেশন সেট করুন</p>
                                    <p className="text-xs text-slate-500 font-bold mt-0.5">
                                        {houseForm.lat ? `সেট করা হয়েছে: ${houseForm.lat.toFixed(4)}, ${houseForm.lng.toFixed(4)}` : 'লোকেশন সেট করা হয়নি'}
                                    </p>
                                </div>
                            </div>
                            <button type="button" onClick={handleGetLocation} className="p-3.5 rounded-xl bg-white border border-teal-200 text-teal-600 shadow-sm hover:bg-teal-600 hover:text-white transition-all hover:scale-105 active:scale-95">
                                <Navigation size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="flex items-center gap-3 p-5 rounded-[20px] bg-slate-50 border border-slate-100 group hover:border-amber-200 transition-all cursor-pointer" onClick={() => setHouseForm({...houseForm, electricity_meter: !houseForm.electricity_meter})}>
                                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                                    <Zap size={20} />
                                </div>
                                <span className="text-xs font-bold text-slate-700 flex-1">বিদ্যুৎ মিটার আছে?</span>
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${houseForm.electricity_meter ? 'bg-amber-500 text-white' : 'bg-slate-200 text-transparent'}`}>
                                    <CheckCircle size={14} />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-5 rounded-[20px] bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                    <Droplets size={20} />
                                </div>
                                <select value={houseForm.water_source} onChange={(e) => setHouseForm({...houseForm, water_source: e.target.value})} className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 p-0 flex-1 cursor-pointer outline-none">
                                    <option value="tube-well">টিউবওয়েল</option>
                                    <option value="tap">সাপ্লাই পানি</option>
                                    <option value="pond">পুকুর</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="space-y-6">
                        <div className="space-y-4">
                            {residents.map((r, idx) => (
                                <div key={idx} className="p-6 rounded-[24px] border border-slate-100 bg-slate-50/80 space-y-5 relative group hover:border-teal-200 transition-all overflow-hidden">
                                    <button onClick={() => removeResident(idx)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors bg-white rounded-full p-2 shadow-sm z-10">
                                        <Trash2 size={16} />
                                    </button>
                                    
                                    <div className="grid grid-cols-2 gap-4 relative z-0 pr-10">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className={labelStyles}>সদস্যের নাম</label>
                                            <input value={r.name} onChange={(e) => updateResident(idx, 'name', e.target.value)} className={inputStyles + " bg-white shadow-sm"} placeholder={idx === 0 ? houseForm.owner_name : "উদা: রহিমা বেগম"} />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className={labelStyles}>সম্পর্ক</label>
                                            <select value={r.relation_with_head} onChange={(e) => updateResident(idx, 'relation_with_head', e.target.value)} className={inputStyles + " bg-white shadow-sm cursor-pointer appearance-none"}>
                                                <option value="Head">খানা প্রধান (নিজ)</option>
                                                <option value="Wife">স্ত্রী</option>
                                                <option value="Husband">স্বামী</option>
                                                <option value="Son">ছেলে</option>
                                                <option value="Daughter">মেয়ে</option>
                                                <option value="Father">পিতা</option>
                                                <option value="Mother">মাতা</option>
                                                <option value="Other">অন্যান্য</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <select value={r.gender} onChange={(e) => updateResident(idx, 'gender', e.target.value)} className={inputStyles + " bg-white shadow-sm cursor-pointer appearance-none"}>
                                            <option value="Male">পুরুষ</option>
                                            <option value="Female">নারী</option>
                                            <option value="Other">অন্যান্য</option>
                                        </select>
                                        <div onClick={() => updateResident(idx, 'is_voter', !r.is_voter)} className="flex items-center justify-between px-5 py-4 bg-white rounded-[20px] shadow-sm border border-slate-100 cursor-pointer group hover:border-teal-300 transition-all">
                                            <span className="text-[11px] font-black text-slate-500 uppercase">ভোটার?</span>
                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${r.is_voter ? 'bg-teal-500 text-white' : 'bg-slate-100 text-transparent'}`}>
                                                <CheckCircle size={14} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable Optional Fields */}
                                    <AnimatePresence>
                                        {r.expanded && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-2 space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className={labelStyles}>জন্ম তারিখ (ঐচ্ছিক)</label>
                                                        <input type="date" value={r.dob} onChange={(e) => updateResident(idx, 'dob', e.target.value)} className={inputStyles + " bg-white shadow-sm"} />
                                                    </div>
                                                    <div>
                                                        <label className={labelStyles}>এনআইডি নম্বর (ঐচ্ছিক)</label>
                                                        <input value={r.nid} onChange={(e) => updateResident(idx, 'nid', e.target.value)} className={inputStyles + " bg-white shadow-sm"} placeholder="National ID" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className={labelStyles}>পেশা</label>
                                                        <input value={r.occupation} onChange={(e) => updateResident(idx, 'occupation', e.target.value)} className={inputStyles + " bg-white shadow-sm"} placeholder="উদা: গৃহিণী/কৃষক" />
                                                    </div>
                                                    <div>
                                                        <label className={labelStyles}>শিক্ষাগত যোগ্যতা</label>
                                                        <select value={r.education_level} onChange={(e) => updateResident(idx, 'education_level', e.target.value)} className={inputStyles + " bg-white shadow-sm appearance-none"}>
                                                            <option value="">নির্বাচন করুন</option>
                                                            <option value="None">নিরক্ষর</option>
                                                            <option value="Primary">প্রাইমারি</option>
                                                            <option value="SSC">এসএসসি/সমমান</option>
                                                            <option value="HSC">এইচএসসি/সমমান</option>
                                                            <option value="Graduate">স্নাতক বা তার বেশি</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className={labelStyles}>রক্তের গ্রুপ</label>
                                                        <select value={r.blood_group} onChange={(e) => updateResident(idx, 'blood_group', e.target.value)} className={inputStyles + " bg-white shadow-sm appearance-none"}>
                                                            <option value="">জানা নেই</option>
                                                            <option value="A+">A+</option>
                                                            <option value="A-">A-</option>
                                                            <option value="B+">B+</option>
                                                            <option value="B-">B-</option>
                                                            <option value="AB+">AB+</option>
                                                            <option value="AB-">AB-</option>
                                                            <option value="O+">O+</option>
                                                            <option value="O-">O-</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className={labelStyles}>বৈবাহিক অবস্থা</label>
                                                        <select value={r.marital_status} onChange={(e) => updateResident(idx, 'marital_status', e.target.value)} className={inputStyles + " bg-white shadow-sm appearance-none"}>
                                                            <option value="Married">বিবাহিত</option>
                                                            <option value="Unmarried">অবিবাহিত</option>
                                                            <option value="Widow">বিধবা/বিপত্নীক</option>
                                                            <option value="Divorced">তালাকপ্রাপ্ত</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div>
                                                        <label className={labelStyles}>প্রতিবন্ধকতা (যদি থাকে)</label>
                                                        <select value={r.disability_status} onChange={(e) => updateResident(idx, 'disability_status', e.target.value)} className={inputStyles + " bg-white shadow-sm appearance-none"}>
                                                            <option value="None">নেই</option>
                                                            <option value="Physical">শারীরিক</option>
                                                            <option value="Visual">দৃষ্টি</option>
                                                            <option value="Hearing">শ্রবণ/বাক</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button type="button" onClick={() => updateResident(idx, 'expanded', !r.expanded)} className="w-full flex items-center justify-center gap-2 text-[11px] font-black uppercase text-teal-600 hover:text-teal-700 py-2">
                                        {r.expanded ? <><ChevronUp size={16} /> কম দেখান</> : <><ChevronDown size={16} /> আরও তথ্য দিন (NID, জন্মতারিখ, পেশা)</>}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="space-y-8">
                        <div className="text-center space-y-4 pt-4">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-6">
                                <Lock size={40} />
                            </div>
                            <h4 className="text-xl font-black text-slate-800">ডিজিটাল লকার পিন (PIN)</h4>
                            <p className="text-sm font-bold text-slate-500 max-w-sm mx-auto">
                                পরিবারের নিজস্ব তথ্যের নিরাপত্তা এবং ভবিষ্যতে তারা যাতে কিউআর কোড (QR Code) স্ক্যান করে নিজেরাই তথ্য আপডেট করতে পারে, সেজন্য একটি পিন সেট করুন।
                            </p>
                        </div>

                        <div className="max-w-xs mx-auto">
                            <label className="text-center block mb-3 text-xs font-black uppercase text-slate-400 tracking-widest">৪-ডিজিটের পিন দিন</label>
                            <input 
                                type="password" 
                                maxLength={4}
                                value={houseForm.locker_pin} 
                                onChange={(e) => setHouseForm({...houseForm, locker_pin: e.target.value.replace(/[^0-9]/g, '')})} 
                                className="w-full px-6 py-5 rounded-[24px] bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-teal-500 outline-none transition-all font-black text-slate-800 text-3xl text-center tracking-[0.5em]" 
                                placeholder="****" 
                            />
                            <p className="text-[10px] font-bold text-center text-slate-400 mt-4">ঐচ্ছিক: চাইলে খালি রেখে পরবর্তীতে সেট করতে পারবেন।</p>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* FOOTER - Fixed at bottom */}
            <div className="p-5 md:p-8 pt-4 shrink-0 bg-white z-10 border-t border-slate-50">
                {step === 1 && (
                    <button 
                        onClick={handleSaveHouse}
                        disabled={!houseForm.owner_name || saving}
                        className="w-full py-5 rounded-[24px] bg-slate-900 hover:bg-teal-600 text-white font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-slate-200 active:scale-95"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <>পরবর্তী ধাপ: সদস্য যোগ করুন <ArrowRight size={18} /></>}
                    </button>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <button 
                            onClick={() => setResidents([...residents, { ...defaultResident, relation_with_head: 'Other' }])} 
                            className="w-full py-4 rounded-[20px] bg-slate-50 text-slate-600 font-black text-[11px] uppercase tracking-widest hover:bg-teal-50 hover:text-teal-600 transition-all flex items-center justify-center gap-2 border border-dashed border-slate-200"
                        >
                            <Plus size={16} /> নতুন সদস্য যোগ করুন
                        </button>
                        
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setStep(1)}
                                className="flex-1 py-5 rounded-[24px] bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                ফিরে যান
                            </button>
                            <button 
                                onClick={handleSaveResidents} 
                                disabled={saving} 
                                className="flex-[2] py-5 rounded-[24px] bg-slate-900 hover:bg-teal-600 text-white font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 active:scale-95"
                            >
                                {saving ? <Loader2 className="animate-spin" /> : <>{isEditMode ? 'তথ্য আপডেট করুন' : 'পরবর্তী ধাপ: লকার'} <ArrowRight size={18} /></>}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setStep(2)}
                            className="flex-1 py-5 rounded-[24px] bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                            ফিরে যান
                        </button>
                        <button 
                            onClick={handleFinalize} 
                            disabled={saving} 
                            className="flex-[2] py-5 rounded-[24px] bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-teal-500/30 disabled:opacity-50 active:scale-95"
                        >
                            {saving ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                            {isEditMode ? 'তথ্য আপডেট সম্পন্ন করুন' : 'সব তথ্য নিশ্চিত করুন'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

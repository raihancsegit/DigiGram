'use client';

import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Home, User, Phone, MapPin, Zap, Droplets, 
    Plus, Trash2, Save, Loader2, CheckCircle, Navigation,
    ChevronDown, ChevronUp, Lock, Shield, ArrowRight, ArrowLeft, X,
    AlertCircle, CheckCircle2, Info, ShieldCheck, Sparkles, Scan
} from 'lucide-react';
import { householdService } from '@/lib/services/householdService';
import { aiService } from '@/lib/services/aiService';
import { toBnDigits } from '@/lib/utils/format';
import { notificationService } from '@/lib/services/notificationService';
import { supabase } from '@/lib/utils/supabase';
import toast from 'react-hot-toast';

const inputStyles = "w-full px-5 py-4 rounded-[20px] bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-700 text-sm";
const labelStyles = "text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block";

function SectionTitle({ icon: Icon, title, subtitle }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-teal-300">
                <Icon size={18} />
            </div>
            <div>
                <h4 className="text-sm font-black text-slate-800">{title}</h4>
                {subtitle && <p className="mt-1 text-xs font-bold leading-5 text-slate-400">{subtitle}</p>}
            </div>
        </div>
    );
}

export default function HouseholdEntryForm({ wardId, villageId, locationVillageId, initialData, onSuccess, onCancel }) {
    const { user } = useSelector((state) => state.auth);
    const isEditMode = !!initialData;
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1); // 1: House, 2: Residents, 3: Locker
    const [householdId, setHouseholdId] = useState(initialData?.id || null);
    const [scanningState, setScanningState] = useState({ idx: null, type: null }); // { idx, type }

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
        blood_group: '', education_level: '', occupation: '', 
        marital_status: 'Married', disability_status: 'None',
        nid_verified: false, birth_reg_verified: false,
        expanded: true 
    };

    const [residents, setResidents] = useState(() => {
        if (!initialData?.residents || initialData.residents.length === 0) {
            return [{ ...defaultResident }];
        }
        return initialData.residents.map((r, idx) => ({
            ...defaultResident,
            ...r,
            dob: r.dob ? new Date(r.dob).toISOString().split('T')[0] : '',
            expanded: idx === 0 || !!r.expanded 
        }));
    });
    const [deletedResidentIds, setDeletedResidentIds] = useState([]);
    const [hierarchy, setHierarchy] = useState(null);
    const bodyRef = useRef(null);

    const residentSummary = residents.reduce((acc, resident) => {
        if (!resident.name?.trim()) return acc;

        acc.total += 1;
        if (resident.is_voter) acc.voters += 1;
        if (resident.gender === 'Male') acc.males += 1;
        if (resident.gender === 'Female') acc.females += 1;
        if (resident.blood_group) acc.bloodGroups += 1;
        return acc;
    }, { total: 0, voters: 0, males: 0, females: 0, bloodGroups: 0 });

    const qualitySummary = residents.reduce((acc, resident) => {
        if (!resident.name?.trim()) return acc;
        const checks = [
            resident.name,
            resident.relation_with_head,
            resident.gender,
            resident.dob,
            resident.father_name,
            resident.mother_name,
            resident.address,
            resident.nid || resident.birth_reg_no,
            resident.blood_group
        ];
        acc.totalFields += checks.length;
        acc.filledFields += checks.filter(Boolean).length;
        if (!resident.nid) acc.missingNid += 1;
        if (!resident.birth_reg_no) acc.missingBirthReg += 1;
        if (!resident.blood_group) acc.missingBloodGroup += 1;
        if (!resident.address) acc.missingAddress += 1;
        return acc;
    }, { totalFields: 0, filledFields: 0, missingNid: 0, missingBirthReg: 0, missingBloodGroup: 0, missingAddress: 0 });

    const completeness = qualitySummary.totalFields > 0
        ? Math.round((qualitySummary.filledFields / qualitySummary.totalFields) * 100)
        : 0;

    useEffect(() => {
        bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    useEffect(() => {
        setResidents((currentResidents) => {
            if (!currentResidents.length) return currentResidents;
            const head = currentResidents[0];
            if (head.name && head.name !== houseForm.owner_name) return currentResidents;

            const nextResidents = [...currentResidents];
            nextResidents[0] = {
                ...nextResidents[0],
                name: houseForm.owner_name || '',
                relation_with_head: 'Head'
            };
            return nextResidents;
        });
    }, [houseForm.owner_name]);

    useEffect(() => {
        async function fetchHierarchy() {
            try {
                const { getWardFullContext } = await import('@/lib/services/hierarchyService');
                const full = await getWardFullContext(wardId);
                setHierarchy(full);

                // Only auto-generate ID for new households
                if (!isEditMode && full) {
                    const { data: identifiers, error: identifierError } = await supabase.rpc('reserve_household_identifiers', {
                        target_ward_id: wardId,
                        target_village_id: villageId,
                        target_location_village_id: locationVillageId
                    });

                    if (identifierError) throw identifierError;

                    setHouseForm(prev => ({
                        ...prev,
                        qr_code_id: identifiers.qr_code_id,
                        house_no: prev.house_no || identifiers.house_no
                    }));
                }
            } catch (err) {
                console.error("Error fetching hierarchy for ID generation:", err);
            }
        }
        fetchHierarchy();
    }, [wardId, villageId, isEditMode, locationVillageId]);

    async function handleGetLocation() {
        if (!navigator.geolocation) {
            toast.error("আপনার ব্রাউজার জিপিএস সাপোর্ট করে না");
            return;
        }
        const loadingToast = toast.loading("আপনার লোকেশন সংগ্রহ করা হচ্ছে...");
        navigator.geolocation.getCurrentPosition((position) => {
            toast.dismiss(loadingToast);
            setHouseForm({
                ...houseForm,
                lat: position.coords.latitude,
                lng: position.coords.longitude
            });
            toast.success("লোকেশন সেট করা হয়েছে!");
        }, (err) => {
            toast.dismiss(loadingToast);
            toast.error("লোকেশন পাওয়া যায়নি। অনুগ্রহ করে পারমিশন চেক করুন।");
        });
    }

    async function handleSaveHouse() {
        setSaving(true);
        try {
            const submitData = {
                ...houseForm,
                ward_id: wardId,
                village_id: villageId,
                location_village_id: locationVillageId || initialData?.location_village_id || null,
                added_by_user_id: user?.id || initialData?.added_by_user_id || null
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

            // Sync head name to residents list if empty
            if (residents.length > 0 && !residents[0].name && houseForm.owner_name) {
                const newR = [...residents];
                newR[0].name = houseForm.owner_name;
                setResidents(newR);
            }

            setStep(2);
        } catch (err) {
            console.error("Supabase Error (House):", err?.message || JSON.stringify(err, null, 2), err);
            toast.error("বাড়ি সেভ করতে সমস্যা হয়েছে: " + (err?.message || "Unknown error"));
        } finally {
            setSaving(false);
        }
    }

    async function handleSaveResidents() {
        if (!householdId) {
            toast.error("বাড়ির তথ্য আগে সেভ করতে হবে।");
            setStep(1);
            return;
        }
        if (user?.role === 'super_admin') {
            setStep(3); // Move to locker pin step
        } else {
            handleFinalize();
        }
    }

    async function handleFinalize() {
        const loadingToast = toast.loading("সেভ প্রক্রিয়া শুরু হয়েছে, দয়া করে অপেক্ষা করুন...");
        setSaving(true);
        try {
            if (houseForm.locker_pin) {
                const { supabase } = await import('@/lib/utils/supabase');
                const { error: pinError } = await supabase.rpc('set_household_locker_pin', {
                    target_household_id: householdId,
                    raw_pin: houseForm.locker_pin
                });
                if (pinError) throw pinError;
            }

            let updatedCount = 0;
            for (let i = 0; i < residents.length; i++) {
                const r = residents[i];
                if (!r.name) continue;

                const residentData = {
                    name: r.name,
                    name_en: r.name_en || null,
                    gender: r.gender,
                    is_voter: !!r.is_voter,
                    relation_with_head: r.relation_with_head,
                    dob: r.dob || null,
                    nid: r.nid || null,
                    birth_reg_no: r.birth_reg_no || null,
                    father_name: r.father_name || null,
                    mother_name: r.mother_name || null,
                    address: r.address || null,
                    blood_group: r.blood_group || null,
                    occupation: r.occupation || null,
                    education_level: r.education_level || null,
                    marital_status: r.marital_status || 'Married',
                    disability_status: r.disability_status || 'None',
                    household_id: householdId
                };

                try {
                    if (r.id) {
                        try {
                            await householdService.updateResident(r.id, residentData);
                        } catch (err) {
                            if (err.message?.includes("column") || err.code === "42703") {
                                throw new Error('Resident extended fields are missing in the database. Run database/22_resident_extended_profile_fields.sql first.');
                            } else throw err;
                        }
                    } else {
                        try {
                            await householdService.createResident(residentData);
                        } catch (err) {
                            if (err.message?.includes("column") || err.code === "42703") {
                                throw new Error('Resident extended fields are missing in the database. Run database/22_resident_extended_profile_fields.sql first.');
                            } else throw err;
                        }
                    }
                    updatedCount++;
                } catch (resErr) {
                    const errorString = JSON.stringify(resErr, Object.getOwnPropertyNames(resErr));
                    console.log("CRITICAL ERROR DATA:", errorString);
                    
                    let displayMsg = resErr.message || JSON.stringify(resErr);
                    if (displayMsg.includes("residents_nid_key")) {
                        displayMsg = "এই NID নম্বরটি দিয়ে ইতিমধ্যে একজন সদস্য নিবন্ধিত আছে। একই NID দুইবার ব্যবহার করা যাবে না।";
                    } else if (displayMsg.includes("residents_birth_reg_no_key")) {
                        displayMsg = "এই জন্ম নিবন্ধন নম্বরটি দিয়ে ইতিমধ্যে একজন সদস্য নিবন্ধিত আছে।";
                    }
                    
                    alert("ডাটা সেভ করতে সমস্যা হয়েছে! \n\nভুলটি হলো: " + displayMsg);
                    
                    toast.dismiss(loadingToast);
                    toast.error(`সেভ ব্যর্থ। অ্যালার্ট চেক করুন।`);
                    throw resErr;
                }
            }

            for (const delId of deletedResidentIds) {
                try {
                    await householdService.deleteResident(delId, householdId);
                } catch (delErr) {
                    console.error("Error deleting resident:", delErr);
                }
            }

            await householdService.syncHouseholdStats(householdId);
            
            if (!isEditMode) {
                try {
                    const vName = hierarchy?.village?.name || 'গ্রাম';
                    const owner = houseForm.owner_name;
                    await notificationService.createNotification({
                        title: 'নতুন খানা যোগ করা হয়েছে',
                        message: `${vName} গ্রামে ${owner}-এর নতুন খানা তথ্য সফলভাবে যুক্ত করা হয়েছে।`,
                        role: 'ward_member',
                        scope_id: wardId,
                        type: 'success'
                    });
                } catch (notifyErr) {
                    console.warn("Notification failed:", notifyErr);
                }
            }

            toast.dismiss(loadingToast);
            toast.success("সব তথ্য সফলভাবে আপডেট করা হয়েছে!");
            onSuccess();
        } catch (err) {
            console.error("Finalize Error:", err);
            toast.dismiss(loadingToast);
            toast.error("ডাটা সেভ করতে সমস্যা হয়েছে।");
        } finally {
            setSaving(false);
        }
    }

    function updateResident(idx, field, value) {
        const newR = [...residents];
        newR[idx][field] = value;
        setResidents(newR);
    }

    function addResidentByRelation(relation) {
        const relationDefaults = {
            Wife: { relation_with_head: 'Wife', gender: 'Female', marital_status: 'Married' },
            Husband: { relation_with_head: 'Husband', gender: 'Male', marital_status: 'Married' },
            Son: { relation_with_head: 'Son', gender: 'Male', marital_status: 'Unmarried' },
            Daughter: { relation_with_head: 'Daughter', gender: 'Female', marital_status: 'Unmarried' },
            Father: { relation_with_head: 'Father', gender: 'Male', marital_status: 'Married' },
            Mother: { relation_with_head: 'Mother', gender: 'Female', marital_status: 'Married' }
        };

        const next = {
            ...defaultResident,
            ...(relationDefaults[relation] || { relation_with_head: 'Other' }),
            address: residents[0]?.address || ''
        };
        setResidents((current) => [...current, next]);
    }

    function copyHeadAddressToAll() {
        const headAddress = residents[0]?.address;
        if (!headAddress) {
            toast.error('আগে খানা প্রধানের ঠিকানা লিখুন।');
            return;
        }
        setResidents((current) => current.map((resident) => ({
            ...resident,
            address: resident.address || headAddress
        })));
        toast.success('ঠিকানা সব সদস্যের জন্য বসানো হয়েছে।');
    }

    function normalizeAIData(data) {
        const clean = { ...data };
        
        // Normalize Gender
        if (clean.gender) {
            const g = clean.gender.toLowerCase();
            if (g.includes('mal')) clean.gender = 'Male';
            else if (g.includes('fem')) clean.gender = 'Female';
            else clean.gender = 'Other';
        }

        // Normalize Blood Group (Strip anything not like A+, B-, etc.)
        if (clean.blood_group) {
            const bgMatch = clean.blood_group.match(/(A|B|AB|O)[\s]*(\+|\-)/i);
            if (bgMatch) {
                clean.blood_group = (bgMatch[1] + bgMatch[2]).toUpperCase();
            } else {
                clean.blood_group = null; // Don't send invalid blood group
            }
        }

        // Normalize DOB (Ensure YYYY-MM-DD)
        if (clean.dob) {
            const dateMatch = clean.dob.match(/(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})/);
            if (dateMatch) {
                clean.dob = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
            }
        }

        return clean;
    }

    async function handleScanDocument(idx, e, type = 'any') {
        const files = Array.from(e.target.files);
        console.log("Files selected:", files, "Type:", type);
        if (files.length === 0) return;

        setScanningState({ idx, type });
        const loadingToast = toast.loading(`${type === 'nid' ? 'NID' : 'জন্ম নিবন্ধন'} ছবি বিশ্লেষণ করা হচ্ছে...`);
        
        try {
            let rawData = await aiService.scanResidentDocument(files);
            const data = normalizeAIData(rawData); // Clean the data!
            console.log("AI Data Normalized:", data);
            
            const newR = [...residents];
            const current = newR[idx];
            
            // Check for mismatches if both exist
            let conflicts = current.conflicts || [];
            if (type === 'nid' && current.birth_reg_verified && data.name) {
                if (data.name !== current.name) {
                    conflicts.push(`নামের অমিল: NID-তে "${data.name}" এবং জন্ম নিবন্ধনে "${current.name}"`);
                }
            } else if (type === 'birth_reg' && current.nid_verified && data.name) {
                if (data.name !== current.name) {
                    conflicts.push(`নামের অমিল: NID-তে "${current.name}" এবং জন্ম নিবন্ধনে "${data.name}"`);
                }
            }

            // NID always takes priority for main fields
            const shouldUpdateMain = type === 'nid' || !current.nid_verified;

            newR[idx] = {
                ...current,
                name: shouldUpdateMain ? (data.name || current.name) : current.name,
                name_en: shouldUpdateMain ? (data.name_en || current.name_en) : current.name_en,
                nid: data.nid || current.nid,
                birth_reg_no: data.birth_reg_no || current.birth_reg_no,
                dob: shouldUpdateMain ? (data.dob || current.dob) : current.dob,
                gender: shouldUpdateMain ? (data.gender || current.gender) : current.gender,
                father_name: shouldUpdateMain ? (data.father_name || current.father_name) : current.father_name,
                mother_name: shouldUpdateMain ? (data.mother_name || current.mother_name) : current.mother_name,
                blood_group: data.blood_group || current.blood_group,
                address: data.address || current.address, // Auto-populate address from back part
                conflicts: [...new Set(conflicts)],
                // Verification logic
                nid_verified: type === 'nid' ? true : (data.isNID || current.nid_verified),
                birth_reg_verified: type === 'birth_reg' ? true : (data.isBirthCertificate || current.birth_reg_verified),
                // Auto-voter logic
                is_voter: (type === 'nid' || data.isNID) ? true : current.is_voter,
                expanded: true
            };
            
            setResidents(newR);
            toast.dismiss(loadingToast);
            toast.success("AI সফলভাবে তথ্য সংগ্রহ করেছে!");
        } catch (err) {
            console.error("Scanning Error:", err);
            toast.dismiss(loadingToast);
            toast.error("স্ক্যান করতে সমস্যা হয়েছে: " + err);
        } finally {
            setScanningState({ idx: null, type: null });
        }
    }

    function removeResident(idx) {
        const resToRemove = residents[idx];
        if (resToRemove.id) {
            setDeletedResidentIds([...deletedResidentIds, resToRemove.id]);
        }
        setResidents(residents.filter((_, i) => i !== idx));
    }

    return (
        <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col relative overflow-hidden ring-1 ring-slate-200">
            <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancel(); }}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all z-[100] shadow-sm pointer-events-auto"
                type="button"
            >
                <X size={20} />
            </button>

            {/* HEADER - Fixed at top */}
            <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 md:px-6 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                            {step === 1 && <Home size={20} className="md:w-6 md:h-6" />}
                            {step === 2 && <User size={20} className="md:w-6 md:h-6" />}
                            {step === 3 && <Shield size={20} className="md:w-6 md:h-6" />}
                        </div>
                        <div>
                            <h3 className="text-base md:text-lg font-black tracking-tight text-slate-800">
                                {step === 1 ? 'বাড়ির তথ্য' : step === 2 ? 'সদস্যদের তথ্য' : 'নিরাপত্তা সেটআপ'}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                ধাপ {toBnDigits(step.toString())} / ৩
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map((s) => (
                            <div 
                                key={s}
                                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                                    step === s ? 'bg-teal-600 w-6' : step > s ? 'bg-teal-300' : 'bg-slate-200'
                                }`}
                            />
                        ))}
                    </div>
                </div>

            </div>

            {/* BODY - Scrollable */}
            <div ref={bodyRef} className="flex-1 overflow-y-auto bg-white p-5 custom-scrollbar relative z-0 md:p-6">
                {step === 1 && (
                    <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
                        <div className="space-y-5">
                        <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
                            <label className={labelStyles}>Auto House ID</label>
                            <div className="relative">
                                <input 
                                    readOnly
                                    value={houseForm.qr_code_id || ''} 
                                    className={inputStyles + " bg-teal-50 border-teal-100 text-teal-700 tracking-widest uppercase font-black pr-12 cursor-not-allowed"} 
                                    placeholder="Generating ID..." 
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-400">
                                    <Shield size={20} />
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 mt-2 ml-1">
                                গ্রামের প্রথম ৪ অক্ষর, ওয়ার্ড নম্বর ও সিরিয়াল ধরে এই আইডি তৈরি হচ্ছে।
                            </p>
                        </div>

                        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                            <SectionTitle
                                icon={User}
                                title="বাড়ির মৌলিক তথ্য"
                                subtitle="খানা প্রধানসহ সবার পূর্ণ ব্যক্তিগত তথ্য পরের ধাপে একই ফরম্যাটে নেওয়া হবে।"
                            />
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className={labelStyles}>খানা প্রধানের নাম <span className="text-rose-500">*</span></label>
                                    <input required value={houseForm.owner_name || ''} onChange={(e) => setHouseForm({...houseForm, owner_name: e.target.value})} className={inputStyles} placeholder="উদা: মোঃ আবুল হোসেন" />
                                </div>
                                <div>
                                    <label className={labelStyles}>বাড়ির নম্বর / হোল্ডিং</label>
                                    <input value={houseForm.house_no || ''} onChange={(e) => setHouseForm({...houseForm, house_no: e.target.value})} className={inputStyles} placeholder="উদা: ৪২/ক" />
                                </div>
                                <div>
                                    <label className={labelStyles}>মালিকের মোবাইল</label>
                                    <input value={houseForm.phone || ''} onChange={(e) => setHouseForm({...houseForm, phone: e.target.value})} className={inputStyles} placeholder="017XXXXXXXX" />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                            <SectionTitle
                                icon={Home}
                                title="বাড়ির অবস্থা"
                                subtitle="পরিবারের জীবনমান ও মৌলিক সুবিধার তথ্য।"
                            />
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
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
                        </section>

                        </div>

                        <section className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-0">
                            <SectionTitle
                                icon={MapPin}
                                title="লোকেশন ও সুবিধা"
                                subtitle="ম্যাপ পিন ও মৌলিক সেবা একই জায়গায় নিন।"
                            />
                        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-between group transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-teal-600">
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

                        <div className="grid grid-cols-1 gap-4">
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
                        </section>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="space-y-5">
                        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">তথ্য সম্পূর্ণতা</p>
                                    <p className="mt-1 text-2xl font-black text-slate-800">{toBnDigits(completeness)}%</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-500 md:grid-cols-4">
                                    <span>NID নেই: {toBnDigits(qualitySummary.missingNid)}</span>
                                    <span>জন্ম সনদ নেই: {toBnDigits(qualitySummary.missingBirthReg)}</span>
                                    <span>রক্তের গ্রুপ নেই: {toBnDigits(qualitySummary.missingBloodGroup)}</span>
                                    <span>ঠিকানা নেই: {toBnDigits(qualitySummary.missingAddress)}</span>
                                </div>
                            </div>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                                <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${completeness}%` }} />
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-sm font-black text-slate-800">দ্রুত সদস্য যোগ করুন</p>
                                    <p className="mt-1 text-xs font-bold text-slate-400">সম্পর্ক বেছে দিলেই সদস্যের ধরন আগে থেকে বসে যাবে।</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        ['Wife', 'স্ত্রী'],
                                        ['Husband', 'স্বামী'],
                                        ['Son', 'ছেলে'],
                                        ['Daughter', 'মেয়ে'],
                                        ['Father', 'বাবা'],
                                        ['Mother', 'মা']
                                    ].map(([value, label]) => (
                                        <button key={value} type="button" onClick={() => addResidentByRelation(value)} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700">
                                            + {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button type="button" onClick={copyHeadAddressToAll} className="mt-4 text-xs font-black text-teal-600 hover:text-teal-700">
                                খানা প্রধানের ঠিকানা সবার জন্য বসান
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                            {[
                                ['মোট সদস্য', residentSummary.total],
                                ['ভোটার', residentSummary.voters],
                                ['পুরুষ', residentSummary.males],
                                ['নারী', residentSummary.females],
                                ['রক্তের গ্রুপ জানা', residentSummary.bloodGroups]
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <p className="text-[10px] font-black text-slate-400">{label}</p>
                                    <p className="mt-1 text-xl font-black text-slate-800">{toBnDigits(String(value))}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            {residents.map((r, idx) => (
                                <div key={idx} className="relative space-y-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-teal-300">
                                    <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div>
                                            <p className="text-[10px] font-black text-teal-600">
                                                সদস্য {toBnDigits(String(idx + 1))}
                                            </p>
                                            <h5 className="mt-1 text-sm font-black text-slate-800">
                                                {idx === 0 ? 'খানা প্রধান' : (r.name || 'নতুন সদস্য')}
                                            </h5>
                                        </div>
                                        <div className="flex items-center gap-2 pr-10">
                                            {r.blood_group && (
                                                <span className="rounded-full bg-rose-50 px-3 py-1 text-[10px] font-black text-rose-600">
                                                    {r.blood_group}
                                                </span>
                                            )}
                                            {r.is_voter && (
                                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-600">
                                                    ভোটার
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {idx > 0 && (
                                        <button onClick={() => removeResident(idx)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors bg-white rounded-full p-2 shadow-sm z-10">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-5 relative z-0">
                                        <div className="col-span-2 md:col-span-1">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className={labelStyles + " !mb-0"}>নাম (বাংলা)</label>
                                                <div className="flex gap-1.5">
                                                    <label htmlFor={`scan-nid-${idx}`} className="cursor-pointer group/scan relative">
                                                        <input 
                                                            id={`scan-nid-${idx}`}
                                                            type="file" 
                                                            accept="image/*" 
                                                            multiple
                                                            className="hidden" 
                                                            onChange={(e) => handleScanDocument(idx, e, 'nid')}
                                                            disabled={scanningState.idx === idx}
                                                        />
                                                        <div className={`flex items-center gap-1 text-[8px] font-black uppercase px-2 py-1 rounded-lg border transition-all shadow-sm ${r.nid_verified ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-600 hover:text-white'}`}>
                                                            {scanningState.idx === idx && scanningState.type === 'nid' ? <Loader2 size={10} className="animate-spin" /> : <Scan size={10} />}
                                                            NID (Front & Back)
                                                        </div>
                                                    </label>
                                                    <label htmlFor={`scan-birth-${idx}`} className="cursor-pointer group/scan relative">
                                                        <input 
                                                            id={`scan-birth-${idx}`}
                                                            type="file" 
                                                            accept="image/*" 
                                                            className="hidden" 
                                                            onChange={(e) => handleScanDocument(idx, e, 'birth_reg')}
                                                            disabled={scanningState.idx === idx}
                                                        />
                                                        <div className={`flex items-center gap-1 text-[8px] font-black uppercase px-2 py-1 rounded-lg border transition-all shadow-sm ${r.birth_reg_verified ? 'bg-blue-500 text-white border-blue-600' : 'bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-600 hover:text-white'}`}>
                                                            {scanningState.idx === idx && scanningState.type === 'birth_reg' ? <Loader2 size={10} className="animate-spin" /> : <Scan size={10} />}
                                                            B-REG
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                            <input value={r.name || ''} onChange={(e) => updateResident(idx, 'name', e.target.value)} className={inputStyles + " bg-white shadow-sm"} placeholder={idx === 0 ? houseForm.owner_name : "উদা: রহিমা বেগম"} />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className={labelStyles}>Name (English)</label>
                                            <input value={r.name_en || ''} onChange={(e) => updateResident(idx, 'name_en', e.target.value)} className={inputStyles + " bg-white shadow-sm font-mono tracking-tight"} placeholder="E.g. Rohima Begum" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className={labelStyles}>পিতার নাম</label>
                                            <input value={r.father_name || ''} onChange={(e) => updateResident(idx, 'father_name', e.target.value)} className={inputStyles + " bg-white shadow-sm"} placeholder="পিতার নাম লিখুন" />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className={labelStyles}>মাতার নাম</label>
                                            <input value={r.mother_name || ''} onChange={(e) => updateResident(idx, 'mother_name', e.target.value)} className={inputStyles + " bg-white shadow-sm"} placeholder="মাতার নাম লিখুন" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-3">
                                        <div>
                                            <label className={labelStyles}>এনআইডি নম্বর</label>
                                            <input
                                                value={r.nid || ''}
                                                onChange={(e) => updateResident(idx, 'nid', e.target.value.replace(/\D/g, ''))}
                                                className={inputStyles + " bg-white shadow-sm"}
                                                placeholder="NID"
                                                maxLength={17}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelStyles}>জন্ম নিবন্ধন নম্বর</label>
                                            <input
                                                value={r.birth_reg_no || ''}
                                                onChange={(e) => updateResident(idx, 'birth_reg_no', e.target.value.replace(/\D/g, ''))}
                                                className={inputStyles + " bg-white shadow-sm"}
                                                placeholder="Birth Registration"
                                                maxLength={17}
                                            />
                                        </div>
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
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className={labelStyles}>স্থায়ী ঠিকানা</label>
                                            <div className="relative">
                                                <input value={r.address || ''} onChange={(e) => updateResident(idx, 'address', e.target.value)} className={inputStyles + " bg-white shadow-sm pl-9"} placeholder="গ্রাম, থানা, জেলা" />
                                                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            </div>
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

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
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

                                    {/* Smart Status & Eligibility Logic */}
                                    {(() => {
                                        if (!r.dob) return (
                                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                                                <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                                <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                                                    জন্ম তারিখ প্রদান করলে সিস্টেম অটোমেটিক ভোটার এবং জন্ম নিবন্ধনের যোগ্যতা যাচাই করতে পারবে।
                                                </p>
                                            </div>
                                        );

                                        const birthDate = new Date(r.dob);
                                        const today = new Date();
                                        let age = today.getFullYear() - birthDate.getFullYear();
                                        const m = today.getMonth() - birthDate.getMonth();
                                        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                            age--;
                                        }

                                         const isEligibleForVoter = age >= 18;
                                         const hasNid = (r.nid?.length === 10 || r.nid?.length === 13 || r.nid?.length === 17) || r.nid_verified;
                                         const hasBirthReg = r.birth_reg_no?.length === 17 || r.birth_reg_verified;

                                         return (
                                             <div className="space-y-3">
                                                 {/* Verification Badges */}
                                                 <div className="flex gap-2 mb-2">
                                                     <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${r.nid_verified ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200 border-dashed'}`}>
                                                         {r.nid_verified ? <ShieldCheck size={12} /> : <AlertCircle size={12} />}
                                                         NID {r.nid_verified ? 'Verified' : 'Unverified'}
                                                     </div>
                                                     <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${r.birth_reg_verified ? 'bg-blue-500 text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-400 border border-slate-200 border-dashed'}`}>
                                                         {r.birth_reg_verified ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                         Birth Reg {r.birth_reg_verified ? 'Verified' : 'Unverified'}
                                                     </div>
                                                 </div>

                                                 {/* Alerts & Guidance */}
                                                 {r.nid_verified && (
                                                     <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                                                         <ShieldCheck size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                                         <div>
                                                             <p className="text-[10px] font-black text-emerald-700 uppercase">জাতীয় পরিচয়পত্র ভেরিফাইড</p>
                                                             <p className="text-[10px] font-bold text-emerald-600 mt-0.5">এনআইডি নম্বর সিস্টেমে সংরক্ষিত আছে।</p>
                                                         </div>
                                                     </div>
                                                 )}

                                                 {r.birth_reg_verified && (
                                                     <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                                                         <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                                         <div>
                                                             <p className="text-[10px] font-black text-emerald-700 uppercase">জন্ম নিবন্ধন ভেরিফাইড</p>
                                                             <p className="text-[10px] font-bold text-emerald-600 mt-0.5">ডিজিটাল জন্ম নিবন্ধন নম্বর সিস্টেমে পাওয়া গেছে।</p>
                                                         </div>
                                                     </div>
                                                 )}

                                                 {!r.nid_verified && !r.birth_reg_verified && (
                                                     <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3">
                                                         <AlertCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
                                                         <div>
                                                             <p className="text-[10px] font-black text-rose-700 uppercase">জরুরি পদক্ষেপ প্রয়োজন</p>
                                                             <p className="text-[10px] font-bold text-rose-600 mt-0.5">সিস্টেমে কোনো ভ্যালিড নম্বর নেই। দয়া করে সঠিক নম্বর দিন অথবা আবেদনের জন্য চেয়ারম্যানের সাথে যোগাযোগ করুন।</p>
                                                         </div>
                                                     </div>
                                                 )}

                                                 {/* Mismatch Warning Alert */}
                                                 {r.conflicts?.length > 0 && (
                                                     <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 shadow-sm animate-pulse">
                                                         <AlertCircle size={20} className="text-amber-500 mt-1 shrink-0" />
                                                         <div>
                                                             <p className="text-[11px] font-black text-amber-700 uppercase">তথ্যের অমিল পাওয়া গেছে!</p>
                                                             <div className="space-y-1 mt-1">
                                                                 {r.conflicts.map((msg, cidx) => (
                                                                     <p key={cidx} className="text-[10px] font-bold text-amber-600 leading-tight">• {msg}</p>
                                                                 ))}
                                                             </div>
                                                             <p className="text-[9px] font-black text-amber-800 mt-2 italic">* সিস্টেম এনআইডি-র তথ্যকে প্রাধান্য দিচ্ছে। অমিল ঠিক করতে নিচের আবেদন বাটনটি ব্যবহার করুন।</p>
                                                         </div>
                                                     </div>
                                                 )}

                                                 {/* Smart Advisor Section */}
                                                 <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden relative">
                                                     <div className="absolute top-0 right-0 p-4 opacity-10 text-white pointer-events-none"><Sparkles size={40} /></div>
                                                     <div className="relative z-10">
                                                         <div className="flex items-center gap-2 mb-3">
                                                             <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-white"><Sparkles size={10} /></div>
                                                             <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest">স্মার্ট অ্যাডভাইজর</p>
                                                         </div>
                                                         
                                                         <div className="space-y-3">
                                                            {r.conflicts?.length > 0 && (
                                                                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 group/adv">
                                                                    <div>
                                                                        <p className="text-[11px] font-bold text-amber-400">তথ্য সংশোধনের আবেদন (NID অনুযায়ী)</p>
                                                                        <p className="text-[8px] font-black text-amber-500/70 uppercase mt-0.5">জন্ম নিবন্ধন সংশোধন</p>
                                                                    </div>
                                                                    <button type="button" className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-900 text-[9px] font-black uppercase tracking-tighter hover:bg-white transition-all shadow-lg shadow-amber-500/20">আবেদন করুন</button>
                                                                </div>
                                                            )}
                                                            {isEligibleForVoter && !r.is_voter && (
                                                                <div className="flex items-center justify-between group/adv">
                                                                    <p className="text-[11px] font-bold text-slate-100">ভোটার নিবন্ধন আবেদন প্রয়োজন</p>
                                                                    <button type="button" className="text-[9px] font-black text-teal-400 uppercase tracking-tighter hover:text-white transition-all">আবেদন করুন →</button>
                                                                </div>
                                                            )}
                                                            {age < 18 && !hasBirthReg && (
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[11px] font-bold text-slate-100">জন্ম নিবন্ধন (নতুন) প্রয়োজন</p>
                                                                    <button type="button" className="text-[9px] font-black text-teal-400 uppercase tracking-tighter hover:text-white transition-all">আবেদন করুন →</button>
                                                                </div>
                                                            )}
                                                            {!hasNid && age >= 18 && (
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[11px] font-bold text-slate-100">জাতীয় পরিচয়পত্রের আবেদন</p>
                                                                    <button type="button" className="text-[9px] font-black text-teal-400 uppercase tracking-tighter hover:text-white transition-all">আবেদন করুন →</button>
                                                                </div>
                                                            )}
                                                            {hasNid && !r.blood_group && (
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[11px] font-bold text-slate-100">রক্তের গ্রুপ আপডেট প্রয়োজন</p>
                                                                    <button type="button" className="text-[9px] font-black text-teal-400 uppercase tracking-tighter hover:text-white transition-all">আপডেট করুন →</button>
                                                                </div>
                                                            )}
                                                         </div>
                                                     </div>
                                                 </div>
                                             </div>
                                         );
                                    })()}

                                    {/* Expandable Optional Fields */}
                                    <AnimatePresence>
                                        {r.expanded && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-2 space-y-4">
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div>
                                                        <label className={labelStyles}>জন্ম তারিখ (ঐচ্ছিক)</label>
                                                        <input type="date" min="1900-01-01" value={r.dob || ''} onChange={(e) => updateResident(idx, 'dob', e.target.value)} className={inputStyles + " bg-white shadow-sm"} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                                                    <div>
                                                        <label className={labelStyles}>পেশা</label>
                                                        <input value={r.occupation || ''} onChange={(e) => updateResident(idx, 'occupation', e.target.value)} className={inputStyles + " bg-white shadow-sm"} placeholder="উদা: গৃহিণী/কৃষক" />
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
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                value={houseForm.locker_pin || ''} 
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
            <div className="shrink-0 border-t border-slate-200 bg-white p-4 md:p-5">
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Home, Users, MapPin, UserCheck, Plus, Search, 
    ChevronRight, Save, Trash2, Edit3, CheckCircle2, AlertCircle, Loader2,
    ArrowLeft, Map as MapIcon, Info, Filter
} from 'lucide-react';
import { householdService } from '@/lib/services/householdService';
import { adminService } from '@/lib/services/adminService';
import { toBnDigits } from '@/lib/utils/format';
import HouseholdEntryForm from './HouseholdEntryForm';

export default function WardHouseholdManager({ wardId, assignedVillage = null, volunteerMode = false }) {
    const isAssignedVillageMode = volunteerMode || Boolean(assignedVillage?.id);
    const [villages, setVillages] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [households, setHouseholds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState(isAssignedVillageMode ? 'houses' : 'villages'); // 'villages' or 'volunteers' or 'houses'
    const [selectedVillage, setSelectedVillage] = useState(assignedVillage);
    const [stats, setStats] = useState({ total_members: 0, voters: 0, males: 0, females: 0, total_houses: 0 });
    
    // Modal states
    const [showVillageModal, setShowVillageModal] = useState(false);
    const [showVolunteerModal, setShowVolunteerModal] = useState(false);
    const [showHouseModal, setShowHouseModal] = useState(false);
    const [villageForm, setVillageForm] = useState({ name: '', bn_name: '', para_name: '', total_estimated_houses: '' });
    const [volunteerForm, setVolunteerForm] = useState({ name: '', phone: '', assigned_village_id: '', password: '' });
    const [saving, setSaving] = useState(false);

    const loadInitialData = useCallback(async () => {
        try {
            setLoading(true);
            const [vData, volData, sData] = await Promise.all([
                householdService.getVillagesByWard(wardId),
                householdService.getVolunteersByWard(wardId),
                householdService.getHouseholdStats(wardId)
            ]);
            setVillages(vData);
            setVolunteers(volData);
            setStats(sData);

            if (selectedVillage) {
                const hData = await householdService.getHouseholdsByVillage(selectedVillage.id);
                setHouseholds(hData);
            }
        } catch (err) {
            console.error("Failed to load ward data:", err);
        } finally {
            setLoading(false);
        }
    }, [wardId, selectedVillage]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    useEffect(() => {
        if (!isAssignedVillageMode) return;
        setSelectedVillage(assignedVillage);
        setActiveView('houses');
    }, [assignedVillage, isAssignedVillageMode]);

    async function handleAddVillage(e) {
        e.preventDefault();
        setSaving(true);
        try {
            await householdService.mutateVillage({
                ...villageForm,
                ward_id: wardId
            });
            setShowVillageModal(false);
            setVillageForm({ bn_name: '', name: '', para_name: '', total_estimated_houses: '' });
            await loadInitialData();
            alert("গ্রাম সফলভাবে যোগ করা হয়েছে।");
        } catch (err) {
            console.error(err);
            alert("গ্রাম যোগ করতে সমস্যা হয়েছে।");
        } finally {
            setSaving(false);
        }
    }

    async function handleAddVolunteer(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const locationVillages = await householdService.getLocationVillagesByWard(wardId);
            const householdVillage = villages.find((v) => v.id === volunteerForm.assigned_village_id);
            const locationVillage = locationVillages.find((v) => (
                v.name_bn === householdVillage?.bn_name ||
                v.name_en === householdVillage?.name ||
                v.name_bn === householdVillage?.name
            ));

            if (!locationVillage?.id) {
                throw new Error('Assigned village location not found');
            }
            const phoneKey = volunteerForm.phone.replace(/\D/g, '') || Date.now().toString();

            await adminService.quickCreateChairman({
                email: `${phoneKey}@volunteer.digigram.com`,
                password: volunteerForm.password,
                first_name: volunteerForm.name,
                last_name: '',
                phone: volunteerForm.phone,
                role: 'volunteer',
                access_scope_id: locationVillage.id
            });
            setShowVolunteerModal(false);
            setVolunteerForm({ name: '', phone: '', assigned_village_id: '', password: '' });
            await loadInitialData();
        } catch (err) {
            alert("ভলান্টিয়ার নিয়োগে সমস্যা হয়েছে");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-teal-600" size={32} />
                <p className="text-slate-500 font-bold">ডাটা লোড হচ্ছে...</p>
            </div>
        );
    }

    if (isAssignedVillageMode && !selectedVillage?.id) {
        return (
            <div className="rounded-[32px] border border-amber-100 bg-amber-50 p-8 text-center">
                <AlertCircle className="text-amber-600 mx-auto mb-4" size={32} />
                <h4 className="text-lg font-black text-slate-800">ভলান্টিয়ারের গ্রাম লোড হয়নি</h4>
                <p className="text-sm font-bold text-slate-500 mt-2">
                    এই অ্যাকাউন্টে যে গ্রাম অ্যাসাইন করা আছে, সেটি হাউসহোল্ড সিস্টেমে পাওয়া যায়নি। মেম্বার প্যানেল থেকে গ্রাম ও ভলান্টিয়ার অ্যাসাইনমেন্ট চেক করুন।
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-[28px] bg-white border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mb-3">
                        <Home size={20} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মোট বাড়ি</p>
                    <p className="text-2xl font-black text-slate-800">{toBnDigits(stats.total_houses.toString())}</p>
                </div>
                <div className="p-6 rounded-[28px] bg-white border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                        <Users size={20} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মোট জনসংখ্যা</p>
                    <p className="text-2xl font-black text-slate-800">{toBnDigits(stats.total_members.toString())}</p>
                </div>
                <div className="p-6 rounded-[28px] bg-white border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
                        <UserCheck size={20} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মোট ভোটার</p>
                    <p className="text-2xl font-black text-slate-800">{toBnDigits(stats.voters.toString())}</p>
                </div>
                <div className="p-6 rounded-[28px] bg-white border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 mb-3">
                        <Users size={20} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">নারী / পুরুষ</p>
                    <p className="text-lg font-black text-slate-800">
                        {toBnDigits(stats.females.toString())} / {toBnDigits(stats.males.toString())}
                    </p>
                </div>
            </div>

            {/* View Switcher */}
            {!isAssignedVillageMode && (
            <div className="flex p-1.5 bg-slate-100 rounded-[24px] w-fit">
                <button 
                    onClick={() => setActiveView('villages')}
                    className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${activeView === 'villages' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >গ্রাম ও বাড়ি</button>
                <button 
                    onClick={() => setActiveView('volunteers')}
                    className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${activeView === 'volunteers' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >ভলান্টিয়ারগণ</button>
            </div>
            )}

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                {activeView === 'villages' ? (
                    <motion.div 
                        key="villages" 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {/* Add Village Card */}
                        {!isAssignedVillageMode && (
                        <div 
                            onClick={() => setShowVillageModal(true)}
                            className="p-8 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center group hover:border-teal-400 transition-all cursor-pointer bg-slate-50/50 hover:bg-teal-50/30"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-teal-600 group-hover:border-teal-200 transition-all mb-4">
                                <Plus size={24} />
                            </div>
                            <h4 className="font-black text-slate-800">নতুন গ্রাম যোগ করুন</h4>
                            <p className="text-xs font-bold text-slate-400 mt-1">ওয়ার্ডের হায়ারার্কি ঠিক করতে</p>
                        </div>
                        )}

                        {villages.map(village => (
                            <div 
                                key={village.id}
                                className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-100 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-teal-600 group-hover:text-white transition-all">
                                        <MapPin size={24} />
                                    </div>
                                    <button className="text-slate-400 hover:text-teal-600 p-2">
                                        <Edit3 size={18} />
                                    </button>
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">{village.bn_name || village.name}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{village.para_name || 'মূল গ্রাম'}</p>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 font-bold">এন্ট্রি সম্পন্ন</span>
                                        <span className="text-slate-800 font-black">{toBnDigits('0')} / {toBnDigits(village.total_estimated_houses?.toString() || '0')}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="w-0 h-full bg-teal-500" />
                                    </div>
                                </div>

                                <button 
                                    onClick={() => {
                                        setSelectedVillage(village);
                                        setActiveView('houses');
                                    }}
                                    className="w-full mt-8 py-4 rounded-2xl bg-slate-50 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    বাড়ি ও সদস্য তালিকা <ChevronRight size={16} />
                                </button>
                            </div>
                        ))}
                    </motion.div>
                ) : activeView === 'volunteers' ? (
                    <motion.div 
                        key="volunteers"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-black text-slate-800">নিযুক্ত ভলান্টিয়ারগণ</h3>
                            <button 
                                onClick={() => setShowVolunteerModal(true)}
                                className="px-6 py-3 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center gap-2 shadow-xl"
                            >
                                <Plus size={16} /> নতুন নিয়োগ
                            </button>
                        </div>

                        <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">ভলান্টিয়ার নাম</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">নিযুক্ত গ্রাম</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">মোবাইল</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">স্ট্যাটাস</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">অ্যাকশন</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {volunteers.map(vol => (
                                        <tr key={vol.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-black">
                                                        {vol.name.charAt(0)}
                                                    </div>
                                                    <p className="font-black text-slate-800">{vol.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                                                    {vol.assigned_village?.name || 'অ্যাসাইন করা হয়নি'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 font-bold text-slate-600">{toBnDigits(vol.phone)}</td>
                                            <td className="px-8 py-6">
                                                <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> অ্যাক্টিভ
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {volunteers.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold italic">কোনো ভলান্টিয়ার পাওয়া যায়নি।</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="village-details"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        {/* Village Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {!isAssignedVillageMode && (
                                    <button
                                        onClick={() => {
                                            setSelectedVillage(null);
                                            setActiveView('villages');
                                        }}
                                        className="p-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                )}
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800">{selectedVillage.bn_name || selectedVillage.name}</h3>
                                    <p className="text-sm font-bold text-slate-400">{selectedVillage.para_name || 'মূল গ্রাম'} এর ডাটা ম্যানেজমেন্ট</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                                    <Filter size={16} /> ফিল্টার
                                </button>
                                <button 
                                    onClick={() => setShowHouseModal(true)}
                                    className="px-6 py-3 rounded-xl bg-teal-600 text-white font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all flex items-center gap-2 shadow-lg shadow-teal-100"
                                >
                                    <Plus size={16} /> নতুন বাড়ি যোগ
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Left: House List */}
                            <div className="lg:col-span-7 space-y-4">
                                <div className="bg-white rounded-[32px] border border-slate-100 p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="font-black text-slate-800">বাড়ির তালিকা</h4>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input 
                                                className="pl-11 pr-6 py-2.5 rounded-xl bg-slate-50 border-none text-sm font-bold w-64"
                                                placeholder="মালিকের নাম বা আইডি..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {households.length === 0 ? (
                                            <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-[24px]">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Home className="text-slate-200" size={32} />
                                                </div>
                                                <p className="text-slate-400 font-bold">এই গ্রামে এখনও কোনো বাড়ি যোগ করা হয়নি</p>
                                                <p className="text-xs text-slate-300 mt-2 italic">ভলান্টিয়ার বা মেম্বার আইডি দিয়ে বাড়ি যোগ করা শুরু করুন</p>
                                            </div>
                                        ) : (
                                            households.map((house, idx) => (
                                                <div key={house.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-teal-200 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-teal-600 group-hover:border-teal-200 transition-all">
                                                            <Home size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-800 text-sm">{house.owner_name}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">হোল্ডিং: {house.house_no || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            <p className="text-xs font-black text-slate-800">{toBnDigits((house.stats?.total_members || 0).toString())} সদস্য</p>
                                                            <p className="text-[10px] font-bold text-slate-400">{toBnDigits((house.stats?.voters || 0).toString())} ভোটার</p>
                                                        </div>
                                                        <ChevronRight size={16} className="text-slate-300" />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Visual Map/Para View */}
                            <div className="lg:col-span-5 space-y-6">
                                <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <MapIcon size={120} />
                                    </div>
                                    <h4 className="text-xl font-black mb-2 flex items-center gap-2">
                                        <MapIcon size={20} className="text-teal-400" />
                                        স্মার্ট ভিলেজ ম্যাপ
                                    </h4>
                                    <p className="text-sm text-slate-400 mb-8 font-bold leading-relaxed">
                                        গ্রামের ম্যাপে পিন দেখে সহজেই বুঝতে পারবেন কোন এলাকাগুলোতে ডাটা এন্ট্রি বাকি আছে। 
                                    </p>

                                    {/* Map Simulation Box */}
                                    <div className="aspect-square bg-slate-800/50 rounded-2xl border border-white/10 relative overflow-hidden group">
                                        <div className="absolute inset-0 flex items-center justify-center text-center p-8">
                                            <div className="space-y-4">
                                                <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto border border-teal-500/30">
                                                    <Loader2 className="animate-spin text-teal-400" size={24} />
                                                </div>
                                                <p className="text-xs font-black text-teal-400 uppercase tracking-widest">ম্যাপ লোড হচ্ছে...</p>
                                                <p className="text-[10px] text-slate-500 font-bold max-w-[200px] mx-auto">
                                                    ভলান্টিয়ার যখন বাড়ি এন্ট্রি করবেন, তখন জিপিএস লোকেশন অনুযায়ী এখানে পিন দেখা যাবে।
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Grid Decoration */}
                                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                                    </div>

                                    <div className="mt-8 grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] font-black uppercase text-slate-400">এন্ট্রি কমপ্লিট</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-slate-600" />
                                            <span className="text-[10px] font-black uppercase text-slate-400">বাকি আছে</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-[32px] border border-slate-100 p-8">
                                    <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                                        <Info size={18} className="text-teal-600" />
                                        তথ্য সংশোধন
                                    </h4>
                                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold leading-relaxed">
                                        কোনো বাড়ির তথ্য ভুল থাকলে মেম্বার বা ইউনিয়ন সচিব সরাসরি এখান থেকে তা এডিট করে সঠিক তথ্য নিশ্চিত করতে পারবেন। 
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Village Modal */}
            {showVillageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[40px] p-10 w-full max-w-xl shadow-2xl relative"
                    >
                        <button onClick={() => setShowVillageModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600">
                            <Plus className="rotate-45" size={24} />
                        </button>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">নতুন গ্রাম যোগ করুন</h3>
                        <p className="text-sm font-bold text-slate-400 mb-8">আপনার ওয়ার্ডের আওতাধীন একটি গ্রামের তথ্য দিন</p>
                        
                        <form onSubmit={handleAddVillage} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">গ্রামের নাম (বাংলা)</label>
                                    <input 
                                        required
                                        value={villageForm.bn_name}
                                        onChange={(e) => setVillageForm({...villageForm, bn_name: e.target.value})}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                                        placeholder="উদা: নওহাটা"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Village Name (English)</label>
                                    <input 
                                        required
                                        value={villageForm.name}
                                        onChange={(e) => setVillageForm({...villageForm, name: e.target.value})}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                                        placeholder="e.g. Nowhata"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">পাড়া/মহল্লার নাম</label>
                                <input 
                                    value={villageForm.para_name}
                                    onChange={(e) => setVillageForm({...villageForm, para_name: e.target.value})}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                                    placeholder="উদা: মুন্সি পাড়া"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">আনুমানিক বাড়ি সংখ্যা</label>
                                <input 
                                    type="number"
                                    value={villageForm.total_estimated_houses}
                                    onChange={(e) => setVillageForm({...villageForm, total_estimated_houses: e.target.value})}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                                    placeholder="উদা: ১৫০"
                                />
                            </div>
                            <button 
                                disabled={saving}
                                className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                গ্রাম সেভ করুন
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Volunteer Modal */}
            {showVolunteerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[40px] p-10 w-full max-w-xl shadow-2xl relative"
                    >
                        <button onClick={() => setShowVolunteerModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600">
                            <Plus className="rotate-45" size={24} />
                        </button>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">নতুন ভলান্টিয়ার নিয়োগ</h3>
                        <p className="text-sm font-bold text-slate-400 mb-8">মাঠ পর্যায়ে ডাটা সংগ্রহের জন্য ভলান্টিয়ার অ্যাকাউন্ট তৈরি করুন</p>
                        
                        <form onSubmit={handleAddVolunteer} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">পূর্ণ নাম</label>
                                <input 
                                    required
                                    value={volunteerForm.name}
                                    onChange={(e) => setVolunteerForm({...volunteerForm, name: e.target.value})}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                                    placeholder="উদা: মোঃ আব্দুর রহিম"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">মোবাইল নম্বর</label>
                                    <input 
                                        required
                                        value={volunteerForm.phone}
                                        onChange={(e) => setVolunteerForm({...volunteerForm, phone: e.target.value})}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                                        placeholder="017XXXXXXXX"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">লগইন পাসওয়ার্ড</label>
                                    <input 
                                        required
                                        type="password"
                                        value={volunteerForm.password}
                                        onChange={(e) => setVolunteerForm({...volunteerForm, password: e.target.value})}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                                        placeholder="******"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">অ্যাসাইন করা গ্রাম</label>
                                <select 
                                    required
                                    value={volunteerForm.assigned_village_id}
                                    onChange={(e) => setVolunteerForm({...volunteerForm, assigned_village_id: e.target.value})}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold appearance-none"
                                >
                                    <option value="">গ্রাম নির্বাচন করুন</option>
                                    {villages.map(v => (
                                        <option key={v.id} value={v.id}>{v.bn_name || v.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                disabled={saving}
                                className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : <UserCheck size={20} />}
                                নিয়োগ নিশ্চিত করুন
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Household Entry Modal */}
            {showHouseModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <HouseholdEntryForm 
                            wardId={wardId}
                            villageId={selectedVillage.id}
                            onSuccess={() => {
                                setShowHouseModal(false);
                                loadInitialData();
                            }}
                            onCancel={() => setShowHouseModal(false)}
                        />
                    </motion.div>
                </div>
            )}
        </div>
    );
}

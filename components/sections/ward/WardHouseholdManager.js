'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Home, Users, MapPin, UserCheck, Plus, Search, 
    ChevronRight, ChevronLeft, Save, Trash2, Edit3, CheckCircle2, CheckCircle, AlertCircle, Loader2,
    ArrowLeft, ArrowRight, Map as MapIcon, Info, Filter, X, Shield, Hash
} from 'lucide-react';
import { householdService } from '@/lib/services/householdService';
import { adminService } from '@/lib/services/adminService';
import { toBnDigits } from '@/lib/utils/format';
import HouseholdEntryForm from './HouseholdEntryForm';
import HouseholdLockerManager from './HouseholdLockerManager';
import ModalPortal from '@/components/common/ModalPortal';
import toast from 'react-hot-toast';

const inputStyles = "w-full px-5 py-4 rounded-[20px] bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-700 text-sm";
const labelStyles = "text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1.5 block";

export default function WardHouseholdManager({ wardId, assignedVillage = null, volunteerMode = false }) {
    const { user } = useSelector((state) => state.auth);
    const isAssignedVillageMode = volunteerMode || Boolean(assignedVillage?.id);
    const [villages, setVillages] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [households, setHouseholds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const ITEMS_PER_PAGE = 24;
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState(isAssignedVillageMode ? 'houses' : 'villages');
    const [selectedVillage, setSelectedVillage] = useState(assignedVillage);
    const [stats, setStats] = useState({ total_members: 0, voters: 0, males: 0, females: 0, total_houses: 0 });
    
    // Modal states
    const [showVillageModal, setShowVillageModal] = useState(false);
    const [showVolunteerModal, setShowVolunteerModal] = useState(false);
    const [showHouseModal, setShowHouseModal] = useState(false);
    const [villageForm, setVillageForm] = useState({ name: '', bn_name: '', para_name: '', total_estimated_houses: '' });
    const [volunteerForm, setVolunteerForm] = useState({ name: '', phone: '', assigned_village_id: '', password: '' });
    const [editingHousehold, setEditingHousehold] = useState(null);
    const [selectedHouseholdForLocker, setSelectedHouseholdForLocker] = useState(null);
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

            if (selectedVillage) {
                const hData = await householdService.getHouseholdsByVillage(selectedVillage.id);
                setHouseholds(hData);
                
                // Calculate and show village-specific stats instead of ward stats
                const vStats = hData.reduce((acc, h) => {
                    const s = h.stats || {};
                    return {
                        total_members: acc.total_members + (s.total_members || 0),
                        voters: acc.voters + (s.voters || 0),
                        males: acc.males + (s.males || 0),
                        females: acc.females + (s.females || 0),
                        total_houses: acc.total_houses + 1
                    };
                }, { total_members: 0, voters: 0, males: 0, females: 0, total_houses: 0 });
                setStats(vStats);
            } else {
                setStats(sData);
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
        if (!isAssignedVillageMode || !assignedVillage) return;
        
        async function resolveVillage() {
            try {
                // If the village is from the location hierarchy, it needs to be resolved/synced 
                // to the household system's village table
                if (assignedVillage.type === 'village' || !assignedVillage.bn_name) {
                    const resolved = await householdService.getOrCreateVillageForLocation(wardId, assignedVillage);
                    if (resolved) {
                        setSelectedVillage(resolved);
                    } else {
                        setSelectedVillage(assignedVillage);
                    }
                } else {
                    setSelectedVillage(assignedVillage);
                }
                setActiveView('houses');
            } catch (err) {
                console.error("Failed to resolve village:", err);
                setSelectedVillage(assignedVillage);
                setActiveView('houses');
            }
        }
        
        resolveVillage();
    }, [assignedVillage, isAssignedVillageMode, wardId]);

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
            toast.success("গ্রাম সফলভাবে যোগ করা হয়েছে।");
        } catch (err) {
            toast.error("গ্রাম যোগ করতে সমস্যা হয়েছে।");
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
            toast.success("ভলান্টিয়ার নিয়োগ সম্পন্ন হয়েছে।");
        } catch (err) {
            toast.error("ভলান্টিয়ার নিয়োগে সমস্যা হয়েছে");
        } finally {
            setSaving(false);
        }
    }

    const handleDeleteHousehold = async (e, id) => {
        e.stopPropagation();
        if (!confirm('আপনি কি সত্যিই এই বাড়িটি ডিলিট করতে চান? এর ভেতরের সকল সদস্যদের ডাটাও ডিলিট হয়ে যাবে।')) return;
        
        try {
            await householdService.deleteHousehold(id);
            setHouseholds(households.filter(h => h.id !== id));
            
            // Recalculate stats for UI optimism
            const newHouseholds = households.filter(h => h.id !== id);
            const newStats = newHouseholds.reduce((acc, h) => {
                const s = h.stats || {};
                return {
                    total_members: acc.total_members + (s.total_members || 0),
                    voters: acc.voters + (s.voters || 0),
                    males: acc.males + (s.males || 0),
                    females: acc.females + (s.females || 0),
                    total_houses: acc.total_houses + 1
                };
            }, { total_members: 0, voters: 0, males: 0, females: 0, total_houses: 0 });
            setStats(newStats);
            toast.success("বাড়িটি ডিলিট করা হয়েছে।");
        } catch (err) {
            toast.error('বাড়িটি ডিলিট করতে সমস্যা হয়েছে।');
        }
    };

    const handleEditHousehold = async (e, house) => {
        e.stopPropagation();
        try {
            // Fetch residents for this household
            const { supabase } = await import('@/lib/utils/supabase');
            const { data: residents } = await supabase
                .from('residents')
                .select('*')
                .eq('household_id', house.id)
                .order('created_at', { ascending: true });

            setEditingHousehold({
                ...house,
                residents: residents || []
            });
            setShowHouseModal(true);
        } catch (err) {
            toast.error('বাড়ির তথ্য লোড করতে সমস্যা হয়েছে।');
        }
    };

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
                        {!isAssignedVillageMode && (user?.role === 'super_admin' || user?.role === 'ward_member') && (
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
                            {(user?.role === 'super_admin' || user?.role === 'ward_member') && (
                                <button 
                                    onClick={() => setShowVolunteerModal(true)}
                                    className="px-6 py-3 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center gap-2 shadow-xl"
                                >
                                    <Plus size={16} /> নতুন নিয়োগ
                                </button>
                            )}
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
                                {(() => {
                                    const isSuperAdmin = user?.role === 'super_admin';
                                    const isMyWard = user?.role === 'ward_member' && wardId === user.access_scope_id;
                                    const isMyVillage = user?.role === 'volunteer' && (
                                        selectedVillage?.id === assignedVillage?.id || selectedVillage?.id === user.access_scope_id
                                    );
                                    
                                    if (isSuperAdmin || isMyWard || isMyVillage) {
                                        return (
                                            <button 
                                                onClick={() => {
                                                    setEditingHousehold(null);
                                                    setShowHouseModal(true);
                                                }}
                                                className="px-6 py-3 rounded-xl bg-teal-600 text-white font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all flex items-center gap-2 shadow-lg shadow-teal-100"
                                            >
                                                <Plus size={16} /> নতুন বাড়ি যোগ
                                            </button>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>

                        <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <h4 className="font-black text-slate-800 text-xl flex items-center gap-2">
                                    <Home className="text-teal-500" size={24} />
                                    বাড়ির তালিকা
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full ml-2">সর্বমোট: {households.length}টি</span>
                                </h4>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1); // Reset to first page on search
                                        }}
                                        className="pl-11 pr-6 py-3 rounded-[16px] bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-300 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-sm font-bold w-full md:w-80"
                                        placeholder="মালিকের নাম বা আইডি খুঁজুন..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                {(() => {
                                    const filtered = households.filter(h => {
                                        const query = searchQuery.toLowerCase();
                                        const matchesOwner = h.owner_name?.toLowerCase().includes(query);
                                        const matchesHouse = h.house_no?.toLowerCase().includes(query);
                                        const matchesResidents = h.residents?.some(r => 
                                            r.name?.toLowerCase().includes(query) || 
                                            r.nid?.toLowerCase().includes(query) ||
                                            r.id?.toString().toLowerCase().includes(query)
                                        );
                                        return matchesOwner || matchesHouse || matchesResidents;
                                    });
                                    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
                                    const currentHouses = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

                                    return (
                                        <>
                                            {filtered.length === 0 ? (
                                                <div className="p-16 text-center border-2 border-dashed border-slate-100 rounded-[32px]">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                                                        <Home className="text-slate-200" size={40} />
                                                    </div>
                                                    <p className="text-lg text-slate-400 font-black">কোনো বাড়ি পাওয়া যায়নি</p>
                                                    <p className="text-sm text-slate-300 mt-2 italic font-bold">ভলান্টিয়ার বা মেম্বার আইডি দিয়ে নতুন বাড়ি যোগ করা শুরু করুন</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                                    {currentHouses.map((house) => (
                                                        <div 
                                                            key={house.id} 
                                                            onClick={() => setSelectedHouseholdForLocker(house)} 
                                                            className="relative group cursor-pointer"
                                                        >
                                                            {/* Balanced Visibility Household Card */}
                                                            <div className="bg-white border border-slate-200/60 rounded-[32px] p-4 sm:p-5 hover:bg-slate-50 hover:border-teal-400 hover:shadow-xl hover:shadow-teal-900/5 transition-all flex flex-col h-full relative z-10 group">
                                                                
                                                                {/* Decorative Glow */}
                                                                <div className="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none">
                                                                    <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-teal-500/10 transition-all" />
                                                                </div>

                                                                {/* House Header */}
                                                                <div className="flex items-center justify-between mb-4 relative z-10">
                                                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 group-hover:bg-teal-500 group-hover:text-white transition-all shadow-inner relative">
                                                                        <Home size={20} className="sm:size-[22px]" strokeWidth={2} />
                                                                        {/* Member Count Badge on Corner */}
                                                                        <div className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 sm:w-5 sm:h-5 bg-slate-800 group-hover:bg-teal-600 transition-colors rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] sm:text-[9px] font-black shadow-sm">
                                                                            {toBnDigits((house.stats?.total_members || 0).toString())}
                                                                        </div>
                                                                    </div>
                                                                    {(house.locker_pin || house.locker_pin_hash) && (
                                                                        <div className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[8px] sm:text-[9px] font-black border border-emerald-100 flex items-center gap-1">
                                                                            <Shield size={8} className="sm:size-[9px]" />
                                                                            সুরক্ষিত
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Primary Info */}
                                                                <div className="relative z-10 mb-4">
                                                                    <h4 className="font-black text-slate-800 text-sm sm:text-base leading-tight mb-2 group-hover:text-teal-950 transition-colors truncate">
                                                                        {house.owner_name}
                                                                    </h4>
                                                                    <div className="flex">
                                                                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black text-slate-500 bg-slate-50 px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl border border-slate-100 group-hover:border-teal-100 group-hover:bg-white group-hover:text-teal-600 transition-all">
                                                                            <Hash size={10} strokeWidth={3} className="text-slate-400 group-hover:text-teal-400" />
                                                                            {house.house_no ? house.house_no : 'হোল্ডিং নেই'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Action Buttons (At Bottom, visible on hover) */}
                                                                {(() => {
                                                                    const myVillageId = assignedVillage?.id;
                                                                    const isSuperAdmin = user?.role === 'super_admin';
                                                                    const isMyWard = user?.role === 'ward_member' && house.ward_id === user.access_scope_id;
                                                                    const isMyVillage = user?.role === 'volunteer' && (
                                                                        house.village_id === myVillageId || house.village_id === user.access_scope_id
                                                                    );
                                                                    const canEdit = isSuperAdmin || isMyWard || isMyVillage;
                                                                    if (!canEdit) return null;

                                                                    return (
                                                                        <div className="mt-auto pt-3 border-t border-slate-100/50 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                                                            <button
                                                                                onClick={(e) => handleEditHousehold(e, house)}
                                                                                className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
                                                                                title="সম্পাদনা"
                                                                            >
                                                                                <Edit3 size={14} strokeWidth={2.5} />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => handleDeleteHousehold(e, house.id)}
                                                                                className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
                                                                                title="মুছে ফেলুন"
                                                                            >
                                                                                <Trash2 size={14} strokeWidth={2.5} />
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Pagination */}
                                            {totalPages > 1 && (
                                                <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-8">
                                                    <p className="text-xs font-bold text-slate-400 hidden sm:block">
                                                        দেখানো হচ্ছে {((currentPage - 1) * ITEMS_PER_PAGE) + 1} থেকে {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} (মোট: {filtered.length})
                                                    </p>
                                                    <div className="flex items-center gap-2 mx-auto sm:mx-0">
                                                        <button 
                                                            disabled={currentPage === 1}
                                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                            className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:bg-white hover:border-teal-300 disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:border-slate-100 transition-all"
                                                        >
                                                            <ChevronLeft size={18} />
                                                        </button>
                                                        
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                                            // Simple pagination window logic
                                                            if (
                                                                page === 1 || 
                                                                page === totalPages || 
                                                                (page >= currentPage - 1 && page <= currentPage + 1)
                                                            ) {
                                                                return (
                                                                    <button 
                                                                        key={page}
                                                                        onClick={() => setCurrentPage(page)}
                                                                        className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${
                                                                            currentPage === page 
                                                                            ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' 
                                                                            : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-white hover:border-teal-300'
                                                                        }`}
                                                                    >
                                                                        {page}
                                                                    </button>
                                                                );
                                                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                                return <span key={page} className="text-slate-400">...</span>;
                                                            }
                                                            return null;
                                                        })}

                                                        <button 
                                                            disabled={currentPage === totalPages}
                                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                            className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:bg-white hover:border-teal-300 disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:border-slate-100 transition-all"
                                                        >
                                                            <ChevronRight size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Village Modal */}
            {showVillageModal && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowVillageModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[40px] p-8 md:p-10 w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <button onClick={() => setShowVillageModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                                <X size={20} />
                            </button>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">নতুন গ্রাম যোগ করুন</h3>
                            <p className="text-sm font-bold text-slate-400 mb-8">আপনার ওয়ার্ডের আওতাধীন একটি গ্রামের তথ্য দিন</p>
                            
                            <form onSubmit={handleAddVillage} className="space-y-6">
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className={labelStyles}>গ্রামের নাম (বাংলা)</label>
                                        <input 
                                            required
                                            value={villageForm.bn_name}
                                            onChange={(e) => setVillageForm({...villageForm, bn_name: e.target.value})}
                                            className={inputStyles}
                                            placeholder="উদা: নওহাটা"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelStyles}>Village Name (English)</label>
                                        <input 
                                            required
                                            value={villageForm.name}
                                            onChange={(e) => setVillageForm({...villageForm, name: e.target.value})}
                                            className={inputStyles}
                                            placeholder="e.g. Nowhata"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelStyles}>পাড়া/মহল্লার নাম</label>
                                    <input 
                                        value={villageForm.para_name}
                                        onChange={(e) => setVillageForm({...villageForm, para_name: e.target.value})}
                                        className={inputStyles}
                                        placeholder="উদা: মুন্সি পাড়া"
                                    />
                                </div>
                                <div>
                                    <label className={labelStyles}>আনুমানিক বাড়ি সংখ্যা</label>
                                    <input 
                                        type="number"
                                        value={villageForm.total_estimated_houses}
                                        onChange={(e) => setVillageForm({...villageForm, total_estimated_houses: e.target.value})}
                                        className={inputStyles}
                                        placeholder="উদা: ১৫০"
                                    />
                                </div>
                                <button 
                                    disabled={saving}
                                    className="w-full py-5 rounded-[20px] bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-teal-500/30 mt-4"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    গ্রাম সেভ করুন
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </ModalPortal>
            )}

            {/* Volunteer Modal */}
            {showVolunteerModal && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowVolunteerModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[40px] p-8 md:p-10 w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <button onClick={() => setShowVolunteerModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                                <X size={20} />
                            </button>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">নতুন ভলান্টিয়ার নিয়োগ</h3>
                            <p className="text-sm font-bold text-slate-400 mb-8">মাঠ পর্যায়ে ডাটা সংগ্রহের জন্য ভলান্টিয়ার অ্যাকাউন্ট তৈরি করুন</p>
                            
                            <form onSubmit={handleAddVolunteer} className="space-y-6">
                                <div>
                                    <label className={labelStyles}>পূর্ণ নাম</label>
                                    <input 
                                        required
                                        value={volunteerForm.name}
                                        onChange={(e) => setVolunteerForm({...volunteerForm, name: e.target.value})}
                                        className={inputStyles}
                                        placeholder="উদা: মোঃ আব্দুর রহিম"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className={labelStyles}>মোবাইল নম্বর</label>
                                        <input 
                                            required
                                            value={volunteerForm.phone}
                                            onChange={(e) => setVolunteerForm({...volunteerForm, phone: e.target.value})}
                                            className={inputStyles}
                                            placeholder="017XXXXXXXX"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelStyles}>লগইন পাসওয়ার্ড</label>
                                        <input 
                                            required
                                            type="password"
                                            value={volunteerForm.password}
                                            onChange={(e) => setVolunteerForm({...volunteerForm, password: e.target.value})}
                                            className={inputStyles}
                                            placeholder="******"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelStyles}>অ্যাসাইন করা গ্রাম</label>
                                    <div className="relative">
                                        <select 
                                            required
                                            value={volunteerForm.assigned_village_id}
                                            onChange={(e) => setVolunteerForm({...volunteerForm, assigned_village_id: e.target.value})}
                                            className={inputStyles + " appearance-none"}
                                        >
                                            <option value="">গ্রাম নির্বাচন করুন</option>
                                            {villages.map(v => (
                                                <option key={v.id} value={v.id}>{v.bn_name || v.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button 
                                    disabled={saving}
                                    className="w-full py-5 rounded-[20px] bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-teal-500/30 disabled:opacity-50 mt-4"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : <UserCheck size={20} />}
                                    নিয়োগ নিশ্চিত করুন
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </ModalPortal>
            )}

            {/* Household Entry Modal */}
            {showHouseModal && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowHouseModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl flex items-center justify-center"
                        >
                            <HouseholdEntryForm 
                                wardId={wardId}
                                villageId={selectedVillage.id}
                                locationVillageId={assignedVillage?.id || selectedVillage?.location_id}
                                initialData={editingHousehold}
                                onSuccess={() => {
                                    setShowHouseModal(false);
                                    loadInitialData();
                                }}
                                onCancel={() => setShowHouseModal(false)}
                            />
                        </motion.div>
                    </div>
                </ModalPortal>
            )}
            {/* Household Locker Modal */}
            <AnimatePresence>
                {selectedHouseholdForLocker && (
                    <ModalPortal isOpen={!!selectedHouseholdForLocker} onClose={() => setSelectedHouseholdForLocker(null)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[40px] shadow-2xl relative z-[1001] w-full max-w-6xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 pb-4 flex items-center justify-between shrink-0 bg-slate-50 border-b border-slate-100">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">ডিজিটাল লকার ও হাউসহোল্ড তথ্য</h2>
                                    <p className="text-xs font-bold text-slate-400 mt-1">{selectedHouseholdForLocker.owner_name} এর প্রোফাইল ও ডকুমেন্টস</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedHouseholdForLocker(null)} 
                                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="p-8 pt-4 overflow-y-auto custom-scrollbar flex-1">
                                <HouseholdLockerManager 
                                    household={selectedHouseholdForLocker} 
                                    onUpdate={loadInitialData}
                                    onClose={() => setSelectedHouseholdForLocker(null)}
                                />
                            </div>
                        </motion.div>
                    </ModalPortal>
                )}
            </AnimatePresence>

        </div>
    );
}

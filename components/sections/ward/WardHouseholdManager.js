'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Home, Users, MapPin, UserCheck, Plus, Search, 
    ChevronRight, ChevronLeft, Save, Trash2, Edit3, CheckCircle2, CheckCircle, AlertCircle, Loader2,
    ArrowLeft, ArrowRight, Map as MapIcon, Info, Filter, X, Shield, Hash, Fingerprint, Baby, HeartPulse, Phone, HandHeart, GraduationCap,
    Clock3, FileText, WalletCards, Activity, Stethoscope, Smartphone, Navigation, MessageSquare
} from 'lucide-react';
import { householdService } from '@/lib/services/householdService';
import { adminService } from '@/lib/services/adminService';
import { smsService } from '@/lib/services/smsService';
import { toBnDigits } from '@/lib/utils/format';
import { parseBulkHouseholdNotebookText } from '@/lib/utils/householdNotebookParser';
import HouseholdEntryForm from './HouseholdEntryForm';
import HouseholdLockerManager from './HouseholdLockerManager';
import ModalPortal from '@/components/common/ModalPortal';
import toast from 'react-hot-toast';
import { canCreateHouseholdInScope, canManageHousehold } from '@/lib/utils/householdPermissions';

const inputStyles = "w-full px-5 py-4 rounded-[20px] bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-700 text-sm";
const labelStyles = "text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1.5 block";

export default function WardHouseholdManager({ wardId, assignedVillage = null, volunteerMode = false, initialHouseholdMode = 'all' }) {
    const { user } = useSelector((state) => state.auth);
    const isAssignedVillageMode = volunteerMode || Boolean(assignedVillage?.id);
    const [villages, setVillages] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [households, setHouseholds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [followUpFilter, setFollowUpFilter] = useState('all');
    const [householdMode, setHouseholdMode] = useState(initialHouseholdMode);
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
    const [sendingReminderKey, setSendingReminderKey] = useState(null);
    const [showBulkImportModal, setShowBulkImportModal] = useState(false);
    const [bulkImportText, setBulkImportText] = useState('');
    const [bulkDrafts, setBulkDrafts] = useState([]);
    const [bulkImporting, setBulkImporting] = useState(false);

    const followUpItems = useMemo(() => buildFamilyFollowUpItems(households), [households]);
    const priorityFamilies = useMemo(() => buildHouseholdPriorityCards(households, followUpItems), [households, followUpItems]);
    const villageProgress = useMemo(() => buildVillageProgress(selectedVillage, households, followUpItems), [selectedVillage, households, followUpItems]);
    const filteredFollowUps = useMemo(() => {
        if (followUpFilter === 'all') return followUpItems;
        return followUpItems.filter((item) => item.issueTypes.includes(followUpFilter));
    }, [followUpFilter, followUpItems]);
    const followUpSummary = useMemo(() => ({
        all: followUpItems.length,
        nid: followUpItems.filter((item) => item.issueTypes.includes('nid')).length,
        birth: followUpItems.filter((item) => item.issueTypes.includes('birth')).length,
        blood: followUpItems.filter((item) => item.issueTypes.includes('blood')).length,
        health: followUpItems.filter((item) => item.issueTypes.includes('health')).length,
        empty: followUpItems.filter((item) => item.issueTypes.includes('empty')).length,
        benefit: followUpItems.filter((item) => item.issueTypes.includes('benefit')).length
    }), [followUpItems]);
    const selectedLocationVillageId = user?.role === 'volunteer'
        ? user.access_scope_id
        : (selectedVillage?.location_village_id || selectedVillage?.location_id || selectedVillage?.locationId || null);
    const canCreateHousehold = canCreateHouseholdInScope(user, wardId, selectedLocationVillageId);

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
        setHouseholdMode(initialHouseholdMode);
    }, [initialHouseholdMode]);

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
        const targetHousehold = households.find((household) => household.id === id);
        if (!canManageHousehold(user, targetHousehold, assignedVillage || selectedVillage)) {
            toast.error('এই বাড়ির তথ্য সম্পাদনা/ডিলিট করার অনুমতি নেই।');
            return;
        }
        if (!confirm('আপনি কি সত্যিই এই বাড়িটি ডিলিট করতে চান? এর ভেতরের সকল সদস্যদের ডাটাও ডিলিট হয়ে যাবে।')) return;
        
        try {
            if (user?.role === 'super_admin') {
                await householdService.adminHouseholdAction('delete_household', { id });
            } else {
                await householdService.deleteHousehold(id);
            }
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
        if (!canManageHousehold(user, house, assignedVillage || selectedVillage)) {
            toast.error('এই বাড়ির তথ্য সম্পাদনা করার অনুমতি নেই।');
            return;
        }
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

    function handleBuildBulkDrafts() {
        if (!bulkImportText.trim()) {
            toast.error('খাতার লেখা paste করুন।');
            return;
        }

        const drafts = parseBulkHouseholdNotebookText(bulkImportText).map((draft) => ({
            ...draft,
            warnings: buildBulkDraftWarnings(draft, households)
        }));

        setBulkDrafts(drafts);
        if (!drafts.length) {
            toast.error('কোনো বাড়ির draft তৈরি হয়নি। format আবার check করুন।');
            return;
        }
        toast.success(`${toBnDigits(drafts.length)}টি বাড়ির draft ready.`);
    }

    async function handleSaveBulkDrafts() {
        if (!selectedVillage?.id || !canCreateHousehold) {
            toast.error('এই গ্রামে বাড়ি যোগ করার অনুমতি নেই।');
            return;
        }
        const validDrafts = bulkDrafts.filter((draft) => draft.household?.owner_name || draft.household?.house_no);
        if (!validDrafts.length) {
            toast.error('Save করার মতো valid draft নেই।');
            return;
        }

        setBulkImporting(true);
        const loadingToast = toast.loading(`${toBnDigits(validDrafts.length)}টি বাড়ি save হচ্ছে...`);
        let saved = 0;
        try {
            for (const draft of validDrafts) {
                const householdData = {
                    house_no: draft.household.house_no || null,
                    owner_name: draft.household.owner_name || 'নাম নেই',
                    phone: draft.household.phone || null,
                    religion: draft.household.religion || 'Islam',
                    housing_type: 'Semi-Paka',
                    economic_status: 'Middle',
                    water_source: 'tube-well',
                    electricity_meter: false,
                    ward_id: wardId,
                    village_id: selectedVillage.id,
                    location_village_id: selectedLocationVillageId || null,
                    added_by_user_id: user?.id || null
                };
                const createdHouse = await householdService.createHousehold(householdData);

                for (const resident of draft.residents || []) {
                    if (!resident.name) continue;
                    await householdService.createResident({
                        name: resident.name,
                        gender: resident.gender || 'Male',
                        is_voter: !!resident.is_voter,
                        relation_with_head: resident.relation_with_head || 'Other',
                        dob: resident.dob || null,
                        nid: resident.nid || null,
                        birth_reg_no: resident.birth_reg_no || null,
                        father_name: resident.father_name || null,
                        mother_name: resident.mother_name || null,
                        address: resident.address || draft.meta?.address || null,
                        blood_group: resident.blood_group || null,
                        occupation: resident.occupation || null,
                        education_level: resident.education_level || null,
                        marital_status: resident.marital_status || 'Married',
                        disability_status: resident.disability_status || 'None',
                        student_status: resident.student_status || 'not_student',
                        household_id: createdHouse.id
                    });
                }

                await householdService.syncHouseholdStats(createdHouse.id);
                saved += 1;
            }

            toast.dismiss(loadingToast);
            toast.success(`${toBnDigits(saved)}টি বাড়ি save হয়েছে।`);
            setShowBulkImportModal(false);
            setBulkImportText('');
            setBulkDrafts([]);
            await loadInitialData();
        } catch (err) {
            console.error('Bulk household import failed:', err);
            toast.dismiss(loadingToast);
            toast.error(err.message || 'Bulk import save করতে সমস্যা হয়েছে।');
        } finally {
            setBulkImporting(false);
        }
    }

    async function handleSendFollowUpSms(item) {
        if (!item?.phone) {
            toast.error('এই পরিবারের ফোন নম্বর নেই। আগে ফোন নম্বর আপডেট করুন।');
            return;
        }

        const message = buildFollowUpSmsMessage(item);
        try {
            setSendingReminderKey(item.key);
            await smsService.queueMessage({
                ownerType: 'location',
                ownerId: wardId,
                recipientPhone: item.phone,
                message,
                category: 'family_followup',
                sourceType: 'household_followup',
                sourceId: item.house.id
            });
            toast.success('Follow-up SMS queue করা হয়েছে।');
        } catch (err) {
            console.error('Failed to send family follow-up SMS:', err);
            toast.error(err.message || 'SMS পাঠানো যায়নি। Wallet balance/gateway check করুন।');
        } finally {
            setSendingReminderKey(null);
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
            <div className="rounded-[24px] sm:rounded-[32px] border border-amber-100 bg-amber-50 p-5 sm:p-8 text-center">
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
                            className="p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center group hover:border-teal-400 transition-all cursor-pointer bg-slate-50/50 hover:bg-teal-50/30"
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
                                className="p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-100 transition-all group"
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
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex min-w-0 items-center gap-4">
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
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <button className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                                    <Filter size={16} /> ফিল্টার
                                </button>
                                {(() => {
                                    if (canCreateHousehold) {
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
                                {canCreateHousehold && (
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkImportModal(true)}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 transition-all hover:bg-slate-950"
                                    >
                                        <FileText size={16} /> খাতা import
                                    </button>
                                )}
                            </div>
                        </div>

                        <section className="rounded-[32px] border border-teal-100 bg-white p-4 shadow-sm sm:p-6">
                            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-700">Village Progress</p>
                                    <h4 className="text-2xl font-black text-slate-900">গ্রামের কাজ কতদূর</h4>
                                    <p className="mt-1 text-sm font-bold text-slate-500">
                                        বাড়ি entry, member data quality, follow-up এবং priority family একসাথে।
                                    </p>
                                </div>
                                <span className={`w-fit rounded-full px-4 py-2 text-xs font-black ${villageProgress.completeness >= 80 ? 'bg-emerald-50 text-emerald-700' : villageProgress.completeness >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                                    {toBnDigits(villageProgress.completeness)}% data complete
                                </span>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {[
                                    ['Entry Progress', `${toBnDigits(villageProgress.houseCount)} / ${toBnDigits(villageProgress.estimatedHouses)}`, `${toBnDigits(villageProgress.entryPercent)}% বাড়ি entry`, Home, 'teal'],
                                    ['Members', toBnDigits(villageProgress.memberCount), `${toBnDigits(villageProgress.voterCount)} voter`, Users, 'blue'],
                                    ['Missing Data', toBnDigits(villageProgress.missingDataCount), 'NID/Birth/Blood follow-up', AlertCircle, 'amber'],
                                    ['Priority Family', toBnDigits(priorityFamilies.length), 'আজ আগে ধরবেন', Smartphone, 'rose']
                                ].map(([label, value, detail, Icon, tone]) => (
                                    <div key={label} className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                                        <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${
                                            tone === 'teal' ? 'bg-teal-50 text-teal-700' :
                                            tone === 'blue' ? 'bg-blue-50 text-blue-700' :
                                            tone === 'amber' ? 'bg-amber-50 text-amber-700' :
                                            'bg-rose-50 text-rose-700'
                                        }`}>
                                            <Icon size={20} />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                                        <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
                                        <p className="mt-1 text-xs font-bold text-slate-500">{detail}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${Math.min(100, villageProgress.entryPercent)}%` }} />
                            </div>
                        </section>

                        <div className="rounded-[30px] border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="grid gap-2 sm:grid-cols-3">
                                {[
                                    { id: 'all', label: 'সকল বাড়ি', hint: 'গ্রামভিত্তিক পূর্ণ তালিকা', Icon: Home },
                                    { id: 'priority', label: 'Priority List', hint: 'যে পরিবার আগে follow-up দরকার', Icon: AlertCircle },
                                    { id: 'field', label: 'Mobile Officer Mode', hint: 'মাঠে দ্রুত Call/SMS/Map/Update', Icon: Smartphone }
                                ].map((mode) => {
                                    const isActive = householdMode === mode.id;
                                    return (
                                        <button
                                            key={mode.id}
                                            type="button"
                                            onClick={() => setHouseholdMode(mode.id)}
                                            className={`flex items-center gap-3 rounded-[24px] border p-4 text-left transition-all ${
                                                isActive
                                                    ? 'border-teal-200 bg-slate-950 text-white shadow-lg shadow-slate-200'
                                                    : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-teal-200 hover:bg-teal-50'
                                            }`}
                                        >
                                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isActive ? 'bg-teal-500 text-white' : 'bg-white text-teal-600'}`}>
                                                <mode.Icon size={20} />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-sm font-black">{mode.label}</span>
                                                <span className={`mt-0.5 block text-[11px] font-bold ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{mode.hint}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {householdMode === 'field' && (
                            <section className="rounded-[32px] border border-teal-100 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-4 text-white shadow-xl shadow-teal-900/10 sm:p-6">
                                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-teal-300">Field Mode</p>
                                        <h4 className="text-2xl font-black">আজ মাঠে যাদের আগে ধরবেন</h4>
                                        <p className="mt-1 text-sm font-bold text-slate-300">Priority score অনুযায়ী পরিবার সাজানো। ফোনে use করার জন্য action button বড় রাখা হয়েছে।</p>
                                    </div>
                                    <span className="w-fit rounded-full bg-white/10 px-4 py-2 text-xs font-black text-teal-100">
                                        {toBnDigits(priorityFamilies.length)} পরিবার priority
                                    </span>
                                </div>
                                {priorityFamilies.length === 0 ? (
                                    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-sm font-bold text-teal-100">
                                        এই গ্রামে এখন বড় data gap নেই। নতুন বাড়ি/সদস্য এন্ট্রি করলে priority নিজে থেকে update হবে।
                                    </div>
                                ) : (
                                    <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                                        {priorityFamilies.slice(0, 12).map((family, index) => {
                                            const house = family.house;
                                            const phone = getHouseholdPhone(house);
                                            const mapHref = getHouseholdMapHref(house);
                                            const canUpdateHouse = canManageHousehold(user, house, assignedVillage || selectedVillage);
                                            return (
                                                <div key={house.id} className="rounded-[28px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                                                    <div className="mb-4 flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-200">#{toBnDigits(index + 1)} priority</p>
                                                            <h5 className="mt-1 truncate text-lg font-black">{house.owner_name || 'নাম নেই'}</h5>
                                                            <p className="text-xs font-bold text-slate-300">Holding: {house.house_no || 'নেই'} · সদস্য {toBnDigits(house.stats?.total_members || house.residents?.length || 0)}</p>
                                                        </div>
                                                        <span className="rounded-2xl bg-amber-400 px-3 py-2 text-lg font-black text-slate-950">{toBnDigits(family.score)}</span>
                                                    </div>
                                                    <div className="mb-4 flex flex-wrap gap-1.5">
                                                        {family.reasons.slice(0, 4).map((reason) => (
                                                            <span key={reason} className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black text-slate-100">
                                                                {reason}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button type="button" onClick={() => setSelectedHouseholdForLocker(house)} className="rounded-2xl bg-teal-400 px-3 py-3 text-xs font-black text-slate-950 transition hover:bg-white">
                                                            Open
                                                        </button>
                                                        {canUpdateHouse && (
                                                            <button type="button" onClick={(event) => handleEditHousehold(event, house)} className="rounded-2xl bg-white/10 px-3 py-3 text-xs font-black text-white transition hover:bg-white/20">
                                                                Update
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => family.followUps?.[0] && handleSendFollowUpSms(family.followUps[0])}
                                                            disabled={!family.followUps?.[0]?.phone || sendingReminderKey === family.followUps?.[0]?.key}
                                                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-3 py-3 text-xs font-black text-slate-950 transition hover:bg-amber-300 disabled:pointer-events-none disabled:bg-white/5 disabled:text-slate-500"
                                                        >
                                                            <MessageSquare size={14} /> SMS
                                                        </button>
                                                        <a href={phone ? `tel:${phone}` : undefined} aria-disabled={!phone} className={`inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-black transition ${phone ? 'bg-white text-slate-950 hover:bg-teal-100' : 'pointer-events-none bg-white/5 text-slate-500'}`}>
                                                            <Phone size={14} /> Call
                                                        </a>
                                                        <a href={mapHref || undefined} target="_blank" rel="noreferrer" aria-disabled={!mapHref} className={`inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-black transition ${mapHref ? 'bg-white/10 text-white hover:bg-white/20' : 'pointer-events-none bg-white/5 text-slate-500'}`}>
                                                            <Navigation size={14} /> Map
                                                        </a>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        )}

                        <section className="rounded-[32px] border border-amber-100 bg-amber-50/70 p-5 sm:p-6">
                            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">Family Follow-up Worklist</p>
                                    <h4 className="text-2xl font-black text-slate-900">যে পরিবারে তথ্য ঘাটতি আছে</h4>
                                    <p className="mt-1 text-sm font-bold text-amber-800/80">
                                        NID, জন্ম নিবন্ধন, রক্তের গ্রুপ বা সদস্যহীন বাড়ি দ্রুত follow-up করুন।
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        ['all', 'সব', followUpSummary.all],
                                        ['nid', 'NID নেই', followUpSummary.nid],
                                        ['birth', 'জন্ম নেই', followUpSummary.birth],
                                        ['blood', 'রক্ত নেই', followUpSummary.blood],
                                        ['health', 'স্বাস্থ্য', followUpSummary.health],
                                        ['empty', 'সদস্য নেই', followUpSummary.empty],
                                        ['benefit', 'ভাতা/সহায়তা', followUpSummary.benefit]
                                    ].map(([key, label, count]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setFollowUpFilter(key)}
                                            className={`rounded-full px-4 py-2 text-xs font-black transition ${
                                                followUpFilter === key
                                                    ? 'bg-slate-950 text-white'
                                                    : 'bg-white text-slate-600 hover:bg-amber-100'
                                            }`}
                                        >
                                            {label} · {toBnDigits(count || 0)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {filteredFollowUps.length === 0 ? (
                                <div className="rounded-3xl bg-white p-5 text-sm font-bold text-emerald-700">
                                    এই filter অনুযায়ী follow-up নেই। ডাটা ভালো আছে।
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {priorityFamilies.length > 0 && (
                                        <div className="grid gap-3 xl:grid-cols-4">
                                            {priorityFamilies.slice(0, 4).map((family) => (
                                                <button
                                                    key={family.house.id}
                                                    type="button"
                                                    onClick={() => setSelectedHouseholdForLocker(family.house)}
                                                    className="group rounded-[28px] border border-amber-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-xl hover:shadow-amber-100/60"
                                                >
                                                    <div className="mb-3 flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Priority score</p>
                                                            <h5 className="mt-1 text-lg font-black text-slate-950">{family.house.owner_name}</h5>
                                                            <p className="text-xs font-bold text-slate-400">Holding: {family.house.house_no || 'নেই'}</p>
                                                        </div>
                                                        <span className={`rounded-2xl px-3 py-2 text-lg font-black ${family.tone}`}>
                                                            {toBnDigits(family.score)}
                                                        </span>
                                                    </div>
                                                    <div className="mb-3 flex flex-wrap gap-1.5">
                                                        {family.reasons.slice(0, 3).map((reason) => (
                                                            <span key={reason} className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-600">
                                                                {reason}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className="space-y-2 border-t border-dashed border-slate-100 pt-3">
                                                        {family.timeline.slice(0, 3).map((event) => {
                                                            const EventIcon = event.Icon;
                                                            return (
                                                                <div key={event.key} className="flex items-start gap-2">
                                                                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-xl ${event.tone}`}>
                                                                        <EventIcon size={12} />
                                                                    </span>
                                                                    <div className="min-w-0">
                                                                        <p className="truncate text-xs font-black text-slate-800">{event.title}</p>
                                                                        <p className="text-[10px] font-bold text-slate-400">{event.meta}</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="grid gap-3 lg:grid-cols-2">
                                    {filteredFollowUps.slice(0, 8).map((item) => {
                                        const canUpdateHouse = canManageHousehold(user, item.house, assignedVillage || selectedVillage);
                                        return (
                                        <div key={item.key} className="rounded-3xl border border-amber-100 bg-white p-4 shadow-sm">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                                                            {item.issueTypes.includes('empty') ? <Home size={20} /> : <Users size={20} />}
                                                        </span>
                                                        <div>
                                                            <p className="text-base font-black text-slate-900">{item.house.owner_name}</p>
                                                            <p className="text-xs font-bold text-slate-400">Holding: {item.house.house_no || 'নেই'} · {item.residentName || 'পরিবার সদস্য যোগ দরকার'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {item.issues.map((issue) => (
                                                            <span key={issue.label} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black ${issue.tone}`}>
                                                                <issue.Icon size={12} />
                                                                {issue.label}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {item.phone && (
                                                        <p className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500">
                                                            <Phone size={13} />
                                                            {toBnDigits(item.phone)}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex shrink-0 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedHouseholdForLocker(item.house)}
                                                        className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-teal-600"
                                                    >
                                                        আবেদন/লকার
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSendFollowUpSms(item)}
                                                        disabled={!item.phone || sendingReminderKey === item.key}
                                                        className="rounded-2xl bg-teal-50 px-4 py-3 text-xs font-black text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {sendingReminderKey === item.key ? 'পাঠাচ্ছে...' : 'SMS'}
                                                    </button>
                                                    {canUpdateHouse && (
                                                    <button
                                                        type="button"
                                                        onClick={(event) => handleEditHousehold(event, item.house)}
                                                        className="rounded-2xl bg-amber-100 px-4 py-3 text-xs font-black text-amber-900 transition hover:bg-amber-200"
                                                    >
                                                        আপডেট
                                                    </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    })}
                                    </div>
                                </div>
                            )}
                            {filteredFollowUps.length > 8 && (
                                <p className="mt-4 text-center text-xs font-black text-amber-700">
                                    আরও {toBnDigits(filteredFollowUps.length - 8)}টি follow-up আছে। filter/search দিয়ে কাজ ভাগ করুন।
                                </p>
                            )}
                        </section>

                        <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 p-5 sm:p-8 shadow-sm">
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
                                        const matchesPhone = h.phone?.toLowerCase().includes(query);
                                        const matchesResidents = h.residents?.some(r => 
                                            r.name?.toLowerCase().includes(query) || 
                                            r.nid?.toLowerCase().includes(query) ||
                                            r.birth_reg_no?.toLowerCase().includes(query) ||
                                            r.phone?.toLowerCase().includes(query) ||
                                            r.id?.toString().toLowerCase().includes(query)
                                        );
                                        return matchesOwner || matchesHouse || matchesPhone || matchesResidents;
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
                                                                    const canEdit = canManageHousehold(user, house, assignedVillage || selectedVillage);
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
                    <div className="fixed inset-0 z-[99999] flex items-stretch justify-center p-0 sm:items-center sm:p-4">
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
                            className="relative h-[100dvh] w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-[40px] sm:p-8 md:p-10 custom-scrollbar"
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
                    <div className="fixed inset-0 z-[99999] flex items-stretch justify-center p-0 sm:items-center sm:p-4">
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
                            className="relative h-[100dvh] w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-[40px] sm:p-8 md:p-10 custom-scrollbar"
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
                    <div className="fixed inset-0 z-[99999] flex items-stretch justify-center overflow-hidden p-0 sm:items-center sm:p-4">
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
                            className="relative flex h-full min-h-0 w-full min-w-0 items-stretch justify-center sm:h-auto sm:max-w-4xl sm:items-center"
                        >
                            <HouseholdEntryForm 
                                wardId={wardId}
                                villageId={selectedVillage.id}
                                locationVillageId={selectedLocationVillageId}
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

            {showBulkImportModal && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[99999] flex items-stretch justify-center overflow-hidden p-0 sm:items-center sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowBulkImportModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 20 }}
                            className="relative flex h-[100dvh] max-h-[100dvh] w-full min-w-0 flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:max-w-5xl sm:rounded-[32px]"
                        >
                            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 p-4 sm:p-6">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-600">Bulk Khata Import</p>
                                    <h3 className="text-xl font-black text-slate-900 sm:text-2xl">একসাথে অনেক বাড়ি draft করুন</h3>
                                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                                        প্রতিটি বাড়ি আলাদা করতে --- বা “নতুন বাড়ি” লিখুন। Preview দেখে save করুন।
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowBulkImportModal(false)}
                                    className="shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition hover:text-rose-500"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
                                    <div className="space-y-3">
                                        <textarea
                                            value={bulkImportText}
                                            onChange={(event) => {
                                                setBulkImportText(event.target.value);
                                                setBulkDrafts([]);
                                            }}
                                            className="min-h-[420px] w-full rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                                            placeholder={`গ্রাম: পূর্বপাড়া
বাড়ি নং: ১২৩
পরিবার প্রধান: মোঃ আব্দুল করিম
মোবাইল: 017xxxxxxxx
সদস্য:
1. মোঃ আব্দুল করিম, বয়স: 55, পুরুষ, NID: 1234567890
2. রহিমা বেগম, বয়স: 48, নারী
---
গ্রাম: পূর্বপাড়া
বাড়ি নং: ১২৪
পরিবার প্রধান: মোঃ সুমন মিয়া
মোবাইল: 018xxxxxxxx`}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleBuildBulkDrafts}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-950"
                                        >
                                            <FileText size={16} />
                                            Draft বানান
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="rounded-[24px] border border-indigo-100 bg-indigo-50 p-4">
                                            <p className="text-sm font-black text-slate-900">Preview</p>
                                            <p className="mt-1 text-xs font-bold text-slate-500">
                                                {toBnDigits(bulkDrafts.length)}টি বাড়ি ready. Warning থাকলে আগে check করুন।
                                            </p>
                                        </div>
                                        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                                            {bulkDrafts.length === 0 ? (
                                                <div className="rounded-[24px] border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">
                                                    Draft বানালে এখানে preview দেখাবে।
                                                </div>
                                            ) : bulkDrafts.map((draft, index) => (
                                                <div key={draft.id} className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">#{toBnDigits(index + 1)} draft</p>
                                                            <h4 className="mt-1 truncate text-base font-black text-slate-900">{draft.household?.owner_name || 'নাম নেই'}</h4>
                                                            <p className="mt-1 text-xs font-bold text-slate-500">
                                                                Holding: {draft.household?.house_no || 'missing'} · Member: {toBnDigits(draft.residents?.length || 0)}
                                                            </p>
                                                        </div>
                                                        <span className="rounded-2xl bg-teal-50 px-3 py-2 text-xs font-black text-teal-700">
                                                            {draft.household?.phone || 'phone নেই'}
                                                        </span>
                                                    </div>
                                                    {draft.warnings?.length > 0 && (
                                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                                            {draft.warnings.map((warning) => (
                                                                <span key={warning} className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700">
                                                                    {warning}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-end sm:p-5">
                                <button
                                    type="button"
                                    onClick={() => setShowBulkImportModal(false)}
                                    className="rounded-2xl bg-slate-100 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition hover:bg-slate-200"
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveBulkDrafts}
                                    disabled={bulkImporting || bulkDrafts.length === 0}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {bulkImporting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save drafts
                                </button>
                            </div>
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
                            className="relative z-[1001] flex h-[100dvh] max-h-[100dvh] w-full min-w-0 flex-col overflow-hidden rounded-none border border-slate-100 bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-6xl sm:rounded-[40px]"
                        >
                            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 p-4 sm:items-center sm:p-8 sm:pb-4">
                                <div className="min-w-0">
                                    <h2 className="break-words text-xl font-black leading-tight text-slate-800 sm:text-2xl">ডিজিটাল লকার ও হাউসহোল্ড তথ্য</h2>
                                    <p className="mt-1 break-words text-xs font-bold text-slate-400">{selectedHouseholdForLocker.owner_name} এর প্রোফাইল ও ডকুমেন্টস</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedHouseholdForLocker(null)} 
                                    className="shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition-colors hover:text-rose-500"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3 sm:p-8 sm:pt-4">
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

function getHouseholdPhone(house) {
    return String(house?.phone || house?.owner_phone || '').replace(/[^\d+]/g, '');
}

function getHouseholdMapHref(house) {
    const lat = house?.lat ?? house?.latitude ?? house?.gps_lat;
    const lng = house?.lng ?? house?.longitude ?? house?.gps_lng;
    if (!lat || !lng) return '';
    return `https://www.google.com/maps?q=${lat},${lng}`;
}

function buildVillageProgress(village, households = [], followUpItems = []) {
    const estimatedHouses = Math.max(
        Number(village?.total_estimated_houses || 0),
        households.length,
        1
    );
    const houseCount = households.length;
    const entryPercent = Math.min(100, Math.round((houseCount / estimatedHouses) * 100));
    const memberCount = households.reduce((sum, house) => sum + (house.stats?.total_members || house.residents?.length || 0), 0);
    const voterCount = households.reduce((sum, house) => sum + (house.stats?.voters || 0), 0);
    const missingDataCount = followUpItems.filter((item) => (
        item.issueTypes.includes('nid') ||
        item.issueTypes.includes('birth') ||
        item.issueTypes.includes('blood') ||
        item.issueTypes.includes('empty')
    )).length;
    const completeness = memberCount > 0
        ? Math.max(0, Math.round(((memberCount * 3 - missingDataCount) / Math.max(1, memberCount * 3)) * 100))
        : (houseCount > 0 ? 35 : 0);

    return {
        estimatedHouses,
        houseCount,
        entryPercent,
        memberCount,
        voterCount,
        missingDataCount,
        completeness
    };
}

function buildBulkDraftWarnings(draft, existingHouseholds = []) {
    const warnings = [...(draft.meta?.warnings || [])];
    const houseNo = String(draft.household?.house_no || '').trim().toLowerCase();
    const phone = String(draft.household?.phone || '').replace(/\D/g, '');
    const draftNids = (draft.residents || []).map((resident) => String(resident.nid || '').replace(/\D/g, '')).filter(Boolean);

    if (houseNo && existingHouseholds.some((house) => String(house.house_no || '').trim().toLowerCase() === houseNo)) {
        warnings.push('Existing house/holding number matched.');
    }
    if (phone && existingHouseholds.some((house) => String(house.phone || '').replace(/\D/g, '') === phone)) {
        warnings.push('Existing phone number matched.');
    }

    const existingNids = new Set(
        existingHouseholds.flatMap((house) => house.residents || [])
            .map((resident) => String(resident.nid || '').replace(/\D/g, ''))
            .filter(Boolean)
    );
    draftNids.forEach((nid) => {
        if (existingNids.has(nid)) warnings.push(`Existing NID matched: ${nid}`);
    });

    return [...new Set(warnings)];
}

function getResidentAge(dob) {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
    return age;
}

function buildHouseholdPriorityCards(households = [], followUpItems = []) {
    const followUpsByHouse = followUpItems.reduce((acc, item) => {
        if (!item.house?.id) return acc;
        acc[item.house.id] = acc[item.house.id] || [];
        acc[item.house.id].push(item);
        return acc;
    }, {});

    return households.map((house) => {
        const followUps = followUpsByHouse[house.id] || [];
        const timeline = buildHouseholdTimeline(house, followUps);
        const openRequests = (house.service_requests || []).filter((request) => !['approved', 'completed', 'rejected', 'cancelled', 'closed'].includes(String(request.status || '').toLowerCase()));
        const dueTaxes = (house.household_taxes || []).filter((tax) => String(tax.status || '').toLowerCase() !== 'paid');
        const benefitCount = followUps.filter((item) => item.issueTypes.includes('benefit')).length;
        const healthCount = followUps.filter((item) => item.issueTypes.includes('health')).length;
        const dataGapCount = followUps.filter((item) => !item.issueTypes.includes('benefit') || item.issueTypes.length > 1).length;
        const emptyHousehold = (house.residents || []).length === 0;
        const score = Math.min(99, (benefitCount * 18) + (healthCount * 14) + (dataGapCount * 12) + (openRequests.length * 10) + (dueTaxes.length * 8) + (emptyHousehold ? 22 : 0));
        const reasons = [
            benefitCount > 0 ? `${toBnDigits(benefitCount)} সহায়তা সম্ভাবনা` : null,
            healthCount > 0 ? `${toBnDigits(healthCount)} স্বাস্থ্য follow-up` : null,
            dataGapCount > 0 ? `${toBnDigits(dataGapCount)} তথ্য ঘাটতি` : null,
            openRequests.length > 0 ? `${toBnDigits(openRequests.length)} আবেদন চলমান` : null,
            dueTaxes.length > 0 ? `${toBnDigits(dueTaxes.length)} ট্যাক্স pending` : null,
            emptyHousehold ? 'সদস্য যোগ দরকার' : null
        ].filter(Boolean);

        return {
            house,
            followUps,
            score,
            reasons,
            timeline,
            tone: score >= 60 ? 'bg-rose-50 text-rose-700' : score >= 30 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
        };
    })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);
}

function buildHouseholdTimeline(house, followUps = []) {
    const events = [];

    if (house.created_at) {
        events.push({
            key: `${house.id}-created`,
            date: house.created_at,
            title: 'Household profile created',
            meta: formatTimelineDate(house.created_at),
            Icon: Home,
            tone: 'bg-teal-50 text-teal-700'
        });
    }

    (house.service_requests || []).forEach((request) => {
        events.push({
            key: `request-${request.id}`,
            date: request.updated_at || request.created_at,
            title: `${request.title || request.request_type || 'Service request'} · ${request.status || 'pending'}`,
            meta: request.collection_date ? `Collection: ${formatTimelineDate(request.collection_date)}` : formatTimelineDate(request.created_at),
            Icon: FileText,
            tone: 'bg-sky-50 text-sky-700'
        });
    });

    (house.household_taxes || []).forEach((tax) => {
        events.push({
            key: `tax-${tax.id}`,
            date: tax.updated_at || tax.created_at || tax.due_date,
            title: `${tax.fiscal_year_label || tax.year || 'Tax'} · ${tax.status || 'due'}`,
            meta: tax.receipt_no ? `Receipt: ${tax.receipt_no}` : `Due: ${formatTimelineDate(tax.due_date)}`,
            Icon: WalletCards,
            tone: String(tax.status || '').toLowerCase() === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        });
    });

    followUps.slice(0, 4).forEach((item, index) => {
        events.push({
            key: `followup-${item.key}-${index}`,
            date: new Date().toISOString(),
            title: item.issues?.[0]?.label || 'Family follow-up',
            meta: item.residentName || 'পরিবার',
            Icon: Activity,
            tone: 'bg-violet-50 text-violet-700'
        });
    });

    return events
        .filter((event) => event.title)
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function formatTimelineDate(value) {
    if (!value) return 'তারিখ নেই';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return toBnDigits(date.toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric' }));
}

function buildFamilyFollowUpItems(households = []) {
    return households.flatMap((house) => {
        const residents = house.residents || [];
        if (residents.length === 0) {
            return [{
                key: `${house.id}-empty`,
                house,
                residentName: '',
                phone: house.phone,
                issueTypes: ['empty'],
                issues: [{
                    label: 'সদস্য নেই',
                    Icon: Home,
                    tone: 'bg-rose-50 text-rose-700'
                }]
            }];
        }

        return residents.map((resident) => {
            const age = getResidentAge(resident.dob);
            const issues = [];
            const issueTypes = [];

            if (age !== null && age >= 18 && !resident.nid) {
                issueTypes.push('nid');
                issues.push({
                    label: '১৮+ NID নেই',
                    Icon: Fingerprint,
                    tone: 'bg-amber-50 text-amber-700'
                });
            }

            if (!resident.birth_reg_no) {
                issueTypes.push('birth');
                issues.push({
                    label: 'জন্ম নিবন্ধন নেই',
                    Icon: Baby,
                    tone: 'bg-sky-50 text-sky-700'
                });
            }

            if (!resident.blood_group) {
                issueTypes.push('blood');
                issues.push({
                    label: 'রক্তের গ্রুপ নেই',
                    Icon: HeartPulse,
                    tone: 'bg-rose-50 text-rose-700'
                });
            }

            const healthIssues = detectHealthFollowUps(resident, age);
            if (healthIssues.length > 0) {
                issueTypes.push('health');
                issues.push(...healthIssues);
            }

            const benefitIssues = detectBenefitOpportunities(resident, house, age);
            if (benefitIssues.length > 0) {
                issueTypes.push('benefit');
                issues.push(...benefitIssues);
            }

            if (issues.length === 0) return null;

            return {
                key: `${house.id}-${resident.id}`,
                house,
                resident,
                residentName: resident.name || resident.bn_name,
                phone: resident.phone || house.phone,
                issueTypes,
                issues
            };
        }).filter(Boolean);
    });
}

function isFemale(value) {
    return ['female', 'নারী', 'মহিলা', 'woman'].includes(String(value || '').toLowerCase());
}

function isDisabled(value) {
    const normalized = String(value || '').toLowerCase();
    return normalized && !['none', 'no', 'না', 'নেই', 'n/a'].includes(normalized);
}

function isStudent(resident) {
    const text = `${resident.occupation || ''} ${resident.education_level || ''}`.toLowerCase();
    return text.includes('student') || text.includes('ছাত্র') || text.includes('শিক্ষার্থী');
}

function detectBenefitOpportunities(resident, house, age) {
    const issues = [];
    const economic = String(house?.economic_status || '').toLowerCase();
    const lowIncome = ['lower', 'poor', 'low', 'দরিদ্র', 'নিম্ন'].some((term) => economic.includes(term));

    if (age !== null && ((isFemale(resident.gender) && age >= 62) || (!isFemale(resident.gender) && age >= 65))) {
        issues.push({
            label: 'বয়স্ক ভাতা সম্ভাব্য',
            Icon: HandHeart,
            tone: 'bg-emerald-50 text-emerald-700'
        });
    }

    if (isDisabled(resident.disability_status)) {
        issues.push({
            label: 'প্রতিবন্ধী ভাতা সম্ভাব্য',
            Icon: HandHeart,
            tone: 'bg-violet-50 text-violet-700'
        });
    }

    if (isFemale(resident.gender) && String(resident.marital_status || '').toLowerCase().includes('widow')) {
        issues.push({
            label: 'বিধবা ভাতা সম্ভাব্য',
            Icon: HandHeart,
            tone: 'bg-fuchsia-50 text-fuchsia-700'
        });
    }

    if (age !== null && age >= 5 && age <= 24 && isStudent(resident) && lowIncome) {
        issues.push({
            label: 'শিক্ষা সহায়তা সম্ভাব্য',
            Icon: GraduationCap,
            tone: 'bg-indigo-50 text-indigo-700'
        });
    }

    if (age !== null && age <= 5 && !resident.birth_reg_no) {
        issues.push({
            label: 'শিশু সেবা follow-up',
            Icon: Baby,
            tone: 'bg-sky-50 text-sky-700'
        });
    }

    return issues;
}

function detectHealthFollowUps(resident, age) {
    const issues = [];
    const disabilityFollowUp = isDisabled(resident.disability_status);

    if (age !== null && age <= 5) {
        issues.push({
            label: 'শিশু টিকা/ওজন follow-up',
            Icon: Stethoscope,
            tone: 'bg-cyan-50 text-cyan-700'
        });
    }

    if (age !== null && age >= 60) {
        issues.push({
            label: 'বয়স্ক স্বাস্থ্য checkup',
            Icon: Stethoscope,
            tone: 'bg-emerald-50 text-emerald-700'
        });
    }

    if (disabilityFollowUp) {
        issues.push({
            label: 'প্রতিবন্ধী স্বাস্থ্য সহায়তা',
            Icon: Stethoscope,
            tone: 'bg-violet-50 text-violet-700'
        });
    }

    if (!resident.blood_group) {
        issues.push({
            label: 'জরুরি চিকিৎসার জন্য blood group দরকার',
            Icon: HeartPulse,
            tone: 'bg-rose-50 text-rose-700'
        });
    }

    return issues;
}

function buildFollowUpSmsMessage(item) {
    const person = item.residentName || item.house.owner_name || 'আপনার পরিবার';
    const issues = item.issues.map((issue) => issue.label).join(', ');
    return `DigiGram: ${person} এর ${issues} তথ্য আপডেট দরকার। অনুগ্রহ করে ওয়ার্ড মেম্বার/ভলান্টিয়ার অফিসে যোগাযোগ করুন। Holding: ${item.house.house_no || 'N/A'}`;
}

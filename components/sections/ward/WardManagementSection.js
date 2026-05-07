'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Save, User, Phone, Users, MapPin, 
    Plus, Trash2, ShieldCheck, CheckCircle2,
    School, HeartPulse, Building2, Home, X, Edit3, ChevronRight, BookOpen, PlusCircle
} from 'lucide-react';
import Link from 'next/link';
import { paths } from '@/lib/constants/paths';
import { wardService } from '@/lib/services/wardService';
import { createVillageAction, updateVillageAction, deleteVillageAction, updateWardStatsAction } from '@/lib/actions/wardActions';
import { parseBnInt, toBnDigits } from '@/lib/utils/format';
import ModalPortal from '@/components/common/ModalPortal';

import BloodGroupManagement from './BloodGroupManagement';
import VolunteerManagement from './VolunteerManagement';
import { LayoutDashboard, Droplets } from 'lucide-react';

const inputStyles = "w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-700 text-sm";
const labelStyles = "text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block flex items-center gap-1.5";

export default function WardManagementSection({ user, wardInfo, villages: initialVillages = [], isVolunteerView = false }) {
    const dynamicData = wardInfo?.stats || {};

    const [activeTab, setActiveTab] = useState('stats'); // 'stats' or 'blood'
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isAddingVillage, setIsAddingVillage] = useState(false);
    
    const [villages, setVillages] = useState([]);
    const [bloodDonors, setBloodDonors] = useState(dynamicData?.bloodDonors || []);

    const [editingIndex, setEditingIndex] = useState(null);
    const [villageForm, setVillageForm] = useState({
        name: '', name_en: '', population: '', voters: '', femaleVoters: '', maleVoters: '',
        schools: [], mosques: [], madrassas: [], orphanages: []
    });
    
    const [managingVolunteersFor, setManagingVolunteersFor] = useState(null);

    const [formData, setFormData] = useState({
        memberName: dynamicData?.memberName || user.name,
        memberPhone: dynamicData?.memberPhone || '01700000000',
    });

    useEffect(() => {
        loadVillages();
    }, []);

    const loadVillages = async () => {
        if (isVolunteerView && initialVillages.length > 0) {
            setVillages(initialVillages);
            return;
        }
        try {
            const data = await wardService.getVillagesByWard(user.access_scope_id);
            // Map location row to village form structure
            const mapped = data.map(v => ({
                id: v.id,
                name: v.name_bn,
                name_en: v.name_en,
                ...v.stats
            }));
            setVillages(mapped);
        } catch (err) {
            console.error("Failed to load villages:", err);
        }
    };

    // Automated Rollup Calculation
    const totals = useMemo(() => {
        return villages.reduce((acc, v) => ({
            population: acc.population + parseBnInt(v.population),
            voters: acc.voters + parseBnInt(v.voters),
            femaleVoters: acc.femaleVoters + parseBnInt(v.femaleVoters),
            maleVoters: acc.maleVoters + parseBnInt(v.maleVoters),
            schools: acc.schools + (Array.isArray(v.schools) ? v.schools.length : parseBnInt(v.schools)),
            mosques: acc.mosques + (Array.isArray(v.mosques) ? v.mosques.length : parseBnInt(v.mosques)),
            madrassas: acc.madrassas + (Array.isArray(v.madrassas) ? v.madrassas.length : parseBnInt(v.madrassas)),
            orphanages: acc.orphanages + (Array.isArray(v.orphanages) ? v.orphanages.length : parseBnInt(v.orphanages)),
        }), { population: 0, voters: 0, femaleVoters: 0, maleVoters: 0, schools: 0, mosques: 0, madrassas: 0, orphanages: 0 });
    }, [villages]);

    const handleSave = async (updatedDonors) => {
        if (isVolunteerView) return; // Volunteers only manage villages, not ward stats
        setLoading(true);
        const finalDonors = updatedDonors || bloodDonors;
        if (updatedDonors) setBloodDonors(updatedDonors);

        const result = await updateWardStatsAction(user.access_scope_id, {
            ...formData,
            population: toBnDigits(totals.population.toString()),
            voters: toBnDigits(totals.voters.toString()),
            schools: toBnDigits(totals.schools.toString()),
            mosques: toBnDigits(totals.mosques.toString()),
            madrassas: toBnDigits(totals.madrassas.toString()),
            orphanages: toBnDigits(totals.orphanages.toString()),
            bloodDonors: finalDonors
            // Villages are now stored in separate rows, so we don't save them here
        });

        if (!result.success) {
            alert("আপডেট করতে সমস্যা হয়েছে: " + result.error);
        } else {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        setLoading(false);
    };

    const saveVillage = async () => {
        if (!villageForm.name) return;
        setLoading(true);
        try {
            const villagePayload = {
                name_bn: villageForm.name,
                name_en: villageForm.name_en || villageForm.name,
                stats: {
                    population: villageForm.population,
                    voters: villageForm.voters,
                    maleVoters: villageForm.maleVoters,
                    femaleVoters: villageForm.femaleVoters,
                    schools: villageForm.schools,
                    mosques: villageForm.mosques,
                    madrassas: villageForm.madrassas,
                    orphanages: villageForm.orphanages
                }
            };

            if (editingIndex !== null) {
                // Update existing village
                const result = await updateVillageAction(villages[editingIndex].id, villagePayload);
                if (!result.success) throw new Error(result.error);
            } else {
                // Create new village
                const result = await createVillageAction(user.access_scope_id, villagePayload);
                if (!result.success) throw new Error(result.error);
            }
            
            await loadVillages();
            
            // Auto-sync ward stats after village change
            // We need the latest totals, but villages state might not be updated yet.
            // However, handleSave uses the totals memo which depends on villages.
            // We'll wrap handleSave call in a small timeout or just rely on the fact that 
            // loadVillages will trigger a re-render and the user will see the updated "Automatic" section.
            // To be truly dynamic in the DB, we should call handleSave.
            
            setVillageForm({
                name: '', name_en: '', population: '', voters: '', femaleVoters: '', maleVoters: '',
                schools: [], mosques: [], madrassas: [], orphanages: []
            });
            setIsAddingVillage(false);
            setEditingIndex(null);
            
            // Trigger ward stats update to sync totals to DB
            setTimeout(() => handleSave(), 500); 
            
            alert(editingIndex !== null ? "গ্রামের তথ্য আপডেট হয়েছে।" : "নতুন গ্রাম যোগ হয়েছে।");
        } catch (err) {
            alert("সমস্যা হয়েছে: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteVillage = async (id) => {
        if (!confirm("আপনি কি নিশ্চিতভাবে এই গ্রামটি ডিলিট করতে চান?")) return;
        setLoading(true);
        try {
            const result = await deleteVillageAction(id);
            if (!result.success) throw new Error(result.error);
            await loadVillages();
            setTimeout(() => handleSave(), 500);
            alert("গ্রামটি সফলভাবে ডিলিট করা হয়েছে।");
        } catch (err) {
            alert("ডিলিট করতে সমস্যা হয়েছে: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header with Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3 p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-2xl border border-slate-200">
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                            activeTab === 'stats' 
                            ? 'bg-white text-teal-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <LayoutDashboard size={18} />
                        ওয়াড পরিসংখ্যান
                    </button>
                    <button
                        onClick={() => setActiveTab('blood')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                            activeTab === 'blood' 
                            ? 'bg-white text-rose-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Droplets size={18} />
                        রক্তদাতা ডাটাবেস
                    </button>
                </div>

                {!isVolunteerView && activeTab === 'stats' && (
                    <button 
                        onClick={() => handleSave()}
                        disabled={loading}
                        className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm shadow-xl hover:bg-teal-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? 'আপডেট হচ্ছে...' : 'সব তথ্য সেভ করুন'}
                        {!loading && <Save size={18} />}
                    </button>
                )}
            </div>

            {/* Success Toast Overlay */}
            <AnimatePresence>
                {success && (
                    <ModalPortal>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed bottom-10 right-10 z-[100] bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black"
                        >
                            <CheckCircle2 size={24} />
                            তথ্য সফলভাবে আপডেট হয়েছে!
                        </motion.div>
                    </ModalPortal>
                )}
            </AnimatePresence>

            {activeTab === 'stats' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Member & Ward Summary */}
                    {!isVolunteerView && (
                        <div className="lg:col-span-4 space-y-6">
                        <div className="p-8 rounded-[32px] bg-white border border-slate-200 shadow-sm space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                            
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 flex items-center gap-2 mb-6">
                                    <ShieldCheck size={14} />
                                    প্রোফাইল সেটিংস
                                </h4>
                                
                                <div className="space-y-5">
                                    <div className="group">
                                        <label className={labelStyles}>পূর্ণ নাম</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors">
                                                <User size={16} />
                                            </div>
                                            <input 
                                                type="text"
                                                className={inputStyles + " pl-12"}
                                                value={formData.memberName}
                                                onChange={(e) => setFormData({...formData, memberName: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className={labelStyles}>যোগাযোগ নম্বর</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors">
                                                <Phone size={16} />
                                            </div>
                                            <input 
                                                type="tel"
                                                className={inputStyles + " pl-12"}
                                                value={formData.memberPhone}
                                                onChange={(e) => setFormData({...formData, memberPhone: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">ওয়াড সারসংক্ষেপ</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-teal-100 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                                                <Users size={18} />
                                            </div>
                                            <p className="text-xs font-bold text-slate-500">মোট জনসংখ্যা</p>
                                        </div>
                                        <p className="text-xl font-black text-slate-800">{toBnDigits(totals.population.toString())}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-teal-100 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                                                <Users size={18} />
                                            </div>
                                            <p className="text-xs font-bold text-slate-500">মোট ভোটার</p>
                                        </div>
                                        <p className="text-xl font-black text-slate-800">{toBnDigits(totals.voters.toString())}</p>
                                    </div>
                                </div>
                        </div>
                    </div>
                </div>
            )}

                    {/* Right: Village Management Table */}
                    <div className={`${isVolunteerView ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>
                            <div className="flex items-center justify-between px-2">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
                                    <MapPin size={16} className="text-teal-600" />
                                    ওয়াডভুক্ত গ্রামসমূহ 
                                    <span className="ml-2 px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">{toBnDigits(villages.length.toString())}</span>
                                </h4>
                                {!isVolunteerView && (
                                    <button 
                                        onClick={() => { setIsAddingVillage(true); setEditingIndex(null); }}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 text-white text-[11px] font-black shadow-lg shadow-teal-500/20 hover:bg-teal-600 hover:-translate-y-0.5 transition-all active:scale-95"
                                    >
                                        <Plus size={14} />
                                        নতুন গ্রাম
                                    </button>
                                )}
                            </div>

                        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/50">
                                        <tr className="border-b border-slate-100">
                                            <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] text-left">গ্রামের নাম</th>
                                            <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] text-left">জনসংখ্যা</th>
                                            <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] text-left">ভোটার (পু:/ম:)</th>
                                            <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] text-left">প্রতিষ্ঠান</th>
                                            <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] text-right">ম্যানেজমেন্ট</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {villages.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="p-12 text-center">
                                                    <div className="flex flex-col items-center gap-3 grayscale opacity-30">
                                                        <MapPin size={40} />
                                                        <p className="text-sm font-black">কোনো গ্রাম যোগ করা হয়নি</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            villages.map((v, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="p-5">
                                                        <p className="font-black text-slate-800">{v.name}</p>
                                                    </td>
                                                    <td className="p-5">
                                                        <p className="text-sm font-bold text-slate-600">{toBnDigits(v.population)} জন</p>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex flex-col">
                                                            <p className="text-sm font-black text-slate-800">{toBnDigits(v.voters)}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">
                                                                {toBnDigits(v.maleVoters)}/ {toBnDigits(v.femaleVoters)}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex gap-2">
                                                            <div className="flex flex-col items-center p-1.5 rounded-lg bg-teal-50 text-teal-700 min-w-[32px]" title={Array.isArray(v.schools) ? v.schools.join(', ') : 'স্কুল'}>
                                                                <span className="text-[10px] font-black leading-none mb-1">{toBnDigits((Array.isArray(v.schools) ? v.schools.length : (v.schools || 0)).toString())}</span>
                                                                <School size={10} />
                                                            </div>
                                                            <div className="flex flex-col items-center p-1.5 rounded-lg bg-emerald-50 text-emerald-700 min-w-[32px]" title={Array.isArray(v.mosques) ? v.mosques.join(', ') : 'মসজিদ'}>
                                                                <span className="text-[10px] font-black leading-none mb-1">{toBnDigits((Array.isArray(v.mosques) ? v.mosques.length : (v.mosques || 0)).toString())}</span>
                                                                <Building2 size={10} />
                                                            </div>
                                                            <div className="flex flex-col items-center p-1.5 rounded-lg bg-sky-50 text-sky-700 min-w-[32px]" title={Array.isArray(v.madrassas) ? v.madrassas.join(', ') : 'মাদ্রাসা'}>
                                                                <span className="text-[10px] font-black leading-none mb-1">{toBnDigits((Array.isArray(v.madrassas) ? v.madrassas.length : (v.madrassas || 0)).toString())}</span>
                                                                <BookOpen size={10} />
                                                            </div>
                                                            <div className="flex flex-col items-center p-1.5 rounded-lg bg-amber-50 text-amber-700 min-w-[32px]" title={Array.isArray(v.orphanages) ? v.orphanages.join(', ') : 'এতিমখানা'}>
                                                                <span className="text-[10px] font-black leading-none mb-1">{toBnDigits((Array.isArray(v.orphanages) ? v.orphanages.length : (v.orphanages || 0)).toString())}</span>
                                                                <Home size={10} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                     <td className="p-5 text-right">
                                                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                             <Link 
                                                                 href={paths.villagePortal(v.id)}
                                                                 target="_blank"
                                                                 className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white shadow-sm text-[10px] font-black transition-all"
                                                                 title="গ্রাম পোর্টালে প্রবেশ"
                                                             >
                                                                 <PlusCircle size={12} /> পোর্টালে প্রবেশ
                                                             </Link>
                                                             <button 
                                                                 onClick={() => setManagingVolunteersFor({ id: v.id, name: v.name })}
                                                                 className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-100 text-teal-600 hover:bg-teal-500 hover:text-white shadow-sm text-[10px] font-black transition-all"
                                                                 title="ভলান্টিয়ার ম্যানেজমেন্ট"
                                                             >
                                                                 <Users size={12} /> ভলান্টিয়ার
                                                             </button>
                                                             <button 
                                                                 onClick={() => { 
                                                                     setVillageForm({
                                                                         ...v, 
                                                                         name: v.name,
                                                                         schools: Array.isArray(v.schools) ? v.schools : [],
                                                                         mosques: Array.isArray(v.mosques) ? v.mosques : [],
                                                                         madrassas: Array.isArray(v.madrassas) ? v.madrassas : [],
                                                                         orphanages: Array.isArray(v.orphanages) ? v.orphanages : []
                                                                     }); 
                                                                     setEditingIndex(idx); 
                                                                     setIsAddingVillage(true); 
                                                                 }}
                                                                 className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-teal-500 hover:text-teal-600 shadow-sm text-[10px] font-black transition-all"
                                                             >
                                                                 <Edit3 size={12} /> এডিট
                                                             </button>
                                                             {!isVolunteerView && (
                                                                 <button 
                                                                     onClick={() => handleDeleteVillage(v.id)}
                                                                     className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:border-red-500 hover:text-red-500 shadow-sm transition-all"
                                                                 >
                                                                     <Trash2 size={12} />
                                                                 </button>
                                                             )}
                                                         </div>
                                                     </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="min-h-[500px]">
                    <BloodGroupManagement 
                        donors={bloodDonors} 
                        onUpdate={(updated) => handleSave(updated)} 
                    />
                </div>
            )}

            {/* Volunteer Management Modal */}
            {managingVolunteersFor && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setManagingVolunteersFor(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl"
                        >
                            <div className="absolute -top-4 -right-4 z-10">
                                <button 
                                    onClick={() => setManagingVolunteersFor(null)}
                                    className="w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <VolunteerManagement 
                                villageId={managingVolunteersFor.id} 
                                villageName={managingVolunteersFor.name} 
                            />
                        </motion.div>
                    </div>
                </ModalPortal>
            )}


            {/* Village Edit Modal */}
            {isAddingVillage && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddingVillage(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden p-8"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">
                                        {editingIndex !== null ? 'গ্রামের তথ্য আপডেট করুন' : 'নতুন গ্রাম যোগ করুন'}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1">সঠিক তথ্য দিয়ে গ্রাম পর্যায়ে ডাটাবেজ সমৃদ্ধ করুন</p>
                                </div>
                                <button onClick={() => setIsAddingVillage(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelStyles}>গ্রামের নাম (বাংলা)</label>
                                        <input 
                                            type="text" 
                                            className={inputStyles}
                                            value={villageForm.name}
                                            onChange={(e) => setVillageForm({...villageForm, name: e.target.value})}
                                            placeholder="যেমন: নওহাটা"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelStyles}>গ্রামের নাম (ইংরেজি)</label>
                                        <input 
                                            type="text" 
                                            className={inputStyles}
                                            value={villageForm.name_en}
                                            onChange={(e) => setVillageForm({...villageForm, name_en: e.target.value})}
                                            placeholder="Example: Nowhata"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelStyles}>মোট জনসংখ্যা</label>
                                        <input 
                                            type="text" 
                                            className={inputStyles}
                                            value={villageForm.population}
                                            onChange={(e) => setVillageForm({...villageForm, population: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelStyles}>মোট ভোটার</label>
                                        <input 
                                            type="text" 
                                            className={inputStyles}
                                            value={villageForm.voters}
                                            onChange={(e) => setVillageForm({...villageForm, voters: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelStyles}>পুরুষ ভোটার (Push Vote)</label>
                                        <input 
                                            type="text" 
                                            className={inputStyles}
                                            value={villageForm.maleVoters}
                                            onChange={(e) => setVillageForm({...villageForm, maleVoters: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelStyles}>মহিলা ভোটার</label>
                                        <input 
                                            type="text" 
                                            className={inputStyles}
                                            value={villageForm.femaleVoters}
                                            onChange={(e) => setVillageForm({...villageForm, femaleVoters: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* Institutional Names List Management */}
                                <div className="p-6 rounded-[24px] bg-slate-50 space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">প্রতিষ্ঠানের নামের তালিকা</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InstitutionListManager 
                                            label="স্কুলসমূহ" 
                                            icon={<School size={12} />}
                                            items={Array.isArray(villageForm.schools) ? villageForm.schools : []}
                                            onUpdate={(items) => setVillageForm({...villageForm, schools: items})}
                                            placeholder="স্কুলের নাম লিখে এন্টার দিন"
                                        />
                                        <InstitutionListManager 
                                            label="মসজিদসমূহ" 
                                            icon={<Building2 size={12} />}
                                            items={Array.isArray(villageForm.mosques) ? villageForm.mosques : []}
                                            onUpdate={(items) => setVillageForm({...villageForm, mosques: items})}
                                            placeholder="মসজিদের নাম লিখে এন্টার দিন"
                                        />
                                        <InstitutionListManager 
                                            label="মাদ্রাসাসমূহ" 
                                            icon={<BookOpen size={12} />}
                                            items={Array.isArray(villageForm.madrassas) ? villageForm.madrassas : []}
                                            onUpdate={(items) => setVillageForm({...villageForm, madrassas: items})}
                                            placeholder="মাদ্রাসার নাম লিখে এন্টার দিন"
                                        />
                                        <InstitutionListManager 
                                            label="এতিমখানাসমূহ" 
                                            icon={<Home size={12} />}
                                            items={Array.isArray(villageForm.orphanages) ? villageForm.orphanages : []}
                                            onUpdate={(items) => setVillageForm({...villageForm, orphanages: items})}
                                            placeholder="এতিমখানার নাম লিখে এন্টার দিন"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button 
                                    onClick={() => setIsAddingVillage(false)}
                                    className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200 transition-all"
                                >
                                    বাতিল
                                </button>
                                <button 
                                    onClick={saveVillage}
                                    className="flex-[2] py-4 rounded-2xl bg-teal-500 text-white font-black text-sm shadow-xl shadow-teal-500/20 hover:bg-teal-600 transition-all flex items-center justify-center gap-2"
                                >
                                    {editingIndex !== null ? 'আপডেট করুন' : 'গ্রাম যোগ করুন'}
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
}

// Helper component for managing list of names
function InstitutionListManager({ label, icon, items, onUpdate, placeholder }) {
    const [inputValue, setInputValue] = useState('');
    const [editingIdx, setEditingIdx] = useState(null);
    const [editValue, setEditValue] = useState('');
    const safeItems = Array.isArray(items) ? items : [];

    const addItem = () => {
        if (!inputValue.trim()) return;
        if (safeItems.includes(inputValue.trim())) {
            setInputValue('');
            return;
        }
        onUpdate([...safeItems, inputValue.trim()]);
        setInputValue('');
    };

    const removeItem = (index) => {
        onUpdate(safeItems.filter((_, i) => i !== index));
    };

    const startEditing = (index) => {
        setEditingIdx(index);
        setEditValue(safeItems[index]);
    };

    const saveEdit = () => {
        if (!editValue.trim()) return;
        const newItems = [...safeItems];
        newItems[editingIdx] = editValue.trim();
        onUpdate(newItems);
        setEditingIdx(null);
        setEditValue('');
    };

    return (
        <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                {icon} {label}
            </label>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    className="flex-1 p-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none focus:border-teal-500 transition-all"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addItem();
                        }
                    }}
                />
                <button 
                    onClick={(e) => { e.preventDefault(); addItem(); }}
                    className="p-2.5 rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-all shadow-md shadow-teal-500/10"
                >
                    <Plus size={18} />
                </button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-xl border border-dashed border-slate-200 bg-white/50">
                {safeItems.length === 0 && <p className="text-[10px] font-bold text-slate-300 m-auto">কোনো নাম যোগ করা হয়নি</p>}
                {safeItems.map((item, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-[11px] font-black border border-teal-100 group animate-in fade-in zoom-in duration-200 relative overflow-hidden">
                        {editingIdx === idx ? (
                            <div className="flex items-center gap-1">
                                <input 
                                    autoFocus
                                    className="w-24 bg-white border-none outline-none p-0 text-[11px] font-black"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={saveEdit}
                                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                />
                            </div>
                        ) : (
                            <>
                                <span onClick={() => startEditing(idx)} className="cursor-pointer hover:text-teal-900">{item}</span>
                                <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.preventDefault(); startEditing(idx); }}
                                        className="text-teal-400 hover:text-teal-600"
                                    >
                                        <Edit3 size={10} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.preventDefault(); removeItem(idx); }}
                                        className="text-teal-400 hover:text-rose-500 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            </>
                        )}
                    </span>
                ))}
            </div>
        </div>
    );
}

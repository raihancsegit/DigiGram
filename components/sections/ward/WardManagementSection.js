'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Save, User, Phone, Users, MapPin, 
    Plus, Trash2, ShieldCheck, CheckCircle2,
    School, HeartPulse, Building2, Home, X, Edit3, ChevronRight
} from 'lucide-react';
import { updateWardInfo } from '@/lib/store/features/wardDataSlice';
import { parseBnInt, toBnDigits } from '@/lib/utils/format';

const inputStyles = "w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-700 text-sm";
const labelStyles = "text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block flex items-center gap-1.5";

export default function WardManagementSection({ user }) {
    const dispatch = useDispatch();
    const wardKey = `${user.unionId}-${user.wardId}`;
    const dynamicData = useSelector((state) => state.wardData.dynamicWardData[wardKey]);

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isAddingVillage, setIsAddingVillage] = useState(false);
    
    // Village Data Structure
    const [villages, setVillages] = useState(() => {
        if (!dynamicData?.villages) return [];
        // Support legacy string arrays by converting to objects
        return dynamicData.villages.map(v => typeof v === 'string' ? { name: v, population: '0', voters: '0', femaleVoters: '0', maleVoters: '0', schools: '0', mosques: '0', madrassas: '0', orphanages: '0' } : v);
    });

    const [editingIndex, setEditingIndex] = useState(null);
    const [villageForm, setVillageForm] = useState({
        name: '', population: '', voters: '', femaleVoters: '', maleVoters: '',
        schools: '', mosques: '', madrassas: '', orphanages: ''
    });

    const [formData, setFormData] = useState({
        memberName: dynamicData?.memberName || user.name,
        memberPhone: dynamicData?.memberPhone || '01700000000',
    });

    // Automated Rollup Calculation
    const totals = useMemo(() => {
        return villages.reduce((acc, v) => ({
            population: acc.population + parseBnInt(v.population),
            voters: acc.voters + parseBnInt(v.voters),
            femaleVoters: acc.femaleVoters + parseBnInt(v.femaleVoters),
            maleVoters: acc.maleVoters + parseBnInt(v.maleVoters),
        }), { population: 0, voters: 0, femaleVoters: 0, maleVoters: 0 });
    }, [villages]);

    const handleSave = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        dispatch(updateWardInfo({
            key: wardKey,
            data: {
                ...formData,
                population: toBnDigits(totals.population.toString()),
                voters: toBnDigits(totals.voters.toString()),
                villages: villages
            }
        }));

        setLoading(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    const saveVillage = () => {
        if (!villageForm.name) return;
        
        if (editingIndex !== null) {
            const updated = [...villages];
            updated[editingIndex] = villageForm;
            setVillages(updated);
            setEditingIndex(null);
        } else {
            setVillages([...villages, villageForm]);
        }
        
        setVillageForm({
            name: '', population: '', voters: '', femaleVoters: '', maleVoters: '',
            schools: '', mosques: '', madrassas: '', orphanages: ''
        });
        setIsAddingVillage(false);
    };

    return (
        <div className="space-y-8">
            {/* Success Toast Overlay */}
            <AnimatePresence>
                {success && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-10 right-10 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black"
                    >
                        <CheckCircle2 size={24} />
                        তথ্য সফলভাবে আপডেট হয়েছে!
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Member & Ward Summary */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="p-6 rounded-[28px] bg-white border border-slate-200/60 shadow-sm space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest text-teal-600 flex items-center gap-2">
                            <ShieldCheck size={14} />
                            মেম্বার প্রোফাইল
                        </h4>
                        
                        <div className="space-y-4">
                            <div>
                                <label className={labelStyles}>আপনার নাম</label>
                                <input 
                                    type="text"
                                    className={inputStyles}
                                    value={formData.memberName}
                                    onChange={(e) => setFormData({...formData, memberName: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className={labelStyles}>ফোন নম্বর</label>
                                <input 
                                    type="tel"
                                    className={inputStyles}
                                    value={formData.memberPhone}
                                    onChange={(e) => setFormData({...formData, memberPhone: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">ওয়াড সারসংক্ষেপ (অটোমেটিক)</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 mb-1">মোট জনসংখ্যা</p>
                                    <p className="text-lg font-black text-slate-800">{toBnDigits(totals.population.toString())}</p>
                                </div>
                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 mb-1">মোট ভোটার</p>
                                    <p className="text-lg font-black text-slate-800">{toBnDigits(totals.voters.toString())}</p>
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-sm shadow-xl hover:bg-teal-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? 'আপডেট হচ্ছে...' : 'সব পরিবর্তন সেভ করুন'}
                            {!loading && <Save size={18} />}
                        </button>
                    </div>
                </div>

                {/* Right: Village Management Table */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                            <MapPin size={18} className="text-teal-600" />
                            ওয়াডভুক্ত গ্রামসমূহ ({villages.length})
                        </h4>
                        <button 
                            onClick={() => { setIsAddingVillage(true); setEditingIndex(null); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-white text-xs font-black shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all"
                        >
                            <Plus size={16} />
                            নতুন গ্রাম যোগ করুন
                        </button>
                    </div>

                    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100">
                                        <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-wider">গ্রামের নাম</th>
                                        <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-wider">জনসংখ্যা</th>
                                        <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-wider">ভোটার (পু:/ম:)</th>
                                        <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-wider">প্রতিষ্ঠান</th>
                                        <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">অ্যাকশন</th>
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
                                                        <div className="flex flex-col items-center p-1.5 rounded-lg bg-teal-50 text-teal-700 min-w-[32px]" title="স্কুল">
                                                            <span className="text-[10px] font-black leading-none mb-1">{toBnDigits(v.schools)}</span>
                                                            <School size={10} />
                                                        </div>
                                                        <div className="flex flex-col items-center p-1.5 rounded-lg bg-emerald-50 text-emerald-700 min-w-[32px]" title="মসজিদ">
                                                            <span className="text-[10px] font-black leading-none mb-1">{toBnDigits(v.mosques)}</span>
                                                            <Building2 size={10} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => { setVillageForm(v); setEditingIndex(idx); setIsAddingVillage(true); }}
                                                            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-teal-500 hover:text-teal-600 shadow-sm"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setVillages(villages.filter((_, i) => i !== idx))}
                                                            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-red-500 hover:text-red-500 shadow-sm"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
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

            {/* Village Edit Modal */}
            <AnimatePresence>
                {isAddingVillage && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                                    <div className="md:col-span-2">
                                        <label className={labelStyles}>গ্রামের নাম</label>
                                        <input 
                                            type="text" 
                                            className={inputStyles}
                                            value={villageForm.name}
                                            onChange={(e) => setVillageForm({...villageForm, name: e.target.value})}
                                            placeholder="যেমন: নওহাটা"
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

                                {/* Institutional Counts */}
                                <div className="p-6 rounded-[24px] bg-slate-50 space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">প্রতিষ্ঠান ও স্থাপনা সংখ্যা</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className={labelStyles}><School size={10} /> স্কুল</label>
                                            <input 
                                                type="text" 
                                                className={inputStyles + " !bg-white"}
                                                value={villageForm.schools}
                                                onChange={(e) => setVillageForm({...villageForm, schools: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelStyles}><Building2 size={10} /> মসজিদ</label>
                                            <input 
                                                type="text" 
                                                className={inputStyles + " !bg-white"}
                                                value={villageForm.mosques}
                                                onChange={(e) => setVillageForm({...villageForm, mosques: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelStyles}><Home size={10} /> মাদ্রাসা</label>
                                            <input 
                                                type="text" 
                                                className={inputStyles + " !bg-white"}
                                                value={villageForm.madrassas}
                                                onChange={(e) => setVillageForm({...villageForm, madrassas: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelStyles}><ShieldCheck size={10} /> এতিমখানা</label>
                                            <input 
                                                type="text" 
                                                className={inputStyles + " !bg-white"}
                                                value={villageForm.orphanages}
                                                onChange={(e) => setVillageForm({...villageForm, orphanages: e.target.value})}
                                            />
                                        </div>
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
                )}
            </AnimatePresence>
        </div>
    );
}

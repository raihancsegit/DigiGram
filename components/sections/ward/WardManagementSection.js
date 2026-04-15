'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
    Save, User, Phone, Users, MapPin, 
    Plus, Trash2, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { updateWardInfo } from '@/lib/store/features/wardDataSlice';

const inputStyles = "w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-700 text-sm";
const labelStyles = "text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block flex items-center gap-1.5";

export default function WardManagementSection({ user }) {
    const dispatch = useDispatch();
    const wardKey = `${user.unionId}-${user.wardId}`;
    const dynamicData = useSelector((state) => state.wardData.dynamicWardData[wardKey]);

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [villages, setVillages] = useState(dynamicData?.villages || ['নওহাটা', 'চৌমুহনী']); // Mocking initial if empty
    const [newVillage, setNewVillage] = useState('');

    const [formData, setFormData] = useState({
        memberName: dynamicData?.memberName || user.name,
        memberPhone: dynamicData?.memberPhone || '01700000000',
        population: dynamicData?.population || '৪৫০০',
        voters: dynamicData?.voters || '২৮০০',
    });

    const handleSave = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        dispatch(updateWardInfo({
            key: wardKey,
            data: {
                ...formData,
                villages: villages
            }
        }));

        setLoading(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    const addVillage = () => {
        if (newVillage.trim()) {
            setVillages([...villages, newVillage.trim()]);
            setNewVillage('');
        }
    };

    const removeVillage = (index) => {
        setVillages(villages.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-8">
            {/* Success Toast Overlay */}
            {success && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="fixed bottom-10 right-10 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black"
                >
                    <CheckCircle2 size={24} />
                    তথা সফলভাবে আপডেট হয়েছে!
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Member Profile */}
                <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-teal-600 flex items-center gap-2">
                        <User size={14} />
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
                </div>

                {/* Ward Statistics */}
                <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-teal-600 flex items-center gap-2">
                        <Users size={14} />
                        ওয়াড পরিসংখ্যান
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelStyles}>জনসংখ্যা</label>
                            <input 
                                type="text"
                                className={inputStyles}
                                value={formData.population}
                                onChange={(e) => setFormData({...formData, population: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className={labelStyles}>মোট ভোটার</label>
                            <input 
                                type="text"
                                className={inputStyles}
                                value={formData.voters}
                                onChange={(e) => setFormData({...formData, voters: e.target.value})}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Village Management */}
            <div className="space-y-6 pt-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-teal-600 flex items-center gap-2">
                    <MapPin size={14} />
                    ওয়াডভুক্ত গ্রামসমূহ
                </h4>
                
                <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 min-h-[100px]">
                    {villages.map((v, i) => (
                        <motion.span 
                            layout
                            key={v}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 group mb-2"
                        >
                            {v}
                            <button 
                                onClick={() => removeVillage(i)}
                                className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </motion.span>
                    ))}
                    <div className="flex items-center gap-2 ml-2">
                        <input 
                            type="text"
                            placeholder="নতুন গ্রাম..."
                            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none focus:border-teal-500 w-32"
                            value={newVillage}
                            onChange={(e) => setNewVillage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addVillage()}
                        />
                        <button 
                            onClick={addVillage}
                            className="p-2.5 rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20 active:scale-95"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
                <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full md:w-auto px-10 py-4 rounded-2xl bg-slate-900 text-white font-black text-sm shadow-xl shadow-slate-200 hover:bg-teal-600 hover:shadow-teal-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            আপডেট হচ্ছে...
                        </div>
                    ) : (
                        <>
                            পরিবর্তনগুলো সেভ করুন
                            <Save size={18} />
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    );
}

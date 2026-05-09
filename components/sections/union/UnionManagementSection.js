'use client';

import { useState } from 'react';
import { 
    Settings, Users, MapPin, ShieldCheck, 
    Save, Loader2, Globe, Phone, Mail
} from 'lucide-react';
import { toBnDigits } from '@/lib/utils/format';

export default function UnionManagementSection({ user, unionInfo }) {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name_bn: unionInfo?.name_bn || '',
        name_en: unionInfo?.name_en || '',
        phone: '',
        email: '',
        website: ''
    });

    async function handleUpdate() {
        setSaving(true);
        try {
            // Logic to update union info would go here
            setTimeout(() => setSaving(false), 1000);
            alert("ইউনিয়ন প্রোফাইল আপডেট করা হয়েছে।");
        } catch (err) {
            alert("আপডেট করতে সমস্যা হয়েছে।");
            setSaving(false);
        }
    }

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Settings size={20} className="text-indigo-600" />
                        প্রশাসনিক তথ্য
                    </h4>
                    
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ইউনিয়নের নাম (বাংলা)</label>
                            <input 
                                value={formData.name_bn}
                                onChange={(e) => setFormData({...formData, name_bn: e.target.value})}
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Union Name (English)</label>
                            <input 
                                value={formData.name_en}
                                onChange={(e) => setFormData({...formData, name_en: e.target.value})}
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Globe size={20} className="text-indigo-600" />
                        যোগাযোগ ও অনলাইন
                    </h4>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                                <Phone size={18} />
                            </div>
                            <input 
                                placeholder="অফিসিয়াল ফোন নম্বর"
                                className="bg-transparent border-none flex-1 font-bold text-sm focus:ring-0"
                            />
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                                <Mail size={18} />
                            </div>
                            <input 
                                placeholder="অফিসিয়াল ইমেইল"
                                className="bg-transparent border-none flex-1 font-bold text-sm focus:ring-0"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button 
                    onClick={handleUpdate}
                    disabled={saving}
                    className="px-10 py-5 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl"
                >
                    {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    তথ্য আপডেট করুন
                </button>
            </div>
        </div>
    );
}

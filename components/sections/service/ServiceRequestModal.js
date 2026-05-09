'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    X, FileText, User, Calendar, MapPin, 
    Save, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { householdService } from '@/lib/services/householdService';

export default function ServiceRequestModal({ householdId, serviceType, onClose }) {
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        applicant_name: '',
        applicant_phone: '',
        details: {
            subject_name: '', // Person for whom cert is needed
            birth_date: '',
            father_name: '',
            mother_name: '',
            request_note: ''
        }
    });

    const serviceTitles = {
        'birth_registration': 'জন্ম নিবন্ধন আবেদন',
        'death_certificate': 'মৃত্যু সনদ আবেদন',
        'utility_request': 'ইউটিলিটি সেবার আবেদন'
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            await householdService.createServiceRequest({
                household_id: householdId,
                service_type: serviceType,
                applicant_name: formData.applicant_name,
                applicant_phone: formData.applicant_phone,
                details: formData.details
            });
            setSuccess(true);
            setTimeout(() => onClose(), 2000);
        } catch (err) {
            alert("আবেদন জমা দিতে সমস্যা হয়েছে।");
        } finally {
            setSaving(false);
        }
    }

    if (success) {
        return (
            <div className="bg-white rounded-[40px] p-12 text-center max-w-sm w-full shadow-2xl">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">আবেদন সফল!</h3>
                <p className="text-slate-500 font-bold">ইউনিয়ন থেকে শীঘ্রই আপনার সাথে যোগাযোগ করা হবে।</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-2xl w-full max-w-xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
            </button>

            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                    <FileText size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800">{serviceTitles[serviceType]}</h3>
                    <p className="text-xs font-bold text-slate-400">সঠিক তথ্য দিয়ে আবেদন সম্পন্ন করুন</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">আবেদনকারীর নাম</label>
                        <input 
                            required
                            value={formData.applicant_name}
                            onChange={(e) => setFormData({...formData, applicant_name: e.target.value})}
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                            placeholder="উদা: মোঃ রহিম"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">মোবাইল নম্বর</label>
                        <input 
                            required
                            value={formData.applicant_phone}
                            onChange={(e) => setFormData({...formData, applicant_phone: e.target.value})}
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                            placeholder="017XXXXXXXX"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">যার জন্য আবেদন করা হচ্ছে (নাম)</label>
                    <input 
                        required
                        value={formData.details.subject_name}
                        onChange={(e) => setFormData({...formData, details: {...formData.details, subject_name: e.target.value}})}
                        className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                        placeholder="পূর্ণ নাম"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">পিতার নাম</label>
                        <input 
                            required
                            value={formData.details.father_name}
                            onChange={(e) => setFormData({...formData, details: {...formData.details, father_name: e.target.value}})}
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">মাতার নাম</label>
                        <input 
                            required
                            value={formData.details.mother_name}
                            onChange={(e) => setFormData({...formData, details: {...formData.details, mother_name: e.target.value}})}
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">জন্ম তারিখ / তারিখ</label>
                    <input 
                        required
                        type="date"
                        value={formData.details.birth_date}
                        onChange={(e) => setFormData({...formData, details: {...formData.details, birth_date: e.target.value}})}
                        className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">অতিরিক্ত নোট (ঐচ্ছিক)</label>
                    <textarea 
                        value={formData.details.request_note}
                        onChange={(e) => setFormData({...formData, details: {...formData.details, request_note: e.target.value}})}
                        className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold min-h-[100px]"
                        placeholder="বিস্তারিত তথ্য দিন..."
                    />
                </div>

                <button 
                    disabled={saving}
                    className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl"
                >
                    {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    আবেদন নিশ্চিত করুন
                </button>
            </form>
        </div>
    );
}

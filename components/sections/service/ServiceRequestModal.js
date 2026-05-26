'use client';

import Link from 'next/link';
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
    const [createdRequest, setCreatedRequest] = useState(null);
    
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
            const request = await householdService.createServiceRequest({
                household_id: householdId,
                request_type: serviceType,
                applicant_name: formData.applicant_name,
                contact_phone: formData.applicant_phone,
                details: formData.details.request_note || null,
                father_name: formData.details.father_name || null,
                mother_name: formData.details.mother_name || null,
                applicant_dob: formData.details.birth_date || null,
                meta_data: {
                    subject_name: formData.details.subject_name,
                    source: 'public_household_profile'
                }
            });
            setCreatedRequest(request);
            setSuccess(true);
        } catch (err) {
            alert("আবেদন জমা দিতে সমস্যা হয়েছে।");
        } finally {
            setSaving(false);
        }
    }

    if (success) {
        return (
            <div className="flex h-[100dvh] w-full max-w-sm flex-col justify-center bg-white p-8 text-center shadow-2xl sm:h-auto sm:rounded-[40px] sm:p-12">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">আবেদন সফল!</h3>
                <p className="text-slate-500 font-bold">আবেদন জমা হয়েছে। অবস্থা বদলালে আপনার মোবাইলে SMS যাবে।</p>
                {createdRequest?.id && (
                    <>
                        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tracking ID</p>
                            <p className="mt-1 break-all font-black text-slate-800">{createdRequest.id}</p>
                        </div>
                        <Link
                            href={`/track/${createdRequest.id}`}
                            className="mt-4 block w-full rounded-2xl bg-teal-600 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-teal-700"
                        >
                            আবেদন ট্র্যাক করুন
                        </Link>
                    </>
                )}
                <button
                    onClick={onClose}
                    className="mt-8 w-full rounded-2xl bg-slate-900 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-teal-600"
                >
                    ঠিক আছে
                </button>
            </div>
        );
    }

    return (
        <div className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-xl flex-col overflow-hidden bg-white p-4 shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-[32px] sm:p-8 md:p-10">
            <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-2xl border border-slate-200 bg-white p-2 text-slate-400 transition-colors hover:text-slate-600 sm:right-8 sm:top-8 sm:border-0 sm:bg-transparent">
                <X size={24} />
            </button>

            <div className="mb-5 flex items-start gap-3 pr-12 sm:mb-8 sm:items-center sm:gap-4 sm:pr-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 sm:h-12 sm:w-12">
                    <FileText size={24} />
                </div>
                <div className="min-w-0">
                    <h3 className="break-words text-lg font-black leading-tight text-slate-800 sm:text-xl">{serviceTitles[serviceType]}</h3>
                    <p className="text-xs font-bold text-slate-400">সঠিক তথ্য দিয়ে আবেদন সম্পন্ন করুন</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto pb-3 sm:space-y-6">
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
                    className="sticky bottom-0 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-5 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all hover:bg-teal-600 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    আবেদন নিশ্চিত করুন
                </button>
            </form>
        </div>
    );
}

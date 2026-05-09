'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, CheckCircle, XCircle, Clock, Calendar, 
    User, MapPin, Search, Loader2, Filter, ChevronRight
} from 'lucide-react';
import { householdService } from '@/lib/services/householdService';
import { toBnDigits } from '@/lib/utils/format';

export default function UnionServiceManager({ unionId }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionForm, setActionForm] = useState({ status: '', collection_date: '', feedback: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadRequests();
    }, [unionId]);

    async function loadRequests() {
        try {
            setLoading(true);
            const data = await householdService.getServiceRequestsByUnion(unionId);
            setRequests(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleAction() {
        setSaving(true);
        try {
            await householdService.updateRequestStatus(
                selectedRequest.id,
                actionForm.status,
                actionForm.collection_date,
                actionForm.feedback
            );
            setSelectedRequest(null);
            await loadRequests();
        } catch (err) {
            alert("আপডেট করতে সমস্যা হয়েছে।");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-teal-600" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-800">আগত আবেদনসমূহ</h3>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input className="pl-11 pr-6 py-2.5 rounded-xl bg-slate-100 border-none text-sm font-bold w-64" placeholder="আবেদনকারী বা আইডি..." />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.map(req => (
                    <motion.div 
                        key={req.id}
                        layoutId={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all cursor-pointer group"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                                <FileText size={24} />
                            </div>
                            <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest">পেন্ডিং</span>
                        </div>
                        
                        <h4 className="text-xl font-black text-slate-800 mb-2">
                            {req.service_type === 'birth_registration' ? 'জন্ম নিবন্ধন' : 
                             req.service_type === 'death_certificate' ? 'মৃত্যু সনদ' : 'ইউটিলিটি সেবা'}
                        </h4>
                        <div className="space-y-2 mb-6">
                            <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                <User size={14} /> {req.applicant_name}
                            </p>
                            <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                <MapPin size={14} /> {req.household?.village?.bn_name}, বাড়ি: {toBnDigits(req.household?.house_no || '')}
                            </p>
                        </div>

                        <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {new Date(req.created_at).toLocaleDateString('bn-BD')}
                            </span>
                            <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </motion.div>
                ))}
                
                {requests.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                        <Clock className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-400 font-bold italic">বর্তমানে কোনো নতুন আবেদন নেই।</p>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[40px] p-10 w-full max-w-2xl shadow-2xl relative"
                        >
                            <button onClick={() => setSelectedRequest(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                            
                            <h3 className="text-2xl font-black text-slate-800 mb-8">আবেদন পর্যালোচনা</h3>
                            
                            <div className="grid grid-cols-2 gap-8 mb-10">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">আবেদনকারীর তথ্য</p>
                                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="font-black text-slate-800">{selectedRequest.applicant_name}</p>
                                        <p className="text-sm font-bold text-slate-500">{toBnDigits(selectedRequest.applicant_phone)}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">আবেদনের বিষয়</p>
                                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="font-black text-slate-800">{selectedRequest.details?.subject_name}</p>
                                        <p className="text-xs font-bold text-slate-500 italic">পিতা: {selectedRequest.details?.father_name}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => setActionForm({...actionForm, status: 'Approved'})}
                                        className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${actionForm.status === 'Approved' ? 'bg-emerald-600 text-white shadow-xl' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50'}`}
                                    >
                                        <CheckCircle size={18} /> অনুমোদন
                                    </button>
                                    <button 
                                        onClick={() => setActionForm({...actionForm, status: 'Rejected'})}
                                        className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${actionForm.status === 'Rejected' ? 'bg-rose-600 text-white shadow-xl' : 'bg-slate-100 text-slate-500 hover:bg-rose-50'}`}
                                    >
                                        <XCircle size={18} /> বাতিল করুন
                                    </button>
                                </div>

                                {actionForm.status === 'Approved' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">সনদ সংগ্রহের তারিখ (Collection Date)</label>
                                        <input 
                                            type="date"
                                            value={actionForm.collection_date}
                                            onChange={(e) => setActionForm({...actionForm, collection_date: e.target.value})}
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                                        />
                                    </motion.div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ফিডব্যাক / নোট</label>
                                    <textarea 
                                        value={actionForm.feedback}
                                        onChange={(e) => setActionForm({...actionForm, feedback: e.target.value})}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold min-h-[100px]"
                                        placeholder="ইউজারকে কিছু জানাতে চাইলে লিখুন..."
                                    />
                                </div>

                                <button 
                                    disabled={!actionForm.status || saving}
                                    onClick={handleAction}
                                    className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                    পরিবর্তন সেভ করুন
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { 
    Plus, Search, Settings, HandHeart, 
    CheckCircle2, XCircle, Eye, EyeOff,
    Edit3, Trash2, LayoutGrid, FileText,
    TrendingUp, Users, Wallet, AlertCircle,
    Loader2, Save, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { donationService } from '@/lib/services/donationService';
import { toBnDigits } from '@/lib/utils/format';
import { supabase } from '@/lib/utils/supabase';

export default function DonationManager({ locationId, unionSlug }) {
    const [activeView, setActiveView] = useState('projects'); // 'projects', 'ledger', 'settings'
    const [projects, setProjects] = useState([]);
    const [ledger, setLedger] = useState([]);
    const [settings, setSettings] = useState({
        bkash_number: '',
        nagad_number: '',
        bank_details: '',
        announcement: ''
    });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Form states
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [projectForm, setProjectForm] = useState({
        title: '',
        category: 'উন্নয়ন',
        target_amount: '',
        raised_amount: '0',
        deadline: '',
        description: '',
        image_url: '',
        status: 'active',
        is_global: false
    });
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        if (unionSlug) {
            loadData();
        }
    }, [unionSlug]);

    useEffect(() => {
        if (editingProject) {
            setProjectForm({
                ...editingProject,
                target_amount: editingProject.target_amount.toString(),
                raised_amount: editingProject.raised_amount.toString()
            });
        } else {
            setProjectForm({
                title: '',
                category: 'উন্নয়ন',
                target_amount: '',
                raised_amount: '0',
                deadline: '',
                description: '',
                image_url: '',
                status: 'active',
                is_global: false
            });
        }
    }, [editingProject]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [projData, settingsData] = await Promise.all([
                donationService.getProjects(unionSlug),
                donationService.getSettings(unionSlug)
            ]);
            setProjects(projData);
            if (settingsData) setSettings(settingsData);
            
            // Load ledger (all for admin)
            const { data: allLedger } = await supabase
                .from('donation_ledger')
                .select(`
                    *,
                    project:donation_projects(title)
                `)
                .order('created_at', { ascending: false });
            
            // Filter ledger for this union's projects
            const unionProjectIds = projData.map(p => p.id);
            const filteredLedger = (allLedger || []).filter(item => 
                unionProjectIds.includes(item.project_id) || !item.project_id
            );
            setLedger(filteredLedger);
        } catch (err) {
            console.error("Error loading donation data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProject = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            if (!unionSlug && !projectForm.is_global) {
                alert("ইউনিয়ন স্লাগ পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
                return;
            }

            let finalImageUrl = projectForm.image_url;
            if (selectedImage) {
                finalImageUrl = await donationService.uploadImage(selectedImage);
            }

            const dataToSave = {
                ...projectForm,
                union_slug: projectForm.is_global ? 'global' : unionSlug,
                target_amount: parseInt(projectForm.target_amount),
                raised_amount: parseInt(projectForm.raised_amount || '0'),
                is_global: projectForm.is_global || false,
                image_url: finalImageUrl
            };

            await donationService.saveProject(dataToSave);
            setShowProjectModal(false);
            setEditingProject(null);
            setSelectedImage(null);
            loadData();
            alert("প্রজেক্ট সফলভাবে সেভ হয়েছে!");
        } catch (err) {
            console.error(err);
            alert("প্রজেক্ট সেভ করতে সমস্যা হয়েছে");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteProject = async (id) => {
        if (!confirm("আপনি কি নিশ্চিতভাবে এই প্রজেক্টটি মুছতে চান?")) return;
        try {
            await donationService.deleteProject(id);
            loadData();
            alert("প্রজেক্টটি মুছে ফেলা হয়েছে");
        } catch (err) {
            alert("মুছতে সমস্যা হয়েছে");
        }
    };

    const handleVerifyDonation = async (id) => {
        try {
            await donationService.verifyDonation(id);
            loadData();
            alert("ডোনেশন ভেরিফাই করা হয়েছে");
        } catch (err) {
            alert("ভেরিফাই করতে সমস্যা হয়েছে");
        }
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await donationService.saveSettings(unionSlug, settings);
            alert("সেটিংস সফলভাবে আপডেট হয়েছে!");
        } catch (err) {
            alert("সেটিংস আপডেট করতে সমস্যা হয়েছে");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="py-20 text-center">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
                <p className="text-slate-400 font-bold">ডোনেশন ডেটা লোড হচ্ছে...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
            {/* Nav Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <HandHeart size={28} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800">স্বচ্ছ দান ম্যানেজমেন্ট</h3>
                        <p className="text-sm font-bold text-slate-400">আপনার ইউনিয়নের ডোনেশন ও প্রজেক্ট পরিচালনা করুন</p>
                    </div>
                </div>

                <div className="flex p-1 bg-white border border-slate-200 rounded-2xl gap-1">
                    <button 
                        onClick={() => setActiveView('projects')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeView === 'projects' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <LayoutGrid size={18} /> প্রজেক্টসমূহ
                    </button>
                    <button 
                        onClick={() => setActiveView('ledger')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeView === 'ledger' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <FileText size={18} /> পাবলিক লেজার
                    </button>
                    <button 
                        onClick={() => setActiveView('settings')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeView === 'settings' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Settings size={18} /> সেটিংস
                    </button>
                </div>
            </div>

            <div className="p-8">
                {activeView === 'projects' && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xl font-black text-slate-800">চলমান প্রজেক্টসমূহ ({toBnDigits(projects.length.toString())})</h4>
                            <button 
                                onClick={() => { setEditingProject(null); setShowProjectModal(true); }}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                            >
                                <Plus size={18} /> নতুন প্রজেক্ট
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {projects.map((proj) => (
                                <div key={proj.id} className="p-6 rounded-[32px] border border-slate-200 bg-white hover:border-emerald-300 transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4 gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                                            {proj.image_url ? (
                                                <img src={proj.image_url} alt={proj.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <HandHeart size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="text-lg font-black text-slate-800 mb-1 line-clamp-1">{proj.title}</h5>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{proj.category}</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button 
                                                onClick={() => { setEditingProject(proj); setShowProjectModal(true); }}
                                                className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteProject(proj.id)}
                                                className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl p-4 mb-4 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">লক্ষ্যমাত্রা</p>
                                            <p className="text-sm font-black text-slate-700">{toBnDigits(proj.target_amount.toString())} ৳</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">সংগৃহীত</p>
                                            <p className="text-sm font-black text-emerald-600">{toBnDigits(proj.raised_amount.toString())} ৳</p>
                                        </div>
                                    </div>

                                    {/* Social Share */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <button 
                                            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/u/' + (proj.is_global ? 'global' : proj.union_slug) + '/services/donation')}`, '_blank')}
                                            className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-1.5"
                                        >
                                            Facebook
                                        </button>
                                        <button 
                                            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(proj.title + ' - অনুদান দিন: ' + window.location.origin + '/u/' + (proj.is_global ? 'global' : proj.union_slug) + '/services/donation')}`, '_blank')}
                                            className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                                        >
                                            WhatsApp
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${proj.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {proj.status === 'active' ? 'চলমান' : 'সম্পন্ন'}
                                        </span>
                                        <p className="text-[10px] font-bold text-slate-400">ডেডলাইন: {toBnDigits(new Date(proj.deadline).toLocaleDateString('bn-BD'))}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeView === 'ledger' && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-xl font-black text-slate-800">পাবলিক লেজার ও ট্রানজেকশন</h4>
                                <p className="text-sm font-bold text-slate-400">যাচাইকৃত সকল ডোনেশনের তালিকা</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 text-left">
                                        <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">তারিখ</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">দাতা</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">পরিমাণ</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">মেথড / ট্রানজেকশন</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">অ্যাকশন</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {ledger.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-5 px-4 text-xs font-bold text-slate-500">{toBnDigits(new Date(item.created_at).toLocaleDateString('bn-BD'))}</td>
                                            <td className="py-5 px-4">
                                                <p className="text-sm font-black text-slate-800">{item.donor_name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{item.project?.title || 'জেনারেল ফান্ড'}</p>
                                            </td>
                                            <td className="py-5 px-4 text-base font-black text-emerald-600">{toBnDigits(item.amount.toString())} ৳</td>
                                            <td className="py-5 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded">{item.payment_method}</span>
                                                    <span className="text-[10px] font-mono font-bold text-slate-400">{item.transaction_id}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {item.status === 'pending' ? (
                                                        <button 
                                                            onClick={() => handleVerifyDonation(item.id)}
                                                            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase hover:bg-emerald-600"
                                                        >
                                                            ভেরিফাই
                                                        </button>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase">
                                                            <CheckCircle2 size={12} /> ভেরিফাইড
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeView === 'settings' && (
                    <div className="max-w-2xl">
                        <h4 className="text-xl font-black text-slate-800 mb-8">ডোনেশন সেটিংস</h4>
                        
                        <form onSubmit={handleUpdateSettings} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">বিকাশ পার্সোনাল নম্বর</label>
                                    <input 
                                        type="text" 
                                        value={settings.bkash_number}
                                        onChange={(e) => setSettings({...settings, bkash_number: e.target.value})}
                                        placeholder="০১৭XXXXXXXX"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">নগদ পার্সোনাল নম্বর</label>
                                    <input 
                                        type="text" 
                                        value={settings.nagad_number}
                                        onChange={(e) => setSettings({...settings, nagad_number: e.target.value})}
                                        placeholder="০১৭XXXXXXXX"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">ব্যাংক ডিটেইলস (ঐচ্ছিক)</label>
                                <textarea 
                                    rows="3"
                                    value={settings.bank_details}
                                    onChange={(e) => setSettings({...settings, bank_details: e.target.value})}
                                    placeholder="ব্যাংকের নাম, অ্যাকাউন্ট নম্বর, ব্রাঞ্চ..."
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">বিশেষ ঘোষণা / নির্দেশনা</label>
                                <textarea 
                                    rows="2"
                                    value={settings.announcement}
                                    onChange={(e) => setSettings({...settings, announcement: e.target.value})}
                                    placeholder="দাতাদের জন্য কোনো বিশেষ বার্তা..."
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={actionLoading}
                                className="w-full py-5 rounded-[24px] bg-emerald-600 text-white font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                সেভ সেটিংস
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Project Modal */}
            <AnimatePresence>
                {showProjectModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowProjectModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[40px] w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl"
                        >
                            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-2xl font-black text-slate-800">
                                    {editingProject ? 'প্রজেক্ট এডিট করুন' : 'নতুন প্রজেক্ট তৈরি করুন'}
                                </h3>
                                <button onClick={() => setShowProjectModal(false)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                                    <Plus className="rotate-45" size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveProject} className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">প্রজেক্টের শিরোনাম</label>
                                        <input 
                                            required
                                            type="text" 
                                            value={projectForm.title}
                                            onChange={(e) => setProjectForm({...projectForm, title: e.target.value})}
                                            placeholder="যেমন: ইউনিয়নের মসজিদ উন্নয়ন"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">ক্যাটাগরি</label>
                                            <select 
                                                value={projectForm.category}
                                                onChange={(e) => setProjectForm({...projectForm, category: e.target.value})}
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                            >
                                                <option value="উন্নয়ন">উন্নয়ন</option>
                                                <option value="শিক্ষা">শিক্ষা</option>
                                                <option value="স্বাস্থ্য">স্বাস্থ্য</option>
                                                <option value="ধর্মীয়">ধর্মীয়</option>
                                                <option value="জরুরি">জরুরি</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">লক্ষ্যমাত্রা (৳)</label>
                                            <input 
                                                required
                                                type="number" 
                                                value={projectForm.target_amount}
                                                onChange={(e) => setProjectForm({...projectForm, target_amount: e.target.value})}
                                                placeholder="যেমন: ৫০০০০"
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">ডেডলাইন</label>
                                            <input 
                                                required
                                                type="date" 
                                                value={projectForm.deadline}
                                                onChange={(e) => setProjectForm({...projectForm, deadline: e.target.value})}
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">স্ট্যাটাস</label>
                                            <select 
                                                value={projectForm.status}
                                                onChange={(e) => setProjectForm({...projectForm, status: e.target.value})}
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                            >
                                                <option value="active">চলমান</option>
                                                <option value="completed">সম্পন্ন</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Global Toggle */}
                                    <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                        <label className="flex items-center justify-between cursor-pointer group">
                                            <div>
                                                <p className="text-sm font-black text-slate-800">গ্লোবাল প্রজেক্ট (Global Project)</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">সবগুলো ইউনিয়নে এই প্রজেক্টটি দৃশ্যমান হবে</p>
                                            </div>
                                            <div className="relative">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only"
                                                    checked={projectForm.is_global}
                                                    onChange={(e) => setProjectForm({...projectForm, is_global: e.target.checked})}
                                                />
                                                <div className={`w-12 h-6 rounded-full transition-colors ${projectForm.is_global ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${projectForm.is_global ? 'translate-x-6' : ''}`}></div>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">প্রজেক্ট ইমেজ</label>
                                        <div className="flex items-center gap-6">
                                            <div className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                                                {selectedImage ? (
                                                    <img src={URL.createObjectURL(selectedImage)} className="w-full h-full object-cover" />
                                                ) : projectForm.image_url ? (
                                                    <img src={projectForm.image_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Plus className="text-slate-300" />
                                                )}
                                            </div>
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={(e) => setSelectedImage(e.target.files[0])}
                                                className="text-xs font-bold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">বিস্তারিত বিবরণ</label>
                                        <textarea 
                                            rows="4"
                                            value={projectForm.description}
                                            onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                                            placeholder="প্রজেক্ট সম্পর্কে বিস্তারিত লিখুন..."
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="mt-10 flex gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => setShowProjectModal(false)}
                                        className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200 transition-all"
                                    >
                                        বাতিল
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={actionLoading}
                                        className="flex-[2] py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                        প্রজেক্ট সেভ করুন
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

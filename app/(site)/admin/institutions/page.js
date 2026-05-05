'use client';

import { useState, useEffect } from 'react';
import { 
    School, Search, Plus, MapPin, 
    ExternalLink, Edit3, Trash2, Loader2,
    Filter, GraduationCap, Landmark, 
    Home, Building2, LayoutGrid, LayoutList,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as hierarchyService from '@/lib/services/hierarchyService';
import { adminService } from '@/lib/services/adminService';
import { institutionService } from '@/lib/services/institutionService';
import ModalPortal from '@/components/common/ModalPortal';
import { Save, X as CloseIcon } from 'lucide-react';

const TYPE_ICONS = {
    school: GraduationCap,
    college: GraduationCap,
    mosque: Landmark,
    madrasa: Landmark,
    clinic: Activity
};

export default function InstitutionManagementPage() {
    const [institutions, setInstitutions] = useState([]);
    const [unions, setUnions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'mosque',
        location_id: '',
        village: '',
        subdomain: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const unionsData = await adminService.getLocations('union');
            setUnions(unionsData.data);
            
            const allInst = await Promise.all(
                unionsData.data.map(u => hierarchyService.getInstitutionsByLocation(u.id))
            );
            setInstitutions(allInst.flat());
        } catch (err) {
            console.error("Failed to load institutions:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await institutionService.addInstitution(formData);
            setShowAddModal(false);
            setFormData({ name: '', type: 'mosque', location_id: '', village: '', subdomain: '' });
            loadData();
            alert('প্রতিষ্ঠান যোগ করা হয়েছে।');
        } catch (err) {
            alert('সংরক্ষণ করতে সমস্যা হয়েছে।');
        }
    };

    const filteredInst = institutions.filter(inst => 
        inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.subdomain?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="text-teal-500 animate-spin mb-4" size={40} />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">ডাটা লোড হচ্ছে...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 mb-2">প্রতিষ্ঠান ব্যবস্থাপনা</h1>
                    <p className="text-slate-500 font-bold">ইউনিয়নের সকল স্কুল, কলেজ ও ধর্মীয় প্রতিষ্ঠানের তালিকা</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm mr-2">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            <LayoutList size={18} />
                        </button>
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-teal-600 text-white px-6 py-3.5 rounded-2xl font-black text-sm hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-95"
                    >
                        <Plus size={18} />
                        নতুন প্রতিষ্ঠান
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="নাম বা সাবডোমেইন দিয়ে খুঁজুন..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white border border-slate-200 rounded-[20px] py-4 pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none w-full shadow-sm"
                    />
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-[20px] text-sm font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <Filter size={18} className="text-slate-400" />
                        ফিল্টার
                    </button>
                </div>
            </div>

            {/* Institutions View */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredInst.map((inst, idx) => {
                            const Icon = TYPE_ICONS[inst.type] || Building2;
                            return (
                                <motion.div
                                    key={inst.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-teal-500/10 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-teal-50 transition-colors" />
                                    
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-500 group-hover:bg-teal-600 group-hover:text-white transition-all duration-500 flex items-center justify-center shadow-inner">
                                            <Icon size={32} />
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all" title="এডিট">
                                                <Edit3 size={18} />
                                            </button>
                                            <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all" title="মুছুন">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md mb-2 inline-block">
                                                {inst.type}
                                            </span>
                                            <h3 className="text-xl font-black text-slate-800 leading-tight mb-1 group-hover:text-teal-700 transition-colors">
                                                {inst.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                                <MapPin size={14} />
                                                পবা ইউনিয়ন, ওয়ার্ড ১
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">সাবডোমেইন</span>
                                                <span className="text-sm font-black text-slate-700">{inst.subdomain || '---'}</span>
                                            </div>
                                            <a 
                                                href={inst.custom_domain ? `https://${inst.custom_domain}` : `http://${inst.subdomain}.localhost:3000`} 
                                                target="_blank"
                                                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-slate-900/10 hover:bg-teal-600 transition-all active:scale-95"
                                            >
                                                ভিজিট
                                                <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/20">
                     <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">প্রতিষ্ঠান</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">ধরন</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">ডোমেইন / লিংক</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">অ্যাকশন</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredInst.map((inst, idx) => (
                                <tr key={inst.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600">
                                                {inst.type === 'school' ? <GraduationCap size={18} /> : <Landmark size={18} />}
                                            </div>
                                            <span className="text-sm font-black text-slate-800">{inst.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                                            {inst.type}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-sm font-bold text-slate-400">{inst.subdomain}.localhost:3000</span>
                                    </td>
                                    <td className="px-8 py-6 text-right space-x-2">
                                        <button className="p-2 text-slate-400 hover:text-teal-600 transition-colors"><Edit3 size={18} /></button>
                                        <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Modal */}
            <ModalPortal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
                <div className="bg-white rounded-[40px] p-10 max-w-2xl w-full mx-4 border border-slate-100 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6">
                        <button onClick={() => setShowAddModal(false)} className="p-3 rounded-2xl hover:bg-slate-100 transition-colors">
                            <CloseIcon size={24} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 rounded-[22px] bg-teal-50 flex items-center justify-center text-teal-600">
                            <School size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">নতুন প্রতিষ্ঠান যোগ করুন</h3>
                            <p className="text-sm font-bold text-slate-400 mt-1">সব তথ্য নির্ভুলভাবে প্রদান করুন</p>
                        </div>
                    </div>

                    <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">প্রতিষ্ঠানের নাম</label>
                            <input 
                                required
                                type="text" 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="যেমন: নওহাটা হাই স্কুল"
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 transition-all outline-none font-bold shadow-inner"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ইউনিয়ন সিলেক্ট করুন</label>
                            <select 
                                required
                                value={formData.location_id}
                                onChange={e => setFormData({...formData, location_id: e.target.value})}
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 transition-all outline-none font-bold"
                            >
                                <option value="">ইউনিয়ন নির্বাচন করুন</option>
                                {unions.map(u => (
                                    <option key={u.id} value={u.id}>{u.name_bn}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ধরণ</label>
                            <select 
                                required
                                value={formData.type}
                                onChange={e => setFormData({...formData, type: e.target.value})}
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 transition-all outline-none font-bold"
                            >
                                <option value="mosque">মসজিদ</option>
                                <option value="school">স্কুল</option>
                                <option value="college">কলেজ</option>
                                <option value="madrasa">মাদ্রাসা</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">গ্রাম</label>
                            <input 
                                required
                                type="text" 
                                value={formData.village}
                                onChange={e => setFormData({...formData, village: e.target.value})}
                                placeholder="যেমন: নওহাটা"
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 transition-all outline-none font-bold shadow-inner"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">সাবডোমেইন (Unique)</label>
                            <div className="relative">
                                <input 
                                    required
                                    type="text" 
                                    value={formData.subdomain}
                                    onChange={e => setFormData({...formData, subdomain: e.target.value})}
                                    placeholder="যেমন: nowhata-high"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 transition-all outline-none font-bold shadow-inner"
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">.digigram.com</span>
                            </div>
                        </div>

                        <button type="submit" className="md:col-span-2 w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-teal-600 transition-all shadow-2xl shadow-slate-200 active:scale-[0.98] mt-4 flex items-center justify-center gap-3">
                            <Save size={20} />
                            প্রতিষ্ঠান তৈরি করুন
                        </button>
                    </form>
                </div>
            </ModalPortal>
        </div>
    );
}

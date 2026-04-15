'use client';

import { useState } from 'react';
import { 
    Plus, Search, Edit2, Trash2, Droplets, 
    Phone, MapPin, User, Save, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toBnDigits } from '@/lib/utils/format';

export default function BloodGroupManagement({ donors = [], onUpdate }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [formData, setFormData] = useState({
        name: '',
        group: 'O+',
        phone: '',
        village: '',
        lastDonated: ''
    });

    const categories = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const filteredDonors = donors.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.group.includes(searchQuery) ||
        d.village.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSave = () => {
        if (!formData.name || !formData.phone) return;
        
        let newDonors;
        if (editingId) {
            newDonors = donors.map(d => d.id === editingId ? { ...formData, id: editingId } : d);
        } else {
            newDonors = [...donors, { ...formData, id: Date.now().toString() }];
        }
        
        onUpdate(newDonors);
        resetForm();
    };

    const handleDelete = (id) => {
        if (window.confirm('আপনি কি এই তথ্যটি মুছে ফেলতে চান?')) {
            onUpdate(donors.filter(d => d.id !== id));
        }
    };

    const resetForm = () => {
        setFormData({ name: '', group: 'O+', phone: '', village: '', lastDonated: '' });
        setIsAdding(false);
        setEditingId(null);
    };

    const startEdit = (donor) => {
        setFormData(donor);
        setEditingId(donor.id);
        setIsAdding(true);
    };

    return (
        <div className="space-y-6">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Droplets className="text-rose-500" />
                        রক্তদাতা ডাটাবেস
                    </h3>
                    <p className="text-sm font-bold text-slate-400">আপনার ওয়াডের রক্তদাতাদের তালিকা অপডেট করুন</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-rose-200 transition-all active:scale-95"
                >
                    <Plus size={18} />
                    রক্তদাতা যোগ করুন
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-rose-500" size={18} />
                <input
                    type="text"
                    placeholder="নাম, গ্রুপ বা গ্রাম দিয়ে খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-rose-200 focus:ring-4 focus:ring-rose-50 outline-none transition-all"
                />
            </div>

            {/* Form Modal/Section */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-6 rounded-3xl bg-white border-2 border-rose-100 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-black text-slate-800 flex items-center gap-2">
                                <Plus size={18} className="text-rose-500" />
                                {editingId ? 'রক্তদাতার তথ্য আপডেট করুন' : 'নতুন রক্তদাতা যোগ করুন'}
                            </h4>
                            <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">পূর্ণ নাম</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        placeholder="উদা: আব্দুল করিম"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-rose-200 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">রক্তের গ্রুপ</label>
                                <select
                                    value={formData.group}
                                    onChange={(e) => setFormData({...formData, group: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black outline-none focus:bg-white focus:border-rose-200 transition-all cursor-pointer appearance-none"
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">মোবাইল নম্বর</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        placeholder="উদা: ০১৭১XXXXXXXX"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-rose-200 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">গ্রাম</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input
                                        type="text"
                                        value={formData.village}
                                        onChange={(e) => setFormData({...formData, village: e.target.value})}
                                        placeholder="উদা: হরিপুর"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-rose-200 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">শেষবার রক্ত দিয়েছেন</label>
                                <input
                                    type="date"
                                    value={formData.lastDonated}
                                    onChange={(e) => setFormData({...formData, lastDonated: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-rose-200 transition-all"
                                />
                            </div>

                            <div className="flex items-end pb-0.5">
                                <button
                                    onClick={handleSave}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-rose-600 transition-all shadow-lg active:scale-95"
                                >
                                    <Save size={18} />
                                    তথ্যাদি সেভ করুন
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Donor List List */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                <th className="p-4 pl-6 border-b border-slate-100">রক্তদাতা</th>
                                <th className="p-4 border-b border-slate-100">রক্তের গ্রুপ</th>
                                <th className="p-4 border-b border-slate-100">যোগাযোগ</th>
                                <th className="p-4 border-b border-slate-100">গ্রাম</th>
                                <th className="p-4 pr-6 border-b border-slate-100 text-right">অ্যাকশন</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredDonors.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-3 grayscale opacity-40">
                                            <Droplets size={48} className="text-rose-500" />
                                            <p className="font-bold text-slate-500">কোনো রক্তদাতা খুঁজে পাওয়া যায়নি</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredDonors.map((donor) => (
                                    <tr key={donor.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm leading-none mb-1.5">{donor.name}</p>
                                                    {donor.lastDonated && (
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">শেষ দান: {toBnDigits(donor.lastDonated)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-rose-50 text-rose-600 font-black text-xs border border-rose-100">
                                                {donor.group}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <a href={`tel:${donor.phone}`} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-teal-600">
                                                <Phone size={14} className="text-teal-500" />
                                                {toBnDigits(donor.phone)}
                                            </a>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-500">
                                            {donor.village}
                                        </td>
                                        <td className="p-4 pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => startEdit(donor)}
                                                    className="p-2 hover:bg-teal-50 text-slate-400 hover:text-teal-600 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(donor.id)}
                                                    className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
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
    );
}

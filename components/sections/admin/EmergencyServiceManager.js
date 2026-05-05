"use client";

import { useState, useEffect } from 'react';
import { 
    Search, Plus, Trash2, ShieldAlert, 
    Ambulance, Shield, Flame, UserPlus, 
    MapPin, Loader2, Save, X, Phone,
    ChevronLeft, ChevronRight, Edit2
} from 'lucide-react';
import { emergencyService } from '@/lib/services/emergencyService';
import ModalPortal from '@/components/common/ModalPortal';
import Pagination from '@/components/common/Pagination';

export default function EmergencyServiceManager({ locationId, isAdmin = false }) {
    const [contacts, setContacts] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingContact, setEditingContact] = useState(null);
    const ITEMS_PER_PAGE = 5;

    if (!locationId) {
        return (
            <div className="py-10 text-center text-slate-400 font-bold">
                কোনো ইউনিয়ন সিলেক্ট করা হয়নি।
            </div>
        );
    }
    
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        category: 'Ambulance',
        address: ''
    });

    useEffect(() => {
        loadContacts();
    }, [locationId, currentPage]);

    const loadContacts = async () => {
        setLoading(true);
        try {
            const result = await emergencyService.getContacts(locationId, currentPage, 10);
            setContacts(result.data || []);
            setTotalCount(result.count || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        console.log("Submitting form:", formData, "editing:", editingContact?.id);
        try {
            if (editingContact) {
                // Ensure location_id is included for RLS checks
                const result = await emergencyService.updateContact(editingContact.id, { 
                    ...formData, 
                    location_id: locationId 
                });
                console.log("Update result:", result);
            } else {
                const result = await emergencyService.addContact({ ...formData, location_id: locationId });
                console.log("Add result:", result);
            }
            setShowAddModal(false);
            setEditingContact(null);
            setFormData({ name: '', phone: '', category: 'Ambulance', address: '' });
            loadContacts();
        } catch (err) {
            console.error("Submission error:", err);
            alert('সংরক্ষণ করতে সমস্যা হয়েছে। ' + (err.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (contact) => {
        setEditingContact(contact);
        setFormData({
            name: contact.name,
            phone: contact.phone,
            category: contact.category,
            address: contact.address || ''
        });
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('আপনি কি নিশ্চিত?')) return;
        try {
            await emergencyService.deleteContact(id);
            loadContacts();
        } catch (err) {
            alert('মুছতে সমস্যা হয়েছে।');
        }
    };

    const categories = ['Ambulance', 'Fire Service', 'Police', 'Doctor', 'Pharmacy', 'Volunteer'];

    const getIcon = (cat) => {
        switch(cat) {
            case 'Ambulance': return <Ambulance size={18} className="text-rose-500" />;
            case 'Fire Service': return <Flame size={18} className="text-orange-500" />;
            case 'Police': return <Shield size={18} className="text-blue-500" />;
            case 'Doctor': return <UserPlus size={18} className="text-emerald-500" />;
            default: return <Phone size={18} className="text-slate-400" />;
        }
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                        <ShieldAlert size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">জরুরি সেবা ও হটলাইন</h2>
                        <p className="text-xs font-bold text-slate-400 mt-1">ইউনিয়নের সকল জরুরি সেবার নাম্বার এখানে যোগ করুন</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-rose-600 transition-all shadow-lg shadow-slate-200"
                >
                    <Plus size={18} /> নতুন নাম্বার যোগ
                </button>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="নাম বা ধরন দিয়ে খুঁজুন..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-rose-500 outline-none font-bold text-sm transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="divide-y divide-slate-50">
                    {contacts.length > 0 ? contacts.filter(c => 
                        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        c.category.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(contact => (
                        <div key={contact.id} className="p-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                                    {getIcon(contact.category)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-black text-slate-800">{contact.name}</h4>
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-tighter">
                                            {contact.category}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-black text-rose-600 flex items-center gap-1">
                                            <Phone size={12} /> {contact.phone}
                                        </p>
                                        {contact.address && (
                                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                <MapPin size={10} /> {contact.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => handleEdit(contact)}
                                    className="p-3 rounded-xl text-slate-300 hover:text-teal-600 hover:bg-teal-50 transition-all"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(contact.id)}
                                    className="p-3 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 text-center">
                            <Phone size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold">এখনো কোনো জরুরি নাম্বার যোগ করা হয়নি।</p>
                        </div>
                    )}
                </div>

                {totalCount > 10 && (
                    <div className="p-6 border-t border-slate-100">
                        <Pagination 
                            currentPage={currentPage}
                            totalCount={totalCount}
                            pageSize={10}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <ModalPortal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setEditingContact(null); setFormData({ name: '', phone: '', category: 'Ambulance', address: '' }); }}>
                <div className="bg-white rounded-[40px] p-6 md:p-10 max-w-lg w-full mx-4 border border-slate-100 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="absolute top-0 right-0 p-4 md:p-6">
                        <button onClick={() => { setShowAddModal(false); setEditingContact(null); }} className="p-3 rounded-2xl hover:bg-slate-100 transition-colors">
                            <X size={24} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                            <Plus size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">{editingContact ? 'তথ্য পরিবর্তন করুন' : 'নতুন জরুরি সেবা যোগ'}</h3>
                            <p className="text-sm font-bold text-slate-400 mt-1">সবগুলো তথ্য সঠিক আছে কি না তা যাচাই করে নিন।</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">সেবার নাম / ব্যক্তির নাম</label>
                            <input 
                                required
                                type="text" 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="যেমন: নওহাটা ফায়ার সার্ভিস"
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-rose-500 transition-all outline-none font-bold"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ফোন নাম্বার</label>
                                <input 
                                    required
                                    type="text" 
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    placeholder="017XXXXXXXX"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-rose-500 transition-all outline-none font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ক্যাটাগরি</label>
                                <select 
                                    required
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-rose-500 transition-all outline-none font-bold"
                                >
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ঠিকানা / এলাকা (ঐচ্ছিক)</label>
                            <input 
                                type="text" 
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                placeholder="যেমন: নওহাটা বাজার"
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-rose-500 transition-all outline-none font-bold"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? 'প্রসেসিং হচ্ছে...' : (editingContact ? 'পরিবর্তন সংরক্ষণ করুন' : 'তালিকায় যোগ করুন')}
                        </button>
                    </form>
                </div>
            </ModalPortal>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { 
    Users, Plus, Trash2, ShieldCheck, 
    X, Loader2, Search, UserPlus, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { wardService } from '@/lib/services/wardService';
import { adminService } from '@/lib/services/adminService';
import { getVolunteersAction } from '@/lib/actions/wardActions';

const inputStyles = "w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-700 text-sm";

export default function VolunteerManagement({ villageId, villageName }) {
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!villageId) {
            setError('গ্রাম আইডি পাওয়া যায়নি');
            setLoading(false);
            return;
        }
        loadVolunteers();
    }, [villageId]);

    const loadVolunteers = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getVolunteersAction(villageId);
            if (result.success) {
                setVolunteers(result.data);
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            console.error('ভলান্টিয়ার লোড করতে ত্রুটি:', err);
            setError('ভলান্টিয়ার লোড করতে সমস্যা হয়েছে');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery) return;
        setSearching(true);
        try {
            const { data } = await adminService.getUsersPaginated(1, 5, 'all', searchQuery);
            setSearchResults(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    const assignVolunteer = async (user) => {
        if (!confirm(`${user.first_name}-কে এই গ্রামের ভলান্টিয়ার হিসেবে নিয়োগ দিতে চান?`)) return;
        try {
            // Using the actual 'volunteer' role defined in schema
            await adminService.assignRoleToUser(user.id, 'volunteer', villageId);
            alert('সফলভাবে নিয়োগ দেওয়া হয়েছে।');
            setIsAdding(false);
            setSearchQuery('');
            setSearchResults([]);
            await loadVolunteers();
        } catch (err) {
            alert('নিয়োগ দিতে সমস্যা হয়েছে: ' + err.message);
        }
    };

    const removeVolunteer = async (volunteer) => {
        if (!confirm('আপনি কি এই ভলান্টিয়ারকে দায়িত্ব থেকে অব্যাহতি দিতে চান?')) return;
        try {
            await adminService.mutateUser(volunteer.id, 'update_profile', {
                role: 'user',
                access_scope_id: null
            });
            setVolunteers(volunteers.filter(v => v.id !== volunteer.id));
        } catch (err) {
            alert('অব্যাহতি দিতে সমস্যা হয়েছে');
        }
    };

    return (
        <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Users size={20} className="text-teal-600" />
                        {villageName} - ভলান্টিয়ার তালিকা
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">গ্রাম ভিত্তিক স্বেচ্ছাসেবক ম্যানেজমেন্ট</p>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-teal-600 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
                >
                    {isAdding ? <X size={18} /> : <Plus size={18} />}
                </button>
            </div>

            <div className="p-6">
                {error && (
                    <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold">
                        {error}
                    </div>
                )}
                <AnimatePresence mode="wait">

                    {isAdding ? (
                        <motion.div 
                            key="adding"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="space-y-4 mb-8 p-6 rounded-3xl bg-teal-50/50 border border-teal-100"
                        >
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="নাম বা ফোন নাম্বার দিয়ে খুঁজুন..."
                                        className={inputStyles}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                <button 
                                    onClick={handleSearch}
                                    disabled={searching}
                                    className="px-6 rounded-xl bg-teal-600 text-white font-black text-sm hover:bg-teal-700 transition-all disabled:opacity-50"
                                >
                                    {searching ? <Loader2 className="animate-spin" size={18} /> : 'খুঁজুন'}
                                </button>
                            </div>

                            <div className="space-y-2">
                                {searchResults.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-teal-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                                <UserPlus size={18} className="text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{user.first_name} {user.last_name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{user.phone || user.email}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => assignVolunteer(user)}
                                            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-teal-600 transition-all active:scale-95"
                                        >
                                            অ্যাসাইন করুন
                                        </button>
                                    </div>
                                ))}
                                {searchQuery && searchResults.length === 0 && !searching && (
                                    <p className="text-center text-xs font-bold text-slate-400 py-4">কোনো ইউজার পাওয়া যায়নি</p>
                                )}
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-teal-600 mb-2" size={24} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ভলান্টিয়ার লোড হচ্ছে...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {volunteers.length === 0 ? (
                            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-[32px]">
                                <Users size={40} className="mx-auto text-slate-100 mb-3" />
                                <p className="text-sm font-bold text-slate-400">এই গ্রামে কোনো ভলান্টিয়ার নেই</p>
                                <button 
                                    onClick={() => setIsAdding(true)}
                                    className="text-teal-600 text-xs font-black uppercase tracking-widest mt-2 hover:underline"
                                >
                                    নতুন ভলান্টিয়ার যোগ করুন
                                </button>
                            </div>
                        ) : volunteers.map(v => (
                            <div key={v.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:border-teal-200 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-teal-600 shadow-sm">
                                        {v.avatar_url ? (
                                            <img src={v.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <ShieldCheck size={24} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800">{v.first_name} {v.last_name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                            <Phone size={10} /> {v.phone || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeVolunteer(v)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                    title="অব্যাহতি দিন"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

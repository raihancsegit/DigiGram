'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Users, Search, Shield, Loader2, Plus, X, UserCheck, 
    MoreVertical, Edit, Trash2, Filter, Building2, MapPin, 
    School, MessageSquare, Activity, ChevronDown, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '@/lib/services/adminService';

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Static / Helper Data
    const [unions, setUnions] = useState([]);
    const [wards, setWards] = useState([]);
    const [institutions, setInstitutions] = useState([]);
    
    // Filters & Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const pageSize = 15;
    
    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    // Target user for actions
    const [targetUser, setTargetUser] = useState(null);
    
    // Permission Options
    const PERMISSIONS = [
        { key: 'can_manage_locations', label: 'লোকেশন ম্যানেজমেন্ট', desc: 'ইউনিয়ন ও ওয়ার্ড এডিট করার ক্ষমতা' },
        { key: 'can_manage_services', label: 'সার্ভিস কন্ট্রোল', desc: 'ডিজিটাল সার্ভিস চালু/বন্ধ করার ক্ষমতা' },
        { key: 'can_manage_users', label: 'ইউজার ম্যানেজমেন্ট', desc: 'নতুন ইউজার তৈরি ও ডিলিট করার ক্ষমতা' },
        { key: 'can_manage_institutions', label: 'প্রতিষ্ঠান ম্যানেজমেন্ট', desc: 'স্কুল/মসজিদ/মাদ্রাসা ডিরেক্টরি কন্ট্রোল' },
        { key: 'can_manage_news', label: 'নিউজ ও নোটিশ', desc: 'পোর্টালে খবর ও নোটিশ পোস্ট করার ক্ষমতা' },
    ];

    const roles = [
        { id: 'super_admin', name: 'সুপার অ্যাডমিন', icon: Shield, color: 'text-rose-600 bg-rose-50' },
        { id: 'chairman', name: 'চেয়ারম্যান', icon: UserCheck, color: 'text-teal-600 bg-teal-50' },
        { id: 'ward_member', name: 'ওয়ার্ড মেম্বার', icon: MapPin, color: 'text-indigo-600 bg-indigo-50' },
        { id: 'volunteer', name: 'ভলান্টিয়ার', icon: Activity, color: 'text-amber-600 bg-amber-50' },
        { id: 'school_admin', name: 'স্কুল ম্যানেজার', icon: School, color: 'text-blue-600 bg-blue-50' },
        { id: 'mosque_admin', name: 'মসজিদ ম্যানেজার', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50' },
        { id: 'institution_admin', name: 'প্রতিষ্ঠান অ্যাডমিন', icon: Building2, color: 'text-slate-600 bg-slate-50' },
        { id: 'student', name: 'সাধারণ নাগরিক', icon: Users, color: 'text-slate-400 bg-slate-50' }
    ];

    // Form States
    const initialUserState = {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: 'password123',
        role: 'student',
        access_scope_id: '',
        permissions: {}
    };
    
    const [newUser, setNewUser] = useState(initialUserState);
    const [editUser, setEditUser] = useState({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        loadInitialData();
    }, []);

    useEffect(() => {
        if (mounted) loadUsers();
    }, [currentPage, roleFilter, mounted]);

    // Debounce search
    useEffect(() => {
        if (mounted) {
            const timer = setTimeout(() => {
                setCurrentPage(1);
                loadUsers();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchQuery]);

    const loadInitialData = async () => {
        try {
            const [unionsData, instsData] = await Promise.all([
                adminService.getLocations('union', 1, 100),
                adminService.getAllInstitutions()
            ]);
            setUnions(unionsData.data);
            setInstitutions(instsData);
        } catch (err) {
            console.error("Error loading helper data:", err);
        }
    };

    const loadUsers = async () => {
        setLoading(true);
        try {
            const { data, count } = await adminService.getUsersPaginated(currentPage, pageSize, roleFilter, searchQuery);
            setUsers(data);
            setTotalUsers(count || 0);
        } catch (err) {
            console.error("Error loading users:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await adminService.quickCreateChairman({
                ...newUser,
                access_scope_id: newUser.access_scope_id || null
            });
            alert('নতুন ইউজার সফলভাবে তৈরি হয়েছে।');
            setIsCreateModalOpen(false);
            setNewUser(initialUserState);
            await loadUsers();
        } catch (err) {
            alert('ইউজার তৈরিতে সমস্যা: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await adminService.mutateUser(targetUser.id, 'update_profile', {
                first_name: editUser.first_name,
                last_name: editUser.last_name,
                phone: editUser.phone,
                role: editUser.role,
                access_scope_id: editUser.access_scope_id || null,
                permissions: editUser.permissions || {}
            });
            alert('ইউজার প্রোফাইল সফলভাবে আপডেট হয়েছে।');
            setIsEditModalOpen(false);
            setTargetUser(null);
            await loadUsers();
        } catch (err) {
            alert('আপডেট করতে সমস্যা: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async () => {
        setSubmitting(true);
        try {
            await adminService.mutateUser(targetUser.id, 'delete');
            alert('ইউজার সফলভাবে ডিলিট হয়েছে।');
            setIsDeleteModalOpen(false);
            setTargetUser(null);
            await loadUsers();
        } catch (err) {
            alert('ডিলিট করতে সমস্যা: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (user) => {
        setTargetUser(user);
        setEditUser({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: user.phone || '',
            role: user.role || 'student',
            access_scope_id: user.access_scope_id || '',
            permissions: user.permissions || {}
        });
        setIsEditModalOpen(true);
    };

    const togglePermission = (key, isEdit = false) => {
        if (isEdit) {
            const current = editUser.permissions || {};
            setEditUser({
                ...editUser,
                permissions: { ...current, [key]: !current[key] }
            });
        } else {
            const current = newUser.permissions || {};
            setNewUser({
                ...newUser,
                permissions: { ...current, [key]: !current[key] }
            });
        }
    };

    if (loading && users.length === 0) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="text-teal-500 animate-spin mb-4" size={40} />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">ইউজার ডাটা লোড হচ্ছে...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-slate-800 mb-2">ইউজার ও অ্যাডমিন ম্যানেজমেন্ট</h1>
                    <p className="text-slate-500 font-bold">সিস্টেমের সকল ইউজার, অ্যাডমিন ও দায়িত্বপ্রাপ্ত মেম্বারদের তালিকা</p>
                </div>

                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="relative z-10 flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-sm hover:bg-teal-600 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
                >
                    <Plus size={18} />
                    নতুন ইউজার তৈরি করুন
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="নাম, ফোন বা ইমেইল দিয়ে খুঁজুন..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none shadow-sm"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="bg-white p-2 border border-slate-200 rounded-2xl shadow-sm flex items-center shrink-0 w-full md:w-auto">
                        <Filter className="text-slate-400 mx-2" size={18} />
                        <select 
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm font-black text-slate-700 pr-8 cursor-pointer outline-none w-full"
                        >
                            <option value="all">সকল রোল</option>
                            {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* User List Table */}
            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/20">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">ইউজার ইনফো</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">কন্ট্যাক্ট ডিটেইলস</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">রোল ও এক্সেস</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">অ্যাকশন</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-slate-400 font-bold text-sm">
                                        <div className="flex flex-col items-center">
                                            <Users size={48} className="text-slate-200 mb-4" />
                                            <p>কোনো ইউজার পাওয়া যায়নি</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.map((user, idx) => {
                                const roleObj = roles.find(r => r.id === user.role);
                                return (
                                    <motion.tr 
                                        key={user.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                                        className="hover:bg-slate-50/80 transition-colors group"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shrink-0 shadow-inner">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserCheck size={24} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 leading-tight">{user.first_name} {user.last_name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">ID: {user.id.substring(0,8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-bold text-slate-700">{user.email || 'No Email'}</p>
                                            <p className="text-[11px] font-black tracking-widest text-slate-400 mt-0.5">{user.phone || 'No Phone'}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${roleObj?.color || 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                                {roleObj && <roleObj.icon size={12} />}
                                                {roleObj?.name || user.role}
                                            </div>
                                            {user.access_scope_id && (
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5 flex items-center gap-1">
                                                    <Shield size={10} className="text-teal-500" />
                                                    এক্সেস স্কোপ সেট করা আছে
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all active:scale-95"
                                                    title="এডিট করুন"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteModal(user)}
                                                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:shadow-lg hover:shadow-rose-500/10 transition-all active:scale-95"
                                                    title="ডিলিট করুন"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Controls */}
                {totalUsers > pageSize && (
                    <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-xs font-bold text-slate-400">
                            মোট <span className="text-slate-800 font-black">{totalUsers}</span> জনের মধ্যে <span className="text-slate-800 font-black">{(currentPage - 1) * pageSize + 1}</span> থেকে <span className="text-slate-800 font-black">{Math.min(currentPage * pageSize, totalUsers)}</span> দেখানো হচ্ছে
                        </p>
                        <div className="flex items-center gap-3">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-200 transition-all disabled:opacity-40 shadow-sm"
                            >
                                <ChevronDown size={20} className="rotate-90" />
                            </button>
                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: Math.ceil(totalUsers / pageSize) }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                                            currentPage === i + 1 
                                            ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' 
                                            : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button 
                                disabled={currentPage >= Math.ceil(totalUsers / pageSize)}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-200 transition-all disabled:opacity-40 shadow-sm"
                            >
                                <ChevronDown size={20} className="-rotate-90" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {(isCreateModalOpen || isEditModalOpen) && (
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 lg:p-8">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    setIsEditModalOpen(false);
                                    setTargetUser(null);
                                }}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-slate-50 rounded-[48px] shadow-2xl relative z-[1001] w-full max-w-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
                            >
                                <div className="p-10 pb-6 flex items-center justify-between shrink-0 bg-white border-b border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-sm">
                                            {isEditModalOpen ? <Edit size={28} /> : <Plus size={28} />}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-800">
                                                {isEditModalOpen ? 'প্রোফাইল আপডেট' : 'নতুন ইউজার'}
                                            </h2>
                                            <p className="text-xs font-bold text-slate-400 mt-1">
                                                {isEditModalOpen ? 'ইউজারের তথ্য ও পারমিশন পরিবর্তন করুন' : 'সিস্টেম ব্যবহারের জন্য নতুন মেম্বার যোগ করুন'}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setIsCreateModalOpen(false);
                                            setIsEditModalOpen(false);
                                        }} 
                                        className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-10 pt-6 custom-scrollbar space-y-10">
                                    <form onSubmit={isEditModalOpen ? handleUpdateUser : handleCreateUser} className="space-y-8">
                                        
                                        {/* Basic Info Section */}
                                        <section className="space-y-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center text-[10px] text-white font-black">1</div>
                                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">সাধারণ তথ্য</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">নাম (প্রথম অংশ)</label>
                                                    <input 
                                                        required
                                                        type="text" 
                                                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
                                                        value={isEditModalOpen ? editUser.first_name : newUser.first_name}
                                                        onChange={(e) => isEditModalOpen ? setEditUser({...editUser, first_name: e.target.value}) : setNewUser({...newUser, first_name: e.target.value})}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">নাম (শেষ অংশ)</label>
                                                    <input 
                                                        required
                                                        type="text" 
                                                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
                                                        value={isEditModalOpen ? editUser.last_name : newUser.last_name}
                                                        onChange={(e) => isEditModalOpen ? setEditUser({...editUser, last_name: e.target.value}) : setNewUser({...newUser, last_name: e.target.value})}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ইমেইল অ্যাড্রেস</label>
                                                    <input 
                                                        required
                                                        type="email" 
                                                        disabled={isEditModalOpen}
                                                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400"
                                                        value={isEditModalOpen ? targetUser?.email : newUser.email}
                                                        onChange={(e) => !isEditModalOpen && setNewUser({...newUser, email: e.target.value})}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ফোন নাম্বার</label>
                                                    <input 
                                                        required
                                                        type="text" 
                                                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
                                                        value={isEditModalOpen ? editUser.phone : newUser.phone}
                                                        onChange={(e) => isEditModalOpen ? setEditUser({...editUser, phone: e.target.value}) : setNewUser({...newUser, phone: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        {/* Role & Scope Section */}
                                        <section className="space-y-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center text-[10px] text-white font-black">2</div>
                                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">রোল ও এক্সেস এরিয়া</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">রোল সিলেক্ট করুন</label>
                                                    <div className="relative">
                                                        <select 
                                                            className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all appearance-none cursor-pointer"
                                                            value={isEditModalOpen ? editUser.role : newUser.role}
                                                            onChange={(e) => isEditModalOpen ? setEditUser({...editUser, role: e.target.value, access_scope_id: ''}) : setNewUser({...newUser, role: e.target.value, access_scope_id: ''})}
                                                        >
                                                            {roles.map(r => (
                                                                <option key={r.id} value={r.id}>{r.name}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                                    </div>
                                                </div>

                                                {/* Dynamic Scope Selector */}
                                                {(isEditModalOpen ? editUser.role : newUser.role) !== 'super_admin' && (isEditModalOpen ? editUser.role : newUser.role) !== 'student' && (
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                            {['chairman', 'volunteer'].includes(isEditModalOpen ? editUser.role : newUser.role) ? 'ইউনিয়ন সিলেক্ট করুন' : 
                                                             ['ward_member'].includes(isEditModalOpen ? editUser.role : newUser.role) ? 'ওয়ার্ড সিলেক্ট করুন (Union > Ward)' : 
                                                             'প্রতিষ্ঠান সিলেক্ট করুন'}
                                                        </label>
                                                        <div className="relative">
                                                            <select 
                                                                className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all appearance-none cursor-pointer"
                                                                value={isEditModalOpen ? editUser.access_scope_id : newUser.access_scope_id}
                                                                onChange={(e) => isEditModalOpen ? setEditUser({...editUser, access_scope_id: e.target.value}) : setNewUser({...newUser, access_scope_id: e.target.value})}
                                                            >
                                                                <option value="">নির্বাচন করুন</option>
                                                                {['chairman', 'volunteer'].includes(isEditModalOpen ? editUser.role : newUser.role) ? (
                                                                    unions.map(u => <option key={u.id} value={u.id}>{u.name_bn}</option>)
                                                                ) : ['school_admin', 'mosque_admin', 'clinic_admin', 'institution_admin'].includes(isEditModalOpen ? editUser.role : newUser.role) ? (
                                                                    institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name} ({inst.type})</option>)
                                                                ) : (
                                                                    <option value="">ম্যানুয়ালি ID প্রদান করুন (অ্যাডভান্সড)</option>
                                                                )}
                                                            </select>
                                                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </section>

                                        {/* Admin Permissions Section (Only for Admins) */}
                                        {['super_admin', 'institution_admin', 'school_admin', 'mosque_admin'].includes(isEditModalOpen ? editUser.role : newUser.role) && (
                                            <section className="space-y-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center text-[10px] text-white font-black">3</div>
                                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">অ্যাডমিন পারমিশনস</h3>
                                                </div>

                                                <div className="grid grid-cols-1 gap-3">
                                                    {PERMISSIONS.map((perm) => {
                                                        const isActive = isEditModalOpen ? editUser.permissions?.[perm.key] : newUser.permissions?.[perm.key];
                                                        return (
                                                            <div 
                                                                key={perm.key}
                                                                onClick={() => togglePermission(perm.key, isEditModalOpen)}
                                                                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                                                                    isActive ? 'bg-teal-50 border-teal-500 shadow-lg shadow-teal-500/5' : 'bg-white border-slate-100 hover:border-slate-200'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                                                        <Shield size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-slate-800">{perm.label}</p>
                                                                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">{perm.desc}</p>
                                                                    </div>
                                                                </div>
                                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-200'}`}>
                                                                    {isActive && <CheckCircle2 size={14} />}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </section>
                                        )}

                                        {!isEditModalOpen && (
                                            <section className="space-y-6 pt-4 border-t border-slate-100">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ডিফল্ট পাসওয়ার্ড</label>
                                                    <input 
                                                        required
                                                        type="text" 
                                                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
                                                        value={newUser.password}
                                                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                                    />
                                                    <p className="text-[10px] font-bold text-slate-400 italic">ইউজার পরে ড্যাশবোর্ড থেকে পাসওয়ার্ড পরিবর্তন করতে পারবেন।</p>
                                                </div>
                                            </section>
                                        )}

                                        <button 
                                            disabled={submitting}
                                            type="submit" 
                                            className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-sm hover:bg-teal-600 transition-all shadow-2xl shadow-slate-200 active:scale-95 disabled:opacity-50 mt-8 mb-4"
                                        >
                                            {submitting ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 size={18} className="animate-spin" />
                                                    <span>প্রসেসিং হচ্ছে...</span>
                                                </div>
                                            ) : (isEditModalOpen ? 'আপডেট সেভ করুন' : 'ইউজার তৈরি করুন')}
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isDeleteModalOpen && (
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-[40px] shadow-2xl relative z-[1001] w-full max-w-sm overflow-hidden border border-slate-100 p-10 text-center"
                            >
                                <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <Trash2 size={48} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 mb-2">আপনি কি নিশ্চিত?</h2>
                                <p className="text-sm font-bold text-slate-400 leading-relaxed mb-10">
                                    ইউজার <span className="text-slate-800 font-black">"{targetUser?.first_name} {targetUser?.last_name}"</span> কে ডিলিট করলে তার সকল এক্সেস এবং ডাটা মুছে যাবে।
                                </p>
                                <div className="grid grid-cols-1 gap-3">
                                    <button 
                                        disabled={submitting}
                                        onClick={handleDeleteUser}
                                        className="py-4.5 bg-rose-600 text-white rounded-2xl font-black text-sm hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 active:scale-95 disabled:opacity-50"
                                    >
                                        {submitting ? 'ডিলিট হচ্ছে...' : 'হ্যাঁ, ডিলিট করুন'}
                                    </button>
                                    <button 
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="py-4.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                                    >
                                        না, ফিরে যান
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}

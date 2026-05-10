'use client';

import { useState, useEffect } from 'react';
import {
    MapPin, Search, Loader2, X, Edit, Trash2, LayoutGrid, Globe, Users, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '@/lib/services/adminService';
import VolunteerManagement from '@/components/sections/ward/VolunteerManagement';
import WardHouseholdManager from '@/components/sections/ward/WardHouseholdManager';
import ModalPortal from '@/components/common/ModalPortal';

export default function LocationDirectoryPage() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Filters & Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('union');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalLocations, setTotalLocations] = useState(0);
    const pageSize = 15;

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
    const [isHouseholdsModalOpen, setIsHouseholdsModalOpen] = useState(false);

    // Target location for actions
    const [targetLocation, setTargetLocation] = useState(null);
    const [editForm, setEditForm] = useState({ name_bn: '', name_en: '', slug: '', population: '', voters: '' });

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        loadLocations();
    }, [currentPage, typeFilter]);

    // Debounce search
    useEffect(() => {
        if (mounted) {
            const timer = setTimeout(() => {
                if (currentPage !== 1) setCurrentPage(1);
                else loadLocations();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchQuery]);

    const loadLocations = async () => {
        setLoading(true);
        try {
            const { data, count } = await adminService.getLocations(typeFilter, currentPage, pageSize, searchQuery);
            setLocations(data || []);
            setTotalLocations(count || 0);
        } catch (err) {
            console.error("Error loading locations:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLocation = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const updates = {
                name_bn: editForm.name_bn,
                name_en: editForm.name_en,
            };
            if (['union', 'upazila', 'district', 'village', 'ward'].includes(typeFilter)) {
                updates.slug = editForm.slug;
            }
            if (['village', 'ward'].includes(typeFilter)) {
                updates.stats = {
                    ...(targetLocation.stats || {}),
                    population: editForm.population,
                    voters: editForm.voters
                };
            }

            await adminService.mutateLocation(targetLocation.id, 'update', updates);
            alert('লোকেশন সফলভাবে আপডেট হয়েছে।');
            setIsEditModalOpen(false);
            setTargetLocation(null);
            await loadLocations();
        } catch (err) {
            alert('আপডেট করতে সমস্যা: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteLocation = async () => {
        setSubmitting(true);
        try {
            await adminService.deleteLocation(targetLocation.id);
            alert('লোকেশন সফলভাবে ডিলিট হয়েছে।');
            setIsDeleteModalOpen(false);
            setTargetLocation(null);
            await loadLocations();
        } catch (err) {
            alert('ডিলিট করতে সমস্যা: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (loc) => {
        setTargetLocation(loc);
        setEditForm({
            name_bn: loc.name_bn || '',
            name_en: loc.name_en || '',
            slug: loc.slug || '',
            population: loc.stats?.population || '',
            voters: loc.stats?.voters || ''
        });
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (loc) => {
        setTargetLocation(loc);
        setIsDeleteModalOpen(true);
    };

    const locationTypes = [
        { id: 'district', name: 'জেলা' },
        { id: 'upazila', name: 'উপজেলা' },
        { id: 'union', name: 'ইউনিয়ন' },
        { id: 'ward', name: 'ওয়ার্ড' },
        { id: 'village', name: 'গ্রাম' }
    ];

    if (loading && locations.length === 0) {
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-slate-800 mb-2">লোকেশন ও বাড়ি ডিরেক্টরি</h1>
                    <p className="text-slate-500 font-bold">সিস্টেমের সকল জেলা, উপজেলা, ইউনিয়ন, ওয়ার্ড ও গ্রামের তালিকা</p>
                </div>
            </div>

            {/* Type Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
                {locationTypes.map(type => (
                    <button
                        key={type.id}
                        onClick={() => setTypeFilter(type.id)}
                        className={`px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap shrink-0 ${typeFilter === type.id
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                            : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-slate-200'
                            }`}
                    >
                        {type.name}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="নাম দিয়ে খুঁজুন..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none shadow-sm"
                    />
                </div>
            </div>

            {/* Location List */}
            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/20 relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <Loader2 className="animate-spin text-teal-600" size={32} />
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">নাম (বাংলা ও ইংরেজি)</th>
                                {['village', 'ward'].includes(typeFilter) ? (
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">স্ট্যাটস</th>
                                ) : (
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">স্লাগ / ডোমেইন প্রিফিক্স</th>
                                )}
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">স্ট্যাটাস</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">অ্যাকশন</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {locations.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-slate-400 font-bold text-sm">
                                        কোনো তথ্য পাওয়া যায়নি
                                    </td>
                                </tr>
                            ) : locations.map((loc, idx) => (
                                <motion.tr
                                    key={loc.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                                    className="hover:bg-slate-50 transition-colors group"
                                >
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:border-teal-200 transition-colors">
                                                {['union', 'district', 'upazila'].includes(typeFilter) ? <Globe size={18} /> : <MapPin size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{loc.name_bn}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{loc.name_en || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {['village', 'ward'].includes(typeFilter) ? (
                                        <td className="px-8 py-4">
                                            <div className="flex gap-4">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">জনসংখ্যা</span>
                                                    <span className="text-xs font-black text-slate-700">{loc.stats?.population || '0'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">ভোটার</span>
                                                    <span className="text-xs font-black text-slate-700">{loc.stats?.voters || '0'}</span>
                                                </div>
                                            </div>
                                        </td>
                                    ) : (
                                        <td className="px-8 py-4">
                                            <p className="text-sm font-bold text-slate-700">{loc.slug || 'N/A'}</p>
                                        </td>
                                    )}

                                    <td className="px-8 py-4">
                                        <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-200 bg-teal-50 text-teal-600">
                                            {loc.status || 'Active'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {typeFilter === 'village' && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setTargetLocation(loc);
                                                            setIsHouseholdsModalOpen(true);
                                                        }}
                                                        className="p-2 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 hover:text-teal-700 hover:border-teal-200 hover:bg-teal-100 hover:shadow-lg hover:shadow-teal-500/10 transition-all active:scale-95"
                                                        title="বাড়ি ও সদস্য তালিকা"
                                                    >
                                                        <Home size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setTargetLocation(loc);
                                                            setIsVolunteerModalOpen(true);
                                                        }}
                                                        className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all active:scale-95"
                                                        title="ভলান্টিয়ার ম্যানেজ"
                                                    >
                                                        <Users size={16} />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => openEditModal(loc)}
                                                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all active:scale-95"
                                                title="এডিট করুন"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(loc)}
                                                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:shadow-lg hover:shadow-rose-500/10 transition-all active:scale-95"
                                                title="ডিলিট করুন"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalLocations > pageSize && (
                    <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400">
                            মোট {totalLocations} টির মধ্যে {(currentPage - 1) * pageSize + 1} থেকে {Math.min(currentPage * pageSize, totalLocations)} দেখানো হচ্ছে
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-600 hover:text-teal-600 hover:border-teal-200 transition-all disabled:opacity-50"
                            >
                                পূর্ববর্তী
                            </button>
                            <span className="text-xs font-black text-slate-800 bg-white border border-slate-200 px-4 py-2 rounded-xl">
                                {currentPage} / {Math.ceil(totalLocations / pageSize)}
                            </span>
                            <button
                                disabled={currentPage >= Math.ceil(totalLocations / pageSize)}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-600 hover:text-teal-600 hover:border-teal-200 transition-all disabled:opacity-50"
                            >
                                পরবর্তী
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <ModalPortal>
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsEditModalOpen(false)}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white rounded-[40px] shadow-2xl relative z-[1001] w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col"
                            >
                                <div className="p-8 pb-4 flex items-center justify-between shrink-0">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800">তথ্য আপডেট</h2>
                                        <p className="text-xs font-bold text-slate-400 mt-1">নাম ও অন্যান্য তথ্য সংশোধন করুন</p>
                                    </div>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="p-2 rounded-xl hover:bg-slate-50 transition-colors"
                                    >
                                        <X size={24} className="text-slate-400" />
                                    </button>
                                </div>

                                <div className="p-8 pt-4 custom-scrollbar">
                                    <form onSubmit={handleUpdateLocation} className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">নাম (বাংলা)</label>
                                                <input
                                                    required
                                                    type="text"
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all mt-1.5"
                                                    value={editForm.name_bn}
                                                    onChange={(e) => setEditForm({ ...editForm, name_bn: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">নাম (ইংরেজি)</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all mt-1.5"
                                                    value={editForm.name_en}
                                                    onChange={(e) => setEditForm({ ...editForm, name_en: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {['union', 'upazila', 'district', 'village', 'ward'].includes(typeFilter) && (
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">স্লাগ / প্রিফিক্স (URL-এর জন্য)</label>
                                                <input
                                                    type="text"
                                                    placeholder="যেমন: ward-1 অথবা village-name"
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all mt-1.5"
                                                    value={editForm.slug}
                                                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                                                />
                                            </div>
                                        )}

                                        {['village', 'ward'].includes(typeFilter) && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">মোট জনসংখ্যা</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all mt-1.5"
                                                        value={editForm.population}
                                                        onChange={(e) => setEditForm({ ...editForm, population: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">মোট ভোটার</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all mt-1.5"
                                                        value={editForm.voters}
                                                        onChange={(e) => setEditForm({ ...editForm, voters: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            disabled={submitting}
                                            type="submit"
                                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-teal-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50 mt-4"
                                        >
                                            {submitting ? 'প্রসেসিং হচ্ছে...' : 'আপডেট সেভ করুন'}
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    </ModalPortal>
                )}
            </AnimatePresence>

            {/* Delete Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <ModalPortal>
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
                                className="bg-white rounded-[40px] shadow-2xl relative z-[1001] w-full max-w-sm overflow-hidden border border-slate-100 p-8 text-center"
                            >
                                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Trash2 size={40} />
                                </div>
                                <h2 className="text-xl font-black text-slate-800 mb-2">আপনি কি নিশ্চিত?</h2>
                                <p className="text-sm font-bold text-slate-400 mb-8">
                                    <span className="text-slate-800">{targetLocation?.name_bn}</span> কে ডিলিট করলে এর অধীনে থাকা সকল তথ্য মুছে যাবে।
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                                    >
                                        না, থাক
                                    </button>
                                    <button
                                        disabled={submitting}
                                        onClick={handleDeleteLocation}
                                        className="py-4 bg-rose-600 text-white rounded-2xl font-black text-sm hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 active:scale-95 disabled:opacity-50"
                                    >
                                        {submitting ? 'ডিলিট হচ্ছে...' : 'হ্যাঁ, ডিলিট'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </ModalPortal>
                )}
            </AnimatePresence>

            {/* Volunteer Management Modal */}
            <AnimatePresence>
                {isVolunteerModalOpen && targetLocation && (
                    <ModalPortal isOpen={isVolunteerModalOpen} onClose={() => setIsVolunteerModalOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[40px] shadow-2xl relative z-[1001] w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 pb-4 flex items-center justify-between shrink-0">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">ভলান্টিয়ার ম্যানেজমেন্ট</h2>
                                    <p className="text-xs font-bold text-slate-400 mt-1">{targetLocation.name_bn} গ্রামের স্বেচ্ছাসেবক তালিকা</p>
                                </div>
                                <button
                                    onClick={() => setIsVolunteerModalOpen(false)}
                                    className="p-2 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    <X size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="p-8 pt-4 overflow-y-auto custom-scrollbar">
                                <VolunteerManagement
                                    villageId={targetLocation.id}
                                    villageName={targetLocation.name_bn}
                                />
                            </div>
                        </motion.div>
                    </ModalPortal>
                )}
            </AnimatePresence>

            {/* Household Management Modal */}
            <AnimatePresence>
                {isHouseholdsModalOpen && targetLocation && (
                    <ModalPortal isOpen={isHouseholdsModalOpen} onClose={() => setIsHouseholdsModalOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[40px] shadow-2xl relative z-[1001] w-full max-w-6xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 pb-4 flex items-center justify-between shrink-0 bg-slate-50 border-b border-slate-100">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">বাড়ি ও সদস্য ম্যানেজমেন্ট</h2>
                                    <p className="text-xs font-bold text-slate-400 mt-1">{targetLocation.name_bn} গ্রামের হাউসহোল্ড তালিকা</p>
                                </div>
                                <button
                                    onClick={() => setIsHouseholdsModalOpen(false)}
                                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-8 pt-4 overflow-y-auto custom-scrollbar flex-1">
                                <WardHouseholdManager
                                    wardId={targetLocation.parent_id}
                                    assignedVillage={targetLocation}
                                    volunteerMode={false}
                                />
                            </div>
                        </motion.div>
                    </ModalPortal>
                )}
            </AnimatePresence>

        </div>
    );
}

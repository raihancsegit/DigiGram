'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Globe, Search, MapPin, ArrowUpRight, 
    Settings2, ChevronRight, Loader2, Plus,
    BarChart3, Users2, ShieldCheck, X, UserCheck, Trash2, LayoutGrid, ArrowLeft,
    School, Building2, BookOpen, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '@/lib/services/adminService';
import Link from 'next/link';

export default function UnionManagementPage() {
    // Hierarchy States
    const [viewLevel, setViewLevel] = useState('districts'); // 'districts', 'upazilas', 'unions', 'wards', 'villages'
    const [navigationPath, setNavigationPath] = useState([]); // [{id, name, type}]
    const [displayItems, setDisplayItems] = useState([]); // Currently visible list
    
    // Original states (maintained for compatibility)
    const [unions, setUnions] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUnion, setSelectedUnion] = useState(null);
    const [selectedWard, setSelectedWard] = useState(null);
    const [selectedItemForAction, setSelectedItemForAction] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [showAddUserForm, setShowAddUserForm] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isWardModalOpen, setIsWardModalOpen] = useState(false);
    const [selectedUnionWards, setSelectedUnionWards] = useState([]);
    const [activeRoleAssign, setActiveRoleAssign] = useState('chairman'); // 'chairman', 'ward_member', or 'volunteer'
    const [activeWardForAssign, setActiveWardForAssign] = useState(null);
    const [activeVillageForAssign, setActiveVillageForAssign] = useState(null);
    const [newWard, setNewWard] = useState({ name_bn: '', name_en: '' });
    const [newVillage, setNewVillage] = useState({ 
        name_bn: '', name_en: '', 
        stats: { population: '', voters: '', maleVoters: '', femaleVoters: '', schools: [], mosques: [], madrassas: [], orphanages: [] } 
    });
    const [mounted, setMounted] = useState(false);
    
    // Dashboard additions
    const [globalStats, setGlobalStats] = useState({ unions: 0, wards: 0, villages: 0, users: 0 });
    const [recentLogs, setRecentLogs] = useState([]);

    useEffect(() => {
        setMounted(true);
    }, []);


    // Form States
    const [newLocation, setNewLocation] = useState({
        name_bn: '',
        name_en: '',
        slug: '',
        type: 'district' // Default
    });

    const [newUser, setNewUser] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: 'password123', // Default password
        role: '' // Will be set dynamically by mode
    });

    const [selectedUserToEdit, setSelectedUserToEdit] = useState(null);

    useEffect(() => {
        loadData();
    }, [viewLevel, navigationPath, currentPage]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Always fetch users to ensure we have assigned profiles for display
            const usersData = await adminService.getUsersByRole();
            setAllUsers(usersData);

            const stats = await adminService.getGlobalStats();
            setGlobalStats(stats);
            
            const logs = await adminService.getRecentLogs();
            setRecentLogs(logs);

            if (viewLevel === 'districts') {
                const result = await adminService.getLocations('district', currentPage, pageSize);
                setDisplayItems(result.data);
                setTotalCount(result.count);
            } else if (viewLevel === 'upazilas') {
                const parent = navigationPath[navigationPath.length - 1];
                const { data, count } = await adminService.getChildrenLocations(parent.id, 'upazila', currentPage, pageSize);
                setDisplayItems(data);
                setTotalCount(count);
            } else if (viewLevel === 'unions') {
                const parent = navigationPath[navigationPath.length - 1];
                const { data, count } = await adminService.getChildrenLocations(parent.id, 'union', currentPage, pageSize);
                setUnions(data);
                setDisplayItems(data);
                setTotalCount(count);
            } else if (viewLevel === 'wards') {
                const parent = navigationPath[navigationPath.length - 1];
                const { data, count } = await adminService.getChildrenLocations(parent.id, 'ward', currentPage, pageSize);
                
                // Fetch village counts for each ward (only for current page)
                const wardsWithCounts = await Promise.all(data.map(async w => {
                    const villageResult = await adminService.getChildrenLocations(w.id, 'village', 1, 1);
                    return { ...w, villageCount: villageResult.count };
                }));
                setDisplayItems(wardsWithCounts);
                setTotalCount(count);
            } else if (viewLevel === 'villages') {
                const parent = navigationPath[navigationPath.length - 1];
                const { data, count } = await adminService.getChildrenLocations(parent.id, 'village', currentPage, pageSize);
                setDisplayItems(data);
                setTotalCount(count);
            }
        } catch (err) {
            console.error("Failed to load hierarchical data:", err);
        } finally {
            setLoading(false);
        }
    };

    const drillDown = (item) => {
        let nextLevel = 'upazilas';
        if (item.type === 'district') nextLevel = 'upazilas';
        else if (item.type === 'upazila') nextLevel = 'unions';
        else if (item.type === 'union') nextLevel = 'wards';
        else if (item.type === 'ward') nextLevel = 'villages';

        setNavigationPath([...navigationPath, { id: item.id, name: item.name_bn, type: item.type, slug: item.slug }]);
        setViewLevel(nextLevel);
        setCurrentPage(1);
        setSearchQuery('');
        if (item.type === 'union') setSelectedUnion(item);
        if (item.type === 'ward') setSelectedWard(item);
    };

    const navigateBack = (index) => {
        setCurrentPage(1);
        if (index === -1) {
            setNavigationPath([]);
            setViewLevel('districts');
            setSelectedUnion(null);
            setSelectedWard(null);
        } else {
            const newPath = navigationPath.slice(0, index + 1);
            const lastItem = newPath[newPath.length - 1];
            setNavigationPath(newPath);
            
            let nextLevel = 'districts';
            if (lastItem.type === 'district') nextLevel = 'upazilas';
            else if (lastItem.type === 'upazila') nextLevel = 'unions';
            else if (lastItem.type === 'union') nextLevel = 'wards';
            else if (lastItem.type === 'ward') nextLevel = 'villages';
            
            setViewLevel(nextLevel);
            if (lastItem.type === 'union') {
                setSelectedUnion(lastItem);
                setSelectedWard(null);
            }
        }
        setSearchQuery('');
    };

    const handleCreateOrUpdateLocation = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMessage('');
        try {
            const parentId = navigationPath[navigationPath.length - 1]?.id || null;
            const type = viewLevel === 'districts' ? 'district' : 
                         viewLevel === 'upazilas' ? 'upazila' : 'union';

            const locationData = {
                name_bn: newLocation.name_bn,
                name_en: newLocation.name_en,
                slug: newLocation.slug,
                type,
                parent_id: parentId
            };

            if (selectedItemForAction && isCreateModalOpen && newLocation.id) {
                await adminService.updateLocation(newLocation.id, locationData);
            } else {
                await adminService.createLocation(locationData);
            }
            await loadData();
            setIsCreateModalOpen(false);
            setSelectedItemForAction(null);
            setNewLocation({ name_bn: '', name_en: '', slug: '', type: 'district' });
        } catch (err) {
            setErrorMessage(err.message || "লোকেশন তৈরি/আপডেট করতে সমস্যা হয়েছে।");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAction = async () => {
        if (!selectedItemForAction) return;
        const targetId = selectedItemForAction.id;
        setSubmitting(true);
        try {
            // Optimistic UI Update: Filter out locally first
            setDisplayItems(prev => prev.filter(item => item.id !== targetId));
            if (viewLevel === 'unions') {
                setUnions(prev => prev.filter(item => item.id !== targetId));
            }

            const result = await adminService.deleteLocation(targetId);
            console.log("Delete result:", result);
            
            // Re-fetch to ensure sync
            await loadData();
            setIsDeleteModalOpen(false);
            setSelectedItemForAction(null);
            alert("সফলভাবে ডিলিট করা হয়েছে।");
        } catch (err) {
            console.error("Delete failed:", err);
            alert("ডিলিট করতে সমস্যা হয়েছে: " + err.message);
            await loadData(); // Revert on failure
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditItem = (item) => {
        setSelectedItemForAction(item);
        if (['district', 'upazila', 'union'].includes(item.type)) {
            setNewLocation(item);
            setIsCreateModalOpen(true);
        } else if (item.type === 'ward') {
            setNewWard({ ...item });
            setIsWardModalOpen(true);
        } else if (item.type === 'village') {
            const stats = item.stats || { population: '', voters: '' };
            setNewVillage({ 
                ...item, 
                stats: {
                    ...stats,
                    schools: Array.isArray(stats.schools) ? stats.schools : [],
                    mosques: Array.isArray(stats.mosques) ? stats.mosques : [],
                    madrassas: Array.isArray(stats.madrassas) ? stats.madrassas : [],
                    orphanages: Array.isArray(stats.orphanages) ? stats.orphanages : []
                } 
            });
            setIsWardModalOpen(true); 
        }
    };

    const handleDeleteItem = (item) => {
        setSelectedItemForAction(item);
        setIsDeleteModalOpen(true);
    };

    
    const handleOpenWardModal = async (union) => {
        setSelectedUnion(union);
        // Instead of modal, we now drill down
        drillDown(union);
    };

    const handleCreateWard = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (selectedItemForAction && selectedItemForAction.type === 'ward') {
                // Update existing ward
                const result = await adminService.updateLocation(selectedItemForAction.id, {
                    name_bn: newWard.name_bn,
                    name_en: newWard.name_en
                });
                console.log("Update result:", result);
                
                // Optimistic update
                setDisplayItems(prev => prev.map(item => item.id === selectedItemForAction.id ? { ...item, ...newWard } : item));
                alert("ওয়ার্ড সফলভাবে আপডেট হয়েছে।");
            } else {
                // Create new ward
                const parentId = navigationPath[navigationPath.length - 1]?.id;
                const parentSlug = navigationPath[navigationPath.length - 1]?.slug || 'ward';
                const wardSlug = `${parentSlug}-${newWard.name_en.toLowerCase().replace(/\s+/g, '-')}`;
                
                await adminService.createLocation({
                    name_bn: newWard.name_bn,
                    name_en: newWard.name_en,
                    slug: wardSlug,
                    type: 'ward',
                    parent_id: parentId
                });
                alert("নতুন ওয়ার্ড যোগ হয়েছে।");
            }
            await loadData();
            setNewWard({ name_bn: '', name_en: '' });
            setIsWardModalOpen(false);
            setSelectedItemForAction(null);
        } catch (err) {
            alert("ওয়ার্ড সেভ করতে সমস্যা হয়েছে: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAssignChairman = async (userId) => {
        if (viewLevel === 'unions' && !selectedUnion) return;
        if (viewLevel === 'wards' && !activeWardForAssign) return;
        if (viewLevel === 'villages' && !activeVillageForAssign) return;

        setSubmitting(true);
        try {
            const role = activeRoleAssign;
            const scopeId = activeRoleAssign === 'ward_member'
                ? activeWardForAssign?.id
                : activeRoleAssign === 'volunteer'
                    ? activeVillageForAssign?.id
                    : selectedUnion?.id;

            await adminService.assignRoleToUser(userId, role, scopeId);

            alert(`সফলভাবে ${role === 'ward_member' ? 'ওয়ার্ড মেম্বার' : role === 'volunteer' ? 'গ্রাম ভলান্টিয়ার' : 'চেয়ারম্যান'} নিয়োগ করা হয়েছে।`);
            setIsAssignModalOpen(false);
            await loadData();
        } catch (err) {
            alert("অ্যাসাইন করতে সমস্যা হয়েছে।");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeassignUser = async (userId) => {
        if (!confirm("আপনি কি নিশ্চিতভাবে এই নিয়োগটি বাতিল করতে চান?")) return;
        setSubmitting(true);
        try {
            await adminService.mutateUser(userId, 'deassign');
            alert("নিয়োগ সফলভাবে বাতিল করা হয়েছে।");
            await loadData();
        } catch (err) {
            console.error("Deassign error:", err);
            alert("নিয়োগ বাতিল করতে সমস্যা হয়েছে: " + (err.message || "Unknown error"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuickAddUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const scopeId = activeRoleAssign === 'ward_member'
                ? activeWardForAssign?.id
                : activeRoleAssign === 'volunteer'
                    ? activeVillageForAssign?.id
                    : selectedUnion?.id;
            
            if (selectedUserToEdit) {
                // Update existing user
                await adminService.mutateUser(selectedUserToEdit.id, 'update_profile', {
                    first_name: newUser.first_name,
                    last_name: newUser.last_name,
                    phone: newUser.phone,
                    role: newUser.role
                });
                alert("ইউজার প্রোফাইল আপডেট করা হয়েছে।");
            } else {
                // Create new and assign
                await adminService.quickCreateChairman({
                    ...newUser,
                    role: newUser.role || (activeRoleAssign === 'ward_member' ? 'ward_member' : activeRoleAssign === 'volunteer' ? 'volunteer' : 'chairman'),
                    access_scope_id: scopeId
                });
                alert("নতুন ইউজার তৈরি ও নিয়োগ সফল হয়েছে।");
            }
            
            const usersData = await adminService.getUsersByRole();
            setAllUsers(usersData);
            setShowAddUserForm(false);
            setSelectedUserToEdit(null);
            setNewUser({ first_name: '', last_name: '', email: '', phone: '', password: 'password123', role: '' });
        } catch (err) {
            alert("ইউজার তৈরিতে সমস্যা: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUnions = unions.filter(u => 
        u.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.name_bn.includes(searchQuery)
    );

    const filteredUsers = allUsers.filter(u => 
        (u.first_name || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (u.phone || '').includes(userSearchQuery)
    );

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="text-teal-500 animate-spin mb-4" size={40} />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">ইউনিয়ন ডাটা লোড হচ্ছে...</p>
            </div>
        );
    }

    const getOverviewStats = () => {
        if (viewLevel === 'wards') {
            const totalVillages = displayItems.reduce((acc, item) => acc + (item.villageCount || 0), 0);
            const unionUsers = allUsers.filter(u => u.access_scope_id === selectedUnion?.id).length;
            const memberUsers = allUsers.filter(u => displayItems.some(w => w.id === u.access_scope_id)).length;
            
            return {
                title: 'ইউনিয়ন ওভারভিউ',
                subtitle: selectedUnion ? `${selectedUnion.name_bn} এর সামগ্রিক স্ট্যাটাস` : 'ইউনিয়নের সামগ্রিক স্ট্যাটাস',
                stats: [
                    { label: 'মোট ওয়ার্ড', value: totalCount },
                    { label: 'মোট গ্রাম', value: totalVillages },
                    { label: 'অ্যাডমিন', value: unionUsers },
                    { label: 'মেম্বার', value: memberUsers },
                ]
            };
        } else if (viewLevel === 'villages') {
            const totalPopulation = displayItems.reduce((acc, v) => acc + parseInt(v.stats?.population || 0), 0);
            const totalVoters = displayItems.reduce((acc, v) => acc + parseInt(v.stats?.voters || 0), 0);
            const memberUsers = allUsers.filter(u => u.access_scope_id === selectedWard?.id).length;

            return {
                title: 'ওয়ার্ড ওভারভিউ',
                subtitle: selectedWard ? `${selectedWard.name_bn} এর সামগ্রিক স্ট্যাটাস` : 'ওয়ার্ডের সামগ্রিক স্ট্যাটাস',
                stats: [
                    { label: 'মোট গ্রাম', value: totalCount },
                    { label: 'জনসংখ্যা', value: totalPopulation || 0 },
                    { label: 'ভোটার', value: totalVoters || 0 },
                    { label: 'মেম্বার', value: memberUsers },
                ]
            };
        }
        
        return {
            title: 'সিস্টেম ওভারভিউ',
            subtitle: 'পুরো সিস্টেমের সামগ্রিক স্ট্যাটাস',
            stats: [
                { label: 'ইউনিয়ন', value: globalStats.unions },
                { label: 'ওয়ার্ড', value: globalStats.wards },
                { label: 'গ্রাম', value: globalStats.villages },
                { label: 'ইউজার', value: globalStats.users },
            ]
        };
    };

    const overview = getOverviewStats();

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <button 
                            onClick={() => navigateBack(-1)}
                            className={`text-xs font-black uppercase tracking-widest ${viewLevel === 'districts' ? 'text-teal-600' : 'text-slate-400 hover:text-teal-600 transition-colors'}`}
                            disabled={viewLevel === 'districts'}
                        >
                            ডিস্ট্রিক্ট / জেলা
                        </button>
                        {navigationPath.map((nav, i) => (
                            <div key={nav.id} className="flex items-center gap-2">
                                <ChevronRight size={14} className="text-slate-300" />
                                <button 
                                    onClick={() => navigateBack(i)}
                                    className={`text-xs font-black uppercase tracking-widest ${i === navigationPath.length - 1 ? 'text-teal-600' : 'text-slate-400 hover:text-teal-600 transition-colors'}`}
                                    disabled={i === navigationPath.length - 1}
                                >
                                    {nav.name}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                        {viewLevel !== 'unions' && (
                            <button 
                                onClick={() => navigateBack(navigationPath.length - 2)}
                                className="p-2 rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white transition-all shadow-sm"
                                title="পূর্ববর্তী লেভেলে ফিরে যান"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h1 className="text-3xl font-black text-slate-800">
                            {viewLevel === 'districts' ? 'জেলা প্রোফাইল' : 
                             viewLevel === 'upazilas' ? 'উপজেলা প্রোফাইল' :
                             viewLevel === 'unions' ? 'ইউনিয়ন প্রোফাইল' : 
                             viewLevel === 'wards' ? 'ওয়ার্ড লিস্ট' : 'গ্রামের তালিকা'}
                        </h1>
                    </div>

                    <p className="text-slate-500 font-bold">
                        {viewLevel === 'districts' ? 'সকল নিবন্ধিত জেলা ও বিভাগীয় তথ্য' : 
                         viewLevel === 'upazilas' ? 'উপজেলা ভিত্তিক প্রশাসনিক তথ্য' :
                         viewLevel === 'unions' ? 'সকল নিবন্ধিত ইউনিয়ন ও তাদের প্রশাসনিক নিয়ন্ত্রণ' : 
                         viewLevel === 'wards' ? `${selectedUnion?.name_bn} এর অন্তর্ভুক্ত সকল ওয়ার্ড` : 
                         `${selectedWard?.name_bn} এর অন্তর্ভুক্ত সকল গ্রাম`}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder={`${viewLevel === 'districts' ? 'জেলা' : 
                                           viewLevel === 'upazilas' ? 'উপজেলা' : 
                                           viewLevel === 'unions' ? 'ইউনিয়ন' : 
                                           viewLevel === 'wards' ? 'ওয়ার্ড' : 'গ্রাম'} খুঁজুন...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none w-full md:w-64 shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={() => {
                            setSelectedItemForAction(null);
                            if (['districts', 'upazilas', 'unions'].includes(viewLevel)) {
                                setNewLocation({ name_bn: '', name_en: '', slug: '', type: viewLevel === 'districts' ? 'district' : viewLevel === 'upazilas' ? 'upazila' : 'union' });
                                setIsCreateModalOpen(true);
                            } else if (viewLevel === 'wards') {
                                setNewWard({ name_bn: '', name_en: '' });
                                setIsWardModalOpen(true);
                            } else if (viewLevel === 'villages') {
                                setNewVillage({ name_bn: '', name_en: '', stats: { population: '', voters: '' } });
                                setIsWardModalOpen(true);
                            }
                        }}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-sm hover:bg-teal-600 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
                    >
                        <Plus size={18} />
                        {viewLevel === 'districts' ? 'নতুন জেলা' : 
                         viewLevel === 'upazilas' ? 'নতুন উপজেলা' :
                         viewLevel === 'unions' ? 'নতুন ইউনিয়ন' : 
                         viewLevel === 'wards' ? 'নতুন ওয়ার্ড' : 'নতুন গ্রাম'}
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { 
                        label: viewLevel === 'districts' ? 'মোট জেলা' : 
                               viewLevel === 'upazilas' ? 'মোট উপজেলা' :
                               viewLevel === 'unions' ? 'মোট ইউনিয়ন' : 
                               viewLevel === 'wards' ? 'মোট ওয়ার্ড' : 'মোট গ্রাম', 
                        value: displayItems.length, 
                        icon: (viewLevel === 'unions' || viewLevel === 'districts' || viewLevel === 'upazilas') ? Globe : (viewLevel === 'wards' ? LayoutGrid : MapPin), 
                        color: 'teal' 
                    },
                    { 
                        label: 'তথ্য হালনাগাদ', 
                        value: 'সক্রিয়', 
                        icon: ShieldCheck, 
                        color: 'indigo' 
                    },
                    { 
                        label: 'মোট নাগরিক (আনুমানিক)', 
                        value: viewLevel === 'unions' ? '২৮,৪৫০' : (selectedUnion?.stats?.population || '৩,১৫০'), 
                        icon: Users2, 
                        color: 'sky' 
                    },
                    { 
                        label: 'মাসিক আবেদন', 
                        value: '১,২০০', 
                        icon: BarChart3, 
                        color: 'rose' 
                    }
                ].map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center gap-4"
                    >
                        <div className={`w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                            <p className="text-xl font-black text-slate-800">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Hierarchical Table/List */}
            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/20">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                    {viewLevel === 'districts' ? 'জেলার নাম' : 
                                     viewLevel === 'upazilas' ? 'উপজেলার নাম' :
                                     viewLevel === 'unions' ? 'ইউনিয়ন পরিচিতি' : 
                                     viewLevel === 'wards' ? 'ওয়ার্ড পরিচিতি' : 'গ্রামের নাম'}
                                </th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                    {viewLevel === 'districts' ? 'অবস্থান (বিভাগ)' : 
                                     viewLevel === 'upazilas' ? 'জেলা' :
                                     viewLevel === 'unions' ? 'অবস্থান (উপজেলা)' : 
                                     viewLevel === 'wards' ? 'দায়িত্বপ্রাপ্ত মেম্বার' : 'জনসংখ্যা ও ভোটার'}
                                </th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">স্ট্যাটাস / ইনফো</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right pr-12">অ্যাকশন</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {displayItems.filter(item => 
                                item.name_bn.includes(searchQuery) || (item.name_en || '').toLowerCase().includes(searchQuery.toLowerCase())
                            ).map((item, idx) => (
                                <motion.tr 
                                    key={item.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="hover:bg-slate-50 transition-colors group"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
                                                {viewLevel === 'unions' ? <Globe size={20} /> : <MapPin size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{item.name_bn}</p>
                                                <p className="text-xs font-bold text-slate-400 lowercase tracking-tight">
                                                    {viewLevel === 'unions' ? `${item.slug}.localhost:3000` : item.type}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {viewLevel === 'unions' ? (() => {
                                            const manager = allUsers.find(u => u.access_scope_id === item.id && u.role === 'chairman');
                                            return manager ? (
                                                <div className="flex items-center gap-3">
                                                    {manager.avatar_url ? (
                                                        <img src={manager.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                                                            <UserCheck size={20} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-black text-slate-700 leading-none">{manager.first_name} {manager.last_name}</p>
                                                        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-1">চেয়ারম্যান</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-rose-500 bg-rose-50/50 px-4 py-2 rounded-xl border border-rose-100/50 w-fit">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                    <span className="text-[10px] font-black uppercase tracking-tight">এই পোর্টাল কন্ট্রোলে নিয়োগ নেই</span>
                                                </div>
                                            );
                                        })() : viewLevel === 'wards' ? (() => {
                                            const manager = allUsers.find(u => u.access_scope_id === item.id && u.role === 'ward_member');
                                            return manager ? (
                                                <div className="flex items-center gap-3">
                                                    {manager.avatar_url ? (
                                                        <img src={manager.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                                                            <Users2 size={20} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-black text-slate-700 leading-none">{manager.first_name} {manager.last_name}</p>
                                                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">ওয়ার্ড মেম্বার</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-amber-600 bg-amber-50/50 px-4 py-2 rounded-xl border border-amber-100/50 w-fit">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                    <span className="text-[10px] font-black uppercase tracking-tight">মেম্বার নিয়োগ নেই</span>
                                                </div>
                                            );
                                        })() : viewLevel === 'villages' ? (
                                            <div className="flex flex-col gap-1">
                                                <p className="text-sm font-black text-slate-700">জনসংখ্যা: {item.stats?.population || 'N/A'}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ভোটর: {item.stats?.voters || 'N/A'}</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                <p className="text-sm font-black text-slate-700">
                                                    {viewLevel === 'districts' ? 'বিভাগ: রাজশাহী' : 
                                                     viewLevel === 'upazilas' ? `জেলা: ${navigationPath[0]?.name || 'N/A'}` : ''}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">আইডি: {item.id.slice(0,8)}</p>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                                            <span className="text-xs font-black text-teal-600 uppercase tracking-widest">Active</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right pr-12">
                                        <div className="flex items-center justify-end gap-2">
                                            {viewLevel !== 'villages' && (
                                                <button 
                                                    onClick={() => drillDown(item)}
                                                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-teal-500 hover:bg-teal-500 hover:text-white transition-all shadow-sm flex items-center gap-2 pr-4 pl-3"
                                                >
                                                    <LayoutGrid size={18} />
                                                    <span className="text-[10px] font-black uppercase tracking-wider">
                                                        {viewLevel === 'districts' ? 'উপজেলাগুলো' : 
                                                         viewLevel === 'upazilas' ? 'ইউনিয়নগুলো' : 
                                                         viewLevel === 'unions' ? 'ওয়ার্ডগুলো' : 'গ্রামগুলো'}
                                                    </span>
                                                </button>
                                            )}
                                            
                                            {viewLevel === 'unions' && (
                                                <Link 
                                                    href={`/u/${item.slug}`} 
                                                    target="_blank"
                                                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-200 hover:shadow-lg transition-all"
                                                    title="ইউনিয়ন পোর্টাল দেখুন"
                                                >
                                                    <ArrowUpRight size={18} />
                                                </Link>
                                            )}

                                            {viewLevel === 'wards' && (
                                                <Link 
                                                    href={`/u/${selectedUnion?.slug}/w/${item.id}`} 
                                                    target="_blank"
                                                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-200 hover:shadow-lg transition-all"
                                                    title="ওয়ার্ড পোর্টাল দেখুন"
                                                >
                                                    <ArrowUpRight size={18} />
                                                </Link>
                                            )}

                                            {(viewLevel === 'unions' || viewLevel === 'wards' || viewLevel === 'villages') && (
                                                <button 
                                                    onClick={() => {
                                                        if (viewLevel === 'unions') {
                                                            setSelectedUnion(item);
                                                            setActiveWardForAssign(null);
                                                            setActiveVillageForAssign(null);
                                                            setActiveRoleAssign('chairman');
                                                        } else if (viewLevel === 'wards') {
                                                            setActiveWardForAssign(item);
                                                            setActiveVillageForAssign(null);
                                                            setActiveRoleAssign('ward_member');
                                                        } else if (viewLevel === 'villages') {
                                                            setActiveWardForAssign(null);
                                                            setActiveVillageForAssign(item);
                                                            setActiveRoleAssign('volunteer');
                                                        }
                                                        setIsAssignModalOpen(true);
                                                    }}
                                                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg transition-all"
                                                    title={viewLevel === 'villages' ? 'ভলান্টিয়ার নিয়োগ করুন' : 'অ্যাসাইন করুন'}
                                                >
                                                    <UserCheck size={18} />
                                                </button>
                                            )}

                                            <button 
                                                onClick={() => handleEditItem(item)}
                                                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200 hover:shadow-lg transition-all"
                                                title="এডিট করুন"
                                            >
                                                <Settings2 size={18} />
                                            </button>

                                            <button 
                                                onClick={() => handleDeleteItem(item)}
                                                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:shadow-lg transition-all"
                                                title="ডিলিট করুন"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalCount > pageSize && (
                    <div className="mt-8 flex items-center justify-between bg-white/50 backdrop-blur-md p-6 rounded-[32px] border border-slate-200">
                        <div className="text-xs font-bold text-slate-400">
                            মোট {totalCount} টির মধ্যে {Math.min(currentPage * pageSize, totalCount)} টি দেখানো হচ্ছে
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                disabled={currentPage === 1 || loading}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:border-teal-500 hover:text-teal-600 transition-all disabled:opacity-30 active:scale-95 shadow-sm"
                            >
                                পূর্ববর্তী
                            </button>
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-slate-200">
                                {currentPage}
                            </div>
                            <button 
                                disabled={currentPage * pageSize >= totalCount || loading}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:border-teal-500 hover:text-teal-600 transition-all disabled:opacity-30 active:scale-95 shadow-sm"
                            >
                                পরবর্তী
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dashboard Additions (Stats & Logs) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                                <Globe size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">{overview.title}</h3>
                                <p className="text-sm font-bold text-slate-400 mt-1">{overview.subtitle}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {overview.stats.map((stat, i) => (
                                <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                                    <p className="text-3xl font-black text-slate-800">{stat.value.toLocaleString('bn-BD')}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm h-full">
                        <h3 className="text-lg font-black text-slate-800 mb-6">সাম্প্রতিক আপডেটসমূহ</h3>
                        <div className="space-y-4">
                            {recentLogs.length === 0 ? (
                                <p className="text-sm font-bold text-slate-400">কোনো আপডেট নেই</p>
                            ) : (
                                recentLogs.map((log) => (
                                    <div key={log.id} className="flex items-start gap-4">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-teal-500 shrink-0" />
                                        <div>
                                            <p className="text-sm font-black text-slate-700">{log.name_bn}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{log.type}</span>
                                                <span className="text-[10px] font-bold text-slate-400">{new Date(log.created_at).toLocaleDateString('bn-BD')}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {/* Create/Edit Union Modal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isCreateModalOpen && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    setSelectedUnion(null);
                                    setErrorMessage('');
                                }}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white rounded-[40px] shadow-2xl relative z-[1001] w-full max-w-lg overflow-hidden border border-slate-100"
                            >
                                <div className="p-8 pb-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-black text-slate-800">
                                        {selectedItemForAction ? 'আপডেট করুন' : 
                                         viewLevel === 'districts' ? 'নতুন জেলা যোগ করুন' :
                                         viewLevel === 'upazilas' ? 'নতুন উপজেলা যোগ করুন' : 'নতুন ইউনিয়ন যোগ করুন'}
                                    </h2>
                                    <button onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-50">
                                        <X size={24} className="text-slate-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateOrUpdateLocation} className="p-8 space-y-6">
                                    {errorMessage && (
                                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold leading-relaxed">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">নাম (বাংলা)</label>
                                            <input 
                                                required
                                                type="text" 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all mt-1.5"
                                                placeholder="উদা: রাজশাহী / পবা / দামকুড়া"
                                                value={newLocation.name_bn}
                                                onChange={(e) => setNewLocation({...newLocation, name_bn: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name (English)</label>
                                            <input 
                                                required
                                                type="text" 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all mt-1.5"
                                                placeholder="e.g. Rajshahi / Paba / Damkura"
                                                value={newLocation.name_en}
                                                onChange={(e) => setNewLocation({...newLocation, name_en: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slug (URL)</label>
                                            <input 
                                                required
                                                type="text" 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all mt-1.5"
                                                placeholder="e.g. rajshahi / paba / damkura"
                                                value={newLocation.slug}
                                                onChange={(e) => setNewLocation({...newLocation, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        disabled={submitting}
                                        type="submit" 
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-teal-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
                                    >
                                        {submitting ? 'প্রসেসিং হচ্ছে...' : (selectedItemForAction ? 'আপডেট করুন' : 'সেভ করুন')}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Assign Chairman Modal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isAssignModalOpen && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsAssignModalOpen(false)}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white rounded-[40px] shadow-2xl relative z-[1001] w-full max-w-lg overflow-hidden border border-slate-100 h-[650px] flex flex-col"
                            >
                                <div className="p-8 pb-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800">
                                            {activeRoleAssign === 'ward_member' ? 'মেম্বার নিয়োগ' : activeRoleAssign === 'volunteer' ? 'গ্রাম ভলান্টিয়ার নিয়োগ' : 'চেয়ারম্যান নিয়োগ'}
                                        </h2>
                                        <p className="text-xs font-bold text-slate-400 mt-1">
                                            {activeRoleAssign === 'ward_member' ? `${activeWardForAssign?.name_bn} এর জন্য` : activeRoleAssign === 'volunteer' ? `${activeVillageForAssign?.name_bn} এর জন্য` : `${selectedUnion?.name_bn} এর জন্য`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setShowAddUserForm(!showAddUserForm)}
                                            className={`p-2 rounded-xl border transition-all ${showAddUserForm ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-teal-50 border-teal-100 text-teal-600'}`}
                                        >
                                            {showAddUserForm ? <X size={20} /> : <Plus size={20} />}
                                        </button>
                                        <button onClick={() => setIsAssignModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-50">
                                            <X size={24} className="text-slate-400" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto px-8 pb-8" onClick={(e) => e.stopPropagation()}>
                                    {/* Existing Assignment Status */}
                                    {!showAddUserForm && (
                                        <div className="mb-8 space-y-4">
                                            {allUsers.filter(u => 
                                                u.access_scope_id === (
                                                    activeRoleAssign === 'ward_member' ? activeWardForAssign?.id : 
                                                    activeRoleAssign === 'volunteer' ? activeVillageForAssign?.id : 
                                                    selectedUnion?.id
                                                )
                                            ).map(manager => (
                                                <div key={manager.id} className="p-6 rounded-[32px] bg-slate-900 text-white shadow-xl flex items-center justify-between group overflow-hidden relative">
                                                    <div className="absolute right-0 top-0 opacity-10 -translate-y-4 translate-x-4">
                                                        <ShieldCheck size={120} />
                                                    </div>
                                                    <div className="relative z-10 flex items-center gap-4">
                                                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center border border-white/20">
                                                            {manager.avatar_url ? (
                                                                <img src={manager.avatar_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <UserCheck size={32} className="text-teal-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-2 py-0.5 bg-teal-500 text-[8px] font-black uppercase tracking-widest rounded-full">বর্তমানে দায়িত্বরত</span>
                                                                <span className="px-2 py-0.5 bg-white/10 text-[8px] font-black uppercase tracking-widest rounded-full">{manager.role}</span>
                                                            </div>
                                                            <h3 className="text-lg font-black mt-1">{manager.first_name} {manager.last_name}</h3>
                                                            <p className="text-xs font-bold text-slate-400 opacity-80">{manager.phone}</p>
                                                        </div>
                                                    </div>
                                                    <div className="relative z-10 flex flex-col gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedUserToEdit(manager);
                                                                setNewUser({
                                                                    first_name: manager.first_name,
                                                                    last_name: manager.last_name,
                                                                    email: manager.email,
                                                                    phone: manager.phone,
                                                                    role: manager.role,
                                                                    password: '********' // Password hidden during edit
                                                                });
                                                                setShowAddUserForm(true);
                                                            }}
                                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            প্রোফাইল এডিট
                                                        </button>
                                                        <button 
                                                            disabled={submitting}
                                                            onClick={() => handleDeassignUser(manager.id)}
                                                            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            নিয়োগ বাতিল
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {allUsers.filter(u => 
                                                u.access_scope_id === (
                                                    activeRoleAssign === 'ward_member' ? activeWardForAssign?.id : 
                                                    activeRoleAssign === 'volunteer' ? activeVillageForAssign?.id : 
                                                    selectedUnion?.id
                                                )
                                            ).length === 0 && (
                                                <div className="p-6 rounded-[32px] border-2 border-dashed border-slate-100 flex items-center justify-center text-center">
                                                    <p className="text-xs font-bold text-slate-400 italic">বর্তমানে কোনো নিয়োগ নেই। তালিকা থেকে নির্বাচন করুন।</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {showAddUserForm ? (
                                        <form onSubmit={handleQuickAddUser} className="space-y-4">
                                            {/* ... form inputs same as before ... */}
                                            <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100/50 mb-2">
                                                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest text-center">
                                                    {selectedUserToEdit ? 'ইউজার প্রোফাইল আপডেট করুন' : (activeRoleAssign === 'ward_member' ? 'নতুন মেম্বার তৈরি করুন' : 'নতুন চেয়ারম্যান তৈরি করুন')}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <input 
                                                    required placeholder="নাম (প্রথম)" 
                                                    className="col-span-1 bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-teal-500 transition-all"
                                                    value={newUser.first_name}
                                                    onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                                                />
                                                <input 
                                                    placeholder="নাম (শেষ)" 
                                                    className="col-span-1 bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-teal-500 transition-all"
                                                    value={newUser.last_name}
                                                    onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                                                />
                                            </div>
                                            <input 
                                                required type="email" placeholder="ইমেইল অ্যাড্রেস" 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-teal-500 transition-all"
                                                value={newUser.email}
                                                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                            />
                                            <input 
                                                required placeholder="ফোন নম্বর" 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-teal-500 transition-all"
                                                value={newUser.phone}
                                                onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                                            />
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">রোল / পদবী</label>
                                                <select 
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-teal-500 transition-all"
                                                    value={newUser.role || (activeRoleAssign === 'ward_member' ? 'ward_member' : activeRoleAssign === 'volunteer' ? 'volunteer' : 'chairman')}
                                                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                                                >
                                                    <option value="chairman">চেয়ারম্যান</option>
                                                    <option value="ward_member">ওয়ার্ড মেম্বার</option>
                                                    <option value="volunteer">গ্রাম ভলান্টিয়ার</option>
                                                    <option value="institution_admin">প্রতিষ্ঠান অ্যাডমিন</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">পাসওয়ার্ড নির্ধারণ করুন</label>
                                                <input 
                                                    required
                                                    type="text" 
                                                    placeholder="পাসওয়ার্ড লিখুন"
                                                    value={newUser.password}
                                                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-teal-500 transition-all"
                                                />
                                            </div>
                                            <button 
                                                disabled={submitting}
                                                type="submit"
                                                className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-teal-100 active:scale-95 disabled:opacity-50"
                                            >
                                                {submitting ? 'তৈরি হচ্ছে...' : 'তৈরি ও নিয়োগ দিন'}
                                            </button>
                                        </form>
                                    ) : (
                                        <>
                                            <div className="mb-4">
                                                <div className="relative">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                    <input 
                                                        type="text" 
                                                        placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
                                                        value={userSearchQuery}
                                                        onChange={(e) => setUserSearchQuery(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {filteredUsers.length === 0 ? (
                                                    <div className="text-center py-10">
                                                        <p className="text-slate-400 text-sm font-bold mb-4">কোনো ইউজার পাওয়া যায়নি।</p>
                                                        <button 
                                                            onClick={() => setShowAddUserForm(true)}
                                                            className="text-teal-600 text-xs font-black uppercase tracking-widest border-b-2 border-teal-100 hover:border-teal-500 transition-all"
                                                        >
                                                            নতুন ইউজার তৈরি করুন
                                                        </button>
                                                    </div>
                                                ) : (
                                                    filteredUsers.map(user => (
                                                        <div 
                                                            key={user.id} 
                                                            className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between group hover:border-teal-200 transition-all"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-100">
                                                                    <Users2 size={20} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-800">{user.first_name} {user.last_name}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{user.phone || 'No Phone'}</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                disabled={submitting}
                                                                onClick={() => handleAssignChairman(user.id)}
                                                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all active:scale-95 disabled:opacity-50"
                                                            >
                                                                নিয়োগ দিন
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
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
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
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
                                    <span className="text-slate-800">&quot;{selectedItemForAction?.name_bn || selectedItemForAction?.name_en}&quot;</span> ডিলিট করলে এর সকল ডাটা মুছে যাবে। এটি আর ফিরে পাওয়া সম্ভব নয়।
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => {
                                            setIsDeleteModalOpen(false);
                                            setSelectedItemForAction(null);
                                        }}
                                        className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                                    >
                                        না, থাক
                                    </button>
                                    <button 
                                        disabled={submitting}
                                        onClick={handleDeleteAction}
                                        className="py-4 bg-rose-600 text-white rounded-2xl font-black text-sm hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 active:scale-95 disabled:opacity-50"
                                    >
                                        {submitting ? 'ডিলিট হচ্ছে...' : 'হ্যাঁ, ডিলিট'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Ward & Village Modal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isWardModalOpen && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => {
                                    setIsWardModalOpen(false);
                                    setSelectedItemForAction(null);
                                }}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            />
                            
                            {viewLevel === 'wards' ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="bg-white rounded-[40px] shadow-2xl relative z-[1001] w-full max-w-lg overflow-hidden border border-slate-100"
                                >
                                    <div className="p-8 pb-4 flex items-center justify-between">
                                        <h2 className="text-2xl font-black text-slate-800">
                                            {selectedItemForAction ? 'ওয়ার্ড আপডেট করুন' : 'নতুন ওয়ার্ড যোগ করুন'}
                                        </h2>
                                        <button onClick={() => setIsWardModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-50">
                                            <X size={24} className="text-slate-400" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleCreateWard} className="p-8 space-y-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ওয়ার্ডের নাম (বাংলা)</label>
                                                <input 
                                                    required
                                                    type="text" 
                                                    placeholder="যেমন: ১নং ওয়ার্ড"
                                                    value={newWard.name_bn}
                                                    onChange={(e) => setNewWard({...newWard, name_bn: e.target.value})}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ওয়ার্ডের নাম (ইংরেজি)</label>
                                                <input 
                                                    required
                                                    type="text" 
                                                    placeholder="যেমন: Ward 1"
                                                    value={newWard.name_en}
                                                    onChange={(e) => setNewWard({...newWard, name_en: e.target.value})}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            disabled={submitting}
                                            type="submit" 
                                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
                                        >
                                            {submitting ? 'সেভ হচ্ছে...' : (selectedItemForAction ? 'আপডেট নিশ্চিত করুন' : 'ওয়ার্ড তৈরি করুন')}
                                        </button>
                                    </form>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="bg-white rounded-[40px] shadow-2xl relative z-[1001] w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col h-[700px]"
                                >
                                    <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-100">
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-800">
                                                {selectedItemForAction ? 'গ্রাম আপডেট করুন' : 'গ্রামের তথ্য যোগ করুন'}
                                            </h2>
                                            <p className="text-xs font-bold text-slate-400 mt-1">{selectedWard?.name_bn} এর অন্তর্ভুক্ত</p>
                                        </div>
                                        <button onClick={() => setIsWardModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-50">
                                            <X size={24} className="text-slate-400" />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50">
                                        <form 
                                            onSubmit={async (e) => {
                                                e.preventDefault();
                                                setSubmitting(true);
                                                try {
                                                    if (selectedItemForAction && selectedItemForAction.type === 'village') {
                                                        const result = await adminService.updateLocation(selectedItemForAction.id, {
                                                            name_bn: newVillage.name_bn,
                                                            name_en: newVillage.name_en,
                                                            stats: {
                                                                ...(selectedItemForAction.stats || {}),
                                                                ...newVillage.stats
                                                            }
                                                        });
                                                        console.log("Village update result:", result);
                                                        // Optimistic update
                                                        setDisplayItems(prev => prev.map(item => item.id === selectedItemForAction.id ? { ...item, ...newVillage } : item));
                                                        alert("গ্রাম সফলভাবে আপডেট হয়েছে।");
                                                    } else {
                                                        const parent = navigationPath[navigationPath.length - 1];
                                                        const parentSlug = parent?.slug || 'ward';
                                                        const slug = `${parentSlug}-${newVillage.name_en.toLowerCase().replace(/\s+/g, '-')}`;
                                                        
                                                        const result = await adminService.createLocation({
                                                            name_bn: newVillage.name_bn,
                                                            name_en: newVillage.name_en,
                                                            slug,
                                                            type: 'village',
                                                            parent_id: parent.id,
                                                            stats: newVillage.stats
                                                        });
                                                        console.log("Village create result:", result);
                                                        alert("নতুন গ্রাম যোগ হয়েছে।");
                                                    }
                                                    await loadData();
                                                    setNewVillage({ name_bn: '', name_en: '', stats: {} });
                                                    setIsWardModalOpen(false);
                                                    setSelectedItemForAction(null);
                                                } catch (err) {
                                                    console.error("Village action failed:", err);
                                                    alert("সমস্যা হয়েছে: " + err.message);
                                                } finally {
                                                    setSubmitting(false);
                                                }
                                            }} 
                                            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4"
                                        >
                                            <h3 className="text-sm font-black text-slate-800">{selectedItemForAction ? 'গ্রাম এডিট করুন' : 'নতুন গ্রাম যোগ করুন'}</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">গ্রামের নাম (বাংলা)</label>
                                                    <input 
                                                        required placeholder="নাম (বাংলা)" 
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-teal-500"
                                                        value={newVillage.name_bn}
                                                        onChange={(e) => setNewVillage({...newVillage, name_bn: e.target.value})}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">গ্রামের নাম (ইংরেজি)</label>
                                                    <input 
                                                        required placeholder="নাম (ইংরেজি)" 
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-teal-500"
                                                        value={newVillage.name_en}
                                                        onChange={(e) => setNewVillage({...newVillage, name_en: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">মোট জনসংখ্যা</label>
                                                    <input 
                                                        placeholder="মোট জনসংখ্যা" 
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-teal-500"
                                                        value={newVillage.stats?.population || ''}
                                                        onChange={(e) => setNewVillage({...newVillage, stats: {...newVillage.stats, population: e.target.value}})}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">মোট ভোটার</label>
                                                    <input 
                                                        placeholder="মোট ভোটার" 
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-teal-500"
                                                        value={newVillage.stats?.voters || ''}
                                                        onChange={(e) => setNewVillage({...newVillage, stats: {...newVillage.stats, voters: e.target.value}})}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">পুরুষ ভোটার</label>
                                                    <input 
                                                        placeholder="পুরুষ ভোটার" 
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-teal-500"
                                                        value={newVillage.stats?.maleVoters || ''}
                                                        onChange={(e) => setNewVillage({...newVillage, stats: {...newVillage.stats, maleVoters: e.target.value}})}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">মহিলা ভোটার</label>
                                                    <input 
                                                        placeholder="মহিলা ভোটার" 
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-teal-500"
                                                        value={newVillage.stats?.femaleVoters || ''}
                                                        onChange={(e) => setNewVillage({...newVillage, stats: {...newVillage.stats, femaleVoters: e.target.value}})}
                                                    />
                                                </div>
                                            </div>

                                            {/* Institutional Names List Management */}
                                            <div className="p-6 rounded-[24px] bg-slate-50 space-y-6">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">প্রতিষ্ঠানের নামের তালিকা</h4>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <InstitutionListManager 
                                                        label="স্কুলসমূহ" 
                                                        icon={<School size={12} />}
                                                        items={Array.isArray(newVillage.stats?.schools) ? newVillage.stats.schools : []}
                                                        onUpdate={(items) => setNewVillage({...newVillage, stats: {...newVillage.stats, schools: items}})}
                                                        placeholder="স্কুলের নাম লিখে এন্টার দিন"
                                                    />
                                                    <InstitutionListManager 
                                                        label="মসজিদসমূহ" 
                                                        icon={<Building2 size={12} />}
                                                        items={Array.isArray(newVillage.stats?.mosques) ? newVillage.stats.mosques : []}
                                                        onUpdate={(items) => setNewVillage({...newVillage, stats: {...newVillage.stats, mosques: items}})}
                                                        placeholder="মসজিদের নাম লিখে এন্টার দিন"
                                                    />
                                                    <InstitutionListManager 
                                                        label="মাদ্রাসাসমূহ" 
                                                        icon={<BookOpen size={12} />}
                                                        items={Array.isArray(newVillage.stats?.madrassas) ? newVillage.stats.madrassas : []}
                                                        onUpdate={(items) => setNewVillage({...newVillage, stats: {...newVillage.stats, madrassas: items}})}
                                                        placeholder="মাদ্রাসার নাম লিখে এন্টার দিন"
                                                    />
                                                    <InstitutionListManager 
                                                        label="এতিমখানাসমূহ" 
                                                        icon={<Home size={12} />}
                                                        items={Array.isArray(newVillage.stats?.orphanages) ? newVillage.stats.orphanages : []}
                                                        onUpdate={(items) => setNewVillage({...newVillage, stats: {...newVillage.stats, orphanages: items}})}
                                                        placeholder="এতিমখানার নাম লিখে এন্টার দিন"
                                                    />
                                                </div>
                                            </div>

                                            <button 
                                                disabled={submitting}
                                                type="submit" 
                                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-teal-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                                            >
                                                {submitting ? 'সেভ হচ্ছে...' : (selectedItemForAction ? 'আপডেট নিশ্চিত করুন' : 'গ্রামটি নিশ্চিত করুন')}
                                            </button>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}


        </div>
    );
}

// Helper component for managing list of names
function InstitutionListManager({ label, icon, items, onUpdate, placeholder }) {
    const [inputValue, setInputValue] = useState('');
    const safeItems = Array.isArray(items) ? items : [];

    const addItem = () => {
        if (!inputValue.trim()) return;
        if (safeItems.includes(inputValue.trim())) {
            setInputValue('');
            return;
        }
        onUpdate([...safeItems, inputValue.trim()]);
        setInputValue('');
    };

    const removeItem = (index) => {
        onUpdate(safeItems.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                {icon} {label}
            </label>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    className="flex-1 p-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none focus:border-teal-500 transition-all"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addItem();
                        }
                    }}
                />
                <button 
                    onClick={(e) => { e.preventDefault(); addItem(); }}
                    className="p-2.5 rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-all shadow-md shadow-teal-500/10"
                >
                    <Plus size={18} />
                </button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-xl border border-dashed border-slate-200 bg-white/50">
                {safeItems.length === 0 && <p className="text-[10px] font-bold text-slate-300 m-auto">কোনো নাম যোগ করা হয়নি</p>}
                {safeItems.map((item, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-[11px] font-black border border-teal-100 group">
                        {item}
                        <button 
                            onClick={(e) => { e.preventDefault(); removeItem(idx); }}
                            className="text-teal-400 hover:text-rose-500 transition-colors"
                        >
                            <X size={12} />
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
}

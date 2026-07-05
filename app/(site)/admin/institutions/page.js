'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { 
    School, Search, Plus, MapPin, 
    ExternalLink, Edit3, Trash2, Loader2,
    Filter, GraduationCap, Landmark, 
    Home, Building2, LayoutGrid, LayoutList,
    Activity, Copy, Globe2, Power
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as hierarchyService from '@/lib/services/hierarchyService';
import { adminService } from '@/lib/services/adminService';
import { institutionService } from '@/lib/services/institutionService';
import { INSTITUTION_PROFILES, INSTITUTION_PROFILE_OPTIONS } from '@/lib/constants/institutionProfiles';
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
    const [wards, setWards] = useState([]);
    const [villages, setVillages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingInstitution, setEditingInstitution] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'mosque',
        category: 'mosque',
        location_id: '',
        ward_id: '',
        village_location_id: '',
        village: '',
        subdomain: '',
        custom_domain: '',
        portal_features: INSTITUTION_PROFILES.mosque.features,
        operational_settings: {}
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
            const created = await institutionService.addInstitution(formData);
            setShowAddModal(false);
            setFormData({
                name: '',
                type: 'mosque',
                category: 'mosque',
                location_id: '',
                ward_id: '',
                village_location_id: '',
                village: '',
                subdomain: '',
                custom_domain: '',
                portal_features: INSTITUTION_PROFILES.mosque.features,
                operational_settings: {}
            });
            loadData();
            alert(`প্রতিষ্ঠান তৈরি হয়েছে। Website: http://${created.subdomain}.localhost:3000`);
        } catch (err) {
            alert('সংরক্ষণ করতে সমস্যা হয়েছে।');
        }
    };

    const openEditModal = async (institution) => {
        const unionId = institution.location_id || '';
        const loadedWards = unionId ? await hierarchyService.getChildLocationsByType(unionId, 'ward') : [];
        const villageLocation = institution.village_location_id
            ? await hierarchyService.getLocationPath(institution.village_location_id)
            : null;
        const inferredWard = villageLocation?.parent_id
            ? loadedWards.find((ward) => ward.id === villageLocation.parent_id)
            : null;
        const loadedVillages = inferredWard
            ? await hierarchyService.getChildLocationsByType(inferredWard.id, 'village')
            : [];

        setWards(loadedWards);
        setVillages(loadedVillages);
        setFormData({
            name: institution.name || '',
            type: institution.type || 'school',
            category: institution.category || institution.type || 'school',
            location_id: unionId,
            ward_id: inferredWard?.id || '',
            village_location_id: institution.village_location_id || '',
            village: institution.village || '',
            subdomain: institution.subdomain || '',
            custom_domain: institution.custom_domain || '',
            portal_features: institution.portal_features || INSTITUTION_PROFILES[institution.category]?.features || [],
            operational_settings: institution.operational_settings || INSTITUTION_PROFILES[institution.category]?.academicSettings || {}
        });
        setEditingInstitution(institution);
        setShowAddModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingInstitution) {
                await institutionService.updateInstitution(editingInstitution.id, formData);
                alert('প্রতিষ্ঠান আপডেট হয়েছে।');
            } else {
                const created = await institutionService.addInstitution(formData);
                alert(`প্রতিষ্ঠান তৈরি হয়েছে। Website: http://${created.subdomain}.localhost:3000`);
            }

            setShowAddModal(false);
            setEditingInstitution(null);
            setFormData({
                name: '',
                type: 'mosque',
                category: 'mosque',
                location_id: '',
                ward_id: '',
                village_location_id: '',
                village: '',
                subdomain: '',
                custom_domain: '',
                portal_features: INSTITUTION_PROFILES.mosque.features,
                operational_settings: {}
            });
            loadData();
        } catch (err) {
            alert(editingInstitution ? 'আপডেট করতে সমস্যা হয়েছে।' : 'সংরক্ষণ করতে সমস্যা হয়েছে।');
        }
    };

    const handleDelete = async (institution) => {
        const confirmed = window.confirm(`"${institution.name}" মুছে ফেলতে চান? এই প্রতিষ্ঠানের website ও portal data-ও মুছে যেতে পারে।`);
        if (!confirmed) return;

        try {
            await institutionService.deleteInstitution(institution.id);
            setInstitutions((current) => current.filter((item) => item.id !== institution.id));
        } catch (err) {
            alert('প্রতিষ্ঠান মুছতে সমস্যা হয়েছে।');
        }
    };

    const toggleWebsiteStatus = async (institution) => {
        try {
            const nextStatus = institution.website_status === 'paused' ? 'active' : 'paused';
            const updated = await institutionService.updateWebsiteStatus(institution.id, nextStatus);
            setInstitutions((current) => current.map((item) => item.id === institution.id ? updated : item));
        } catch (err) {
            alert('Website status বদলাতে সমস্যা হয়েছে।');
        }
    };

    const handleDuplicate = async (institution) => {
        try {
            const duplicated = await institutionService.duplicateInstitution(institution);
            setInstitutions((current) => [...current, duplicated]);
        } catch (err) {
            alert('Duplicate করতে সমস্যা হয়েছে। একই subdomain থাকলে পরে rename করতে হবে।');
        }
    };

    const suggestSubdomain = (name) => name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 40);

    const handleUnionChange = async (unionId) => {
        setFormData((current) => ({
            ...current,
            location_id: unionId,
            ward_id: '',
            village_location_id: '',
            village: ''
        }));
        setVillages([]);
        setWards(unionId ? await hierarchyService.getChildLocationsByType(unionId, 'ward') : []);
    };

    const handleWardChange = async (wardId) => {
        setFormData((current) => ({
            ...current,
            ward_id: wardId,
            village_location_id: '',
            village: ''
        }));
        setVillages(wardId ? await hierarchyService.getChildLocationsByType(wardId, 'village') : []);
    };

    const handleVillageChange = (villageId) => {
        const village = villages.find((item) => item.id === villageId);
        setFormData((current) => ({
            ...current,
            village_location_id: villageId,
            village: village?.name_bn || ''
        }));
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
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
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
                                    
                                    <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-500 group-hover:bg-teal-600 group-hover:text-white transition-all duration-500 flex items-center justify-center shadow-inner">
                                            <Icon size={32} />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => toggleWebsiteStatus(inst)} className={`p-2.5 rounded-xl transition-all ${inst.website_status === 'paused' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`} title={inst.website_status === 'paused' ? 'চালু করুন' : 'Pause করুন'}>
                                                <Power size={18} />
                                            </button>
                                            <button onClick={() => handleDuplicate(inst)} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" title="Duplicate">
                                                <Copy size={18} />
                                            </button>
                                            <button onClick={() => openEditModal(inst)} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all" title="এডিট">
                                                <Edit3 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(inst)} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all" title="মুছুন">
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

                                        <div className="space-y-4 border-t border-slate-50 pt-4">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">সাবডোমেইন</span>
                                                <span className="text-sm font-black text-slate-700">{inst.subdomain || '---'}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                                <a 
                                                    href={inst.custom_domain ? `https://${inst.custom_domain}` : `http://${inst.subdomain}.localhost:3000`} 
                                                    target="_blank"
                                                    className="flex min-w-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-black text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-teal-600 active:scale-95"
                                                >
                                                    Website
                                                    <ExternalLink size={14} />
                                                </a>
                                                <a
                                                    href={inst.type === 'mosque' ? `/m/${inst.id}/admin` : `/school/${inst.id}/admin`}
                                                    className="flex min-w-0 items-center justify-center gap-2 rounded-xl bg-teal-50 px-4 py-3 text-xs font-black text-teal-700 transition-all hover:bg-teal-100"
                                                >
                                                    Portal
                                                </a>
                                                <a
                                                    href={inst.type === 'mosque' ? `/m/${inst.id}/admin` : `/school/${inst.id}/admin?tab=website`}
                                                    className="col-span-2 flex min-w-0 items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-xs font-black text-indigo-700 transition-all hover:bg-indigo-100 sm:col-span-1"
                                                >
                                                    <Globe2 size={14} />
                                                    Website CMS
                                                </a>
                                            </div>
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
                                        <button onClick={() => toggleWebsiteStatus(inst)} className={`p-2 transition-colors ${inst.website_status === 'paused' ? 'text-amber-500 hover:text-amber-700' : 'text-emerald-500 hover:text-emerald-700'}`}><Power size={18} /></button>
                                        <button onClick={() => handleDuplicate(inst)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Copy size={18} /></button>
                                        <button onClick={() => openEditModal(inst)} className="p-2 text-slate-400 hover:text-teal-600 transition-colors"><Edit3 size={18} /></button>
                                        <button onClick={() => handleDelete(inst)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Modal */}
            <ModalPortal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
                <div className="custom-scrollbar relative mx-2 max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-slate-100 bg-white p-5 shadow-2xl sm:mx-4 sm:max-h-[calc(100dvh-3rem)] sm:rounded-[40px] sm:p-10">
                    <div className="absolute top-0 right-0 p-6">
                        <button onClick={() => {
                            setShowAddModal(false);
                            setEditingInstitution(null);
                        }} className="p-3 rounded-2xl hover:bg-slate-100 transition-colors">
                            <CloseIcon size={24} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 rounded-[22px] bg-teal-50 flex items-center justify-center text-teal-600">
                            <School size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">{editingInstitution ? 'প্রতিষ্ঠান এডিট করুন' : 'নতুন প্রতিষ্ঠান যোগ করুন'}</h3>
                            <p className="text-sm font-bold text-slate-400 mt-1">{editingInstitution ? 'আগের তথ্য পরিবর্তন করে সেভ করুন' : 'সব তথ্য নির্ভুলভাবে প্রদান করুন'}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">প্রতিষ্ঠানের নাম</label>
                            <input 
                                required
                                type="text" 
                                value={formData.name}
                                onChange={e => {
                                    const name = e.target.value;
                                    setFormData((current) => ({
                                        ...current,
                                        name,
                                        subdomain: current.subdomain || suggestSubdomain(name)
                                    }));
                                }}
                                placeholder="যেমন: নওহাটা হাই স্কুল"
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 transition-all outline-none font-bold shadow-inner"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ইউনিয়ন সিলেক্ট করুন</label>
                            <select 
                                required
                                value={formData.location_id}
                                onChange={e => handleUnionChange(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 transition-all outline-none font-bold"
                            >
                                <option value="">ইউনিয়ন নির্বাচন করুন</option>
                                {unions.map(u => (
                                    <option key={u.id} value={u.id}>{u.name_bn}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ওয়ার্ড</label>
                            <select 
                                required
                                value={formData.ward_id}
                                onChange={e => handleWardChange(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 transition-all outline-none font-bold"
                            >
                                <option value="">ওয়ার্ড নির্বাচন করুন</option>
                                {wards.map((ward) => (
                                    <option key={ward.id} value={ward.id}>{ward.name_bn}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ধরণ</label>
                            <select 
                                required
                                value={formData.category}
                                onChange={e => {
                                    const profile = INSTITUTION_PROFILES[e.target.value];
                                    setFormData({
                                        ...formData,
                                        type: profile.type,
                                        category: e.target.value,
                                        portal_features: profile.features,
                                        operational_settings: profile.academicSettings || {}
                                    });
                                }}
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 transition-all outline-none font-bold"
                            >
                                {INSTITUTION_PROFILE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">চালু ফিচার</label>
                            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm font-bold text-slate-600">
                                {(formData.portal_features || []).join(', ')}
                            </div>
                        </div>

                        {formData.type !== 'mosque' && (
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">শিক্ষা পরিসর</label>
                                <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-3">
                                    <label className="space-y-2">
                                        <span className="block text-xs font-black text-slate-500">মডেল</span>
                                        <select
                                            value={formData.operational_settings?.model || 'general'}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                operational_settings: {
                                                    ...formData.operational_settings,
                                                    model: e.target.value
                                                }
                                            })}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-bold"
                                        >
                                            <option value="general">সাধারণ শিক্ষা</option>
                                            <option value="madrasa">মাদ্রাসা শিক্ষা</option>
                                        </select>
                                    </label>
                                    <label className="space-y-2">
                                        <span className="block text-xs font-black text-slate-500">শুরু শ্রেণি</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="12"
                                            value={formData.operational_settings?.start_grade ?? ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                operational_settings: {
                                                    ...formData.operational_settings,
                                                    start_grade: Number(e.target.value)
                                                }
                                            })}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-bold"
                                        />
                                    </label>
                                    <label className="space-y-2">
                                        <span className="block text-xs font-black text-slate-500">শেষ শ্রেণি</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="12"
                                            value={formData.operational_settings?.end_grade ?? ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                operational_settings: {
                                                    ...formData.operational_settings,
                                                    end_grade: Number(e.target.value)
                                                }
                                            })}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-bold"
                                        />
                                    </label>
                                </div>
                                <p className="text-xs font-bold text-slate-400">
                                    যেমন: দাখিল মাদ্রাসা ০-১০, আলিম মাদ্রাসা ০-১২, কলেজ ১১-১২। পরে class module এই range অনুযায়ী চলবে।
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">গ্রাম</label>
                            <select 
                                required
                                value={formData.village_location_id}
                                onChange={e => handleVillageChange(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 transition-all outline-none font-bold"
                            >
                                <option value="">গ্রাম নির্বাচন করুন</option>
                                {villages.map((village) => (
                                    <option key={village.id} value={village.id}>{village.name_bn}</option>
                                ))}
                            </select>
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

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">নিজস্ব ডোমেইন (ঐচ্ছিক)</label>
                            <input 
                                type="text" 
                                value={formData.custom_domain}
                                onChange={e => setFormData({...formData, custom_domain: e.target.value.trim().toLowerCase()})}
                                placeholder="যেমন: schoolname.edu.bd"
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 transition-all outline-none font-bold shadow-inner"
                            />
                            <p className="text-xs font-bold text-slate-400">ডোমেইন না থাকলে subdomain দিয়েই website চলবে। পরে custom domain যুক্ত করা যাবে।</p>
                        </div>

                        <button type="submit" className="md:col-span-2 w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-teal-600 transition-all shadow-2xl shadow-slate-200 active:scale-[0.98] mt-4 flex items-center justify-center gap-3">
                            <Save size={20} />
                            {editingInstitution ? 'প্রতিষ্ঠান আপডেট করুন' : 'প্রতিষ্ঠান তৈরি করুন'}
                        </button>
                    </form>
                </div>
            </ModalPortal>
        </div>
    );
}

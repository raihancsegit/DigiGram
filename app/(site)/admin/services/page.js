'use client';

import { useState, useEffect } from 'react';
import { 
    Zap, Shield, Globe, Users, 
    Settings, Search, Filter, Loader2,
    CheckCircle2, XCircle, MoreVertical,
    School, Activity, Sprout, Landmark, 
    MessageSquare, Fuel, ChevronLeft, ChevronRight,
    MapPin, Building2, Check, HandHeart, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '@/lib/services/adminService';
import EmergencyServiceManager from '@/components/sections/admin/EmergencyServiceManager';
import LostFoundManager from '@/components/sections/admin/LostFoundManager';
import ModalPortal from '@/components/common/ModalPortal';
import { X as CloseIcon, Phone, HelpCircle, Newspaper } from 'lucide-react';
import NewsManager from '@/components/sections/admin/NewsManager';
import DonationManager from '@/components/sections/admin/DonationManager';

const SERVICE_ICONS = {
    school: School,
    fuel: Fuel,
    agriculture: Sprout,
    health: Activity,
    ledger: Landmark,
    mosque: MessageSquare,
    'emergency-hotline': Phone,
    'lost-found': HelpCircle,
    'news-updates': Newspaper,
    'donation': HandHeart,
    'village-market': ShoppingBag
};

export default function ServiceManagementPage() {
    // Location Selection States
    const [unions, setUnions] = useState([]);
    const [upazilas, setUpazilas] = useState([]);
    const [selectedUpazila, setSelectedUpazila] = useState('all');
    const [locationSearch, setLocationSearch] = useState('');
    const [selectedUnion, setSelectedUnion] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    
    // Service States
    const [masterServices, setMasterServices] = useState([]);
    const [unionServices, setUnionServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    
    // UI States
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [activeSettingsService, setActiveSettingsService] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 9;

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [unionsData, upazilasData, mastersData] = await Promise.all([
                adminService.getLocations('union', 1, 100), // Initial batch
                adminService.getLocations('upazila', 1, 100),
                adminService.getMasterServices()
            ]);
            setUnions(unionsData.data);
            setUpazilas(upazilasData.data);
            setMasterServices(mastersData);
            
            if (unionsData.data.length > 0) {
                setSelectedUnion(unionsData.data[0]);
                await fetchUnionServices(unionsData.data[0].id);
            }
        } catch (err) {
            console.error("Failed to load services data:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnionServices = async (unionId) => {
        try {
            const data = await adminService.getUnionServices(unionId);
            setUnionServices(data);
        } catch (err) {
            console.error("Failed to fetch union services:", err);
        }
    };

    const handleUnionChange = async (union) => {
        setSelectedUnion(union);
        setLoading(true);
        await fetchUnionServices(union.id);
        setLoading(false);
        setShowLocationModal(false);
    };

    const toggleService = async (serviceId, currentActive) => {
        if (!selectedUnion) return;
        setUpdatingId(serviceId);
        try {
            await adminService.toggleService(selectedUnion.id, serviceId, !currentActive);
            await fetchUnionServices(selectedUnion.id);
        } catch (err) {
            console.error("Error toggling service:", err);
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusForService = (serviceId) => {
        const found = unionServices.find(us => us.service_id === serviceId);
        return found ? found.is_active : false;
    };

    // Filter unions based on search and upazila
    const filteredUnions = unions.filter(u => {
        const matchesSearch = u.name_bn.includes(locationSearch) || u.name_en?.toLowerCase().includes(locationSearch.toLowerCase());
        const matchesUpazila = selectedUpazila === 'all' || u.parent_id === selectedUpazila;
        return matchesSearch && matchesUpazila;
    });

    if (loading && unions.length === 0) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="text-teal-500 animate-spin mb-4" size={40} />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">সার্ভিস ডাটা লোড হচ্ছে...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-slate-800 mb-2">সেবা ব্যবস্থাপনা</h1>
                    <p className="text-slate-500 font-bold">ইউনিয়ন ভিত্তিক ডিজিটাল সার্ভিস কন্ট্রোল প্যানেল</p>
                </div>

                <div className="relative z-10 flex flex-col items-end gap-2">
                    <button 
                        onClick={() => setShowLocationModal(true)}
                        className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-sm hover:bg-teal-600 transition-all shadow-lg active:scale-95 group"
                    >
                        <Globe size={18} className="group-hover:rotate-12 transition-transform" />
                        {selectedUnion ? selectedUnion.name_bn : 'ইউনিয়ন সিলেক্ট করুন'}
                        <ChevronRight size={16} className="ml-2 opacity-50" />
                    </button>
                    {selectedUnion && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                            <MapPin size={10} />
                            সিস্টেম আইডি: {selectedUnion.id.substring(0,8)}
                        </span>
                    )}
                </div>
            </div>

            {/* Service Grid Section */}
            {selectedUnion ? (
                <div className="space-y-8">
                    <div className="flex items-center gap-4 px-4">
                        <div className="w-1.5 h-8 bg-teal-500 rounded-full" />
                        <h2 className="text-xl font-black text-slate-800">
                            <span className="text-teal-600">{selectedUnion.name_bn}</span> ইউনিয়নের জন্য সক্রিয় সার্ভিসসমূহ
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {masterServices.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((service, idx) => {
                            const isActive = getStatusForService(service.id);
                            const Icon = SERVICE_ICONS[service.slug] || Zap;
                            const isUpdating = updatingId === service.id;

                            return (
                                <motion.div
                                    key={service.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`relative overflow-hidden rounded-[28px] border transition-all duration-500 group ${
                                        isActive 
                                        ? 'bg-white border-teal-500/20 shadow-lg shadow-teal-500/5' 
                                        : 'bg-slate-50/50 border-slate-200 grayscale opacity-70'
                                    }`}
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                                isActive ? 'bg-teal-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'
                                            }`}>
                                                <Icon size={24} />
                                            </div>

                                            <button 
                                                onClick={() => toggleService(service.id, isActive)}
                                                disabled={isUpdating}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                    isActive ? 'bg-teal-600' : 'bg-slate-300'
                                                }`}
                                            >
                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                                                    isActive ? 'translate-x-5' : 'translate-x-0'
                                                }`} />
                                                {isUpdating && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-full">
                                                        <Loader2 size={10} className="animate-spin text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        </div>

                                        <div className="space-y-1.5">
                                            <h3 className="text-lg font-black text-slate-800 tracking-tight">{service.name}</h3>
                                            <p className="text-[12px] font-bold text-slate-400 leading-snug line-clamp-2">
                                                {service.name_bn || 'এই ফিচারের বিস্তারিত বিবরণ এখানে দেখা যাবে।'}
                                            </p>
                                        </div>

                                        <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                isActive ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-teal-500 animate-pulse' : 'bg-slate-300'}`} />
                                                {isActive ? 'Active' : 'Inactive'}
                                            </div>

                                            <button 
                                                onClick={() => {
                                                    setActiveSettingsService(service);
                                                    setShowSettingsModal(true);
                                                }}
                                                className={`p-2 rounded-xl transition-all ${
                                                    isActive ? 'text-teal-600 hover:bg-teal-50 border border-teal-100' : 'text-slate-300 pointer-events-none border border-transparent'
                                                }`}
                                            >
                                                <Settings size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Pagination Controls */}
                    {masterServices.length > ITEMS_PER_PAGE && (
                        <div className="flex items-center justify-center gap-2 mt-12 bg-white w-fit mx-auto p-2 rounded-3xl border border-slate-100 shadow-sm">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-teal-600 disabled:opacity-30 transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="flex gap-1">
                                {Array.from({ length: Math.ceil(masterServices.length / ITEMS_PER_PAGE) }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-10 h-10 rounded-2xl font-black text-sm transition-all ${
                                            currentPage === i + 1 
                                            ? 'bg-teal-600 text-white shadow-lg' 
                                            : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(masterServices.length / ITEMS_PER_PAGE), p + 1))}
                                disabled={currentPage === Math.ceil(masterServices.length / ITEMS_PER_PAGE)}
                                className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-teal-600 disabled:opacity-30 transition-all"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="py-20 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm">
                    <Globe size={64} className="mx-auto text-slate-200 mb-6" />
                    <h3 className="text-xl font-black text-slate-800 mb-2">কোনো ইউনিয়ন সিলেক্ট করা নেই</h3>
                    <p className="text-slate-500 font-bold mb-8">সেবা ম্যানেজ করার জন্য প্রথমে একটি ইউনিয়ন সিলেক্ট করুন।</p>
                    <button 
                        onClick={() => setShowLocationModal(true)}
                        className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-teal-600 transition-all shadow-lg active:scale-95"
                    >
                        ইউনিয়ন লিস্ট দেখুন
                    </button>
                </div>
            )}

            {/* Service Settings Modal */}
            <ModalPortal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)}>
                <div className="bg-slate-50 rounded-[40px] p-2 md:p-10 max-w-4xl w-full mx-4 border border-slate-200 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="sticky top-0 right-0 flex justify-end z-10">
                        <button onClick={() => setShowSettingsModal(false)} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors">
                            <CloseIcon size={24} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="mb-8 px-4">
                        <h2 className="text-2xl font-black text-slate-800">{activeSettingsService?.name} - সেটিংস</h2>
                        <p className="text-sm font-bold text-slate-400 mt-1">{selectedUnion?.name_bn} ইউনিয়নের জন্য ডাটা ম্যানেজ করুন</p>
                    </div>

                    <div className="bg-white rounded-[32px] p-6 border border-slate-200">
                        {activeSettingsService?.slug === 'emergency-hotline' ? (
                            <EmergencyServiceManager locationId={selectedUnion?.id} isAdmin={true} />
                        ) : activeSettingsService?.slug === 'lost-found' ? (
                            <LostFoundManager locationId={selectedUnion?.id} isAdmin={true} />
                        ) : activeSettingsService?.slug === 'news-updates' ? (
                            <NewsManager locationId={selectedUnion?.id} isAdmin={true} />
                        ) : (activeSettingsService?.slug === 'donation' || activeSettingsService?.slug === 'donation-portal') ? (
                            <DonationManager unionSlug={selectedUnion?.slug} locationId={selectedUnion?.id} />
                        ) : (
                            <div className="py-20 text-center">
                                <Settings size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-400 font-bold">এই সার্ভিসের জন্য অতিরিক্ত কোনো সেটিংস প্রয়োজন নেই।</p>
                            </div>
                        )}
                    </div>
                </div>
            </ModalPortal>

            {/* Location Selector Modal */}
            <ModalPortal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)}>
                <div className="bg-white rounded-[48px] shadow-2xl relative z-[1001] w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <div className="p-10 pb-6 flex items-center justify-between shrink-0 bg-white border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-sm">
                                <Globe size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">ইউনিয়ন সিলেক্ট করুন</h2>
                                <p className="text-xs font-bold text-slate-400 mt-1">যে এলাকার সার্ভিস ম্যানেজ করতে চান সেটি খুঁজে বের করুন</p>
                            </div>
                        </div>
                        <button onClick={() => setShowLocationModal(false)} className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                            <CloseIcon size={24} />
                        </button>
                    </div>

                    <div className="p-10 pt-6 space-y-6 flex-1 overflow-hidden flex flex-col">
                        {/* Filters */}
                        <div className="flex flex-col md:flex-row gap-4 shrink-0">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="ইউনিয়নের নাম দিয়ে খুঁজুন..."
                                    value={locationSearch}
                                    onChange={(e) => setLocationSearch(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                                />
                            </div>
                            <div className="relative md:w-64">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select 
                                    value={selectedUpazila}
                                    onChange={(e) => setSelectedUpazila(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none appearance-none cursor-pointer"
                                >
                                    <option value="all">সকল উপজেলা</option>
                                    {upazilas.map(up => (
                                        <option key={up.id} value={up.id}>{up.name_bn}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {filteredUnions.length === 0 ? (
                                    <div className="col-span-full py-20 text-center text-slate-400">
                                        <Globe size={40} className="mx-auto mb-4 opacity-20" />
                                        <p className="font-bold">কোনো ইউনিয়ন পাওয়া যায়নি</p>
                                    </div>
                                ) : filteredUnions.map((union) => {
                                    const isSelected = selectedUnion?.id === union.id;
                                    const parentUpazila = upazilas.find(up => up.id === union.parent_id);
                                    
                                    return (
                                        <button
                                            key={union.id}
                                            onClick={() => handleUnionChange(union)}
                                            className={`p-5 rounded-[28px] border-2 transition-all flex items-center justify-between group text-left ${
                                                isSelected 
                                                ? 'bg-teal-600 border-teal-600 text-white shadow-xl shadow-teal-600/20' 
                                                : 'bg-white border-slate-100 hover:border-teal-500/30 hover:bg-slate-50 shadow-sm'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600'}`}>
                                                    <Building2 size={20} />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-black leading-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>{union.name_bn}</p>
                                                    <p className={`text-[10px] font-bold uppercase mt-0.5 tracking-wider ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                                                        {parentUpazila?.name_bn || 'উপজেলা অজানা'}
                                                    </p>
                                                </div>
                                            </div>
                                            {isSelected && <Check size={20} className="text-white" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50 border-t border-slate-100 text-center shrink-0">
                        <p className="text-xs font-bold text-slate-400">মোট {filteredUnions.length} টি ইউনিয়ন পাওয়া গেছে</p>
                    </div>
                </div>
            </ModalPortal>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Droplet, Search, MapPin, Phone, Users, 
    Filter, ChevronRight, Loader2, Heart, 
    ArrowRight, Globe, ShieldCheck, Zap, Info,
    X, PhoneCall, MessageCircle, Navigation, Calendar
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { bloodBankService } from '@/lib/services/bloodBankService';
import { getDistricts, getChildLocationsByType, getLocationBySlug } from '@/lib/services/hierarchyService';
import { supabase } from '@/lib/utils/supabase';
import { toBnDigits } from '@/lib/utils/format';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodBankClient() {
    const [donors, setDonors] = useState([]);
    const [stats, setStats] = useState({ total: 0 });
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 20;

    // Filters
    const [filters, setFilters] = useState({
        bloodGroup: '',
        unionId: '',
        wardId: '',
        villageId: '',
        searchQuery: ''
    });

    // Hierarchy Data
    const [unions, setUnions] = useState([]);
    const [wards, setWards] = useState([]);
    const [villages, setVillages] = useState([]);

    const searchParams = useSearchParams();
    const unionSlug = searchParams.get('u');

    // Initial Load
    useEffect(() => {
        loadInitialData();
        if (unionSlug) {
            handleAutoSelectUnion(unionSlug);
        }
    }, [unionSlug]);

    const handleAutoSelectUnion = async (slug) => {
        try {
            const unionData = await getLocationBySlug(slug);
            if (unionData) {
                setFilters(f => ({ ...f, unionId: unionData.id }));
                const wardData = await getChildLocationsByType(unionData.id, 'ward');
                setWards(wardData);
            }
        } catch (err) {
            console.error("Auto-select union failed:", err);
        }
    };

    // Load Donors when filters or page change
    useEffect(() => {
        const delay = setTimeout(() => {
            loadDonors();
        }, 300);
        return () => clearTimeout(delay);
    }, [filters.bloodGroup, filters.unionId, filters.wardId, filters.villageId, filters.searchQuery, page]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [filters.bloodGroup, filters.unionId, filters.wardId, filters.villageId, filters.searchQuery]);

    // Load Unions
    const loadInitialData = async () => {
        try {
            const { data: unionData } = await supabase
                .from('locations')
                .select('id, name_bn, name_en')
                .eq('type', 'union')
                .order('name_bn', { ascending: true });
            setUnions(unionData || []);
            
            const statData = await bloodBankService.getStats();
            setStats(statData);
        } catch (err) {
            console.error("Failed to load hierarchy:", err);
        }
    };

    const loadDonors = async () => {
        setSearching(true);
        try {
            const { donors: data, totalCount: total } = await bloodBankService.getDonors(filters, page, pageSize);
            
            // Client-side search for name/location if search query exists
            let result = data || [];
            if (filters.searchQuery) {
                const q = filters.searchQuery.toLowerCase();
                result = result.filter(d => 
                    d.name.toLowerCase().includes(q) || 
                    d.household?.village?.bn_name?.toLowerCase().includes(q) ||
                    d.household?.ward?.name_bn?.toLowerCase().includes(q)
                );
            }
            
            setDonors(result);
            setTotalCount(total);
        } catch (err) {
            console.error("Failed to load donors:", err);
        } finally {
            setSearching(false);
            setLoading(false);
        }
    };

    // Handle Location Changes
    const handleUnionChange = async (id) => {
        setFilters(f => ({ ...f, unionId: id, wardId: '', villageId: '' }));
        if (id) {
            const wardData = await getChildLocationsByType(id, 'ward');
            setWards(wardData);
        } else {
            setWards([]);
            setVillages([]);
        }
    };

    const handleWardChange = async (id) => {
        setFilters(f => ({ ...f, wardId: id, villageId: '' }));
        if (id) {
            const villageData = await getChildLocationsByType(id, 'village');
            setVillages(villageData);
        } else {
            setVillages([]);
        }
    };

    const DonorCard = ({ donor }) => (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-rose-100 transition-all duration-500 overflow-hidden"
        >
            {/* Background Glow */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
            
            <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner group-hover:bg-rose-600 group-hover:text-white transition-all duration-500">
                        <Droplet size={28} className="animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-800 leading-tight group-hover:text-rose-700 transition-colors">{donor.name}</h4>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                {donor.gender === 'Male' ? 'পুরুষ' : donor.gender === 'Female' ? 'নারী' : 'অন্যান্য'}
                            </span>
                            {donor.dob && (
                                <span className="text-[10px] font-bold text-slate-400">
                                    {toBnDigits(new Date().getFullYear() - new Date(donor.dob).getFullYear())} বছর
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-rose-200">
                        {donor.blood_group}
                    </div>
                </div>
            </div>

            <div className="space-y-3 mb-8 relative z-10">
                <div className="flex items-center gap-3 text-slate-500">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <MapPin size={14} className="text-slate-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">অবস্থান</p>
                        <p className="text-xs font-bold truncate">
                            {donor.household?.village?.bn_name || 'অজানা গ্রাম'}, {donor.household?.ward?.name_bn || 'অজানা ওয়ার্ড'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <Globe size={14} className="text-slate-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ইউনিয়ন</p>
                        <p className="text-xs font-bold truncate">{donor.household?.ward?.parent?.name_bn || 'অজানা ইউনিয়ন'}</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 relative z-10">
                <a 
                    href={`tel:${donor.household?.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg hover:scale-[1.02] active:scale-95"
                >
                    <PhoneCall size={14} /> কল করুন
                </a>
                <a 
                    href={`https://wa.me/88${donor.household?.phone}`}
                    className="w-12 h-12 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
                >
                    <MessageCircle size={20} />
                </a>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Hero Section */}
            <div className="relative pt-12 pb-24 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.05),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.05),transparent_50%)]" />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-3xl">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 text-rose-600 mb-6"
                        >
                            <Heart size={14} fill="currentColor" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">জীবন বাঁচান, রক্ত দিন</span>
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-black text-slate-900 leading-[0.9] tracking-tight mb-6"
                        >
                            ডিজিগ্রাম <span className="text-rose-600">ব্লাড ব্যাংক</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-slate-500 font-bold max-w-xl leading-relaxed"
                        >
                            আপনার ইউনিয়নে এবং গ্রামের ভেরিফাইড রক্তদাতাদের ডিজিটাল তালিকা। বিপদের সময় দ্রুত ও সহজে রক্তদাতা খুঁজে পেতে আমরা আছি আপনার পাশে।
                        </motion.p>
                    </div>

                    {/* Stats Grid */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3 mt-16"
                    >
                        <div className="col-span-2 lg:col-span-1 p-4 rounded-[24px] bg-white border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট দাতা</p>
                            <p className="text-2xl font-black text-slate-900">{toBnDigits(stats.total.toString())}</p>
                        </div>
                        {BLOOD_GROUPS.map((group) => (
                            <div 
                                key={group}
                                onClick={() => setFilters(f => ({ ...f, bloodGroup: f.bloodGroup === group ? '' : group }))}
                                className={`p-4 rounded-[24px] border cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center group ${
                                    filters.bloodGroup === group 
                                    ? 'bg-rose-600 border-rose-600 text-white shadow-xl shadow-rose-200' 
                                    : 'bg-white border-slate-100 hover:border-rose-300 text-slate-900'
                                }`}
                            >
                                <p className={`text-base font-black mb-1 ${filters.bloodGroup === group ? 'text-white' : 'text-slate-800'}`}>{group}</p>
                                <p className={`text-[10px] font-bold ${filters.bloodGroup === group ? 'text-rose-100' : 'text-rose-500'}`}>
                                    {toBnDigits((stats[group] || 0).toString())} জন
                                </p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Filter & Results Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-10">
                    {/* Filter Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                value={filters.searchQuery}
                                onChange={(e) => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
                                placeholder="দাতার নাম বা এলাকা খুঁজুন..."
                                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] outline-none focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/5 transition-all font-bold text-slate-700"
                            />
                        </div>
                        
                        <select 
                            value={filters.unionId}
                            disabled={!!unionSlug}
                            onChange={(e) => handleUnionChange(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] outline-none focus:bg-white focus:border-rose-400 transition-all font-bold text-slate-700 appearance-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <option value="">সকল ইউনিয়ন</option>
                            {unions.map(u => <option key={u.id} value={u.id}>{u.name_bn}</option>)}
                        </select>

                        <select 
                            value={filters.wardId}
                            disabled={!filters.unionId}
                            onChange={(e) => handleWardChange(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] outline-none focus:bg-white focus:border-rose-400 transition-all font-bold text-slate-700 appearance-none cursor-pointer disabled:opacity-50"
                        >
                            <option value="">সকল ওয়ার্ড</option>
                            {wards.map(w => <option key={w.id} value={w.id}>{w.name_bn} নং ওয়ার্ড</option>)}
                        </select>

                        <select 
                            value={filters.villageId}
                            disabled={!filters.wardId}
                            onChange={(e) => setFilters(f => ({ ...f, villageId: e.target.value }))}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] outline-none focus:bg-white focus:border-rose-400 transition-all font-bold text-slate-700 appearance-none cursor-pointer disabled:opacity-50"
                        >
                            <option value="">সকল গ্রাম</option>
                            {villages.map(v => <option key={v.id} value={v.id}>{v.name_bn}</option>)}
                        </select>
                    </div>

                    {/* Results Grid */}
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center text-rose-500">
                            <Loader2 className="animate-spin mb-4" size={48} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">রক্তদাতা খোঁজা হচ্ছে...</p>
                        </div>
                    ) : donors.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between mb-8 px-2">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                    মোট <span className="text-rose-600">{toBnDigits(donors.length.toString())} জন</span> রক্তদাতা পাওয়া গেছে
                                </p>
                                {filters.bloodGroup && (
                                    <button 
                                        onClick={() => setFilters(f => ({ ...f, bloodGroup: '' }))}
                                        className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline flex items-center gap-2"
                                    >
                                        ফিল্টার মুছুন <X size={12} />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {donors.map((donor) => (
                                        <DonorCard key={donor.id} donor={donor} />
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Pagination Controls */}
                            {totalCount > pageSize && (
                                <div className="mt-16 flex flex-col items-center justify-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <button 
                                            disabled={page === 1}
                                            onClick={() => setPage(p => p - 1)}
                                            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-rose-600 hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-500 transition-all shadow-sm active:scale-95"
                                        >
                                            <ArrowRight size={20} className="rotate-180" />
                                        </button>
                                        
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                const totalPages = Math.ceil(totalCount / pageSize);
                                                return Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                    // Simple page numbering logic
                                                    let pageNum = i + 1;
                                                    if (totalPages > 5 && page > 3) {
                                                        pageNum = page - 2 + i;
                                                        if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                                    }
                                                    if (pageNum <= 0) return null;
                                                    if (pageNum > totalPages) return null;

                                                    return (
                                                        <button 
                                                            key={pageNum}
                                                            onClick={() => setPage(pageNum)}
                                                            className={`w-12 h-12 rounded-2xl font-black text-sm transition-all ${
                                                                page === pageNum 
                                                                ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' 
                                                                : 'bg-white border border-slate-100 text-slate-500 hover:border-rose-300'
                                                            }`}
                                                        >
                                                            {toBnDigits(pageNum.toString())}
                                                        </button>
                                                    );
                                                });
                                            })()}
                                        </div>

                                        <button 
                                            disabled={page * pageSize >= totalCount}
                                            onClick={() => setPage(p => p + 1)}
                                            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-rose-600 hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-500 transition-all shadow-sm active:scale-95"
                                        >
                                            <ArrowRight size={20} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        পৃষ্ঠা {toBnDigits(page.toString())} (মোট {toBnDigits(Math.ceil(totalCount / pageSize).toString())})
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="py-24 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
                                <Search size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">কোনো রক্তদাতা পাওয়া যায়নি</h3>
                            <p className="text-slate-400 font-bold max-w-sm">আপনার অনুসন্ধান ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন অথবা আমাদের কল সেন্টারে যোগাযোগ করুন।</p>
                            <button 
                                onClick={() => setFilters({ bloodGroup: '', unionId: '', wardId: '', villageId: '', searchQuery: '' })}
                                className="mt-8 px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all"
                            >রিসেট ফিল্টার</button>
                        </div>
                    )}
                </div>

                {/* Important Notice */}
                <div className="mt-12 p-8 rounded-[32px] bg-indigo-900 text-white relative overflow-hidden group">
                    <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 group-hover:translate-x-5 group-hover:translate-y-5 transition-transform duration-700">
                        <ShieldCheck size={200} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                            <Info size={32} className="text-indigo-300" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black mb-2">নিরাপদ রক্ত দান ও সতর্কতা</h4>
                            <p className="text-sm font-bold text-indigo-100/80 leading-relaxed max-w-3xl">
                                রক্ত আদান-প্রদানের ক্ষেত্রে অবশ্যই দক্ষ চিকিৎসক বা ল্যাবরেটরিতে রক্ত পরীক্ষা করে নিন। ডিজিগ্রাম শুধুমাত্র রক্তদাতাদের তালিকা প্রদান করে। কোনো প্রকার আর্থিক লেনদেন বা ব্যক্তিগত ঝুঁকির জন্য ডিজিগ্রাম কর্তৃপক্ষ দায়ী থাকবে না।
                            </p>
                        </div>
                        <div className="md:ml-auto">
                            <button className="px-6 py-3 bg-white text-indigo-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-400 transition-all">গাইডলাইন দেখুন</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
    Activity, RefreshCw, CheckCircle, Clock, Home, Users, MapPin, Loader2, AlertTriangle, Filter, X
} from 'lucide-react';
import { householdService } from '@/lib/services/householdService';
import { adminService } from '@/lib/services/adminService';
import { toBnDigits } from '@/lib/utils/format';

export default function DataSyncPage() {
    const [villages, setVillages] = useState([]);
    const [unions, setUnions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncingId, setSyncingId] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    // Filters
    const [filterUnion, setFilterUnion] = useState('');
    const [filterWard, setFilterWard] = useState('');
    const [filterVillage, setFilterVillage] = useState('');

    useEffect(() => {
        loadVillages();
    }, []);

    const loadVillages = async () => {
        try {
            setErrorMsg(null);
            const [vData, uData] = await Promise.all([
                householdService.getAllVillagesForSync(),
                adminService.getLocations('union', 1, 100)
            ]);
            setVillages(vData || []);
            setUnions(uData?.data || []);
        } catch (err) {
            console.error("Failed to load villages:", err);
            setErrorMsg(err.message || "Failed to load villages");
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async (village) => {
        if (!confirm(`${village.bn_name || village.name} গ্রামের ডাটা সিঙ্ক করতে চান? এটি গ্রামের ডাটা ক্যালকুলেট করে ওয়ার্ড ও ইউনিয়নে আপডেট করবে।`)) return;
        
        setSyncingId(village.id);
        try {
            // 1. Sync Village (Households -> Village)
            await householdService.syncVillageData(village.id);
            
            // 2. Sync Ward (Villages -> Ward)
            if (village.ward_id) {
                await householdService.syncWardData(village.ward_id);
            }
            
            // 3. Sync Union (Wards -> Union)
            if (village.ward?.parent_id) {
                await householdService.syncUnionData(village.ward.parent_id);
            }

            alert('ডাটা সফলভাবে সিঙ্ক হয়েছে!');
            await loadVillages();
        } catch (err) {
            console.error("Sync Error:", err);
            alert('সিঙ্ক করতে সমস্যা হয়েছে: ' + err.message);
        } finally {
            setSyncingId(null);
        }
    };

    // Filter Logic
    const availableWards = useMemo(() => {
        if (!filterUnion) return [];
        const wardsMap = new Map();
        villages.forEach(v => {
            if (v.ward && v.ward.parent_id === filterUnion) {
                wardsMap.set(v.ward.id, v.ward);
            }
        });
        return Array.from(wardsMap.values()).sort((a, b) => a.name_bn.localeCompare(b.name_bn));
    }, [villages, filterUnion]);

    const availableVillages = useMemo(() => {
        if (!filterWard) return [];
        const vMap = new Map();
        villages.forEach(v => {
            if (v.ward_id === filterWard) {
                vMap.set(v.id, v);
            }
        });
        return Array.from(vMap.values()).sort((a, b) => (a.bn_name || a.name).localeCompare(b.bn_name || b.name));
    }, [villages, filterWard]);

    const filteredVillages = useMemo(() => {
        return villages.filter(v => {
            if (filterUnion && v.ward?.parent_id !== filterUnion) return false;
            if (filterWard && v.ward_id !== filterWard) return false;
            if (filterVillage && v.id !== filterVillage) return false;
            return true;
        });
    }, [villages, filterUnion, filterWard, filterVillage]);

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center border border-teal-100 shadow-sm shrink-0">
                        <Activity size={32} className="text-teal-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 mb-2">ডাটা সিঙ্ক ও ভেরিফিকেশন</h1>
                        <p className="text-slate-500 font-bold">গ্রামের রিয়েল ডাটা ক্যালকুলেট করে ওয়ার্ড ও ইউনিয়নে সিঙ্ক করুন</p>
                    </div>
                </div>
            </div>

            {/* Warning Alert */}
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4 items-start">
                <AlertTriangle className="text-amber-500 shrink-0 mt-1" size={24} />
                <div>
                    <h4 className="text-amber-800 font-black mb-1">সতর্কতা</h4>
                    <p className="text-amber-700 text-sm font-bold leading-relaxed">
                        কোনো গ্রামের ডাটা এন্ট্রি সম্পূর্ণ শেষ হওয়ার পরই কেবল <b>Verify & Sync</b> বাটনে ক্লিক করবেন। 
                        একবার সিঙ্ক করলে ম্যানুয়াল ডাটা মুছে গিয়ে সিস্টেম সরাসরি বাড়ির আসল ডাটা (Real Data) ব্যবহার করা শুরু করবে।
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1.5 block">ইউনিয়ন নির্বাচন করুন</label>
                    <select 
                        value={filterUnion}
                        onChange={(e) => {
                            setFilterUnion(e.target.value);
                            setFilterWard('');
                            setFilterVillage('');
                        }}
                        className="w-full px-5 py-3.5 rounded-[20px] bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-700 text-sm"
                    >
                        <option value="">সকল ইউনিয়ন</option>
                        {unions.map(u => (
                            <option key={u.id} value={u.id}>{u.name_bn}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex-1 w-full">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1.5 block">ওয়ার্ড নির্বাচন করুন</label>
                    <select 
                        value={filterWard}
                        onChange={(e) => {
                            setFilterWard(e.target.value);
                            setFilterVillage('');
                        }}
                        disabled={!filterUnion}
                        className="w-full px-5 py-3.5 rounded-[20px] bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-700 text-sm disabled:opacity-50"
                    >
                        <option value="">সকল ওয়ার্ড</option>
                        {availableWards.map(w => (
                            <option key={w.id} value={w.id}>{w.name_bn}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 w-full">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1.5 block">গ্রাম নির্বাচন করুন</label>
                    <select 
                        value={filterVillage}
                        onChange={(e) => setFilterVillage(e.target.value)}
                        disabled={!filterWard}
                        className="w-full px-5 py-3.5 rounded-[20px] bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-700 text-sm disabled:opacity-50"
                    >
                        <option value="">সকল গ্রাম</option>
                        {availableVillages.map(v => (
                            <option key={v.id} value={v.id}>{v.bn_name || v.name}</option>
                        ))}
                    </select>
                </div>

                {(filterUnion || filterWard || filterVillage) && (
                    <button 
                        onClick={() => {
                            setFilterUnion('');
                            setFilterWard('');
                            setFilterVillage('');
                        }}
                        className="px-6 py-3.5 rounded-[20px] bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-sm transition-all flex items-center gap-2"
                    >
                        <X size={18} /> রিসেট
                    </button>
                )}
            </div>

            {/* List */}
            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/20">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">গ্রামের নাম ও ওয়ার্ড</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">আনুমানিক বাড়ি</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">রিয়েল ডাটা (সিঙ্কড)</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">স্ট্যাটাস</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">অ্যাকশন</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {errorMsg ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-rose-500 font-bold text-sm">
                                        Error: {errorMsg}
                                    </td>
                                </tr>
                            ) : filteredVillages.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400 font-bold text-sm">
                                        কোনো গ্রাম পাওয়া যায়নি
                                    </td>
                                </tr>
                            ) : filteredVillages.map((village) => {
                                const isVerified = village.survey_status === 'verified';
                                const realStats = village.real_stats || {};
                                return (
                                    <tr key={village.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${isVerified ? 'bg-teal-50 text-teal-600 border-teal-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                    <MapPin size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{village.bn_name || village.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{village.ward?.name_bn || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="text-sm font-black text-slate-600">{toBnDigits((village.total_estimated_houses || 0).toString())}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 w-fit mx-auto">
                                                    <Home size={12} className="text-slate-400" /> 
                                                    {toBnDigits((realStats.total_houses || 0).toString())}
                                                </div>
                                                {isVerified && (
                                                    <span className="text-[10px] text-slate-400 font-bold block mt-1">{toBnDigits((realStats.total_members || 0).toString())} সদস্য</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            {isVerified ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-200 bg-teal-50 text-teal-600">
                                                    <CheckCircle size={12} /> ভেরিফাইড
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 bg-amber-50 text-amber-600">
                                                    <Clock size={12} /> পেন্ডিং
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button 
                                                onClick={() => handleSync(village)}
                                                disabled={syncingId === village.id}
                                                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-50 min-w-[140px] ${
                                                    isVerified 
                                                    ? 'bg-white border border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-200' 
                                                    : 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 hover:bg-teal-600 hover:shadow-teal-500/30'
                                                }`}
                                            >
                                                {syncingId === village.id ? (
                                                    <><Loader2 size={16} className="animate-spin" /> সিঙ্কিং...</>
                                                ) : isVerified ? (
                                                    <><RefreshCw size={16} /> পুনরায় সিঙ্ক</>
                                                ) : (
                                                    <><Activity size={16} /> Verify & Sync</>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

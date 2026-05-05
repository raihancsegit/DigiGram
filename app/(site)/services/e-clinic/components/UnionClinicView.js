"use client";

import { useState, useEffect } from 'react';
import { clinicService } from '@/lib/services/clinicService';
import { getLocationBySlug } from '@/lib/services/hierarchyService';
import { 
    Activity, Stethoscope, Phone, Clock, 
    Calendar, MapPin, ChevronRight, AlertCircle, 
    ShieldCheck, Heart, Pill, Ambulance, Search, Loader2
} from 'lucide-react';
import { toBnDigits } from '@/lib/utils/format';

export function UnionClinicView({ unionSlug }) {
    const [doctors, setDoctors] = useState([]);
    const [ambulances, setAmbulances] = useState([]);
    const [pharmacies, setPharmacies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unionName, setUnionName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // 1. Get Union Details to get locationId
                const union = await getLocationBySlug(unionSlug);
                if (union) {
                    setUnionName(union.name_bn);
                    
                    // 2. Fetch Dynamic Data in Parallel
                    const [docData, ambData, phData] = await Promise.all([
                        clinicService.getDoctors(union.id),
                        clinicService.getAmbulances(union.id),
                        clinicService.getPharmacies(union.id)
                    ]);
                    
                    setDoctors(docData);
                    setAmbulances(ambData);
                    setPharmacies(phData);
                }
            } catch (err) {
                console.error("Clinic Data Load Error:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [unionSlug]);

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <Loader2 className="text-rose-500 animate-spin mb-4" size={48} />
                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">ক্লিনিক ডাটা লোড হচ্ছে...</p>
            </div>
        );
    }

    if (!unionName) {
        return (
            <div className="text-center py-20 bg-white rounded-[40px] shadow-sm border border-slate-100">
                <AlertCircle className="mx-auto text-rose-400 mb-4" size={48} />
                <h2 className="text-xl font-bold text-slate-800">ইউনিয়ন খুঁজে পাওয়া যায়নি</h2>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="relative overflow-hidden p-8 md:p-12 rounded-[48px] bg-gradient-to-br from-rose-600 via-rose-700 to-pink-800 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full w-fit border border-white/20">
                            <Activity size={16} className="text-rose-200" />
                            <span className="text-xs font-black uppercase tracking-widest">{unionName} ডিজিটাল হেলথ পোর্টাল</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                            স্মার্ট <span className="text-rose-200">ই-ক্লিনিক</span>
                        </h1>
                        <p className="text-rose-100/80 max-w-xl font-medium">ইউনিয়ন স্বাস্থ্যকেন্দ্রের ডাক্তার শিডিউল, টেলিমেডিসিন এবং ইমার্জেন্সি অ্যাম্বুলেন্স সেবা এক ঠিকানায়।</p>
                    </div>
                    
                    <div className="shrink-0 p-6 rounded-[32px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-200 mb-4">জরুরি টেলিমেডিসিন</p>
                        <a href="tel:16263" className="flex items-center gap-4 p-4 rounded-2xl bg-white text-rose-600 shadow-lg hover:scale-105 transition-transform">
                            <div className="p-3 rounded-full bg-rose-100">
                                <Phone size={24} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-bold text-rose-400 uppercase leading-none mb-1">স্বাস্থ্য বাতায়ন</p>
                                <p className="text-2xl font-black tracking-tighter leading-none">১৬২৬৩</p>
                            </div>
                        </a>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Doctors & Pharmacies */}
                <div className="lg:col-span-8 space-y-10">
                    
                    {/* Doctors Section */}
                    <section>
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                <Stethoscope className="text-rose-600" /> আজকের ডাক্তারগণ
                            </h2>
                            <div className="hidden sm:flex items-center gap-2 text-slate-400 text-sm font-bold">
                                <Calendar size={16} /> {today === 'Friday' ? 'আজ শুক্রবার' : 'আজকের শিডিউল'}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {doctors.length > 0 ? doctors.map(doc => {
                                const availableDays = doc.available_days || [];
                                const isAvailableToday = availableDays.includes(today) || availableDays.includes('Everyday');
                                return (
                                    <div key={doc.id} className={`group p-6 rounded-[32px] border transition-all duration-300 ${isAvailableToday ? 'bg-white border-rose-100 shadow-xl shadow-rose-900/5 hover:-translate-y-1' : 'bg-slate-50 border-slate-100 opacity-70'}`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden border border-white">
                                                {doc.image_url ? (
                                                    <img src={doc.image_url} alt={doc.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Stethoscope size={32} className="text-slate-400" />
                                                )}
                                            </div>
                                            {isAvailableToday && (
                                                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full flex items-center gap-1 border border-emerald-100 shadow-sm uppercase tracking-wider">
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> এখন আছেন
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 group-hover:text-rose-600 transition-colors">{doc.name}</h3>
                                        <p className="text-xs font-black text-rose-500 mb-1">{doc.specialty}</p>
                                        <p className="text-[10px] font-bold text-slate-400 leading-tight mb-4">{doc.qualifications || doc.qual}</p>
                                        
                                        <div className="space-y-2 pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                <Clock size={14} className="text-slate-400" /> {doc.visiting_time || doc.time}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <Calendar size={14} className="text-slate-400" /> 
                                                {availableDays.includes('Everyday') ? 'প্রতিদিন' : availableDays.join(', ')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="col-span-full py-12 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                                    <p className="font-bold text-slate-400">এই ইউনিয়নে কোনো ডাক্তার তালিকাভুক্ত নেই।</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Pharmacy Section */}
                    <section className="bg-slate-900 rounded-[40px] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                <div>
                                    <h2 className="text-2xl font-black flex items-center gap-3">
                                        <Pill className="text-rose-400" /> জরুরি ঔষধের স্টক
                                    </h2>
                                    <p className="text-slate-400 font-medium text-sm mt-1">নিকটস্থ ফার্মেসিতে মজুত থাকা জীবনরক্ষাকারী ঔষধের তালিকা।</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {pharmacies.map(ph => (
                                    <div key={ph.id} className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                                                <Heart size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-white">{ph.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest"><MapPin size={10}/> {ph.location}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2">
                                            {(ph.emergency_stock || ph.emergencyStock || []).map(item => (
                                                <span key={item} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-rose-200">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                        
                                        <a href={`tel:${ph.phone}`} className="shrink-0 flex items-center gap-2 text-rose-400 hover:text-rose-300 font-black text-sm transition-colors">
                                            যোগাযোগ <ChevronRight size={16} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Ambulances & Directory */}
                <div className="lg:col-span-4 space-y-8 sticky top-24">
                    
                    {/* Ambulance Directory */}
                    <div className="p-8 rounded-[40px] bg-white border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                                <Ambulance size={20} />
                            </div>
                            <h3 className="text-lg font-black text-slate-800">অ্যাম্বুলেন্স ডিরেক্টরি</h3>
                        </div>

                        <div className="space-y-4">
                            {ambulances.map(amb => (
                                <div key={amb.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-rose-200 transition-all group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-0.5">{amb.type}</p>
                                            <h4 className="font-black text-slate-800 leading-tight">{amb.provider}</h4>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${amb.is_available ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 animate-pulse'}`}>
                                            {amb.is_available ? 'উপলব্ধ' : 'ব্যস্ত'}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                                                <Activity size={14} className="text-slate-400" />
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-500">{amb.driver}</p>
                                        </div>
                                        <a href={`tel:${amb.phone}`} className="p-2.5 rounded-xl bg-white border border-slate-200 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm">
                                            <Phone size={16} />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-6 py-4 rounded-2xl bg-slate-900 text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-rose-600 transition-all shadow-xl shadow-slate-200 active:scale-95">
                            <Search size={18} /> সব নাম্বার দেখুন
                        </button>
                    </div>

                    {/* Quick Advice Card */}
                    <div className="p-8 rounded-[40px] bg-emerald-950 text-white relative overflow-hidden group shadow-2xl">
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                                <ShieldCheck size={24} className="text-emerald-400" />
                            </div>
                            <h4 className="text-lg font-black mb-2">সুরক্ষা সতর্কতা</h4>
                            <p className="text-xs text-emerald-200/70 leading-relaxed">
                                কোনো জরুরি অবস্থায় সরাসরি আমাদের কল সেন্টারে ফোন করুন। তথ্যগুলো নিয়মিত ইউনিয়ন স্বাস্থ্যকেন্দ্র থেকে ভেরিফাই করা হয়।
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

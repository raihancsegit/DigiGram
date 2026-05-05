'use client';

import Link from 'next/link';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Phone, MapPin, Clock, ShieldAlert, AlertOctagon, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    emergencyDirectoryContext,
    emergencyHowTo,
} from '@/lib/content/emergencyDirectory';
import { emergencyService } from '@/lib/services/emergencyService';
import { adminService } from '@/lib/services/adminService';
import UnionEmergencyContacts from '@/components/sections/union/UnionEmergencyContacts';

const iconMap = {};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const EN_DIGITS = '0123456789';

function bnDigitsToEn(str) {
    return String(str)
        .split('')
        .map((ch) => {
            const i = BN_DIGITS.indexOf(ch);
            return i >= 0 ? EN_DIGITS[i] : ch;
        })
        .join('');
}

function toTelHref(raw) {
    const normalized = bnDigitsToEn(raw);
    const digits = normalized.replace(/[^\d+]/g, '');
    if (!digits.length) return undefined;
    if (digits.startsWith('+')) return `tel:${digits}`;
    return `tel:${digits}`;
}

function PhoneBlock({ phones }) {
    return (
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-100/80">
            {phones.map((p) => {
                const href = toTelHref(p.number);
                const Wrapper = href ? 'a' : 'span';
                return (
                    <Wrapper
                        key={`${p.label}-${p.number}`}
                        {...(href ? { href } : {})}
                        className={`inline-flex items-center justify-between gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-slate-800 font-black transition-all w-full group ${
                            href ? 'hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 hover:shadow-md cursor-pointer active:scale-[0.98]' : 'cursor-default'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl transition-colors ${href ? 'bg-rose-100 text-rose-600 group-hover:bg-rose-200' : 'bg-slate-200 text-slate-500'}`}>
                                <Phone size={16} className="shrink-0" />
                            </div>
                            <span className="min-w-0 flex flex-col items-start leading-none gap-1.5">
                                {p.label && <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-rose-400">{p.label}</span>}
                                <span className="text-base tracking-wide">{p.number}</span>
                            </span>
                        </div>
                    </Wrapper>
                );
            })}
        </div>
    );
}

export default function EmergencyDirectoryView({ slug }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-black text-slate-400 animate-pulse tracking-widest uppercase text-xs">তথ্য লোড হচ্ছে...</p>
                </div>
            </div>
        }>
            <EmergencyDirectoryContent slug={slug} />
        </Suspense>
    );
}

function EmergencyDirectoryContent({ slug }) {
    const searchParams = useSearchParams();
    const unionQuery = searchParams.get('u');
    const [unionData, setUnionData] = useState(null);
    const [loading, setLoading] = useState(!!unionQuery);
    
    useEffect(() => {
        if (unionQuery) {
            const loadUnionData = async () => {
                setLoading(true);
                try {
                    const { data: unions } = await adminService.getLocations();
                    const targetUnion = unions.find(u => u.slug === unionQuery);
                    
                    if (targetUnion) {
                        setUnionData(targetUnion);
                    }
                } catch (err) {
                    console.error("Error loading union for emergency:", err);
                } finally {
                    setLoading(false);
                }
            };
            loadUnionData();
        }
    }, [unionQuery]);

    const ctx = emergencyDirectoryContext;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-black text-slate-400 animate-pulse tracking-widest uppercase text-xs">তথ্য লোড হচ্ছে...</p>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Premium Hero Section */}
            <div className="relative pt-24 pb-20 md:pt-32 md:pb-24 px-4 overflow-hidden bg-slate-900">
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-600 rounded-full blur-[150px] translate-x-1/3 -translate-y-1/4" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-600 rounded-full blur-[150px] -translate-x-1/3 translate-y-1/4" />
                </div>
                
                <div className="max-w-[1200px] mx-auto relative z-10">
                    <Link
                        href={unionQuery ? `/u/${unionQuery}` : "/#services"}
                        className="inline-flex items-center gap-2 text-sm font-bold text-rose-300 hover:text-white transition-colors mb-8 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        {unionData ? `${unionData.name} পোর্টালে ফিরুন` : 'সার্ভিস ডিরেক্টরিতে ফিরুন'}
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="max-w-2xl">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-wrap items-center gap-3 mb-6"
                            >
                                <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                    <Activity size={12} />
                                    জরুরি সার্ভিসেস
                                </span>
                                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                    <Phone size={12} />
                                    ২৪/৭ খোলা
                                </span>
                            </motion.div>
                            
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6"
                            >
                                জরুরি যোগাযোগ ও <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">হেল্পলাইন</span>
                            </motion.h1>

                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed max-w-xl"
                            >
                                {unionData ? (
                                    <>
                                        <span className="text-white font-black">{unionData.name}</span> ইউনিয়নের গুরুত্বপূর্ণ সকল নম্বরসমূহ এবং জাতীয় হেল্পলাইন।
                                    </>
                                ) : (
                                    "আপনার ইউনিয়ন ও জাতীয় পর্যায়ের সকল গুরুত্বপূর্ণ জরুরি যোগাযোগ নম্বরসমূহ এখন এক জায়গায়।"
                                )}
                            </motion.p>
                        </div>

                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="hidden lg:flex w-40 h-40 items-center justify-center rounded-[40px] bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-white/10 backdrop-blur-xl shadow-2xl relative"
                        >
                            <AlertOctagon size={64} className="text-rose-400" />
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 -mt-10 relative z-20 space-y-16">
                {/* How to use */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-[40px] p-8 md:p-10 shadow-xl shadow-slate-200/40 border border-slate-100"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:border-r border-slate-100 lg:pr-10">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
                                <Clock size={28} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-4">জরুরি মুহূর্তে কি করবেন?</h2>
                            <p className="text-sm font-bold text-slate-500 leading-relaxed">
                                আতঙ্কিত হবেন না। নিচের ধাপগুলো অনুসরণ করুন এবং দ্রুত নিকটস্থ সেবাপ্রদানকারীর সাথে যোগাযোগ করুন।
                            </p>
                        </div>
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8">
                            {emergencyHowTo.map((step, i) => (
                                <div key={i} className="group">
                                    <div className="text-4xl font-black text-slate-100 group-hover:text-rose-100 transition-colors mb-2">0{i+1}</div>
                                    <h3 className="text-base font-black text-slate-800 mb-2">{step.title}</h3>
                                    <p className="text-xs font-bold text-slate-500 leading-relaxed">{step.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Main Content: Local Union Numbers (Dynamic) */}
                {unionData && (
                    <div className="scroll-mt-32 pb-20" id="local-numbers">
                        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-8">
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 mb-2">{unionData.name} জরুরি ডিরেক্টরি</h2>
                                <p className="text-sm font-bold text-slate-500">আপনার এলাকার সকল ভেরিফাইড এবং সচল জরুরি নম্বরসমূহ</p>
                            </div>
                        </div>
                        <UnionEmergencyContacts locationId={unionData.id} unionName={unionData.name} />
                    </div>
                )}

                {/* Disclaimer */}
                <div className="bg-slate-900 rounded-[40px] p-8 md:p-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 blur-[100px] rounded-full" />
                    <ShieldAlert size={48} className="mx-auto text-rose-500 mb-6" />
                    <h3 className="text-xl font-black text-white mb-4">তথ্য ও নিরাপত্তা সতর্কতা</h3>
                    <p className="text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed mb-8">
                        {ctx.disclaimer}
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <Clock size={12} />
                        {ctx.lastUpdatedLabel}
                    </div>
                </div>
            </div>
        </div>
    );
}

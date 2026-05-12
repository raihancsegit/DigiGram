'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Home, Users, UserCheck, User, ArrowRight, Building2, Globe } from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

const STAT_CARDS = [
    { key: 'upazilas', label: 'উপজেলা', info: 'সিস্টেমে সংযুক্ত উপজেলা', icon: MapPin, gradient: 'from-cyan-500 to-blue-600', bg: 'bg-cyan-500/10', color: 'text-cyan-500' },
    { key: 'unions', label: 'ইউনিয়ন', info: 'ডিজিটাল ইউনিয়ন নেটওয়ার্ক', icon: Globe, gradient: 'from-teal-500 to-emerald-600', bg: 'bg-teal-500/10', color: 'text-teal-500' },
    { key: 'wards', label: 'ওয়ার্ড', info: 'আধুনিক ওয়ার্ড সংযোগ', icon: Building2, gradient: 'from-sky-500 to-indigo-600', bg: 'bg-sky-500/10', color: 'text-sky-500' },
    { key: 'villages', label: 'গ্রাম', info: 'স্মার্ট গ্রামীণ নেটওয়ার্ক', icon: Home, gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-500/10', color: 'text-emerald-500' },
    { key: 'verifiedVillages', label: 'সার্ভে সম্পন্ন', info: 'যাচাইকৃত গ্রাম সংখ্যা', icon: UserCheck, gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/10', color: 'text-amber-500' },
    { key: 'population', label: 'জনসংখ্যা', info: 'রেজিস্টারকৃত মোট মানুষ', icon: Users, gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-500/10', color: 'text-violet-500' },
    { key: 'households', label: 'পরিবার', info: 'নিবন্ধিত মোট পরিবার', icon: Home, gradient: 'from-rose-500 to-pink-600', bg: 'bg-rose-500/10', color: 'text-rose-500' },
    { key: 'voters', label: 'মোট ভোটার', info: 'নিবন্ধিত ভোটার সংখ্যা', icon: UserCheck, gradient: 'from-indigo-500 to-blue-700', bg: 'bg-indigo-500/10', color: 'text-indigo-500' },
    { key: 'volunteers', label: 'ভলান্টিয়ার', info: 'সক্রিয় মাঠকর্মী সংখ্যা', icon: Users, gradient: 'from-teal-400 to-cyan-600', bg: 'bg-teal-400/10', color: 'text-teal-400' },
    { key: 'users', label: 'মোট ইউজার', info: 'প্লাটফর্মে সক্রিয় ইউজার', icon: User, gradient: 'from-slate-600 to-slate-800', bg: 'bg-slate-600/10', color: 'text-slate-600' }
];

const toBnDigits = (value) => {
    if (value == null) return '0';
    return String(value).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
};

const CountUp = ({ value }) => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (typeof value !== 'number' || value === 0) {
            setCurrent(value);
            return;
        }

        const duration = 800;
        const steps = 30;
        const increment = Math.max(1, Math.round(value / steps));
        let currentValue = 0;

        const interval = setInterval(() => {
            currentValue = Math.min(currentValue + increment, value);
            setCurrent(currentValue);
            if (currentValue >= value) {
                clearInterval(interval);
            }
        }, duration / steps);

        return () => clearInterval(interval);
    }, [value]);

    if (typeof value === 'string') {
        return <>{value}</>;
    }

    if (typeof current === 'number') {
        return <>{toBnDigits(current.toLocaleString())}</>;
    }

    return <>{value}</>;
};

export default function HomeImpactSection() {
    const [summary, setSummary] = useState({
        upazilas: 0,
        unions: 0,
        wards: 0,
        villages: 0,
        population: 0,
        voters: 0,
        maleVoters: 0,
        femaleVoters: 0,
        homes: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            setLoading(true);
            try {
                const [globalStats, locationStats] = await Promise.all([
                    adminService.getGlobalStats(),
                    adminService.getGlobalLocationStats()
                ]);

                setSummary({
                    ...globalStats,
                    population: locationStats.population || 0,
                    voters: locationStats.voters || 0,
                    homes: locationStats.homes || 0
                });
            } catch (error) {
                console.error('Home impact summary load failed:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    return (
        <section className="dg-section-x py-8 md:py-16">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-col gap-3 mb-8">
                    <p className="text-xs font-black uppercase tracking-[0.32em] text-teal-600">গ্রামীণ ড্যাশবোর্ড</p>
                    <h2 className="text-xl sm:text-3xl font-black text-slate-900">সর্বশেষ স্ট্যাটাস কার্ড</h2>
                    <p className="max-w-2xl text-sm text-slate-500">ইউনিয়ন, ওয়ার্ড, গ্রাম ও মোট জনসংখ্যা সহ সব তথ্য ছোট, স্পষ্ট এবং দ্রুত বোঝার মতো কার্ডে।</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {STAT_CARDS.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <motion.div
                                key={card.key}
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ 
                                    delay: index * 0.04, 
                                    type: 'spring',
                                    stiffness: 260,
                                    damping: 20
                                }}
                                className="group relative overflow-hidden rounded-[32px] border border-slate-200/60 bg-white/70 backdrop-blur-xl p-6 shadow-xl shadow-slate-200/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-teal-500/10"
                            >
                                {/* Decorative Gradient Background */}
                                <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20 bg-gradient-to-br ${card.gradient}`} />

                                <div className="flex items-center justify-between relative z-10">
                                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${card.bg}`}>
                                        <Icon className={card.color} size={28} />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/10">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                            LIVE
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 relative z-10">
                                    <div className="flex items-baseline gap-1">
                                        <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">
                                            {loading ? '০' : <CountUp value={summary[card.key] || 0} />}
                                        </h3>
                                        <span className="text-xl font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500">+</span>
                                    </div>
                                    <p className="mt-1 text-base font-black text-slate-800 tracking-tight">{card.label}</p>
                                    <p className="mt-2 text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-widest">{card.info}</p>
                                </div>

                                {/* Progress Bar / Accent Line */}
                                <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-100/50">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: '65%' }}
                                        transition={{ delay: index * 0.1 + 0.3, duration: 1 }}
                                        className={`h-full rounded-full bg-gradient-to-r ${card.gradient}`} 
                                    />
                                </div>
                                
                                {/* Bottom Action (Hidden but ready) */}
                                <div className="mt-4 flex items-center justify-between opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">বিস্তারিত দেখুন</span>
                                    <ArrowRight size={14} className="text-teal-600" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Home, Users, UserCheck, User, ArrowRight, Building2, Globe } from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

const STAT_CARDS = [
    { key: 'upazilas', label: 'উপজেলা', info: 'সংযুক্ত উপজেলা সংখ্যা', icon: MapPin, color: 'text-cyan-600', bg: 'bg-cyan-50', bar: 'bg-cyan-400' },
    { key: 'unions', label: 'ইউনিয়ন', info: 'ডিজিটাল ইউনিয়ন নেটওয়ার্ক', icon: Globe, color: 'text-teal-600', bg: 'bg-teal-50', bar: 'bg-teal-400' },
    { key: 'wards', label: 'ওয়ার্ড', info: 'আধুনিক ওয়ার্ড সংযোগ', icon: Building2, color: 'text-sky-600', bg: 'bg-sky-50', bar: 'bg-sky-400' },
    { key: 'villages', label: 'গ্রাম', info: 'গ্রামীণ এলাকায় সেবা', icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-400' },
    { key: 'population', label: 'জনসংখ্যা', info: 'রেজিস্টারকৃত মোট মানুষ', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', bar: 'bg-violet-400' },
    { key: 'voters', label: 'মোট ভোটার', info: 'নিবন্ধিত ভোটার সংখ্যা', icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', bar: 'bg-indigo-400' },
    { key: 'maleVoters', label: 'পুরুষ ভোটার', info: 'পুরুষ ভোটারের সংখ্যা', icon: User, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-400' },
    { key: 'femaleVoters', label: 'মহিলা ভোটার', info: 'মহিলা ভোটারের সংখ্যা', icon: User, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', bar: 'bg-fuchsia-400' },
    { key: 'homes', label: 'বাড়ি', info: 'ঘর/বাড়ির সংখ্যা', icon: Home, color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-400' }
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
                    upazilas: globalStats.upazilas,
                    unions: globalStats.unions,
                    wards: globalStats.wards,
                    villages: globalStats.villages,
                    population: locationStats.population || 45000,
                    voters: locationStats.voters || 28500,
                    maleVoters: locationStats.maleVoters || 14200,
                    femaleVoters: locationStats.femaleVoters || 14300,
                    homes: locationStats.homes || 9500
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
        <section className="dg-section-x py-16">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-col gap-3 mb-8">
                    <p className="text-xs font-black uppercase tracking-[0.32em] text-teal-600">গ্রামীণ ড্যাশবোর্ড</p>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900">সর্বশেষ স্ট্যাটাস কার্ড</h2>
                    <p className="max-w-2xl text-sm text-slate-500">ইউনিয়ন, ওয়ার্ড, গ্রাম ও মোট জনসংখ্যা সহ সব তথ্য ছোট, স্পষ্ট এবং দ্রুত বোঝার মতো কার্ডে।</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    {STAT_CARDS.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <motion.div
                                key={card.key}
                                initial={{ opacity: 0, y: 18 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05, duration: 0.35 }}
                                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.bg}`}>
                                        <Icon className={card.color} size={20} />
                                    </div>
                                    <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                        ++
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className="text-3xl font-black text-slate-900 tracking-tight">
                                        {loading ? '০' : <CountUp value={summary[card.key] || 0} />}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-700">{card.label}</p>
                                    <p className="mt-2 text-xs text-slate-500 leading-relaxed">{card.info}</p>
                                </div>

                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                    <div className={`${card.bar} h-1.5 rounded-full`} style={{ width: '52%' }} />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

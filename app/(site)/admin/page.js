"use client";

import { useSelector } from 'react-redux';
import { 
    Users, Activity, School, CreditCard, 
    Zap, ArrowUpRight, TrendingUp, AlertTriangle 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
    const { user } = useSelector((state) => state.auth);

    const stats = [
        { label: 'মোট রেসিডেন্ট (প্রোফাইল)', value: '৪,৮৫০+', icon: Users, color: 'bg-blue-500', trend: '+১২%' },
        { label: 'সক্রিয় শিক্ষা প্রতিষ্ঠান', value: '১২', icon: School, color: 'bg-teal-500', trend: '০%' },
        { label: 'চলতি মাসে এসএমএস', value: '২৪,৩০০', icon: Zap, color: 'bg-amber-500', trend: '+২৫%' },
        { label: 'অ্যাডমিন ক্রেডিট', value: '৳ ২,৪৫০', icon: CreditCard, color: 'bg-indigo-500', trend: 'Low' },
    ];

    return (
        <div className="space-y-8">
            {/* Legend / Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">অ্যাডমিন ওভারভিউ</h1>
                    <p className="text-slate-500 font-bold">আপনার এলাকার ডিজিটাল সেবাসমূহের বর্তমান অবস্থা।</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-black text-slate-700 hover:shadow-md transition-all">
                        রিপোর্ট ডাউনলোড
                    </button>
                    <button className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-black hover:bg-teal-700 shadow-lg shadow-teal-200 transition-all">
                        নতুন সার্ভিস চালু
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx} 
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                <stat.icon size={24} />
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${stat.trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                {stat.trend}
                            </span>
                        </div>
                        <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</h3>
                        <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Mid Section: Charts & Recent Activity Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Active Services Card */}
                <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-800">চলমান সার্ভিসসমূহ</h3>
                        <button className="text-teal-600 text-xs font-black flex items-center gap-1 hover:underline">
                            সবগুলো দেখুন <ArrowUpRight size={14} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {[
                            { name: 'স্মার্ট স্কুল হাজিরা', status: 'Active', load: 'হাই', users: '৮৫০+' },
                            { name: 'ডিজি-ফুয়েল টোকেন', status: 'Active', load: 'মিডিয়াম', users: '৩২০+' },
                            { name: 'ই-ইউপি সনদপত্র', status: 'Maintenance', load: 'লো', users: '৪৫' },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${s.status === 'Active' ? 'bg-teal-500 animate-pulse' : 'bg-amber-500'}`} />
                                    <div>
                                        <p className="font-black text-slate-800 leading-none mb-1">{s.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400">লোকাল ইউজার: {s.users}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${s.status === 'Active' ? 'text-teal-600 bg-teal-50' : 'text-amber-600 bg-amber-50'}`}>
                                        {s.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Alerts & Credits */}
                <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500 blur-[80px] opacity-20" />
                    
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                        জরুরি অ্যালার্ট <AlertTriangle size={20} className="text-amber-400" />
                    </h3>
                    
                    <div className="space-y-6 relative z-10">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                            <p className="text-xs font-bold text-slate-400 mb-2">ক্রেডিট সতর্কতা</p>
                            <p className="text-sm font-black mb-3 text-amber-200">এসএমএস ক্রেডিট অতি দ্রুত শেষ হতে চলেছে।</p>
                            <button className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-black transition-all">
                                ক্রেডিট কিনুন
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                            <p className="text-xs font-bold text-slate-400 mb-2">সার্ভার স্ট্যাটাস</p>
                            <div className="flex items-center gap-2 text-sm font-black text-emerald-400">
                                <Activity size={14} /> গ্লোবাল সিস্টেম অনলাইন প্রো
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


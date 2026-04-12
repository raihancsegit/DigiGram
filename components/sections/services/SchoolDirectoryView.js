'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { School, BookOpen, GraduationCap, Building2, MapPin, Search, Globe, Library, Award, FileBadge, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const EDUCATIONAL_INSTITUTIONS = [
    { id: 1, name: 'সরকারি ব্রজলাল (বিএল) কলেজ', type: 'College', union: 'দৌলতপুর', established: '১৯০২', students: '৩৫,০০০+', website: 'http://www.blcollege.edu.bd/' },
    { id: 2, name: 'ডুমুরিয়া সরকারি বালিকা বিদ্যালয়', type: 'School', union: 'ডুমুরিয়া', established: '১৯৭৫', students: '১,২০০+', website: '#' },
    { id: 3, name: 'শাহপুর মধুগ্রাম কলেজ', type: 'College', union: 'শোভনা', established: '১৯৬৯', students: '২,৫০০+', website: '#' },
    { id: 4, name: 'দারুল উলুম মাদানিয়া মাদ্রাসা', type: 'Madrasa', union: 'গুটুদিয়া', established: '১৯৮০', students: '৮০০+', website: '#' },
    { id: 5, name: 'চুকনগর ফাজিল (ডিগ্রি) মাদ্রাসা', type: 'Madrasa', union: 'আটলিয়া', established: '১৯৫৬', students: '১,৫০০+', website: '#' },
    { id: 6, name: 'রংধনু কিন্ডারগার্টেন স্কুল', type: 'Kindergarten', union: 'ডুমুরিয়া সদর', established: '২০১০', students: '৪৫০+', website: '#' },
    { id: 7, name: 'খর্ণিয়া ইউনিয়ন মাধ্যমিক বিদ্যালয়', type: 'School', union: 'খর্ণিয়া', established: '১৯৮২', students: '৯০০+', website: '#' },
    { id: 8, name: 'লিলিয়াম ফ্লাওয়ার একাডেমি', type: 'Kindergarten', union: 'শোভনা', established: '২০১৫', students: '৩০০+', website: '#' },
];

const AnimatedCounter = ({ end, duration = 2, suffix = '' }) => {
    const [count, setCount] = useState(0);

    const bnMap = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    const toBnNum = (num) => String(num).replace(/[0-9]/g, match => bnMap[match]);

    useEffect(() => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [end, duration]);

    return <span>{toBnNum(count)}{suffix}</span>;
};

export default function SchoolDirectoryView() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('All');

    const filteredInstitutions = EDUCATIONAL_INSTITUTIONS.filter(inst => {
        const matchesType = selectedType === 'All' || inst.type === selectedType;
        const matchesSearch = inst.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              inst.union.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
    });

    const getStats = () => {
        return {
            School: EDUCATIONAL_INSTITUTIONS.filter(i => i.type === 'School').length,
            College: EDUCATIONAL_INSTITUTIONS.filter(i => i.type === 'College').length,
            Madrasa: EDUCATIONAL_INSTITUTIONS.filter(i => i.type === 'Madrasa').length,
            Kindergarten: EDUCATIONAL_INSTITUTIONS.filter(i => i.type === 'Kindergarten').length,
        }
    };

    const stats = getStats();

    return (
        <div className="pb-16 pt-4">
            {/* 1. Hero Section */}
            <div className="relative rounded-[40px] bg-violet-950 border border-violet-900 overflow-hidden px-6 py-16 md:p-20 mb-16 shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/20 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/20 blur-[150px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-center md:text-left max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-violet-200 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md shadow-sm">
                            <GraduationCap size={14} className="text-violet-400" /> এলাকাভিত্তিক এডুকেশন পোর্টাল
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.2] mb-6">
                            আপনার ইউনিয়নের সকল <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-300">শিক্ষাপ্রতিষ্ঠানের তথ্যচিত্র</span>
                        </h2>
                        <p className="text-lg text-violet-100/80 font-medium mb-8 leading-relaxed max-w-xl">
                            এলাকার স্কুল, কলেজ, মাদ্রাসা (দাখিল, আলিম) এবং কিন্ডারগার্টেন এর রিয়েল-টাইম ডিরেক্টরি। মুহূর্তেই খুঁজে নিন প্রয়োজনীয় শিক্ষাপ্রতিষ্ঠানের ওয়েবসাইট, শিক্ষার্থীর সংখ্যাসহ বিস্তারিত।
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button onClick={() => document.getElementById('institutions').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-5 rounded-[20px] bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black text-lg hover:from-violet-500 transition-all shadow-lg shadow-violet-500/25 active:scale-95 flex items-center justify-center gap-2">
                                <Search size={20} className="fill-white" />
                                প্রতিষ্ঠান খুঁজুন
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md hover:bg-white/10 transition-colors">
                            <School size={32} className="text-violet-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={stats.School + stats.College} /></div>
                            <p className="text-[10px] font-black text-violet-200/50 uppercase tracking-widest">স্কুল ও কলেজ</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md hover:bg-white/10 transition-colors mt-6">
                            <BookOpen size={32} className="text-fuchsia-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={stats.Madrasa} /></div>
                            <p className="text-[10px] font-black text-violet-200/50 uppercase tracking-widest">মাদ্রাসা (দাখিল/আলিম)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Stat Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
                <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm text-center group hover:border-violet-200 hover:shadow-xl transition-all">
                    <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-violet-500 group-hover:text-white transition-all">
                        <School size={24} />
                    </div>
                    <div className="text-3xl font-black text-slate-800 mb-1">{stats.School}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">উচ্চ/মাধ্যমিক স্কুল</div>
                </div>
                <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm text-center group hover:border-indigo-200 hover:shadow-xl transition-all">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <Building2 size={24} />
                    </div>
                    <div className="text-3xl font-black text-slate-800 mb-1">{stats.College}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">সর্বমোট কলেজ</div>
                </div>
                <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm text-center group hover:border-teal-200 hover:shadow-xl transition-all">
                    <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-white transition-all">
                        <Library size={24} />
                    </div>
                    <div className="text-3xl font-black text-slate-800 mb-1">{stats.Madrasa}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">মাদ্রাসা ও মক্তব</div>
                </div>
                <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm text-center group hover:border-fuchsia-200 hover:shadow-xl transition-all">
                    <div className="w-14 h-14 bg-fuchsia-50 text-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-fuchsia-500 group-hover:text-white transition-all">
                        <Award size={24} />
                    </div>
                    <div className="text-3xl font-black text-slate-800 mb-1">{stats.Kindergarten}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">কিন্ডারগার্টেন</div>
                </div>
            </div>

            {/* 3. Directory Table Section */}
            <div id="institutions" className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden mb-16">
                <div className="p-8 md:p-10 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 mb-2">প্রতিষ্ঠান তালিকা</h2>
                            <p className="text-sm font-medium text-slate-500">আপনার এলাকার সকল শিক্ষাপ্রতিষ্ঠানের তথ্য একত্রে</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="relative md:col-span-5">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search size={18} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="নাম বা এলাকা দিয়ে খুঁজুন..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                            />
                        </div>
                        
                        <div className="md:col-span-7 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {['All', 'School', 'College', 'Madrasa', 'Kindergarten'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    className={`shrink-0 px-6 py-3.5 rounded-full text-xs font-black transition-all ${
                                        selectedType === type 
                                        ? 'bg-violet-900 text-white shadow-lg shadow-violet-900/20' 
                                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-violet-300 hover:text-violet-700'
                                    }`}
                                >
                                    {type === 'All' ? 'সব ধরন' : type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">প্রতিষ্ঠানের নাম</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">অবস্থান (ইউনিয়ন)</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">শিক্ষার্থী সংখ্যা</th>
                                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">ওয়েবসাইট / প্রোফাইল</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {filteredInstitutions.map((inst, index) => (
                                    <motion.tr 
                                        key={inst.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="border-b border-slate-50 hover:bg-violet-50/30 transition-colors group"
                                    >
                                        <td className="py-5 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                                    inst.type === 'School' ? 'bg-sky-50 text-sky-600' :
                                                    inst.type === 'College' ? 'bg-indigo-50 text-indigo-600' :
                                                    inst.type === 'Madrasa' ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                    {inst.type === 'School' ? <School size={20} /> :
                                                     inst.type === 'College' ? <Building2 size={20} /> :
                                                     inst.type === 'Madrasa' ? <Library size={20} /> : <Award size={20} />}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-base text-slate-800 line-clamp-1">{inst.name}</h4>
                                                    <div className="flex sm:hidden items-center gap-1 mt-1 text-xs text-slate-500 font-bold">
                                                        <MapPin size={12} /> {inst.union}
                                                    </div>
                                                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                                        inst.type === 'School' ? 'bg-sky-100 text-sky-700' :
                                                        inst.type === 'College' ? 'bg-indigo-100 text-indigo-700' :
                                                        inst.type === 'Madrasa' ? 'bg-teal-100 text-teal-700' : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                        {inst.type} | স্থাপিত {inst.established}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 hidden sm:table-cell">
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                                                <MapPin size={16} className="text-slate-400" /> {inst.union}
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 hidden md:table-cell">
                                            <span className="text-sm font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                                {inst.students}
                                            </span>
                                        </td>
                                        <td className="py-5 px-8 text-right">
                                            {inst.website !== '#' ? (
                                                <a href={inst.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-600 hover:text-white text-xs font-black transition-all active:scale-95 shadow-sm border border-violet-100">
                                                    <Globe size={14} /> ওয়েবসাইট ভিজিট
                                                </a>
                                            ) : (
                                                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-50 text-slate-400 text-xs font-black cursor-not-allowed border border-slate-100">
                                                    <FileBadge size={14} /> প্রোফাইল আপডেট হয়নি
                                                </button>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                    
                    {filteredInstitutions.length === 0 && (
                        <div className="py-20 text-center">
                            <Search size={48} className="text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-slate-800 mb-2">কোনো প্রতিষ্ঠান পাওয়া যায়নি</h3>
                            <p className="text-sm text-slate-500 font-medium">আপনার ফিল্টার পরিবর্তন করে পুনরায় খুঁজুন।</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. CTA Wrapper */}
            <div className="mt-8 bg-gradient-to-r from-violet-100 to-fuchsia-100 rounded-[40px] p-8 md:p-12 border border-violet-200 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-sm">
                <div className="relative z-10 w-full">
                    <h3 className="text-2xl md:text-3xl font-black text-violet-900 mb-3 text-center md:text-left">আপনার প্রতিষ্ঠান লিস্ট করতে চান?</h3>
                    <p className="text-violet-800/80 font-bold max-w-lg leading-relaxed text-center md:text-left">
                        যেসব শিক্ষাপ্রতিষ্ঠান তালিকায় এখনো নেই, তাদের অ্যাডমিনরা বিনামূল্যে ডিজিগ্রাম পোর্টালে প্রতিষ্ঠানের প্রোফাইল যুক্ত করতে পারবেন।
                    </p>
                </div>
                <div className="shrink-0 w-full md:w-auto relative z-10">
                    <button className="w-full text-center px-8 py-5 rounded-[20px] bg-violet-600 text-white font-black text-lg shadow-lg hover:shadow-xl hover:bg-violet-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                        প্রতিষ্ঠান যুক্ত করুন <ArrowRight size={20} />
                    </button>
                </div>
            </div>
            
        </div>
    );
}

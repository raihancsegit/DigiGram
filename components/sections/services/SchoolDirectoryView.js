'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    School, BookOpen, GraduationCap, Building2, MapPin, 
    Search, Globe, Library, Award, FileBadge, ArrowRight,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { institutionService } from '@/lib/services/institutionService';
import { adminService } from '@/lib/services/adminService';
import { getLocationBySlug } from '@/lib/services/hierarchyService';
import Pagination from '@/components/common/Pagination';

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
    return (
        <Suspense fallback={
            <div className="flex justify-center py-40">
                <Loader2 className="animate-spin text-violet-600" size={40} />
            </div>
        }>
            <SchoolContent />
        </Suspense>
    );
}

function SchoolContent() {
    const searchParams = useSearchParams();
    const unionSlug = searchParams.get('u');

    const [institutions, setInstitutions] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 12;

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('All');
    const [loading, setLoading] = useState(true);
    const [unionData, setUnionData] = useState(null);

    const types = ['All', 'School', 'College', 'Madrasa', 'Kindergarten'];

    useEffect(() => {
        loadData(1);
    }, [unionSlug, selectedType, searchTerm]);

    const loadData = async (page = 1) => {
        if (!unionSlug) {
            setInstitutions([]);
            setTotalCount(0);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            let currentUnion = unionData;
            if (!currentUnion || currentUnion.slug !== unionSlug) {
                const data = await getLocationBySlug(unionSlug);
                if (data) {
                    setUnionData(data);
                    currentUnion = data;
                }
            }

            if (currentUnion?.id) {
                const typeFilter = selectedType === 'All' ? null : selectedType;
                const { data, count } = await institutionService.getInstitutionsByUnion(currentUnion.id, typeFilter, page, pageSize);
                
                // Client-side filtering for search term if needed
                let results = data || [];
                if (searchTerm) {
                    results = results.filter(i => 
                        i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        i.village?.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }

                setInstitutions(results);
                setTotalCount(count);
                setCurrentPage(page);
            }
        } catch (err) {
            console.error("Error loading institutions:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStats = () => {
        // This would ideally come from a summary query
        return {
            School: totalCount > 0 ? Math.ceil(totalCount * 0.6) : 0, // Mock stats based on total
            College: totalCount > 0 ? Math.ceil(totalCount * 0.2) : 0,
            Madrasa: totalCount > 0 ? Math.ceil(totalCount * 0.1) : 0,
            Kindergarten: totalCount > 0 ? Math.ceil(totalCount * 0.1) : 0,
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
                            {unionData?.name_bn || 'ইউনিয়ন'} এর সকল <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-300">শিক্ষাপ্রতিষ্ঠানের তথ্যচিত্র</span>
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
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={totalCount} /></div>
                            <p className="text-[10px] font-black text-violet-200/50 uppercase tracking-widest">মোট প্রতিষ্ঠান</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md hover:bg-white/10 transition-colors mt-6">
                            <BookOpen size={32} className="text-fuchsia-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={24} suffix="/৭" /></div>
                            <p className="text-[10px] font-black text-violet-200/50 uppercase tracking-widest">লাইভ পোর্টাল</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Directory Section */}
            <div id="institutions" className="mb-16">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2">প্রতিষ্ঠানের তালিকা</h2>
                        <p className="text-sm font-medium text-slate-500">ধরন এবং এলাকা অনুযায়ী ফিল্টার করুন</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-10">
                    <div className="relative md:col-span-4">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search size={20} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="প্রতিষ্ঠানের নাম দিয়ে খুঁজুন..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4.5 bg-white border border-slate-200 rounded-3xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
                        />
                    </div>
                    
                    <div className="md:col-span-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {types.map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`shrink-0 px-8 py-4 rounded-full text-xs font-black transition-all ${
                                    selectedType === type 
                                    ? 'bg-violet-900 text-white shadow-lg shadow-violet-900/20' 
                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300'
                                }`}
                            >
                                {type === 'All' ? 'সবগুলো' : type === 'School' ? 'স্কুল' : type === 'College' ? 'কলেজ' : type === 'Madrasa' ? 'মাদ্রাসা' : 'কিন্ডারগার্টেন'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Institutions Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-violet-600" size={40} />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <AnimatePresence mode="popLayout">
                                {institutions.map((inst, idx) => (
                                    <motion.div
                                        key={inst.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white rounded-[32px] p-8 border border-slate-100 hover:border-violet-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                                                    inst.type === 'College' ? 'bg-violet-50 text-violet-600' :
                                                    inst.type === 'School' ? 'bg-indigo-50 text-indigo-600' :
                                                    inst.type === 'Madrasa' ? 'bg-emerald-50 text-emerald-600' :
                                                    'bg-fuchsia-50 text-fuchsia-600'
                                                }`}>
                                                    {inst.type === 'College' ? <GraduationCap size={28} /> :
                                                     inst.type === 'School' ? <School size={28} /> :
                                                     inst.type === 'Madrasa' ? <Library size={28} /> : 
                                                     <Building2 size={28} />}
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight group-hover:text-violet-600 transition-colors uppercase">{inst.name}</h3>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-6">
                                                <MapPin size={14} /> {inst.village || inst.union || unionData?.name_bn}
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-8">
                                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">স্থাপিত</p>
                                                    <p className="text-xs font-black text-slate-700">{inst.established || 'অজানা'}</p>
                                                </div>
                                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">শিক্ষার্থী</p>
                                                    <p className="text-xs font-black text-slate-700">{inst.students || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Link 
                                                href={inst.website && inst.website !== '#' ? inst.website : `/u/${unionSlug}/institution/${inst.id}`}
                                                className="w-full py-4 rounded-[20px] bg-slate-900 hover:bg-violet-600 text-white font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                                            >
                                                বিস্তারিত দেখুন <ArrowRight size={18} />
                                            </Link>
                                            {inst.website && inst.website !== '#' && (
                                                <a 
                                                    href={inst.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full py-3 rounded-[20px] bg-white text-slate-600 border border-slate-200 font-black text-[10px] flex items-center justify-center gap-2 hover:bg-slate-50 transition-all uppercase tracking-widest"
                                                >
                                                    <Globe size={14} /> ওয়েবসাইট ভিজিট
                                                </a>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        <Pagination 
                            currentPage={currentPage}
                            totalCount={totalCount}
                            pageSize={pageSize}
                            onPageChange={(page) => {
                                loadData(page);
                                document.getElementById('institutions').scrollIntoView({ behavior: 'smooth' });
                            }}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

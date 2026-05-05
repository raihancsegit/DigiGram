'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Phone, Search, ShieldAlert, HeartPulse, Flame, 
    PhoneCall, Copy, CheckCircle2, UserCheck, 
    AlertTriangle, MapPin, Info, ArrowRight, 
    Ambulance, Activity, Loader2 
} from 'lucide-react';
import { emergencyService } from '@/lib/services/emergencyService';
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

export default function EmergencyDirectoryView() {
    return (
        <Suspense fallback={
            <div className="flex justify-center py-40">
                <Loader2 className="animate-spin text-rose-600" size={40} />
            </div>
        }>
            <EmergencyContent />
        </Suspense>
    );
}

function EmergencyContent() {
    const searchParams = useSearchParams();
    const unionSlug = searchParams.get('u');

    const [contacts, setContacts] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 12;

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [copiedId, setCopiedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unionData, setUnionData] = useState(null);

    const categories = ['All', 'Police', 'Fire', 'Hospital', 'Admin', 'Utility'];

    useEffect(() => {
        loadData(1);
    }, [unionSlug, selectedCategory, searchTerm]);

    const loadData = async (page = 1) => {
        if (!unionSlug) {
            setContacts([]);
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
                const { data, count } = await emergencyService.getContacts(currentUnion.id, page, pageSize);
                
                // Client-side filtering for category and search term if needed, 
                // but better to do it server-side if service supports it.
                // For now, let's assume the service handles basic location filtering.
                let results = data || [];
                if (selectedCategory !== 'All') {
                    results = results.filter(c => c.category === selectedCategory);
                }
                if (searchTerm) {
                    results = results.filter(c => 
                        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        c.location?.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }

                setContacts(results);
                setTotalCount(count); // Note: count might be slightly off if client-filtered
                setCurrentPage(page);
            }
        } catch (err) {
            console.error("Error loading emergency contacts:", err);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (number, id) => {
        navigator.clipboard.writeText(number);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="pb-16 pt-4">
            {/* 1. Hero Section */}
            <div className="relative rounded-[40px] bg-rose-950 border border-thin border-rose-900 overflow-hidden px-6 py-16 md:p-20 mb-16 shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/20 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/20 blur-[150px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-center md:text-left max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-rose-200 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md shadow-sm">
                            <ShieldAlert size={14} className="text-rose-400" /> এলাকাভিত্তিক জরুরি ডিরেক্টরি
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.2] mb-6">
                            {unionData?.name_bn || 'ইউনিয়ন'} ও উপজেলার <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">জরুরি সকল নম্বরসমূহ</span>
                        </h2>
                        <p className="text-lg text-rose-100/80 font-medium mb-8 leading-relaxed max-w-xl">
                            জরুরি মুহূর্তে সঠিক নম্বরটি খুঁজে পাওয়া এখন আরও সহজ। আপনার এলাকার ফায়ার সার্ভিস, থানা বা হাসপাতালের নম্বর পাচ্ছেন এখানেই।
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button onClick={() => document.getElementById('contacts').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-10 py-5 rounded-[20px] bg-gradient-to-r from-rose-600 to-red-700 text-white font-black text-lg hover:from-rose-500 transition-all shadow-lg shadow-rose-500/25 active:scale-95 flex items-center justify-center gap-2">
                                <Search size={22} />
                                নম্বর খুঁজুন
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md hover:bg-white/10 transition-colors">
                            <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={totalCount} /></div>
                            <p className="text-[10px] font-black text-rose-200/50 uppercase tracking-widest">ভেরিফাইড নম্বর</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md hover:bg-white/10 transition-colors mt-6">
                            <Activity size={32} className="text-orange-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={24} suffix="/৭" /></div>
                            <p className="text-[10px] font-black text-rose-200/50 uppercase tracking-widest">লাইভ সার্ভিস</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Warning Section */}
            <div className="bg-amber-50 rounded-[32px] border border-amber-100 p-8 mb-16 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                    <AlertTriangle size={36} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-amber-900 mb-1">অপ্রয়োজনে কল করবেন না!</h3>
                    <p className="text-sm font-bold text-amber-800/70 leading-relaxed">
                        জরুরি নম্বরগুলোতে বিনা প্রয়োজনে কল করা আইনত দণ্ডনীয় অপরাধ। এগুলো শুধুমাত্র বড় কোনো বিপদ বা জরুরি প্রয়োজনে ব্যবহারের জন্য সংরক্ষিত।
                    </p>
                </div>
            </div>

            {/* 3. Directory Section */}
            <div id="contacts" className="mb-16">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2">যোগাযোগের নম্বরসমূহ</h2>
                        <p className="text-sm font-medium text-slate-500">আপনার প্রয়োজনীয় ক্যাটাগরি অনুযায়ী নম্বর খুঁজুন</p>
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
                            placeholder="অফিসের নাম বা ঠিকানা দিয়ে খুঁজুন..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4.5 bg-white border border-slate-200 rounded-3xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
                        />
                    </div>
                    
                    <div className="md:col-span-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`shrink-0 px-8 py-4 rounded-full text-xs font-black transition-all ${
                                    selectedCategory === cat 
                                    ? 'bg-rose-900 text-white shadow-lg shadow-rose-900/20' 
                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-rose-300'
                                }`}
                            >
                                {cat === 'All' ? 'সবগুলো' : cat === 'Police' ? 'পুলিশ/থানা' : cat === 'Fire' ? 'ফায়ার সার্ভিস' : cat === 'Hospital' ? 'হাসপাতাল' : cat === 'Admin' ? 'প্রশাসন' : 'ইউটিলিটি'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Contacts Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-rose-600" size={40} />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <AnimatePresence mode="popLayout">
                                {contacts.map((contact, idx) => (
                                    <motion.div
                                        key={contact.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white rounded-[32px] p-8 border border-slate-100 hover:border-rose-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                                                    contact.category === 'Police' ? 'bg-indigo-50 text-indigo-600' :
                                                    contact.category === 'Fire' ? 'bg-orange-50 text-orange-600' :
                                                    contact.category === 'Hospital' ? 'bg-rose-50 text-rose-600' :
                                                    contact.category === 'Admin' ? 'bg-emerald-50 text-emerald-600' :
                                                    'bg-amber-50 text-amber-600'
                                                }`}>
                                                    {contact.category === 'Police' ? <ShieldAlert size={28} /> :
                                                     contact.category === 'Fire' ? <Flame size={28} /> :
                                                     contact.category === 'Hospital' ? <HeartPulse size={28} /> :
                                                     contact.category === 'Admin' ? <UserCheck size={28} /> : 
                                                     <AlertTriangle size={28} />}
                                                </div>
                                                {contact.verified && (
                                                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                                        <CheckCircle2 size={12} /> ভেরিফাইড
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight group-hover:text-rose-600 transition-colors uppercase">{contact.name}</h3>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-6">
                                                <MapPin size={14} /> {contact.location || contact.village}
                                            </div>
                                        </div>

                                        <div className="space-y-3 mt-auto">
                                            <div className="p-5 bg-slate-50 rounded-[20px] border border-slate-100 relative group/num overflow-hidden">
                                                <div className="absolute right-3 top-3 opacity-0 group-hover/num:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => copyToClipboard(contact.number, contact.id)}
                                                        className="p-2 bg-white rounded-lg text-slate-400 hover:text-rose-500 shadow-sm border border-slate-100 transition-colors"
                                                    >
                                                        {copiedId === contact.id ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                                    </button>
                                                </div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ফোন নম্বর</p>
                                                <p className="text-2xl font-black text-slate-800 tracking-tight font-mono">{contact.number}</p>
                                            </div>
                                            <button 
                                                onClick={() => window.location.href = `tel:${contact.number}`}
                                                className="w-full py-4 rounded-[20px] bg-slate-900 hover:bg-rose-600 text-white font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                                            >
                                                <PhoneCall size={18} /> সরাসরি কল দিন
                                            </button>
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
                                document.getElementById('contacts').scrollIntoView({ behavior: 'smooth' });
                            }}
                        />
                    </>
                )}
            </div>

            {/* 4. Footer CTA */}
            <div className="mt-8 bg-slate-50 rounded-[40px] p-8 md:p-14 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative z-10 w-full text-center md:text-left">
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-4">আপনার কাছে কি কোনো জরুরি নম্বর আছে?</h3>
                    <p className="text-slate-600 font-bold max-w-xl text-base">
                        আপনার কাছে যদি এমন কোনো গুরুত্বপূর্ণ নম্বর থাকে যা সাধারণ মানুষের উপকারে আসবে তা আমাদের জানানোর অনুরোধ রইলো। আমরা যাচাই করে লিস্টে যুক্ত করবো।
                    </p>
                </div>
                <div className="shrink-0 w-full md:w-auto relative z-10">
                    <button className="w-full px-10 py-5 rounded-[24px] bg-white text-rose-600 font-black text-lg shadow-xl border-2 border-slate-100 hover:bg-rose-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2">
                        নম্বর সাবমিট করুন <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

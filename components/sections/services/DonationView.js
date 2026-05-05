'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Heart, Search, CheckCircle2, MapPin, Users, 
    Target, CalendarDays, ChevronRight, HandHeart, 
    Sparkles, MessageCircle, ArrowRight, ShieldCheck, 
    FileText, PieChart, Activity, BadgeCheck, Loader2,
    Wallet, Save, X, Phone
} from 'lucide-react';
import { donationService } from '@/lib/services/donationService';
import { toBnDigits } from '@/lib/utils/format';

const AnimatedCounter = ({ end, duration = 2, suffix = '' }) => {
    const [count, setCount] = useState(0);

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

    return <span>{toBnDigits(count)}{suffix}</span>;
};

export default function DonationView() {
    return (
        <Suspense fallback={<div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500" /></div>}>
            <DonationContent />
        </Suspense>
    );
}

function DonationContent() {
    const searchParams = useSearchParams();
    const unionSlug = searchParams.get('u');

    const [projects, setProjects] = useState([]);
    const [ledger, setLedger] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLedger, setShowLedger] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null); // For donation modal
    const [activeTab, setActiveTab] = useState('local'); // 'local' or 'global'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    useEffect(() => {
        if (unionSlug) {
            loadData();
        }
    }, [unionSlug]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [projData, ledgerData, settingsData] = await Promise.all([
                donationService.getProjects(unionSlug),
                donationService.getPublicLedger(unionSlug),
                donationService.getSettings(unionSlug)
            ]);
            setProjects(projData);
            setLedger(ledgerData);
            setSettings(settingsData);
        } catch (err) {
            console.error("Error loading donations:", err);
        } finally {
            setLoading(false);
        }
    };

    const totalRaised = projects.reduce((acc, p) => acc + (p.raised_amount || 0), 0);
    const totalDonors = ledger.length;

    const filteredProjects = useMemo(() => {
        if (activeTab === 'local') {
            return projects.filter(p => !p.is_global);
        }
        return projects.filter(p => p.is_global);
    }, [projects, activeTab]);

    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
    const paginatedProjects = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredProjects.slice(start, start + itemsPerPage);
    }, [filteredProjects, currentPage]);

    if (loading) {
        return (
            <div className="py-20 text-center">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">অপেক্ষা করুন...</p>
            </div>
        );
    }

    return (
        <div className="pb-16 pt-4">
            {/* 1. Hero Section */}
            <div className="relative rounded-[40px] bg-emerald-950 border border-emerald-900 overflow-hidden px-6 py-16 md:p-20 mb-16 shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/20 blur-[150px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-center md:text-left max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md">
                            <BadgeCheck size={14} className="text-emerald-400" /> ১০০% স্বচ্ছ ডোনেশন প্ল্যাটফর্ম
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.2] mb-6">
                            আপনার দান, <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">সঠিক হাতে পৌঁছাবেই</span>
                        </h2>
                        <p className="text-lg text-emerald-100/80 font-medium mb-8 leading-relaxed max-w-xl">
                            দিজিগ্রাম 'স্বচ্ছ দান' এর মাধ্যমে সংগৃহীত প্রতিটি টাকার হিসাব পাবলিক লেজারে উন্মুক্ত রাখা হয়। মানুষের বিপদে পাশে দাঁড়ান কোনো চিন্তা ছাড়াই।
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button onClick={() => document.getElementById('campaigns').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-10 py-5 rounded-[20px] bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-lg hover:from-emerald-400 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2">
                                <HandHeart size={20} />
                                ফান্ডগুলো দেখুন
                            </button>
                            <button onClick={() => setShowLedger(!showLedger)} className="w-full sm:w-auto px-8 py-5 rounded-[20px] bg-white/10 text-white font-black text-lg hover:bg-white/20 transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-2">
                                <FileText size={20} />
                                পাবলিক লেজার
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md hover:bg-white/10 transition-colors">
                            <Users size={32} className="text-emerald-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={totalDonors} suffix="+" /></div>
                            <p className="text-[10px] font-black text-emerald-200/50 uppercase tracking-widest">দাতা সদস্য</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md hover:bg-white/10 transition-colors mt-6">
                            <Activity size={32} className="text-teal-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={totalRaised} suffix=" ৳" /></div>
                            <p className="text-[10px] font-black text-emerald-200/50 uppercase tracking-widest">সংগৃহীত অনুদান</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Transparency Ledger */}
            <AnimatePresence>
                {showLedger && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-16 overflow-hidden"
                    >
                        <div className="bg-white rounded-[40px] border-4 border-emerald-100 p-8 shadow-2xl">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-emerald-900">রিয়েল-টাইম পাবলিক লেজার</h3>
                                    <p className="text-sm font-bold text-slate-500">প্রতিটি ডোনেশনের লাইভ লগ (স্বচ্ছতা নিশ্চিত করতে)</p>
                                </div>
                                <button onClick={() => setShowLedger(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors font-black text-slate-400">বন্ধ করুন</button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">তারিখ</th>
                                            <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">দাতার নাম</th>
                                            <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">পরিমাণ</th>
                                            <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">প্রজেক্ট</th>
                                            <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">স্ট্যাটাস</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {ledger.map((log) => (
                                            <tr key={log.id} className="hover:bg-emerald-50/50 transition-colors">
                                                <td className="py-5 px-4 text-xs font-bold text-slate-500">{toBnDigits(new Date(log.created_at).toLocaleDateString('bn-BD'))}</td>
                                                <td className="py-5 px-4 text-sm font-black text-slate-800">{log.donor_name}</td>
                                                <td className="py-5 px-4 text-base font-black text-emerald-600">{toBnDigits(log.amount.toString())} ৳</td>
                                                <td className="py-5 px-4 text-sm font-bold text-slate-600">{log.project?.title || 'জেনারেল ফান্ড'}</td>
                                                <td className="py-5 px-4 text-right">
                                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                                                        ভেরিফাইড
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                                <PieChart size={24} className="text-emerald-500 shrink-0" />
                                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                    * আমরা কোনো প্রকার অ্যাডমিন ফি গ্রহণ করি না। আপনার প্রদানকৃত পুরো অর্থই সরাসরি সুবিধাভোগীর কাছে পৌঁছে দেওয়া হয়।
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. Main Campaigns Grid */}
            <div id="campaigns">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 pb-8 border-b border-slate-100">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800">চলমান ফান্ডিং ও উদ্যোগ</h2>
                        <p className="text-sm font-medium text-slate-500">নিচে থেকে যেকোনো একটি উদ্যোগে আপনার সাধ্যমতো অংশ নিন</p>
                    </div>
                    
                    {/* Tabs for Local/Global */}
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                        <button 
                            onClick={() => setActiveTab('local')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'local' ? 'bg-white text-emerald-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            লোকাল প্রজেক্ট
                        </button>
                        <button 
                            onClick={() => setActiveTab('global')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'global' ? 'bg-white text-emerald-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            গ্লোবাল প্রজেক্ট
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {paginatedProjects.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <HandHeart size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">বর্তমানে কোনো প্রজেক্ট নেই</h3>
                            <p className="text-slate-500 font-bold max-w-sm mx-auto">
                                এই মুহূর্তে আপনার ইউনিয়নে কোনো সক্রিয় অনুদান প্রজেক্ট পাওয়া যায়নি। শীঘ্রই নতুন প্রজেক্ট শুরু হবে।
                            </p>
                        </div>
                    ) : paginatedProjects.map((camp, idx) => {
                        const progress = Math.min(100, Math.round(((camp.raised_amount || 0) / camp.target_amount) * 100));
                        const isComplete = camp.raised_amount >= camp.target_amount;

                        return (
                            <motion.div
                                key={camp.id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-300 group flex flex-col"
                            >
                                <div className="relative h-64 w-full bg-slate-100 overflow-hidden shrink-0">
                                    {camp.image_url ? (
                                        <img src={camp.image_url} alt={camp.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                    ) : (
                                        <div className="w-full h-full bg-emerald-50 flex items-center justify-center text-emerald-200">
                                            <HandHeart size={80} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent"></div>
                                    
                                    <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                                        <span className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-lg border border-white/20">
                                            {camp.category}
                                        </span>
                                        {camp.is_global && (
                                            <span className="px-4 py-2 rounded-xl bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg border border-sky-400">
                                                গ্লোবাল উদ্যোগ
                                            </span>
                                        )}
                                        {camp.is_verified && (
                                            <span className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg border border-emerald-400">
                                                ভেরিফাইড উদ্যোগ
                                            </span>
                                        )}
                                    </div>

                                    <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank');
                                            }}
                                            className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                                            title="Share on Facebook"
                                        >
                                            <svg size={18} fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(`https://api.whatsapp.com/send?text=Check out this donation project: ${camp.title} ${window.location.href}`, '_blank');
                                            }}
                                            className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                                            title="Share on WhatsApp"
                                        >
                                            <MessageCircle size={20} />
                                        </button>
                                    </div>

                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/80 backdrop-blur-sm text-[8px] font-black text-white uppercase tracking-tighter">সোর্স: {camp.union_name}</span>
                                            {camp.is_global && <span className="px-2 py-0.5 rounded-md bg-sky-500/80 backdrop-blur-sm text-[8px] font-black text-white uppercase tracking-tighter">গ্লোবাল</span>}
                                        </div>
                                        <h3 className="text-2xl font-black text-white leading-tight mb-2 group-hover:text-emerald-400 transition-colors">{camp.title}</h3>
                                        <div className="flex items-center gap-3 text-xs font-bold text-white/70">
                                            <span className="flex items-center gap-1.5"><MapPin size={14} /> {camp.union_name}</span>
                                            <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                                            <span className="flex items-center gap-1.5"><CalendarDays size={14} /> {toBnDigits(new Date(camp.deadline).toLocaleDateString('bn-BD'))}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 flex flex-col flex-1">
                                    <p className="text-base font-medium text-slate-500 leading-relaxed mb-8 line-clamp-3">
                                        {camp.description}
                                    </p>

                                    <div className="mb-8 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                        <div className="flex justify-between items-end mb-4">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">উত্তোলিত অর্থ</p>
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-3xl font-black text-emerald-600 tracking-tight">{toBnDigits(camp.raised_amount.toString())}</p>
                                                    <p className="text-sm font-black text-emerald-600/50">৳</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">লক্ষ্যমাত্রা</p>
                                                <p className="text-lg font-black text-slate-400">{toBnDigits(camp.target_amount.toString())} ৳</p>
                                            </div>
                                        </div>
                                        
                                        <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner relative mb-3">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${progress}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1, ease: 'easeOut' }}
                                                className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500`}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>{toBnDigits(progress)}% সম্পূর্ণ</span>
                                            {isComplete && <span className="text-emerald-500 flex items-center gap-1"><BadgeCheck size={12} /> লক্ষ্য অর্জিত</span>}
                                        </div>
                                     </div>

                                     {/* Social Share */}
                                     <div className="flex items-center gap-3 mb-8">
                                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">শেয়ার করুন:</p>
                                         <button 
                                             onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/u/' + camp.union_slug + '/services/donation')}`, '_blank')}
                                             className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all border border-blue-100"
                                         >
                                             <svg size={16} fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                         </button>
                                         <button 
                                             onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(camp.title + ' - অনুদান দিন: ' + window.location.origin + '/u/' + camp.union_slug + '/services/donation')}`, '_blank')}
                                             className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-all border border-emerald-100"
                                         >
                                             <svg size={16} fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                        </button>
                                    </div>

                                    <button 
                                        onClick={() => setSelectedProject(camp)}
                                        className={`w-full py-5 rounded-[24px] font-black text-base flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 ${
                                            isComplete 
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                                            : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-slate-900/20'
                                        }`}
                                    >
                                        <HandHeart size={20} />
                                        {isComplete ? 'ফান্ডিং সম্পন্ন হয়েছে' : 'অনুদানে অংশ নিন'}
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-16 flex items-center justify-center gap-3">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <ChevronRight className="rotate-180" size={24} />
                        </button>
                        
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-14 h-14 rounded-2xl font-black text-sm transition-all ${
                                    currentPage === i + 1 
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                    : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 shadow-sm'
                                }`}
                            >
                                {toBnDigits((i + 1).toString())}
                            </button>
                        ))}

                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                )}
            </div>

            {/* Donation Modal */}
            <AnimatePresence>
                {selectedProject && (
                    <DonationModal 
                        project={selectedProject} 
                        settings={settings}
                        onClose={() => setSelectedProject(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function DonationModal({ project, settings, onClose }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        donor_name: '',
        amount: '',
        payment_method: 'bkash',
        transaction_id: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await donationService.submitDonation({
                project_id: project.id,
                donor_name: formData.donor_name || 'বেনামী',
                amount: parseFloat(formData.amount),
                payment_method: formData.payment_method,
                transaction_id: formData.transaction_id,
                status: 'pending'
            });
            setStep(3); // Success step
        } catch (err) {
            alert("সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors z-10">
                    <X size={20} className="text-slate-400" />
                </button>

                {step === 1 && (
                    <div className="p-10">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                            <HandHeart size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">অনুদানে অংশ নিন</h3>
                        <p className="text-sm font-bold text-slate-500 mb-8">প্রজেক্ট: {project.title}</p>

                        <div className="space-y-6">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">পেমেন্ট করার নিয়ম:</h4>
                                <div className="space-y-4">
                                    {settings?.bkash_number && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 text-[10px] font-black">BK</div>
                                                <span className="text-sm font-black text-slate-700">{toBnDigits(settings.bkash_number)}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">বিকাশ (পার্সোনাল)</span>
                                        </div>
                                    )}
                                    {settings?.nagad_number && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 text-[10px] font-black">NG</div>
                                                <span className="text-sm font-black text-slate-700">{toBnDigits(settings.nagad_number)}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">নগদ (পার্সোনাল)</span>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-6 text-[11px] font-medium text-slate-500 leading-relaxed italic">
                                    * উপরে দেওয়া নম্বরে পেমেন্ট করার পর ট্রানজেকশন আইডি দিয়ে নিচের ফর্মটি পূরণ করুন।
                                </p>
                            </div>

                            <button 
                                onClick={() => setStep(2)}
                                className="w-full py-5 rounded-[24px] bg-slate-900 text-white font-black text-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                            >
                                আমি পেমেন্ট করেছি <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit} className="p-10">
                        <h3 className="text-2xl font-black text-slate-800 mb-8">তথ্য প্রদান করুন</h3>
                        
                        <div className="space-y-5 mb-8">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">আপনার নাম (ঐচ্ছিক)</label>
                                <input 
                                    type="text" 
                                    placeholder="বেনামী থাকতে খালি রাখুন"
                                    value={formData.donor_name}
                                    onChange={(e) => setFormData({...formData, donor_name: e.target.value})}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">টাকার পরিমাণ</label>
                                    <input 
                                        type="number" 
                                        required
                                        placeholder="৫০০"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">মেথড</label>
                                    <select 
                                        value={formData.payment_method}
                                        onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                    >
                                        <option value="bkash">বিকাশ</option>
                                        <option value="nagad">নগদ</option>
                                        <option value="bank">ব্যাংক</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">ট্রানজেকশন আইডি (TrxID)</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="8XKJ39..."
                                    value={formData.transaction_id}
                                    onChange={(e) => setFormData({...formData, transaction_id: e.target.value})}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={submitting}
                            className="w-full py-5 rounded-[24px] bg-emerald-600 text-white font-black text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            সাবমিট করুন
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <div className="p-10 text-center">
                        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-4">ধন্যবাদ!</h3>
                        <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">
                            আপনার ডোনেশন তথ্যটি সফলভাবে জমা হয়েছে। আমাদের অ্যাডমিন প্যানেল থেকে ট্রানজেকশন আইডি যাচাই করার পর আপনার নামটি পাবলিক লেজারে যুক্ত করা হবে।
                        </p>
                        <button 
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-sm"
                        >
                            বন্ধ করুন
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

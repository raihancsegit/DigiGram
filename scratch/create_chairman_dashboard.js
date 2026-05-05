const fs = require('fs');
const path = require('path');

const dir = 'app/(site)/chairman/dashboard';
fs.mkdirSync(dir, { recursive: true });

const pageJS = `
"use client";

import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PlusCircle, Newspaper, LogOut, ShieldCheck, ArrowLeft, Settings, 
    MessageSquare, TrendingUp, Users, MapPin, CheckCircle2, UserCircle
} from 'lucide-react';
import { logout } from '@/lib/store/features/authSlice';
import { wardService } from '@/lib/services/wardService';
import { supabase } from '@/lib/utils/supabase';
import { getWardsWithDetailsByUnion } from '@/lib/services/hierarchyService';

// We reuse WardNewsForm for Union by passing unionId as wardId
import WardNewsForm from '@/components/sections/ward/WardNewsForm'; 
import { toBnDigits } from '@/lib/utils/format';

export default function ChairmanDashboard() {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const router = useRouter();
    
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'news'
    
    const [unionName, setUnionName] = useState('');
    const [wards, setWards] = useState([]);
    const [newsList, setNewsList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'chairman') {
            router.push('/login');
            return;
        }
        loadData();
    }, [isAuthenticated, user, router]);

    const loadData = async () => {
        if (!user || user.role !== 'chairman') return;
        setLoading(true);
        try {
            // Get Union Details
            const { data: unionData } = await supabase
                .from('locations')
                .select('name_bn, name_en')
                .eq('id', user.access_scope_id)
                .single();
            if(unionData) setUnionName(unionData.name_bn);

            // Get Wards
            const wardsData = await getWardsWithDetailsByUnion(user.access_scope_id);
            setWards(wardsData);
            
            // Get Union News
            const news = await wardService.getNewsByLocation(user.access_scope_id);
            setNewsList(news);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteNews = async (newsId) => {
        if(!confirm('আপনি কি সত্যিই এই খবরটি মুছতে চান?')) return;
        try {
            await wardService.deleteNews(newsId);
            setNewsList(newsList.filter(n => n.id !== newsId));
        } catch(err) {
            alert('মুছতে সমস্যা হয়েছে');
        }
    }

    const aggregatedTotals = useMemo(() => {
        return wards.reduce((acc, w) => {
            return {
                population: acc.population + parseInt(w.stats?.population || 0),
                voters: acc.voters + parseInt(w.stats?.voters || 0),
                villages: acc.villages + (w.villages?.length || 0),
            };
        }, { population: 0, voters: 0, villages: 0 });
    }, [wards]);

    if (!isAuthenticated || !user || loading) {
        return <div className="min-h-screen flex items-center justify-center">লোড হচ্ছে...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                        <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <ShieldCheck className="text-teal-600" />
                            চেয়ারম্যান পোর্টাল 
                        </h1>
                    </div>
                    
                    <button 
                        onClick={() => {
                            dispatch(logout());
                            router.push('/login');
                        }}
                        className="flex items-center gap-2 text-red-500 font-bold text-sm hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
                    >
                        <LogOut size={18} />
                        লগআউট
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                
                {/* Hero Greeting */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[32px] p-8 md:p-12 text-white shadow-xl mb-10 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <ShieldCheck size={160} strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-widest mb-4">
                                <SparklesIcon />
                                কেন্দ্রীয় ড্যাশবোর্ড
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
                                স্বাগতম, <br className="hidden sm:block" />
                                <span className="text-indigo-400">{user.first_name} {user.last_name || ''}</span>
                            </h2>
                            <p className="text-slate-300 font-bold max-w-lg mb-6">
                                আপনি 
                                <span className="text-white px-3 py-1 bg-white/10 rounded-lg mx-2 border border-white/10">{unionName}</span> 
                                এর চেয়ারম্যান হিসেবে যুক্ত আছেন।
                            </p>
                            
                            <div className="flex flex-wrap gap-4">
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10 text-left">
                                    <p className="flex items-center gap-2 text-xs font-black uppercase text-indigo-300 mb-2">
                                        <Users size={14} /> মোট জনসংখ্যা
                                    </p>
                                    <p className="text-3xl font-black">{toBnDigits((aggregatedTotals.population||0).toString())}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10 text-left">
                                    <p className="flex items-center gap-2 text-xs font-black uppercase text-teal-300 mb-2">
                                        <Users size={14} /> মোট ভোটার
                                    </p>
                                    <p className="text-3xl font-black">{toBnDigits((aggregatedTotals.voters||0).toString())}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10 text-left">
                                    <p className="flex items-center gap-2 text-xs font-black uppercase text-amber-300 mb-2">
                                        <MapPin size={14} /> মোট গ্রাম
                                    </p>
                                    <p className="text-3xl font-black">{toBnDigits((aggregatedTotals.villages||0).toString())}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Tab Switcher */}
                <div className="flex p-1 bg-slate-200/50 rounded-2xl w-fit mb-8 gap-1">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={\`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all \${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                    >
                        <Settings size={18} />
                        ওয়াড ওভারভিউ
                    </button>
                    <button 
                        onClick={() => setActiveTab('news')}
                        className={\`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all \${activeTab === 'news' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                    >
                        <MessageSquare size={18} />
                        ইউনিয়ন নিউজ ও নোটিশ
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'overview' ? (
                        <motion.div 
                            key="overview"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="bg-white rounded-[40px] p-6 md:p-10 border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <MapPin size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800">ওয়াড ওভারভিউ</h3>
                                        <p className="text-sm font-bold text-slate-400 mt-1">মেম্বারদের দ্বারা অন্তর্ভুক্ত সর্বশেষ তথ্য</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {wards.length === 0 ? (
                                        <div className="col-span-12 text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                            <p className="text-slate-400 font-bold">কোনো ওয়াড পাওয়া যায়নি।</p>
                                        </div>
                                    ) : (
                                        wards.map((ward) => (
                                            <div key={ward.id} className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-indigo-200 transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="font-black text-xl text-slate-800">{ward.name}</h4>
                                                    <span className="text-[10px] font-black uppercase px-3 py-1 bg-teal-100 text-teal-700 rounded-full">
                                                        {ward.villages?.length || 0}টি গ্রাম
                                                    </span>
                                                </div>
                                                
                                                <div className="space-y-3 mb-6">
                                                    <div className="flex justify-between py-2 border-b border-slate-200/50">
                                                        <span className="text-xs font-bold text-slate-500">জনসংখ্যা</span>
                                                        <span className="text-sm font-black">{toBnDigits((ward.stats?.population||0).toString())}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b border-slate-200/50">
                                                        <span className="text-xs font-bold text-slate-500">মোট ভোটার</span>
                                                        <span className="text-sm font-black">{toBnDigits((ward.stats?.voters||0).toString())}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <UserCircle size={20} className="text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-indigo-400 mb-0.5">দায়িত্বপ্রাপ্ত মেম্বার</p>
                                                        <p className="text-sm font-black text-slate-700">{ward.member ? ward.member.name : 'নিয়োগ দেয়া হয়নি'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="news"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                        >
                            {/* Left: Input Form */}
                            <div className="lg:col-span-7 space-y-8">
                                <section className="bg-white rounded-[32px] p-6 md:p-10 border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Newspaper size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800">ইউনিয়ন নোটিশ যোগ করুন</h3>
                                            <p className="text-sm font-bold text-slate-400 mt-1">পুরো ইউনিয়নের জন্য সাধারণ নোটিশ বা খবর</p>
                                        </div>
                                    </div>
                                    {/* We reuse the WardNewsForm component because it accepts any locationId mapping to local_news */}
                                    <WardNewsForm 
                                        user={{...user, id: user.id}} // WardNewsForm needs user.id
                                        wardId={user.access_scope_id} // Store under union location id
                                        onSuccess={loadData} 
                                    />
                                </section>
                            </div>

                            {/* Right: Existing News */}
                            <div className="lg:col-span-5 space-y-8">
                                <section className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                            <Newspaper className="text-indigo-600" />
                                            সাম্প্রতিক নোটিশসমূহ
                                        </h3>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{newsList.length} টি</span>
                                    </div>

                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                        {newsList.length === 0 ? (
                                            <div className="text-center py-12 px-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                                                <p className="font-bold text-slate-400">এখনো কোনো நோটিস শেয়ার করেননি!</p>
                                            </div>
                                        ) : (
                                            newsList.map((news, idx) => (
                                                <motion.div 
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    key={news.id} 
                                                    className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all group"
                                                >
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase mb-2 block">{news.category}</span>
                                                    <h4 className="font-black text-slate-800 text-base leading-tight mb-2 group-hover:text-indigo-700 transition-colors">
                                                        {news.title}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mb-3">{news.excerpt}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-400 tracking-tighter">
                                                            {new Date(news.created_at).toLocaleDateString('bn-BD')}
                                                        </span>
                                                        <button 
                                                            onClick={() => handleDeleteNews(news.id)}
                                                            className="text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase"
                                                        >মুছুন</button>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </section>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

function SparklesIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
    )
}
`;

fs.writeFileSync(path.join(dir, 'page.js'), pageJS, 'utf-8');
console.log('Chairman Dashboard created');

import fs from 'fs';

let pageJsPath = 'app/(site)/ward-member/dashboard/page.js';

let pageContent = `
"use client";

import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PlusCircle, Newspaper, LogOut, ShieldCheck, ArrowLeft, Settings, 
    MessageSquare, TrendingUp
} from 'lucide-react';
import { logout } from '@/lib/store/features/authSlice';
import WardNewsForm from '@/components/sections/ward/WardNewsForm';
import WardManagementSection from '@/components/sections/ward/WardManagementSection';
import { wardService } from '@/lib/services/wardService';

export default function WardMemberDashboard() {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('news'); // 'news' or 'management'
    const [wardInfo, setWardInfo] = useState(null);
    const [newsList, setNewsList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'ward_member') {
            router.push('/login');
            return;
        }
        
        loadWardData();
    }, [isAuthenticated, user, router]);

    const loadWardData = async () => {
        if (!user || user.role !== 'ward_member') return;
        setLoading(true);
        try {
            const ward = await wardService.getWardStats(user.access_scope_id);
            setWardInfo(ward);
            
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

    if (!isAuthenticated || !user || loading) {
        return <div className="min-h-screen flex items-center justify-center">লোড হচ্ছে...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header / Top Bar */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                        <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <ShieldCheck className="text-teal-600" />
                            মেম্বার পোর্টাল 
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
                    className="bg-gradient-to-br from-slate-900 to-teal-900 rounded-[32px] p-8 md:p-12 text-white shadow-xl mb-10 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <ShieldCheck size={160} strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-2 text-teal-400 text-xs font-black uppercase tracking-widest mb-4">
                                <SparklesIcon />
                                অফিসিয়াল ড্যাশবোর্ড
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black mb-4">
                                স্বাগতম, <span className="text-teal-400">{user.first_name} {user.last_name || ''}</span>
                            </h2>
                            <p className="text-slate-300 font-bold max-w-lg">
                                আপনি 
                                <span className="text-white px-2 py-0.5 bg-white/10 rounded-lg mx-1">{wardInfo?.name_bn || 'ওয়ার্ড'}</span> 
                                এর মেম্বার হিসেবে যুক্ত আছেন।
                            </p>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex-1 md:flex-none md:w-32 text-center">
                                <p className="text-[10px] font-black uppercase text-teal-400 mb-1">মোট নিউজ</p>
                                <p className="text-2xl font-black tracking-tighter">{newsList.length}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Tab Switcher */}
                <div className="flex p-1 bg-slate-200/50 rounded-2xl w-fit mb-8 gap-1">
                    <button 
                        onClick={() => setActiveTab('news')}
                        className={\`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all \${activeTab === 'news' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                    >
                        <MessageSquare size={18} />
                        নিউজ ও আপডেট
                    </button>
                    <button 
                        onClick={() => setActiveTab('management')}
                        className={\`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all \${activeTab === 'management' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                    >
                        <Settings size={18} />
                        ওয়াড ম্যানেজমেন্ট
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'news' ? (
                        <motion.div 
                            key="news"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                        >
                            {/* Left: Input Form */}
                            <div className="lg:col-span-7 space-y-8">
                                <section className="bg-white rounded-[32px] p-6 md:p-10 border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                                            <PlusCircle size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800">নতুন খবর যোগ করুন</h3>
                                            <p className="text-sm font-bold text-slate-400 leading-none mt-1">আপনার ওয়াডের বাসিন্দাদের আপডেট রাখুন</p>
                                        </div>
                                    </div>
                                    <WardNewsForm user={user} onSuccess={loadWardData} wardId={user.access_scope_id} />
                                </section>
                            </div>

                            {/* Right: Existing News */}
                            <div className="lg:col-span-5 space-y-8">
                                <section className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                            <Newspaper className="text-teal-600" />
                                            আমার শেয়ার করা খবর
                                        </h3>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{newsList.length} টি</span>
                                    </div>

                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                        {newsList.length === 0 ? (
                                            <div className="text-center py-12 px-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                    <TrendingUp className="text-slate-300" />
                                                </div>
                                                <p className="font-bold text-slate-400">এখনো কোনো খবর শেয়ার করেননি!</p>
                                            </div>
                                        ) : (
                                            newsList.map((news, idx) => (
                                                <motion.div 
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    key={news.id} 
                                                    className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-teal-200 hover:shadow-md transition-all group"
                                                >
                                                    <span className="text-[10px] font-black text-teal-600 uppercase mb-2 block">{news.category}</span>
                                                    <h4 className="font-black text-slate-800 text-base leading-tight mb-2 group-hover:text-teal-700 transition-colors">
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
                    ) : (
                        <motion.div 
                            key="management"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white rounded-[40px] p-6 md:p-12 border border-slate-200 shadow-sm"
                        >
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-14 h-14 rounded-3xl bg-teal-500 flex items-center justify-center text-white shadow-xl shadow-teal-100 shrink-0">
                                    <Settings size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 leading-tight">ওয়াড ম্যানেজমেন্ট</h3>
                                    <p className="text-sm font-bold text-slate-400 mt-1">আপনার ওয়াডের প্রোফাইল এবং পরিসংখ্যান এখান থেকে নিয়ন্ত্রন করুন</p>
                                </div>
                            </div>
                            <WardManagementSection user={user} wardInfo={wardInfo} />
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

fs.writeFileSync(pageJsPath, pageContent, 'utf-8');
console.log('Updated ward-member dashboard page.js');

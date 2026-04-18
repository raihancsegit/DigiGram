'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, QrCode, ArrowUpRight, ArrowDownRight, Building2, MapPin,
    Calendar, Clock, Heart, BookOpen, AlertCircle, Phone, FileText,
    CreditCard, CheckCircle2, Moon, Sun, Download, Image as ImageIcon,
    Target, Music, Play, Calculator, CircleDollarSign, Fingerprint,
    Library, PlayCircle, PauseCircle, SkipForward, SkipBack, BookMarked,
    ArrowLeft
} from 'lucide-react';
import { layout } from '@/lib/theme';
import { paths } from '@/lib/constants/paths';

// Mock Data
const MOCK_MOSQUE = {
    name: "বায়তুল মোকাররম সেন্ট্রাল মসজিদ",
    village: "নওহাটা",
    balance: "৪৫,৫০০",
    khutba: "রমজানের পবিত্রতা রক্ষা ও যাকাতের গুরুত্ব",
    namaz: [
        { name: "ফজর", time: "৫:০০ AM", icon: Moon },
        { name: "যোহর", time: "১:৩০ PM", icon: Sun },
        { name: "আসর", time: "৫:১৫ PM", icon: Sun },
        { name: "মাগরিব", time: "৬:৪৫ PM", icon: Sun },
        { name: "এশা", time: "৮:৩০ PM", icon: Moon },
        { name: "জুম্মা", time: "১:৩০ PM", icon: Sun },
    ],
    fundGoal: { target: 200000, raised: 145000, title: "নতুন সোলার প্যানেল ক্রয়" },
    lastIncomes: [
        { id: 1, source: "জুম্মার কালেকশন", amount: "১২,৫০০", date: "১৫ মার্চ ২০২৬", type: "income" },
        { id: 2, source: "মাসিক মুসুল্লি চাঁদা", amount: "৫,০০০", date: "১৪ মার্চ ২০২৬", type: "income" },
        { id: 3, source: "প্রবাসী দান (সৌদি)", amount: "১০,০০০", date: "১০ মার্চ ২০২৬", type: "income" },
        { id: 4, source: "পুকুরের মাছ বিক্রি", amount: "৭,২০০", date: "০৫ মার্চ ২০২৬", type: "income" },
    ],
    lastExpenses: [
        { id: 101, source: "বিদ্যুৎ বিল (ফেব্রুয়ারি)", amount: "৩,৫০০", date: "১২ মার্চ ২০২৬", type: "expense", hasReceipt: true },
        { id: 102, source: "ইমাম সাহেবের বেতন", amount: "১৫,০০০", date: "০১ মার্চ ২০২৬", type: "expense", hasReceipt: false },
        { id: 103, source: "মোয়াজ্জিন সাহেবের বেতন", amount: "১০,০০০", date: "০১ মার্চ ২০২৬", type: "expense", hasReceipt: false },
        { id: 104, source: "২টি নতুন এসি ক্রয়", amount: "৮৫,০০০", date: "২০ ফেব্রুয়ারি ২০২৬", type: "expense", hasReceipt: true },
    ]
};

const TAB_DASHBOARD = 'dashboard';
const TAB_LEDGER = 'ledger';
const TAB_PASSBOOK = 'passbook';
const TAB_DONATION = 'donation';
const TAB_EDUCATION = 'education';

export default function MosquePortalClient({ mosqueId }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(TAB_DASHBOARD);
    const [ledgerFilter, setLedgerFilter] = useState('all'); // 'all', 'income', 'expense'
    const [viewReceipt, setViewReceipt] = useState(null);
    const [activeEduCategory, setActiveEduCategory] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);

    // Mock Content mapping for Education Center
    const EDU_CONTENT = {
        1: { title: "নূরানী কায়দা - মাখরাজ শিক্ষা (পর্ব ১)", author: "ক্বারী মোঃ শহিদুল্লাহ", category: "নূরানী কুরআন শিক্ষা", duration: "18:45 / 35:20", progress: "52%" },
        2: { title: "দাঁড়িয়ে পানি পান করার হুকুম ও সুন্নাহ", author: "মুফতি আব্দুর রহমান", category: "দৈনন্দিন ফিকহ ও মাসায়েল", duration: "05:10 / 12:30", progress: "40%" },
        3: { title: "নিয়তের গুরুত্ব - রিয়াদুস সালেহীন", author: "মাওলানা আব্দুল্লাহিল বাকী", category: "হাদিস পরিচিতি (অডিও)", duration: "12:45 / 45:20", progress: "35%" }
    };

    // Merge transactions for ledger and sort (mock sorting)
    const transactions = [...MOCK_MOSQUE.lastIncomes, ...MOCK_MOSQUE.lastExpenses]
        .sort((a, b) => b.id - a.id);

    const filteredTransactions = ledgerFilter === 'all'
        ? transactions
        : transactions.filter(t => t.type === ledgerFilter);

    return (
        <div className="dg-section-x px-2 mx-auto md:px-6 pb-32 pt-4 md:pt-8 bg-slate-50 min-h-screen">
            <div className="max-w-[1000px] mx-auto" style={{ maxWidth: layout.servicesMaxPx }}>

                {/* Header Action */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <button onClick={() => router.back()} className="p-2.5 rounded-xl bg-white border border-emerald-100 hover:bg-emerald-50 transition-all text-emerald-600 shadow-sm flex items-center gap-2 group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                            <span className="text-[11px] font-black uppercase tracking-widest pr-1">ফিরে যান</span>
                        </button>
                        <Link href={paths.home} className="p-2.5 rounded-xl bg-white border border-emerald-100 hover:bg-emerald-50 transition-all text-emerald-600 shadow-sm group">
                            <Home size={16} className="group-hover:scale-110 transition-transform" />
                        </Link>
                    </div>
                    <div className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                        স্মার্ট মসজিদ পোর্টাল
                    </div>
                </div>

                {/* Main Hero Card */}
                <div className="relative overflow-hidden rounded-[32px] md:rounded-[48px] bg-gradient-to-b from-emerald-900 to-emerald-950 text-white shadow-2xl mb-8 border border-emerald-800">
                    {/* Islamic Geometric Pattern Mock background */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2310b981\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

                    <div className="relative p-8 md:p-12">
                        <div className="grid md:grid-cols-12 gap-8 items-center">
                            <div className="md:col-span-8 space-y-6">
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-black text-emerald-50 tracking-tight leading-tight mb-2">
                                        {MOCK_MOSQUE.name}
                                    </h1>
                                    <p className="text-emerald-400 font-bold flex items-center gap-2">
                                        <MapPin size={16} /> মোকাঃ {MOCK_MOSQUE.village}
                                    </p>
                                </div>

                                <div className="p-6 rounded-[24px] bg-white/10 border border-white/10 backdrop-blur-md inline-block">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-1">বর্তমান ব্যালেন্স (লাইভ)</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl md:text-5xl font-black text-white">৳ {MOCK_MOSQUE.balance}</span>
                                        <span className="text-emerald-400 font-bold">টাকা</span>
                                    </div>
                                </div>

                                {/* Fund Goal Tracker */}
                                <div className="p-5 rounded-[24px] bg-slate-900/40 border border-emerald-500/20 max-w-[400px]">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-xs font-black text-emerald-300 flex items-center gap-1.5"><Target size={14}/> {MOCK_MOSQUE.fundGoal.title}</p>
                                        <p className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                            {Math.round((MOCK_MOSQUE.fundGoal.raised / MOCK_MOSQUE.fundGoal.target) * 100)}%
                                        </p>
                                    </div>
                                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-2">
                                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 rounded-full" style={{ width: `${(MOCK_MOSQUE.fundGoal.raised / MOCK_MOSQUE.fundGoal.target) * 100}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                        <span>উত্তোলিত: ৳{(MOCK_MOSQUE.fundGoal.raised).toLocaleString()}</span>
                                        <span>টার্গেট: ৳{(MOCK_MOSQUE.fundGoal.target).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-4 flex justify-center md:justify-end">
                                <div className="p-4 rounded-[28px] bg-white shadow-xl text-center w-full max-w-[200px]">
                                    <div className="w-full aspect-square bg-slate-100 rounded-[16px] flex items-center justify-center p-2 mb-3">
                                        <QrCode size={120} className="text-slate-800" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase">স্ক্যান করে ফান্ড দেখুন</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Emergency & Religious Info Banner */}
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                    <div className="p-6 rounded-[24px] bg-orange-50 border border-orange-200">
                        <h3 className="text-sm font-black text-orange-800 flex items-center gap-2 mb-3">
                            <AlertCircle size={18} /> জরুরী ঘোষণা / জানাজা
                        </h3>
                        <p className="text-orange-900 font-bold mb-1">আগামীকাল সকাল ৯টায় ঈদগাহ মাঠে মরহুম আঃ জলিল সাহেবের জানাজা অনুষ্ঠিত হবে।</p>
                    </div>
                    <div className="p-6 rounded-[24px] bg-emerald-50 border border-emerald-200">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-3">
                            <h3 className="text-sm font-black text-emerald-800 flex items-center gap-2">
                                <BookOpen size={18} /> আগামী জুম্মার খুতবা
                            </h3>
                            {/* Audio Mock */}
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition-colors w-fit">
                                <Play size={12} /> গত জুম্মার খুতবা শুনুন
                            </button>
                        </div>
                        <p className="text-emerald-900 font-black text-lg">{MOCK_MOSQUE.khutba}</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 p-1 sm:p-2 bg-white rounded-[24px] border border-slate-200 shadow-sm">
                    {[
                        { id: TAB_DASHBOARD, label: 'ড্যাশবোর্ড', icon: Home },
                        { id: TAB_EDUCATION, label: 'ইসলামিক শিক্ষা', icon: Library },
                        { id: TAB_LEDGER, label: 'স্বচ্ছ হিসাব', icon: FileText },
                        { id: TAB_PASSBOOK, label: 'মুসুল্লি পাসবুক', icon: BookOpen },
                        { id: TAB_DONATION, label: 'দান করুন', icon: Heart },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-[16px] font-black text-sm whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="min-h-[400px]">
                    {activeTab === TAB_DASHBOARD && (
                        <div className="space-y-6">
                            {/* Namaz Times */}
                            <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200 shadow-sm">
                                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                    <Clock className="text-emerald-500" /> জামাতের সময়সূচী
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                    {MOCK_MOSQUE.namaz.map((n, i) => (
                                        <div key={i} className="p-4 rounded-[20px] bg-slate-50 border border-slate-100 text-center hover:border-emerald-200 hover:bg-emerald-50 transition-colors">
                                            <n.icon size={20} className="mx-auto mb-2 text-slate-400" />
                                            <p className="text-xs font-black text-slate-500 mb-1">{n.name}</p>
                                            <p className="text-sm font-black text-emerald-700">{n.time}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Zakat & Ramadan Info Add-on */}
                            <div className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-r from-teal-900 to-emerald-900 border border-emerald-800 text-white shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <Moon size={120} />
                                </div>
                                <div className="grid md:grid-cols-2 gap-6 relative">
                                    <div>
                                        <h3 className="text-lg font-black text-emerald-100 mb-2 flex items-center gap-2">
                                            <Calendar size={18} /> রমজান ক্যালেন্ডার
                                        </h3>
                                        <p className="text-sm text-emerald-200/70 mb-4">আজ ১৭ই রমজান, ১৪৪৭ হিজরি</p>
                                        <div className="flex gap-4">
                                            <div className="bg-emerald-800/40 p-3 rounded-2xl border border-emerald-500/20 flex-1">
                                                <p className="text-[10px] font-bold text-emerald-300 uppercase mb-1">ইফতার</p>
                                                <p className="font-black text-xl">৬:১৭ <span className="text-sm">PM</span></p>
                                            </div>
                                            <div className="bg-emerald-800/40 p-3 rounded-2xl border border-emerald-500/20 flex-1">
                                                <p className="text-[10px] font-bold text-emerald-300 uppercase mb-1">সেহরি শেষ</p>
                                                <p className="font-black text-xl">৪:৪০ <span className="text-sm">AM</span></p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-emerald-500/20 pt-6 md:pt-0 md:pl-6">
                                        <h3 className="text-lg font-black text-emerald-100 flex items-center gap-2 mb-2">
                                            <Calculator size={18} /> জাকাত ক্যালকুলেটর
                                        </h3>
                                        <p className="text-xs text-emerald-200/70 font-bold mb-4">আপনার সম্পদের সঠিক জাকাত হিসেব করুন এবং সরাসরি মসজিদের দুস্থ ফান্ডে জমা দিন।</p>
                                        <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-emerald-900 font-black text-sm hover:bg-emerald-50 transition-all">
                                            হিসাব শুরু করুন <ArrowUpRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Ledger Summary */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                        <ArrowDownRight className="text-emerald-500 bg-emerald-50 p-1 rounded-lg" size={24} />
                                        সর্বশেষ আয়
                                    </h3>
                                    <div className="space-y-4">
                                        {MOCK_MOSQUE.lastIncomes.slice(0, 3).map((item, i) => (
                                            <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                                                <div>
                                                    <p className="font-bold text-slate-700">{item.source}</p>
                                                    <p className="text-[10px] font-black text-slate-400">{item.date}</p>
                                                </div>
                                                <p className="font-black text-emerald-600">+ ৳{item.amount}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => setActiveTab(TAB_LEDGER)} className="w-full mt-6 py-3 rounded-xl bg-slate-50 text-slate-500 font-bold text-sm hover:bg-slate-100 transition-colors">
                                        সব আয় দেখুন
                                    </button>
                                </div>

                                <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                        <ArrowUpRight className="text-rose-500 bg-rose-50 p-1 rounded-lg" size={24} />
                                        সর্বশেষ ব্যয়
                                    </h3>
                                    <div className="space-y-4">
                                        {MOCK_MOSQUE.lastExpenses.slice(0, 3).map((item, i) => (
                                            <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                                                <div>
                                                    <p className="font-bold text-slate-700">{item.source}</p>
                                                    <p className="text-[10px] font-black text-slate-400">{item.date}</p>
                                                </div>
                                                <p className="font-black text-rose-600">- ৳{item.amount}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => setActiveTab(TAB_LEDGER)} className="w-full mt-6 py-3 rounded-xl bg-slate-50 text-slate-500 font-bold text-sm hover:bg-slate-100 transition-colors">
                                        সব ব্যয় দেখুন
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === TAB_EDUCATION && (
                        <div className="space-y-6">
                            {/* Education Header */}
                            <div className="p-8 md:p-12 rounded-[32px] bg-emerald-900 border border-emerald-800 text-white shadow-lg text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <Library size={160} />
                                </div>
                                <div className="relative">
                                    <div className="w-20 h-20 bg-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-700">
                                        <BookMarked className="text-emerald-300" size={32} />
                                    </div>
                                    <h2 className="text-3xl font-black text-emerald-50 mb-3">মাদরাসা ও ইসলামী শিক্ষা কেন্দ্র</h2>
                                    <p className="text-md font-bold text-emerald-200 focus:outline-none max-w-lg mx-auto">
                                        সহীহ কুরআন শিক্ষা, মাসায়েল, এবং হাদিসের ডিজিটাল দরস। ঘরে বসে মসজিদের শিক্ষকদের মাধ্যমে দ্বীনি জ্ঞান অর্জন করুন।
                                    </p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-12 gap-6">
                                {/* Audio Player Column */}
                                <div className="md:col-span-7">
                                    <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200 shadow-sm relative overflow-hidden h-full">
                                        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.5),transparent)]" />
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Music size={14} /> {EDU_CONTENT[activeEduCategory].category}
                                                </h3>
                                                {isPlaying ? (
                                                    <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        প্লে হচ্ছে...
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded bg-rose-50 text-rose-500 text-[10px] font-black uppercase flex items-center gap-1 animate-pulse">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                        পজ করা আছে
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="mb-8">
                                                <h4 className="text-2xl font-black text-slate-800 mb-2">{EDU_CONTENT[activeEduCategory].title}</h4>
                                                <p className="text-sm font-bold text-slate-500">আলোচক: {EDU_CONTENT[activeEduCategory].author}</p>
                                            </div>

                                            {/* Beautiful Audio Player Mock */}
                                            <div className="bg-slate-900 rounded-[24px] p-6 text-white shadow-xl relative overflow-hidden">
                                                {/* Audio pulse effect */}
                                                {isPlaying && (
                                                    <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />
                                                )}
                                                <div className="flex items-center gap-4 mb-6 relative">
                                                    <div className="w-full h-2 bg-slate-800 rounded-full cursor-pointer relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: EDU_CONTENT[activeEduCategory].progress }} />
                                                    </div>
                                                    <span className="text-xs font-black text-slate-400 font-mono shrink-0">{EDU_CONTENT[activeEduCategory].duration}</span>
                                                </div>
                                                <div className="flex items-center justify-center gap-8 relative">
                                                    <button className="text-slate-400 hover:text-white transition-colors">
                                                        <SkipBack size={24} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setIsPlaying(!isPlaying)}
                                                        className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-400 hover:scale-110 transition-all shadow-lg shadow-emerald-500/20"
                                                    >
                                                        {isPlaying ? <PauseCircle size={32} /> : <PlayCircle size={32} />}
                                                    </button>
                                                    <button className="text-slate-400 hover:text-white transition-colors">
                                                        <SkipForward size={24} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Subjects Column */}
                                <div className="md:col-span-5 space-y-4">
                                    <div 
                                        onClick={() => { setActiveEduCategory(1); setIsPlaying(true); }}
                                        className={`p-6 rounded-[24px] border min-h-[120px] flex items-center group cursor-pointer transition-colors ${activeEduCategory === 1 ? 'bg-teal-100 border-teal-200' : 'bg-teal-50 border-teal-100 hover:bg-teal-100'}`}
                                    >
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 bg-teal-200 text-teal-700 rounded-xl flex items-center justify-center font-black">১</div>
                                            <div>
                                                <h4 className="text-lg font-black text-teal-900 group-hover:text-teal-700">নূরানী কুরআন শিক্ষা</h4>
                                                <p className="text-xs font-bold text-teal-700/70 mt-1">মাখরাজ ও তাজবীদ সহকারে তিলাওয়াত</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div 
                                        onClick={() => { setActiveEduCategory(2); setIsPlaying(true); }}
                                        className={`p-6 rounded-[24px] border min-h-[120px] flex items-center group cursor-pointer transition-colors ${activeEduCategory === 2 ? 'bg-blue-100 border-blue-200' : 'bg-blue-50 border-blue-100 hover:bg-blue-100'}`}
                                    >
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 bg-blue-200 text-blue-700 rounded-xl flex items-center justify-center font-black">২</div>
                                            <div>
                                                <h4 className="text-lg font-black text-blue-900 group-hover:text-blue-700">দৈনন্দিন ফিকহ ও মাসায়েল</h4>
                                                <p className="text-xs font-bold text-blue-700/70 mt-1">নামাজ, রোজা এবং ওযুর সঠিক নিয়মাবলী</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div 
                                        onClick={() => { setActiveEduCategory(3); setIsPlaying(true); }}
                                        className={`p-6 rounded-[24px] border min-h-[120px] flex items-center group cursor-pointer transition-colors ${activeEduCategory === 3 ? 'bg-slate-200 border-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                                    >
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center font-black">৩</div>
                                            <div>
                                                <h4 className="text-lg font-black text-slate-800 group-hover:text-slate-600">হাদিস পরিচিতি (অডিও)</h4>
                                                <p className="text-xs font-bold text-slate-500 mt-1">রিয়াদুস সালেহীন থেকে নির্বাচিত হাদিস</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === TAB_LEDGER && (
                        <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200 shadow-sm">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">স্বচ্ছ হিসাব (Ledger)</h2>
                                    <p className="text-sm font-bold text-slate-500">মসজিদের আয়-ব্যয়ের প্রতিটি পয়সার হিসাব</p>
                                </div>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    {[
                                        { id: 'all', label: 'সব' },
                                        { id: 'income', label: 'আয়' },
                                        { id: 'expense', label: 'ব্যয়' }
                                    ].map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setLedgerFilter(f.id)}
                                            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${ledgerFilter === f.id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                                                }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="overflow-x-auto -mx-6 sm:mx-0">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                            <th className="p-4 border-b border-slate-100 first:pl-6 rounded-tl-xl">তারিখ</th>
                                            <th className="p-4 border-b border-slate-100">বিবরণ</th>
                                            <th className="p-4 border-b border-slate-100 text-right">পরিমাণ (৳)</th>
                                            <th className="p-4 border-b border-slate-100 last:pr-6 text-center rounded-tr-xl">প্রমাণক</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredTransactions.map((t, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 pl-6 text-xs font-bold text-slate-500">{t.date}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${t.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                        <span className="font-black text-slate-700 text-sm">{t.source}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {t.type === 'income' ? '+' : '-'} {t.amount}
                                                    </span>
                                                </td>
                                                <td className="p-4 pr-6 text-center">
                                                    {t.hasReceipt ? (
                                                        <button
                                                            onClick={() => setViewReceipt(t)}
                                                            className="inline-flex p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                            title="ভাউচার দেখুন"
                                                        >
                                                            <ImageIcon size={16} />
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-6 flex justify-center">
                                <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors">
                                    <Download size={16} /> পিডিএফ ডাউনলোড
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === TAB_PASSBOOK && (
                        <div className="max-w-[500px] mx-auto">
                            <div className="p-8 rounded-[32px] bg-white border border-slate-200 shadow-sm text-center">
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <BookOpen className="text-emerald-500" size={32} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 mb-2">আপনার মুসুল্লি পাসবুক</h2>
                                <p className="text-sm font-bold text-slate-500 mb-8">
                                    আপনার প্রদত্ত মাসিক চাঁদা এবং দানকৃত অর্থের ডিজিটাল হিসাব।
                                </p>

                                <div className="bg-slate-50 rounded-[24px] p-6 text-left mb-6">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">লগইন করুন</p>
                                    <input
                                        type="text"
                                        placeholder="পাসবুক নম্বর বা মোবাইল নম্বর"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-600 mb-4 focus:outline-none focus:border-emerald-500"
                                    />
                                    <button className="w-full bg-emerald-600 text-white font-black py-3 rounded-xl hover:bg-emerald-700 transition-colors">
                                        হিসাব দেখুন
                                    </button>
                                </div>
                                <p className="text-xs text-rose-500 font-bold flex flex-col items-center gap-1 justify-center">
                                    <AlertCircle size={14} />
                                    যাদের ২ মাসের বেশি চাঁদা বকেয়া, তাদের নাম্বারে অটো-নোটিফিকেশন পাঠানো হবে।
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === TAB_DONATION && (
                        <div className="max-w-[600px] mx-auto">
                            <div className="p-8 rounded-[32px] bg-white border border-emerald-100 shadow-lg text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Heart size={120} />
                                </div>
                                <div className="relative">
                                    <h2 className="text-2xl font-black text-emerald-800 mb-2">মসজিদের ফান্ডে দান করুন</h2>
                                    <p className="text-sm font-bold text-slate-500 mb-8">
                                        প্রবাসী বা দূরে থাকা মানুষের জন্য সরাসরি ফান্ডে টাকা পাঠানোর ব্যবস্থা। আপনার দান সরাসরি আয়ের হিসাবে যোগ হবে।
                                    </p>

                                    <div className="space-y-4 mb-8">
                                        <button className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-pink-100 hover:border-pink-500 hover:bg-pink-50 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 font-extrabold text-xs">bKash</div>
                                                <div className="text-left">
                                                    <p className="font-black text-slate-700">বিকাশ পেমেন্ট</p>
                                                    <p className="text-xs text-slate-500 font-bold">মার্চেন্ট বা সেন্ড মানি</p>
                                                </div>
                                            </div>
                                            <ArrowUpRight className="text-slate-300 group-hover:text-pink-500" />
                                        </button>

                                        <button className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-orange-100 hover:border-orange-500 hover:bg-orange-50 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 font-extrabold text-xs">Nagad</div>
                                                <div className="text-left">
                                                    <p className="font-black text-slate-700">নগদ পেমেন্ট</p>
                                                    <p className="text-xs text-slate-500 font-bold">অটোমেটিক আপডেট</p>
                                                </div>
                                            </div>
                                            <ArrowUpRight className="text-slate-300 group-hover:text-orange-500" />
                                        </button>

                                        <button className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 hover:border-slate-800 hover:bg-slate-50 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-extrabold text-xs">
                                                    <CreditCard size={20} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-black text-slate-700">ব্যাংক ট্রান্সফার</p>
                                                    <p className="text-xs text-slate-500 font-bold">ইসলামী ব্যাংক বাংলাদেশ ලිঃ</p>
                                                </div>
                                            </div>
                                            <ArrowUpRight className="text-slate-300 group-hover:text-slate-800" />
                                        </button>
                                    </div>

                                    <div className="text-sm font-bold text-emerald-600 flex items-center justify-center gap-2 bg-emerald-50 py-3 rounded-xl border border-emerald-100">
                                        <CheckCircle2 size={16} /> সদকায়ে জারিয়া হিসেবে কবুল হোক
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Admin / Cashier Gateway Link */}
                <div className="mt-12 text-center pb-8">
                    <div className="inline-flex flex-col items-center p-6 rounded-[32px] bg-white border border-slate-200 shadow-sm">
                        <Fingerprint size={32} className="text-slate-300 mb-3" />
                        <h4 className="font-black text-slate-800">কমিটি ড্যাশবোর্ড</h4>
                        <p className="text-[10px] font-bold text-slate-500 mb-4 uppercase tracking-widest">রেজিস্টার্ড সদস্যদের জন্য</p>
                        <Link href={`/m/${mosqueId}/admin`} className="px-6 py-2 rounded-full bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-colors">
                            ক্যাশিয়ার লগইন
                        </Link>
                    </div>
                </div>

            </div>

            {/* Receipt Modal Mock */}
            {viewReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] p-8 max-w-[400px] w-full shadow-2xl relative">
                        <button
                            onClick={() => setViewReceipt(null)}
                            className="absolute top-4 right-4 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"
                        >
                            ✕
                        </button>
                        <h3 className="text-lg font-black text-slate-800 mb-2">ভাউচার / রসিদ</h3>
                        <p className="text-sm text-slate-500 font-bold mb-6">{viewReceipt.source}</p>

                        <div className="aspect-[3/4] w-full bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 mb-6">
                            <ImageIcon size={48} className="mb-2 opacity-50" />
                            <span className="font-bold text-sm">হিসাবের রসিদের ছবি</span>
                        </div>

                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl font-black">
                            <span className="text-slate-600">খরচ:</span>
                            <span className="text-rose-600">৳{viewReceipt.amount}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

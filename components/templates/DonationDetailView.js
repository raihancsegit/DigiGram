'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowLeft, MapPin, Calendar, Target, Heart,
    Users, CheckCircle2, Wallet, Share2, Phone, HandHeart,
    MessageCircle, Copy
} from 'lucide-react';
import { toBnDigits } from '@/lib/utils/format';

function ProgressBar({ raised, goal }) {
    const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
    return (
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full"
            />
        </div>
    );
}

export default function DonationDetailView({ project }) {
    const [donated, setDonated] = useState(false);

    const pct = project.target_amount > 0
        ? Math.min(Math.round((project.raised_amount / project.target_amount) * 100), 100)
        : 0;

    const sourceUrl = project.union_slug
        ? `/services/donation?u=${project.union_slug}`
        : '/services/donation';

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link
                        href={sourceUrl}
                        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-rose-600 transition-all group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-rose-50 transition-colors border border-slate-100">
                            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        ফিরে যান
                    </Link>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] hidden sm:block">
                        দান প্রকল্প বিস্তারিত
                    </span>
                    <button
                        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold transition-all"
                    >
                        <Share2 size={14} /> শেয়ার
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-10 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* Left: Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Hero Image */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative aspect-[16/9] rounded-[32px] overflow-hidden bg-slate-900 shadow-xl"
                        >
                            {project.image_url ? (
                                <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <HandHeart size={72} className="text-slate-700 opacity-30" />
                                </div>
                            )}
                            {/* Source Badge */}
                            <div className="absolute top-4 left-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs font-black text-white border border-white/20 shadow-lg">
                                    <MapPin size={12} className="text-rose-400" />
                                    {project.union_name}
                                </span>
                            </div>
                            {project.is_global && (
                                <div className="absolute top-4 right-4">
                                    <span className="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                                        গ্লোবাল
                                    </span>
                                </div>
                            )}
                        </motion.div>

                        {/* Title & Meta */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="px-4 py-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-black uppercase border border-rose-200">
                                    দান-প্রকল্প
                                </span>
                                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                    <Calendar size={14} className="text-rose-500" />
                                    {new Date(project.created_at).toLocaleDateString('bn-BD')}
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                    <MapPin size={14} className="text-rose-500" />
                                    {project.union_name}
                                </div>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-snug mb-4">
                                {project.title}
                            </h1>
                            <p className="text-slate-600 font-medium leading-relaxed text-base">
                                {project.description}
                            </p>
                        </motion.div>

                        {/* Progress */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">সংগৃহীত</p>
                                    <p className="text-3xl font-black text-slate-900">৳{toBnDigits(project.raised_amount || 0)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">লক্ষ্যমাত্রা</p>
                                    <p className="text-3xl font-black text-slate-900">৳{toBnDigits(project.target_amount || 0)}</p>
                                </div>
                            </div>
                            <ProgressBar raised={project.raised_amount || 0} goal={project.target_amount || 0} />
                            <p className="text-right text-xs font-black text-rose-500 mt-2">{toBnDigits(pct)}% সম্পন্ন</p>
                        </motion.div>

                        {/* Public Ledger */}
                        {project.ledger && project.ledger.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm"
                            >
                                <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
                                    <Users size={16} className="text-rose-500" /> দাতা তালিকা
                                </h3>
                                <div className="space-y-3">
                                    {project.ledger.map((entry) => (
                                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                                                    <Heart size={14} className="text-rose-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{entry.donor_name || 'বেনামি দাতা'}</p>
                                                    <p className="text-[10px] text-slate-400">{new Date(entry.created_at).toLocaleDateString('bn-BD')}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-black text-rose-600">৳{toBnDigits(entry.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Right: Sidebar */}
                    <div className="space-y-6 lg:sticky lg:top-24 h-fit">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm"
                        >
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-5">সংক্ষেপ</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                                        <Target size={18} className="text-rose-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">লক্ষ্যমাত্রা</p>
                                        <p className="text-sm font-black text-slate-800">৳{toBnDigits(project.target_amount || 0)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                                        <Wallet size={18} className="text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">সংগৃহীত</p>
                                        <p className="text-sm font-black text-slate-800">৳{toBnDigits(project.raised_amount || 0)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Users size={18} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">দাতা সংখ্যা</p>
                                        <p className="text-sm font-black text-slate-800">{toBnDigits(project.ledger?.length || 0)} জন</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                        <MapPin size={18} className="text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">উৎস ইউনিয়ন</p>
                                        <p className="text-sm font-black text-slate-800">{project.union_name}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* CTA */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-rose-500 to-pink-500 rounded-[24px] p-6 text-white shadow-xl shadow-rose-200"
                        >
                            <Heart size={28} className="mb-3 opacity-80" />
                            <h4 className="text-lg font-black mb-2">দান করতে চান?</h4>
                            <p className="text-rose-100 text-xs font-medium mb-5 leading-relaxed">
                                এই প্রকল্পে দান করে আপনি পরিবর্তন আনতে পারেন।
                            </p>
                            <Link
                                href={`${sourceUrl}&donate=${project.id}`}
                                className="w-full block py-3 rounded-2xl bg-white text-rose-600 font-black text-sm text-center hover:shadow-lg transition-all"
                            >
                                এখনই দান করুন
                            </Link>
                        </motion.div>

                        {/* Share Section */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm"
                        >
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-5">শেয়ার করুন</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                                    className="w-full py-3 rounded-xl bg-[#1877F2] text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all font-bold text-sm group"
                                >
                                    <Share2 size={16} /> Facebook
                                </button>
                                <button
                                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(project.title + ' ' + window.location.href)}`, '_blank')}
                                    className="w-full py-3 rounded-xl bg-[#25D366] text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all font-bold text-sm group"
                                >
                                    <MessageCircle size={16} /> WhatsApp
                                </button>
                                <button
                                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(project.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
                                    className="w-full py-3 rounded-xl bg-[#1DA1F2] text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all font-bold text-sm group"
                                >
                                    <Share2 size={16} /> Twitter
                                </button>
                                <button
                                    onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert('লিঙ্ক কপি করা হয়েছে!'))}
                                    className="w-full py-3 rounded-xl bg-slate-800 text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all font-bold text-sm group"
                                >
                                    <Copy size={16} /> লিঙ্ক কপি
                                </button>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </main>
        </div>
    );
}

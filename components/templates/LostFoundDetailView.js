'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowLeft, MapPin, Calendar, Share2,
    Phone, AlertCircle, CheckCircle2, Package,
    MessageCircle, Copy
} from 'lucide-react';

export default function LostFoundDetailView({ post }) {
    const isLost = post.type === 'lost';
    const typeLabel = isLost ? 'হারানো' : 'প্রাপ্তি';
    const accentColor = isLost ? 'amber' : 'green';

    const colorMap = {
        amber: {
            badge: 'bg-amber-100 text-amber-700 border-amber-200',
            icon: 'bg-amber-50 text-amber-500',
            accent: 'from-amber-500 to-orange-400',
            shadow: 'shadow-amber-200',
            dot: 'bg-amber-500',
            btn: 'bg-amber-500 hover:bg-amber-400',
        },
        green: {
            badge: 'bg-green-100 text-green-700 border-green-200',
            icon: 'bg-green-50 text-green-500',
            accent: 'from-green-500 to-teal-400',
            shadow: 'shadow-green-200',
            dot: 'bg-green-500',
            btn: 'bg-green-500 hover:bg-green-400',
        }
    };
    const c = colorMap[accentColor];

    const sourceUrl = post.location_details?.slug
        ? `/services/lost-found?u=${post.location_details.slug}`
        : '/services/lost-found';

    const locationName = post.location_details?.name_bn || 'অজানা';
    const dateStr = new Date(post.created_at).toLocaleDateString('bn-BD', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link
                        href={sourceUrl}
                        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-amber-600 transition-all group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-amber-50 transition-colors">
                            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        ফিরে যান
                    </Link>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] hidden sm:block">
                        হারানো-প্রাপ্তি বিস্তারিত
                    </span>
                    <button
                        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1877F2] text-white hover:shadow-lg transition-all text-xs font-bold"
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
                            {post.image_url ? (
                                <img
                                    src={post.image_url}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-4 opacity-20">
                                    <Package size={72} className="text-white" />
                                    <span className="text-white font-black text-lg uppercase tracking-widest">{typeLabel}</span>
                                </div>
                            )}

                            {/* Type Badge */}
                            <div className="absolute top-4 left-4">
                                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border backdrop-blur-md shadow-lg ${c.badge}`}>
                                    {isLost ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                                    {typeLabel}
                                </span>
                            </div>

                            {/* Source */}
                            <div className="absolute bottom-4 left-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-[10px] font-black text-white border border-white/20 shadow-lg">
                                    <MapPin size={10} className="text-amber-400" />
                                    {locationName}
                                </span>
                            </div>

                            {post.is_global && (
                                <div className="absolute top-4 right-4">
                                    <span className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                                        গ্লোবাল
                                    </span>
                                </div>
                            )}
                        </motion.div>

                        {/* Title & Meta */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase border ${c.badge}`}>
                                    {typeLabel}
                                </span>
                                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                    <Calendar size={13} className="text-amber-500" />
                                    {dateStr}
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                    <MapPin size={13} className="text-amber-500" />
                                    {locationName}
                                </div>
                            </div>

                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-snug mb-5">
                                {post.title}
                            </h1>

                            <p className="text-slate-600 font-medium leading-relaxed text-base">
                                {post.description}
                            </p>
                        </motion.div>

                        {/* Details Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm space-y-4"
                        >
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">তথ্যসমূহ</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.icon}`}>
                                        {isLost ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">ধরন</p>
                                        <p className="text-sm font-bold text-slate-800">{typeLabel} বস্তু</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                        <Calendar size={18} className="text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">তারিখ</p>
                                        <p className="text-sm font-bold text-slate-800">{dateStr}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                        <MapPin size={18} className="text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">এলাকা</p>
                                        <p className="text-sm font-bold text-slate-800">{locationName}</p>
                                    </div>
                                </div>

                                {post.contact_info && (
                                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                            <Phone size={18} className="text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">যোগাযোগ</p>
                                            <p className="text-sm font-bold text-slate-800">{post.contact_info}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Sidebar */}
                    <div className="space-y-6 lg:sticky lg:top-24 h-fit">

                        {/* Summary */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm"
                        >
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-5">সংক্ষেপ</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${c.dot}`} />
                                    <span className="text-sm font-bold text-slate-700">{typeLabel} হিসেবে পোস্ট করা হয়েছে</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin size={14} className="text-slate-400 shrink-0" />
                                    <span className="text-sm font-medium text-slate-600">উৎস: {locationName}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar size={14} className="text-slate-400 shrink-0" />
                                    <span className="text-sm font-medium text-slate-600">{dateStr}</span>
                                </div>
                                {post.is_global && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-teal-500" />
                                        <span className="text-sm font-bold text-teal-600">গ্লোবালভাবে প্রকাশিত</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Contact CTA */}
                        {post.contact_info && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className={`bg-gradient-to-br ${c.accent} rounded-[24px] p-6 text-white shadow-xl ${c.shadow}`}
                            >
                                <Phone size={28} className="mb-3 opacity-80" />
                                <h4 className="text-lg font-black mb-2">যোগাযোগ করুন</h4>
                                <p className="text-white/80 text-xs font-medium mb-5 leading-relaxed">
                                    {isLost
                                        ? 'এই বস্তুটি পেয়ে থাকলে নিচের নম্বরে যোগাযোগ করুন।'
                                        : 'এই বস্তুটি আপনার হলে নিচের নম্বরে যোগাযোগ করুন।'}
                                </p>
                                <a
                                    href={`tel:${post.contact_info}`}
                                    className="w-full block py-3 rounded-2xl bg-white text-slate-800 font-black text-sm text-center hover:shadow-lg transition-all"
                                >
                                    📞 {post.contact_info}
                                </a>
                            </motion.div>
                        )}

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
                                className="w-full py-3 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all font-bold text-sm"
                            >
                                <Share2 size={16} /> Facebook
                            </button>
                            <button
                                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + window.location.href)}`, '_blank')}
                                className="w-full py-3 rounded-2xl bg-[#25D366] text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all font-bold text-sm"
                            >
                                <MessageCircle size={16} /> WhatsApp
                            </button>
                            <button
                                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
                                className="w-full py-3 rounded-2xl bg-[#1DA1F2] text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all font-bold text-sm"
                            >
                                <Share2 size={16} /> Twitter
                            </button>
                            <button
                                onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert('লিঙ্ক কপি করা হয়েছে!'))}
                                className="w-full py-3 rounded-2xl bg-slate-800 text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all font-bold text-sm"
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

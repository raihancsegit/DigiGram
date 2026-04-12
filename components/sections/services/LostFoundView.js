'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, Phone, Filter, AlertCircle, CheckCircle2, Image as ImageIcon, PlusCircle, Gift, ShieldAlert, Crosshair } from 'lucide-react';
import { getLostFoundPosts } from '@/lib/content/lostFoundData';

export default function LostFoundView() {
    const posts = getLostFoundPosts();
    const [filter, setFilter] = useState('all'); // 'all', 'lost', 'found'

    const filteredPosts = posts.filter(post => {
        if (filter === 'all') return true;
        return post.type === filter;
    });

    const stats = {
        total: posts.length,
        lost: posts.filter(p => p.type === 'lost').length,
        found: posts.filter(p => p.type === 'found').length,
        resolved: posts.filter(p => p.status === 'resolved').length
    };

    return (
        <div className="py-8">
            {/* Header & Stats */}
            <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-slate-100 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">কমিউনিটি নোটিশবোর্ড</h2>
                        <p className="text-sm font-medium text-slate-500">আপনার হারানো জিনিস খুঁজুন অথবা কুড়িয়ে পাওয়া জিনিস মালিককে ফেরত দিন</p>
                    </div>
                    <button className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-slate-900 text-white font-black text-sm hover:bg-teal-600 transition-all shadow-lg shadow-slate-900/20 active:scale-95">
                        <PlusCircle size={18} />
                        নতুন পোস্ট করুন
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট পোস্ট</p>
                        <p className="text-2xl font-black text-slate-700">{stats.total}</p>
                    </div>
                    <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                        <p className="text-[11px] font-black text-rose-400 uppercase tracking-widest mb-1">হারানো বিজ্ঞপ্তি</p>
                        <p className="text-2xl font-black text-rose-700">{stats.lost}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                        <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mb-1">প্রাপ্তি সংবাদ</p>
                        <p className="text-2xl font-black text-emerald-700">{stats.found}</p>
                    </div>
                    <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
                        <p className="text-[11px] font-black text-teal-500 uppercase tracking-widest mb-1">মীমাংসিত</p>
                        <p className="text-2xl font-black text-teal-700">{stats.resolved}</p>
                    </div>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 sm:p-5 mb-8 border border-amber-100 flex items-start gap-4">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-black text-amber-800 mb-1">প্রতারকদের থেকে সাবধান!</h4>
                    <p className="text-xs font-bold text-amber-700 opacity-90">কেউ জিনিস পাওয়ার কথা বলে আগে টাকা দাবি করলে দেবেন না। সামনাসামনি গিয়ে উপযুক্ত প্রমাণসহ জিনিস বুঝে নিন।</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                <button 
                    onClick={() => setFilter('all')}
                    className={`shrink-0 px-6 py-2.5 rounded-full text-[13px] font-black transition-all ${filter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}
                >
                    সবগুলো
                </button>
                <button 
                    onClick={() => setFilter('lost')}
                    className={`shrink-0 px-6 py-2.5 rounded-full text-[13px] font-black transition-all flex items-center gap-2 ${filter === 'lost' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-white text-slate-500 border border-slate-200 hover:border-rose-200 hover:text-rose-600'}`}
                >
                    <AlertCircle size={14} />
                    শুধু হারানো
                </button>
                <button 
                    onClick={() => setFilter('found')}
                    className={`shrink-0 px-6 py-2.5 rounded-full text-[13px] font-black transition-all flex items-center gap-2 ${filter === 'found' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-white text-slate-500 border border-slate-200 hover:border-emerald-200 hover:text-emerald-600'}`}
                >
                    <CheckCircle2 size={14} />
                    শুধু প্রাপ্তি
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredPosts.map((post) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300 flex flex-col group"
                        >
                            {post.image ? (
                                <div className="relative h-56 bg-slate-100 overflow-hidden shrink-0">
                                    <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    {post.status === 'resolved' && (
                                        <div className="absolute inset-0 bg-white/70 backdrop-blur-md flex items-center justify-center">
                                            <div className="bg-teal-500 text-white px-5 py-2.5 rounded-full font-black text-sm shadow-xl flex items-center gap-2 transform -rotate-12 border-2 border-white">
                                                <CheckCircle2 size={18} />
                                                মীমাংসিত
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="relative h-40 bg-slate-50 flex items-center justify-center border-b border-slate-100 shrink-0">
                                    <ImageIcon size={32} className="text-slate-300" />
                                    {post.status === 'resolved' && (
                                        <div className="absolute inset-0 bg-white/70 backdrop-blur-md flex items-center justify-center">
                                            <div className="bg-teal-500 text-white px-5 py-2.5 rounded-full font-black text-sm shadow-xl flex items-center gap-2 transform -rotate-12 border-2 border-white">
                                                <CheckCircle2 size={18} />
                                                মীমাংসিত
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="p-6 flex flex-col flex-1">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                        post.type === 'lost' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    }`}>
                                        {post.type === 'lost' ? 'হারানো নোটিশ' : 'প্রাপ্তি সংবাদ'}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{post.category}</span>
                                </div>

                                <h3 className="text-lg font-black text-slate-800 leading-snug mb-3 line-clamp-2 group-hover:text-teal-600 transition-colors">
                                    {post.title}
                                </h3>

                                <p className="text-xs font-medium text-slate-500 leading-relaxed line-clamp-3 mb-5">
                                    {post.description}
                                </p>

                                {/* Detailed Fields Container */}
                                <div className="space-y-2 mb-6 border border-slate-100 rounded-2xl p-3 bg-slate-50">
                                    {post.rewardAmount && post.rewardAmount !== 'প্রযোজ্য নয়' && (
                                        <div className="flex items-start gap-2 text-xs font-bold">
                                            <Gift size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                            <span className="text-amber-700">পুরস্কার: {post.rewardAmount}</span>
                                        </div>
                                    )}
                                    <div className="flex items-start gap-2 text-xs font-bold text-slate-600">
                                        <Crosshair size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                        <span>শেষ দেখা/প্রাপ্তি: {post.lastSeenArea}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-xs font-bold text-slate-600">
                                        <ShieldAlert size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                        <span>জিডি: {post.gdNumber}</span>
                                    </div>
                                </div>

                                <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">যোগাযোগ</p>
                                        <p className="text-sm font-bold text-slate-700">{post.contactName}</p>
                                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                                            <Calendar size={10} /> {post.date}
                                        </p>
                                    </div>
                                    <button 
                                        disabled={post.status === 'resolved'}
                                        onClick={() => window.location.href = `tel:${post.contactPhone}`}
                                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                                            post.status === 'active' 
                                            ? 'bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white hover:shadow-lg hover:shadow-teal-500/20 active:scale-90 border border-teal-100' 
                                            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                        }`}
                                    >
                                        <Phone size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            
            {filteredPosts.length === 0 && (
                <div className="text-center py-20">
                    <Search size={48} className="text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-slate-800 mb-2">কোনো পোস্ট পাওয়া যায়নি</h3>
                    <p className="text-sm text-slate-500 font-medium">এই ক্যাটাগরিতে বর্তমানে কোনো পোস্ট নেই।</p>
                </div>
            )}
        </div>
    );
}

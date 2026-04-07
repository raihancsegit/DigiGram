"use client";

import { motion } from 'framer-motion';
import { AlertCircle, Bell, ExternalLink, Search, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';
import { ALL_NEWS } from '@/lib/content/newsData';

export default function CommunityBulletin() {
    // Filter Janaza and Lost-Found items
    const urgentItems = ALL_NEWS.filter(item => item.category === 'জানাজা' || item.category === 'হারানো-প্রাপ্তি');

    if (urgentItems.length === 0) return null;

    return (
        <section className="dg-section-x pt-8 pb-0">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col gap-4">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                                <Bell size={18} className="animate-bounce" />
                            </div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">জরুরি ঘোষণা</h3>
                        </div>
                        <Link href="/news" className="text-[10px] font-black text-teal-600 hover:text-teal-700 uppercase tracking-widest flex items-center gap-1 group">
                            সবগুলো দেখুন
                            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>

                    {/* Bulletin Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {urgentItems.slice(0, 2).map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                className={`relative group p-4 rounded-[24px] border-2 transition-all hover:shadow-xl ${
                                    item.category === 'জানাজা' 
                                    ? 'bg-slate-900 border-slate-800 text-white' 
                                    : 'bg-white border-amber-100 text-slate-900 hover:border-amber-200'
                                }`}
                            >
                                <Link href={`/news/${item.slug}`} className="block">
                                    <div className="flex items-start gap-4">
                                        <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                                            item.category === 'জানাজা' 
                                            ? 'bg-white/10 text-white' 
                                            : 'bg-amber-50 text-amber-600'
                                        }`}>
                                            {item.category === 'জানাজা' ? <Home size={24} /> : <Search size={24} />}
                                        </div>
                                        
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${
                                                    item.category === 'জানাজা' 
                                                    ? 'bg-white/20 text-white' 
                                                    : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {item.category}
                                                </span>
                                                <span className={`text-[10px] font-bold ${
                                                    item.category === 'জানাজা' ? 'text-slate-400' : 'text-slate-400'
                                                }`}>
                                                    {item.village}
                                                </span>
                                            </div>
                                            <h4 className="text-sm md:text-base font-black leading-snug line-clamp-1 group-hover:underline">
                                                {item.title}
                                            </h4>
                                            <p className={`text-[10px] mt-1 font-medium line-clamp-1 ${
                                                item.category === 'জানাজা' ? 'text-slate-400' : 'text-slate-500'
                                            }`}>
                                                {item.excerpt}
                                            </p>
                                        </div>

                                        <div className="ml-auto shrink-0 opacity-20 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink size={16} />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}

"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'framer-motion';
import { 
    Calendar, User, Clock, Share2, 
    ArrowLeft, MapPin, Tag, MessageCircle, 
    ChevronRight, Users, Phone, Printer,
    Facebook, Twitter, Linkedin
} from 'lucide-react';
import { ALL_NEWS } from '@/lib/content/newsData';

export default function NewsDetailsView({ news }) {
    const [relatedNews, setRelatedNews] = useState([]);
    
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    useEffect(() => {
        if (news) {
            // Get 2-3 related news items excluding the current one
            const filtered = ALL_NEWS.filter(item => item.id !== news.id).slice(0, 3);
            setRelatedNews(filtered);
        }
    }, [news]);

    if (!news) return null;

    return (
        <div className="min-h-screen bg-white">
            {/* Reading Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1.5 bg-teal-600 origin-left z-50"
                style={{ scaleX }}
            />

            {/* Sticky Navigation Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link 
                        href="/"
                        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-teal-600 transition-all group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-teal-50 transition-colors">
                            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        ফিরে যান
                    </Link>
                    
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:text-teal-600 transition-colors" title="Print page">
                            <Printer size={20} />
                        </button>
                        <div className="w-px h-4 bg-slate-200 hidden sm:block" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] hidden sm:block">
                            ডিজিগ্র্যাম পোর্টাল
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
                
                {/* Article Header */}
                <header className="mb-12">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap items-center gap-3 mb-6"
                    >
                        <span className="px-3.5 py-1.5 rounded-xl bg-teal-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-teal-200">
                            {news.category}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            <MapPin size={14} className="text-teal-500" />
                            {news.village}, {news.union}
                        </div>
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight"
                    >
                        {news.title}
                    </motion.h1>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap items-center gap-8 py-8 border-y border-slate-100"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-400">
                                <User size={24} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">প্রতিবেদক</p>
                                <p className="text-sm font-bold text-slate-800">{news.author}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-slate-400 ml-auto sm:ml-0">
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-teal-500" />
                                <span className="text-sm font-bold text-slate-600">{news.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-teal-500" />
                                <span className="text-sm font-bold text-slate-600">{news.readTime} পাঠ</span>
                            </div>
                        </div>
                    </motion.div>
                </header>

                {/* Feature Image */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative aspect-[16/9] rounded-[48px] overflow-hidden bg-slate-100 mb-16 shadow-3xl shadow-slate-200/60"
                >
                    <img 
                        src={news.image} 
                        alt={news.title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </motion.div>

                {/* Article Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
                    <div className="lg:col-span-8 flex flex-col">
                        <div 
                            className="prose prose-slate prose-lg max-w-none text-slate-700 font-medium leading-[1.8]
                            prose-headings:font-black prose-headings:text-slate-900 prose-h2:text-3xl prose-h3:text-2xl
                            prose-p:mb-8 prose-li:mb-2 prose-li:marker:text-teal-500
                            first-letter:text-7xl first-letter:font-black first-letter:text-teal-600 first-letter:mr-3 first-letter:float-left"
                            dangerouslySetInnerHTML={{ __html: news.content }}
                        />
                        
                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-2 mt-12 pt-8 border-t border-slate-50">
                            <span className="text-xs font-black uppercase text-slate-400 tracking-widest mr-2">ট্যাগস:</span>
                            {['ডিজিটাল ইউনিয়ন', 'উন্নয়ন', 'স্মার্ট পল্লী'].map(tag => (
                                <span key={tag} className="px-3 py-1 rounded-lg bg-teal-50 text-teal-700 text-[11px] font-bold">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Desktop Sidebar Share */}
                    <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
                        <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">শেয়ার করুন</h4>
                            <div className="flex flex-col gap-3">
                                <button className="w-full py-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-center gap-3 text-slate-600 hover:bg-white hover:border-teal-300 hover:text-teal-600 transition-all font-bold group">
                                    <Users size={18} className="group-hover:scale-110 transition-transform" />
                                    Facebook
                                </button>
                                <button className="w-full py-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-center gap-3 text-slate-600 hover:bg-white hover:border-teal-300 hover:text-teal-600 transition-all font-bold group">
                                    <Share2 size={18} className="group-hover:scale-110 transition-transform" />
                                    WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related News Section */}
                <section className="pt-20 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">আরও পড়ুন</h2>
                        <Link href="/" className="text-sm font-black text-teal-600 hover:underline">সব দেখুন</Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {relatedNews.map((item) => (
                            <Link key={item.id} href={`/news/${item.slug}`} className="group flex gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-duration-700" />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-teal-600 mb-2">{item.title}</h4>
                                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                                        <Calendar size={12} />
                                        {item.date}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

            </main>

            {/* Footer Support Call to Action */}
            <footer className="bg-slate-900 py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="w-20 h-20 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 mx-auto mb-8 shadow-2xl shadow-teal-500/20">
                        <MessageCircle size={36} />
                    </div>
                    <h3 className="text-3xl font-black text-white mb-4">আপনার কোনো মতামত আছে?</h3>
                    <p className="text-slate-400 text-lg font-medium mb-10">ডিজিগ্র্যাম পোর্টালকে আরও উন্নত করতে আপনার পরামর্শ আমাদের মেসেজ দিন।</p>
                    <button className="px-10 py-5 rounded-[24px] bg-teal-600 text-white font-black text-lg hover:bg-teal-500 transition-all shadow-xl shadow-teal-600/20">
                        সরাসরি মেসেজ দিন
                    </button>
                </div>
            </footer>
        </div>
    );
}

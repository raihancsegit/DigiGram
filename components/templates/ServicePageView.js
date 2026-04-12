"use client"
import Link from 'next/link';
import { 
    ArrowLeft, MapPin, CheckCircle2, Clock, 
    CreditCard, Phone, MessageSquare, Info,
    Heart, FileText, School, BookOpen, PhoneCall, 
    Search, Newspaper, HandMetal, Moon, ShoppingBag, 
    Trophy, LayoutGrid, ChevronRight, HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import LearningProgressPanel from '@/components/campus/LearningProgressPanel';
import EmergencyDirectoryView from '@/components/templates/EmergencyDirectoryView';
import BloodBankView from '@/components/sections/services/BloodBankView';
import LostFoundView from '@/components/sections/services/LostFoundView';
import IslamicCornerView from '@/components/sections/services/IslamicCornerView';
import PowerWatchView from '@/components/sections/services/PowerWatchView';
import LaborDirectoryView from '@/components/sections/services/LaborDirectoryView';
import AgriPoolView from '@/components/sections/services/AgriPoolView';
import DonationView from '@/components/sections/services/DonationView';
import MarketCalendarView from '@/components/sections/services/MarketCalendarView';
import UpSebaView from '@/components/sections/services/UpSebaView';

const ICON_MAP = {
    Heart, FileText, School, BookOpen, PhoneCall, 
    Search, Newspaper, HandTabs: HandMetal, Moon, 
    ShoppingBag, Trophy, Grid: LayoutGrid
};

export default function ServicePageView({ slug, data }) {
    if (data.variant === 'emergency') {
        return <EmergencyDirectoryView slug={slug} />;
    }

    if (slug === 'blood' || data.variant === 'blood') {
        return (
            <div className="bg-[#F8FAFC] min-h-screen pt-24 pb-20 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <Link
                        href="/#services"
                        className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors mb-8 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        সার্ভিস ডিরেক্টরিতে ফিরুন
                    </Link>
                    <BloodBankView />
                </div>
            </div>
        );
    }

    if (slug === 'e-up' || data.variant === 'e-up') {
        return (
            <div className="bg-[#F8FAFC] min-h-screen pt-24 pb-20 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <Link
                        href="/#services"
                        className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors mb-8 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        সার্ভিস ডিরেক্টরিতে ফিরুন
                    </Link>
                    <UpSebaView />
                </div>
            </div>
        );
    }

    if (slug === 'lost' || data.variant === 'lost') {
        return (
            <div className="bg-[#F8FAFC] min-h-screen pt-24 pb-20 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <Link
                        href="/#services"
                        className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors mb-8 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        সার্ভিস ডিরেক্টরিতে ফিরুন
                    </Link>
                    <LostFoundView />
                </div>
            </div>
        );
    }

    if (slug === 'islamic' || data.variant === 'islamic') {
        return (
            <div className="bg-[#F8FAFC] min-h-screen pt-24 pb-20 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <Link
                        href="/#services"
                        className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors mb-8 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        সার্ভিস ডিরেক্টরিতে ফিরুন
                    </Link>
                    <IslamicCornerView />
                </div>
            </div>
        );
    }

    if (slug === 'power-watch' || data.variant === 'power-watch') {
        return (
            <div className="bg-[#F8FAFC] min-h-screen pt-24 pb-20 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <Link
                        href="/#services"
                        className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors mb-8 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        সার্ভিস ডিরেক্টরিতে ফিরুন
                    </Link>
                    <PowerWatchView />
                </div>
            </div>
        );
    }

    if (slug === 'labor' || data.variant === 'labor') {
        return (
            <div className="bg-[#F8FAFC] min-h-screen pt-24 pb-20 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <Link
                        href="/#services"
                        className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors mb-8 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        সার্ভিস ডিরেক্টরিতে ফিরুন
                    </Link>
                    <LaborDirectoryView />
                </div>
            </div>
        );
    }

    if (slug === 'agri-pool' || data.variant === 'agri-pool') {
        return (
            <div className="bg-[#F8FAFC] min-h-screen pt-24 pb-20 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <Link
                        href="/#services"
                        className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors mb-8 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        সার্ভিস ডিরেক্টরিতে ফিরুন
                    </Link>
                    <AgriPoolView />
                </div>
            </div>
        );
    }

    if (slug === 'donation' || data.variant === 'donation') {
        return (
            <div className="bg-[#F8FAFC] min-h-screen pt-24 pb-20 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <Link
                        href="/#services"
                        className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors mb-8 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        সার্ভিস ডিরেক্টরিতে ফিরুন
                    </Link>
                    <DonationView />
                </div>
            </div>
        );
    }

    if (slug === 'market' || data.variant === 'market') {
        return (
            <div className="bg-[#F8FAFC] min-h-screen pt-24 pb-20 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <Link
                        href="/#services"
                        className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors mb-8 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        সার্ভিস ডিরেক্টরিতে ফিরুন
                    </Link>
                    <MarketCalendarView />
                </div>
            </div>
        );
    }

    const { 
        title, kicker, free, description, 
        iconName, requirements, steps, fees, 
        timeline, faq, sections = [], 
        showLearningProgress, relatedLinks 
    } = data;

    const IconComponent = ICON_MAP[iconName] || Info;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 pt-24 pb-32 md:pt-32 md:pb-40 px-4">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-500 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
                </div>

                <div className="max-w-[1200px] mx-auto relative z-10">
                    <Link
                        href="/#services"
                        className="inline-flex items-center gap-2 text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors mb-8 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        সার্ভিস ডিরেক্টরিতে ফিরুন
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="max-w-2xl">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 mb-4"
                            >
                                <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-widest">
                                    {kicker}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    free ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                    {free ? 'ফ্রি সার্ভিস' : 'প্রিমিয়াম'}
                                </span>
                            </motion.div>
                            
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6"
                            >
                                {title}
                            </motion.h1>
                            
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed"
                            >
                                {description}
                            </motion.p>
                        </div>

                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="hidden md:flex w-32 h-32 lg:w-40 lg:h-40 items-center justify-center rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl"
                        >
                            <IconComponent size={64} className="text-teal-400" />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1200px] mx-auto px-4 -mt-10 mb-20 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Details */}
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="lg:col-span-8 space-y-8"
                    >
                        {/* Requirements */}
                        {requirements && (
                            <section className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-600">
                                        <FileText size={24} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800">প্রয়োজনীয় কাগজপত্র</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {requirements.map((req, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-teal-200 transition-colors">
                                            <CheckCircle2 size={18} className="text-teal-500 mt-0.5 shrink-0" />
                                            <span className="text-slate-600 font-bold text-sm leading-snug">{req}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Processing Steps */}
                        {steps && (
                            <section className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                                        <LayoutGrid size={24} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800">আবেদন প্রক্রিয়া</h2>
                                </div>
                                <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                    {steps.map((step, idx) => (
                                        <div key={idx} className="relative pl-12">
                                            <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center z-10 shadow-sm transition-colors group-hover:border-teal-100">
                                                <span className="text-xs font-black text-teal-600">{idx + 1}</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-800 mb-1">{step.title}</h3>
                                                <p className="text-sm font-medium text-slate-500 leading-relaxed">{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Extra Sections from Data */}
                        {sections.map((section, sIdx) => (
                            <section key={sIdx} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                                <h3 className="text-2xl font-black text-slate-800 mb-6">{section.heading}</h3>
                                <div className="space-y-3">
                                    {section.bullets?.map((bullet, bIdx) => (
                                        <div key={bIdx} className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2.5 shrink-0" />
                                            <p className="text-slate-600 font-bold leading-relaxed">{bullet}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </motion.div>

                    {/* Right Column: Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Quick Stats Card */}
                        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Clock size={80} />
                            </div>
                            
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">এক নজরে সময় ও ফি</h3>
                            
                            <div className="space-y-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1.5">খরচ / ফি</p>
                                        <p className="text-sm font-black text-slate-800">{fees || 'তথ্য নেই'}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1.5">সময় লাগবে</p>
                                        <p className="text-sm font-black text-slate-800">{timeline || 'তথ্য নেই'}</p>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full mt-8 py-4 px-6 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-teal-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group">
                                সরাসরি আবেদন করুন
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        {/* FAQ Section */}
                        {faq && (
                            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                                <div className="flex items-center gap-2 mb-6">
                                    <HelpCircle size={20} className="text-teal-600" />
                                    <h3 className="text-lg font-black text-slate-800">সচরাচর জিজ্ঞাসা</h3>
                                </div>
                                <div className="space-y-4">
                                    {faq.map((item, idx) => (
                                        <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group">
                                            <p className="text-sm font-black text-slate-800 mb-2 leading-snug">{item.q}</p>
                                            <p className="text-[13px] font-medium text-slate-500 leading-relaxed">{item.a}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contact Support */}
                        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-[32px] p-6 text-white shadow-lg shadow-teal-700/20">
                            <h3 className="text-lg font-black mb-2">হেল্পলাইন প্রয়োজন?</h3>
                            <p className="text-xs text-teal-100 font-medium mb-6 leading-relaxed">সেবাটি বুঝতে সমস্যায় পড়লে আমাদের স্থানীয় প্রতিনিধির সাথে যোগাযোগ করুন।</p>
                            
                            <div className="space-y-3">
                                <a href="tel:01700000000" className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors border border-white/10">
                                    <Phone size={18} />
                                    <span className="text-sm font-black tabular-nums">০১৭০০-০০০০০০</span>
                                </a>
                                <button className="flex items-center justify-center gap-3 w-full p-3 rounded-2xl bg-white text-teal-700 font-bold hover:bg-teal-50 transition-colors shadow-sm">
                                    <MessageSquare size={18} />
                                    <span className="text-sm">লাইভ চ্যাট সাপোর্ট</span>
                                </button>
                            </div>
                        </div>

                        {/* Related Quick Links */}
                        {relatedLinks && (
                            <div className="p-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">অন্যান্য লিঙ্ক</p>
                                <div className="space-y-1">
                                    {relatedLinks.map((link, idx) => (
                                        <Link 
                                            key={idx} 
                                            href={link.href}
                                            className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 transition-colors group"
                                        >
                                            <span className="text-xs font-bold text-slate-600 group-hover:text-teal-700">{link.label}</span>
                                            <ChevronRight size={14} className="text-slate-300 group-hover:text-teal-500" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {showLearningProgress && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12"
                    >
                        <LearningProgressPanel />
                    </motion.div>
                )}

                <div className="mt-16 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest pb-4">ডিজিগ্রাম সার্ভিস ইঞ্জিন v2.0</p>
                    <div className="w-12 h-1 bg-slate-100 mx-auto rounded-full" />
                </div>
            </div>
        </div>
    );
}


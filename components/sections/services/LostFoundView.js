'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, MapPin, Calendar, Phone, Filter, 
    AlertCircle, CheckCircle2, Image as ImageIcon, 
    PlusCircle, Gift, ShieldAlert, Crosshair, 
    Users, Target, SearchIcon, Award, UserCheck, 
    Heart, AlertTriangle, ArrowRight, Loader2,
    Package, HelpCircle, Info, Share2, Copy, Check
} from 'lucide-react';
import { lostFoundService } from '@/lib/services/lostFoundService';
import { adminService } from '@/lib/services/adminService';
import { getLocationBySlug } from '@/lib/services/hierarchyService';
import ModalPortal from '@/components/common/ModalPortal';
import Pagination from '@/components/common/Pagination';
import { X } from 'lucide-react';
import { compressImage } from '@/lib/utils/imageUtils';
import { supabase } from '@/lib/utils/supabase';

const AnimatedCounter = ({ end, duration = 2, suffix = '' }) => {
    const [count, setCount] = useState(0);

    const bnMap = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    const toBnNum = (num) => String(num).replace(/[0-9]/g, match => bnMap[match]);

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

    return <span>{toBnNum(count)}{suffix}</span>;
};

export default function LostFoundView() {
    return (
        <Suspense fallback={
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        }>
            <LostFoundContent />
        </Suspense>
    );
}

function LostFoundContent() {
    const searchParams = useSearchParams();
    const unionSlug = searchParams.get('u');
    
    const [posts, setPosts] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 12;

    const [unionData, setUnionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copiedPostId, setCopiedPostId] = useState(null);
    const [timeframe, setTimeframe] = useState('all');
    const [filter, setFilter] = useState('all');
    const [selectedPost, setSelectedPost] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [activeTab, setActiveTab] = useState('local'); // 'local' or 'global'

    const TIMEFRAMES = [
        { id: 'all', label: 'সবগুলো' },
        { id: 'today', label: 'আজকের' },
        { id: '7days', label: '৭ দিন' },
        { id: '15days', label: '১৫ দিন' },
        { id: '30days', label: '৩০ দিন' },
    ];

    // Initial load: check for post ID in URL
    useEffect(() => {
        const postId = searchParams.get('post');
        if (postId && posts.length > 0) {
            const post = posts.find(p => p.id === postId);
            if (post) setSelectedPost(post);
        }
    }, [searchParams, posts]);
    const [reportType, setReportType] = useState('lost');
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        location: '',
        event_date: '',
        contact_name: '',
        contact_phone: '',
        image_url: ''
    });

    useEffect(() => {
        loadData(1);
    }, [unionSlug, timeframe, activeTab]);

    const loadData = async (page = 1) => {
        if (!unionSlug) {
            setPosts([]);
            setTotalCount(0);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            let currentUnion = unionData;
            
            if (!currentUnion || currentUnion.slug !== unionSlug) {
                const data = await getLocationBySlug(unionSlug);
                if (data) {
                    setUnionData(data);
                    currentUnion = data;
                }
            }

            if (currentUnion?.id) {
                // Fetch only global or include/only local
                const isGlobalOnly = activeTab === 'global';
                const { data, count } = await lostFoundService.getPosts(
                    isGlobalOnly ? null : currentUnion.id, 
                    page, 
                    pageSize, 
                    isGlobalOnly, 
                    timeframe
                );
                
                setPosts(data);
                setTotalCount(count);
                setCurrentPage(page);
            } else {
                setPosts([]);
                setTotalCount(0);
            }
        } catch (err) {
            console.error("Error loading lost & found data:", err);
        } finally {
            setLoading(false);
        }
    };
// ... rest of the logic

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        if (!unionData?.id) {
            alert('ইউনিয়ন তথ্য পাওয়া যায়নি');
            return;
        }
        setSubmitting(true);
        try {
            await lostFoundService.addPost({
                ...formData,
                type: reportType,
                location_id: unionData.id,
                status: 'active'
            });
            setShowReportModal(false);
            setFormData({
                title: '',
                category: '',
                description: '',
                location: '',
                event_date: '',
                contact_name: '',
                contact_phone: '',
                image_url: ''
            });
            loadData();
            alert('আপনার তথ্য সফলভাবে তালিকাভুক্ত করা হয়েছে।');
        } catch (err) {
            console.error(err);
            alert('তথ্য যোগ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        } finally {
            setSubmitting(false);
        }
    };

    const handleShare = (post, platform) => {
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}?u=${unionSlug}&post=${post.id}`;
        const text = `*${post.type === 'lost' ? 'হারিয়ে গেছে' : 'কুড়িয়ে পাওয়া'} - ${post.title}*\n\n${post.description.substring(0, 100)}...\n\nবিস্তারিত দেখুন: ${shareUrl}`;

        if (platform === 'fb') {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        } else if (platform === 'wa') {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
        }
    };

    const copyToClipboard = (post) => {
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}?u=${unionSlug}&post=${post.id}`;
        const text = `*${post.type === 'lost' ? 'হারিয়ে গেছে' : 'কুড়িয়ে পাওয়া'} - ${post.title}*\n\n${post.description}\n\nবিস্তারিত দেখুন: ${shareUrl}`;
        navigator.clipboard.writeText(text);
        setCopiedPostId(post.id);
        setTimeout(() => setCopiedPostId(null), 2000);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            // Compress image before upload
            const compressedBlob = await compressImage(file, 1000, 1000, 0.7);
            
            const fileExt = file.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `lost-found/${fileName}`;

            const { data, error: uploadError } = await supabase.storage
                .from('public-uploads')
                .upload(filePath, compressedBlob, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Upload Error:', uploadError);
                throw new Error(uploadError.message);
            }

            const { data: { publicUrl } } = supabase.storage
                .from('public-uploads')
                .getPublicUrl(filePath);

            setFormData({ ...formData, image_url: publicUrl });
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('ছবি আপলোড করতে সমস্যা হয়েছে।');
        } finally {
            setUploading(false);
        }
    };

    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            const matchesCategory = filter === 'all' || post.type === filter;
            // Since we now fetch global/local from server based on activeTab,
            // we only need to filter by category on client side.
            return matchesCategory;
        });
    }, [posts, filter]);

    const stats = {
        lost: posts.filter(p => p.type === 'lost').length,
        found: posts.filter(p => p.type === 'found').length,
        resolved: posts.filter(p => p.status === 'resolved').length
    };

    if (loading) {
        return (
            <div className="flex justify-center py-40">
                <div className="text-center">
                    <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={40} />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">তথ্য লোড হচ্ছে...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-16 pt-4">
            {/* 1. Hero Section */}
            <div className="relative rounded-[40px] bg-indigo-950 border border-indigo-900 overflow-hidden px-6 py-16 md:p-20 mb-16 shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-center md:text-left max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-xs font-black uppercase tracking-widest mb-6 px-4 py-2 backdrop-blur-md">
                            <Target size={14} className="text-rose-400" /> 
                            {unionData ? `${unionData.name} হারানো-প্রাপ্তি কেন্দ্র` : 'কমিউনিটি হারানো-প্রাপ্তি কেন্দ্র'}
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.2] mb-6">
                            প্রিয় কিছু হারিয়েছেন? <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">কমিউনিটিকে জানান</span>
                        </h2>
                        <p className="text-lg text-indigo-200/80 font-medium mb-8 leading-relaxed max-w-xl">
                            {unionData ? (
                                `আপনার হারানো দলিল, গবাদি পশু বা মূল্যবান ইলেকট্রনিক্স পণ্য খুঁজে পেতে ${unionData.name} ইউনিয়নের মানুষের সাহায্য নিন।`
                            ) : (
                                "আপনার হারানো দলিল, গবাদি পশু বা মূল্যবান ইলেকট্রনিক্স পণ্য খুঁজে পেতে এলাকার মানুষের সাহায্য নিন। অথবা কেউ কিছু খুঁজে পেয়ে থাকলে মালিককে ফেরত দিন।"
                            )}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button 
                                onClick={() => { setReportType('lost'); setShowReportModal(true); }}
                                className="w-full sm:w-auto px-8 py-5 rounded-[20px] bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black text-lg hover:from-rose-400 transition-all shadow-lg shadow-rose-500/25 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <PlusCircle size={20} />
                                বিজ্ঞতি দিন
                            </button>
                            <button 
                                onClick={() => { setReportType('found'); setShowReportModal(true); }}
                                className="w-full sm:w-auto px-8 py-5 rounded-[20px] bg-white/10 text-white font-black text-lg hover:bg-white/20 transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={20} />
                                প্রাপ্তি সংবাদ দিন
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md hover:bg-white/10 transition-colors">
                            <Heart size={32} className="text-emerald-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={stats.found + 120} suffix="+" /></div>
                            <p className="text-[10px] font-black text-indigo-200/50 uppercase tracking-widest">খুঁজে পাওয়া পণ্য</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md hover:bg-white/10 transition-colors mt-6">
                            <SearchIcon size={32} className="text-rose-400 mx-auto mb-3" />
                            <div className="text-3xl font-black text-white mb-1"><AnimatedCounter end={stats.lost + stats.found} suffix="" /></div>
                            <p className="text-[10px] font-black text-indigo-200/50 uppercase tracking-widest">চলমান বিজ্ঞপ্তি</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Safety First Alert */}
            <div className="bg-rose-50 rounded-[32px] border border-rose-100 p-8 mb-16 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12">
                    <ShieldAlert size={150} />
                </div>
                <div className="w-20 h-20 rounded-[24px] bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                    <AlertTriangle size={40} className="animate-pulse" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-rose-900 mb-2">প্রতারক থেকে সাবধান!</h3>
                    <p className="text-base font-bold text-rose-800/70 leading-relaxed max-w-4xl">
                        কেউ আপনার হারানো বস্তু পাওয়ার কথা বলে যদি অগ্রিম টাকা বা বখশিস দাবি করে, তবে কোনোভাবেই টাকা পাঠাবেন না। 
                        বিপরীত পক্ষকে উপযুক্ত প্রমাণ (যেমন: ছবির প্রুফ বা বিশেষ কোনো চিহ্ন) দেখাতে বলুন এবং সামনাসামনি গিয়ে জিনিস বুঝে পাওয়ার পর কেবল কৃতজ্ঞতাস্বরূপ কিছু দেবেন।
                    </p>
                </div>
            </div>

            {!unionSlug ? (
                <div className="py-20 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm">
                    <HelpCircle size={64} className="mx-auto text-slate-200 mb-6" />
                    <h2 className="text-2xl font-black text-slate-800 mb-2">ইউনিয়ন সিলেক্ট করা নেই</h2>
                    <p className="text-slate-500 font-bold mb-8">আপনার এলাকার হারানো-প্রাপ্তি তথ্য দেখতে প্রথমে একটি ইউনিয়ন সিলেক্ট করুন।</p>
                    <button 
                        onClick={() => window.location.href = '/#directory'}
                        className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                    >
                        ইউনিয়ন লিস্ট দেখুন
                    </button>
                </div>
            ) : (
                /* 3. Main Dashboard */
                <div id="directory">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 pb-8 border-b border-slate-100">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div>
                                <h2 className="text-3xl font-black text-slate-800">নোটিশবোর্ড</h2>
                                <p className="text-sm font-medium text-slate-500">
                                    {unionData ? `${unionData.name} ইউনিয়নের` : ''} হারানো জিনিসটি লিস্টে আছে কি না দেখুন
                                </p>
                            </div>
                            
                            {/* Local/Global Tabs */}
                            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                                <button 
                                    onClick={() => setActiveTab('local')}
                                    className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${activeTab === 'local' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    লোকাল পোস্ট
                                </button>
                                <button 
                                    onClick={() => setActiveTab('global')}
                                    className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${activeTab === 'global' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    গ্লোবাল পোস্ট
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Category Filter */}
                            <div className="flex bg-slate-100 p-1 rounded-2xl">
                                {['all', 'lost', 'found'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setFilter(t)}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                                            filter === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {t === 'all' ? 'সব' : t === 'lost' ? 'হারানো' : 'প্রাপ্তি'}
                                    </button>
                                ))}
                            </div>

                            {/* Timeframe Filter */}
                            <div className="flex bg-slate-100 p-1 rounded-2xl">
                                {TIMEFRAMES.map((tf) => (
                                    <button
                                        key={tf.id}
                                        onClick={() => setTimeframe(tf.id)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                                            timeframe === tf.id 
                                                ? 'bg-white text-indigo-600 shadow-sm' 
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {tf.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredPosts.length > 0 ? filteredPosts.map((post, idx) => (
                                <motion.div
                                    key={post.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`bg-white rounded-[32px] border-2 overflow-hidden hover:shadow-2xl transition-all group flex flex-col ${
                                        post.type === 'lost' ? 'border-amber-100 hover:border-amber-200' : 'border-emerald-100 hover:border-emerald-200'
                                    }`}
                                >
                                    <div className="relative h-64 bg-slate-100 overflow-hidden">
                                         <img src={post.image_url || 'https://via.placeholder.com/400x300?text=No+Image'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={post.title} />
                                         <div className={`absolute top-4 left-4 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${
                                             post.type === 'lost' ? 'bg-orange-500' : 'bg-emerald-500'
                                         }`}>
                                             {post.type === 'lost' ? 'হারিয়ে গেছে' : 'কুড়িয়ে পাওয়া'}
                                         </div>
                                         {post.is_global && (
                                            <div className="absolute top-4 right-4 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-purple-600 text-white shadow-lg">
                                                গ্লোবাল
                                            </div>
                                         )}
                                         {post.status === 'resolved' && (
                                            <div className={`absolute top-4 ${post.is_global ? 'right-24' : 'right-4'} px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white shadow-lg`}>
                                                মীমাংসিত
                                            </div>
                                         )}
                                         <div className="absolute bottom-4 left-4 right-4">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md text-[9px] font-bold text-white border border-white/10">
                                                <MapPin size={10} /> সোর্স: {post.location_details?.name_bn || 'সারাদেশ'}
                                            </div>
                                         </div>
                                    </div>
                                    
                                    <div className="p-8 flex flex-col flex-1">
                                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {post.event_date}</span>
                                            <span className="flex items-center gap-1.5"><MapPin size={14} /> {post.last_seen_area || post.location}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 mb-4 leading-tight group-hover:text-indigo-600 transition-colors uppercase">
                                            {post.title}
                                        </h3>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-3 mb-6">
                                            {post.description}
                                        </p>

                                        <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100">
                                            {post.reward_amount && (
                                                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5 align-middle"><Gift size={14}/> পুরস্কার ঘোষণা</span>
                                                    <span className="text-sm font-black text-amber-700">{post.reward_amount}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                                    <UserCheck size={16} className="text-slate-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">বিজ্ঞাপনদাতা</p>
                                                    <p className="text-xs font-black text-slate-700">{post.contact_name}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setSelectedPost(post)}
                                                className="flex-1 py-4 rounded-[20px] font-black text-sm flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                                            >
                                                বিস্তারিত দেখুন
                                            </button>
                                            <button 
                                                onClick={() => window.location.href = `tel:${post.contact_phone}`}
                                                className={`w-14 h-14 rounded-[20px] flex items-center justify-center transition-all active:scale-95 shadow-lg ${
                                                    post.type === 'lost' ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                                }`}
                                            >
                                                <Phone size={20} />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-auto">শেয়ার করুন:</span>
                                            <button 
                                                onClick={() => handleShare(post, 'fb')}
                                                className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"
                                            >
                                                <Users size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleShare(post, 'wa')}
                                                className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"
                                            >
                                                <Share2 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => copyToClipboard(post)}
                                                className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"
                                            >
                                                {copiedPostId === post.id ? <Check size={14} /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="col-span-full py-20 text-center">
                                    <Package size={48} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-slate-400 font-bold">এই ইউনিয়নে বর্তমানে কোনো পোস্ট নেই।</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    <Pagination 
                        currentPage={currentPage}
                        totalCount={totalCount}
                        pageSize={pageSize}
                        onPageChange={(page) => {
                            loadData(page);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    />
                </div>
            )}

            {/* 4. Footer CTA */}
            <div className="mt-16 bg-white rounded-[40px] p-8 md:p-14 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden shadow-sm">
                <div className="relative z-10 w-full text-center md:text-left">
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-4">কিছু কি কুড়িয়ে পেয়েছেন?</h3>
                    <p className="text-slate-600 font-bold max-w-xl text-base">
                        আপনার সঠিক একটি সংবাদে কারো বিশাল কোনো ক্ষতি পূরণ হতে পারে। আজই প্রাপ্তি সংবাদ দিয়ে মালিককে সহায়তা করুন।
                    </p>
                </div>
                <div className="shrink-0 w-full md:w-auto relative z-10">
                    <button 
                        onClick={() => { setReportType('found'); setShowReportModal(true); }}
                        className="w-full px-10 py-5 rounded-[24px] bg-slate-900 text-white font-black text-lg shadow-xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-2"
                    >
                        প্রাপ্তি সংবাদ দিন <ArrowRight size={20} />
                    </button>
                </div>
            </div>

            <ModalPortal isOpen={!!selectedPost} onClose={() => setSelectedPost(null)}>
                <div className="bg-white rounded-[40px] p-6 md:p-10 max-w-3xl w-full mx-4 border border-slate-100 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="absolute top-0 right-0 p-6 z-10">
                        <button onClick={() => setSelectedPost(null)} className="p-3 rounded-2xl hover:bg-slate-100 transition-colors">
                            <X size={24} className="text-slate-400" />
                        </button>
                    </div>

                    {selectedPost && (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="md:w-1/2">
                                    <div className="relative rounded-[32px] overflow-hidden bg-slate-100 aspect-square">
                                        <img src={selectedPost.image_url || 'https://via.placeholder.com/400x300?text=No+Image'} className="w-full h-full object-cover" alt="" />
                                        <div className={`absolute top-4 left-4 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${
                                            selectedPost.type === 'lost' ? 'bg-orange-500' : 'bg-emerald-500'
                                        }`}>
                                            {selectedPost.type === 'lost' ? 'হারিয়ে গেছে' : 'কুড়িয়ে পাওয়া'}
                                        </div>
                                    </div>
                                </div>
                                <div className="md:w-1/2 flex flex-col justify-center">
                                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                        <span className="flex items-center gap-1.5"><Calendar size={14} /> {selectedPost.event_date}</span>
                                        <span className="flex items-center gap-1.5"><MapPin size={14} /> {selectedPost.location}</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-800 mb-6 leading-tight uppercase">{selectedPost.title}</h3>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ক্যাটাগরি</p>
                                            <p className="text-sm font-black text-slate-700">{selectedPost.category}</p>
                                        </div>
                                        {selectedPost.reward_amount && (
                                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">পুরস্কার</p>
                                                <p className="text-sm font-black text-amber-700">{selectedPost.reward_amount}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-900 text-white">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                            <UserCheck size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">বিজ্ঞাপনদাতা</p>
                                            <p className="text-base font-black">{selectedPost.contact_name}</p>
                                        </div>
                                        <button 
                                            onClick={() => window.location.href = `tel:${selectedPost.contact_phone}`}
                                            className="ml-auto w-12 h-12 rounded-xl bg-white text-slate-900 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all shadow-lg"
                                        >
                                            <Phone size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-8 border-t border-slate-100">
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <Info size={18} className="text-indigo-600" /> বিস্তারিত বর্ণনা
                                </h4>
                                <div className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-8 rounded-[32px] border border-slate-100 whitespace-pre-wrap">
                                    {selectedPost.description}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-100">
                                <div className="flex items-center gap-3">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">শেয়ার করুন:</p>
                                    <button 
                                        onClick={() => handleShare(selectedPost, 'fb')}
                                        className="px-6 py-3 rounded-xl bg-[#1877F2] text-white font-black text-xs flex items-center gap-2 hover:opacity-90 transition-all"
                                    >
                                        <Users size={16} /> Facebook
                                    </button>
                                    <button 
                                        onClick={() => handleShare(selectedPost, 'wa')}
                                        className="px-6 py-3 rounded-xl bg-[#25D366] text-white font-black text-xs flex items-center gap-2 hover:opacity-90 transition-all"
                                    >
                                        <Share2 size={16} /> WhatsApp
                                    </button>
                                    <button 
                                        onClick={() => copyToClipboard(selectedPost)}
                                        className="px-6 py-3 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center gap-2 hover:bg-slate-800 transition-all"
                                    >
                                        {copiedPostId === selectedPost.id ? <Check size={16} /> : <Copy size={16} />} 
                                        {copiedPostId === selectedPost.id ? 'কপি হয়েছে' : 'কপি করুন'}
                                    </button>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400">পোস্ট আইডি: #{selectedPost.id.substring(0, 8)}</p>
                            </div>
                        </div>
                    )}
                </div>
            </ModalPortal>

            {/* 6. Report Modal */}
            <ModalPortal isOpen={showReportModal} onClose={() => setShowReportModal(false)}>
                <div className="bg-white rounded-[40px] p-6 md:p-10 max-w-2xl w-full mx-4 border border-slate-100 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="absolute top-0 right-0 p-6 z-10">
                        <button onClick={() => setShowReportModal(false)} className="p-3 rounded-2xl hover:bg-slate-100 transition-colors">
                            <X size={24} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${reportType === 'lost' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {reportType === 'lost' ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">{reportType === 'lost' ? 'হারানো বিজ্ঞতি দিন' : 'প্রাপ্তি সংবাদ দিন'}</h3>
                            <p className="text-sm font-bold text-slate-400 mt-1">সঠিক তথ্য দিয়ে কমিউনিটিকে সহায়তা করুন।</p>
                        </div>
                    </div>

                    <form onSubmit={handleReportSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">ক্যাটাগরি</label>
                                <select 
                                    required
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-sm"
                                >
                                    <option value="">নির্বাচন করুন</option>
                                    <option value="গবাদি পশু">গবাদি পশু</option>
                                    <option value="দলিলপত্র">দলিলপত্র</option>
                                    <option value="মোবাইল">মোবাইল</option>
                                    <option value="মোটরসাইকেল">মোটরসাইকেল</option>
                                    <option value="ব্যক্তি">ব্যক্তি</option>
                                    <option value="অন্যান্য">অন্যান্য</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">শিরোনাম</label>
                                <input 
                                    required
                                    type="text" 
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    placeholder="সংক্ষেপে শিরোনাম"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">বিস্তারিত বিবরণ</label>
                            <textarea 
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                placeholder="রঙ, বিশেষ চিহ্ন বা বিবরণ লিখুন..."
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">স্থান</label>
                                <input 
                                    required
                                    type="text" 
                                    value={formData.location}
                                    onChange={e => setFormData({...formData, location: e.target.value})}
                                    placeholder="যেমন: বিনোদপুর বাজার"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">তারিখ</label>
                                <input 
                                    required
                                    type="text" 
                                    value={formData.event_date}
                                    onChange={e => setFormData({...formData, event_date: e.target.value})}
                                    placeholder="যেমন: ১১ এপ্রিল, ২০২৬"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">আপনার নাম</label>
                                <input 
                                    required
                                    type="text" 
                                    value={formData.contact_name}
                                    onChange={e => setFormData({...formData, contact_name: e.target.value})}
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">মোবাইল নাম্বার</label>
                                <input 
                                    required
                                    type="text" 
                                    value={formData.contact_phone}
                                    onChange={e => setFormData({...formData, contact_phone: e.target.value})}
                                    placeholder="017XXXXXXXX"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-2">
                                <ImageIcon size={14} /> ছবির নমুনা (ঐচ্ছিক)
                            </label>
                            <div className="relative group/upload">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="lost-found-image"
                                />
                                <label 
                                    htmlFor="lost-found-image"
                                    className="w-full px-5 py-8 rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group-hover/upload:scale-[0.99] active:scale-[0.97]"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 size={32} className="text-indigo-500 animate-spin" />
                                            <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">আপলোড হচ্ছে...</span>
                                        </>
                                    ) : formData.image_url ? (
                                        <div className="relative w-full h-32 rounded-2xl overflow-hidden">
                                            <img src={formData.image_url} className="w-full h-full object-cover" alt="Preview" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                <span className="text-white text-[10px] font-black uppercase tracking-widest">ছবি পরিবর্তন করুন</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                                                <ImageIcon size={24} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-black text-slate-700">ক্লিক করে ছবি সিলেক্ট করুন</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">PNG, JPG অথবা JPEG ফাইল (সর্বোচ্চ ২ মেগাবাইট)</p>
                                            </div>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-black transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    সাবমিট হচ্ছে...
                                </>
                            ) : (
                                'বিজ্ঞপ্তিটি পাবলিশ করুন'
                            )}
                        </button>
                    </form>
                </div>
            </ModalPortal>
        </div>
    );
}

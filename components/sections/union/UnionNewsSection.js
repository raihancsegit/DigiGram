import { useState, useEffect } from 'react';
import { 
    Calendar, ArrowRight as LucideArrowRight, MapPin, Bookmark 
} from 'lucide-react';
import Link from 'next/link';
import { wardService } from '@/lib/services/wardService';
import { donationService } from '@/lib/services/donationService';
import { lostFoundService } from '@/lib/services/lostFoundService';

export default function UnionNewsSection({ unionName = 'ইউনিয়ন', unionId, unionSlug, wardIds = [] }) {

    const [unionNews, setUnionNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12; // 4 rows × 3 columns

    const TIMEFRAMES = [
        { id: 'all', label: 'সব' },
        { id: 'today', label: 'আজ' },
        { id: '7days', label: '৭ দিন' },
        { id: '15days', label: '১৫ দিন' },
        { id: '30days', label: '৩০ দিন' },
        { id: 'year', label: '১ বছর' },
    ];

    const [activeTab, setActiveTab] = useState('local'); // 'local' or 'global'

    useEffect(() => {
        if (!unionId) return;
        const fetchAllActivity = async () => {
            setLoading(true);
            try {
                // 1. Fetch News
                const newsLocationIds = activeTab === 'local' ? [unionId, ...wardIds] : [];
                const news = await wardService.getMultipleLocationsNews(newsLocationIds, timeframe);
                const mappedNews = news.map(n => ({
                    ...n,
                    type: 'news',
                    displayCategory: n.category || 'নোটিশ',
                    village: n.is_global ? `সোর্স: ${n.location?.name_bn || 'প্রশাসন'}` : (n.location_id === unionId ? 'ইউনিয়ন পরিষদ' : 'ওয়ার্ড নিউজ'),
                    date: new Date(n.created_at).toLocaleDateString('bn-BD')
                }));

                // 2. Fetch Donations
                const donations = await donationService.getProjects(unionSlug, timeframe);
                const mappedDonations = donations.map(d => {
                    const progress = d.target_amount > 0 ? Math.min((d.raised_amount / d.target_amount) * 100, 100) : 0;
                    return {
                        ...d,
                        type: 'donation',
                        displayCategory: 'দান-প্রকল্প',
                        village: d.is_global ? `সোর্স: ${d.union_name}` : (d.union_slug === unionSlug ? 'ইউনিয়ন পরিষদ' : 'লোকাল'),
                        date: new Date(d.created_at).toLocaleDateString('bn-BD'),
                        progress: progress,
                        progressText: `${Math.round(progress)}% সম্পন্ন`,
                        goalText: `লক্ষ্য: ৳${d.target_amount || 0}`,
                        raisedText: `সংগৃহীত: ৳${d.raised_amount || 0}`
                    };
                });

                // 3. Fetch Lost & Found
                const isGlobalOnly = activeTab === 'global';
                const { data: lfPosts } = await lostFoundService.getPosts(
                    isGlobalOnly ? null : unionId,
                    1, 100, isGlobalOnly, timeframe
                );
                const mappedLF = (lfPosts || []).map(p => ({
                    ...p,
                    type: 'lostfound',
                    displayCategory: p.type === 'lost' ? 'হারানো' : 'প্রাপ্তি',
                    village: p.is_global ? `সোর্স: ${p.location_details?.name_bn || 'প্রশাসন'}` : 'লোকাল',
                    date: new Date(p.created_at).toLocaleDateString('bn-BD')
                }));

                // Combine and Filter
                let combined = [...mappedNews, ...mappedDonations, ...mappedLF];
                
                // Filter by Local/Global tab
                if (activeTab === 'global') {
                    combined = combined.filter(item => item.is_global);
                } else {
                    combined = combined.filter(item => !item.is_global);
                }

                // Sort by created_at desc
                combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                setUnionNews(combined);
                setCurrentPage(1); // Reset to first page when data changes
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllActivity();
    }, [unionId, unionSlug, wardIds, timeframe, activeTab]);

    const getCardStyles = (category) => {
        switch (category) {
            case 'জানাজা':
                return {
                    container: 'bg-slate-900 border-slate-800 text-white shadow-xl',
                    accent: 'bg-teal-500',
                    title: 'text-white',
                    excerpt: 'text-slate-400',
                    meta: 'text-slate-500',
                    tag: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                };
            case 'হারানো-প্রাপ্তি':
                return {
                    container: 'bg-amber-50 border-amber-200 text-slate-800 shadow-md',
                    accent: 'bg-amber-500',
                    title: 'text-slate-900',
                    excerpt: 'text-slate-600',
                    meta: 'text-slate-400',
                    tag: 'bg-amber-100 text-amber-700 border-amber-200'
                };
            case 'জরুরি নোটিশ':
                return {
                    container: 'bg-rose-50 border-rose-200 text-slate-800 shadow-md',
                    accent: 'bg-rose-500',
                    title: 'text-slate-900',
                    excerpt: 'text-slate-600',
                    meta: 'text-slate-400',
                    tag: 'bg-rose-100 text-rose-700 border-rose-200'
                };
            case 'উন্নয়ন':
                return {
                    container: 'bg-indigo-50 border-indigo-200 text-slate-800 shadow-md',
                    accent: 'bg-indigo-500',
                    title: 'text-slate-900',
                    excerpt: 'text-slate-600',
                    meta: 'text-slate-400',
                    tag: 'bg-indigo-100 text-indigo-700 border-indigo-200'
                };
            case 'দান-প্রকল্প':
                return {
                    container: 'bg-rose-50 border-rose-200 text-slate-800 shadow-md',
                    accent: 'bg-rose-500',
                    title: 'text-slate-900',
                    excerpt: 'text-slate-600',
                    meta: 'text-slate-400',
                    tag: 'bg-rose-100 text-rose-700 border-rose-200'
                };
            case 'হারানো':
            case 'প্রাপ্তি':
                return {
                    container: 'bg-amber-50 border-amber-200 text-slate-800 shadow-md',
                    accent: 'bg-amber-500',
                    title: 'text-slate-900',
                    excerpt: 'text-slate-600',
                    meta: 'text-slate-400',
                    tag: 'bg-amber-100 text-amber-700 border-amber-200'
                };
            default:
                return {
                    container: 'bg-white/80 border-slate-200/60 text-slate-800 shadow-sm',
                    accent: 'bg-teal-600/10 group-hover:bg-teal-600',
                    title: 'text-slate-800 group-hover:text-teal-700',
                    excerpt: 'text-slate-500',
                    meta: 'text-slate-400',
                    tag: 'bg-slate-100 text-teal-700 border-slate-200/50'
                };
        }
    };

    // Pagination calculations
    const totalPages = Math.ceil(unionNews.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedNews = unionNews.slice(startIndex, endIndex);

    return (
        <section className="py-16 bg-transparent overflow-hidden">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-teal-200">
                        <Bookmark size={28} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase text-teal-600 tracking-widest mb-1 flex items-center gap-2">
                            <span className="w-6 h-[2px] bg-teal-600" />
                            {unionName} ইউনিয়ন তথ্যকেন্দ্র
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 leading-tight">
                            ইউনিয়ন <span className="text-teal-600">অ্যাক্টিভিটি ও নোটিশ</span>
                        </h2>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Local/Global Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        <button 
                            onClick={() => setActiveTab('local')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === 'local' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            নিজের ইউনিয়ন
                        </button>
                        <button 
                            onClick={() => setActiveTab('global')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === 'global' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            গ্লোবাল ইউনিয়ন
                        </button>
                    </div>

                    {/* Timeframe Filter */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto max-w-full sm:max-w-none">
                        {TIMEFRAMES.map((tf) => (
                            <button
                                key={tf.id}
                                onClick={() => setTimeframe(tf.id)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    timeframe === tf.id 
                                        ? 'bg-white text-teal-600 shadow-sm scale-[1.02]' 
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Notice Grid */}
            {paginatedNews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-slate-200">
                    <Bookmark size={48} className="text-slate-300 mb-4" />
                    <p className="text-lg font-black text-slate-600 mb-2">কোন ফলাফল পাওয়া যায়নি</p>
                    <p className="text-sm text-slate-500">এই ফিল্টারে কোন নিউজ, দান বা প্রাপ্তি নেই</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedNews.map((news) => {
                        const styles = getCardStyles(news.type === 'news' ? news.category : news.displayCategory);
                        const detailLink = news.type === 'news' ? `/news/${news.id}` : 
                                         (news.type === 'donation' ? `/donation/${news.id}` : `/lost-found/${news.id}`);
                        
                        return (
                            <div 
                                key={news.id}
                            >
                                <Link href={detailLink} className="group block h-full">
                                    <div className={`backdrop-blur-sm h-full rounded-[24px] border shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:border-teal-200 transition-all duration-500 relative flex flex-col overflow-hidden ${styles.container}`}>
                                        
                                        {/* Image Header with Black Body Fallback */}
                                        <div className={`relative h-40 w-full overflow-hidden ${news.image_url ? 'bg-slate-200' : 'bg-slate-900'}`}>
                                            {news.image_url ? (
                                                <img 
                                                    src={news.image_url} 
                                                    alt={news.title} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center opacity-30">
                                                    <Bookmark size={32} className="text-white" />
                                                </div>
                                            )}
                                            {/* Category Badge - Very prominent */}
                                            <div className="absolute top-3 right-3">
                                                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border backdrop-blur-md shadow-lg ${styles.tag}`}>
                                                    {news.displayCategory}
                                                </span>
                                            </div>
                                            
                                            {/* Source Attribution Badge if Global */}
                                            {news.is_global && (
                                                <div className="absolute bottom-3 left-3">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-black text-white border border-white/20 shadow-sm">
                                                        <MapPin size={10} className="text-teal-400" />
                                                        {news.village}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sidebar Accent */}
                                        <div className={`absolute left-0 top-40 bottom-6 w-1.5 transition-colors rounded-r-full ${styles.accent}`} />

                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${styles.meta}`}>
                                                    <Calendar size={14} className="text-teal-500" />
                                                    {news.date}
                                                </div>
                                            </div>

                                            <h3 className={`text-lg font-black leading-snug mb-3 transition-colors line-clamp-2 ${styles.title}`}>
                                                {news.title}
                                            </h3>
                                            
                                            <p className={`text-xs font-medium leading-relaxed mb-6 line-clamp-3 ${styles.excerpt}`}>
                                                {news.excerpt || news.description || news.content}
                                            </p>

                                            {/* Donation-Specific Fields */}
                                            {news.type === 'donation' && (
                                                <div className="mb-4 space-y-2 pb-4 border-b border-slate-100/10">
                                                    <div className="flex items-center justify-between text-xs font-bold">
                                                        <span className={styles.meta}>লক্ষ্য: ৳{(news.target_amount || 0).toLocaleString()}</span>
                                                        <span className="text-teal-600">{Math.round(news.progress)}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all"
                                                            style={{ width: `${news.progress}%` }}
                                                        />
                                                    </div>
                                                    <div className={`text-xs font-bold ${styles.meta}`}>
                                                        সংগৃহীত: ৳{(news.raised_amount || 0).toLocaleString()}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100/10">
                                                <div className={`flex items-center gap-1.5 text-[10px] font-bold ${styles.meta} truncate max-w-[70%]`}>
                                                    {!news.is_global && (
                                                        <>
                                                            <MapPin size={12} className="text-teal-500 shrink-0" />
                                                            {news.village}
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-black text-teal-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                                                    বিস্তারিত <LucideArrowRight size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 pt-8 border-t border-slate-200">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-6 py-3 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-teal-200 hover:bg-teal-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                            >
                                ← আগের পৃষ্ঠা
                            </button>

                            <div className="flex items-center gap-2 flex-wrap justify-center">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-10 h-10 rounded-lg font-black text-xs transition-all ${
                                            currentPage === page
                                                ? 'bg-teal-600 text-white shadow-lg shadow-teal-200'
                                                : 'border border-slate-200 bg-white text-slate-700 hover:border-teal-200'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-6 py-3 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-teal-200 hover:bg-teal-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                            >
                                পরবর্তী পৃষ্ঠা →
                            </button>

                            <div className="text-xs font-bold text-slate-500 mt-2 sm:mt-0">
                                পৃষ্ঠা {currentPage} / {totalPages}
                            </div>
                        </div>
                    )}
                </>
            )}

        </section>
    );
}

"use client";

import { useState, useEffect } from 'react';
import { 
    Search, Plus, Trash2, Edit2, 
    X, Loader2, Newspaper, Calendar, CheckCircle2,
    MapPin
} from 'lucide-react';
import { newsService } from '@/lib/services/newsService';
import ModalPortal from '@/components/common/ModalPortal';
import Pagination from '@/components/common/Pagination';

const ITEMS_PER_PAGE = 5;
const CATEGORIES = ['উন্নয়ন', 'জরুরি নোটিশ', 'হারানো-প্রাপ্তি', 'জানাজা', 'অন্যান্য'];
const EMPTY_FORM = { title: '', excerpt: '', content: '', category: 'উন্নয়ন', is_global: false, status: 'published' };

export default function NewsManager({ locationId, isAdmin = false }) {
    // ── All hooks must be declared unconditionally ──
    const [news, setNews] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [listLoading, setListLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingNews, setEditingNews] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!locationId) return;
        loadNews();
    }, [locationId, currentPage]);

    const loadNews = async () => {
        setListLoading(true);
        try {
            const result = await newsService.getNews(locationId, currentPage, ITEMS_PER_PAGE);
            setNews(result.data || []);
            setTotalCount(result.count || 0);
        } catch (err) {
            console.error('loadNews error:', err);
        } finally {
            setListLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingNews(null);
        setFormData(EMPTY_FORM);
        setErrorMsg('');
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingNews(item);
        setFormData({
            title: item.title,
            excerpt: item.excerpt || '',
            content: item.content || '',
            category: item.category || 'উন্নয়ন',
            is_global: item.is_global || false,
            status: item.status || 'published',
        });
        setErrorMsg('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingNews(null);
        setFormData(EMPTY_FORM);
        setErrorMsg('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg('');
        try {
            if (editingNews) {
                await newsService.updateNews(editingNews.id, { ...formData, location_id: locationId });
            } else {
                await newsService.addNews({ ...formData, location_id: locationId });
            }
            closeModal();
            await loadNews();
        } catch (err) {
            console.error('Submit error:', err);
            setErrorMsg(err.message || 'সংরক্ষণ করতে সমস্যা হয়েছে।');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('আপনি কি নিশ্চিত? এই খবরটি স্থায়ীভাবে মুছে যাবে।')) return;
        try {
            await newsService.deleteNews(id);
            await loadNews();
        } catch (err) {
            console.error('Delete error:', err);
            alert('মুছতে সমস্যা হয়েছে: ' + (err.message || ''));
        }
    };

    // ── Guard: render after hooks ──
    if (!locationId) {
        return (
            <div className="py-10 text-center text-slate-400 font-bold">
                কোনো ইউনিয়ন সিলেক্ট করা হয়নি।
            </div>
        );
    }

    const filteredNews = news.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                        <Newspaper size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">লোকাল নিউজ ও নোটিশ</h2>
                        <p className="text-xs font-bold text-slate-400 mt-1">ইউনিয়নের সর্বশেষ খবর, নোটিশ ও অন্যান্য আপডেট</p>
                    </div>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-teal-600 transition-all shadow-lg shadow-slate-200"
                >
                    <Plus size={18} /> নতুন নিউজ যোগ
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                {/* Search */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="শিরোনাম বা ক্যাটাগরি দিয়ে খুঁজুন..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-teal-500 outline-none font-bold text-sm transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="divide-y divide-slate-50">
                    {listLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-teal-600" size={36} />
                        </div>
                    ) : filteredNews.length > 0 ? filteredNews.map(item => (
                        <div key={item.id} className="p-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 mt-1 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm text-slate-400 shrink-0">
                                    <Newspaper size={20} />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                        <h4 className="font-black text-slate-800 text-base leading-tight">{item.title}</h4>
                                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-600 text-[9px] font-black uppercase tracking-tighter border border-teal-100">
                                            {item.category}
                                        </span>
                                        {item.status === 'published' && (
                                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase border border-emerald-100">
                                                প্রকাশিত
                                            </span>
                                        )}
                                        {item.is_global && (
                                            <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-600 text-[9px] font-black uppercase border border-sky-100 flex items-center gap-1">
                                                <MapPin size={10} /> Global
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">
                                        {item.excerpt || item.content?.substring(0, 100)}
                                    </p>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mt-1.5">
                                        <Calendar size={11} />
                                        {new Date(item.created_at).toLocaleDateString('bn-BD')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => openEditModal(item)}
                                    className="p-3 rounded-xl text-slate-300 hover:text-teal-600 hover:bg-teal-50 transition-all"
                                    title="সম্পাদনা"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-3 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                    title="মুছুন"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 text-center">
                            <Newspaper size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold">এখনো কোনো খবর বা নোটিশ যোগ করা হয়নি।</p>
                        </div>
                    )}
                </div>

                {totalCount > ITEMS_PER_PAGE && (
                    <div className="p-6 border-t border-slate-100">
                        <Pagination
                            currentPage={currentPage}
                            totalCount={totalCount}
                            pageSize={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <ModalPortal isOpen={showModal} onClose={closeModal}>
                <div
                    className="bg-white rounded-[40px] p-6 md:p-10 max-w-2xl w-full border border-slate-100 shadow-2xl relative"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeModal}
                        className="absolute top-5 right-5 p-3 rounded-2xl hover:bg-slate-100 transition-colors"
                    >
                        <X size={22} className="text-slate-400" />
                    </button>

                    {/* Modal Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                            <Newspaper size={30} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">
                                {editingNews ? 'খবর সম্পাদনা করুন' : 'নতুন খবর যোগ করুন'}
                            </h3>
                            <p className="text-sm font-bold text-slate-400 mt-1">সব তথ্য সঠিকভাবে পূরণ করুন।</p>
                        </div>
                    </div>

                    {/* Error */}
                    {errorMsg && (
                        <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">খবরের শিরোনাম *</label>
                            <input
                                required
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="যেমন: ইউনিয়নে বিনামূল্যে চিকিৎসাসেবা"
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 transition-all outline-none font-bold"
                            />
                        </div>

                        {/* Category + Global */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ক্যাটাগরি *</label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 transition-all outline-none font-bold"
                                >
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>

                            {isAdmin && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">দৃশ্যমানতা</label>
                                    <label className="flex items-center gap-3 h-[58px] px-5 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-white hover:border-teal-400 transition-all">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_global}
                                            onChange={e => setFormData({ ...formData, is_global: e.target.checked })}
                                            className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500"
                                        />
                                        <span className="text-sm font-bold text-slate-700">সকলের জন্য (Global)</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Excerpt */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">সংক্ষিপ্ত বিবরণ</label>
                            <textarea
                                rows="2"
                                value={formData.excerpt}
                                onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                                placeholder="খবরের একটি সংক্ষিপ্ত সারাংশ..."
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 transition-all outline-none font-bold resize-none"
                            />
                        </div>

                        {/* Content */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">বিস্তারিত খবর *</label>
                            <textarea
                                required
                                rows="5"
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                placeholder="বিস্তারিত তথ্য লিখুন..."
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 transition-all outline-none font-medium leading-relaxed resize-none"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-teal-600 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting
                                ? <><Loader2 size={20} className="animate-spin" /> প্রসেসিং হচ্ছে...</>
                                : <><CheckCircle2 size={20} /> {editingNews ? 'পরিবর্তন সংরক্ষণ করুন' : 'প্রকাশ করুন'}</>
                            }
                        </button>
                    </form>
                </div>
            </ModalPortal>
        </div>
    );
}

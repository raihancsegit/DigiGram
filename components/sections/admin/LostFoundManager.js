"use client";

import { useState, useEffect } from 'react';
import { 
    Search, Plus, Trash2, HelpCircle, 
    MapPin, Loader2, Save, X, Phone,
    ChevronLeft, ChevronRight, Edit2,
    Calendar, Tag, FileText, Image as ImageIcon,
    AlertCircle, CheckCircle2, Package
} from 'lucide-react';
import { lostFoundService } from '@/lib/services/lostFoundService';
import ModalPortal from '@/components/common/ModalPortal';
import { compressImage } from '@/lib/utils/imageUtils';
import { supabase } from '@/lib/utils/supabase';
import Pagination from '@/components/common/Pagination';

export default function LostFoundManager({ locationId, isAdmin = false }) {
    const [posts, setPosts] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingPost, setEditingPost] = useState(null);
    const [uploading, setUploading] = useState(false);
    const ITEMS_PER_PAGE = 5;

    if (!locationId) {
        return (
            <div className="py-10 text-center text-slate-400 font-bold">
                কোনো ইউনিয়ন সিলেক্ট করা হয়নি।
            </div>
        );
    }
    
    const [formData, setFormData] = useState({
        type: 'lost',
        category: '',
        title: '',
        description: '',
        location: '',
        event_date: '',
        contact_name: '',
        contact_phone: '',
        status: 'active',
        image_url: '',
        reward_amount: '',
        gd_number: '',
        last_seen_area: '',
        is_global: false
    });

    useEffect(() => {
        loadPosts();
    }, [locationId, currentPage]);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const result = await lostFoundService.getPosts(locationId, currentPage, 10);
            setPosts(result.data || []);
            setTotalCount(result.count || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingPost) {
                await lostFoundService.updatePost(editingPost.id, { 
                    ...formData, 
                    location_id: locationId 
                });
            } else {
                await lostFoundService.addPost({ ...formData, location_id: locationId });
            }
            setShowAddModal(false);
            setEditingPost(null);
            resetForm();
            loadPosts();
        } catch (err) {
            console.error("Submission error:", err);
            alert('সংরক্ষণ করতে সমস্যা হয়েছে। ' + (err.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            type: 'lost',
            category: '',
            title: '',
            description: '',
            location: '',
            event_date: '',
            contact_name: '',
            contact_phone: '',
            status: 'active',
            image_url: '',
            reward_amount: '',
            gd_number: '',
            last_seen_area: '',
            is_global: false
        });
    };

    const handleEdit = (post) => {
        setEditingPost(post);
        setFormData({
            type: post.type,
            category: post.category,
            title: post.title,
            description: post.description || '',
            location: post.location || '',
            event_date: post.event_date || '',
            contact_name: post.contact_name,
            contact_phone: post.contact_phone,
            status: post.status || 'active',
            image_url: post.image_url || '',
            reward_amount: post.reward_amount || '',
            gd_number: post.gd_number || '',
            last_seen_area: post.last_seen_area || '',
            is_global: post.is_global || false
        });
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('আপনি কি নিশ্চিত?')) return;
        try {
            await lostFoundService.deletePost(id);
            loadPosts();
        } catch (err) {
            alert('মুছতে সমস্যা হয়েছে।');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
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

    const categories = ['গবাদি পশু', 'দলিলপত্র', 'মোবাইল', 'আইডি কার্ড', 'মোটরসাইকেল', 'ব্যক্তি', 'অন্যান্য'];

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
    );

    const filteredPosts = posts.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <HelpCircle size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">হারানো ও প্রাপ্তি ব্যবস্থাপনা</h2>
                        <p className="text-xs font-bold text-slate-400 mt-1">হারানো বা খুঁজে পাওয়া তথ্যাদি এখানে যোগ করুন</p>
                    </div>
                </div>
                <button 
                    onClick={() => { resetForm(); setEditingPost(null); setShowAddModal(true); }}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-amber-600 transition-all shadow-lg shadow-slate-200"
                >
                    <Plus size={18} /> নতুন পোস্ট যোগ
                </button>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="শিরোনাম বা ক্যাটাগরি দিয়ে খুঁজুন..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-amber-500 outline-none font-bold text-sm transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="divide-y divide-slate-50">
                    {filteredPosts.length > 0 ? filteredPosts.map(post => (
                        <div key={post.id} className="p-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm ${post.type === 'lost' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {post.type === 'lost' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-black text-slate-800">{post.title}</h4>
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${post.type === 'lost' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {post.type === 'lost' ? 'হারানো' : 'প্রাপ্তি'}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-tighter">
                                            {post.category}
                                        </span>
                                        {post.is_global && (
                                            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-600 text-[9px] font-black uppercase tracking-tighter">
                                                গ্লোবাল
                                            </span>
                                        )}
                                        {post.status === 'resolved' && (
                                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-600 text-[9px] font-black uppercase tracking-tighter">
                                                মীমাংসিত
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                            <Phone size={10} /> {post.contact_phone} ({post.contact_name})
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                            <Calendar size={10} /> {post.event_date}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                            <MapPin size={10} /> {post.location}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => handleEdit(post)}
                                    className="p-3 rounded-xl text-slate-300 hover:text-teal-600 hover:bg-teal-50 transition-all"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(post.id)}
                                    className="p-3 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 text-center">
                            <Package size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold">এখনো কোনো পোস্ট যোগ করা হয়নি।</p>
                        </div>
                    )}
                </div>
                
                {totalCount > 10 && (
                    <div className="p-6 border-t border-slate-100">
                        <Pagination 
                            currentPage={currentPage}
                            totalCount={totalCount}
                            pageSize={10}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <ModalPortal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setEditingPost(null); resetForm(); }}>
                <div className="bg-white rounded-[40px] p-6 md:p-10 max-w-2xl w-full mx-4 border border-slate-100 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="absolute top-0 right-0 p-4 md:p-6 z-10">
                        <button onClick={() => { setShowAddModal(false); setEditingPost(null); }} className="p-3 rounded-2xl hover:bg-slate-100 transition-colors bg-white/80 backdrop-blur-sm">
                            <X size={24} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <Plus size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">{editingPost ? 'তথ্য পরিবর্তন করুন' : 'নতুন পোস্ট যোগ'}</h3>
                            <p className="text-sm font-bold text-slate-400 mt-1">সঠিক তথ্য দিয়ে ইউনিয়নবাসীকে সহায়তা করুন।</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">পোস্টের ধরন</label>
                                <select 
                                    required
                                    value={formData.type}
                                    onChange={e => setFormData({...formData, type: e.target.value})}
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 transition-all outline-none font-bold"
                                >
                                    <option value="lost">হারানো</option>
                                    <option value="found">প্রাপ্তি</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ক্যাটাগরি</label>
                                <select 
                                    required
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 transition-all outline-none font-bold"
                                >
                                    <option value="">সিলেক্ট করুন</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">শিরোনাম</label>
                            <input 
                                required
                                type="text" 
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                placeholder="যেমন: একটি লাল রঙের দেশি গাভী হারিয়েছে"
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 transition-all outline-none font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">বিস্তারিত বিবরণ</label>
                            <textarea 
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                placeholder="বিস্তারিত তথ্য এখানে লিখুন..."
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 transition-all outline-none font-bold"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ঘটনার তারিখ</label>
                                <input 
                                    type="text" 
                                    value={formData.event_date}
                                    onChange={e => setFormData({...formData, event_date: e.target.value})}
                                    placeholder="যেমন: ১১ এপ্রিল, ২০২৬"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 transition-all outline-none font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ঘটনার স্থান</label>
                                <input 
                                    type="text" 
                                    value={formData.location}
                                    onChange={e => setFormData({...formData, location: e.target.value})}
                                    placeholder="যেমন: বিনোদপুর বাজার"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 transition-all outline-none font-bold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">যোগাযোগের নাম</label>
                                <input 
                                    required
                                    type="text" 
                                    value={formData.contact_name}
                                    onChange={e => setFormData({...formData, contact_name: e.target.value})}
                                    placeholder="ব্যক্তির নাম"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 transition-all outline-none font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">যোগাযোগের নাম্বার</label>
                                <input 
                                    required
                                    type="text" 
                                    value={formData.contact_phone}
                                    onChange={e => setFormData({...formData, contact_phone: e.target.value})}
                                    placeholder="017XXXXXXXX"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 transition-all outline-none font-bold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">পুরস্কার (যদি থাকে)</label>
                                <input 
                                    type="text" 
                                    value={formData.reward_amount}
                                    onChange={e => setFormData({...formData, reward_amount: e.target.value})}
                                    placeholder="যেমন: ৫,০০০ ৳"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 transition-all outline-none font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">জিডি নাম্বার (ঐচ্ছিক)</label>
                                <input 
                                    type="text" 
                                    value={formData.gd_number}
                                    onChange={e => setFormData({...formData, gd_number: e.target.value})}
                                    placeholder="যেমন: GD-145/26"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 transition-all outline-none font-bold"
                                />
                            </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">অবস্থা</label>
                                <select 
                                    value={formData.status}
                                    onChange={e => setFormData({...formData, status: e.target.value})}
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 transition-all outline-none font-bold"
                                >
                                    <option value="active">সক্রিয়</option>
                                    <option value="resolved">মীমাংসিত</option>
                                </select>
                            </div>
                        </div>

                        {/* Global Toggle */}
                        <div className="p-5 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-between group/toggle cursor-pointer hover:bg-purple-100/50 transition-all" onClick={() => setFormData({...formData, is_global: !formData.is_global})}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.is_global ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-white text-purple-400'}`}>
                                    <AlertCircle size={20} className={formData.is_global ? 'animate-pulse' : ''} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-purple-900">গ্লোবাল নিউজ হিসেবে দেখান</h4>
                                    <p className="text-[10px] font-bold text-purple-600 opacity-70">টিক দিলে এটি হোমপেজ এবং অন্য ইউনিয়নেও দেখা যাবে</p>
                                </div>
                            </div>
                            <div className={`w-12 h-6 rounded-full transition-all relative ${formData.is_global ? 'bg-purple-600' : 'bg-slate-200'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.is_global ? 'left-7' : 'left-1'}`} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ছবির নমুনা (ঐচ্ছিক)</label>
                            <div className="relative group/upload">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="admin-lost-found-image"
                                />
                                <label 
                                    htmlFor="admin-lost-found-image"
                                    className="w-full px-5 py-8 rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 hover:border-amber-500 hover:bg-amber-50/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group-hover/upload:scale-[0.99] active:scale-[0.97]"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 size={32} className="text-amber-500 animate-spin" />
                                            <span className="text-xs font-black text-amber-500 uppercase tracking-widest">আপলোড হচ্ছে...</span>
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
                                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                                                <ImageIcon size={24} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-black text-slate-700">ক্লিক করে ছবি সিলেক্ট করুন</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">PNG, JPG অথবা JPEG (সর্বোচ্চ ২ মেগাবাইট)</p>
                                            </div>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? 'প্রসেসিং হচ্ছে...' : (editingPost ? 'পরিবর্তন সংরক্ষণ করুন' : 'তালিকায় যোগ করুন')}
                        </button>
                    </form>
                </div>
            </ModalPortal>
        </div>
    );
}

"use client";

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Send, Image as ImageIcon, MessageSquare, Info, Layout, Loader2 } from 'lucide-react';
import { wardService } from '@/lib/services/wardService';
import { compressImage } from '@/lib/utils/imageUtils';
import { supabase } from '@/lib/utils/supabase';

const CATEGORIES = ['নোটিশ', 'কৃষি', 'স্বাস্থ্য', 'উন্নয়ন', 'অন্যান্য'];

const inputStyles = "w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300";
const labelStyles = "text-xs font-black uppercase text-slate-400 tracking-wider mb-2 block flex items-center gap-1.5";

export default function WardNewsForm({ user, onSuccess, wardId }) {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        image: '',
        category: CATEGORIES[0],
    });

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            // Compress image before upload
            const compressedBlob = await compressImage(file, 1200, 1200, 0.7);
            
            const fileExt = file.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `news/${fileName}`;

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

            setFormData({ ...formData, image: publicUrl });
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('ছবি আপলোড করতে সমস্যা হয়েছে।');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await wardService.createNews({
                title: formData.title,
                excerpt: formData.excerpt,
                content: formData.content,
                image_url: formData.image,
                category: formData.category,
                location_id: wardId,
                author_id: user.id
            });
            if(onSuccess) onSuccess();

            setFormData({
                title: '',
                excerpt: '',
                content: '',
                image: '',
                category: CATEGORIES[0],
            });
            alert('আপনার খবরটি সফলভাবে প্রকাশিত হয়েছে!');
        } catch (err) {
            console.error(err);
            alert('খবর পাবলিশ করতে সমস্যা হয়েছে।');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className={labelStyles}>
                        শিরোনাম
                    </label>
                    <input 
                        required
                        type="text" 
                        placeholder="খবরের মূল শিরোনাম লিখুন..."
                        className={inputStyles}
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className={labelStyles}>
                        ক্যাটাগরি
                    </label>
                    <div className="relative">
                        <select 
                            className={inputStyles + " appearance-none cursor-pointer pr-10"}
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <Layout size={16} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className={labelStyles}>
                    সংক্ষিপ্ত সারসংক্ষেপ
                </label>
                <textarea 
                    rows={2}
                    required
                    placeholder="পাঠকদের আকৃষ্ট করতে এক বা দুই লাইনে মূল খবরটি লিখুন..."
                    className={inputStyles + " resize-none"}
                    value={formData.excerpt}
                    onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                />
            </div>

            <div className="space-y-2">
                <label className={labelStyles}>
                    বিস্তারিত প্রতিবেদন
                </label>
                <textarea 
                    rows={6}
                    required
                    placeholder="পুরো খবরটি এখানে বিস্তারিত লিখুন..."
                    className={inputStyles + " resize-none font-medium text-[15px] leading-relaxed"}
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                />
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 border-dashed space-y-4">
                <div className="flex items-center gap-2">
                    <ImageIcon size={16} className="text-teal-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">খবরের ছবি (অপশনাল)</p>
                </div>
                
                <div className="relative group/upload">
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="news-image-upload"
                    />
                    <label 
                        htmlFor="news-image-upload"
                        className="w-full px-5 py-6 rounded-2xl bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group-hover/upload:scale-[0.99] active:scale-[0.97]"
                    >
                        {uploading ? (
                            <>
                                <Loader2 size={24} className="text-teal-600 animate-spin" />
                                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">কম্প্রেস ও আপলোড হচ্ছে...</span>
                            </>
                        ) : formData.image ? (
                            <div className="relative w-full h-24 rounded-xl overflow-hidden">
                                <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    <span className="text-white text-[10px] font-black uppercase tracking-widest">ছবি পরিবর্তন করুন</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-teal-600 transition-colors">
                                    <ImageIcon size={20} />
                                </div>
                                <p className="text-xs font-black text-slate-600">ক্লিক করে খবরের ছবি আপলোড করুন</p>
                            </>
                        )}
                    </label>
                </div>
                <p className="text-[9px] font-bold text-slate-400 italic px-2">* ছবি দিলে খবরটি আরও আকর্ষণীয় দেখাবে। আমাদের সিস্টেম স্বয়ংক্রিয়ভাবে ছবির সাইজ কমিয়ে দেবে।</p>
            </div>

            <motion.button 
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="w-full py-5 rounded-[28px] bg-slate-900 text-white font-black text-base shadow-2xl hover:bg-teal-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale group"
            >
                {loading ? 'প্রসেসিং হচ্ছে...' : (
                    <>
                        পাবলিশ করুন
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            <Send size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    </>
                )}
            </motion.button>
        </form>
    );
}

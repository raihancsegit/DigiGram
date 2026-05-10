"use client";

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Send, Image as ImageIcon, MessageSquare, Info, Layout, Loader2 } from 'lucide-react';
import { wardService } from '@/lib/services/wardService';
import { compressImage } from '@/lib/utils/imageUtils';
import { supabase } from '@/lib/utils/supabase';

const CATEGORIES = ['নোটিশ', 'কৃষি', 'স্বাস্থ্য', 'উন্নয়ন', 'অন্যান্য'];

const inputStyles = "w-full p-4 md:p-5 rounded-[20px] bg-white border border-slate-200 focus:bg-white focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400 shadow-sm";
const labelStyles = "text-[11px] font-black uppercase text-slate-500 tracking-widest mb-2 block flex items-center gap-1.5";

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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
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
                            className={inputStyles + " appearance-none cursor-pointer pr-12"}
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 bg-white pl-2">
                            <Layout size={20} />
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
                        className={inputStyles + " resize-none leading-relaxed"}
                        value={formData.content}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                    />
                </div>

                <div className="p-6 rounded-[24px] bg-slate-50 border-2 border-slate-200 border-dashed space-y-4 hover:border-teal-400 hover:bg-teal-50/30 transition-all duration-300">
                    <div className="flex items-center gap-2">
                        <ImageIcon size={18} className="text-teal-600" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">খবরের ছবি (অপশনাল)</p>
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
                            className="w-full px-5 py-8 rounded-[20px] bg-white border border-slate-200 hover:border-teal-500 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group-hover/upload:shadow-lg active:scale-[0.98]"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 size={32} className="text-teal-500 animate-spin mb-2" />
                                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">কম্প্রেস ও আপলোড হচ্ছে...</span>
                                </>
                            ) : formData.image ? (
                                <div className="relative w-full h-40 rounded-xl overflow-hidden shadow-inner">
                                    <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm gap-2">
                                        <ImageIcon size={24} className="text-white" />
                                        <span className="text-white text-[10px] font-black uppercase tracking-widest">ছবি পরিবর্তন করুন</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-teal-600 group-hover:bg-teal-50 transition-colors">
                                        <ImageIcon size={28} />
                                    </div>
                                    <p className="text-sm font-black text-slate-600">ক্লিক করে খবরের ছবি আপলোড করুন</p>
                                    <p className="text-[10px] font-bold text-slate-400">JPG, PNG অথবা WEBP (ম্যাক্স ৫ MB)</p>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                <motion.button 
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || uploading}
                    className="w-full py-5 rounded-[24px] bg-gradient-to-r from-slate-900 to-slate-800 text-white font-black text-lg shadow-xl shadow-slate-900/20 hover:shadow-teal-900/30 hover:from-teal-600 hover:to-emerald-600 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale group"
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            প্রসেসিং হচ্ছে...
                        </>
                    ) : (
                        <>
                            পাবলিশ করুন
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <Send size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                        </>
                    )}
                </motion.button>
            </div>
        </form>
    );
}

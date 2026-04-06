"use client";

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Send, Image, MessageSquare, Info, Layout } from 'lucide-react';
import { addNews } from '@/lib/store/features/newsSlice';

const CATEGORIES = ['নোটিশ', 'কৃষি', 'স্বাস্থ্য', 'উন্নয়ন', 'অন্যান্য'];

const inputStyles = "w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300";
const labelStyles = "text-xs font-black uppercase text-slate-400 tracking-wider mb-2 block flex items-center gap-1.5";

export default function WardNewsForm({ user }) {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        image: '',
        category: CATEGORIES[0],
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        dispatch(addNews({
            ...formData,
            unionId: user.unionId,
            unionName: user.unionName,
            wardId: user.wardId,
            wardName: user.wardName,
            author: user.name,
            isGlobal: false,
        }));

        setFormData({
            title: '',
            excerpt: '',
            content: '',
            image: '',
            category: CATEGORIES[0],
        });
        
        setLoading(false);
        alert('আপনার খবরটি সফলভাবে প্রকাশিত হয়েছে!');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelStyles}>
                        <Layout size={14} className="text-teal-600" />
                        খবরের শিরোনাম
                    </label>
                    <input 
                        required
                        type="text" 
                        placeholder="শিরোনাম লিখুন..."
                        className={inputStyles}
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                </div>
                <div>
                    <label className={labelStyles}>
                        <Info size={14} className="text-teal-600" />
                        ক্যাটাগরি
                    </label>
                    <select 
                        className={inputStyles}
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className={labelStyles}>
                    <MessageSquare size={14} className="text-teal-600" />
                    সংক্ষিপ্ত বর্ণনা (Excerpt)
                </label>
                <textarea 
                    rows={2}
                    required
                    placeholder="খবরের মূল হাইলাইট এখানে লিখুন..."
                    className={inputStyles}
                    value={formData.excerpt}
                    onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                />
            </div>

            <div>
                <label className={labelStyles}>
                    <MessageSquare size={14} className="text-teal-600" />
                    বিস্তারিত খবর
                </label>
                <textarea 
                    rows={5}
                    required
                    placeholder="বিস্তারিত খবর এখানে লিখুন..."
                    className={inputStyles}
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                />
            </div>

            <div>
                <label className={labelStyles}>
                    <Image size={14} className="text-teal-600" />
                    ছবির লিঙ্ক (URL)
                </label>
                <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/..."
                    className={inputStyles}
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                />
            </div>

            <motion.button 
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="w-full py-5 rounded-[24px] bg-[color:var(--dg-teal)] text-white font-black text-base shadow-xl shadow-teal-700/20 hover:bg-teal-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
            >
                {loading ? 'প্রক্রিয়াধীন...' : (
                    <>
                        পাবলিশ করুন
                        <Send size={20} />
                    </>
                )}
            </motion.button>
        </form>
    );
}

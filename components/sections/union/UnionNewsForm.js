'use client';

import { useState } from 'react';
import { 
    MessageSquare, Send, Image as ImageIcon, 
    Loader2
} from 'lucide-react';
import { wardService } from '@/lib/services/wardService';

export default function UnionNewsForm({ locationId, user, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'Notice',
        image_url: ''
    });

    async function handleSubmit(e) {
        e.preventDefault();
        if (!locationId || !user?.id) {
            alert("প্রকাশ করার জন্য ইউনিয়ন ও ব্যবহারকারীর তথ্য পাওয়া যায়নি।");
            return;
        }

        setLoading(true);
        try {
            await wardService.createNews({
                title: formData.title,
                excerpt: formData.content.slice(0, 180),
                content: formData.content,
                category: formData.category,
                image_url: formData.image_url,
                location_id: locationId,
                author_id: user.id,
                status: 'published'
            });

            setFormData({ title: '', content: '', category: 'Notice', image_url: '' });
            if (onSuccess) await onSuccess();
            alert("নিউজ/নোটিশ প্রকাশিত হয়েছে।");
        } catch (err) {
            console.error('Union news publish failed:', err);
            alert("প্রকাশ করতে সমস্যা হয়েছে।");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-50 p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <MessageSquare size={20} />
                </div>
                <h4 className="font-black text-slate-800">নতুন নিউজ বা নোটিশ লিখুন</h4>
            </div>

            <div className="space-y-4">
                <input 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="নিউজ বা নোটিশের শিরোনাম..."
                    className="w-full px-6 py-4 rounded-2xl bg-white border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />

                <div className="flex flex-col gap-4 sm:flex-row">
                    <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="px-6 py-4 rounded-2xl bg-white border-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm appearance-none flex-1"
                    >
                        <option value="Notice">সাধারণ নোটিশ</option>
                        <option value="Event">ইভেন্ট/অনুষ্ঠান</option>
                        <option value="Emergency">জরুরি সতর্কতা</option>
                        <option value="Development">উন্নয়নমূলক নিউজ</option>
                    </select>
                    <div className="flex-1 bg-white rounded-2xl flex items-center px-6">
                        <ImageIcon size={18} className="text-slate-300 mr-3" />
                        <input 
                            value={formData.image_url}
                            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                            placeholder="ছবির লিঙ্ক (ঐচ্ছিক)"
                            className="bg-transparent border-none flex-1 text-sm font-bold focus:ring-0"
                        />
                    </div>
                </div>

                <textarea 
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="বিস্তারিত সংবাদ লিখুন..."
                    className="w-full px-6 py-4 rounded-2xl bg-white border-none focus:ring-2 focus:ring-indigo-500 font-bold min-h-[150px]"
                />
            </div>

            <div className="flex justify-stretch sm:justify-end">
                <button 
                    disabled={loading}
                    className="w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                    প্রকাশ করুন
                </button>
            </div>
        </form>
    );
}

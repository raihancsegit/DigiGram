'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
    ArrowLeft, Camera, Image as ImageIcon, Send, Clock, BookOpen, AlertCircle
} from 'lucide-react';
import { layout } from '@/lib/theme';

export default function MosqueAdminClient({ mosqueId }) {
    const [entryType, setEntryType] = useState('expense'); // 'income' or 'expense'
    const [step, setStep] = useState(1); // 1 = Login mock, 2 = Dashboard main

    if (step === 1) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="w-full max-w-[400px] bg-white rounded-[32px] p-8 text-center shadow-2xl">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <BookOpen size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">ক্যাশিয়ার প্যানেল</h2>
                    <p className="text-sm font-bold text-slate-500 mb-8">মসজিদের হিসাব আপডেট করতে লগইন করুন</p>
                    
                    <input 
                        type="text" 
                        placeholder="ক্যাশিয়ার মোবাইল নম্বর" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-center text-slate-600 mb-4 focus:outline-none focus:border-emerald-500"
                    />
                    <input 
                        type="password" 
                        placeholder="পাসওয়ার্ড / পিন" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-center text-slate-600 mb-6 focus:outline-none focus:border-emerald-500"
                    />
                    
                    <button 
                        onClick={() => setStep(2)}
                        className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30"
                    >
                        প্রবেশ করুন
                    </button>

                    <Link href={`/m/${mosqueId}`} className="inline-block mt-6 text-sm font-bold text-slate-400 hover:text-emerald-600 flex items-center justify-center gap-1">
                        <ArrowLeft size={16} /> মূল পোর্টালে ফেরত যান
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="dg-section-x px-2 md:px-6 pb-32 pt-4 md:pt-8 bg-slate-100 min-h-screen">
            <div className="max-w-[600px] mx-auto" style={{ maxWidth: layout.servicesMaxPx }}>
                
                {/* Admin Header */}
                <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-[24px] shadow-sm">
                    <Link href={`/m/${mosqueId}`} className="p-3 rounded-xl bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="text-center">
                        <h1 className="text-lg font-black text-slate-800 leading-none">নতুন এন্টি</h1>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">বায়তুল মোকাররম সেন্ট্রাল মসজিদ</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-100 rounded-xl"></div> {/* Empty for balance visually */}
                </div>

                <div className="bg-orange-50 border border-orange-200 p-4 rounded-[20px] mb-6 flex gap-3 text-orange-800">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p className="text-xs font-bold leading-relaxed">
                        স্বচ্ছতার জন্য যে কোনো খরচ বা আয়ের রসিদের ছবি অবশ্যই আপলোড করবেন। ছবি আপলোড করলে ভাউচার ভেরিফাইড হিসেবে গণ্য হবে।
                    </p>
                </div>

                {/* Entry Form Card */}
                <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm">
                    
                    {/* Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
                        <button 
                            onClick={() => setEntryType('income')}
                            className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${entryType === 'income' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500'}`}
                        >
                            আয় (Income)
                        </button>
                        <button 
                            onClick={() => setEntryType('expense')}
                            className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${entryType === 'expense' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500'}`}
                        >
                            খরচ (Expense)
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Receipt Scanner / Uploader */}
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2">প্রমাণক / মেমোর ছবি (ঐচ্ছিক)</label>
                            <button className="w-full aspect-[21/9] bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-emerald-300 transition-all hover:text-emerald-600 group">
                                <Camera size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm">মেমোর ছবি তুলুন বা আপলোড করুন</span>
                            </button>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2">বিবরণ</label>
                            <input 
                                type="text"
                                placeholder="যেমন: বিদ্যুত বিল (মার্চ) বা জুম্মার দান"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2">টাকার পরিমাণ</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">৳</span>
                                <input 
                                    type="number"
                                    placeholder="0.00"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xl font-black text-slate-700 focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2">তারিখ</label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="date"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 font-bold text-slate-600 focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-black text-white text-lg shadow-lg ${entryType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'} transition-all`}>
                            <Send size={20} />
                            সাবমিট করুন
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
}

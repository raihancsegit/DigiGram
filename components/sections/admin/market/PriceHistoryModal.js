"use client";

import { useState, useEffect } from 'react';
import { marketService } from '@/lib/services/marketService';
import { 
    X, TrendingUp, TrendingDown, Minus, 
    Calendar, Loader2, BarChart3, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toBnDigits } from '@/lib/utils/format';

export function PriceHistoryModal({ isOpen, onClose, marketId, marketName, commodity }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && marketId && commodity?.id) {
            loadHistory();
        }
    }, [isOpen, marketId, commodity]);

    async function loadHistory() {
        try {
            setLoading(true);
            setError(null);
            const data = await marketService.getPriceHistory(marketId, commodity.id, 30);
            setHistory(data || []);
        } catch (err) {
            console.error("Failed to load history:", err);
            setError("ইতিহাস লোড করা সম্ভব হয়নি। ডাটাবেস টেবিল চেক করুন।");
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[40px] shadow-2xl relative z-[1001] w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-slate-100">
                            {commodity.icon}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800">{commodity.name} - বাজারদর ইতিহাস</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                {marketName} • গত ৩০ দিনের চিত্র
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-teal-600" size={32} />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">ডাটা বিশ্লেষণ করা হচ্ছে...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 bg-rose-50 rounded-[32px] border border-rose-100">
                            <p className="text-rose-600 font-bold">{error}</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100">
                            <Clock size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold">এই পণ্যের কোনো পূর্ববর্তী রেকর্ড পাওয়া যায়নি।</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <StatCard 
                                    label="সর্বনিম্ন দাম" 
                                    value={Math.min(...history.map(h => h.price))} 
                                    icon={<TrendingDown className="text-emerald-500" size={16} />}
                                    color="emerald"
                                />
                                <StatCard 
                                    label="সর্বোচ্চ দাম" 
                                    value={Math.max(...history.map(h => h.price))} 
                                    icon={<TrendingUp className="text-rose-500" size={16} />}
                                    color="rose"
                                />
                                <StatCard 
                                    label="গড় দাম" 
                                    value={Math.round(history.reduce((acc, h) => acc + h.price, 0) / history.length)} 
                                    icon={<BarChart3 className="text-teal-500" size={16} />}
                                    color="teal"
                                />
                            </div>

                            {/* History List */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-4">তারিখ অনুযায়ী দামের পরিবর্তন</h3>
                                {history.map((record, idx) => {
                                    const prev = history[idx + 1];
                                    const diff = prev ? record.price - prev.price : 0;
                                    
                                    return (
                                        <div key={record.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-teal-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                                    <Calendar size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">
                                                        {new Date(record.recorded_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">সরবরাহ: {record.supply === 'Normal' ? 'স্বাভাবিক' : record.supply === 'Low' ? 'স্বল্প' : 'প্রচুর'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-slate-800">৳{toBnDigits(record.price)}</p>
                                                {diff !== 0 && (
                                                    <p className={`text-[10px] font-black flex items-center justify-end gap-1 ${diff > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                        {diff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                        ৳{toBnDigits(Math.abs(diff))} {diff > 0 ? 'বেড়েছে' : 'কমেছে'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }).reverse()}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 bg-slate-50/30">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                    >
                        বন্ধ করুন
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function StatCard({ label, value, icon, color }) {
    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
        teal: 'bg-teal-50 text-teal-600 border-teal-100'
    };

    return (
        <div className={`p-4 rounded-3xl border ${colorClasses[color]} flex flex-col gap-1`}>
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{label}</span>
            </div>
            <p className="text-xl font-black">৳{toBnDigits(value)}</p>
        </div>
    );
}

"use client";

import { useState, useEffect } from 'react';
import { 
    Plus, Building2, School, BookOpen, 
    Trash2, Edit3, ExternalLink, Search,
    ChevronRight, MapPin, Loader2, Save,
    CircleDollarSign, X as CloseIcon
} from 'lucide-react';
import { institutionService } from '@/lib/services/institutionService';
import { toBnDigits } from '@/lib/utils/format';
import Link from 'next/link';
import ModalPortal from '@/components/common/ModalPortal';
import Pagination from '@/components/common/Pagination';

export default function InstitutionManager({ locationId }) {
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showTxModal, setShowTxModal] = useState(false);
    const [selectedInst, setSelectedInst] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    
    const [formData, setFormData] = useState({
        name: '',
        type: 'mosque',
        village: '',
        config: {}
    });

    const [txData, setTxData] = useState({
        amount: '',
        type: 'income',
        description: ''
    });

    useEffect(() => {
        loadInstitutions();
    }, [locationId, currentPage]);

    const loadInstitutions = async () => {
        setLoading(true);
        try {
            const result = await institutionService.getInstitutionsByUnion(locationId, currentPage, 10);
            setInstitutions(result.data || []);
            setTotalCount(result.count || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await institutionService.addInstitution({
                ...formData,
                location_id: locationId
            });
            setShowAddForm(false);
            setFormData({ name: '', type: 'mosque', village: '', config: {} });
            loadInstitutions();
            alert('প্রতিষ্ঠান যোগ করা হয়েছে।');
        } catch (err) {
            alert('সংরক্ষণ করতে সমস্যা হয়েছে।');
        }
    };

    const handleAddTx = async (e) => {
        e.preventDefault();
        try {
            await institutionService.addTransaction({
                ...txData,
                institutionId: selectedInst.id,
                amount: parseFloat(txData.amount)
            });
            setShowTxModal(false);
            setTxData({ amount: '', type: 'income', description: '' });
            alert('হিসাব যোগ করা হয়েছে।');
        } catch (err) {
            alert('ত্রুটি হয়েছে।');
        }
    };

    const filtered = institutions.filter(inst => 
        inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.village.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTypeIcon = (type) => {
        switch(type) {
            case 'mosque': return <Building2 className="text-emerald-600" />;
            case 'school': return <School className="text-blue-600" />;
            case 'college': return <BookOpen className="text-purple-600" />;
            default: return <Building2 />;
        }
    };

    const getTypeLabel = (type) => {
        switch(type) {
            case 'mosque': return 'মসজিদ';
            case 'school': return 'স্কুল';
            case 'college': return 'কলেজ';
            case 'madrassa': return 'মাদ্রাসা';
            default: return type;
        }
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-slate-800">প্রতিষ্ঠান ব্যবস্থাপনা</h2>
                    <p className="text-xs font-bold text-slate-400 mt-1">ইউনিয়নের সকল স্কুল, কলেজ ও মসজিদ পোর্টাল নিয়ন্ত্রণ করুন</p>
                </div>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                    {showAddForm ? 'তালিকা দেখুন' : <><Plus size={18} /> নতুন যোগ করুন</>}
                </button>
            </div>

            {showAddForm ? (
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase ml-1">প্রতিষ্ঠানের নাম</label>
                            <input 
                                required
                                type="text" 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="যেমন: বায়তুল মোকাররম মসজিদ"
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase ml-1">ধরণ</label>
                            <select 
                                value={formData.type}
                                onChange={e => setFormData({...formData, type: e.target.value})}
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold"
                            >
                                <option value="mosque">মসজিদ</option>
                                <option value="school">স্কুল</option>
                                <option value="college">কলেজ</option>
                                <option value="madrassa">মাদ্রাসা</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase ml-1">গ্রাম</label>
                            <input 
                                required
                                type="text" 
                                value={formData.village}
                                onChange={e => setFormData({...formData, village: e.target.value})}
                                placeholder="যেমন: নওহাটা"
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold"
                            />
                        </div>
                        <div className="flex items-end">
                            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">
                                <Save size={18} /> সংরক্ষণ করুন
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="নাম বা গ্রাম দিয়ে খুঁজুন..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-indigo-500 outline-none font-bold text-sm transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {filtered.length > 0 ? filtered.map(inst => (
                            <div key={inst.id} className="p-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center border border-white shadow-sm">
                                        {getTypeIcon(inst.type)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-black text-slate-800">{inst.name}</h4>
                                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[9px] font-black uppercase">
                                                {getTypeLabel(inst.type)}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                            <MapPin size={12} /> গ্রাম: {inst.village}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => { setSelectedInst(inst); setShowTxModal(true); }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 font-black text-[11px] hover:bg-emerald-100 transition-all"
                                    >
                                        হিসাব যোগ <CircleDollarSign size={14} />
                                    </button>
                                    <Link 
                                        href={inst.type === 'mosque' ? `/m/${inst.id}` : `/school/${inst.id}`}
                                        target="_blank"
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-black text-[11px] hover:bg-indigo-100 transition-all"
                                    >
                                        ভিউ পোর্টাল <ExternalLink size={14} />
                                    </Link>
                                    <button className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
                                        <Edit3 size={18} />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center">
                                <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-400 font-bold">কোনো প্রতিষ্ঠান পাওয়া যায়নি।</p>
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
            )}

            {/* Transaction Modal */}
            <ModalPortal isOpen={showTxModal} onClose={() => setShowTxModal(false)}>
                <div className="bg-white rounded-[32px] p-8 max-w-md w-full mx-4 border border-slate-100 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <button onClick={() => setShowTxModal(false)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                            <CloseIcon size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CircleDollarSign size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">হিসাব যোগ করুন</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1">{selectedInst?.name}</p>
                        </div>
                    </div>

                    <form onSubmit={handleAddTx} className="space-y-6">
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-4">
                            <button 
                                type="button"
                                onClick={() => setTxData({...txData, type: 'income'})}
                                className={`py-3 rounded-xl text-xs font-black transition-all ${txData.type === 'income' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
                            >আয়</button>
                            <button 
                                type="button"
                                onClick={() => setTxData({...txData, type: 'expense'})}
                                className={`py-3 rounded-xl text-xs font-black transition-all ${txData.type === 'expense' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
                            >ব্যয়</button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">টাকার পরিমাণ (৳)</label>
                            <input 
                                required
                                type="number" 
                                value={txData.amount}
                                onChange={e => setTxData({...txData, amount: e.target.value})}
                                placeholder="যেমন: ৫০০০"
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">বিবরণ</label>
                            <input 
                                required
                                type="text" 
                                value={txData.description}
                                onChange={e => setTxData({...txData, description: e.target.value})}
                                placeholder="যেমন: সাপ্তাহিক চাঁদা"
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold"
                            />
                        </div>

                        <button type="submit" className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200">
                            সংরক্ষণ করুন
                        </button>
                    </form>
                </div>
            </ModalPortal>
        </div>
    );
}

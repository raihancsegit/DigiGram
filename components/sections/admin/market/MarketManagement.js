"use client";

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { marketService } from '@/lib/services/marketService';
import { adminService } from '@/lib/services/adminService';
import { 
    Plus, Store, Users, TrendingUp, TrendingDown, 
    Minus, Edit3, Trash2, MapPin, Calendar, 
    Save, X, Loader2, Search, CheckCircle2, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarketManagement() {
    const { user } = useSelector((state) => state.auth);
    
    const isManager = user?.role === 'market_manager';
    const isChairman = user?.role === 'chairman';
    const isAdmin = user?.role === 'super_admin';

    const [markets, setMarkets] = useState([]);
    const [commodities, setCommodities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'prices', 'config'
    const [selectedMarketId, setSelectedMarketId] = useState(null);
    const [prices, setPrices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    
    // Create/Edit State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editMarketId, setEditMarketId] = useState(null);
    const [availableManagers, setAvailableManagers] = useState([]);
    const [newMarket, setNewMarket] = useState({ name: '', type: 'প্রতিদিন', days: ['Everyday'], managerId: '', locationId: user?.access_scope_id || '' });
    const [newUser, setNewUser] = useState({ name: '', phone: '', password: '' });
    const [submitting, setSubmitting] = useState(false);
    const [unions, setUnions] = useState([]);
    const [selectedUnionId, setSelectedUnionId] = useState(user?.access_scope_id || '');

    useEffect(() => {
        loadInitialData();
        if (isAdmin || isChairman) {
            loadAvailableManagers();
            if (isAdmin) loadUnions();
        }
    }, [user, selectedUnionId]);

    async function loadUnions() {
        try {
            const { data } = await adminService.getLocations('union', 1, 100);
            setUnions(data);
        } catch (err) {
            console.error("Failed to load unions:", err);
        }
    }

    async function loadAvailableManagers() {
        try {
            // Fetch all regular users so admin can promote anyone to market manager
            const { data } = await adminService.getUsersPaginated(1, 1000, 'all', '');
            
            // Filter out super admins and let them pick regular users or existing managers
            const validManagers = data.filter(u => 
                !u.role.includes('super_admin') && 
                !u.role.includes('school_admin') && 
                !u.role.includes('mosque_admin')
            );
            
            setAvailableManagers(validManagers);
        } catch (err) {
            console.error("Failed to load managers:", err);
        }
    }

    async function loadInitialData() {
        try {
            setLoading(true);
            const [commods, unionMarkets] = await Promise.all([
                marketService.getCommodities(),
                isAdmin 
                    ? (selectedUnionId ? marketService.getMarketsByUnion(selectedUnionId) : marketService.getGlobalMarketOverview().then(d => d.markets))
                    : marketService.getMarketsByUnion(user?.access_scope_id, isManager ? user.id : null)
            ]);
            
            setCommodities(commods);
            setMarkets(unionMarkets);
            
            if (unionMarkets.length > 0) {
                setSelectedMarketId(unionMarkets[0].id);
                loadPrices(unionMarkets[0].id);
            } else {
                setSelectedMarketId(null);
                setPrices([]);
            }
        } catch (err) {
            console.error("Load failed:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateMarket(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            let finalManagerId = newMarket.managerId;
            let finalLocationId = isAdmin ? newMarket.locationId : user.access_scope_id;

            if (newMarket.managerId === 'new_user') {
                if (!newUser.name || !newUser.phone || !newUser.password) {
                    throw new Error("নতুন ইউজারের সব তথ্য দিন");
                }
                const res = await adminService.quickCreateChairman({
                    email: `${newUser.phone}@digigram.com`,
                    password: newUser.password,
                    first_name: newUser.name,
                    last_name: '',
                    phone: newUser.phone,
                    role: 'market_manager',
                    access_scope_id: finalLocationId
                });
                finalManagerId = res.data.id;
            }

            if (isEditing && editMarketId) {
                await marketService.updateMarket({
                    id: editMarketId,
                    name: newMarket.name,
                    type: newMarket.type,
                    managerId: finalManagerId
                });
            } else {
                await marketService.createMarket({
                    ...newMarket,
                    managerId: finalManagerId,
                    locationId: finalLocationId
                });
            }

            setShowCreateModal(false);
            setIsEditing(false);
            setEditMarketId(null);
            setNewMarket({ name: '', type: 'প্রতিদিন', days: ['Everyday'], managerId: '', locationId: user?.access_scope_id || '' });
            setNewUser({ name: '', phone: '', password: '' });
            await loadInitialData();
        } catch (err) {
            alert((isEditing ? "আপডেট" : "হাট তৈরি") + " করতে সমস্যা: " + err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteMarket(id) {
        if (!confirm('আপনি কি নিশ্চিত যে এই হাটটি সম্পূর্ণ মুছে ফেলতে চান? এটি আর ফেরত পাওয়া যাবে না।')) return;
        try {
            await marketService.deleteMarket(id);
            await loadInitialData();
        } catch (err) {
            alert("মুছতে সমস্যা: " + err.message);
        }
    }

    async function loadPrices(marketId) {
        if (!marketId) return;
        try {
            const data = await marketService.getMarketPrices(marketId);
            setPrices(data);
        } catch (err) {
            console.error("Load prices failed:", err.message || JSON.stringify(err));
        }
    }

    const handleUpdatePrice = async (commodityId, price, supply) => {
        try {
            if (!price || isNaN(price)) {
                throw new Error("দয়া করে সঠিক দাম লিখুন");
            }
            await marketService.updatePrice({
                marketId: selectedMarketId,
                commodityId,
                price: Number(price),
                supply,
                updatedBy: user.id
            });
            // Reload prices
            await loadPrices(selectedMarketId);
            return { success: true };
        } catch (err) {
            console.error("Update Price Error:", err);
            return { success: false, message: err.message || JSON.stringify(err) };
        }
    };

    if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-teal-600 mb-4" size={40} /><p className="font-black text-slate-500">লোড হচ্ছে...</p></div>;

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <ShoppingBag className="text-teal-600" />
                        হাট বাজার ব্যবস্থাপনা
                    </h1>
                    <p className="text-slate-500 font-bold mt-1">ডিজিটাল হাটের পণ্য ও মূল্য নিয়ন্ত্রণ প্যানেল।</p>
                </div>
                
                {(isAdmin || isChairman) && (
                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <select 
                                value={selectedUnionId}
                                onChange={(e) => setSelectedUnionId(e.target.value)}
                                className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black text-slate-600 focus:ring-4 focus:ring-teal-500/10 outline-none"
                            >
                                <option value="">সকল ইউনিয়ন</option>
                                {unions.map(u => <option key={u.id} value={u.id}>{u.name_bn}</option>)}
                            </select>
                        )}
                        <button 
                            onClick={() => {
                                setIsEditing(false);
                                setEditMarketId(null);
                                setNewMarket({ name: '', type: 'প্রতিদিন', days: ['Everyday'], managerId: '', locationId: user?.access_scope_id || '' });
                                setShowCreateModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-2xl font-black hover:bg-teal-700 shadow-lg shadow-teal-200 transition-all"
                        >
                            <Plus size={20} /> নতুন হাট যোগ করুন
                        </button>
                    </div>
                )}
            </div>

            {/* Selection Bar */}
            <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
                {markets.map(m => (
                    <button
                        key={m.id}
                        onClick={() => {
                            setSelectedMarketId(m.id);
                            loadPrices(m.id);
                        }}
                        className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all whitespace-nowrap group ${
                            selectedMarketId === m.id 
                                ? 'bg-slate-900 border-slate-900 text-white shadow-xl' 
                                : 'bg-white border-slate-100 text-slate-500 hover:border-teal-200 hover:bg-teal-50/30'
                        }`}
                    >
                        <Store size={18} />
                        <div className="text-left">
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">{m.type}</p>
                            <p className="font-black text-sm leading-none">{m.name}</p>
                        </div>
                        {selectedMarketId === m.id && (isAdmin || isChairman) && (
                            <div className="flex items-center ml-2 gap-1">
                                <div 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setIsEditing(true);
                                        setEditMarketId(m.id);
                                        setNewMarket({
                                            name: m.name,
                                            type: m.type,
                                            days: m.days,
                                            managerId: m.manager_id || '',
                                            locationId: m.location_id
                                        });
                                        setShowCreateModal(true);
                                    }} 
                                    className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 hover:bg-teal-500 hover:text-white transition-colors"
                                    title="এডিট করুন"
                                >
                                    <Edit3 size={14} />
                                </div>
                                <div 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteMarket(m.id); }} 
                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                    title="হাট মুছুন"
                                >
                                    <Trash2 size={14} />
                                </div>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Main Price Editor */}
            <div className="bg-white rounded-[40px] border border-slate-200/60 shadow-xl overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-black text-slate-800">পণ্যের বাজারদর আপডেট</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">আজকের সঠিক দাম ইনপুট দিন</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="পণ্য খুঁজুন..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle2 size={16} /> লাইভ আপডেট মোড
                        </div>
                    </div>
                </div>

                <div className="p-0 sm:p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    <th className="px-8 py-6">পণ্য</th>
                                    <th className="px-8 py-6">বর্তমান দাম (কেজি/লিটার)</th>
                                    <th className="px-8 py-6">সরবরাহ অবস্থা</th>
                                    <th className="px-8 py-6 text-right">অ্যাকশন</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(() => {
                                    const filtered = commodities.filter(c => 
                                        c.name.toLowerCase().includes(searchTerm.toLowerCase())
                                    );
                                    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
                                    
                                    return paginated.length > 0 ? paginated.map(commodity => {
                                        const priceRecord = prices.find(p => p.commodity_id === commodity.id);
                                        return (
                                            <PriceRow 
                                                key={commodity.id} 
                                                commodity={commodity} 
                                                priceRecord={priceRecord} 
                                                onUpdate={handleUpdatePrice}
                                            />
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="4" className="py-20 text-center text-slate-400 font-bold">কোনো পণ্য পাওয়া যায়নি।</td>
                                        </tr>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {(() => {
                        const filtered = commodities.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
                        if (filtered.length <= ITEMS_PER_PAGE) return null;
                        
                        return (
                            <div className="mt-8 flex items-center justify-between bg-slate-50/50 p-6 rounded-[32px] border border-slate-100">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    মোট {filtered.length} টির মধ্যে {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} টি দেখানো হচ্ছে
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-600 hover:border-teal-500 hover:text-teal-600 transition-all disabled:opacity-30 active:scale-95 shadow-sm"
                                    >
                                        পূর্ববর্তী
                                    </button>
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs font-black shadow-lg">
                                        {currentPage}
                                    </div>
                                    <button 
                                        disabled={currentPage * ITEMS_PER_PAGE >= filtered.length}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-600 hover:border-teal-500 hover:text-teal-600 transition-all disabled:opacity-30 active:scale-95 shadow-sm"
                                    >
                                        পরবর্তী
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Create Market Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[48px] shadow-2xl relative z-10 w-full max-w-lg overflow-hidden p-10"
                        >
                            <h2 className="text-2xl font-black text-slate-800 mb-2">{isEditing ? "হাট এডিট করুন" : "নতুন হাট যোগ করুন"}</h2>
                            <p className="text-sm font-bold text-slate-400 mb-8">{isEditing ? "হাটের তথ্য পরিবর্তন করুন।" : "ইউনিয়নের জন্য একটি নতুন ডিজিটাল হাট প্রোফাইল তৈরি করুন।"}</p>
                            
                            <form onSubmit={handleCreateMarket} className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">হাটের নাম</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
                                        placeholder="উদা: ভবানীপুর হাট"
                                        value={newMarket.name}
                                        onChange={(e) => setNewMarket({...newMarket, name: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">হাটের ধরন</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all appearance-none"
                                            value={newMarket.type}
                                            onChange={(e) => setNewMarket({...newMarket, type: e.target.value})}
                                        >
                                            <option value="প্রতিদিন">প্রতিদিন</option>
                                            <option value="সাপ্তাহিক">সাপ্তাহিক</option>
                                            <option value="পশু হাট">পশু হাট</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">প্রতিনিধি (Manager)</label>
                                        <select 
                                            required
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all appearance-none"
                                            value={newMarket.managerId}
                                            onChange={(e) => setNewMarket({...newMarket, managerId: e.target.value})}
                                        >
                                            <option value="">নির্বাচন করুন</option>
                                            <option value="new_user" className="font-black text-teal-600">+ নতুন ইউজার তৈরি করুন</option>
                                            {availableManagers.map(m => (
                                                <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {newMarket.managerId === 'new_user' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-5 bg-teal-50 rounded-2xl border border-teal-100 space-y-4">
                                        <h4 className="text-xs font-black text-teal-700 uppercase tracking-widest">নতুন ইউজারের তথ্য দিন</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input required type="text" placeholder="পুরো নাম" className="w-full bg-white border border-teal-200 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                                            <input required type="text" placeholder="ফোন নম্বর" className="w-full bg-white border border-teal-200 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} />
                                        </div>
                                        <input required type="password" placeholder="পাসওয়ার্ড (অন্তত ৬ অক্ষর)" className="w-full bg-white border border-teal-200 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                                    </motion.div>
                                )}

                                {isAdmin && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ইউনিয়ন সিলেক্ট করুন</label>
                                        <select 
                                            required
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all appearance-none"
                                            value={newMarket.locationId}
                                            onChange={(e) => setNewMarket({...newMarket, locationId: e.target.value})}
                                        >
                                            <option value="">ইউনিয়ন নির্বাচন করুন</option>
                                            {unions.map(u => <option key={u.id} value={u.id}>{u.name_bn}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mt-8">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setIsEditing(false);
                                        }}
                                        className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                                    >
                                        বাতিল
                                    </button>
                                    <button 
                                        disabled={submitting}
                                        type="submit"
                                        className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black text-sm hover:bg-teal-700 shadow-xl shadow-teal-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <Loader2 size={18} className="animate-spin" /> : (isEditing ? 'সেভ করুন' : 'হাট তৈরি করুন')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function PriceRow({ commodity, priceRecord, onUpdate }) {
    const [editValue, setEditValue] = useState(priceRecord?.price || '');
    const [supply, setSupply] = useState(priceRecord?.supply || 'Normal');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error', null

    useEffect(() => {
        if (priceRecord) {
            setEditValue(priceRecord.price);
            setSupply(priceRecord.supply);
        } else {
            setEditValue('');
            setSupply('Normal');
        }
    }, [priceRecord]);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus(null);
        const result = await onUpdate(commodity.id, editValue, supply);
        setIsSaving(false);
        
        if (result && result.success) {
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        } else {
            setSaveStatus('error');
            alert(result?.message || 'আপডেট ব্যর্থ হয়েছে।');
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    const hasChanged = priceRecord ? (Number(editValue) !== Number(priceRecord.price) || supply !== priceRecord.supply) : editValue !== '';

    return (
        <tr className="hover:bg-slate-50/50 transition-colors group">
            <td className="px-8 py-6">
                <div className="flex items-center gap-4">
                    <span className="text-3xl bg-white w-12 h-12 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm">{commodity.icon}</span>
                    <div>
                        <p className="font-black text-slate-800">{commodity.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">১ {commodity.unit}</p>
                    </div>
                </div>
            </td>
            <td className="px-8 py-6">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                        <input 
                            type="number" 
                            className="w-32 pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white transition-all font-black text-slate-800"
                            placeholder="দাম লিখুন"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                        />
                    </div>
                    {priceRecord?.trend && (
                        <div className={`p-2 rounded-lg ${
                            priceRecord.trend === 'up' ? 'text-rose-500 bg-rose-50' : 
                            priceRecord.trend === 'down' ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                        }`} title={priceRecord.trend === 'up' ? 'দাম বেড়েছে' : priceRecord.trend === 'down' ? 'দাম কমেছে' : 'দাম স্থিতিশীল'}>
                            {priceRecord.trend === 'up' ? <TrendingUp size={16} /> : 
                             priceRecord.trend === 'down' ? <TrendingDown size={16} /> : <Minus size={16} />}
                        </div>
                    )}
                </div>
            </td>
            <td className="px-8 py-6">
                <select 
                    value={supply}
                    onChange={(e) => setSupply(e.target.value)}
                    className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 focus:ring-4 focus:ring-teal-500/10 focus:outline-none"
                >
                    <option value="Low">স্বল্প সরবরাহ</option>
                    <option value="Normal">স্বাভাবিক</option>
                    <option value="High">প্রচুর সরবরাহ</option>
                </select>
            </td>
            <td className="px-8 py-6 text-right">
                <button 
                    disabled={!hasChanged || isSaving}
                    onClick={handleSave}
                    className={`p-3 rounded-xl transition-all flex items-center justify-center ml-auto ${
                        saveStatus === 'success' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' :
                        saveStatus === 'error' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' :
                        hasChanged 
                            ? 'bg-teal-600 text-white shadow-lg shadow-teal-200 hover:scale-110 active:scale-95' 
                            : 'bg-slate-100 text-slate-300'
                    }`}
                    title={saveStatus === 'success' ? 'সেভ হয়েছে!' : saveStatus === 'error' ? 'সমস্যা হয়েছে' : 'সেভ করুন'}
                >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : 
                     saveStatus === 'success' ? <CheckCircle2 size={18} /> :
                     <Save size={18} />}
                </button>
            </td>
        </tr>
    );
}

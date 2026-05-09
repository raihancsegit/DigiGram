'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Home, User, Phone, MapPin, Zap, Droplets, 
    Plus, Trash2, Save, Loader2, CheckCircle, Navigation
} from 'lucide-react';
import { householdService } from '@/lib/services/householdService';

export default function HouseholdEntryForm({ wardId, villageId, onSuccess, onCancel }) {
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1); // 1: House Info, 2: Residents
    const [householdId, setHouseholdId] = useState(null);

    const [houseForm, setHouseForm] = useState({
        house_no: '',
        owner_name: '',
        phone: '',
        electricity_meter: false,
        meter_no: '',
        latrine_status: 'hygienic',
        water_source: 'tube-well',
        lat: '',
        lng: ''
    });

    const [residents, setResidents] = useState([
        { name: '', gender: 'Male', is_voter: false, blood_group: '' }
    ]);

    async function handleGetLocation() {
        if (!navigator.geolocation) {
            alert("আপনার ব্রাউজার জিপিএস সাপোর্ট করে না");
            return;
        }
        navigator.geolocation.getCurrentPosition((position) => {
            setHouseForm({
                ...houseForm,
                lat: position.coords.latitude,
                lng: position.coords.longitude
            });
            alert("লোকেশন সেট করা হয়েছে!");
        }, (err) => {
            alert("লোকেশন পাওয়া যায়নি। অনুগ্রহ করে পারমিশন চেক করুন।");
        });
    }

    async function handleSaveHouse() {
        setSaving(true);
        try {
            const data = await householdService.createHousehold({
                ...houseForm,
                ward_id: wardId,
                village_id: villageId
            });
            setHouseholdId(data.id);
            setStep(2);
        } catch (err) {
            alert("বাড়ি সেভ করতে সমস্যা হয়েছে");
        } finally {
            setSaving(false);
        }
    }

    async function handleAddResident() {
        setResidents([...residents, { name: '', gender: 'Male', is_voter: false, blood_group: '' }]);
    }

    async function handleSaveResidents() {
        setSaving(true);
        try {
            for (const resident of residents) {
                if (resident.name) {
                    await householdService.createResident({
                        ...resident,
                        household_id: householdId
                    });
                }
            }
            onSuccess();
        } catch (err) {
            alert("সদস্য সেভ করতে সমস্যা হয়েছে");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-2xl w-full max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                    <Home size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800">
                        {step === 1 ? 'নতুন বাড়ি এন্ট্রি' : 'সদস্যদের তথ্য'}
                    </h3>
                    <p className="text-xs font-bold text-slate-400">ধাপ {step} এর ২</p>
                </div>
            </div>

            {step === 1 ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">বাড়ির নম্বর/আইডি</label>
                            <input 
                                value={houseForm.house_no}
                                onChange={(e) => setHouseForm({...houseForm, house_no: e.target.value})}
                                className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                                placeholder="উদা: H-১০১"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">মালিকের মোবাইল</label>
                            <input 
                                value={houseForm.phone}
                                onChange={(e) => setHouseForm({...houseForm, phone: e.target.value})}
                                className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                                placeholder="017XXXXXXXX"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">মালিকের নাম</label>
                        <input 
                            required
                            value={houseForm.owner_name}
                            onChange={(e) => setHouseForm({...houseForm, owner_name: e.target.value})}
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-teal-500 font-bold"
                            placeholder="উদা: মোঃ আবুল হোসেন"
                        />
                    </div>

                    <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <MapPin size={20} className="text-teal-600" />
                            <div>
                                <p className="text-xs font-black text-slate-800">ম্যাপ লোকেশন সেট করুন</p>
                                <p className="text-[10px] text-slate-400 font-bold">
                                    {houseForm.lat ? `সেট করা হয়েছে: ${houseForm.lat.toFixed(4)}, ${houseForm.lng.toFixed(4)}` : 'লোকেশন সেট করা হয়নি'}
                                </p>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={handleGetLocation}
                            className="p-2.5 rounded-lg bg-white border border-teal-200 text-teal-600 hover:bg-teal-600 hover:text-white transition-all"
                        >
                            <Navigation size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50">
                            <Zap size={18} className="text-amber-500" />
                            <span className="text-xs font-bold text-slate-600 flex-1">বিদ্যুৎ মিটার আছে?</span>
                            <input 
                                type="checkbox"
                                checked={houseForm.electricity_meter}
                                onChange={(e) => setHouseForm({...houseForm, electricity_meter: e.target.checked})}
                                className="w-5 h-5 rounded-md text-teal-600"
                            />
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50">
                            <Droplets size={18} className="text-blue-500" />
                            <select 
                                value={houseForm.water_source}
                                onChange={(e) => setHouseForm({...houseForm, water_source: e.target.value})}
                                className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 p-0"
                            >
                                <option value="tube-well">টিউবওয়েল</option>
                                <option value="tap">সাপ্লাই পানি</option>
                                <option value="pond">পুকুর</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onCancel} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">বাতিল</button>
                        <button 
                            onClick={handleSaveHouse}
                            disabled={!houseForm.owner_name || saving}
                            className="flex-[2] py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                            পরবর্তী ধাপ
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="max-h-[350px] overflow-y-auto pr-2 space-y-4">
                        {residents.map((r, idx) => (
                            <div key={idx} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4 relative group">
                                <button 
                                    onClick={() => setResidents(residents.filter((_, i) => i !== idx))}
                                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">সদস্যের নাম</label>
                                    <input 
                                        value={r.name}
                                        onChange={(e) => {
                                            const newR = [...residents];
                                            newR[idx].name = e.target.value;
                                            setResidents(newR);
                                        }}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white border-none focus:ring-2 focus:ring-teal-500 font-bold text-sm"
                                        placeholder="উদা: মোছাঃ রহিমা বেগম"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <select 
                                        value={r.gender}
                                        onChange={(e) => {
                                            const newR = [...residents];
                                            newR[idx].gender = e.target.value;
                                            setResidents(newR);
                                        }}
                                        className="px-4 py-2.5 rounded-xl bg-white border-none text-xs font-bold focus:ring-2 focus:ring-teal-500"
                                    >
                                        <option value="Male">পুরুষ</option>
                                        <option value="Female">নারী</option>
                                        <option value="Other">অন্যান্য</option>
                                    </select>
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">ভোটার?</span>
                                        <input 
                                            type="checkbox"
                                            checked={r.is_voter}
                                            onChange={(e) => {
                                                const newR = [...residents];
                                                newR[idx].is_voter = e.target.checked;
                                                setResidents(newR);
                                            }}
                                            className="w-4 h-4 rounded text-teal-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={handleAddResident}
                        className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 font-black text-xs uppercase tracking-widest hover:border-teal-400 hover:text-teal-600 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> আরও সদস্য যোগ করুন
                    </button>

                    <button 
                        onClick={handleSaveResidents}
                        disabled={saving}
                        className="w-full py-5 rounded-2xl bg-teal-600 text-white font-black text-sm uppercase tracking-widest hover:bg-teal-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-teal-100"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                        সব তথ্য সংরক্ষণ করুন
                    </button>
                </div>
            )}
        </div>
    );
}

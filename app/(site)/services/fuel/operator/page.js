"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PumpOperatorPanel from '../components/PumpOperatorPanel';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { verifyOperatorLoginAction } from '../actions';

import { Suspense } from 'react';

function FuelOperatorContent() {
    const searchParams = useSearchParams();
    const [accessPin, setAccessPin] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [error, setError] = useState('');
    const [isChecking, setIsChecking] = useState(true);

    const unionSlug = searchParams?.get('u') || 'south-union';

    useEffect(() => {
        const storedAuth = localStorage.getItem(`digifuel_auth_${unionSlug}`);
        if (storedAuth === 'authorized') {
            setIsAuthorized(true);
        }
        setIsChecking(false);
    }, [unionSlug]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        const result = await verifyOperatorLoginAction(unionSlug, accessPin);
        
        if (result.success) {
            localStorage.setItem(`digifuel_auth_${unionSlug}`, 'authorized');
            setIsAuthorized(true);
        } else {
            setError(result.error || 'ভুল পিন কোড। আবার চেষ্টা করুন।');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem(`digifuel_auth_${unionSlug}`);
        setIsAuthorized(false);
    };

    if (isChecking) return null; // Avoid flicker

    if (!isAuthorized) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white p-10 rounded-[48px] shadow-2xl border border-slate-100 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-amber-50 rounded-[32px] flex items-center justify-center mx-auto text-amber-600">
                        <ShieldCheck size={40} />
                    </div>
                    
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black text-slate-800">অপারেটর এক্সেস</h1>
                        <p className="text-sm font-medium text-slate-500">পাম্প অপারেটর ছাড়া অন্যদের প্রবেশ নিষেধ</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                            <input 
                                type="password"
                                value={accessPin}
                                onChange={(e) => setAccessPin(e.target.value)}
                                placeholder="৪ ডিজিটের পিন লিখুন"
                                maxLength={4}
                                className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-200 focus:border-amber-500 outline-none text-center font-black text-2xl tracking-[0.5em] transition-all"
                            />
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">
                                <Lock size={20} />
                            </div>
                        </div>
                        
                        {error && <p className="text-rose-600 text-xs font-bold italic">{error}</p>}

                        <button 
                            type="submit"
                            className="w-full py-5 rounded-3xl bg-slate-900 text-white font-black text-lg flex items-center justify-center gap-2 group active:scale-95 transition-all shadow-xl shadow-slate-200"
                        >
                            প্রবেশ করুন <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Fuel Control System</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <PumpOperatorPanel unionSlug={unionSlug} onLogout={handleLogout} /> 
        </div>
    );
}

export default function FuelOperatorPage() {
    return (
        <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center">লোড হচ্ছে...</div>}>
            <FuelOperatorContent />
        </Suspense>
    );
}

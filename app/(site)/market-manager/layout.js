"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { supabase } from '@/lib/utils/supabase';
import { login, performLogout } from '@/lib/store/features/authSlice';
import { authService } from '@/lib/services/authService';
import { Loader2, LogOut, ArrowLeft, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function MarketManagerLayout({ children }) {
    const router = useRouter();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(true);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                router.replace('/login');
                return;
            }

            if (!isAuthenticated) {
                try {
                    const profile = await authService.getProfile(session.user.id);
                    if (profile) {
                        if (profile.role !== 'market_manager') {
                            router.replace('/login');
                            return;
                        }
                        dispatch(login({
                            id: session.user.id,
                            email: session.user.email,
                            role: profile.role,
                            access_scope_id: profile.access_scope_id,
                            first_name: profile.first_name,
                            last_name: profile.last_name,
                            avatar_url: profile.avatar_url
                        }));
                    } else {
                        router.replace('/login');
                    }
                } catch (err) {
                    console.error("Auth sync error:", err);
                    router.replace('/login');
                }
            } else {
                if (user?.role !== 'market_manager') {
                    router.replace('/login');
                    return;
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, [isAuthenticated, router, dispatch]);

    if (!hasMounted || loading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="text-teal-500 animate-spin mb-4" size={40} />
                <p className="font-black text-slate-400 animate-pulse tracking-widest uppercase text-xs">ড্যাশবোর্ড লোড হচ্ছে...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                        <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <ShoppingBag className="text-teal-600" />
                            হাট বাজার
                            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-md bg-teal-50 text-teal-600 text-[10px] font-black uppercase tracking-wider border border-teal-100">
                                প্রতিনিধি প্যানেল
                            </span>
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button 
                            onClick={async () => {
                                await dispatch(performLogout());
                                router.push('/login');
                            }}
                            className="flex items-center gap-2 text-red-500 font-bold text-xs sm:text-sm hover:bg-red-50 px-3 sm:px-4 py-2 rounded-xl transition-all"
                        >
                            <LogOut size={18} />
                            <span className="hidden xs:inline">লগআউট</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}

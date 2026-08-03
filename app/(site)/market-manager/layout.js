"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { supabase } from '@/lib/utils/supabase';
import { login, performLogout } from '@/lib/store/features/authSlice';
import { authService } from '@/lib/services/authService';
import { AlertTriangle, ArrowLeft, Loader2, LogOut, ShoppingBag } from 'lucide-react';
import { getPortalRouteForRole } from '@/lib/utils/portalRoutes';

function withTimeout(promise, timeoutMs = 8000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Market manager auth check timed out')), timeoutMs)),
    ]);
}

export default function MarketManagerLayout({ children }) {
    const router = useRouter();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(true);
    const [hasMounted, setHasMounted] = useState(false);
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        const frame = requestAnimationFrame(() => setHasMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        let active = true;

        const checkAuth = async () => {
            setAuthError('');
            try {
                const { data: { session } } = await withTimeout(supabase.auth.getSession());
                if (!active) return;

                if (!session) {
                    router.replace('/login');
                    return;
                }

                if (!isAuthenticated) {
                    const profile = await withTimeout(authService.getProfile(session.user.id));
                    if (!active) return;

                    if (!profile) {
                        router.replace('/login');
                        return;
                    }

                    if (profile.role !== 'market_manager') {
                        router.replace(getPortalRouteForRole(profile.role));
                        return;
                    }

                    dispatch(login({
                        id: session.user.id,
                        email: session.user.email,
                        role: profile.role,
                        access_scope_id: profile.access_scope_id,
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                        avatar_url: profile.avatar_url,
                    }));
                } else if (user?.role !== 'market_manager') {
                    router.replace(getPortalRouteForRole(user?.role));
                    return;
                }

                setLoading(false);
            } catch (err) {
                console.error('Market manager auth sync error:', err);
                if (!active) return;
                setAuthError(err.message || 'Market manager auth check failed');
                setLoading(false);
            }
        };

        checkAuth();

        return () => {
            active = false;
        };
    }, [isAuthenticated, router, dispatch, user?.role]);

    if (!hasMounted || loading) {
        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50">
                <Loader2 className="mb-4 animate-spin text-teal-500" size={40} />
                <p className="animate-pulse text-xs font-black uppercase tracking-widest text-slate-400">ড্যাশবোর্ড লোড হচ্ছে...</p>
            </div>
        );
    }

    if (authError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-xl">
                    <AlertTriangle className="mx-auto mb-4 text-amber-500" size={42} />
                    <h1 className="text-xl font-black text-slate-900">Market manager session check failed</h1>
                    <p className="mt-2 text-sm font-bold text-slate-500">{authError}</p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white"
                    >
                        Reload
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="rounded-xl p-2 transition-colors hover:bg-slate-100">
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                        <h1 className="flex items-center gap-2 text-lg font-black text-slate-800">
                            <ShoppingBag className="text-teal-600" />
                            হাট বাজার
                            <span className="ml-2 hidden rounded-md border border-teal-100 bg-teal-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-600 sm:inline-block">
                                প্রতিনিধি প্যানেল
                            </span>
                        </h1>
                    </div>

                    <button
                        onClick={async () => {
                            await dispatch(performLogout());
                            router.push('/login');
                        }}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-500 transition-all hover:bg-red-50 sm:px-4 sm:text-sm"
                    >
                        <LogOut size={18} />
                        <span className="hidden xs:inline">লগআউট</span>
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8">
                {children}
            </main>
        </div>
    );
}

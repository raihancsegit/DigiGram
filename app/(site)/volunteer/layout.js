"use client";

import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/utils/supabase';
import { authService } from '@/lib/services/authService';
import { login } from '@/lib/store/features/authSlice';
import { getPortalRouteForRole } from '@/lib/utils/portalRoutes';

function withTimeout(promise, timeoutMs = 8000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Volunteer auth check timed out')), timeoutMs)),
    ]);
}

export default function VolunteerLayout({ children }) {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        let active = true;

        const checkAuth = async () => {
            setAuthError('');

            try {
                if (isAuthenticated && user?.role === 'volunteer') {
                    setLoading(false);
                    return;
                }

                const { data: { session } } = await withTimeout(supabase.auth.getSession());
                if (!active) return;

                if (!session) {
                    router.replace('/login');
                    return;
                }

                const profile = await withTimeout(authService.getProfile(session.user.id));
                if (!active) return;

                if (!profile) {
                    router.replace('/login');
                    return;
                }

                if (profile.role !== 'volunteer') {
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
                setLoading(false);
            } catch (err) {
                console.error('Volunteer auth sync error:', err);
                if (!active) return;
                setAuthError(err.message || 'Volunteer auth check failed');
                setLoading(false);
            }
        };

        checkAuth();

        return () => {
            active = false;
        };
    }, [dispatch, isAuthenticated, router, user]);

    if (loading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-slate-50 text-slate-400">
                <Loader2 className="mb-4 animate-spin" size={40} />
                <p className="text-xs font-black uppercase tracking-widest">ভলান্টিয়ার পোর্টাল লোড হচ্ছে...</p>
            </div>
        );
    }

    if (authError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-xl">
                    <AlertTriangle className="mx-auto mb-4 text-amber-500" size={42} />
                    <h1 className="text-xl font-black text-slate-900">Volunteer session check failed</h1>
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
        <div className="min-h-screen bg-slate-50/50">
            {children}
        </div>
    );
}

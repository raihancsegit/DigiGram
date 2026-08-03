"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { supabase } from '@/lib/utils/supabase';
import { login } from '@/lib/store/features/authSlice';
import { authService } from '@/lib/services/authService';
import AdminShell from '@/components/layout/AdminShell';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { canAccessAdminPath, getPortalRouteForRole, isAdminPortalRole } from '@/lib/utils/portalRoutes';

function withTimeout(promise, timeoutMs = 8000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Admin auth check timed out')), timeoutMs)),
    ]);
}

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
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

                    if (!isAdminPortalRole(profile.role)) {
                        router.replace(getPortalRouteForRole(profile.role));
                        return;
                    }
                    if (!canAccessAdminPath(profile.role, pathname)) {
                        router.replace(getPortalRouteForRole(profile.role));
                        return;
                    }

                    dispatch(login({
                        id: session.user.id,
                        email: session.user.email,
                        role: profile.role,
                        access_scope_id: profile.access_scope_id,
                        permissions: profile.permissions || {},
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                        avatar_url: profile.avatar_url,
                    }));
                } else {
                    if (!isAdminPortalRole(user?.role) || !canAccessAdminPath(user?.role, pathname)) {
                        router.replace(getPortalRouteForRole(user?.role));
                        return;
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error('Admin auth sync error:', err);
                if (!active) return;
                setAuthError(err.message || 'Admin auth check failed');
                setLoading(false);
            }
        };

        checkAuth();

        return () => {
            active = false;
        };
    }, [isAuthenticated, router, dispatch, user?.role, pathname]);

    if (!hasMounted || loading) {
        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50">
                <Loader2 className="mb-4 animate-spin text-teal-500" size={40} />
                <p className="animate-pulse text-xs font-black uppercase tracking-widest text-slate-400">অ্যাডমিন প্যানেল লোড হচ্ছে...</p>
            </div>
        );
    }

    if (authError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-xl">
                    <AlertTriangle className="mx-auto mb-4 text-amber-500" size={42} />
                    <h1 className="text-xl font-black text-slate-900">Admin session check failed</h1>
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

    return <AdminShell>{children}</AdminShell>;
}

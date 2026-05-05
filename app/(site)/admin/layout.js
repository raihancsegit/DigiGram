"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { supabase } from '@/lib/utils/supabase';
import { login, logout } from '@/lib/store/features/authSlice';
import { authService } from '@/lib/services/authService';
import AdminShell from '@/components/layout/AdminShell';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }) {
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
                        const isAdminRole = profile.role === 'super_admin' || profile.role.endsWith('_admin');
                        
                        if (!isAdminRole) {
                            // Redirect based on role
                            if (profile.role === 'chairman') {
                                router.replace('/chairman/dashboard');
                            } else {
                                router.replace('/login');
                            }
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
                const isAdminRole = user?.role === 'super_admin' || user?.role?.endsWith('_admin');
                if (!isAdminRole) {
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
                <p className="font-black text-slate-400 animate-pulse tracking-widest uppercase text-xs">অ্যাডমিন প্যানেল লোড হচ্ছে...</p>
            </div>
        );
    }

    return <AdminShell>{children}</AdminShell>;
}

'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { authService } from '@/lib/services/authService';
import { login, logout } from '@/lib/store/features/authSlice';

export default function AuthSessionSync() {
    const dispatch = useDispatch();

    useEffect(() => {
        let active = true;

        async function syncSession() {
            try {
                const { session, profile } = await authService.getCurrentSessionProfile();
                if (!active) return;

                if (!session?.user || !profile) {
                    dispatch(logout());
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
            } catch (error) {
                console.error('Auth session sync failed:', error);
                if (active) dispatch(logout());
            }
        }

        syncSession();

        return () => {
            active = false;
        };
    }, [dispatch]);

    return null;
}

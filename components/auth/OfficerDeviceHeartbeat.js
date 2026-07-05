'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { authenticatedFetch } from '@/lib/utils/authenticated-fetch';

const OFFICER_ROLES = new Set([
    'super_admin', 'chairman', 'ward_member', 'volunteer',
    'institution_admin', 'school_admin', 'market_manager',
    'mosque_admin', 'clinic_admin'
]);

function getDeviceId() {
    const key = 'digigram_officer_device_id';
    let value = window.localStorage.getItem(key);
    if (!value) {
        value = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        window.localStorage.setItem(key, value);
    }
    return value;
}

export default function OfficerDeviceHeartbeat() {
    const user = useSelector((state) => state.auth.user);

    useEffect(() => {
        if (!OFFICER_ROLES.has(user?.role)) return undefined;
        let stopped = false;
        const register = async () => {
            try {
                await authenticatedFetch('/api/officer/device', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deviceId: getDeviceId(),
                        deviceName: navigator.userAgentData?.platform || navigator.platform || 'Web device',
                        platform: navigator.userAgentData?.mobile ? 'mobile_web' : 'web',
                        language: navigator.language,
                        screen: `${window.screen.width}x${window.screen.height}`
                    })
                });
            } catch {
                // Device management is optional until migration 72 is installed.
            }
        };
        register();
        const interval = window.setInterval(() => {
            if (!stopped && document.visibilityState === 'visible') register();
        }, 15 * 60 * 1000);
        return () => {
            stopped = true;
            window.clearInterval(interval);
        };
    }, [user?.role, user?.id]);

    return null;
}

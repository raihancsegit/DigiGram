'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { householdOfflineOutbox } from '@/lib/services/householdOfflineOutbox';
import { toBnDigits } from '@/lib/utils/format';

export default function HouseholdOutboxSync() {
    const { isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!isAuthenticated || typeof window === 'undefined') return;
        let active = true;

        const sync = async () => {
            if (!navigator.onLine || householdOfflineOutbox.getSummary().total === 0) return;
            const result = await householdOfflineOutbox.syncAll();
            if (!active) return;
            if (result.synced > 0) {
                toast.success(`${toBnDigits(String(result.synced))}টি offline household background-এ sync হয়েছে।`);
            }
        };

        window.addEventListener('online', sync);
        sync();
        return () => {
            active = false;
            window.removeEventListener('online', sync);
        };
    }, [isAuthenticated]);

    return null;
}

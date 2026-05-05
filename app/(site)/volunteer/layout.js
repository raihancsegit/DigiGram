"use client";

import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function VolunteerLayout({ children }) {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        } else if (user?.role !== 'volunteer') {
            router.push('/'); // Redirect non-volunteers
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, user, router]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p className="text-xs font-black uppercase tracking-widest">ভলান্টিয়ার পোর্টাল লোড হচ্ছে...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            {children}
        </div>
    );
}

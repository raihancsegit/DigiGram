'use client';

import { usePathname } from 'next/navigation';
import PageShell from '@/components/layout/PageShell';
import Header from '@/components/layout/Header';
import LocationModal from '@/components/modals/LocationModal';
import BottomNav from '@/components/layout/BottomNav';
import AiAssistant from '@/components/ai/AiAssistant';

export default function SiteShell({ children }) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/admin') || pathname?.startsWith('/chairman');

    return (
        <PageShell>
            {!isDashboard && <Header />}
            <div className={isDashboard ? "min-h-screen bg-slate-50" : "dg-content-stack"}>
                {children}
            </div>
            {!isDashboard && <LocationModal />}
            {!isDashboard && <BottomNav />}
            <AiAssistant />
        </PageShell>
    );
}

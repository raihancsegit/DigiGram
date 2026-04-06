'use client';

import { usePathname } from 'next/navigation';
import PageShell from '@/components/layout/PageShell';
import Header from '@/components/layout/Header';
import NewsTicker from '@/components/layout/NewsTicker';
import LocationModal from '@/components/modals/LocationModal';
import BottomNav from '@/components/layout/BottomNav';

export default function SiteShell({ children }) {
    const pathname = usePathname();
    const showTicker = pathname === '/';

    return (
        <PageShell>
            <Header />
            <div className="dg-content-stack">
                {showTicker && <NewsTicker />}
                {children}
            </div>
            <LocationModal />
            <BottomNav />
        </PageShell>
    );
}

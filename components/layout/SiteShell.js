'use client';

import { usePathname } from 'next/navigation';
import PageShell from '@/components/layout/PageShell';
import Header from '@/components/layout/Header';
import LocationModal from '@/components/modals/LocationModal';
import BottomNav from '@/components/layout/BottomNav';

export default function SiteShell({ children }) {
    return (
        <PageShell>
            <Header />
            <div className="dg-content-stack">
                {children}
            </div>
            <LocationModal />
            <BottomNav />
        </PageShell>
    );
}

'use client';

import { usePathname } from 'next/navigation';
import PageShell from '@/components/layout/PageShell';
import Header from '@/components/layout/Header';
import LocationModal from '@/components/modals/LocationModal';
import BottomNav from '@/components/layout/BottomNav';
import SiteFooter from '@/components/layout/SiteFooter';
import AiAssistant from '@/components/ai/AiAssistant';

export default function SiteShell({ children }) {
    const pathname = usePathname();
    const isOfficerPortal = ['/admin', '/chairman', '/ward-member', '/volunteer', '/market-manager']
        .some((prefix) => pathname?.startsWith(prefix));
    const isAuthPage = pathname === '/login';
    const isInstitutionPortal = pathname?.startsWith('/school/') || pathname?.startsWith('/m/');
    const showPublicChrome = !isOfficerPortal && !isInstitutionPortal && !isAuthPage;

    return (
        <PageShell>
            {showPublicChrome && <Header />}
            <div id="main-content" tabIndex={-1} className={showPublicChrome ? "dg-content-stack outline-none" : "min-h-screen bg-slate-50 outline-none"}>
                {children}
            </div>
            {showPublicChrome && <SiteFooter />}
            {showPublicChrome && <LocationModal />}
            {showPublicChrome && <BottomNav />}
            <AiAssistant />
        </PageShell>
    );
}

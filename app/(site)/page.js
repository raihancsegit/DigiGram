import { HomeHeroSection, PortalHowItWorks, LocalStatsSection, LatestNewsSection, CommunityBulletin } from '@/components/sections/home';
import PowerWatchSection from '@/components/sections/community/PowerWatchSection';

export default function HomePage() {
    return (
        <main className="min-h-screen bg-white">
            <HomeHeroSection />
            <LocalStatsSection />
            <CommunityBulletin />
            <PowerWatchSection />
            <LatestNewsSection />
            <PortalHowItWorks />
        </main>
    );
}

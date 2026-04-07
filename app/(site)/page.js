import { HomeHeroSection, PortalHowItWorks, LocalStatsSection, LatestNewsSection } from '@/components/sections/home';

export default function HomePage() {
    return (
        <main className="min-h-screen bg-white">
            <HomeHeroSection />
            <LocalStatsSection />
            <LatestNewsSection />
            <PortalHowItWorks />
        </main>
    );
}

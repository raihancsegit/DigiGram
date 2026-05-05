import { HomeHeroSection, PortalHowItWorks, HomeImpactSection, GlobalUpdatesSection } from '@/components/sections/home';

export default function HomePage() {
    return (
        <main className="min-h-screen bg-white">
            <HomeHeroSection />
            <HomeImpactSection />
            <GlobalUpdatesSection />
            <PortalHowItWorks />
        </main>
    );
}

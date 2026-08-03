import { HomeHeroSection, HomeCitizenServicesSection, PortalHowItWorks, HomeImpactSection, GlobalUpdatesSection } from '@/components/sections/home';

export default function HomePage() {
    return (
        <main className="min-h-screen bg-white">
            <HomeHeroSection />
            <HomeCitizenServicesSection />
            <HomeImpactSection />
            <GlobalUpdatesSection />
            <PortalHowItWorks />
        </main>
    );
}

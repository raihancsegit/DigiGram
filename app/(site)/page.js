import { HomeHeroSection, HomeCitizenQuickActions, HomeCitizenGateway, PortalHowItWorks, HomeImpactSection, GlobalUpdatesSection } from '@/components/sections/home';
import RelatedServiceLinks from '@/components/common/RelatedServiceLinks';

export default function HomePage() {
    return (
        <main className="min-h-screen bg-white">
            <HomeHeroSection />
            <HomeCitizenQuickActions />
            <HomeCitizenGateway />
            <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
                <RelatedServiceLinks
                    preset="home"
                    title="সবচেয়ে বেশি দরকারি shortcut"
                    subtitle="সাধারণ মানুষ যেন homepage থেকেই নাগরিক কাজ, বাজার দর, স্কুল ও জরুরি সেবা খুঁজে পায়।"
                />
            </div>
            <HomeImpactSection />
            <GlobalUpdatesSection />
            <PortalHowItWorks />
        </main>
    );
}

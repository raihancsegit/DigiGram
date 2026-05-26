import { GlobalMarketDashboard } from './components/GlobalMarketDashboard';
import { UnionMarketView } from './components/UnionMarketView';
import RelatedServiceLinks from '@/components/common/RelatedServiceLinks';

export default async function MarketPage(props) {
    const searchParams = await props.searchParams;
    const unionSlug = searchParams?.u;

    return (
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-8 px-4">
            {unionSlug ? (
                <UnionMarketView unionSlug={unionSlug} />
            ) : (
                <GlobalMarketDashboard />
            )}
            <RelatedServiceLinks
                currentKey="market"
                preset="market"
                title="বাজারের সাথে related কাজ"
                subtitle="দাম দেখা শেষে alert, Citizen Center, lost-found বা SMS business খুলুন।"
            />
        </div>
    );
}

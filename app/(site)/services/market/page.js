import { GlobalMarketDashboard } from './components/GlobalMarketDashboard';
import { UnionMarketView } from './components/UnionMarketView';

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
        </div>
    );
}

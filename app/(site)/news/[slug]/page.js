import { newsService } from '@/lib/services/newsService';
import NewsDetailsView from '@/components/templates/NewsDetailsView';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const news = await newsService.getNewsBySlugOrId(slug);
    
    if (!news) return { title: 'News Not Found' };

    return {
        title: `${news.title} - DigiGram`,
        description: news.excerpt,
        openGraph: {
            title: news.title,
            description: news.excerpt,
            images: [news.image_url],
        },
    };
}

export default async function NewsPage({ params }) {
    const { slug } = await params;
    const news = await newsService.getNewsBySlugOrId(slug);
    
    if (!news) notFound();

    return <NewsDetailsView news={news} />;
}


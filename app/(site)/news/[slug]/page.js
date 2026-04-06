import { getNewsBySlug, ALL_NEWS } from '@/lib/content/newsData';
import NewsDetailsView from '@/components/templates/NewsDetailsView';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const news = await getNewsBySlug(slug);
    
    if (!news) return { title: 'News Not Found' };

    return {
        title: `${news.title} - DigiGram`,
        description: news.excerpt,
        openGraph: {
            title: news.title,
            description: news.excerpt,
            images: [news.image],
        },
    };
}

export default async function NewsPage({ params }) {
    const { slug } = await params;
    const news = await getNewsBySlug(slug);
    
    if (!news) notFound();

    return <NewsDetailsView news={news} />;
}

export async function generateStaticParams() {
    return ALL_NEWS.map((news) => ({
        slug: news.slug,
    }));
}

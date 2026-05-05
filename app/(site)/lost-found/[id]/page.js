import { lostFoundService } from '@/lib/services/lostFoundService';
import LostFoundDetailView from '@/components/templates/LostFoundDetailView';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const post = await lostFoundService.getPostById(id);
    if (!post) return { title: 'Not Found' };
    const typeLabel = post.type === 'lost' ? 'হারানো' : 'প্রাপ্তি';
    return {
        title: `${post.title} - ${typeLabel} | DigiGram`,
        description: post.description,
    };
}

export default async function LostFoundDetailPage({ params }) {
    const { id } = await params;
    const post = await lostFoundService.getPostById(id);
    if (!post) notFound();
    return <LostFoundDetailView post={post} />;
}


import { donationService } from '@/lib/services/donationService';
import DonationDetailView from '@/components/templates/DonationDetailView';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const project = await donationService.getProjectById(id);
    if (!project) return { title: 'Not Found' };
    return {
        title: `${project.title} - দান প্রকল্প | DigiGram`,
        description: project.description,
    };
}

export default async function DonationDetailPage({ params }) {
    const { id } = await params;
    const project = await donationService.getProjectById(id);
    if (!project) notFound();
    return <DonationDetailView project={project} />;
}


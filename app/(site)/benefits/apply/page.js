import BenefitApplicationClient from '@/components/benefits/BenefitApplicationClient';

export const metadata = {
    title: 'ভাতা আবেদন প্রস্তুতি',
    description: 'মাতৃত্বকালীন, বয়স্ক, বিধবা ও প্রতিবন্ধী ভাতার আবেদন প্রস্তুত করুন।',
};

export default async function BenefitApplicationPage({ searchParams }) {
    const query = await searchParams;
    return <BenefitApplicationClient initialService={query?.service} />;
}

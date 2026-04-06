import StaticDocPage from '@/components/templates/StaticDocPage';

export const metadata = {
    title: 'রোডম্যাপ | DigiGram',
    description: 'রিলিজ ফেজ ১–৫।',
};

export default function RoadmapPage() {
    return (
        <StaticDocPage title="রিলিজ রোডম্যাপ" kicker="পরিকল্পনা">
            <ol className="list-decimal pl-5 space-y-4">
                <li>
                    <strong>ফেজ ১ (মাস ১–৩):</strong> Google/FB লগইন, এরিয়া ফিল্টার, ব্লাড ব্যাংক, নিউজ পোর্টাল।
                </li>
                <li>
                    <strong>ফেজ ২ (মাস ৪–৫):</strong> লার্নিং নোটস, কুইজ, ইসলামিক সেকশন।
                </li>
                <li>
                    <strong>ফেজ ৩ (মাস ৬–৯):</strong> ই-ইউপি ট্র্যাকিং, স্কুল অটোমেশন SaaS।
                </li>
                <li>
                    <strong>ফেজ ৪ (মাস ১০–১২):</strong> স্মার্ট সমিতি, খামার বিনিয়োগ, বাজার।
                </li>
                <li>
                    <strong>ফেজ ৫ (ভবিষ্যৎ):</strong> DigiAI ফিচার ধাপে ধাপে।
                </li>
            </ol>
        </StaticDocPage>
    );
}

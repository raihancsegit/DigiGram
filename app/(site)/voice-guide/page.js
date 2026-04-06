import StaticDocPage from '@/components/templates/StaticDocPage';

export const metadata = {
    title: 'ভয়েস গাইড | DigiGram',
    description: 'বয়স্ক ও নিরক্ষরদের জন্য অডিও নির্দেশনা।',
};

export default function VoiceGuidePage() {
    return (
        <StaticDocPage title="ভয়েস গাইডেন্স" kicker="অ্যাক্সেসিবিলিটি">
            <p>
                গুরুত্বপূর্ণ স্ক্রিন ও ফরমে <strong>বাংলা অডিও ইনস্ট্রাকশন</strong>—প্লে/পজ বাটন, ধীর গতি, পুনরাবৃত্তি। ভবিষ্যতে{' '}
                <strong>Voice-Command Portal</strong> (আঞ্চলিক ভাষা) এর সাথে মিলিয়ে নেওয়া হবে।
            </p>
            <ul className="list-disc pl-5 space-y-2">
                <li>হোম, সেবা আবেদন ও জরুরি নম্বর—আলাদা অডিও ট্র্যাক আইডি</li>
                <li>অফলাইন ক্যাশিং (PWA)</li>
                <li>স্ক্রিন রিডার হিসেবে আংশিক বিকল্প</li>
            </ul>
            <p className="text-sm text-[color:var(--dg-muted)]">স্ট্যাটিক পেজ: অডিও ফাইল এখনো সংযুক্ত নয়।</p>
        </StaticDocPage>
    );
}

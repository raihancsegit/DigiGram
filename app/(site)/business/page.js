import StaticDocPage from '@/components/templates/StaticDocPage';

export const metadata = {
    title: 'আয় মডেল | DigiGram',
    description: 'Trust-First ও ফ্রিমিয়াম রাজস্ব ধারা।',
};

export default function BusinessPage() {
    return (
        <StaticDocPage title="আয় ও বিজনেস মডেল" kicker="Trust-First · ফ্রিমিয়াম">
            <p>জনসেবা মডিউল ১০০% ফ্রি রেখে প্রিমিয়াম ও সেবা ফি দিয়ে টেকসই আয়।</p>
            <ul className="list-disc pl-5 space-y-2">
                <li>স্কুল সাবস্ক্রিপশন: মাসিক ৫০০–২০০০ টাকা/প্রতিষ্ঠান</li>
                <li>এসএমএস বান্ডেল (হাজিরা) লভ্যাংশ</li>
                <li>ই-ইউপি অনলাইন প্রসেসিং: ৫–১০ টাকা সার্ভিস চার্জ</li>
                <li>মার্কেটপ্লেস কমিশন: ২–৫%</li>
                <li>স্মার্ট সমিতি প্রসেসিং ফি</li>
            </ul>
        </StaticDocPage>
    );
}

import StaticDocPage from '@/components/templates/StaticDocPage';

export const metadata = {
    title: 'এরিয়া ফিল্টার | DigiGram',
    description: '৬-স্তর লোকেশন: বিভাগ থেকে গ্রাম পর্যন্ত।',
};

export default function AreaPage() {
    return (
        <StaticDocPage title="স্মার্ট এরিয়া ফিল্টার" kicker="ডাইনামিক পোর্টাল">
            <p>
                <strong>৬ স্তর:</strong> বিভাগ → জেলা → উপজেলা → ইউনিয়ন → ওয়ার্ড → গ্রাম। ইউজার সিলেক্ট করলে হোমপেজ সেই ইউনিয়ন/গ্রামের
                পোর্টালে রূপান্তরিত হবে; <strong>সেশনে সেভ</strong> (পরবর্তীতে সার্ভার সিঙ্ক)।
            </p>
            <p>
                এখনই খুলতে: হেডারের বাম দিকের <strong>«আপনার পোর্টাল / এলাকা সিলেক্ট»</strong> কার্ডে ট্যাপ করুন—লোকেশন মোডাল খুলবে।
            </p>
            <ol className="list-decimal pl-5 space-y-2">
                <li>রিডাক্স/লোকাল স্টোরেজে `selected` এরিয়া</li>
                <li>নিউজ টিকার ও সেবা কনটেন্ট ফিল্টার (পরবর্তীতে API)</li>
                <li>ভুল সিলেকশন রিসেট ও ডিফল্ট ইউনিয়ন</li>
            </ol>
        </StaticDocPage>
    );
}

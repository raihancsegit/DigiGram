import StaticDocPage from '@/components/templates/StaticDocPage';
import LearningProgressPanel from '@/components/campus/LearningProgressPanel';

export const metadata = {
    title: 'লার্নিং প্রোগ্রেস | DigiGram',
    description: 'লেভেল, পয়েন্ট ও মাইলস্টোন (ডেমো)।',
};

export default function CampusProgressPage() {
    return (
        <StaticDocPage
            title="লার্নার জার্নি (ডেমো)"
            kicker="কুইজ · ক্যাম্পাস"
            backHref="/campus"
            backLabel="ক্যাম্পাস হাবে ফিরুন"
            plain
        >
            <p>
                ইউজার যেন <strong>লেভেল, পয়েন্ট, পরের মাইলস্টোন</strong> ও <strong>লেভেল অনুযায়ী সুবিধা</strong> স্পষ্ট দেখতে পায়—স্ট্যাটিক
                ডেমো। পরে API/রুল ইঞ্জিন দিয়ে চালানো হবে।
            </p>
            <LearningProgressPanel />
        </StaticDocPage>
    );
}

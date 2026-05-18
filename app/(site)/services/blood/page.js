import BloodBankClient from '@/components/sections/blood/BloodBankClient';

export const metadata = {
    title: 'ব্লাড ব্যাংক - ডিজিগ্রাম ডিজিটাল সেবা',
    description: 'আপনার ইউনিয়নের এবং গ্রামের ভেরিফাইড রক্তদাতাদের তালিকা। বিপদের সময় দ্রুত রক্তদাতা খুঁজে পেতে ডিজিগ্রাম ব্লাড ব্যাংক ব্যবহার করুন।',
};

export default function BloodBankPage() {
    return <BloodBankClient />;
}

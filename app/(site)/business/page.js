import LocalBusinessDirectory from '@/components/sections/business/LocalBusinessDirectory';

export const metadata = {
    title: 'স্থানীয় ব্যবসা ও সেবা | DigiGram',
    description: 'ইউনিয়ন ও গ্রামভিত্তিক যাচাইকৃত ডাক্তার, দোকান, মিস্ত্রি, পরিবহন এবং স্থানীয় সেবা খুঁজুন।'
};

export default function BusinessPage() {
    return <LocalBusinessDirectory />;
}

import StaticDocPage from '@/components/templates/StaticDocPage';

export const metadata = {
    title: 'রোল ও অ্যাডমিন | DigiGram',
    description: 'সুপার অ্যাডমিন, ইউনিয়ন অ্যাডমিন, গ্রাম ভলান্টিয়ার।',
};

export default function AdminDocPage() {
    return (
        <StaticDocPage title="রোল ভিত্তিক অ্যাক্সেস" kicker="অ্যাডমিন প্যানেল · ডক">
            <section className="space-y-4">
                <div className="dg-card-surface rounded-2xl p-5">
                    <h2 className="font-extrabold text-[color:var(--dg-ink)] mb-2">সুপার অ্যাডমিন</h2>
                    <p>পুরো সিস্টেম, এআই মনিটরিং, গ্লোবাল কনফিগ।</p>
                </div>
                <div className="dg-card-surface rounded-2xl p-5">
                    <h2 className="font-extrabold text-[color:var(--dg-ink)] mb-2">ইউনিয়ন অ্যাডমিন</h2>
                    <p>চেয়ারম্যান/সচিব/অপারেটর—ই-ইউপি সেবা, নোটিশ, আবেদন ট্র্যাকিং। অপারেটর ইনকাম মডেল অক্ষুণ্ণ।</p>
                </div>
                <div className="dg-card-surface rounded-2xl p-5">
                    <h2 className="font-extrabold text-[color:var(--dg-ink)] mb-2">গ্রাম ভলান্টিয়ার (প্রতি গ্রামে ২ জন)</h2>
                    <p>ব্লাড ডোনার তালিকা, লোকাল নিউজ, হারানো-প্রাপ্তি, জরুরি তথ্য আপডেট।</p>
                </div>
            </section>
            <p className="text-sm text-[color:var(--dg-muted)] mt-6">UI রুট `/admin/dashboard` পরবর্তীতে যুক্ত হবে।</p>
        </StaticDocPage>
    );
}

import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export const metadata = {
    title: 'অফলাইন',
    robots: { index: false, follow: false },
};

export default function OfflinePage() {
    return (
        <main className="flex min-h-[70dvh] items-center justify-center bg-slate-50 px-4 py-16">
            <div className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-600"><WifiOff size={30} /></span>
                <h1 className="mt-5 text-3xl font-black text-slate-950">ইন্টারনেট সংযোগ নেই</h1>
                <p className="mt-3 text-sm font-bold leading-7 text-slate-500">সংযোগ ফিরে এলে আবার চেষ্টা করুন। সংরক্ষিত household draft অনলাইনে এলে স্বয়ংক্রিয়ভাবে sync হবে।</p>
                <Link href="/" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-teal-600 px-7 font-black text-white">
                    আবার চেষ্টা করুন
                </Link>
            </div>
        </main>
    );
}

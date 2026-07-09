'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AppError({ error, unstable_retry }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className="flex min-h-[70dvh] items-center justify-center bg-slate-50 px-4 py-16">
            <div className="w-full max-w-xl rounded-[32px] border border-rose-100 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-600">সাময়িক সমস্যা</p>
                <h1 className="mt-3 text-3xl font-black text-slate-950">পেজটি এখন দেখানো যাচ্ছে না</h1>
                <p className="mt-3 text-sm font-bold leading-7 text-slate-500">আবার চেষ্টা করুন। সমস্যা থাকলে হোম পেজে ফিরে অন্য সেবা ব্যবহার করুন।</p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    <button type="button" onClick={() => unstable_retry()} className="min-h-12 rounded-2xl bg-teal-600 px-6 font-black text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600">
                        আবার চেষ্টা করুন
                    </button>
                    <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-6 font-black text-slate-700">
                        হোম পেজ
                    </Link>
                </div>
            </div>
        </main>
    );
}

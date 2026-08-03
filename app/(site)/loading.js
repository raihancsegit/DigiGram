import { Loader2, ShieldCheck } from 'lucide-react';

export default function SiteLoading() {
    return (
        <div
            className="fixed inset-0 z-[1000] flex min-h-[100dvh] items-center justify-center bg-slate-50 px-6"
            role="status"
            aria-live="polite"
            aria-label="Page loading"
        >
            <div className="flex flex-col items-center text-center">
                <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin text-teal-600" />
                    <ShieldCheck className="absolute inset-0 m-auto h-7 w-7 text-slate-900" />
                </div>
                <h1 className="mt-6 text-lg font-black text-slate-900">লোড হচ্ছে...</h1>
                <p className="mt-2 text-sm font-bold text-slate-500">ডিজিগ্রাম পোর্টাল প্রস্তুত হচ্ছে</p>
            </div>
        </div>
    );
}

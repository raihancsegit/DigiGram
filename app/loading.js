import { ShieldCheck } from 'lucide-react';

export default function Loading() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
            <div className="relative">
                <div className="h-20 w-20 animate-spin rounded-full border-4 border-slate-100 border-t-teal-500 shadow-xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck className="animate-pulse text-teal-600" size={32} />
                </div>
            </div>

            <div className="mt-8 text-center">
                <h2 className="text-lg font-black tracking-tight text-slate-800">লোড হচ্ছে...</h2>
                <div className="mt-2 flex items-center justify-center gap-1">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-500" style={{ animationDelay: '0ms' }} />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-500" style={{ animationDelay: '150ms' }} />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-500" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}

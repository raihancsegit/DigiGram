import { ShieldCheck } from 'lucide-react';

export default function Loading() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-teal-500 animate-spin shadow-xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck className="text-teal-600 animate-pulse" size={32} />
                </div>
            </div>
            
            <div className="mt-8 text-center">
                <h2 className="text-lg font-black text-slate-800 tracking-tight">লোড হচ্ছে...</h2>
                <div className="flex items-center justify-center gap-1 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}

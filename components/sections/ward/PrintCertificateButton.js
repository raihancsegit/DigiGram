'use client';

import { Printer } from 'lucide-react';

export default function PrintCertificateButton() {
    return (
        <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white print:hidden"
        >
            <Printer size={16} />
            প্রিন্ট করুন
        </button>
    );
}

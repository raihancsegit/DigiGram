import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/** সাধারণ ডক-স্টাইল স্ট্যাটিক পেজ। `plain` হলে `prose` ছাড়া—কাস্টম ব্লক/কম্পোনেন্টের জন্য। */
export default function StaticDocPage({ title, kicker, children, backHref = '/', backLabel = 'হোমে ফিরুন', plain = false }) {
    const bodyClass = plain
        ? 'text-[color:var(--dg-ink-muted)] font-medium space-y-4 leading-relaxed'
        : 'prose prose-slate max-w-none text-[color:var(--dg-ink-muted)] font-medium space-y-4 leading-relaxed';

    return (
        <div className="dg-section-x px-2 md:px-6 py-8 md:py-10 pb-32">
            <div className="max-w-3xl mx-auto">
                <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-bold text-[color:var(--dg-teal)] hover:underline mb-6">
                    <ArrowLeft size={16} />
                    {backLabel}
                </Link>
                {kicker && (
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--dg-muted)] mb-2">{kicker}</p>
                )}
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[color:var(--dg-ink)] tracking-tight mb-6">{title}</h1>
                <div className={bodyClass}>{children}</div>
            </div>
        </div>
    );
}

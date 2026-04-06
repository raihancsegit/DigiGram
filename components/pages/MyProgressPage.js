import Link from 'next/link';
import { ArrowLeft, Trophy, Target, Gift, Bell } from 'lucide-react';
import { routes } from '@/lib/constants/routes';

/**
 * লেভেল/পয়েন্ট/মাইলস্টোন — স্ট্যাটিক গাইডেড UI (পরে রুল ইঞ্জিন ও LMS ফ্লো)।
 */
export default function MyProgressPage() {
    const currentPoints = 120;
    const nextLevelAt = 300;
    const pct = Math.min(100, Math.round((currentPoints / nextLevelAt) * 100));

    const levels = [
        { n: 1, name: 'নতুন সদস্য', perk: 'বেসিক সেবা ও নিউজ অ্যাক্সেস', unlocked: true },
        { n: 2, name: 'গ্রাম সহায়ক', perk: 'কুইজে অংশ + লোকাল লিডারবোর্ড', unlocked: true },
        { n: 3, name: 'ডিজি চ্যাম্পিয়ন', perk: 'বিশেষ ব্যাজ ও রিওয়ার্ড আনলক', unlocked: false },
        { n: 4, name: 'ইউনিয়ন অ্যাম্বাসেডর', perk: 'ভলান্টিয়ার টুল ও নোটিশ পোস্ট', unlocked: false },
    ];

    const milestones = [
        { title: 'পরের মাইলস্টোন', desc: 'সাপ্তাহিক কুইজে ৩ বার অংশ নিন', done: false },
        { title: 'প্রোফাইল সম্পূর্ণ করুন', desc: 'এলাকা + যোগাযোগ যাচাই', done: true },
        { title: 'প্রথম সেবা শেয়ার', desc: 'জরুরি নম্বর বা ব্লাড পোস্ট', done: false },
    ];

    const automationIdeas = [
        'ইমেইল/পুশ: রিওয়ার্ড আনলক ও প্রোগ্রেস রিমাইন্ডার',
        'আচরণ নাজ (nudge): কুইজ মিস হলে হালকা রিমাইন্ডার',
        'স্টোর ও লার্নিং এক লেজারে পয়েন্ট (পরে ইন্টিগ্রেশন)',
    ];

    return (
        <div className="dg-section-x px-3 sm:px-6 md:px-8 pt-4 pb-32 max-w-3xl mx-auto w-full">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-bold text-[color:var(--dg-muted)] hover:text-[color:var(--dg-teal)] transition-colors mb-6"
            >
                <ArrowLeft size={18} />
                হোমে ফিরুন
            </Link>

            <header className="rounded-[24px] border border-[color:var(--dg-border)] bg-[color-mix(in_srgb,var(--dg-surface)_90%,transparent)] backdrop-blur-md p-6 sm:p-8 shadow-[var(--dg-shadow-soft)] mb-6">
                <div className="flex items-start gap-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--dg-teal)] to-sky-600 text-white shadow-lg">
                        <Trophy size={28} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--dg-muted)]">আমার অগ্রগতি</p>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[color:var(--dg-ink)] mt-1">লেভেল ২ — গ্রাম সহায়ক</h1>
                        <p className="text-sm font-medium text-[color:var(--dg-ink-muted)] mt-2">
                            পয়েন্ট, মাইলস্টোন ও লেভেল সুবিধা এক নজরে (ডেমো ডাটা)।
                        </p>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex justify-between text-xs font-bold text-[color:var(--dg-muted)] mb-2">
                        <span>পয়েন্ট {currentPoints}</span>
                        <span>পরের লেভেল {nextLevelAt}</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[color:var(--dg-teal)] to-sky-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <p className="text-xs font-semibold text-[color:var(--dg-teal)] mt-2">{pct}% সম্পন্ন — আর কিছুটা বাকি!</p>
                </div>
            </header>

            <section className="rounded-2xl border border-[color:var(--dg-border)] bg-white/85 p-5 sm:p-6 shadow-[var(--dg-shadow-soft)] mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Target size={18} className="text-[color:var(--dg-teal)]" />
                    <h2 className="text-lg font-extrabold text-[color:var(--dg-ink)]">মাইলস্টোন</h2>
                </div>
                <ul className="space-y-3 list-none p-0 m-0">
                    {milestones.map((m) => (
                        <li
                            key={m.title}
                            className="flex gap-3 rounded-xl border border-[color:var(--dg-border)] bg-slate-50/80 px-4 py-3"
                        >
                            <span
                                className={`mt-0.5 h-2.5 w-2.5 rounded-full shrink-0 ${m.done ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            />
                            <div>
                                <p className="font-bold text-[color:var(--dg-ink)]">{m.title}</p>
                                <p className="text-sm text-[color:var(--dg-muted)]">{m.desc}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="rounded-2xl border border-[color:var(--dg-border)] bg-white/85 p-5 sm:p-6 shadow-[var(--dg-shadow-soft)] mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Gift size={18} className="text-[color:var(--dg-teal)]" />
                    <h2 className="text-lg font-extrabold text-[color:var(--dg-ink)]">লেভেল সুবিধা (আগে থেকেই জানা যাবে)</h2>
                </div>
                <div className="space-y-3">
                    {levels.map((lv) => (
                        <div
                            key={lv.n}
                            className={`rounded-xl border px-4 py-3 ${
                                lv.unlocked
                                    ? 'border-emerald-200 bg-emerald-50/50'
                                    : 'border-[color:var(--dg-border)] bg-slate-50/60 opacity-80'
                            }`}
                        >
                            <p className="text-xs font-extrabold uppercase tracking-wider text-[color:var(--dg-muted)]">
                                লেভেল {lv.n}
                            </p>
                            <p className="font-extrabold text-[color:var(--dg-ink)]">{lv.name}</p>
                            <p className="text-sm text-[color:var(--dg-ink-muted)] mt-1">{lv.perk}</p>
                            {lv.unlocked ? (
                                <p className="text-xs font-bold text-emerald-700 mt-2">✓ আনলক করা হয়েছে</p>
                            ) : (
                                <p className="text-xs font-bold text-slate-500 mt-2">লক — পয়েন্ট অর্জন করুন</p>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section className="rounded-2xl border border-dashed border-[color:var(--dg-border)] bg-white/60 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                    <Bell size={18} className="text-amber-600" />
                    <h2 className="text-lg font-extrabold text-[color:var(--dg-ink)]">অটোমেশন ও জার্নি (পরিকল্পনা)</h2>
                </div>
                <ul className="space-y-2 list-none p-0 m-0 text-sm text-[color:var(--dg-ink-muted)]">
                    {automationIdeas.map((line) => (
                        <li key={line} className="flex gap-2 before:content-[''] before:mt-2 before:h-1.5 before:w-1.5 before:rounded-full before:shrink-0 before:bg-amber-500">
                            <span>{line}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <div className="mt-8 flex flex-wrap gap-2">
                <Link
                    href={routes.quiz}
                    className="inline-flex rounded-full bg-slate-900 text-white px-5 py-2.5 text-sm font-extrabold hover:bg-[color:var(--dg-teal)] transition-colors"
                >
                    কুইজ হাবে যান
                </Link>
                <Link
                    href={routes.learn}
                    className="inline-flex rounded-full border border-[color:var(--dg-border)] bg-white px-5 py-2.5 text-sm font-extrabold hover:border-[color:var(--dg-teal)] transition-colors"
                >
                    লার্নিং হাব
                </Link>
            </div>
        </div>
    );
}

export const myProgressMetadata = {
    title: 'আমার অগ্রগতি | DigiGram',
    description: 'লেভেল, পয়েন্ট ও মাইলস্টোন — গাইডেড অভিজ্ঞতা (স্ট্যাটিক)।',
};

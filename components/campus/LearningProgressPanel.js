'use client';

/**
 * লার্নার/কুইজ ইউজারের জন্য গাইডেড UI স্কেলেটন (স্ট্যাটিক ডেমো)।
 * পরে পয়েন্ট, লেভেল, মাইলস্টোন API/DB দিয়ে পূরণ হবে।
 */
export default function LearningProgressPanel() {
    const level = 3;
    const levelName = 'গ্রাম চ্যাম্পিয়ন';
    const points = 1240;
    const nextAt = 1500;
    const pct = Math.min(100, Math.round((points / nextAt) * 100));

    const milestones = [
        { id: 'm1', label: 'প্রথম কুইজ সম্পন্ন', done: true, reward: '+৫০ পয়েন্ট' },
        { id: 'm2', label: '৭ দিন স্ট্রিক', done: true, reward: 'ব্যাজ' },
        { id: 'm3', label: 'লিডারবোর্ড টপ ১০', done: false, reward: 'প্রিমিয়াম নোট আনলক' },
        { id: 'm4', label: 'ইউনিয়ন ফাইনাল', done: false, reward: 'পুরস্কার' },
    ];

    const levels = [
        { n: 1, name: 'নবাগত', benefit: 'বেসিক নোট ও কুইজ' },
        { n: 2, name: 'একটিভ লার্নার', benefit: 'সাপ্তাহিক চ্যালেঞ্জ' },
        { n: 3, name: 'গ্রাম চ্যাম্পিয়ন', benefit: 'লিডারবোর্ড বুস্ট' },
        { n: 4, name: 'ইউনিয়ন হিরো', benefit: 'এক্সক্লুসিভ টিপস' },
    ];

    return (
        <div className="dg-card-surface rounded-2xl p-5 sm:p-6 space-y-6">
            <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[color:var(--dg-muted)]">আপনার অগ্রগতি (ডেমো)</p>
                <h3 className="text-xl font-extrabold text-[color:var(--dg-ink)] mt-1">লেভেল ও পয়েন্ট</h3>
                <p className="text-sm text-[color:var(--dg-ink-muted)] mt-1">
                    পরের মাইলস্টোন পর্যন্ত কতটা এগিয়েছেন—এক নজরে দেখুন।
                </p>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold text-[color:var(--dg-muted)]">বর্তমান লেভেল</p>
                    <p className="text-2xl font-black text-[color:var(--dg-teal)]">
                        L{level} · {levelName}
                    </p>
                    <p className="text-sm font-semibold text-[color:var(--dg-ink-muted)] mt-1">পয়েন্ট: {points} / {nextAt}</p>
                </div>
                <div className="w-full sm:w-48 text-right text-xs font-bold text-[color:var(--dg-teal)]">{pct}% পরবর্তী লেভেল</div>
            </div>

            <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-[color:var(--dg-teal)] to-sky-500 transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>

            <div>
                <p className="text-sm font-extrabold text-[color:var(--dg-ink)] mb-3">লেভেল অনুযায়ী সুবিধা (ডক-অ্যালাইনড)</p>
                <ul className="space-y-2">
                    {levels.map((lv) => (
                        <li
                            key={lv.n}
                            className={`flex flex-wrap gap-2 text-sm font-medium rounded-xl px-3 py-2 border ${
                                lv.n === level
                                    ? 'border-[color:var(--dg-teal)] bg-teal-50/60'
                                    : 'border-[color:var(--dg-border)] bg-white/50'
                            }`}
                        >
                            <span className="font-black text-[color:var(--dg-ink)]">L{lv.n}</span>
                            <span className="text-[color:var(--dg-ink-muted)]">{lv.name}</span>
                            <span className="text-[color:var(--dg-muted)] w-full sm:w-auto sm:ml-auto">→ {lv.benefit}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <p className="text-sm font-extrabold text-[color:var(--dg-ink)] mb-3">পরবর্তী মাইলস্টোন</p>
                <ul className="space-y-2">
                    {milestones.map((m) => (
                        <li
                            key={m.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[color:var(--dg-border)] px-3 py-2.5 bg-white/60"
                        >
                            <span className={`font-bold ${m.done ? 'text-emerald-700' : 'text-[color:var(--dg-ink)]'}`}>
                                {m.done ? '✓ ' : '○ '}
                                {m.label}
                            </span>
                            <span className="text-xs font-bold text-[color:var(--dg-muted)]">{m.reward}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <p className="text-xs font-semibold text-[color:var(--dg-muted)]">
                রিমাইন্ডার, আনলক অ্যালার্ট ও ইমেইল—পরবর্তীতে অটোমেশন রুল ইঞ্জিন + FCM দিয়ে যুক্ত হবে।
            </p>
        </div>
    );
}

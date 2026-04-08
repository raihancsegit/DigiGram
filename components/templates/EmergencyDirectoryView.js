'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Phone, MapPin, Clock, ShieldAlert, Stethoscope, Flame, Car, Building2 } from 'lucide-react';
import {
    emergencyDirectoryContext,
    emergencyCategories,
    emergencyHowTo,
} from '@/lib/content/emergencyDirectory';

const iconMap = {
    national: ShieldAlert,
    hospital: Stethoscope,
    ambulance: Car,
    fire: Flame,
    police: Building2,
    vet: Stethoscope,
    utilities: MapPin,
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const EN_DIGITS = '0123456789';

function bnDigitsToEn(str) {
    return String(str)
        .split('')
        .map((ch) => {
            const i = BN_DIGITS.indexOf(ch);
            return i >= 0 ? EN_DIGITS[i] : ch;
        })
        .join('');
}

function toTelHref(raw) {
    const normalized = bnDigitsToEn(raw);
    const digits = normalized.replace(/[^\d+]/g, '');
    if (!digits.length) return undefined;
    if (digits.startsWith('+')) return `tel:${digits}`;
    return `tel:${digits}`;
}

function PhoneBlock({ phones }) {
    return (
        <div className="flex flex-col gap-2 mt-3">
            {phones.map((p) => {
                const href = toTelHref(p.number);
                const Wrapper = href ? 'a' : 'span';
                return (
                <Wrapper
                    key={`${p.label}-${p.number}`}
                    {...(href ? { href } : {})}
                    className={`inline-flex items-center gap-2 rounded-xl bg-teal-50/90 border border-teal-200/70 px-3 py-2.5 text-[color:var(--dg-ink)] font-extrabold transition-colors w-fit max-w-full ${
                        href ? 'hover:bg-teal-100/90 cursor-pointer' : 'cursor-default'
                    }`}
                >
                    <Phone size={18} className="text-[color:var(--dg-teal)] shrink-0" />
                    <span className="min-w-0">
                        {p.label && <span className="text-xs font-bold text-[color:var(--dg-muted)] mr-2">{p.label}:</span>}
                        <span className="tabular-nums">{p.number}</span>
                    </span>
                </Wrapper>
            );
            })}
        </div>
    );
}

export default function EmergencyDirectoryView({ slug }) {
    return (
        <Suspense fallback={<div className="py-20 text-center font-bold text-[color:var(--dg-muted)]">Loading Emergency Directory...</div>}>
            <EmergencyDirectoryContent slug={slug} />
        </Suspense>
    );
}

function EmergencyDirectoryContent({ slug }) {
    const searchParams = useSearchParams();
    const unionQuery = searchParams.get('u');
    const isUnionLocked = !!unionQuery;
    
    const ctx = emergencyDirectoryContext;

    // Use dynamic title based on context
    const displayUnionName = isUnionLocked ? `${unionQuery} ইউনিয়ন (ফিল্টারকৃত)` : 'সকল ইউনিয়ন (গ্লোবাল)';

    return (
        <div className="dg-section-x px-2 md:px-6 py-8 md:py-10 pb-36">
            <div className="max-w-5xl mx-auto">
                <Link
                    href="/#services"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[color:var(--dg-teal)] hover:underline mb-6"
                >
                    <ArrowLeft size={16} />
                    সার্ভিস ডিরেক্টরিতে ফিরুন
                </Link>

                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--dg-muted)]">
                        জনসেবা · জরুরি ডিরেক্টরি
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        ফ্রি তথ্য
                    </span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-[2.5rem] font-extrabold text-[color:var(--dg-ink)] tracking-tight leading-tight mb-4 capitalize">
                    জরুরি সেবা ও নম্বর — {displayUnionName}
                </h1>
                <p className="text-sm font-bold text-[color:var(--dg-teal)] mb-2">
                    {ctx.district} · {ctx.upazila}
                </p>
                <p className="text-base sm:text-lg text-[color:var(--dg-ink-muted)] leading-relaxed mb-8">{ctx.coverage}</p>

                {/* কীভাবে ব্যবহার করবেন */}
                <section className="dg-card-surface rounded-2xl p-5 sm:p-6 mb-10 border-teal-200/50">
                    <h2 className="text-lg font-extrabold text-[color:var(--dg-ink)] mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-[color:var(--dg-teal)]" />
                        জরুরি মুহূর্তে কী করবেন?
                    </h2>
                    <ol className="space-y-4">
                        {emergencyHowTo.map((step, i) => (
                            <li key={step.title} className="flex gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-black">
                                    {i + 1}
                                </span>
                                <div>
                                    <p className="font-extrabold text-[color:var(--dg-ink)]">{step.title}</p>
                                    <p className="text-sm text-[color:var(--dg-ink-muted)] mt-1 leading-relaxed">{step.text}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* দ্রুত নেভ: ক্যাটাগরি */}
                <nav
                    aria-label="বিভাগে যান"
                    className="flex flex-wrap gap-2 mb-10 p-4 rounded-2xl bg-white/70 border border-[color:var(--dg-border)] backdrop-blur-sm"
                >
                    <span className="w-full text-[10px] font-extrabold uppercase tracking-wider text-[color:var(--dg-muted)] mb-1">
                        দ্রুত যান
                    </span>
                    {emergencyCategories.map((cat) => (
                        <a
                            key={cat.id}
                            href={`#em-${cat.id}`}
                            className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 hover:bg-[color:var(--dg-teal)] hover:text-white transition-colors"
                        >
                            {cat.title}
                        </a>
                    ))}
                </nav>

                {/* ক্যাটাগরি ব্লক */}
                <div className="space-y-12">
                    {emergencyCategories.map((cat) => {
                        const Icon = iconMap[cat.id] || Phone;
                        return (
                            <section key={cat.id} id={`em-${cat.id}`} className="scroll-mt-28">
                                <div className="flex items-start gap-3 mb-4">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--dg-teal)] to-sky-600 text-white shadow-lg">
                                        <Icon size={22} />
                                    </span>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-extrabold text-[color:var(--dg-ink)]">{cat.title}</h2>
                                        {cat.subtitle && (
                                            <p className="text-sm font-semibold text-[color:var(--dg-muted)] mt-0.5">{cat.subtitle}</p>
                                        )}
                                        {cat.hint && (
                                            <p className="text-sm text-[color:var(--dg-ink-muted)] mt-2 leading-relaxed border-l-4 border-teal-400/60 pl-3">
                                                {cat.hint}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    {cat.items.map((item) => (
                                        <article
                                            key={item.name}
                                            className="dg-card-surface rounded-2xl p-5 h-full flex flex-col hover:border-[color:color-mix(in_srgb,var(--dg-teal)_25%,var(--dg-border))]"
                                        >
                                            <h3 className="text-base font-extrabold text-[color:var(--dg-ink)] leading-snug">{item.name}</h3>
                                            {item.subtitle && (
                                                <p className="text-xs font-bold text-[color:var(--dg-muted)] mt-1">{item.subtitle}</p>
                                            )}
                                            <PhoneBlock phones={item.phones} />
                                            {item.address && (
                                                <p className="mt-3 text-sm text-[color:var(--dg-ink-muted)] flex gap-2 items-start">
                                                    <MapPin size={16} className="text-[color:var(--dg-teal)] shrink-0 mt-0.5" />
                                                    <span>{item.address}</span>
                                                </p>
                                            )}
                                            {item.note && (
                                                <p className="mt-3 text-sm text-[color:var(--dg-ink-muted)] leading-relaxed border-t border-[color:var(--dg-border)] pt-3">
                                                    {item.note}
                                                </p>
                                            )}
                                            {item.badges && item.badges.length > 0 && (
                                                <div className="mt-auto pt-4 flex flex-wrap gap-1.5">
                                                    {item.badges.map((b) => (
                                                        <span
                                                            key={b}
                                                            className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                                                        >
                                                            {b}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                <footer className="mt-14 dg-card-surface rounded-2xl p-5 sm:p-6 bg-amber-50/50 border-amber-200/60">
                    <p className="text-sm font-bold text-amber-900 mb-2">গুরুত্বপূর্ণ</p>
                    <p className="text-sm text-[color:var(--dg-ink-muted)] leading-relaxed mb-3">{ctx.disclaimer}</p>
                    <p className="text-xs font-semibold text-[color:var(--dg-muted)]">{ctx.lastUpdatedLabel}</p>
                </footer>

                <p className="mt-8 text-xs font-semibold text-[color:var(--dg-muted)] border-t border-[color:var(--dg-border)] pt-6">
                    স্লাগ: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{slug}</code> — পরে ইউনিয়ন/উপজেলা অনুযায়ী ডাটাবেস থেকে লোড।
                </p>
            </div>
        </div>
    );
}

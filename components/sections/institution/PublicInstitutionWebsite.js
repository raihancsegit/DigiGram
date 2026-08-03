import Link from 'next/link';
import { ArrowRight, Bell, BookOpen, Building2, GraduationCap, MapPin, Phone } from 'lucide-react';

const text = (value, fallback = '') => typeof value === 'string' && value.trim() ? value.trim() : fallback;
const list = (value) => Array.isArray(value) ? value.filter(Boolean) : [];

export default function PublicInstitutionWebsite({ institution = {}, page = {}, notices = [] }) {
    const isMosque = institution.type === 'mosque';
    const name = text(institution.name, 'DigiGram শিক্ষা প্রতিষ্ঠান');
    const village = text(institution.village, 'স্থানীয় গ্রাম');
    const primary = text(institution.theme?.primary_color, isMosque ? '#047857' : '#0f766e');
    const features = list(institution.portal_features).slice(0, 6);
    const publicNotices = list(notices).slice(0, 6);
    const portalHref = isMosque ? `/m/${institution.id}/admin` : `/school/${institution.id}/admin`;

    return <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
        <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
                <Link href="/" className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: primary }}><Building2 size={22} /></span>
                    <span><strong className="block text-lg font-black">{name}</strong><small className="font-bold text-slate-500">DigiGram প্রতিষ্ঠান ওয়েবসাইট</small></span>
                </Link>
                <Link href={portalHref} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700">প্রতিষ্ঠান পোর্টাল</Link>
            </div>
        </header>

        <section className="relative overflow-hidden bg-slate-950 text-white">
            <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 80% 20%, ${primary}, transparent 45%)` }} />
            <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.35fr_.65fr] md:items-center md:py-24">
                <div>
                    <p className="text-sm font-black tracking-[.2em] text-teal-300">{isMosque ? 'ধর্মীয় ও সামাজিক সেবা' : 'শিক্ষা, শৃঙ্খলা ও অগ্রগতি'}</p>
                    <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">{text(page.hero_title, name)}</h1>
                    <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-300">{text(page.hero_subtitle, `${village}-এর শিক্ষার্থী, অভিভাবক ও পরিচালনা পরিষদের প্রয়োজনীয় তথ্য এক জায়গায়।`)}</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <a href="#notice" className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-black text-white" style={{ backgroundColor: primary }}>সর্বশেষ নোটিশ <ArrowRight size={18} /></a>
                        <a href="#contact" className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-black">যোগাযোগ</a>
                    </div>
                </div>
                <div className="rounded-[2rem] border border-white/10 bg-white/10 p-7 backdrop-blur">
                    <GraduationCap size={38} className="text-teal-300" />
                    <p className="mt-5 text-sm font-bold text-slate-300">প্রতিষ্ঠানের অবস্থান</p>
                    <p className="mt-1 flex items-center gap-2 text-xl font-black"><MapPin size={20} /> {text(page.address, village)}</p>
                    <p className="mt-5 text-sm leading-7 text-slate-300">{text(page.about_text, `${name} এখন DigiGram-এর মাধ্যমে নিজস্ব তথ্য, নোটিশ ও অনলাইন সেবা প্রকাশ করছে।`)}</p>
                </div>
            </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {(features.length ? features : ['ভর্তি তথ্য', 'শিক্ষক ও ক্লাস', 'ফলাফল', 'নোটিশ', 'অভিভাবক যোগাযোগ', 'অনলাইন সেবা']).map((feature) =>
                    <div key={String(feature)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><BookOpen className="text-teal-600" /><p className="mt-4 font-black capitalize">{String(feature).replaceAll('_', ' ')}</p><p className="mt-2 text-sm leading-6 text-slate-500">প্রয়োজনীয় তথ্য ও আপডেট প্রতিষ্ঠান থেকে প্রকাশ করা হবে।</p></div>
                )}
            </div>
        </section>

        <section id="notice" className="border-y border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-5 py-14">
                <h2 className="flex items-center gap-3 text-2xl font-black"><Bell className="text-rose-500" /> নোটিশ বোর্ড</h2>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                    {(publicNotices.length ? publicNotices : [{ id: 'empty', title: 'এখনো কোনো নোটিশ প্রকাশ করা হয়নি', body: 'নতুন নোটিশ প্রকাশ হলে এখানে দেখা যাবে।' }]).map((notice, index) =>
                        <article key={notice.id || index} className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="font-black">{text(notice.title, 'প্রতিষ্ঠানের নোটিশ')}</p><p className="mt-2 text-sm leading-6 text-slate-600">{text(notice.body, 'বিস্তারিত জানতে প্রতিষ্ঠান অফিসে যোগাযোগ করুন।')}</p></article>
                    )}
                </div>
            </div>
        </section>

        <footer id="contact" className="bg-slate-950 text-white">
            <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 md:grid-cols-2 md:items-center">
                <div><p className="text-xl font-black">{name}</p><p className="mt-2 text-sm text-slate-400">{text(page.address, village)}</p></div>
                <div className="md:text-right"><p className="inline-flex items-center gap-2 font-bold"><Phone size={17} /> {text(page.contact_phone, 'যোগাযোগ নম্বর যোগ করা হয়নি')}</p><p className="mt-2 text-sm text-slate-400">{text(page.contact_email, '')}</p></div>
            </div>
        </footer>
    </main>;
}

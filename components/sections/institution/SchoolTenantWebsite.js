'use client';

import { useEffect, useState } from 'react';
import {
    BookOpen,
    CalendarDays,
    CheckCircle2,
    GraduationCap,
    LibraryBig,
    Mail,
    MapPin,
    Megaphone,
    Phone,
    School,
    Users
} from 'lucide-react';
import {
    getInstitutionDesignProfile,
    getSchoolWebsiteTemplate
} from '@/lib/constants/institutionDesignProfiles';

const DEFAULT_MENU = ['home', 'about', 'classes', 'teachers', 'facilities', 'admission', 'notices', 'contact'];
const SCHOOL_MENU_OPTIONS = [
    { value: 'home', label: 'হোম' },
    { value: 'about', label: 'আমাদের সম্পর্কে' },
    { value: 'classes', label: 'শ্রেণি' },
    { value: 'teachers', label: 'শিক্ষকমণ্ডলী' },
    { value: 'facilities', label: 'সুযোগ-সুবিধা' },
    { value: 'admission', label: 'ভর্তি' },
    { value: 'notices', label: 'নোটিশ বোর্ড' },
    { value: 'contact', label: 'যোগাযোগ' }
];

const fallbackStats = [
    { value: '২৫+', label: 'বছরের অভিজ্ঞতা' },
    { value: '১২০০+', label: 'শিক্ষার্থী' },
    { value: '৯৫%', label: 'পাসের হার' },
    { value: '৪০+', label: 'শিক্ষক' }
];

const classIcons = ['🌱', '📚', '📐', '🎯', '🎓', '💻'];

function cssFont(fontFamily) {
    if (fontFamily === 'noto_sans_bengali') return '"Noto Sans Bengali", sans-serif';
    if (fontFamily === 'system') return 'system-ui, sans-serif';
    return '"Hind Siliguri", sans-serif';
}

function safeArray(value, fallback = []) {
    return Array.isArray(value) && value.length ? value : fallback;
}

export default function SchoolTenantWebsite({ institution, page, notices }) {
    const design = getInstitutionDesignProfile(institution.category);
    const theme = {
        primary_color: institution.theme?.primary_color || design.primaryColor,
        font_family: institution.theme?.font_family || design.fontFamily,
        menu_items: institution.theme?.menu_items || DEFAULT_MENU,
        template: institution.theme?.template || 'classic'
    };
    const template = getSchoolWebsiteTemplate(theme.template);
    const menuItems = SCHOOL_MENU_OPTIONS.filter((item) => theme.menu_items.includes(item.value));
    const ticker = safeArray(page?.notice_ticker, ['নতুন শিক্ষাবর্ষে ভর্তি চলছে', 'নোটিশ বোর্ডে সর্বশেষ আপডেট দেখুন']);
    const stats = safeArray(page?.stats, fallbackStats);
    const highlights = safeArray(page?.about_highlights, []);
    const classSections = safeArray(page?.class_sections, []);
    const teachers = safeArray(page?.public_teachers, []);
    const facilities = safeArray(page?.facilities, []);
    const admissionFeatures = safeArray(page?.admission_features, []);
    const footerLinks = page?.footer_links || {};
    const [activePage, setActivePage] = useState('home');

    useEffect(() => {
        const url = new URL(window.location.href);
        const requestedPage = url.searchParams.get('page');
        if (requestedPage && menuItems.some((item) => item.value === requestedPage)) {
            setActivePage(requestedPage);
        }
    }, [menuItems]);

    useEffect(() => {
        const syncPageFromUrl = () => {
            const url = new URL(window.location.href);
            const requestedPage = url.searchParams.get('page');
            setActivePage(requestedPage && menuItems.some((item) => item.value === requestedPage) ? requestedPage : 'home');
        };
        window.addEventListener('popstate', syncPageFromUrl);
        return () => window.removeEventListener('popstate', syncPageFromUrl);
    }, [menuItems]);

    function navigatePage(nextPage) {
        setActivePage(nextPage);
        const url = new URL(window.location.href);
        if (nextPage === 'home') {
            url.searchParams.delete('page');
        } else {
            url.searchParams.set('page', nextPage);
        }
        window.history.pushState({}, '', `${url.pathname}${url.search}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return (
        <div
            className={`min-h-screen text-slate-900 ${template.shellClass}`}
            style={{
                '--school-primary': theme.primary_color,
                fontFamily: cssFont(theme.font_family)
            }}
        >
            <header className={`sticky top-0 z-40 shadow-sm ${template.headerClass}`}>
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4">
                    <div className="flex items-center gap-3">
                        {page?.logo_url ? (
                            <img src={page.logo_url} alt="" className="h-11 w-11 rounded-full object-cover" />
                        ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-400 font-black text-white">
                                {institution.name?.slice(0, 1)}
                            </div>
                        )}
                        <div>
                            <h1 className="text-lg font-black">{institution.name}</h1>
                            <p className={`text-xs font-bold ${template.value === 'classic' ? 'text-white/70' : 'text-slate-500'}`}>{institution.village || design.eyebrow}</p>
                        </div>
                    </div>
                    <nav className="hidden items-center gap-5 lg:flex">
                        {menuItems.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => navigatePage(item.value)}
                                className={`text-sm font-bold transition ${
                                    template.value === 'classic'
                                        ? `hover:text-amber-200 ${activePage === item.value ? 'text-amber-200' : 'text-white/85'}`
                                        : `hover:text-[var(--school-primary)] ${activePage === item.value ? 'text-[var(--school-primary)]' : 'text-slate-600'}`
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            <div className={`border-b ${template.noticeClass}`}>
                <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-hidden px-4 py-3">
                    <span className="shrink-0 rounded bg-rose-600 px-3 py-1 text-xs font-black text-white">বিজ্ঞপ্তি</span>
                    <div className="flex min-w-0 gap-6 overflow-x-auto text-sm font-bold">
                        {ticker.map((item, index) => <span key={`${item}-${index}`} className="shrink-0">{item}</span>)}
                    </div>
                </div>
            </div>

            {activePage === 'home' && (
            <>
            <section
                className={template.heroClass}
                style={page?.banner_image_url ? {
                    backgroundImage: `linear-gradient(90deg, rgba(15,74,39,.95), rgba(27,110,60,.75)), url(${page.banner_image_url})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover'
                } : undefined}
            >
                <div className={`mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:items-center ${template.heroGridClass}`}>
                    <div>
                        <p className={`mb-4 inline-flex px-4 py-2 text-sm font-bold ${
                            template.value === 'editorial'
                                ? 'border-l-4 border-slate-900 pl-3 text-slate-700'
                                : 'rounded-full border border-white/20 bg-white/10 text-amber-100'
                        }`}>
                            {institution.village || design.eyebrow} {page?.established_year ? `প্রতিষ্ঠিত ${page.established_year}` : ''}
                        </p>
                        <h2 className={`max-w-3xl text-4xl font-black leading-tight ${template.heroTitleClass}`}>
                            {page?.hero_title || institution.name}
                        </h2>
                        <p className={`mt-4 max-w-2xl text-base font-medium leading-8 ${template.value === 'editorial' ? 'text-slate-600' : 'text-white/80'}`}>
                            {page?.hero_subtitle || design.heroLine}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <button type="button" onClick={() => navigatePage('admission')} className="rounded-md bg-amber-400 px-5 py-3 font-black text-slate-950">ভর্তি তথ্য</button>
                            <button type="button" onClick={() => navigatePage('about')} className={`rounded-md border px-5 py-3 font-black ${template.value === 'editorial' ? 'border-slate-900 text-slate-900' : 'border-white/40 text-white'}`}>আরও জানুন</button>
                        </div>
                    </div>
                    <div className={`grid gap-4 ${template.value === 'editorial' ? 'sm:grid-cols-1' : 'sm:grid-cols-2'}`}>
                        {stats.map((stat, index) => (
                            <article key={`${stat.label}-${index}`} className={`p-5 backdrop-blur ${template.cardClass} ${template.statClass}`}>
                                <p className={`text-3xl font-black ${template.statValueClass}`}>{stat.value}</p>
                                <p className={`mt-1 text-sm font-bold ${template.value === 'classic' ? 'text-white/75' : 'text-slate-500'}`}>{stat.label}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
            <section className={`py-16 ${template.sectionClass}`}>
                <div className={`mx-auto grid max-w-7xl gap-8 px-4 lg:items-center ${template.previewClass}`}>
                    <div className={`border border-slate-200 bg-white p-6 shadow-sm ${template.cardClass}`}>
                        <School className="mb-5 h-12 w-12 text-[var(--school-primary)]" />
                        <p className="text-sm font-black text-[var(--school-primary)]">আমাদের সম্পর্কে</p>
                        <h3 className={`mt-2 text-2xl font-black ${template.sectionTitleClass}`}>{institution.name}</h3>
                        <p className="mt-4 font-medium leading-8 text-slate-600">
                            {page?.about_text || `${institution.name} শিক্ষার্থী, শিক্ষক ও অভিভাবকদের জন্য একটি সমন্বিত শিক্ষার পরিবেশ তৈরি করছে।`}
                        </p>
                        <button type="button" onClick={() => navigatePage('about')} className="mt-5 font-black text-[var(--school-primary)]">বিস্তারিত দেখুন</button>
                    </div>
                    <div className={`grid gap-4 ${template.value === 'editorial' ? 'sm:grid-cols-1' : 'sm:grid-cols-2'}`}>
                        {classSections.slice(0, 2).map((item, index) => (
                            <article key={`${item.title}-${index}`} className={`border border-slate-200 bg-white p-5 shadow-sm ${template.cardClass}`}>
                                <div className="mb-3 text-3xl">{classIcons[index % classIcons.length]}</div>
                                <h3 className="font-black">{item.title}</h3>
                                <p className="mt-2 text-sm font-medium leading-7 text-slate-500">{item.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="mb-8 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-sm font-black text-[var(--school-primary)]">শিক্ষকমণ্ডলী</p>
                            <h2 className="mt-2 text-3xl font-black">যারা প্রতিদিন পথ দেখান</h2>
                        </div>
                        <button type="button" onClick={() => navigatePage('teachers')} className="font-black text-[var(--school-primary)]">সব দেখুন</button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {teachers.slice(0, 3).map((teacher, index) => (
                            <article key={`${teacher.name}-${index}`} className={`border border-slate-200 bg-white p-5 text-center shadow-sm ${template.cardClass}`}>
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--school-primary)] text-lg font-black text-white">
                                    {teacher.name?.slice(0, 1)}
                                </div>
                                <h3 className="font-black">{teacher.name}</h3>
                                <p className="mt-1 text-sm font-bold text-[var(--school-primary)]">{teacher.subject}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className={`py-16 ${template.sectionClass}`}>
                <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[1fr_0.9fr]">
                    <div>
                        <p className="text-sm font-black text-[var(--school-primary)]">সর্বশেষ আপডেট</p>
                        <h2 className="mt-2 text-3xl font-black">নোটিশ ও ভর্তি তথ্য</h2>
                        <div className="mt-6 grid gap-4">
                            {(notices.length ? notices : [{ id: 'empty', title: 'এখনো কোনো নোটিশ প্রকাশ হয়নি' }]).slice(0, 2).map((notice) => (
                                <article key={notice.id} className={`border border-slate-200 bg-white p-5 shadow-sm ${template.cardClass}`}>
                                    <Megaphone className="mb-3 text-[var(--school-primary)]" />
                                    <h3 className="font-black">{notice.title}</h3>
                                    {notice.body && <p className="mt-2 text-sm font-medium text-slate-500">{notice.body}</p>}
                                </article>
                            ))}
                        </div>
                    </div>
                    <div className={`bg-[var(--school-primary)] p-6 text-white shadow-sm ${template.cardClass}`}>
                        <p className="text-sm font-black text-amber-200">ভর্তি</p>
                        <h3 className="mt-2 text-2xl font-black">নতুন শিক্ষাবর্ষে ভর্তি চলছে</h3>
                        <p className="mt-4 font-medium leading-8 text-white/80">
                            {page?.admission_text || 'ভর্তি সংক্রান্ত প্রয়োজনীয় তথ্য ও যোগাযোগ এখান থেকে পাওয়া যাবে।'}
                        </p>
                        <button type="button" onClick={() => navigatePage('admission')} className="mt-5 rounded-md bg-amber-400 px-4 py-3 font-black text-slate-950">ভর্তি তথ্য</button>
                    </div>
                </div>
            </section>
            </>
            )}

            <main>
                {activePage === 'about' && (
                <section className="bg-[#f5f3ee] py-16">
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[0.8fr_1fr] lg:items-center">
                        <div className="relative">
                            <div className="flex min-h-[340px] items-center justify-center rounded-3xl bg-[var(--school-primary)] p-8 text-center text-white">
                                <div>
                                    <School className="mx-auto mb-6 h-16 w-16 text-amber-300" />
                                    <p className="text-2xl font-black leading-10">{institution.name}</p>
                                    <p className="mt-3 text-sm font-bold text-white/70">{page?.approval_text || 'শিক্ষা ও মূল্যবোধের সমন্বিত পরিবেশ'}</p>
                                </div>
                            </div>
                            <div className="absolute -bottom-5 right-5 rounded-2xl bg-amber-400 px-5 py-4 font-black text-slate-900 shadow-lg">
                                A+ ফলাফল
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-black text-[var(--school-primary)]">আমাদের সম্পর্কে</p>
                            <h2 className="mt-2 text-3xl font-black">শিক্ষা, শৃঙ্খলা ও যত্নের একসাথে পথচলা</h2>
                            <p className="mt-4 font-medium leading-8 text-slate-600">
                                {page?.about_text || `${institution.name} শিক্ষার্থী, শিক্ষক ও অভিভাবকদের জন্য একসাথে শেখা এবং অগ্রগতি দেখার ডিজিটাল পরিবেশ তৈরি করছে।`}
                            </p>
                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                {highlights.map((item, index) => (
                                    <p key={`${item}-${index}`} className="flex items-start gap-2 font-bold text-slate-700">
                                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--school-primary)]" />
                                        {item}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                )}

                {activePage === 'classes' && (
                <section className="py-16">
                    <div className="mx-auto max-w-7xl px-4">
                        <div className="mb-8 text-center">
                            <p className="text-sm font-black text-[var(--school-primary)]">শিক্ষা কার্যক্রম</p>
                            <h2 className="mt-2 text-3xl font-black">শ্রেণি ও বিভাগসমূহ</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {classSections.map((item, index) => (
                                <article key={`${item.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                                    <div className="mb-4 text-4xl">{classIcons[index % classIcons.length]}</div>
                                    <h3 className="text-lg font-black">{item.title}</h3>
                                    <p className="mt-2 text-sm font-medium leading-7 text-slate-500">{item.description}</p>
                                    {item.badge && <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{item.badge}</span>}
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
                )}

                {activePage === 'teachers' && (
                <section className="bg-[#f5f3ee] py-16">
                    <div className="mx-auto max-w-7xl px-4">
                        <div className="mb-8 text-center">
                            <p className="text-sm font-black text-[var(--school-primary)]">আমাদের দল</p>
                            <h2 className="mt-2 text-3xl font-black">শিক্ষকমণ্ডলী</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            {teachers.map((teacher, index) => (
                                <article key={`${teacher.name}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
                                    {teacher.image_url ? (
                                        <img src={teacher.image_url} alt="" className="mx-auto mb-4 h-20 w-20 rounded-full object-cover" />
                                    ) : (
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--school-primary)] text-lg font-black text-white">
                                            {teacher.name?.slice(0, 1)}
                                        </div>
                                    )}
                                    <h3 className="font-black">{teacher.name}</h3>
                                    <p className="mt-1 text-sm font-bold text-[var(--school-primary)]">{teacher.subject}</p>
                                    <p className="mt-2 text-sm font-medium text-slate-500">{teacher.experience}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
                )}

                {activePage === 'facilities' && (
                <section className="py-16">
                    <div className="mx-auto max-w-7xl px-4">
                        <div className="mb-8 text-center">
                            <p className="text-sm font-black text-[var(--school-primary)]">সুযোগ-সুবিধা</p>
                            <h2 className="mt-2 text-3xl font-black">শেখার পরিবেশ</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {facilities.map((item, index) => {
                                const Icon = [GraduationCap, LibraryBig, CalendarDays, Users][index % 4];
                                return (
                                    <article key={`${item.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5">
                                        <Icon className="mb-4 text-[var(--school-primary)]" />
                                        <h3 className="font-black">{item.title}</h3>
                                        <p className="mt-2 text-sm font-medium leading-7 text-slate-500">{item.description}</p>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>
                )}

                {activePage === 'admission' && (
                <section className="bg-[var(--school-primary)] py-16 text-white">
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[1fr_0.85fr] lg:items-center">
                        <div>
                            <p className="text-sm font-black text-amber-200">ভর্তি তথ্য</p>
                            <h2 className="mt-2 text-3xl font-black">নতুন শিক্ষার্থীর যাত্রা শুরু হোক এখান থেকেই</h2>
                            <p className="mt-4 max-w-2xl font-medium leading-8 text-white/80">
                                {page?.admission_text || 'ভর্তি সংক্রান্ত তথ্য, প্রয়োজনীয় কাগজপত্র এবং যোগাযোগের নির্দেশনা এখানে প্রকাশ করা যাবে।'}
                            </p>
                            <div className="mt-6 space-y-3">
                                {admissionFeatures.map((item, index) => (
                                    <p key={`${item}-${index}`} className="flex items-center gap-2 font-bold text-white/85">
                                        <CheckCircle2 className="h-4 w-4 text-amber-300" />
                                        {item}
                                    </p>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-3xl bg-white p-6 text-slate-900 shadow-sm">
                            <h3 className="text-xl font-black">ভর্তি আবেদন ফর্ম</h3>
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <input placeholder="শিক্ষার্থীর নাম" className="rounded-xl border border-slate-200 px-4 py-3" />
                                <input placeholder="অভিভাবকের নাম" className="rounded-xl border border-slate-200 px-4 py-3" />
                                <input placeholder="মোবাইল নম্বর" className="rounded-xl border border-slate-200 px-4 py-3" />
                                <input placeholder="ভর্তির শ্রেণি" className="rounded-xl border border-slate-200 px-4 py-3" />
                            </div>
                            <button className="mt-4 w-full rounded-xl bg-[var(--school-primary)] px-4 py-3 font-black text-white">আবেদন জমা দিন</button>
                            <div className="mt-5 space-y-3 border-t border-slate-200 pt-5 text-sm font-bold text-slate-600">
                                <p className="flex items-center gap-3"><Phone className="h-4 w-4 text-[var(--school-primary)]" /> {page?.contact_phone || 'ফোন নম্বর যোগ করা হয়নি'}</p>
                                <p className="flex items-center gap-3"><Mail className="h-4 w-4 text-[var(--school-primary)]" /> {page?.contact_email || 'ইমেইল যোগ করা হয়নি'}</p>
                                <p className="flex items-center gap-3"><MapPin className="h-4 w-4 text-[var(--school-primary)]" /> {page?.address || institution.village || '-'}</p>
                            </div>
                        </div>
                    </div>
                </section>
                )}

                {activePage === 'notices' && (
                <section className="bg-[#f5f3ee] py-16">
                    <div className="mx-auto max-w-7xl px-4">
                        <div className="mb-8 text-center">
                            <p className="text-sm font-black text-[var(--school-primary)]">সাম্প্রতিক</p>
                            <h2 className="mt-2 text-3xl font-black">নোটিশ বোর্ড</h2>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-3">
                            {notices.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 font-bold text-slate-400">এখনো কোনো নোটিশ প্রকাশ হয়নি।</div>
                            ) : notices.map((notice) => (
                                <article key={notice.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                                    <Megaphone className="mb-4 text-[var(--school-primary)]" />
                                    <h3 className="font-black">{notice.title}</h3>
                                    {notice.body && <p className="mt-2 text-sm font-medium leading-7 text-slate-500">{notice.body}</p>}
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
                )}

                {activePage === 'contact' && (
                    <section className="bg-[#f5f3ee] py-16">
                        <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[0.8fr_1.2fr]">
                            <div>
                                <p className="text-sm font-black text-[var(--school-primary)]">যোগাযোগ</p>
                                <h2 className="mt-2 text-3xl font-black">আমাদের সাথে যোগাযোগ করুন</h2>
                                <p className="mt-4 font-medium leading-8 text-slate-600">
                                    {page?.principal_message || 'ভর্তি, ফলাফল, শিক্ষক ও অফিস সংক্রান্ত যেকোনো তথ্যের জন্য যোগাযোগ করুন।'}
                                </p>
                            </div>
                            <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
                                <p className="flex items-center gap-3 font-bold text-slate-700"><Phone className="text-[var(--school-primary)]" /> {page?.contact_phone || 'ফোন নম্বর যোগ করা হয়নি'}</p>
                                <p className="flex items-center gap-3 font-bold text-slate-700"><Mail className="text-[var(--school-primary)]" /> {page?.contact_email || 'ইমেইল যোগ করা হয়নি'}</p>
                                <p className="flex items-center gap-3 font-bold text-slate-700 sm:col-span-2"><MapPin className="text-[var(--school-primary)]" /> {page?.address || institution.village || '-'}</p>
                                <p className="font-bold text-slate-700 sm:col-span-2">{page?.office_hours || 'অফিস সময় যোগ করা হয়নি'}</p>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <footer className="bg-slate-950 py-12 text-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-4">
                    <div>
                        <h2 className="text-xl font-black">{institution.name}</h2>
                        <p className="mt-3 text-sm font-medium leading-7 text-white/65">{page?.principal_message || 'শিক্ষা, মূল্যবোধ ও অগ্রগতির জন্য নিবেদিত প্রতিষ্ঠান।'}</p>
                    </div>
                    <div>
                        <h3 className="font-black text-amber-300">দ্রুত লিংক</h3>
                        <div className="mt-3 space-y-2 text-sm font-medium text-white/70">
                            {safeArray(footerLinks.quick_links, ['আমাদের সম্পর্কে', 'শ্রেণি', 'নোটিশ']).map((item) => <p key={item}>{item}</p>)}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-black text-amber-300">একাডেমিক</h3>
                        <div className="mt-3 space-y-2 text-sm font-medium text-white/70">
                            {safeArray(footerLinks.academic_links, ['ভর্তি', 'ফলাফল', 'পরীক্ষা']).map((item) => <p key={item}>{item}</p>)}
                        </div>
                    </div>
                    <div className="space-y-3 text-sm font-medium text-white/70">
                        <p>{page?.office_hours || 'অফিস সময় যোগ করা হয়নি'}</p>
                        <p>{page?.approval_text || 'প্রতিষ্ঠানের তথ্য যোগ করা হয়নি'}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

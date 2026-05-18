'use client';

import { useEffect, useState } from 'react';
import {
    Award,
    BookOpenCheck,
    CalendarCheck,
    ChevronRight,
    GraduationCap,
    Loader2,
    Mail,
    MapPin,
    Megaphone,
    Phone,
    Trophy,
    Users
} from 'lucide-react';
import { institutionPortalService } from '@/lib/services/institutionPortalService';
import {
    getInstitutionDesignProfile,
    INSTITUTION_MENU_OPTIONS
} from '@/lib/constants/institutionDesignProfiles';
import SchoolTenantWebsite from '@/components/sections/institution/SchoolTenantWebsite';

const FEATURE_COPY = {
    attendance: { title: 'উপস্থিতি', description: 'দৈনিক উপস্থিতি, অনুপস্থিতি ও guardian follow-up।', icon: CalendarCheck },
    notices: { title: 'নোটিশ', description: 'প্রতিষ্ঠানের ঘোষণা ও জরুরি আপডেট।', icon: Megaphone },
    results: { title: 'ফলাফল', description: 'পরীক্ষার ফলাফল প্রকাশ ও guardian SMS।', icon: Trophy },
    subject_results: { title: 'বিষয়ভিত্তিক ফলাফল', description: 'Subject-wise performance tracking।', icon: Trophy },
    guardian_sms: { title: 'Guardian SMS', description: 'অনুপস্থিতি, ফলাফল ও প্রয়োজনীয় বার্তা।', icon: Mail },
    donations: { title: 'অনুদান', description: 'স্বচ্ছ আয়-ব্যয়ের হিসাব।', icon: Mail },
    jummah_accounts: { title: 'জুমা হিসাব', description: 'সাপ্তাহিক আয়-ব্যয়ের রিপোর্ট।', icon: BookOpenCheck },
    imam_meal_schedule: { title: 'ইমামের খাবার শিডিউল', description: 'গ্রামভিত্তিক রোটেশন পরিকল্পনা।', icon: CalendarCheck },
    announcements: { title: 'ঘোষণা', description: 'গুরুত্বপূর্ণ বার্তা ও আপডেট।', icon: Megaphone }
};

const DEFAULT_MENU = ['home', 'about', 'teachers', 'academics', 'results', 'notices', 'contact'];

function cssFont(fontFamily) {
    if (fontFamily === 'noto_sans_bengali') return '"Noto Sans Bengali", sans-serif';
    if (fontFamily === 'system') return 'system-ui, sans-serif';
    return '"Hind Siliguri", sans-serif';
}

export default function TenantWebsiteClient({
    domain,
    initialInstitution = null,
    initialPage = null,
    initialNotices = []
}) {
    const [institution, setInstitution] = useState(initialInstitution);
    const [page, setPage] = useState(initialPage);
    const [notices, setNotices] = useState(initialNotices);
    const [loading, setLoading] = useState(!initialInstitution);

    useEffect(() => {
        async function load() {
            try {
                let found = initialInstitution;
                if (!found) {
                    const response = await fetch(`/api/institutions/tenant?domain=${encodeURIComponent(domain)}`, {
                        cache: 'no-store'
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error || 'Tenant lookup failed');
                    found = result.data;
                }

                setInstitution(found);
                setLoading(false);

                if (found && !initialPage && initialNotices.length === 0) {
                    const [pageResult, noticeResult] = await Promise.allSettled([
                        institutionPortalService.getPage(found.id),
                        institutionPortalService.getPublicNotices(found.id)
                    ]);
                    if (pageResult.status === 'fulfilled') setPage(pageResult.value);
                    if (noticeResult.status === 'fulfilled') setNotices(noticeResult.value);
                }
            } catch (error) {
                console.error('Tenant website load failed:', error);
                setLoading(false);
            }
        }
        load();
    }, [domain, initialInstitution, initialNotices.length, initialPage]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="animate-spin text-teal-600" />
            </div>
        );
    }

    if (!institution) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="mb-2 text-2xl font-black text-slate-800">প্রতিষ্ঠানটি খুঁজে পাওয়া যায়নি</h2>
                    <p className="font-bold text-slate-500">অনুগ্রহ করে সঠিক URL চেক করুন।</p>
                </div>
            </div>
        );
    }

    if (
        ['school', 'primary_school', 'high_school', 'college', 'alim_madrasa', 'kindergarten'].includes(institution.category)
        || institution.type === 'school'
    ) {
        return <SchoolTenantWebsite institution={institution} page={page} notices={notices} />;
    }

    const design = getInstitutionDesignProfile(institution.category);
    const theme = {
        primary_color: institution.theme?.primary_color || design.primaryColor,
        font_family: institution.theme?.font_family || design.fontFamily,
        menu_items: institution.theme?.menu_items || DEFAULT_MENU
    };
    const menuItems = INSTITUTION_MENU_OPTIONS.filter((item) => theme.menu_items.includes(item.value));
    const features = (institution.portal_features || []).map((feature) => ({
        key: feature,
        ...(FEATURE_COPY[feature] || {
            title: feature.replaceAll('_', ' '),
            description: 'এই module চালু আছে।',
            icon: GraduationCap
        })
    }));

    return (
        <div
            className="min-h-screen bg-slate-50 text-slate-900"
            style={{
                '--tenant-primary': theme.primary_color,
                fontFamily: cssFont(theme.font_family)
            }}
        >
            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4">
                    <div>
                        <h1 className="text-xl font-black">{institution.name}</h1>
                        <p className="text-xs font-black uppercase tracking-widest" style={{ color: theme.primary_color }}>
                            {design.eyebrow}
                        </p>
                    </div>
                    <nav className="hidden items-center gap-5 lg:flex">
                        {menuItems.map((item) => (
                            <a key={item.value} href={`#${item.value}`} className="text-sm font-black text-slate-600 hover:text-slate-950">
                                {item.label}
                            </a>
                        ))}
                    </nav>
                </div>
            </header>

            <section id="home" className={`border-b border-slate-200 bg-gradient-to-br ${design.surface}`}>
                <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                    <div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-black ${design.badge}`}>
                            {design.eyebrow}
                        </span>
                        <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
                            {page?.hero_title || institution.name}
                        </h2>
                        <p className="mt-4 max-w-2xl text-base font-bold leading-8 text-slate-600">
                            {page?.hero_subtitle || `${institution.village ? `${institution.village} গ্রামের` : 'এই'} শিক্ষার্থী, অভিভাবক ও পরিচালনা কমিটির জন্য এক জায়গায় website এবং portal।`}
                        </p>
                        <p className="mt-4 text-sm font-black" style={{ color: theme.primary_color }}>
                            {design.heroLine}
                        </p>
                    </div>

                    <div className="grid gap-4 rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur sm:grid-cols-2">
                        {[
                            ['Website', institution.custom_domain || `${institution.subdomain}.digigram.com`],
                            ['Portal', 'চালু'],
                            ['গ্রাম', institution.village || '-'],
                            ['ফিচার', `${features.length} টি`]
                        ].map(([label, value]) => (
                            <div key={label}>
                                <p className="text-xs font-black uppercase text-slate-400">{label}</p>
                                <p className="mt-1 font-black">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <main>
                <section id="about" className="mx-auto grid max-w-7xl gap-5 px-4 py-12 lg:grid-cols-[1fr_0.8fr]">
                    <article className="rounded-3xl border border-slate-200 bg-white p-6">
                        <h2 className="text-2xl font-black">আমাদের সম্পর্কে</h2>
                        <p className="mt-4 font-bold leading-8 text-slate-600">
                            {page?.about_text || `${institution.name} এখন DigiGram-এর মাধ্যমে নিজস্ব website ও portal ব্যবহার করছে।`}
                        </p>
                    </article>
                    <article className="rounded-3xl border border-slate-200 bg-white p-6">
                        <h2 className="text-2xl font-black">প্রধানের বার্তা</h2>
                        <p className="mt-4 font-bold leading-8 text-slate-600">
                            {page?.principal_message || 'শিক্ষা, শৃঙ্খলা ও নিয়মিত অভিভাবক সংযোগকে একসাথে এগিয়ে নেওয়াই আমাদের লক্ষ্য।'}
                        </p>
                    </article>
                </section>

                <section id="teachers" className="border-y border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-12">
                        <div className="mb-6 flex items-end justify-between gap-4">
                            <div>
                                <p className="text-sm font-black" style={{ color: theme.primary_color }}>শিক্ষক মণ্ডলী</p>
                                <h2 className="text-2xl font-black">যারা প্রতিদিন শেখার পথ দেখান</h2>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            {[
                                ['প্রধান শিক্ষক', 'প্রশাসন ও একাডেমিক তত্ত্বাবধান'],
                                ['শ্রেণি শিক্ষক', 'উপস্থিতি ও guardian follow-up'],
                                ['বিষয় শিক্ষক', 'পাঠ, কাজ ও ফলাফল']
                            ].map(([title, text]) => (
                                <article key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <Users className="mb-4" style={{ color: theme.primary_color }} />
                                    <h3 className="font-black">{title}</h3>
                                    <p className="mt-2 text-sm font-bold text-slate-500">{text}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="academics" className="mx-auto max-w-7xl px-4 py-12">
                    <div className="mb-6">
                        <p className="text-sm font-black" style={{ color: theme.primary_color }}>শিক্ষা কার্যক্রম</p>
                        <h2 className="text-2xl font-black">ক্লাস থেকে অগ্রগতি পর্যন্ত</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {features.map(({ key, title, description, icon: Icon }) => (
                            <article key={key} className="rounded-3xl border border-slate-200 bg-white p-5">
                                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${design.iconWrap}`}>
                                    <Icon size={20} />
                                </div>
                                <h3 className="font-black">{title}</h3>
                                <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="results" className="border-y border-slate-200 bg-slate-900 text-white">
                    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-12 lg:grid-cols-[1fr_0.8fr]">
                        <div>
                            <p className="text-sm font-black text-white/70">ফলাফল</p>
                            <h2 className="mt-2 text-3xl font-black">ফলাফল, অগ্রগতি ও অভিভাবক বার্তা</h2>
                            <p className="mt-4 max-w-2xl font-bold leading-8 text-white/75">
                                {page?.result_text || 'পরীক্ষার ফলাফল প্রকাশ, বিষয়ভিত্তিক অগ্রগতি এবং প্রয়োজন হলে guardian SMS একই সিস্টেমে পরিচালিত হবে।'}
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {[
                                ['Attendance', 'Daily'],
                                ['Result', 'Published'],
                                ['SMS', 'Guardian'],
                                ['Progress', 'Tracked']
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <p className="text-sm font-bold text-white/60">{label}</p>
                                    <p className="mt-2 text-xl font-black">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="notices" className="mx-auto max-w-7xl px-4 py-12">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-black" style={{ color: theme.primary_color }}>নোটিশ</p>
                            <h2 className="text-2xl font-black">সর্বশেষ আপডেট</h2>
                        </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-3">
                        {notices.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 font-bold text-slate-400">
                                এখনো কোনো নোটিশ প্রকাশ হয়নি।
                            </div>
                        ) : notices.map((notice) => (
                            <article key={notice.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                                <Megaphone className="mb-4" style={{ color: theme.primary_color }} />
                                <h3 className="font-black">{notice.title}</h3>
                                {notice.body && <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{notice.body}</p>}
                            </article>
                        ))}
                    </div>
                </section>
            </main>

            <footer id="contact" className="border-t border-slate-200 bg-white">
                <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 md:grid-cols-3">
                    <div>
                        <h2 className="text-xl font-black">{institution.name}</h2>
                        <p className="mt-2 text-sm font-bold text-slate-500">{institution.village || '-'}</p>
                    </div>
                    <div className="space-y-3 text-sm font-bold text-slate-600">
                        <p className="flex items-center gap-2"><Phone size={16} /> {page?.contact_phone || 'ফোন যোগ করা হয়নি'}</p>
                        <p className="flex items-center gap-2"><Mail size={16} /> {page?.contact_email || 'ইমেইল যোগ করা হয়নি'}</p>
                    </div>
                    <div className="space-y-3 text-sm font-bold text-slate-600">
                        <p className="flex items-center gap-2"><MapPin size={16} /> {page?.address || institution.village || '-'}</p>
                        <a href="#home" className="inline-flex items-center gap-1 font-black" style={{ color: theme.primary_color }}>
                            উপরে যান <ChevronRight size={16} />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

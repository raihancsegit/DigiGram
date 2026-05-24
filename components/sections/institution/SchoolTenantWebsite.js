'use client';

import { useEffect, useState } from 'react';
import {
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
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
import {
    SCHOOL_WEBSITE_DEMO_CONTENT,
    SCHOOL_WEBSITE_EXTRA_SECTIONS,
    SCHOOL_WEBSITE_HOME_SECTION_SETTINGS
} from '@/lib/constants/schoolWebsiteDefaults';

const DEFAULT_MENU = ['home', 'about', 'classes', 'teachers', 'guardian', 'facilities', 'admission', 'notices', 'contact'];
const PAGE_META = {
    home: { title: 'Home', subtitle: 'Institution overview and latest highlights' },
    about: { title: 'About', subtitle: 'History, values and institution profile' },
    classes: { title: 'Academics', subtitle: 'Classes, sections and academic programs' },
    teachers: { title: 'Teachers', subtitle: 'Teacher profiles and subject responsibilities' },
    guardian: { title: 'Guardian Updates', subtitle: 'Class-wise lessons, homework, attendance and results' },
    facilities: { title: 'Facilities', subtitle: 'Learning environment and student support' },
    admission: { title: 'Admission', subtitle: 'Admission information and contact details' },
    notices: { title: 'Notice Board', subtitle: 'Latest notices and institution updates' },
    contact: { title: 'Contact', subtitle: 'Office address, phone and communication information' }
};
const SCHOOL_MENU_OPTIONS = [
    { value: 'home', label: 'হোম' },
    { value: 'about', label: 'আমাদের সম্পর্কে' },
    { value: 'classes', label: 'শ্রেণি' },
    { value: 'teachers', label: 'শিক্ষকমণ্ডলী' },
    { value: 'guardian', label: 'অভিভাবক আপডেট' },
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
const HOME_SECTION_OPTIONS = [
    { key: 'hero', order: 1 },
    { key: 'intro', order: 2 },
    { key: 'teachers', order: 3 },
    { key: 'journey', order: 4 },
    { key: 'professional', order: 5 },
    { key: 'cta', order: 6 },
    { key: 'updates', order: 7 }
];
const DEFAULT_HOME_SECTION_SETTINGS = SCHOOL_WEBSITE_HOME_SECTION_SETTINGS;
const DEFAULT_EXTRA_SECTIONS = SCHOOL_WEBSITE_EXTRA_SECTIONS;

function cssFont(fontFamily) {
    if (fontFamily === 'noto_sans_bengali') return '"Noto Sans Bengali", sans-serif';
    if (fontFamily === 'system') return 'system-ui, sans-serif';
    return '"Hind Siliguri", sans-serif';
}

function safeArray(value, fallback = []) {
    return Array.isArray(value) && value.length ? value : fallback;
}

function minimumArray(value, fallback = [], minimumLength = 1) {
    return Array.isArray(value) && value.length >= minimumLength ? value : fallback;
}

const PAGE_SIZE = 6;

function clampPage(page, totalItems, pageSize = PAGE_SIZE) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    return Math.min(Math.max(page, 1), totalPages);
}

function paginateRows(rows, page, pageSize = PAGE_SIZE) {
    const safePage = clampPage(page, rows.length, pageSize);
    return rows.slice((safePage - 1) * pageSize, safePage * pageSize);
}

function Pagination({ page, totalItems, onPageChange, pageSize = PAGE_SIZE }) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (totalItems <= pageSize) return null;
    return (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={() => onPageChange(clampPage(page - 1, totalItems, pageSize))} disabled={page <= 1} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40">আগে</button>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-500">{page} / {totalPages}</span>
            <button type="button" onClick={() => onPageChange(clampPage(page + 1, totalItems, pageSize))} disabled={page >= totalPages} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40">পরে</button>
        </div>
    );
}

export default function SchoolTenantWebsite({ institution, page, notices }) {
    const design = getInstitutionDesignProfile(institution.category);
    const theme = {
        primary_color: institution.theme?.primary_color || design.primaryColor,
        accent_color: institution.theme?.accent_color || '#f59e0b',
        layout_variant: institution.theme?.layout_variant || 'split',
        font_family: institution.theme?.font_family || design.fontFamily,
        menu_items: institution.theme?.menu_items || DEFAULT_MENU,
        template: institution.theme?.template || design.defaultTemplate || 'classic'
    };
    const template = getSchoolWebsiteTemplate(theme.template);
    const isDarkTemplate = template.tone === 'dark';
    const pageTextClass = isDarkTemplate ? 'text-white' : 'text-slate-900';
    const mutedTextClass = template.mutedTextClass || (isDarkTemplate ? 'text-white/60' : 'text-slate-500');
    const bodyTextClass = template.bodyTextClass || (isDarkTemplate ? 'text-white/72' : 'text-slate-600');
    const panelClass = template.cardSurfaceClass || 'border border-slate-200 bg-white text-slate-900 shadow-sm';
    const softPanelClass = template.cardSoftClass || panelClass;
    const primaryButtonClass = template.primaryButtonClass || 'bg-amber-400 text-slate-950';
    const ghostButtonClass = template.ghostButtonClass || (template.value === 'editorial' ? 'border border-slate-900 text-slate-900' : 'border border-white/40 text-white');
    const badgeClass = template.badgeClass || (template.value === 'editorial' ? 'border-l-4 border-slate-900 pl-3 text-slate-700' : 'rounded-full border border-white/20 bg-white/10 text-amber-100');
    const logoClass = template.logoClass || 'bg-amber-400 text-white';
    const noticeBadgeClass = template.noticeBadgeClass || 'bg-rose-600 text-white';
    const heroAccentClass = template.heroAccentClass || '';
    const websitePatternClass = design.websitePatternClass || (isDarkTemplate ? 'border-white/15 bg-white/[0.05]' : 'border-slate-200 bg-white');
    const websiteFeatureClass = design.websiteFeatureClass || (isDarkTemplate ? 'bg-white/[0.06] text-white' : 'bg-slate-50 text-slate-950');
    const websiteAccentClass = design.websiteAccentClass || 'text-[var(--school-primary)]';
    const altSectionClass = isDarkTemplate ? template.sectionClass : 'bg-[#f5f3ee]';
    const plainSectionClass = isDarkTemplate ? template.shellClass : '';
    const emptyPanelClass = isDarkTemplate ? `${panelClass} text-white/55` : 'border border-dashed border-slate-300 bg-white text-slate-500';
    const inputClass = isDarkTemplate
        ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 focus:border-cyan-300'
        : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-400';
    const enabledMenuItems = Array.from(new Set([...DEFAULT_MENU, ...theme.menu_items]));
    const menuItems = SCHOOL_MENU_OPTIONS.filter((item) => enabledMenuItems.includes(item.value));
    const stats = minimumArray(page?.stats, fallbackStats, 4);
    const highlights = minimumArray(page?.about_highlights, SCHOOL_WEBSITE_DEMO_CONTENT.highlights, 3);
    const classSections = minimumArray(page?.class_sections, SCHOOL_WEBSITE_DEMO_CONTENT.classes, 4);
    const teachers = minimumArray(page?.public_teachers, SCHOOL_WEBSITE_DEMO_CONTENT.teachers, 3);
    const facilities = minimumArray(page?.facilities, SCHOOL_WEBSITE_DEMO_CONTENT.facilities, 4);
    const admissionFeatures = minimumArray(page?.admission_features, SCHOOL_WEBSITE_DEMO_CONTENT.admissionFeatures, 3);
    const noticeRows = safeArray(notices, SCHOOL_WEBSITE_DEMO_CONTENT.ticker.map((title, index) => ({
        id: `demo-notice-${index}`,
        title,
        body: index === 0
            ? 'ভর্তি page থেকে আবেদন জমা দিন অথবা office-এর সাথে যোগাযোগ করুন।'
            : 'সর্বশেষ বিস্তারিত তথ্য Notice Board এবং portal update-এ পাওয়া যাবে।'
    })));
    const pinnedNoticeTitles = noticeRows
        .filter((notice) => notice.is_pinned)
        .map((notice) => notice.title)
        .filter(Boolean);
    const ticker = minimumArray(
        [...new Set([...pinnedNoticeTitles, ...safeArray(page?.notice_ticker)])],
        SCHOOL_WEBSITE_DEMO_CONTENT.ticker,
        3
    );
    const footerLinks = page?.footer_links || {};
    const siteName = footerLinks.site_name || institution.name;
    const extraSections = footerLinks.extra_sections || DEFAULT_EXTRA_SECTIONS;
    const homeSectionSettings = {
        ...DEFAULT_HOME_SECTION_SETTINGS,
        ...(extraSections.home_sections || {})
    };
    const [activePage, setActivePage] = useState('home');
    const [guardianUpdates, setGuardianUpdates] = useState({ classes: [] });
    const [guardianLoading, setGuardianLoading] = useState(false);
    const [selectedGuardianClassId, setSelectedGuardianClassId] = useState('');
    const [guardianCheckForm, setGuardianCheckForm] = useState({ rollNo: '', guardianPhone: '' });
    const [guardianStudent, setGuardianStudent] = useState(null);
    const [guardianCheckLoading, setGuardianCheckLoading] = useState(false);
    const [guardianCheckError, setGuardianCheckError] = useState('');
    const [classesPage, setClassesPage] = useState(1);
    const [teachersPage, setTeachersPage] = useState(1);
    const [facilitiesPage, setFacilitiesPage] = useState(1);
    const [galleryPage, setGalleryPage] = useState(1);
    const [eventsPage, setEventsPage] = useState(1);
    const [noticesPage, setNoticesPage] = useState(1);
    const [admissionForm, setAdmissionForm] = useState({
        student_name: '',
        student_name_en: '',
        date_of_birth: '',
        gender: '',
        desired_class: '',
        previous_institution: '',
        guardian_name: '',
        guardian_phone: '',
        guardian_email: '',
        address: '',
        notes: ''
    });
    const [admissionSubmitting, setAdmissionSubmitting] = useState(false);
    const [admissionMessage, setAdmissionMessage] = useState('');
    const [admissionError, setAdmissionError] = useState('');
    const activeMenuItem = menuItems.find((item) => item.value === activePage) || menuItems[0];
    const activeMeta = PAGE_META[activePage] || { title: activeMenuItem?.label || 'Page', subtitle: siteName };

    useEffect(() => {
        const url = new URL(window.location.href);
        const requestedPage = url.searchParams.get('page');
        if (requestedPage && menuItems.some((item) => item.value === requestedPage)) {
            setActivePage(requestedPage);
        }
    }, [menuItems]);

    useEffect(() => {
        if (!menuItems.some((item) => item.value === activePage)) {
            setActivePage('home');
        }
    }, [activePage, menuItems]);

    useEffect(() => {
        setClassesPage(1);
        setTeachersPage(1);
        setFacilitiesPage(1);
        setGalleryPage(1);
        setEventsPage(1);
        setNoticesPage(1);
    }, [activePage]);

    useEffect(() => {
        const seo = page?.footer_links?.seo || {};
        const label = PAGE_META[activePage]?.title || activePage;
        document.title = activePage === 'home'
            ? (seo.title || `${siteName} | DigiGram`)
            : `${activeMenuItem?.label || label} | ${seo.title || siteName}`;
    }, [activeMenuItem?.label, activePage, page?.footer_links?.seo, siteName]);

    useEffect(() => {
        const syncPageFromUrl = () => {
            const url = new URL(window.location.href);
            const requestedPage = url.searchParams.get('page');
            setActivePage(requestedPage && menuItems.some((item) => item.value === requestedPage) ? requestedPage : 'home');
        };
        window.addEventListener('popstate', syncPageFromUrl);
        return () => window.removeEventListener('popstate', syncPageFromUrl);
    }, [menuItems]);

    useEffect(() => {
        async function loadGuardianUpdates() {
            if (!institution?.id || activePage !== 'guardian' || guardianUpdates.classes.length) return;
            setGuardianLoading(true);
            try {
                const response = await fetch(`/api/institutions/${institution.id}/guardian-updates`, {
                    cache: 'no-store'
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Guardian updates failed');
                const nextUpdates = result.data || { classes: [] };
                setGuardianUpdates(nextUpdates);
                setSelectedGuardianClassId((current) => current || nextUpdates.classes?.[0]?.id || '');
            } catch (error) {
                console.error('Guardian updates load failed:', error);
            } finally {
                setGuardianLoading(false);
            }
        }
        loadGuardianUpdates();
    }, [activePage, guardianUpdates.classes.length, institution?.id]);

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

    async function verifyGuardianStudent(event) {
        event.preventDefault();
        if (!selectedGuardianClass?.id) return;
        setGuardianCheckLoading(true);
        setGuardianCheckError('');
        setGuardianStudent(null);
        try {
            const response = await fetch(`/api/institutions/${institution.id}/guardian-student-check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classId: selectedGuardianClass.id,
                    rollNo: guardianCheckForm.rollNo,
                    guardianPhone: guardianCheckForm.guardianPhone
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Student verify failed');
            setGuardianStudent(result.data);
        } catch (error) {
            setGuardianCheckError(error.message || 'Student verify failed');
        } finally {
            setGuardianCheckLoading(false);
        }
    }

    async function submitAdmission(event) {
        event.preventDefault();
        setAdmissionSubmitting(true);
        setAdmissionMessage('');
        setAdmissionError('');
        try {
            const response = await fetch(`/api/institutions/${institution.id}/admissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(admissionForm)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Admission submission failed');
            setAdmissionMessage('Application received. The institution office will review it and contact the guardian.');
            setAdmissionForm({
                student_name: '',
                student_name_en: '',
                date_of_birth: '',
                gender: '',
                desired_class: '',
                previous_institution: '',
                guardian_name: '',
                guardian_phone: '',
                guardian_email: '',
                address: '',
                notes: ''
            });
        } catch (error) {
            setAdmissionError(error.message || 'Admission submission failed');
        } finally {
            setAdmissionSubmitting(false);
        }
    }

    const selectedGuardianClass = guardianUpdates.classes.find((item) => item.id === selectedGuardianClassId) || guardianUpdates.classes[0] || null;
    const pagedClassSections = paginateRows(classSections, classesPage);
    const pagedTeachers = paginateRows(teachers, teachersPage);
    const galleryItems = safeArray(extraSections.gallery, DEFAULT_EXTRA_SECTIONS.gallery);
    const eventItems = safeArray(extraSections.events, DEFAULT_EXTRA_SECTIONS.events);
    const programItems = safeArray(extraSections.programs, DEFAULT_EXTRA_SECTIONS.programs);
    const pagedFacilities = paginateRows(facilities, facilitiesPage);
    const pagedGallery = paginateRows(galleryItems, galleryPage);
    const pagedEvents = paginateRows(eventItems, eventsPage);
    const pagedNotices = paginateRows(noticeRows, noticesPage);
    const socialLinks = footerLinks.social_links || {};
    const developer = footerLinks.developer || {};
    const heroLayoutClass = theme.layout_variant === 'centered'
        ? 'lg:grid-cols-1 text-center'
        : theme.layout_variant === 'magazine'
            ? 'lg:grid-cols-[1.15fr_0.75fr]'
            : template.heroGridClass;
    const heroStatsClass = theme.layout_variant === 'centered'
        ? 'mx-auto max-w-4xl sm:grid-cols-4'
        : template.value === 'editorial' ? 'sm:grid-cols-1' : 'sm:grid-cols-2';
    const brandGradient = { background: `linear-gradient(135deg, ${theme.primary_color}, ${theme.accent_color})` };
    const sectionOrder = (key) => Number(homeSectionSettings[key]?.order || DEFAULT_HOME_SECTION_SETTINGS[key]?.order || 1);
    const isSectionVisible = (key) => homeSectionSettings[key]?.enabled !== false;
    const heroFrameClass = isDarkTemplate
        ? 'border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/30'
        : 'border border-white/60 bg-white/95 shadow-2xl shadow-slate-950/15';
    const sectionLeadClass = `text-sm font-black uppercase tracking-[0.18em] ${websiteAccentClass}`;

    return (
        <div
            className={`min-h-screen ${pageTextClass} ${template.shellClass}`}
            style={{
                '--school-primary': theme.primary_color,
                '--school-accent': theme.accent_color,
                fontFamily: cssFont(theme.font_family)
            }}
        >
            <header className={`sticky top-0 z-40 shadow-sm ${template.headerClass}`}>
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4">
                    <div className="flex items-center gap-3">
                        {page?.logo_url ? (
                            <img src={page.logo_url} alt="" className="h-11 w-11 rounded-full object-cover" />
                        ) : (
                            <div className={`flex h-11 w-11 items-center justify-center rounded-full font-black ${logoClass}`}>
                                {siteName?.slice(0, 1)}
                            </div>
                        )}
                        <div>
                            <h1 className="text-lg font-black">{siteName}</h1>
                            <p className={`text-xs font-bold ${isDarkTemplate || template.value === 'classic' ? 'text-white/70' : 'text-slate-500'}`}>{institution.village || design.eyebrow}</p>
                        </div>
                    </div>
                    <nav className="hidden items-center gap-5 lg:flex">
                        {menuItems.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => navigatePage(item.value)}
                                className={`text-sm font-bold transition ${
                                    isDarkTemplate
                                        ? `hover:text-cyan-200 ${activePage === item.value ? 'text-cyan-200' : 'text-white/75'}`
                                        : template.value === 'classic'
                                        ? `hover:text-amber-200 ${activePage === item.value ? 'text-amber-200' : 'text-white/85'}`
                                        : `hover:text-[var(--school-primary)] ${activePage === item.value ? 'text-[var(--school-primary)]' : 'text-slate-600'}`
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="border-t border-current/10 px-4 pb-3 lg:hidden">
                    <div className="flex gap-2 overflow-x-auto">
                        {menuItems.map((item) => (
                            <button
                                key={`mobile-${item.value}`}
                                type="button"
                                onClick={() => navigatePage(item.value)}
                                className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${
                                    activePage === item.value
                                        ? 'bg-[var(--school-primary)] text-white'
                                        : isDarkTemplate ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className={`border-b ${template.noticeClass}`}>
                <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-hidden px-4 py-3">
                    <span className={`shrink-0 rounded px-3 py-1 text-xs font-black ${noticeBadgeClass}`}>বিজ্ঞপ্তি</span>
                    <div className="school-notice-track min-w-0 overflow-hidden text-sm font-bold">
                        <div className="school-notice-marquee flex w-max items-center gap-10">
                            {[...ticker, ...ticker].map((item, index) => (
                                <span key={`${item}-${index}`} className="shrink-0">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {activePage === 'home' && (
            <div className="flex flex-col">
            {isSectionVisible('hero') && (
            <section
                className={template.heroClass}
                style={{
                    order: sectionOrder('hero'),
                    ...(page?.banner_image_url ? {
                    backgroundImage: `linear-gradient(90deg, rgba(15,74,39,.95), rgba(27,110,60,.75)), url(${page.banner_image_url})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover'
                    } : {})
                }}
            >
                {isDarkTemplate && (
                    <>
                        <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:58px_58px]" />
                        <div className="pointer-events-none absolute inset-x-0 top-16 h-px bg-white/15" />
                        <div className="pointer-events-none absolute bottom-0 right-0 h-44 w-[48vw] border-l border-t border-white/10 bg-white/[0.03]" />
                    </>
                )}
                {!isDarkTemplate && template.value !== 'editorial' && (
                    <>
                        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:100%_62px]" />
                        <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-[42vw] border-l border-t border-white/20 bg-white/10" />
                    </>
                )}
                <div className={`relative z-10 mx-auto grid max-w-7xl gap-10 px-4 py-20 lg:items-center ${heroLayoutClass}`}>
                    <div>
                        <p className={`mb-4 inline-flex px-4 py-2 text-sm font-bold ${badgeClass}`}>
                            {institution.village || design.eyebrow} {page?.established_year ? `প্রতিষ্ঠিত ${page.established_year}` : ''}
                        </p>
                        <h2 className={`max-w-3xl text-4xl font-black leading-tight ${template.heroTitleClass}`}>
                            <span className={heroAccentClass}>{page?.hero_title || siteName}</span>
                        </h2>
                        <p className={`mt-4 max-w-2xl text-base font-medium leading-8 ${isDarkTemplate ? bodyTextClass : template.value === 'editorial' ? 'text-slate-600' : 'text-white/80'}`}>
                            {page?.hero_subtitle || design.heroLine}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <button type="button" onClick={() => navigatePage('admission')} style={brandGradient} className={`rounded-md px-5 py-3 font-black ${primaryButtonClass}`}>ভর্তি তথ্য</button>
                            <button type="button" onClick={() => navigatePage('about')} className={`rounded-md px-5 py-3 font-black ${ghostButtonClass}`}>আরও জানুন</button>
                        </div>
                    </div>
                    <div className={`p-4 ${template.cardClass} ${heroFrameClass}`}>
                        <div className={`grid gap-4 border p-5 ${template.cardClass} ${websitePatternClass}`}>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className={`text-xs font-black uppercase tracking-[0.22em] ${websiteAccentClass}`}>
                                    {design.websiteProofLabel || design.eyebrow}
                                </p>
                                <span className={`rounded-full border px-3 py-1 text-xs font-black ${isDarkTemplate ? 'border-white/15 text-white/70' : 'border-slate-200 text-slate-500'}`}>
                                    {page?.office_hours || 'Office updates'}
                                </span>
                            </div>
                            <div className={`p-4 ${template.cardClass} ${websiteFeatureClass}`}>
                                <p className={`text-xs font-black uppercase tracking-[0.18em] ${isDarkTemplate ? 'text-white/45' : 'text-slate-400'}`}>
                                    Institution desk
                                </p>
                                <p className={`mt-3 text-lg font-black leading-8 ${isDarkTemplate ? 'text-white' : 'text-slate-950'}`}>
                                    {page?.principal_message || page?.approval_text || design.heroLine}
                                </p>
                                <div className={`mt-4 flex flex-wrap gap-2 text-xs font-black ${isDarkTemplate ? 'text-white/70' : 'text-slate-600'}`}>
                                    <span className={`rounded-full px-3 py-1 ${isDarkTemplate ? 'bg-white/[0.07]' : 'bg-white'}`}>{page?.contact_phone || 'Admission desk'}</span>
                                    <span className={`rounded-full px-3 py-1 ${isDarkTemplate ? 'bg-white/[0.07]' : 'bg-white'}`}>{institution.village || design.eyebrow}</span>
                                </div>
                            </div>
                            <div className={`grid gap-3 ${heroStatsClass}`}>
                                {stats.map((stat, index) => (
                                    <article key={`${stat.label}-${index}`} className={`p-4 backdrop-blur ${template.cardClass} ${template.statClass}`}>
                                        <p className={`text-2xl font-black ${template.statValueClass}`}>{stat.value}</p>
                                        <p className={`mt-1 text-xs font-bold ${isDarkTemplate || template.value === 'classic' ? 'text-white/75' : 'text-slate-500'}`}>{stat.label}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            )}
            {isSectionVisible('intro') && (
            <section style={{ order: sectionOrder('intro') }} className={`py-16 ${template.sectionClass}`}>
                <div className={`mx-auto grid max-w-7xl gap-8 px-4 lg:items-center ${template.previewClass}`}>
                    <div className={`overflow-hidden p-6 ${template.cardClass} ${panelClass}`}>
                        <School className="mb-5 h-12 w-12 text-[var(--school-primary)]" />
                        <p className={sectionLeadClass}>আমাদের সম্পর্কে</p>
                        <h3 className={`mt-2 text-2xl font-black ${template.sectionTitleClass}`}>{siteName}</h3>
                        <p className={`mt-4 font-medium leading-8 ${isDarkTemplate ? bodyTextClass : 'text-slate-600'}`}>
                            {page?.about_text || `${siteName} শিক্ষার্থী, শিক্ষক ও অভিভাবকদের জন্য একটি সমন্বিত শিক্ষার পরিবেশ তৈরি করছে।`}
                        </p>
                        <div className="mt-5 grid gap-2">
                            {highlights.slice(0, 3).map((item) => (
                                <p key={item} className={`flex items-start gap-2 rounded-2xl px-3 py-2 text-sm font-bold ${isDarkTemplate ? 'bg-white/[0.05] text-white/75' : 'bg-slate-50 text-slate-600'}`}>
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--school-primary)]" />
                                    {item}
                                </p>
                            ))}
                        </div>
                        <button type="button" onClick={() => navigatePage('about')} className="mt-5 font-black text-[var(--school-primary)]">বিস্তারিত দেখুন</button>
                    </div>
                    <div className={`grid gap-4 ${template.value === 'editorial' ? 'sm:grid-cols-1' : 'sm:grid-cols-2'}`}>
                        {classSections.slice(0, 2).map((item, index) => (
                            <article key={`${item.title}-${index}`} className={`border p-5 ${template.cardClass} ${softPanelClass} ${websitePatternClass}`}>
                                <div className="mb-3 text-3xl">{classIcons[index % classIcons.length]}</div>
                                <h3 className="font-black">{item.title}</h3>
                                <p className={`mt-2 text-sm font-medium leading-7 ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{item.description}</p>
                                {item.badge && <p className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-black ${websiteFeatureClass}`}>{item.badge}</p>}
                            </article>
                        ))}
                    </div>
                </div>
            </section>
            )}

            {isSectionVisible('teachers') && (
            <section style={{ order: sectionOrder('teachers') }} className={`py-16 ${isDarkTemplate ? template.shellClass : ''}`}>
                <div className="mx-auto max-w-7xl px-4">
                    <div className="mb-8 flex items-end justify-between gap-4">
                        <div>
                            <p className={sectionLeadClass}>শিক্ষকমণ্ডলী</p>
                            <h2 className="mt-2 text-3xl font-black">যারা প্রতিদিন পথ দেখান</h2>
                        </div>
                        <button type="button" onClick={() => navigatePage('teachers')} className="font-black text-[var(--school-primary)]">সব দেখুন</button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {teachers.slice(0, 3).map((teacher, index) => (
                            <article key={`${teacher.name}-${index}`} className={`overflow-hidden p-5 text-center ${template.cardClass} ${panelClass}`}>
                                <div className={`-mx-5 -mt-5 mb-5 h-1.5 ${index === 1 ? 'bg-[var(--school-accent)]' : 'bg-[var(--school-primary)]'}`} />
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--school-primary)] text-lg font-black text-white">
                                    {teacher.name?.slice(0, 1)}
                                </div>
                                <h3 className="font-black">{teacher.name}</h3>
                                <p className="mt-1 text-sm font-bold text-[var(--school-primary)]">{teacher.subject}</p>
                                {teacher.experience && <p className={`mt-3 text-sm font-medium ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{teacher.experience}</p>}
                            </article>
                        ))}
                    </div>
                </div>
            </section>
            )}

            {isSectionVisible('journey') && (
            <section style={{ order: sectionOrder('journey') }} className={`py-16 ${isDarkTemplate ? template.sectionClass : 'bg-white'}`}>
                <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
                    <div className={`p-6 ${template.cardClass} ${softPanelClass}`}>
                        <p className={sectionLeadClass}>Student journey</p>
                        <h2 className="mt-3 text-3xl font-black">Class, teacher, guardian update and result in one flow</h2>
                        <p className={`mt-4 font-medium leading-8 ${isDarkTemplate ? bodyTextClass : 'text-slate-600'}`}>
                            {page?.principal_message || 'Routine lesson update, homework, attendance, exam notice and guardian communication keep academic work clear from admission to result.'}
                        </p>
                        <button type="button" onClick={() => navigatePage('guardian')} className="mt-5 font-black text-[var(--school-primary)]">
                            Guardian update দেখুন
                        </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {programItems.slice(0, 4).map((item, index) => (
                            <article key={`home-program-${item.title}-${index}`} className={`p-5 ${template.cardClass} ${panelClass}`}>
                                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl font-black ${websiteFeatureClass}`}>0{index + 1}</div>
                                <h3 className="text-lg font-black">{item.title}</h3>
                                <p className={`mt-2 text-sm font-medium leading-7 ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{item.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
            )}

            {isSectionVisible('professional') && (
            <section style={{ order: sectionOrder('professional') }} className={`py-16 ${template.sectionClass}`}>
                <div className="mx-auto max-w-7xl px-4">
                    <div className="mb-8 max-w-3xl">
                        <p className={sectionLeadClass}>Institution profile</p>
                        <h2 className="mt-2 text-3xl font-black">Academic trust, campus life and guardian support</h2>
                        <p className={`mt-3 font-medium leading-8 ${isDarkTemplate ? bodyTextClass : 'text-slate-600'}`}>
                            {page?.approval_text || page?.hero_subtitle || design.heroLine}
                        </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {safeArray(extraSections.achievements, DEFAULT_EXTRA_SECTIONS.achievements).map((item, index) => (
                            <article key={`${item.title}-${index}`} className={`p-5 ${template.cardClass} ${panelClass}`}>
                                <p className="text-3xl font-black text-[var(--school-accent)]">{item.value}</p>
                                <h3 className="mt-3 font-black">{item.title}</h3>
                                <p className={`mt-2 text-sm font-medium leading-7 ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{item.description}</p>
                            </article>
                        ))}
                    </div>

                    <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                        <div>
                            <p className="text-sm font-black text-[var(--school-primary)]">Programs</p>
                            <h2 className="mt-2 text-3xl font-black">শিক্ষা কার্যক্রম ও বিশেষ উদ্যোগ</h2>
                            <div className="mt-6 grid gap-4">
                                {safeArray(extraSections.programs, DEFAULT_EXTRA_SECTIONS.programs).map((item, index) => (
                                    <article key={`${item.title}-${index}`} className={`p-5 ${template.cardClass} ${softPanelClass}`}>
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--school-primary)] font-black text-white">{index + 1}</div>
                                        <h3 className="font-black">{item.title}</h3>
                                        <p className={`mt-2 text-sm font-medium leading-7 ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{item.description}</p>
                                    </article>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-black text-[var(--school-primary)]">Gallery</p>
                            <h2 className="mt-2 text-3xl font-black">ক্যাম্পাসের ঝলক</h2>
                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                {safeArray(extraSections.gallery, DEFAULT_EXTRA_SECTIONS.gallery).map((item, index) => (
                                    <article key={`${item.title}-${index}`} className={`overflow-hidden ${template.cardClass} ${panelClass}`}>
                                        {item.image_url ? (
                                            <img src={item.image_url} alt="" className="h-40 w-full object-cover" />
                                        ) : (
                                            <div className="flex h-40 items-center justify-center bg-[var(--school-primary)]/10 text-4xl">🏫</div>
                                        )}
                                        <div className="p-4">
                                            <h3 className="font-black">{item.title}</h3>
                                            <p className={`mt-1 text-sm font-medium ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{item.caption}</p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 grid gap-4 md:grid-cols-3">
                        {safeArray(extraSections.events, DEFAULT_EXTRA_SECTIONS.events).map((item, index) => (
                            <article key={`${item.title}-${index}`} className={`p-5 ${template.cardClass} ${panelClass}`}>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--school-primary)]">{item.date}</p>
                                <h3 className="mt-3 font-black">{item.title}</h3>
                                <p className={`mt-2 text-sm font-medium leading-7 ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{item.description}</p>
                            </article>
                        ))}
                    </div>

                    <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                        <section className={`p-6 ${template.cardClass} ${panelClass}`}>
                            <p className="text-sm font-black text-[var(--school-primary)]">FAQ</p>
                            <h2 className="mt-2 text-2xl font-black">অভিভাবকের সাধারণ প্রশ্ন</h2>
                            <div className="mt-5 space-y-3">
                                {safeArray(extraSections.faqs, DEFAULT_EXTRA_SECTIONS.faqs).map((item, index) => (
                                    <details key={`${item.question}-${index}`} className={`rounded-2xl p-4 ${isDarkTemplate ? 'bg-white/[0.05]' : 'bg-slate-50'}`}>
                                        <summary className="cursor-pointer font-black">{item.question}</summary>
                                        <p className={`mt-2 text-sm font-medium leading-7 ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{item.answer}</p>
                                    </details>
                                ))}
                            </div>
                        </section>
                        <section className={`p-6 ${template.cardClass} ${softPanelClass}`}>
                            <p className="text-sm font-black text-[var(--school-primary)]">Downloads</p>
                            <h2 className="mt-2 text-2xl font-black">গুরুত্বপূর্ণ ফাইল ও লিংক</h2>
                            <div className="mt-5 space-y-3">
                                {safeArray(extraSections.downloads, DEFAULT_EXTRA_SECTIONS.downloads).map((item, index) => (
                                    <a key={`${item.title}-${index}`} href={item.url || '#'} target={item.url ? '_blank' : undefined} rel={item.url ? 'noreferrer' : undefined} className={`block rounded-2xl p-4 ${isDarkTemplate ? 'bg-white/[0.05]' : 'bg-white'}`}>
                                        <p className="font-black">{item.title}</p>
                                        <p className={`mt-1 text-sm font-medium ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{item.note}</p>
                                    </a>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </section>
            )}

            {isSectionVisible('cta') && (
            <section style={{ order: sectionOrder('cta') }} className={`py-16 ${isDarkTemplate ? template.shellClass : 'bg-white'}`}>
                <div className="mx-auto max-w-7xl px-4">
                    <div style={brandGradient} className={`overflow-hidden p-8 text-white shadow-2xl ${template.cardClass}`}>
                        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.18em] text-white/70">Admission & Contact</p>
                                <h2 className="mt-3 text-3xl font-black">{extraSections.cta?.title || DEFAULT_EXTRA_SECTIONS.cta.title}</h2>
                                <p className="mt-3 max-w-2xl font-medium leading-8 text-white/80">{extraSections.cta?.text || DEFAULT_EXTRA_SECTIONS.cta.text}</p>
                            </div>
                            <button type="button" onClick={() => navigatePage('contact')} className="rounded-2xl bg-white px-6 py-4 font-black text-slate-950">
                                {extraSections.cta?.button || DEFAULT_EXTRA_SECTIONS.cta.button}
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            )}

            {isSectionVisible('updates') && (
            <section style={{ order: sectionOrder('updates') }} className={`py-16 ${template.sectionClass}`}>
                <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[1fr_0.9fr]">
                    <div>
                        <p className="text-sm font-black text-[var(--school-primary)]">সর্বশেষ আপডেট</p>
                        <h2 className="mt-2 text-3xl font-black">নোটিশ ও ভর্তি তথ্য</h2>
                        <div className="mt-6 grid gap-4">
                            {noticeRows.slice(0, 3).map((notice) => (
                                <article key={notice.id} className={`p-5 ${template.cardClass} ${panelClass}`}>
                                    <Megaphone className="mb-3 text-[var(--school-primary)]" />
                                    {notice.is_pinned && <span className="mb-3 inline-flex rounded-full bg-[var(--school-accent)] px-3 py-1 text-xs font-black text-slate-950">Pinned update</span>}
                                    <h3 className="font-black">{notice.title}</h3>
                                    {notice.body && <p className={`mt-2 text-sm font-medium ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{notice.body}</p>}
                                </article>
                            ))}
                        </div>
                    </div>
                    <div style={isDarkTemplate ? undefined : brandGradient} className={`p-6 text-white shadow-sm ${template.cardClass} ${isDarkTemplate ? softPanelClass : ''}`}>
                        <p className="text-sm font-black text-amber-200">ভর্তি</p>
                        <h3 className="mt-2 text-2xl font-black">নতুন শিক্ষাবর্ষে ভর্তি চলছে</h3>
                        <p className="mt-4 font-medium leading-8 text-white/80">
                            {page?.admission_text || 'ভর্তি সংক্রান্ত প্রয়োজনীয় তথ্য ও যোগাযোগ এখান থেকে পাওয়া যাবে।'}
                        </p>
                        <button type="button" onClick={() => navigatePage('admission')} style={brandGradient} className={`mt-5 rounded-md px-4 py-3 font-black ${primaryButtonClass}`}>ভর্তি তথ্য</button>
                    </div>
                </div>
            </section>
            )}
            </div>
            )}

            {activePage !== 'home' && (
                <section className={`${isDarkTemplate ? template.sectionClass : 'bg-white'} border-b border-current/10 py-12`}>
                    <div className="mx-auto max-w-7xl px-4">
                        <button type="button" onClick={() => navigatePage('home')} className={`mb-5 text-sm font-black ${isDarkTemplate ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}>
                            ← Home
                        </button>
                        <p className="text-sm font-black uppercase tracking-[0.22em] text-[var(--school-primary)]">{siteName}</p>
                        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h2 className={`text-4xl font-black leading-tight ${isDarkTemplate ? 'text-white' : 'text-slate-950'}`}>{activeMenuItem?.label || activeMeta.title}</h2>
                                <p className={`mt-3 max-w-2xl text-base font-bold leading-7 ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{activeMeta.subtitle}</p>
                            </div>
                            <span className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${isDarkTemplate ? 'border border-white/10 text-white/60' : 'border border-slate-200 text-slate-400'}`}>
                                {activeMeta.title}
                            </span>
                        </div>
                    </div>
                </section>
            )}

            <main>
                {activePage === 'about' && (
                <section className={`${altSectionClass} py-16`}>
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[0.8fr_1fr] lg:items-center">
                        <div className="relative">
                            <div style={brandGradient} className="flex min-h-[340px] items-center justify-center rounded-3xl p-8 text-center text-white">
                                <div>
                                    <School className="mx-auto mb-6 h-16 w-16 text-amber-300" />
                                    <p className="text-2xl font-black leading-10">{siteName}</p>
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
                            <p className={`mt-4 font-medium leading-8 ${isDarkTemplate ? bodyTextClass : 'text-slate-600'}`}>
                                {page?.about_text || `${siteName} শিক্ষার্থী, শিক্ষক ও অভিভাবকদের জন্য একসাথে শেখা এবং অগ্রগতি দেখার ডিজিটাল পরিবেশ তৈরি করছে।`}
                            </p>
                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                {highlights.map((item, index) => (
                                    <p key={`${item}-${index}`} className={`flex items-start gap-2 font-bold ${isDarkTemplate ? 'text-white/80' : 'text-slate-700'}`}>
                                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--school-primary)]" />
                                        {item}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                )}

                {activePage === 'about' && (
                <section className={`py-16 ${plainSectionClass}`}>
                    <div className="mx-auto max-w-7xl px-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {stats.map((stat, index) => (
                                <article key={`about-stat-${stat.label}-${index}`} className={`p-5 ${template.cardClass} ${panelClass}`}>
                                    <p className={`text-3xl font-black ${isDarkTemplate ? template.statValueClass : 'text-[var(--school-primary)]'}`}>{stat.value}</p>
                                    <p className={`mt-2 text-sm font-black ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{stat.label}</p>
                                </article>
                            ))}
                        </div>

                        <div className="mt-10 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
                            <section className={`p-6 ${template.cardClass} ${softPanelClass}`}>
                                <p className={sectionLeadClass}>Message</p>
                                <h2 className="mt-2 text-2xl font-black">Leadership and institution promise</h2>
                                <p className={`mt-4 font-medium leading-8 ${isDarkTemplate ? bodyTextClass : 'text-slate-600'}`}>
                                    {page?.principal_message || page?.approval_text || design.heroLine}
                                </p>
                                <div className="mt-5 space-y-3">
                                    {admissionFeatures.slice(0, 3).map((item, index) => (
                                        <p key={`about-admission-${item}-${index}`} className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-bold ${isDarkTemplate ? 'bg-white/[0.05] text-white/75' : 'bg-white text-slate-600'}`}>
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--school-primary)]" />
                                            {item}
                                        </p>
                                    ))}
                                </div>
                            </section>
                            <section className={`p-6 ${template.cardClass} ${panelClass}`}>
                                <p className={sectionLeadClass}>Academic programs</p>
                                <h2 className="mt-2 text-2xl font-black">Learning support beyond a short introduction</h2>
                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    {programItems.map((item, index) => (
                                        <article key={`about-program-${item.title}-${index}`} className={`rounded-2xl p-4 ${isDarkTemplate ? 'bg-white/[0.05]' : 'bg-slate-50'}`}>
                                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--school-primary)]">Program {index + 1}</p>
                                            <h3 className="mt-2 font-black">{item.title}</h3>
                                            <p className={`mt-2 text-sm font-medium leading-7 ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{item.description}</p>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </section>
                )}

                {activePage === 'about' && (
                <section className={`${altSectionClass} py-16`}>
                    <div className="mx-auto max-w-7xl px-4">
                        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className={sectionLeadClass}>Campus gallery</p>
                                <h2 className="mt-2 text-3xl font-black">Classroom, library and campus moments</h2>
                            </div>
                            <button type="button" onClick={() => navigatePage('contact')} className="font-black text-[var(--school-primary)]">যোগাযোগ করুন</button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {pagedGallery.map((item, index) => (
                                <article key={`about-gallery-${item.title}-${index}`} className={`overflow-hidden ${template.cardClass} ${panelClass}`}>
                                    {item.image_url ? (
                                        <img src={item.image_url} alt="" className="h-60 w-full object-cover" />
                                    ) : (
                                        <div className={`flex h-60 items-end p-5 ${websitePatternClass}`}>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--school-primary)]">Gallery</p>
                                                <p className="mt-2 text-2xl font-black">{item.title}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-5">
                                        <h3 className="text-lg font-black">{item.title}</h3>
                                        <p className={`mt-2 text-sm font-medium leading-7 ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{item.caption}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <Pagination page={galleryPage} totalItems={galleryItems.length} onPageChange={setGalleryPage} />
                    </div>
                </section>
                )}

                {activePage === 'about' && (
                <section className={`py-16 ${plainSectionClass}`}>
                    <div className="mx-auto max-w-7xl px-4">
                        <div className="mb-8 max-w-3xl">
                            <p className={sectionLeadClass}>Events and engagement</p>
                            <h2 className="mt-2 text-3xl font-black">Institution life, notices and family connection</h2>
                            <p className={`mt-3 font-medium leading-8 ${isDarkTemplate ? bodyTextClass : 'text-slate-600'}`}>
                                Academic progress becomes easier to follow when families can see activities, meetings and important dates beside regular lessons.
                            </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {pagedEvents.map((item, index) => (
                                <article key={`about-event-${item.title}-${index}`} className={`p-5 ${template.cardClass} ${panelClass}`}>
                                    <CalendarDays className="mb-4 text-[var(--school-primary)]" />
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--school-primary)]">{item.date}</p>
                                    <h3 className="mt-3 text-lg font-black">{item.title}</h3>
                                    <p className={`mt-2 text-sm font-medium leading-7 ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{item.description}</p>
                                </article>
                            ))}
                        </div>
                        <Pagination page={eventsPage} totalItems={eventItems.length} onPageChange={setEventsPage} />
                    </div>
                </section>
                )}

                {activePage === 'classes' && (
                <section className={`py-16 ${plainSectionClass}`}>
                    <div className="mx-auto max-w-7xl px-4">
                        <div className="mb-8 text-center">
                            <p className="text-sm font-black text-[var(--school-primary)]">শিক্ষা কার্যক্রম</p>
                            <h2 className="mt-2 text-3xl font-black">শ্রেণি ও বিভাগসমূহ</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {pagedClassSections.map((item, index) => (
                                <article key={`${item.title}-${index}`} className={`rounded-2xl p-5 text-center ${panelClass}`}>
                                    <div className="mb-4 text-4xl">{classIcons[index % classIcons.length]}</div>
                                    <h3 className="text-lg font-black">{item.title}</h3>
                                    <p className={`mt-2 text-sm font-medium leading-7 ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{item.description}</p>
                                    {item.badge && <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{item.badge}</span>}
                                </article>
                            ))}
                        </div>
                        <Pagination page={classesPage} totalItems={classSections.length} onPageChange={setClassesPage} />
                        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                            <section className={`rounded-3xl p-6 ${panelClass}`}>
                                <p className={sectionLeadClass}>Class planning</p>
                                <h3 className="mt-2 text-2xl font-black">Academic levels with digital lesson follow-up</h3>
                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    {highlights.slice(0, 4).map((item, index) => (
                                        <p key={`class-highlight-${item}-${index}`} className={`rounded-2xl p-4 text-sm font-bold ${isDarkTemplate ? 'bg-white/[0.05] text-white/75' : 'bg-slate-50 text-slate-600'}`}>
                                            {item}
                                        </p>
                                    ))}
                                </div>
                            </section>
                            <section className={`rounded-3xl p-6 ${softPanelClass}`}>
                                <p className={sectionLeadClass}>Files and dates</p>
                                <h3 className="mt-2 text-2xl font-black">Useful academic resources</h3>
                                <div className="mt-5 space-y-3">
                                    {safeArray(extraSections.downloads, DEFAULT_EXTRA_SECTIONS.downloads).slice(0, 3).map((item, index) => (
                                        <a key={`class-download-${item.title}-${index}`} href={item.url || '#'} target={item.url ? '_blank' : undefined} rel={item.url ? 'noreferrer' : undefined} className={`block rounded-2xl p-4 ${isDarkTemplate ? 'bg-white/[0.05]' : 'bg-white'}`}>
                                            <p className="font-black">{item.title}</p>
                                            <p className={`mt-1 text-sm font-medium ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{item.note}</p>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </section>
                )}

                {activePage === 'teachers' && (
                <section className={`${altSectionClass} py-16`}>
                    <div className="mx-auto max-w-7xl px-4">
                        <div className="mb-8 text-center">
                            <p className="text-sm font-black text-[var(--school-primary)]">আমাদের দল</p>
                            <h2 className="mt-2 text-3xl font-black">শিক্ষকমণ্ডলী</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            {pagedTeachers.map((teacher, index) => (
                                <article key={`${teacher.name}-${index}`} className={`rounded-2xl p-5 text-center ${panelClass}`}>
                                    {teacher.image_url ? (
                                        <img src={teacher.image_url} alt="" className="mx-auto mb-4 h-20 w-20 rounded-full object-cover" />
                                    ) : (
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--school-primary)] text-lg font-black text-white">
                                            {teacher.name?.slice(0, 1)}
                                        </div>
                                    )}
                                    <h3 className="font-black">{teacher.name}</h3>
                                    <p className="mt-1 text-sm font-bold text-[var(--school-primary)]">{teacher.subject}</p>
                                    <p className={`mt-2 text-sm font-medium ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{teacher.experience}</p>
                                </article>
                            ))}
                        </div>
                        <Pagination page={teachersPage} totalItems={teachers.length} onPageChange={setTeachersPage} />
                        <div className="mt-10 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                            <section className={`rounded-3xl p-6 ${softPanelClass}`}>
                                <p className={sectionLeadClass}>Teacher care</p>
                                <h3 className="mt-2 text-2xl font-black">Subject teachers, class updates and guardian trust</h3>
                                <p className={`mt-3 font-medium leading-8 ${isDarkTemplate ? bodyTextClass : 'text-slate-600'}`}>
                                    {page?.principal_message || 'Teacher profiles and public academic communication help families know who guides each learning stage.'}
                                </p>
                            </section>
                            <section className={`rounded-3xl p-6 ${panelClass}`}>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {stats.slice(0, 3).map((stat, index) => (
                                        <article key={`teacher-stat-${stat.label}-${index}`} className={`rounded-2xl p-4 ${isDarkTemplate ? 'bg-white/[0.05]' : 'bg-slate-50'}`}>
                                            <p className="text-2xl font-black text-[var(--school-primary)]">{stat.value}</p>
                                            <p className={`mt-2 text-xs font-black ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{stat.label}</p>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </section>
                )}

                {activePage === 'guardian' && (
                <section className={`${altSectionClass} py-16`}>
                    <div className="mx-auto max-w-7xl px-4">
                        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="text-sm font-black text-[var(--school-primary)]">অভিভাবক কর্নার</p>
                                <h2 className="mt-2 text-3xl font-black">ক্লাসভিত্তিক আপডেট</h2>
                                <p className={`mt-3 max-w-2xl font-medium leading-8 ${isDarkTemplate ? bodyTextClass : 'text-slate-600'}`}>
                                    অভিভাবকরা ক্লাস নির্বাচন করে শিক্ষক দেওয়া টপিক, হোমওয়ার্ক, প্রকাশিত ফলাফল, নোটিশ এবং উপস্থিতির সারাংশ দেখতে পারবেন।
                                </p>
                            </div>
                            <span className={`rounded-full px-4 py-2 text-sm font-black shadow-sm ${isDarkTemplate ? 'bg-white/10 text-white/75' : 'bg-white text-slate-600'}`}>
                                {guardianUpdates.classes.length} ক্লাস
                            </span>
                        </div>

                        {guardianLoading ? (
                            <div className={`rounded-3xl p-8 text-center font-black ${emptyPanelClass}`}>
                                ক্লাস আপডেট লোড হচ্ছে...
                            </div>
                        ) : guardianUpdates.classes.length === 0 ? (
                            <div className={`rounded-3xl p-8 text-center font-black ${emptyPanelClass}`}>
                                এখনো পাবলিক ক্লাস আপডেট তৈরি হয়নি।
                            </div>
                        ) : (
                            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                                <aside className={`rounded-3xl p-4 ${panelClass}`}>
                                    <p className="px-2 pb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">ক্লাস নির্বাচন</p>
                                    <div className="space-y-2">
                                        {guardianUpdates.classes.map((classInfo) => (
                                            <button
                                                key={classInfo.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedGuardianClassId(classInfo.id);
                                                    setGuardianStudent(null);
                                                    setGuardianCheckError('');
                                                }}
                                                className={`w-full rounded-2xl px-4 py-3 text-left font-black transition ${
                                                    selectedGuardianClass?.id === classInfo.id
                                                        ? 'bg-[var(--school-primary)] text-white shadow-lg'
                                                        : isDarkTemplate ? 'bg-white/[0.04] text-white/75 hover:bg-white/10' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                                                }`}
                                            >
                                                <span className="block">{classInfo.name}</span>
                                                <span className="mt-1 block text-xs opacity-70">{classInfo.student_count || 0} শিক্ষার্থী</span>
                                            </button>
                                        ))}
                                    </div>
                                </aside>

                                <div className="space-y-5">
                                    <section className={`rounded-3xl p-6 ${panelClass}`}>
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h3 className={`text-xl font-black ${isDarkTemplate ? 'text-white' : 'text-slate-900'}`}>নিজের সন্তানের আপডেট দেখুন</h3>
                                                <p className={`mt-1 text-sm font-bold ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>ক্লাস নির্বাচন করে রোল ও অভিভাবকের ফোন দিলে ব্যক্তিগত শিক্ষার্থী আপডেট দেখা যাবে।</p>
                                            </div>
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">যাচাইকৃত ভিউ</span>
                                        </div>
                                        <form onSubmit={verifyGuardianStudent} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                                            <input
                                                value={guardianCheckForm.rollNo}
                                                onChange={(event) => setGuardianCheckForm((current) => ({ ...current, rollNo: event.target.value }))}
                                                placeholder="শিক্ষার্থীর রোল"
                                                className={`rounded-2xl border px-4 py-3 font-bold outline-none ${inputClass}`}
                                            />
                                            <input
                                                value={guardianCheckForm.guardianPhone}
                                                onChange={(event) => setGuardianCheckForm((current) => ({ ...current, guardianPhone: event.target.value }))}
                                                placeholder="অভিভাবকের ফোন"
                                                className={`rounded-2xl border px-4 py-3 font-bold outline-none ${inputClass}`}
                                            />
                                            <button disabled={guardianCheckLoading} style={brandGradient} className="rounded-2xl px-5 py-3 font-black text-white disabled:opacity-60">
                                                {guardianCheckLoading ? 'যাচাই হচ্ছে...' : 'যাচাই করুন'}
                                            </button>
                                        </form>
                                        {guardianCheckError && (
                                            <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{guardianCheckError}</p>
                                        )}
                                        {guardianStudent && (
                                            <div className={`mt-5 space-y-4 rounded-3xl p-5 ${isDarkTemplate ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">যাচাইকৃত শিক্ষার্থী</p>
                                                        <h4 className={`mt-1 text-2xl font-black ${isDarkTemplate ? 'text-white' : 'text-slate-900'}`}>{guardianStudent.student.student_name}</h4>
                                                        <p className={`text-sm font-bold ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>রোল {guardianStudent.student.roll_no} · {guardianStudent.classInfo?.name}</p>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 text-center">
                                                        <div className={`rounded-2xl p-3 ${isDarkTemplate ? 'bg-white/[0.06]' : 'bg-white'}`}>
                                                            <p className="text-xl font-black text-emerald-700">{guardianStudent.lessons.filter((lesson) => lesson.progress?.status === 'completed').length}</p>
                                                            <p className="text-xs font-bold text-slate-400">সম্পন্ন</p>
                                                        </div>
                                                        <div className={`rounded-2xl p-3 ${isDarkTemplate ? 'bg-white/[0.06]' : 'bg-white'}`}>
                                                            <p className="text-xl font-black text-amber-700">{guardianStudent.lessons.filter((lesson) => lesson.progress?.status !== 'completed').length}</p>
                                                            <p className="text-xs font-bold text-slate-400">বাকি</p>
                                                        </div>
                                                        <div className={`rounded-2xl p-3 ${isDarkTemplate ? 'bg-white/[0.06]' : 'bg-white'}`}>
                                                            <p className={`text-xl font-black ${isDarkTemplate ? 'text-white' : 'text-slate-900'}`}>{guardianStudent.attendance.filter((item) => item.status === 'present').length}</p>
                                                            <p className="text-xs font-bold text-slate-400">উপস্থিত</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid gap-4 lg:grid-cols-2">
                                                    <div className={`rounded-2xl p-4 ${isDarkTemplate ? 'bg-white/[0.06]' : 'bg-white'}`}>
                                                        <h5 className={`font-black ${isDarkTemplate ? 'text-white' : 'text-slate-900'}`}>শিক্ষার্থীর টপিক</h5>
                                                        <div className="mt-3 space-y-3">
                                                            {guardianStudent.lessons.slice(0, 5).map((lesson) => (
                                                                <div key={lesson.id} className="rounded-xl bg-slate-50 p-3">
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div>
                                                                            <p className="text-xs font-black text-[var(--school-primary)]">{lesson.subject_name}</p>
                                                                            <p className={`font-black ${isDarkTemplate ? 'text-white' : 'text-slate-900'}`}>{lesson.title}</p>
                                                                            {lesson.homework && <p className={`mt-1 text-xs font-bold ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>হোমওয়ার্ক: {lesson.homework}</p>}
                                                                        </div>
                                                                        <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-black ${lesson.progress?.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : lesson.progress?.status === 'not_completed' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                                                                            {lesson.progress?.status === 'completed' ? 'সম্পন্ন' : lesson.progress?.status === 'not_completed' ? 'করেনি' : 'বাকি'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className={`rounded-2xl p-4 ${isDarkTemplate ? 'bg-white/[0.06]' : 'bg-white'}`}>
                                                        <h5 className={`font-black ${isDarkTemplate ? 'text-white' : 'text-slate-900'}`}>ফলাফলের সারাংশ</h5>
                                                        <div className="mt-3 space-y-3">
                                                            {guardianStudent.results.length ? guardianStudent.results.map((result) => (
                                                                <div key={result.id} className="rounded-xl bg-slate-50 p-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <p className={`font-black ${isDarkTemplate ? 'text-white' : 'text-slate-900'}`}>{result.name}</p>
                                                                        <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-slate-700">{result.percentage ?? '-'}%</span>
                                                                    </div>
                                                                    <p className={`mt-1 text-xs font-bold ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{result.obtained}/{result.total}</p>
                                                                </div>
                                                            )) : <p className={`text-sm font-bold ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>প্রকাশিত ফলাফল নেই।</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </section>

                                    <div className="grid gap-4 md:grid-cols-4">
                                        {[
                                            ['শিক্ষার্থী', selectedGuardianClass?.student_count || 0],
                                            ['বিষয়', selectedGuardianClass?.subjects?.length || 0],
                                            ['আজ উপস্থিত', selectedGuardianClass?.today_attendance?.present || 0],
                                            ['অনুপস্থিত / দেরি', `${selectedGuardianClass?.today_attendance?.absent || 0}/${selectedGuardianClass?.today_attendance?.late || 0}`]
                                        ].map(([label, value]) => (
                                            <article key={label} className={`rounded-2xl p-5 ${panelClass}`}>
                                                <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">{label}</p>
                                                <p className={`mt-2 text-2xl font-black ${isDarkTemplate ? 'text-white' : 'text-slate-900'}`}>{value}</p>
                                            </article>
                                        ))}
                                    </div>

                                    <section className={`rounded-3xl p-6 ${panelClass}`}>
                                        <div className="flex items-center gap-3">
                                            <ClipboardList className="text-[var(--school-primary)]" />
                                            <div>
                                                <h3 className={`text-xl font-black ${isDarkTemplate ? 'text-white' : 'text-slate-900'}`}>শিক্ষক দেওয়া টপিক</h3>
                                                <p className={`text-sm font-bold ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>এই ক্লাসের সর্বশেষ পড়া ও হোমওয়ার্ক</p>
                                            </div>
                                        </div>
                                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                            {selectedGuardianClass?.latest_lessons?.length ? selectedGuardianClass.latest_lessons.map((lesson) => {
                                                const subjectName = selectedGuardianClass.subjects?.find((subject) => subject.id === lesson.subject_id)?.name || 'বিষয়';
                                                return (
                                                    <article key={lesson.id} className={`rounded-2xl p-5 ${isDarkTemplate ? 'bg-white/[0.05]' : 'bg-slate-50'}`}>
                                                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--school-primary)]">{subjectName}</p>
                                                        <h4 className={`mt-2 font-black ${isDarkTemplate ? 'text-white' : 'text-slate-900'}`}>{lesson.title}</h4>
                                                        <p className="mt-1 text-xs font-bold text-slate-400">{lesson.lesson_date}</p>
                                                        {lesson.description && <p className={`mt-3 text-sm font-medium leading-7 ${isDarkTemplate ? mutedTextClass : 'text-slate-600'}`}>{lesson.description}</p>}
                                                        {lesson.homework && <p className={`mt-3 rounded-xl p-3 text-sm font-bold ${isDarkTemplate ? 'bg-white/[0.06] text-white/75' : 'bg-white text-slate-700'}`}>হোমওয়ার্ক: {lesson.homework}</p>}
                                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black">
                                                            <span className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">
                                                                পড়েছে: {lesson.progress_summary?.completed || 0}
                                                            </span>
                                                            <span className="rounded-xl bg-rose-50 px-3 py-2 text-rose-700">
                                                                বাকি: {lesson.progress_summary?.not_completed || 0}
                                                            </span>
                                                        </div>
                                                        {lesson.resource_url && (
                                                            <a href={lesson.resource_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
                                                                রিসোর্স
                                                            </a>
                                                        )}
                                                    </article>
                                                );
                                            }) : (
                                                <p className={`rounded-2xl p-5 text-sm font-bold ${isDarkTemplate ? 'bg-white/[0.05] text-white/55' : 'bg-slate-50 text-slate-500'}`}>এই ক্লাসে এখনো টপিক প্রকাশ হয়নি।</p>
                                            )}
                                        </div>
                                    </section>

                                    <section className={`rounded-3xl p-6 shadow-sm ${isDarkTemplate ? softPanelClass : 'border border-amber-100 bg-amber-50'}`}>
                                        <h3 className={`text-xl font-black ${isDarkTemplate ? 'text-white' : 'text-slate-900'}`}>অভিভাবকের করণীয়</h3>
                                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                                            <div className={`rounded-2xl p-4 ${isDarkTemplate ? 'bg-white/[0.06]' : 'bg-white'}`}>
                                                <p className="text-xs font-black text-slate-400">উপস্থিতি</p>
                                                <p className="mt-2 text-sm font-bold text-slate-700">
                                                    অনুপস্থিত বা দেরি বেশি হলে ক্লাস শিক্ষকের সাথে যোগাযোগ করুন।
                                                </p>
                                            </div>
                                            <div className={`rounded-2xl p-4 ${isDarkTemplate ? 'bg-white/[0.06]' : 'bg-white'}`}>
                                                <p className="text-xs font-black text-slate-400">হোমওয়ার্ক</p>
                                                <p className="mt-2 text-sm font-bold text-slate-700">
                                                    টপিক কার্ডের হোমওয়ার্ক দেখে বাসায় অনুশীলন করান।
                                                </p>
                                            </div>
                                            <div className={`rounded-2xl p-4 ${isDarkTemplate ? 'bg-white/[0.06]' : 'bg-white'}`}>
                                                <p className="text-xs font-black text-slate-400">ফলাফল</p>
                                                <p className="mt-2 text-sm font-bold text-slate-700">
                                                    প্রকাশিত ফলাফলের নোটিশ এলে শিক্ষার্থী পোর্টাল থেকে বিস্তারিত দেখুন।
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    <div className="grid gap-5 lg:grid-cols-2">
                                        <section className={`rounded-3xl p-6 ${panelClass}`}>
                                            <h3 className={`text-xl font-black ${isDarkTemplate ? 'text-white' : 'text-slate-900'}`}>বিষয়সমূহ</h3>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {selectedGuardianClass?.subjects?.length ? selectedGuardianClass.subjects.map((subject) => (
                                                    <span key={subject.id} className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">{subject.name}</span>
                                                )) : <p className={`text-sm font-bold ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>বিষয় যোগ করা হয়নি।</p>}
                                            </div>
                                        </section>

                                        <section className={`rounded-3xl p-6 ${panelClass}`}>
                                            <h3 className={`text-xl font-black ${isDarkTemplate ? 'text-white' : 'text-slate-900'}`}>প্রকাশিত ফলাফল</h3>
                                            <div className="mt-4 space-y-3">
                                                {selectedGuardianClass?.latest_exams?.length ? selectedGuardianClass.latest_exams.map((exam) => (
                                                    <div key={exam.id} className={`rounded-2xl p-4 ${isDarkTemplate ? 'bg-white/[0.05]' : 'bg-slate-50'}`}>
                                                        <p className={`font-black ${isDarkTemplate ? 'text-white' : 'text-slate-900'}`}>{exam.name}</p>
                                                        <p className={`mt-1 text-xs font-bold ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{exam.exam_date || exam.published_at || ''}</p>
                                                    </div>
                                                )) : <p className={`text-sm font-bold ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>এই ক্লাসে প্রকাশিত ফলাফল নেই।</p>}
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
                )}

                {activePage === 'facilities' && (
                <section className={`py-16 ${plainSectionClass}`}>
                    <div className="mx-auto max-w-7xl px-4">
                        <div className="mb-8 text-center">
                            <p className="text-sm font-black text-[var(--school-primary)]">সুযোগ-সুবিধা</p>
                            <h2 className="mt-2 text-3xl font-black">শেখার পরিবেশ</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {pagedFacilities.map((item, index) => {
                                const Icon = [GraduationCap, LibraryBig, CalendarDays, Users][index % 4];
                                return (
                                    <article key={`${item.title}-${index}`} className={`rounded-2xl p-5 ${panelClass}`}>
                                        <Icon className="mb-4 text-[var(--school-primary)]" />
                                        <h3 className="font-black">{item.title}</h3>
                                        <p className={`mt-2 text-sm font-medium leading-7 ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{item.description}</p>
                                    </article>
                                );
                            })}
                        </div>
                        <Pagination page={facilitiesPage} totalItems={facilities.length} onPageChange={setFacilitiesPage} />
                        <div className="mt-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                            <section className={`rounded-3xl p-6 ${softPanelClass}`}>
                                <p className={sectionLeadClass}>Support</p>
                                <h3 className="mt-2 text-2xl font-black">Facility means service, safety and study rhythm</h3>
                                <p className={`mt-3 font-medium leading-8 ${isDarkTemplate ? bodyTextClass : 'text-slate-600'}`}>
                                    {page?.approval_text || 'A professional campus page should show learning spaces, student care and family communication together.'}
                                </p>
                            </section>
                            <section className={`rounded-3xl p-6 ${panelClass}`}>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {programItems.slice(0, 4).map((item, index) => (
                                        <article key={`facility-program-${item.title}-${index}`} className={`rounded-2xl p-4 ${isDarkTemplate ? 'bg-white/[0.05]' : 'bg-slate-50'}`}>
                                            <p className="text-xs font-black text-[var(--school-primary)]">0{index + 1}</p>
                                            <h4 className="mt-2 font-black">{item.title}</h4>
                                            <p className={`mt-2 text-sm font-medium ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{item.description}</p>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </section>
                )}

                {activePage === 'admission' && (
                <section style={isDarkTemplate ? undefined : brandGradient} className={`${isDarkTemplate ? template.sectionClass : ''} py-16 text-white`}>
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
                        <form onSubmit={submitAdmission} className={`rounded-3xl p-6 shadow-sm ${isDarkTemplate ? panelClass : 'bg-white text-slate-900'}`}>
                            <h3 className="text-xl font-black">ভর্তি আবেদন ফর্ম</h3>
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <input required value={admissionForm.student_name} onChange={(e) => setAdmissionForm({ ...admissionForm, student_name: e.target.value })} placeholder="শিক্ষার্থীর নাম" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                                <input value={admissionForm.student_name_en} onChange={(e) => setAdmissionForm({ ...admissionForm, student_name_en: e.target.value })} placeholder="Student name in English" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                                <input required value={admissionForm.guardian_name} onChange={(e) => setAdmissionForm({ ...admissionForm, guardian_name: e.target.value })} placeholder="অভিভাবকের নাম" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                                <input required value={admissionForm.guardian_phone} onChange={(e) => setAdmissionForm({ ...admissionForm, guardian_phone: e.target.value })} placeholder="মোবাইল নম্বর" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                                <input required value={admissionForm.desired_class} onChange={(e) => setAdmissionForm({ ...admissionForm, desired_class: e.target.value })} placeholder="ভর্তির শ্রেণি" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                                <select value={admissionForm.gender} onChange={(e) => setAdmissionForm({ ...admissionForm, gender: e.target.value })} className={`rounded-xl border px-4 py-3 ${inputClass}`}>
                                    <option value="">লিঙ্গ</option>
                                    <option value="male">ছেলে</option>
                                    <option value="female">মেয়ে</option>
                                    <option value="other">অন্যান্য</option>
                                </select>
                                <input type="date" value={admissionForm.date_of_birth} onChange={(e) => setAdmissionForm({ ...admissionForm, date_of_birth: e.target.value })} className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                                <input value={admissionForm.previous_institution} onChange={(e) => setAdmissionForm({ ...admissionForm, previous_institution: e.target.value })} placeholder="আগের প্রতিষ্ঠান (থাকলে)" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                                <input type="email" value={admissionForm.guardian_email} onChange={(e) => setAdmissionForm({ ...admissionForm, guardian_email: e.target.value })} placeholder="Guardian email (optional)" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                                <input value={admissionForm.address} onChange={(e) => setAdmissionForm({ ...admissionForm, address: e.target.value })} placeholder="ঠিকানা" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                                <textarea value={admissionForm.notes} onChange={(e) => setAdmissionForm({ ...admissionForm, notes: e.target.value })} placeholder="প্রয়োজনীয় নোট বা প্রশ্ন" className={`min-h-24 rounded-xl border px-4 py-3 sm:col-span-2 ${inputClass}`} />
                            </div>
                            <button disabled={admissionSubmitting} style={brandGradient} className="mt-4 w-full rounded-xl px-4 py-3 font-black text-white disabled:opacity-60">
                                {admissionSubmitting ? 'জমা হচ্ছে...' : 'আবেদন জমা দিন'}
                            </button>
                            {admissionMessage && <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">{admissionMessage}</p>}
                            {admissionError && <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">{admissionError}</p>}
                            <div className={`mt-5 space-y-3 border-t pt-5 text-sm font-bold ${isDarkTemplate ? 'border-white/10 text-white/70' : 'border-slate-200 text-slate-600'}`}>
                                <p className="flex items-center gap-3"><Phone className="h-4 w-4 text-[var(--school-primary)]" /> {page?.contact_phone || 'ফোন নম্বর যোগ করা হয়নি'}</p>
                                <p className="flex items-center gap-3"><Mail className="h-4 w-4 text-[var(--school-primary)]" /> {page?.contact_email || 'ইমেইল যোগ করা হয়নি'}</p>
                                <p className="flex items-center gap-3"><MapPin className="h-4 w-4 text-[var(--school-primary)]" /> {page?.address || institution.village || '-'}</p>
                            </div>
                        </form>
                    </div>
                </section>
                )}

                {activePage === 'notices' && (
                <section className={`${altSectionClass} py-16`}>
                    <div className="mx-auto max-w-7xl px-4">
                        <div className="mb-8 text-center">
                            <p className="text-sm font-black text-[var(--school-primary)]">সাম্প্রতিক</p>
                            <h2 className="mt-2 text-3xl font-black">নোটিশ বোর্ড</h2>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-3">
                            {pagedNotices.map((notice) => (
                                <article key={notice.id} className={`rounded-2xl p-5 ${panelClass}`}>
                                    <Megaphone className="mb-4 text-[var(--school-primary)]" />
                                    {notice.is_pinned && <span className="mb-3 inline-flex rounded-full bg-[var(--school-accent)] px-3 py-1 text-xs font-black text-slate-950">Pinned update</span>}
                                    <h3 className="font-black">{notice.title}</h3>
                                    {notice.body && <p className={`mt-2 text-sm font-medium leading-7 ${isDarkTemplate ? mutedTextClass : 'text-slate-500'}`}>{notice.body}</p>}
                                </article>
                            ))}
                        </div>
                        <Pagination page={noticesPage} totalItems={noticeRows.length} onPageChange={setNoticesPage} />
                    </div>
                </section>
                )}

                {activePage === 'contact' && (
                    <section className={`${altSectionClass} py-16`}>
                        <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[0.8fr_1.2fr]">
                            <div>
                                <p className="text-sm font-black text-[var(--school-primary)]">যোগাযোগ</p>
                                <h2 className="mt-2 text-3xl font-black">আমাদের সাথে যোগাযোগ করুন</h2>
                                <p className={`mt-4 font-medium leading-8 ${isDarkTemplate ? bodyTextClass : 'text-slate-600'}`}>
                                    {page?.principal_message || 'ভর্তি, ফলাফল, শিক্ষক ও অফিস সংক্রান্ত যেকোনো তথ্যের জন্য যোগাযোগ করুন।'}
                                </p>
                            </div>
                            <div className={`grid gap-4 rounded-3xl p-6 sm:grid-cols-2 ${panelClass}`}>
                                <p className={`flex items-center gap-3 font-bold ${isDarkTemplate ? 'text-white/75' : 'text-slate-700'}`}><Phone className="text-[var(--school-primary)]" /> {page?.contact_phone || 'ফোন নম্বর যোগ করা হয়নি'}</p>
                                <p className={`flex items-center gap-3 font-bold ${isDarkTemplate ? 'text-white/75' : 'text-slate-700'}`}><Mail className="text-[var(--school-primary)]" /> {page?.contact_email || 'ইমেইল যোগ করা হয়নি'}</p>
                                <p className={`flex items-center gap-3 font-bold sm:col-span-2 ${isDarkTemplate ? 'text-white/75' : 'text-slate-700'}`}><MapPin className="text-[var(--school-primary)]" /> {page?.address || institution.village || '-'}</p>
                                <p className={`font-bold sm:col-span-2 ${isDarkTemplate ? 'text-white/75' : 'text-slate-700'}`}>{page?.office_hours || 'অফিস সময় যোগ করা হয়নি'}</p>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <footer className="bg-slate-950 py-12 text-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-4">
                    <div>
                        <h2 className="text-xl font-black">{siteName}</h2>
                        <p className="mt-3 text-sm font-medium leading-7 text-white/65">{footerLinks.footer_description || page?.principal_message || 'শিক্ষা, মূল্যবোধ ও অগ্রগতির জন্য নিবেদিত প্রতিষ্ঠান।'}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {Object.entries(socialLinks).filter(([, url]) => url).map(([label, url]) => (
                                <a key={label} href={url} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-white/75 hover:text-white">
                                    {label}
                                </a>
                            ))}
                        </div>
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
                        {(developer.name || developer.url || developer.facebook || developer.phone) && (
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Developed by</p>
                                <p className="mt-2 font-black text-white">{developer.name || 'Developer'}</p>
                                {developer.phone && <p className="mt-1">{developer.phone}</p>}
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {developer.url && <a href={developer.url} target="_blank" rel="noreferrer" className="text-amber-200">Website</a>}
                                    {developer.facebook && <a href={developer.facebook} target="_blank" rel="noreferrer" className="text-amber-200">Facebook</a>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
}

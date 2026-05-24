'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Clock3, Eye, Globe2, Loader2, Palette, Plus, RotateCcw, Save, Settings2, Trash2, Upload } from 'lucide-react';
import {
    getInstitutionDesignProfile,
    INSTITUTION_FONT_OPTIONS,
    INSTITUTION_MENU_OPTIONS,
    SCHOOL_WEBSITE_TEMPLATES
} from '@/lib/constants/institutionDesignProfiles';
import {
    SCHOOL_WEBSITE_DEMO_CONTENT,
    SCHOOL_WEBSITE_EXTRA_SECTIONS,
    SCHOOL_WEBSITE_HOME_SECTION_SETTINGS
} from '@/lib/constants/schoolWebsiteDefaults';
import { institutionPortalService } from '@/lib/services/institutionPortalService';
import { institutionService } from '@/lib/services/institutionService';

const DEFAULT_MENU = ['home', 'about', 'classes', 'teachers', 'facilities', 'admission', 'notices', 'contact'];
const SCHOOL_CATEGORIES = ['school', 'primary_school', 'high_school', 'college', 'dakhil_madrasa', 'alim_madrasa', 'kindergarten'];
const COLOR_PRESETS = [
    { name: 'Emerald Gold', primary: '#047857', accent: '#d4af37' },
    { name: 'Neon Violet', primary: '#7c3aed', accent: '#ec4899' },
    { name: 'College Blue', primary: '#2563eb', accent: '#06b6d4' },
    { name: 'Royal Maroon', primary: '#8b1e3f', accent: '#f59e0b' },
    { name: 'Slate Orange', primary: '#0f172a', accent: '#f97316' }
];
const LAYOUT_OPTIONS = [
    { value: 'split', label: 'Split hero' },
    { value: 'centered', label: 'Centered hero' },
    { value: 'magazine', label: 'Magazine hero' }
];
const CMS_TABS = [
    { id: 'home', label: 'Home page', hint: 'Hero, stats, highlights' },
    { id: 'academics', label: 'Academics', hint: 'Classes & facilities' },
    { id: 'teachers', label: 'Teachers', hint: 'Teacher profiles' },
    { id: 'contact', label: 'Contact', hint: 'Admission, footer, social' },
    { id: 'media', label: 'Media', hint: 'Images & reuse' },
    { id: 'seo', label: 'SEO', hint: 'Search & share preview' },
    { id: 'design', label: 'Design', hint: 'Template, color, menu' },
    { id: 'history', label: 'History', hint: 'Published versions' }
];
const HOME_SECTION_OPTIONS = [
    { key: 'hero', label: 'Hero', hint: 'Headline, hero image and first proof points' },
    { key: 'intro', label: 'About preview', hint: 'Institution story and values' },
    { key: 'teachers', label: 'Teachers preview', hint: 'Teacher trust block for visitors' },
    { key: 'journey', label: 'Student journey', hint: 'Learning path, guardian and result flow' },
    { key: 'professional', label: 'Achievements / Programs / Gallery', hint: 'Proof, campus and activity blocks' },
    { key: 'cta', label: 'CTA block', hint: 'Admission and contact action' },
    { key: 'updates', label: 'Notice & admission', hint: 'Latest notices and admission updates' }
];
const DEFAULT_HOME_SECTION_SETTINGS = SCHOOL_WEBSITE_HOME_SECTION_SETTINGS;
const DEFAULT_EXTRA_SECTIONS = SCHOOL_WEBSITE_EXTRA_SECTIONS;

const defaults = {
    ticker: SCHOOL_WEBSITE_DEMO_CONTENT.ticker,
    stats: SCHOOL_WEBSITE_DEMO_CONTENT.stats,
    highlights: SCHOOL_WEBSITE_DEMO_CONTENT.highlights,
    classes: SCHOOL_WEBSITE_DEMO_CONTENT.classes,
    teachers: SCHOOL_WEBSITE_DEMO_CONTENT.teachers,
    facilities: SCHOOL_WEBSITE_DEMO_CONTENT.facilities,
    admissionFeatures: SCHOOL_WEBSITE_DEMO_CONTENT.admissionFeatures
};

const WEBSITE_PRESETS = [
    {
        id: 'high_school',
        label: 'High School',
        theme: { template: 'dark_school', primary_color: '#7c3aed', accent_color: '#ec4899', layout_variant: 'split' },
        content: {
            hero_title: 'শিক্ষায় আলো, ফলাফলে আত্মবিশ্বাস',
            hero_subtitle: 'শৃঙ্খলা, নিয়মিত উপস্থিতি, স্মার্ট ফলাফল ও অভিভাবক সংযোগের আধুনিক স্কুল প্ল্যাটফর্ম।',
            stats: [
                { value: '৯৮%', label: 'পাসের হার' },
                { value: '১২০০+', label: 'শিক্ষার্থী' },
                { value: '৪৫+', label: 'শিক্ষক' },
                { value: '২৫+', label: 'বছরের অভিজ্ঞতা' }
            ],
            class_sections: [
                { title: 'নিম্ন মাধ্যমিক', description: '৬ষ্ঠ থেকে ৮ম শ্রেণির ভিত্তি গঠন', badge: '৬-৮' },
                { title: 'মাধ্যমিক', description: 'SSC প্রস্তুতি, ফলাফল ও টপিক ট্র্যাকিং', badge: '৯-১০' },
                { title: 'সহশিক্ষা', description: 'বিতর্ক, বিজ্ঞান ক্লাব ও সাংস্কৃতিক কার্যক্রম', badge: 'Club' }
            ],
            extra_sections: {
                ...DEFAULT_EXTRA_SECTIONS,
                achievements: [
                    { value: '৯৮%', title: 'বোর্ড সফলতা', description: 'গত বছরের সম্মিলিত পাসের হার' },
                    { value: '৩৫+', title: 'A+ শিক্ষার্থী', description: 'মেধাবী শিক্ষার্থীর ধারাবাহিক সাফল্য' }
                ],
                programs: [
                    { title: 'Science & ICT Lab', description: 'প্র্যাকটিক্যাল ক্লাস, প্রজেক্ট ও ডিজিটাল কনটেন্ট' },
                    { title: 'Guardian Progress Review', description: 'উপস্থিতি, হোমওয়ার্ক ও ফলাফল নিয়মিত অভিভাবকের কাছে' }
                ]
            }
        }
    },
    {
        id: 'college',
        label: 'College',
        theme: { template: 'dark_college', primary_color: '#2563eb', accent_color: '#f97316', layout_variant: 'magazine' },
        content: {
            hero_title: 'উচ্চশিক্ষার প্রস্তুতি এখান থেকেই',
            hero_subtitle: 'বিভাগভিত্তিক পাঠদান, ফলাফল বিশ্লেষণ, ভর্তি প্রস্তুতি ও ক্যারিয়ার গাইডেন্স।',
            stats: [
                { value: '৩টি', label: 'বিভাগ' },
                { value: '৮৫০+', label: 'শিক্ষার্থী' },
                { value: '৯৪%', label: 'পাসের হার' },
                { value: '৩০+', label: 'প্রভাষক' }
            ],
            class_sections: [
                { title: 'Science', description: 'Physics, Chemistry, Biology, Higher Math', badge: 'HSC' },
                { title: 'Humanities', description: 'History, Civics, Social Science and language', badge: 'HSC' },
                { title: 'Business Studies', description: 'Accounting, Finance and Management tracking', badge: 'HSC' }
            ],
            extra_sections: {
                ...DEFAULT_EXTRA_SECTIONS,
                achievements: [
                    { value: '৯৪%', title: 'HSC Success', description: 'সাম্প্রতিক পরীক্ষায় পাসের হার' },
                    { value: '৫০+', title: 'University Admission', description: 'উচ্চশিক্ষায় সুযোগ পাওয়া শিক্ষার্থী' }
                ],
                programs: [
                    { title: 'Admission Coaching Support', description: 'বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি ও মডেল টেস্ট' },
                    { title: 'Career Counselling', description: 'বিষয় নির্বাচন, স্কিল ও ভবিষ্যৎ পরিকল্পনা' }
                ]
            }
        }
    },
    {
        id: 'madrasa',
        label: 'Madrasha',
        theme: { template: 'dark_madrasa', primary_color: '#047857', accent_color: '#d4af37', layout_variant: 'centered' },
        content: {
            hero_title: 'দ্বীনি শিক্ষা ও আধুনিক জ্ঞানের সমন্বয়',
            hero_subtitle: 'কুরআন, হাদিস, আরবি এবং সাধারণ শিক্ষার ফলাফল ও উপস্থিতি এক প্ল্যাটফর্মে।',
            stats: [
                { value: '৩০+', label: 'বছরের খেদমত' },
                { value: '৭৫০+', label: 'শিক্ষার্থী' },
                { value: '৯৬%', label: 'ফলাফল' },
                { value: '২৫+', label: 'শিক্ষক' }
            ],
            class_sections: [
                { title: 'ইবতেদায়ি', description: 'প্রাথমিক স্তরের দ্বীনি ও সাধারণ শিক্ষা', badge: '০-৫' },
                { title: 'দাখিল', description: 'দাখিল পরীক্ষার পূর্ণ প্রস্তুতি', badge: '৬-১০' },
                { title: 'আলিম', description: 'উচ্চ মাধ্যমিক পর্যায়ের সমন্বিত পাঠদান', badge: '১১-১২' }
            ],
            extra_sections: {
                ...DEFAULT_EXTRA_SECTIONS,
                achievements: [
                    { value: '৯৬%', title: 'ফলাফল', description: 'দাখিল/আলিম পরীক্ষায় সাফল্য' },
                    { value: '১০০+', title: 'হিফজ/কিরাত', description: 'দ্বীনি দক্ষতায় অংশগ্রহণকারী শিক্ষার্থী' }
                ],
                programs: [
                    { title: 'Quran & Arabic Care', description: 'তিলাওয়াত, আরবি ভাষা ও নিয়মিত মূল্যায়ন' },
                    { title: 'Academic Tracking', description: 'সাধারণ বিষয়, ফলাফল ও অভিভাবক আপডেট' }
                ]
            }
        }
    },
    {
        id: 'kindergarten',
        label: 'Kindergarten',
        theme: { template: 'modern', primary_color: '#e11d48', accent_color: '#f59e0b', layout_variant: 'centered' },
        content: {
            hero_title: 'শিশুর আনন্দময় শেখার প্রথম ঠিকানা',
            hero_subtitle: 'নিরাপদ যত্ন, খেলাধুলার মাধ্যমে শেখা, অভিভাবক আপডেট ও শিশু-কেন্দ্রিক ক্লাসরুম।',
            stats: [
                { value: '১৫+', label: 'শিক্ষক/কেয়ার' },
                { value: '২৫০+', label: 'শিশু' },
                { value: '৬টি', label: 'ক্লাস' },
                { value: '১০০%', label: 'Guardian care' }
            ],
            class_sections: [
                { title: 'Play Group', description: 'খেলার মাধ্যমে ভাষা ও আচরণ শেখা', badge: 'PG' },
                { title: 'Nursery', description: 'হাতেখড়ি, ছড়া, ছবি ও সংখ্যা', badge: 'Nursery' },
                { title: 'KG', description: 'স্কুলের জন্য প্রস্তুতি ও আত্মবিশ্বাস', badge: 'KG' }
            ],
            extra_sections: {
                ...DEFAULT_EXTRA_SECTIONS,
                achievements: [
                    { value: '১০০%', title: 'Child care', description: 'নিরাপদ ও যত্নশীল পরিবেশ' },
                    { value: 'Daily', title: 'Parent update', description: 'শিশুর অগ্রগতি অভিভাবকের কাছে' }
                ],
                programs: [
                    { title: 'Play-based Learning', description: 'গান, ছবি, গল্প ও হাতে-কলমে শেখা' },
                    { title: 'Early Skill Tracking', description: 'ভাষা, সংখ্যা, আচরণ ও social skill পর্যবেক্ষণ' }
                ]
            }
        }
    }
];

function listValue(value, fallback) {
    return Array.isArray(value) && value.length ? value : fallback;
}

function snapshotFingerprint(content, theme) {
    return JSON.stringify({ content, theme });
}

function normalizePageSnapshot(source, fallback) {
    if (!source) return fallback;
    return Object.fromEntries(Object.keys(fallback).map((key) => [key, source[key] ?? fallback[key]]));
}

function SectionCard({ title, children, defaultOpen = false }) {
    return (
        <details className="group rounded-3xl border border-slate-200 bg-slate-50" open={defaultOpen}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 font-black text-slate-800">
                <span>{title}</span>
                <ChevronDown size={18} className="text-slate-400 transition group-open:rotate-180" />
            </summary>
            <div className="border-t border-slate-200 px-4 pb-4 pt-4">
                {children}
            </div>
        </details>
    );
}

function WebsiteLivePreview({ institution, content, theme, mode }) {
    const footerLinks = content.footer_links || {};
    const extraSections = footerLinks.extra_sections || DEFAULT_EXTRA_SECTIONS;
    const siteName = footerLinks.site_name || institution?.name || 'Institution';
    const selectedTemplate = SCHOOL_WEBSITE_TEMPLATES.find((item) => item.value === theme.template) || SCHOOL_WEBSITE_TEMPLATES[0];
    const isDark = theme.template?.startsWith('dark');
    const isEditorial = theme.template === 'editorial';
    const frameClass = isDark
        ? 'bg-slate-950 text-white'
        : isEditorial
            ? 'bg-[#fcfbf7] text-slate-950'
            : theme.template === 'modern'
                ? 'bg-slate-50 text-slate-950'
                : 'bg-[#fffdf9] text-slate-900';
    const panelClass = isDark
        ? 'border-white/10 bg-white/10 text-white'
        : isEditorial
            ? 'border-slate-900 bg-transparent text-slate-950'
            : 'border-slate-200 bg-white text-slate-900';
    const mutedClass = isDark ? 'text-white/65' : 'text-slate-500';
    const radiusClass = isEditorial ? 'rounded-none' : theme.template === 'modern' ? 'rounded-[28px]' : 'rounded-3xl';
    const heroAlignClass = theme.layout_variant === 'centered' ? 'items-center text-center' : '';
    const heroGridClass = theme.layout_variant === 'magazine' && mode !== 'mobile' ? 'md:grid-cols-[1.15fr_0.85fr]' : '';
    const heroTitleClass = theme.template === 'modern' || isDark ? 'text-4xl' : isEditorial ? 'text-5xl font-black tracking-tight' : 'text-3xl';
    const stats = listValue(content.stats, defaults.stats).slice(0, 4);
    const teachers = listValue(content.public_teachers, defaults.teachers).slice(0, 3);
    const gallery = listValue(extraSections.gallery, DEFAULT_EXTRA_SECTIONS.gallery).slice(0, 3);

    return (
        <div className={`mx-auto overflow-hidden border border-slate-200 shadow-sm ${mode === 'mobile' ? 'max-w-[340px]' : 'w-full'} ${radiusClass} ${frameClass}`}>
            <div className="flex items-center justify-between gap-3 border-b border-current/10 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    {content.logo_url ? (
                        <img src={content.logo_url} alt="" className="h-10 w-10 rounded-2xl object-cover" />
                    ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ backgroundColor: theme.accent_color }}>
                            {siteName.charAt(0)}
                        </span>
                    )}
                    <div className="min-w-0">
                        <p className="truncate text-sm font-black">{siteName}</p>
                        <p className={`truncate text-xs font-bold ${mutedClass}`}>{institution?.village || institution?.category}</p>
                    </div>
                </div>
                <span className="hidden rounded-full border border-current/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] opacity-70 md:inline-flex">
                    {selectedTemplate.label}
                </span>
                <div className={`hidden gap-3 text-xs font-black ${mutedClass} ${mode === 'mobile' ? '' : 'sm:flex'}`}>
                    {theme.menu_items?.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
                </div>
            </div>

            <div
                className={`grid gap-5 px-5 py-8 ${heroAlignClass} ${heroGridClass}`}
                style={{
                    background: content.banner_image_url
                        ? `linear-gradient(90deg, ${theme.primary_color}ee, ${theme.primary_color}aa), url(${content.banner_image_url}) center/cover`
                        : isEditorial
                            ? '#fcfbf7'
                            : `linear-gradient(135deg, ${theme.primary_color}, ${theme.accent_color})`
                }}
            >
                <div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${isEditorial ? 'border border-slate-900 text-slate-900' : 'bg-white/15 text-white'}`}>
                        {content.approval_text || institution?.category || 'Education'}
                    </span>
                    <h3 className={`mt-4 font-black leading-tight ${isEditorial ? 'text-slate-950' : 'text-white'} ${heroTitleClass}`}>
                        {content.hero_title || siteName}
                    </h3>
                    <p className={`mt-3 max-w-xl text-sm font-bold leading-6 ${isEditorial ? 'text-slate-600' : 'text-white/80'}`}>
                        {content.hero_subtitle || content.about_text || 'Website preview will update while you edit.'}
                    </p>
                </div>
                <div className={`grid gap-2 ${mode === 'mobile' ? 'grid-cols-2' : 'grid-cols-4'}`}>
                    {stats.map((item, index) => (
                        <div key={`preview-stat-${index}`} className={`border p-3 ${isEditorial ? 'border-slate-900 bg-transparent' : 'rounded-2xl border-white/20 bg-white/10'}`}>
                            <p className={`text-xl font-black ${isEditorial ? 'text-slate-950' : 'text-white'}`}>{item.value}</p>
                            <p className={`text-xs font-bold ${isEditorial ? 'text-slate-500' : 'text-white/70'}`}>{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4 p-5">
                <div className={`rounded-2xl border p-4 ${panelClass}`}>
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: theme.accent_color }}>About</p>
                    <h4 className="mt-2 text-lg font-black">{content.about_text ? 'আমাদের সম্পর্কে' : 'About section'}</h4>
                    <p className={`mt-2 line-clamp-3 text-sm font-bold leading-6 ${mutedClass}`}>{content.about_text || 'About text will appear here.'}</p>
                </div>
                <div className={`grid gap-3 ${mode === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'}`}>
                    {teachers.map((teacher, index) => (
                        <div key={`preview-teacher-${index}`} className={`rounded-2xl border p-3 ${panelClass}`}>
                            {teacher.image_url ? (
                                <img src={teacher.image_url} alt="" className="mb-3 h-20 w-full rounded-xl object-cover" />
                            ) : null}
                            <p className="text-sm font-black">{teacher.name}</p>
                            <p className={`text-xs font-bold ${mutedClass}`}>{teacher.subject}</p>
                        </div>
                    ))}
                </div>
                <div className={`grid gap-3 ${mode === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'}`}>
                    {gallery.map((item, index) => (
                        <div key={`preview-gallery-${index}`} className={`overflow-hidden rounded-2xl border ${panelClass}`}>
                            <div
                                className="h-20"
                                style={{
                                    background: item.image_url
                                        ? `url(${item.image_url}) center/cover`
                                        : `linear-gradient(135deg, ${theme.primary_color}33, ${theme.accent_color}33)`
                                }}
                            />
                            <div className="p-3">
                                <p className="text-sm font-black">{item.title || 'Gallery'}</p>
                                <p className={`text-xs font-bold ${mutedClass}`}>{item.caption || 'Campus image'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function InstitutionWebsiteManager({ institution, initialPage, onInstitutionUpdate }) {
    const design = getInstitutionDesignProfile(institution?.category);
    const schoolMode = SCHOOL_CATEGORIES.includes(institution?.category);
    const editablePage = initialPage?.draft_content && Object.keys(initialPage.draft_content).length
        ? initialPage.draft_content
        : initialPage;
    const editableTheme = initialPage?.draft_theme && Object.keys(initialPage.draft_theme).length
        ? initialPage.draft_theme
        : institution?.theme;
    const [content, setContent] = useState({
        hero_title: editablePage?.hero_title || '',
        hero_subtitle: editablePage?.hero_subtitle || '',
        about_text: editablePage?.about_text || '',
        principal_message: editablePage?.principal_message || '',
        admission_text: editablePage?.admission_text || '',
        result_text: editablePage?.result_text || '',
        contact_phone: editablePage?.contact_phone || '',
        contact_email: editablePage?.contact_email || '',
        address: editablePage?.address || '',
        established_year: editablePage?.established_year || '',
        approval_text: editablePage?.approval_text || '',
        office_hours: editablePage?.office_hours || '',
        logo_url: editablePage?.logo_url || '',
        banner_image_url: editablePage?.banner_image_url || '',
        notice_ticker: listValue(editablePage?.notice_ticker, defaults.ticker),
        stats: listValue(editablePage?.stats, defaults.stats),
        about_highlights: listValue(editablePage?.about_highlights, defaults.highlights),
        class_sections: listValue(editablePage?.class_sections, defaults.classes),
        public_teachers: listValue(editablePage?.public_teachers, defaults.teachers),
        facilities: listValue(editablePage?.facilities, defaults.facilities),
        admission_features: listValue(editablePage?.admission_features, defaults.admissionFeatures),
        footer_links: editablePage?.footer_links || {
            site_name: institution?.name || '',
            footer_description: '',
            quick_links: ['আমাদের সম্পর্কে', 'শ্রেণি', 'নোটিশ'],
            academic_links: ['ভর্তি', 'ফলাফল', 'পরীক্ষা'],
            social_links: { facebook: '', youtube: '', website: '' },
            developer: { name: '', url: '', facebook: '', phone: '' },
            seo: { title: '', description: '', keywords: '', share_image_url: '', favicon_url: '' },
            extra_sections: DEFAULT_EXTRA_SECTIONS
        }
    });
    const [theme, setTheme] = useState({
        preset: editableTheme?.preset || institution?.category || 'high_school',
        template: editableTheme?.template || 'classic',
        primary_color: editableTheme?.primary_color || design.primaryColor,
        accent_color: editableTheme?.accent_color || '#f59e0b',
        layout_variant: editableTheme?.layout_variant || 'split',
        font_family: editableTheme?.font_family || design.fontFamily,
        menu_items: editableTheme?.menu_items || DEFAULT_MENU
    });
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [restoringDraft, setRestoringDraft] = useState(false);
    const [cmsMessage, setCmsMessage] = useState('');
    const [draftSavedAt, setDraftSavedAt] = useState(initialPage?.last_draft_saved_at || null);
    const [publishedAt, setPublishedAt] = useState(initialPage?.published_at || null);
    const initialPublishedContent = initialPage?.published_content && Object.keys(initialPage.published_content).length
        ? normalizePageSnapshot(initialPage.published_content, content)
        : normalizePageSnapshot(initialPage, content);
    const [savedDraftFingerprint, setSavedDraftFingerprint] = useState(() => snapshotFingerprint(content, theme));
    const [publishedFingerprint, setPublishedFingerprint] = useState(() => snapshotFingerprint(initialPublishedContent, institution?.theme || theme));
    const [uploadingField, setUploadingField] = useState('');
    const [previewMode, setPreviewMode] = useState('desktop');
    const [activeCmsTab, setActiveCmsTab] = useState('home');
    const [mediaItems, setMediaItems] = useState([]);
    const [mediaLoading, setMediaLoading] = useState(false);
    const [mediaError, setMediaError] = useState('');
    const [mediaTarget, setMediaTarget] = useState(null);
    const [publishHistory, setPublishHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [restoringHistoryId, setRestoringHistoryId] = useState('');
    const [staffTeachers, setStaffTeachers] = useState([]);
    const draftFingerprint = useMemo(() => snapshotFingerprint(content, theme), [content, theme]);
    const hasUnsavedChanges = draftFingerprint !== savedDraftFingerprint;
    const hasUnpublishedChanges = draftFingerprint !== publishedFingerprint;
    const websiteHref = institution?.custom_domain
        ? `https://${institution.custom_domain}`
        : institution?.subdomain
            ? `http://${institution.subdomain}.localhost:3000`
            : null;
    const websiteHealth = [
        { label: 'Website URL', ok: Boolean(websiteHref), hint: websiteHref ? 'Domain/subdomain ready' : 'Subdomain or custom domain missing' },
        { label: 'Published', ok: Boolean(publishedAt), hint: publishedAt ? new Date(publishedAt).toLocaleString() : 'Publish once before sharing' },
        { label: 'Branding', ok: Boolean(content.logo_url && content.banner_image_url), hint: content.logo_url && content.banner_image_url ? 'Logo and banner ready' : 'Add logo and banner' },
        { label: 'Contact', ok: Boolean(content.contact_phone || content.contact_email), hint: content.contact_phone || content.contact_email ? 'Guardian can contact office' : 'Add phone or email' }
    ];
    const menuOptions = useMemo(() => schoolMode
        ? [
            { value: 'home', label: 'হোম' },
            { value: 'about', label: 'আমাদের সম্পর্কে' },
            { value: 'classes', label: 'শ্রেণি' },
            { value: 'teachers', label: 'শিক্ষকমণ্ডলী' },
            { value: 'facilities', label: 'সুযোগ-সুবিধা' },
            { value: 'admission', label: 'ভর্তি' },
            { value: 'notices', label: 'নোটিশ' },
            { value: 'contact', label: 'যোগাযোগ' }
        ]
        : INSTITUTION_MENU_OPTIONS, [schoolMode]);

    useEffect(() => {
        if (activeCmsTab === 'media') {
            loadMediaLibrary();
        }
        if (activeCmsTab === 'history') {
            loadPublishHistory();
        }
    }, [activeCmsTab, institution?.id]);

    useEffect(() => {
        async function loadStaffTeachers() {
            if (!institution?.id || activeCmsTab !== 'teachers' || staffTeachers.length) return;
            try {
                setStaffTeachers(await institutionPortalService.getMembers(institution.id, 'teacher'));
            } catch (error) {
                console.error('Teacher list load failed:', error);
            }
        }
        loadStaffTeachers();
    }, [activeCmsTab, institution?.id, staffTeachers.length]);

    if (!institution) {
        return (
            <div className="flex min-h-64 items-center justify-center rounded-[32px] border border-slate-200 bg-white">
                <Loader2 className="animate-spin text-slate-400" />
            </div>
        );
    }

    function updateList(field, index, key, value) {
        const next = [...content[field]];
        next[index] = key ? { ...next[index], [key]: value } : value;
        setContent({ ...content, [field]: next });
    }

    function addListItem(field, item) {
        setContent({ ...content, [field]: [...content[field], item] });
    }

    function removeListItem(field, index) {
        setContent({ ...content, [field]: content[field].filter((_, itemIndex) => itemIndex !== index) });
    }

    function updateFooterField(key, value) {
        setContent({
            ...content,
            footer_links: {
                ...content.footer_links,
                [key]: value
            }
        });
    }

    function updateFooterNested(group, key, value) {
        setContent({
            ...content,
            footer_links: {
                ...content.footer_links,
                [group]: {
                    ...(content.footer_links?.[group] || {}),
                    [key]: value
                }
            }
        });
    }

    function updateFooterList(key, index, value) {
        const next = [...listValue(content.footer_links?.[key], [])];
        next[index] = value;
        updateFooterField(key, next);
    }

    function addFooterListItem(key) {
        updateFooterField(key, [...listValue(content.footer_links?.[key], []), '']);
    }

    function updateExtraList(section, index, key, value) {
        const extraSections = content.footer_links?.extra_sections || DEFAULT_EXTRA_SECTIONS;
        const nextItems = [...listValue(extraSections[section], [])];
        nextItems[index] = { ...nextItems[index], [key]: value };
        updateFooterNested('extra_sections', section, nextItems);
    }

    function addExtraItem(section, item) {
        const extraSections = content.footer_links?.extra_sections || DEFAULT_EXTRA_SECTIONS;
        updateFooterNested('extra_sections', section, [...listValue(extraSections[section], []), item]);
    }

    function removeExtraItem(section, index) {
        const extraSections = content.footer_links?.extra_sections || DEFAULT_EXTRA_SECTIONS;
        updateFooterNested('extra_sections', section, listValue(extraSections[section], []).filter((_, itemIndex) => itemIndex !== index));
    }

    function moveExtraItem(section, index, direction) {
        const extraSections = content.footer_links?.extra_sections || DEFAULT_EXTRA_SECTIONS;
        const nextItems = [...listValue(extraSections[section], [])];
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= nextItems.length) return;
        [nextItems[index], nextItems[nextIndex]] = [nextItems[nextIndex], nextItems[index]];
        updateFooterNested('extra_sections', section, nextItems);
    }

    function updateExtraCta(key, value) {
        const extraSections = content.footer_links?.extra_sections || DEFAULT_EXTRA_SECTIONS;
        updateFooterNested('extra_sections', 'cta', {
            ...(extraSections.cta || {}),
            [key]: value
        });
    }

    function updateHomeSection(key, patch) {
        const extraSections = content.footer_links?.extra_sections || DEFAULT_EXTRA_SECTIONS;
        updateFooterNested('extra_sections', 'home_sections', {
            ...DEFAULT_HOME_SECTION_SETTINGS,
            ...(extraSections.home_sections || {}),
            [key]: {
                ...DEFAULT_HOME_SECTION_SETTINGS[key],
                ...(extraSections.home_sections?.[key] || {}),
                ...patch
            }
        });
    }

    function importTeacherProfile(member) {
        addListItem('public_teachers', {
            name: member.display_name || member.title || 'Teacher',
            subject: member.title || 'Teacher',
            experience: 'Institution teacher',
            image_url: ''
        });
    }

    async function loadMediaLibrary() {
        if (!institution?.id) return;
        setMediaLoading(true);
        setMediaError('');
        try {
            const response = await fetch(`/api/admin/upload-institution-image?institutionId=${encodeURIComponent(institution.id)}`, {
                cache: 'no-store'
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Media library failed');
            setMediaItems(result.media || []);
        } catch (error) {
            setMediaError(error.message || 'Media library failed');
        } finally {
            setMediaLoading(false);
        }
    }

    async function loadPublishHistory() {
        if (!institution?.id) return;
        setHistoryLoading(true);
        try {
            setPublishHistory(await institutionPortalService.getPublishHistory(institution.id));
        } catch (error) {
            setCmsMessage(error.message || 'Publish history failed to load.');
        } finally {
            setHistoryLoading(false);
        }
    }

    function openMediaTarget(type, index) {
        setMediaTarget({ type, index });
        setActiveCmsTab('media');
    }

    function applyMedia(url) {
        if (!mediaTarget) return;

        if (mediaTarget.type === 'logo') setContent({ ...content, logo_url: url });
        if (mediaTarget.type === 'banner') setContent({ ...content, banner_image_url: url });
        if (mediaTarget.type === 'teacher') updateList('public_teachers', mediaTarget.index, 'image_url', url);
        if (mediaTarget.type === 'gallery') updateExtraList('gallery', mediaTarget.index, 'image_url', url);
        if (mediaTarget.type === 'share') updateFooterNested('seo', 'share_image_url', url);
        if (mediaTarget.type === 'favicon') updateFooterNested('seo', 'favicon_url', url);

        setMediaTarget(null);
    }

    async function deleteMedia(item) {
        setMediaError('');
        try {
            const response = await fetch('/api/admin/upload-institution-image', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ institutionId: institution.id, path: item.path })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Media delete failed');
            setMediaItems((current) => current.filter((media) => media.path !== item.path));
        } catch (error) {
            setMediaError(error.message || 'Media delete failed');
        }
    }

    async function uploadImage(file, fieldLabel, onUrl) {
        if (!file) return;
        setUploadingField(fieldLabel);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('institutionId', institution.id);
            const response = await fetch('/api/admin/upload-institution-image', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Image upload failed');
            }
            onUrl(result.publicUrl);
            if (activeCmsTab === 'media') loadMediaLibrary();
        } finally {
            setUploadingField('');
        }
    }

    function applyWebsitePreset(preset) {
        setTheme({
            ...theme,
            ...preset.theme
        });
        setContent({
            ...content,
            ...preset.content,
            footer_links: {
                ...content.footer_links,
                extra_sections: {
                    ...(content.footer_links?.extra_sections || DEFAULT_EXTRA_SECTIONS),
                    ...(preset.content.extra_sections || {})
                }
            }
        });
    }

    async function saveDraft(event) {
        event?.preventDefault();
        setSaving(true);
        setCmsMessage('');
        try {
            const page = await institutionPortalService.savePageDraft(institution.id, content, theme);
            setDraftSavedAt(page.last_draft_saved_at);
            setSavedDraftFingerprint(draftFingerprint);
            setCmsMessage('Draft saved. Public website has not changed yet.');
        } catch (error) {
            setCmsMessage(error.message || 'Draft save failed.');
        } finally {
            setSaving(false);
        }
    }

    async function publishWebsite() {
        setPublishing(true);
        setCmsMessage('');
        try {
            const page = await institutionPortalService.publishPage(institution.id, content, theme);
            await institutionService.updateBranding(institution.id, theme);
            const history = await institutionPortalService.createPublishHistory(institution.id, content, theme);
            setDraftSavedAt(page.last_draft_saved_at);
            setPublishedAt(page.published_at);
            setSavedDraftFingerprint(draftFingerprint);
            setPublishedFingerprint(draftFingerprint);
            setPublishHistory((current) => [history, ...current]);
            setCmsMessage('Website published. Visitors will now see these changes.');
            onInstitutionUpdate?.({ ...institution, theme });
        } catch (error) {
            setCmsMessage(error.message || 'Website publish failed.');
        } finally {
            setPublishing(false);
        }
    }

    async function restorePublishedDraft() {
        setRestoringDraft(true);
        setCmsMessage('');
        try {
            const page = await institutionPortalService.getPage(institution.id);
            const hasPublishedContent = page?.published_content && Object.keys(page.published_content).length > 0;
            const liveContent = hasPublishedContent
                ? page.published_content
                : Object.fromEntries(Object.keys(content).map((key) => [key, page?.[key] ?? content[key]]));
            const liveTheme = institution?.theme || theme;
            const nextContent = { ...content, ...liveContent };
            const savedDraft = await institutionPortalService.savePageDraft(institution.id, nextContent, liveTheme);
            setContent(nextContent);
            const restoredTheme = {
                ...theme,
                ...liveTheme,
                menu_items: liveTheme.menu_items || theme.menu_items
            };
            setTheme(restoredTheme);
            setDraftSavedAt(savedDraft.last_draft_saved_at);
            const restoredFingerprint = snapshotFingerprint(nextContent, restoredTheme);
            setSavedDraftFingerprint(restoredFingerprint);
            setPublishedFingerprint(restoredFingerprint);
            setCmsMessage('Draft reset to the current live website. Publish only after reviewing it.');
        } catch (error) {
            setCmsMessage(error.message || 'Draft reset failed.');
        } finally {
            setRestoringDraft(false);
        }
    }

    async function restoreHistoryDraft(version) {
        setRestoringHistoryId(version.id);
        setCmsMessage('');
        try {
            const restoredContent = normalizePageSnapshot(version.content_snapshot, content);
            const restoredTheme = {
                ...theme,
                ...(version.theme_snapshot || {}),
                menu_items: version.theme_snapshot?.menu_items || theme.menu_items
            };
            const savedDraft = await institutionPortalService.savePageDraft(institution.id, restoredContent, restoredTheme);
            setContent(restoredContent);
            setTheme(restoredTheme);
            setDraftSavedAt(savedDraft.last_draft_saved_at);
            setSavedDraftFingerprint(snapshotFingerprint(restoredContent, restoredTheme));
            setCmsMessage('Published version restored into draft. Review it, then publish when ready.');
            setActiveCmsTab('home');
        } catch (error) {
            setCmsMessage(error.message || 'Version restore failed.');
        } finally {
            setRestoringHistoryId('');
        }
    }

    return (
        <form onSubmit={saveDraft} className="rounded-[32px] border border-slate-200 bg-white p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <Settings2 className="text-slate-700" />
                <div>
                    <h2 className="text-xl font-black text-slate-800">Website CMS</h2>
                    <p className="text-sm font-bold text-slate-400">প্রতিষ্ঠানের public website এখান থেকে নিয়ন্ত্রণ করুন।</p>
                </div>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-black ${hasUnsavedChanges ? 'bg-rose-100 text-rose-700' : hasUnpublishedChanges ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {hasUnsavedChanges ? 'Unsaved edits' : hasUnpublishedChanges ? 'Draft pending publish' : 'Live is up to date'}
                </span>
                {websiteHref && (
                    <a href={websiteHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:border-slate-400">
                        <Eye size={16} />
                        View Live
                    </a>
                )}
            </div>

            <div className="mb-5 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-4">
                {websiteHealth.map((item) => (
                    <div key={item.label} className="rounded-2xl bg-white p-3">
                        <p className={`text-xs font-black uppercase tracking-[0.16em] ${item.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{item.label}</p>
                        <p className="mt-2 text-sm font-bold text-slate-600">{item.hint}</p>
                    </div>
                ))}
            </div>

            <div className="mb-5 grid gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-slate-700 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                    <p className="font-black text-slate-900">Draft and publish are separate.</p>
                    <p className="mt-1 text-slate-600">Save Draft keeps edits inside CMS. Publish Website updates the live tenant website.</p>
                    <p className="mt-2 text-xs text-slate-500">
                        Draft saved: {draftSavedAt ? new Date(draftSavedAt).toLocaleString() : 'not saved yet'}
                        {' | '}
                        Last published: {publishedAt ? new Date(publishedAt).toLocaleString() : 'not published yet'}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button disabled={saving || publishing || restoringDraft} type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-black text-white disabled:opacity-60">
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Draft
                    </button>
                    <button disabled={saving || publishing || restoringDraft} type="button" onClick={publishWebsite} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 font-black text-white disabled:opacity-60">
                        {publishing ? <Loader2 size={18} className="animate-spin" /> : <Globe2 size={18} />}
                        Publish Website
                    </button>
                    <button disabled={saving || publishing || restoringDraft} type="button" onClick={restorePublishedDraft} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-black text-slate-700 disabled:opacity-60">
                        {restoringDraft ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
                        Reset to Live
                    </button>
                </div>
                {cmsMessage && <p className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 md:col-span-2">{cmsMessage}</p>}
            </div>

            {schoolMode && (
                <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">One-click website preset</p>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {WEBSITE_PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => applyWebsitePreset(preset)}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left font-black text-slate-700 transition hover:border-slate-500 hover:shadow-sm"
                            >
                                <span className="block">{preset.label}</span>
                                <span className="mt-1 block text-xs font-bold text-slate-400">Template + color + content</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="mb-5 grid gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
                {CMS_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveCmsTab(tab.id)}
                        className={`rounded-2xl px-4 py-3 text-left transition ${activeCmsTab === tab.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                    >
                        <span className="block text-sm font-black">{tab.label}</span>
                        <span className={`mt-1 block text-[11px] font-bold ${activeCmsTab === tab.id ? 'text-white/60' : 'text-slate-400'}`}>
                            {tab.hint}
                        </span>
                    </button>
                ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
                <div className="space-y-4">
                    {activeCmsTab === 'home' && (
                    <SectionCard title="মূল তথ্য" defaultOpen>
                        <div className="grid gap-3">
                            <div className="grid gap-3 md:grid-cols-2">
                                <label className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3">
                                    <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Logo</span>
                                    <input value={content.logo_url} onChange={(e) => setContent({ ...content, logo_url: e.target.value })} placeholder="Logo image URL" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                                    <span className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-black text-white">
                                        {uploadingField === 'logo' ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                                        Upload logo
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], 'logo', (url) => setContent({ ...content, logo_url: url }))} />
                                    </span>
                                    <button type="button" onClick={() => openMediaTarget('logo')} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">Choose from library</button>
                                </label>
                                <label className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3">
                                    <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Banner</span>
                                    <input value={content.banner_image_url} onChange={(e) => setContent({ ...content, banner_image_url: e.target.value })} placeholder="Banner image URL" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                                    <span className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-black text-white">
                                        {uploadingField === 'banner' ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                                        Upload banner
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], 'banner', (url) => setContent({ ...content, banner_image_url: url }))} />
                                    </span>
                                    <button type="button" onClick={() => openMediaTarget('banner')} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">Choose from library</button>
                                </label>
                            </div>
                            <input value={content.hero_title} onChange={(e) => setContent({ ...content, hero_title: e.target.value })} placeholder="Hero title" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
                            <input value={content.hero_subtitle} onChange={(e) => setContent({ ...content, hero_subtitle: e.target.value })} placeholder="Hero subtitle" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
                            <textarea value={content.about_text} onChange={(e) => setContent({ ...content, about_text: e.target.value })} placeholder="About text" className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3" />
                            <textarea value={content.principal_message} onChange={(e) => setContent({ ...content, principal_message: e.target.value })} placeholder="Principal message" className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" />
                        </div>
                    </SectionCard>
                    )}

                    {schoolMode && (
                        <>
                            {activeCmsTab === 'home' && (
                            <SectionCard title="Hero ও পরিচিতি">
                                <div className="grid gap-3 md:grid-cols-3">
                                    <input value={content.established_year} onChange={(e) => setContent({ ...content, established_year: e.target.value })} placeholder="প্রতিষ্ঠার বছর" className="rounded-2xl border border-slate-200 px-4 py-3" />
                                    <input value={content.approval_text} onChange={(e) => setContent({ ...content, approval_text: e.target.value })} placeholder="অনুমোদন/ট্যাগলাইন" className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" />
                                </div>
                                <div className="mt-4 space-y-3">
                                    {content.notice_ticker.map((item, index) => (
                                        <div key={`ticker-${index}`} className="flex gap-2">
                                            <input value={item} onChange={(e) => updateList('notice_ticker', index, null, e.target.value)} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3" />
                                            <button type="button" onClick={() => removeListItem('notice_ticker', index)} className="rounded-2xl bg-white px-3 text-slate-400"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addListItem('notice_ticker', '')} className="inline-flex items-center gap-2 text-sm font-black text-slate-700">
                                        <Plus size={16} /> ticker যোগ করুন
                                    </button>
                                </div>
                            </SectionCard>
                            )}

                            {activeCmsTab === 'home' && (
                            <SectionCard title="পরিসংখ্যান">
                                <div className="grid gap-3 md:grid-cols-2">
                                    {content.stats.map((item, index) => (
                                        <div key={`stat-${index}`} className="rounded-2xl bg-white p-3">
                                            <input value={item.value} onChange={(e) => updateList('stats', index, 'value', e.target.value)} placeholder="সংখ্যা" className="mb-2 w-full rounded-xl border border-slate-200 px-3 py-2" />
                                            <input value={item.label} onChange={(e) => updateList('stats', index, 'label', e.target.value)} placeholder="লেবেল" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => addListItem('stats', { value: '', label: '' })} className="mt-3 inline-flex items-center gap-2 text-sm font-black text-slate-700">
                                    <Plus size={16} /> stat যোগ করুন
                                </button>
                            </SectionCard>
                            )}

                            {activeCmsTab === 'home' && (
                            <SectionCard title="হাইলাইট">
                                <div className="space-y-3">
                                    {content.about_highlights.map((item, index) => (
                                        <div key={`highlight-${index}`} className="flex gap-2">
                                            <input value={item} onChange={(e) => updateList('about_highlights', index, null, e.target.value)} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3" />
                                            <button type="button" onClick={() => removeListItem('about_highlights', index)} className="rounded-2xl bg-white px-3 text-slate-400"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => addListItem('about_highlights', '')} className="mt-3 inline-flex items-center gap-2 text-sm font-black text-slate-700">
                                    <Plus size={16} /> highlight যোগ করুন
                                </button>
                            </SectionCard>
                            )}

                            {activeCmsTab === 'academics' && (
                            <SectionCard title="শ্রেণি" defaultOpen>
                                <div className="space-y-3">
                                    {content.class_sections.map((item, index) => (
                                        <div key={`class-${index}`} className="grid gap-2 rounded-2xl bg-white p-3 md:grid-cols-[1fr_1fr_0.5fr_auto]">
                                            <input value={item.title} onChange={(e) => updateList('class_sections', index, 'title', e.target.value)} placeholder="শিরোনাম" className="rounded-xl border border-slate-200 px-3 py-2" />
                                            <input value={item.description} onChange={(e) => updateList('class_sections', index, 'description', e.target.value)} placeholder="বর্ণনা" className="rounded-xl border border-slate-200 px-3 py-2" />
                                            <input value={item.badge || ''} onChange={(e) => updateList('class_sections', index, 'badge', e.target.value)} placeholder="ব্যাজ" className="rounded-xl border border-slate-200 px-3 py-2" />
                                            <button type="button" onClick={() => removeListItem('class_sections', index)} className="rounded-xl px-3 text-slate-400"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => addListItem('class_sections', { title: '', description: '', badge: '' })} className="mt-3 inline-flex items-center gap-2 text-sm font-black text-slate-700">
                                    <Plus size={16} /> শ্রেণি যোগ করুন
                                </button>
                            </SectionCard>
                            )}

                            {activeCmsTab === 'teachers' && (
                            <SectionCard title="শিক্ষকমণ্ডলী" defaultOpen>
                                {staffTeachers.length > 0 && (
                                    <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Portal teacher থেকে public profile</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {staffTeachers.map((member) => (
                                                <button key={member.id} type="button" onClick={() => importTeacherProfile(member)} className="rounded-full bg-white px-3 py-2 text-xs font-black text-emerald-800">
                                                    + {member.display_name || member.title || 'Teacher'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {content.public_teachers.map((item, index) => (
                                        <div key={`teacher-${index}`} className="grid gap-2 rounded-2xl bg-white p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                                            <input value={item.name} onChange={(e) => updateList('public_teachers', index, 'name', e.target.value)} placeholder="নাম" className="rounded-xl border border-slate-200 px-3 py-2" />
                                            <input value={item.subject} onChange={(e) => updateList('public_teachers', index, 'subject', e.target.value)} placeholder="বিষয়" className="rounded-xl border border-slate-200 px-3 py-2" />
                                            <input value={item.experience} onChange={(e) => updateList('public_teachers', index, 'experience', e.target.value)} placeholder="অভিজ্ঞতা" className="rounded-xl border border-slate-200 px-3 py-2" />
                                            <input value={item.image_url || ''} onChange={(e) => updateList('public_teachers', index, 'image_url', e.target.value)} placeholder="Photo URL" className="rounded-xl border border-slate-200 px-3 py-2 md:col-span-2" />
                                            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">
                                                {uploadingField === `teacher-${index}` ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                                                Upload photo
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], `teacher-${index}`, (url) => updateList('public_teachers', index, 'image_url', url))} />
                                            </label>
                                            <button type="button" onClick={() => openMediaTarget('teacher', index)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700 md:col-span-3">Choose teacher photo from library</button>
                                            <button type="button" onClick={() => removeListItem('public_teachers', index)} className="rounded-xl px-3 text-slate-400"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => addListItem('public_teachers', { name: '', subject: '', experience: '', image_url: '' })} className="mt-3 inline-flex items-center gap-2 text-sm font-black text-slate-700">
                                    <Plus size={16} /> শিক্ষক যোগ করুন
                                </button>
                            </SectionCard>
                            )}

                            {activeCmsTab === 'academics' && (
                            <SectionCard title="সুযোগ-সুবিধা" defaultOpen>
                                <div className="space-y-3">
                                    {content.facilities.map((item, index) => (
                                        <div key={`facility-${index}`} className="grid gap-2 rounded-2xl bg-white p-3 md:grid-cols-[1fr_1.2fr_auto]">
                                            <input value={item.title} onChange={(e) => updateList('facilities', index, 'title', e.target.value)} placeholder="শিরোনাম" className="rounded-xl border border-slate-200 px-3 py-2" />
                                            <input value={item.description} onChange={(e) => updateList('facilities', index, 'description', e.target.value)} placeholder="বর্ণনা" className="rounded-xl border border-slate-200 px-3 py-2" />
                                            <button type="button" onClick={() => removeListItem('facilities', index)} className="rounded-xl px-3 text-slate-400"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => addListItem('facilities', { title: '', description: '' })} className="mt-3 inline-flex items-center gap-2 text-sm font-black text-slate-700">
                                    <Plus size={16} /> সুবিধা যোগ করুন
                                </button>
                            </SectionCard>
                            )}

                            {activeCmsTab === 'home' && (
                            <SectionCard title="Professional homepage sections">
                                <div className="space-y-4">
                                    <div className="rounded-2xl bg-white p-3">
                                        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Homepage section visibility & order</p>
                                        <div className="grid gap-2 md:grid-cols-2">
                                            {HOME_SECTION_OPTIONS.map((section) => {
                                                const settings = {
                                                    ...DEFAULT_HOME_SECTION_SETTINGS[section.key],
                                                    ...(content.footer_links?.extra_sections?.home_sections?.[section.key] || {})
                                                };
                                                return (
                                                    <div key={section.key} className="grid gap-2 rounded-xl border border-slate-100 px-3 py-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <label className="flex items-start gap-2 text-sm font-black text-slate-700">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={settings.enabled !== false}
                                                                    onChange={(event) => updateHomeSection(section.key, { enabled: event.target.checked })}
                                                                    className="mt-1"
                                                                />
                                                                <span>
                                                                    <span className="block">{section.label}</span>
                                                                    <span className="mt-1 block text-xs font-bold leading-5 text-slate-400">{section.hint}</span>
                                                                </span>
                                                            </label>
                                                            <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${settings.enabled !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                                                {settings.enabled !== false ? 'Live' : 'Hidden'}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2">
                                                            <span className="text-xs font-black text-slate-400">Order</span>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={settings.order || 1}
                                                                onChange={(event) => updateHomeSection(section.key, { order: Number(event.target.value) || 1 })}
                                                                className="rounded-lg border border-slate-200 px-2 py-1 text-sm font-bold"
                                                            />
                                                            <button type="button" onClick={() => updateHomeSection(section.key, { order: Math.max(1, Number(settings.order || 1) - 1) })} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-black text-slate-600">Up</button>
                                                            <button type="button" onClick={() => updateHomeSection(section.key, { order: Number(settings.order || 1) + 1 })} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-black text-slate-600">Down</button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-white p-3">
                                        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Achievements</p>
                                        <div className="space-y-2">
                                            {listValue(content.footer_links?.extra_sections?.achievements, DEFAULT_EXTRA_SECTIONS.achievements).map((item, index) => (
                                                <div key={`achievement-${index}`} className="grid gap-2 md:grid-cols-[0.65fr_0.65fr_1fr_auto]">
                                                    <input value={item.value || ''} onChange={(e) => updateExtraList('achievements', index, 'value', e.target.value)} placeholder="98%" className="rounded-xl border border-slate-200 px-3 py-2" />
                                                    <input value={item.title || ''} onChange={(e) => updateExtraList('achievements', index, 'title', e.target.value)} placeholder="Title" className="rounded-xl border border-slate-200 px-3 py-2" />
                                                    <input value={item.description || ''} onChange={(e) => updateExtraList('achievements', index, 'description', e.target.value)} placeholder="Description" className="rounded-xl border border-slate-200 px-3 py-2" />
                                                    <button type="button" onClick={() => removeExtraItem('achievements', index)} className="rounded-xl px-3 text-slate-400"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={() => addExtraItem('achievements', { title: '', value: '', description: '' })} className="mt-3 text-sm font-black text-slate-700">+ achievement</button>
                                    </div>

                                    <div className="rounded-2xl bg-white p-3">
                                        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Programs / departments</p>
                                        <div className="space-y-2">
                                            {listValue(content.footer_links?.extra_sections?.programs, DEFAULT_EXTRA_SECTIONS.programs).map((item, index) => (
                                                <div key={`program-${index}`} className="grid gap-2 md:grid-cols-[1fr_1.4fr_auto]">
                                                    <input value={item.title || ''} onChange={(e) => updateExtraList('programs', index, 'title', e.target.value)} placeholder="Program title" className="rounded-xl border border-slate-200 px-3 py-2" />
                                                    <input value={item.description || ''} onChange={(e) => updateExtraList('programs', index, 'description', e.target.value)} placeholder="Description" className="rounded-xl border border-slate-200 px-3 py-2" />
                                                    <button type="button" onClick={() => removeExtraItem('programs', index)} className="rounded-xl px-3 text-slate-400"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={() => addExtraItem('programs', { title: '', description: '' })} className="mt-3 text-sm font-black text-slate-700">+ program</button>
                                    </div>

                                    <div className="rounded-2xl bg-white p-3">
                                        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Events</p>
                                        <div className="space-y-2">
                                            {listValue(content.footer_links?.extra_sections?.events, DEFAULT_EXTRA_SECTIONS.events).map((item, index) => (
                                                <div key={`event-${index}`} className="grid gap-2 md:grid-cols-[0.7fr_1fr_1.4fr_auto]">
                                                    <input value={item.date || ''} onChange={(e) => updateExtraList('events', index, 'date', e.target.value)} placeholder="Date" className="rounded-xl border border-slate-200 px-3 py-2" />
                                                    <input value={item.title || ''} onChange={(e) => updateExtraList('events', index, 'title', e.target.value)} placeholder="Event title" className="rounded-xl border border-slate-200 px-3 py-2" />
                                                    <input value={item.description || ''} onChange={(e) => updateExtraList('events', index, 'description', e.target.value)} placeholder="Description" className="rounded-xl border border-slate-200 px-3 py-2" />
                                                    <button type="button" onClick={() => removeExtraItem('events', index)} className="rounded-xl px-3 text-slate-400"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={() => addExtraItem('events', { title: '', date: '', description: '' })} className="mt-3 text-sm font-black text-slate-700">+ event</button>
                                    </div>

                                    <div className="rounded-2xl bg-white p-3">
                                        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Gallery</p>
                                        <div className="space-y-2">
                                            {listValue(content.footer_links?.extra_sections?.gallery, DEFAULT_EXTRA_SECTIONS.gallery).map((item, index) => (
                                                <div key={`gallery-${index}`} className="grid gap-2 rounded-2xl border border-slate-100 p-3 md:grid-cols-[1fr_1.2fr_1fr_auto]">
                                                    <input value={item.title || ''} onChange={(e) => updateExtraList('gallery', index, 'title', e.target.value)} placeholder="Title" className="rounded-xl border border-slate-200 px-3 py-2" />
                                                    <div className="grid gap-2">
                                                        <input value={item.image_url || ''} onChange={(e) => updateExtraList('gallery', index, 'image_url', e.target.value)} placeholder="Image URL" className="rounded-xl border border-slate-200 px-3 py-2" />
                                                        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">
                                                            {uploadingField === `gallery-${index}` ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                                                            Upload image
                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], `gallery-${index}`, (url) => updateExtraList('gallery', index, 'image_url', url))} />
                                                        </label>
                                                        <button type="button" onClick={() => openMediaTarget('gallery', index)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">Choose from library</button>
                                                    </div>
                                                    <input value={item.caption || ''} onChange={(e) => updateExtraList('gallery', index, 'caption', e.target.value)} placeholder="Caption" className="rounded-xl border border-slate-200 px-3 py-2" />
                                                    <div className="grid gap-2">
                                                        <button type="button" onClick={() => moveExtraItem('gallery', index, -1)} disabled={index === 0} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 disabled:opacity-35">Move up</button>
                                                        <button type="button" onClick={() => moveExtraItem('gallery', index, 1)} disabled={index === listValue(content.footer_links?.extra_sections?.gallery, DEFAULT_EXTRA_SECTIONS.gallery).length - 1} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 disabled:opacity-35">Move down</button>
                                                        <button type="button" onClick={() => removeExtraItem('gallery', index)} className="rounded-xl border border-rose-100 px-3 py-2 text-rose-500"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={() => addExtraItem('gallery', { title: '', image_url: '', caption: '' })} className="mt-3 text-sm font-black text-slate-700">+ gallery item</button>
                                    </div>

                                    <div className="rounded-2xl bg-white p-3">
                                        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">FAQ block</p>
                                        <div className="space-y-2">
                                            {listValue(content.footer_links?.extra_sections?.faqs, DEFAULT_EXTRA_SECTIONS.faqs).map((item, index) => (
                                                <div key={`faq-${index}`} className="grid gap-2 md:grid-cols-[1fr_1.4fr_auto]">
                                                    <input value={item.question || ''} onChange={(e) => updateExtraList('faqs', index, 'question', e.target.value)} placeholder="Question" className="rounded-xl border border-slate-200 px-3 py-2" />
                                                    <input value={item.answer || ''} onChange={(e) => updateExtraList('faqs', index, 'answer', e.target.value)} placeholder="Answer" className="rounded-xl border border-slate-200 px-3 py-2" />
                                                    <button type="button" onClick={() => removeExtraItem('faqs', index)} className="rounded-xl px-3 text-slate-400"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={() => addExtraItem('faqs', { question: '', answer: '' })} className="mt-3 text-sm font-black text-slate-700">+ FAQ</button>
                                    </div>

                                    <div className="rounded-2xl bg-white p-3">
                                        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Downloads / useful links</p>
                                        <div className="space-y-2">
                                            {listValue(content.footer_links?.extra_sections?.downloads, DEFAULT_EXTRA_SECTIONS.downloads).map((item, index) => (
                                                <div key={`download-${index}`} className="grid gap-2 md:grid-cols-[1fr_1.2fr_1fr_auto]">
                                                    <input value={item.title || ''} onChange={(e) => updateExtraList('downloads', index, 'title', e.target.value)} placeholder="Title" className="rounded-xl border border-slate-200 px-3 py-2" />
                                                    <input value={item.url || ''} onChange={(e) => updateExtraList('downloads', index, 'url', e.target.value)} placeholder="URL" className="rounded-xl border border-slate-200 px-3 py-2" />
                                                    <input value={item.note || ''} onChange={(e) => updateExtraList('downloads', index, 'note', e.target.value)} placeholder="Short note" className="rounded-xl border border-slate-200 px-3 py-2" />
                                                    <button type="button" onClick={() => removeExtraItem('downloads', index)} className="rounded-xl px-3 text-slate-400"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={() => addExtraItem('downloads', { title: '', url: '', note: '' })} className="mt-3 text-sm font-black text-slate-700">+ download</button>
                                    </div>

                                    <div className="grid gap-2 rounded-2xl bg-white p-3">
                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Call to action</p>
                                        <input value={content.footer_links?.extra_sections?.cta?.title || DEFAULT_EXTRA_SECTIONS.cta.title} onChange={(e) => updateExtraCta('title', e.target.value)} placeholder="CTA title" className="rounded-xl border border-slate-200 px-3 py-2" />
                                        <input value={content.footer_links?.extra_sections?.cta?.text || DEFAULT_EXTRA_SECTIONS.cta.text} onChange={(e) => updateExtraCta('text', e.target.value)} placeholder="CTA text" className="rounded-xl border border-slate-200 px-3 py-2" />
                                        <input value={content.footer_links?.extra_sections?.cta?.button || DEFAULT_EXTRA_SECTIONS.cta.button} onChange={(e) => updateExtraCta('button', e.target.value)} placeholder="CTA button" className="rounded-xl border border-slate-200 px-3 py-2" />
                                    </div>
                                </div>
                            </SectionCard>
                            )}
                        </>
                    )}
                    {['contact', 'seo', 'design'].includes(activeCmsTab) && (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6">
                            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                                {activeCmsTab === 'contact' ? 'Contact page settings' : activeCmsTab === 'seo' ? 'Search & social preview' : 'Website design settings'}
                            </p>
                            <h3 className="mt-3 text-2xl font-black text-slate-900">
                                {activeCmsTab === 'contact' ? 'Admission, footer, social link update korun' : activeCmsTab === 'seo' ? 'Google, Facebook, WhatsApp preview control korun' : 'Template, color, layout, menu customize korun'}
                            </h3>
                            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
                                Dan pasher panel theke edit korle live preview sathe sathe update hobe. Save korle public website e show korbe.
                            </p>
                        </div>
                    )}
                    {activeCmsTab === 'media' && (
                        <SectionCard title="Media library" defaultOpen>
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Institution images</p>
                                    <h3 className="mt-1 text-xl font-black text-slate-900">
                                        {mediaTarget ? 'Select an image to apply' : 'Upload once, reuse anywhere'}
                                    </h3>
                                    {mediaTarget && <p className="mt-1 text-sm font-bold text-emerald-700">Target: {mediaTarget.type}</p>}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white">
                                        {uploadingField === 'media-library' ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                                        Upload image
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], 'media-library', () => {})} />
                                    </label>
                                    <button type="button" onClick={loadMediaLibrary} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
                                        Refresh
                                    </button>
                                    {mediaTarget && (
                                        <button type="button" onClick={() => setMediaTarget(null)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-500">
                                            Cancel select
                                        </button>
                                    )}
                                </div>
                            </div>

                            {mediaError && <p className="mb-4 rounded-2xl bg-rose-50 p-3 text-sm font-black text-rose-700">{mediaError}</p>}
                            {mediaLoading ? (
                                <div className="flex min-h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                                    <Loader2 className="animate-spin text-slate-400" />
                                </div>
                            ) : mediaItems.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center font-black text-slate-400">
                                    No uploaded institution image yet.
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {mediaItems.map((item) => (
                                        <article key={item.path} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                            <img src={item.url} alt="" className="h-36 w-full bg-slate-100 object-cover" />
                                            <div className="space-y-3 p-3">
                                                <div>
                                                    <p className="truncate text-sm font-black text-slate-800">{item.name}</p>
                                                    <p className="text-xs font-bold text-slate-400">{Math.max(1, Math.round((item.size || 0) / 1024))} KB</p>
                                                </div>
                                                <div className="grid gap-2">
                                                    {mediaTarget ? (
                                                        <button type="button" onClick={() => applyMedia(item.url)} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white">
                                                            Use this image
                                                        </button>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button type="button" onClick={() => { setContent({ ...content, logo_url: item.url }); setActiveCmsTab('home'); }} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white">Use logo</button>
                                                            <button type="button" onClick={() => { setContent({ ...content, banner_image_url: item.url }); setActiveCmsTab('home'); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Use banner</button>
                                                        </div>
                                                    )}
                                                    <button type="button" onClick={() => deleteMedia(item)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-100 px-3 py-2 text-xs font-black text-rose-600">
                                                        <Trash2 size={14} /> Delete image
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </SectionCard>
                    )}
                </div>

                <div className="space-y-4">
                    <SectionCard title="Live website preview" defaultOpen>
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-black text-slate-600">
                                <Eye size={16} />
                                Unsaved changes preview
                            </div>
                            <div className="rounded-2xl bg-slate-100 p-1">
                                {['desktop', 'mobile'].map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setPreviewMode(mode)}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-black capitalize ${previewMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <WebsiteLivePreview institution={institution} content={content} theme={theme} mode={previewMode} />
                    </SectionCard>

                    {activeCmsTab === 'contact' && (
                    <SectionCard title="যোগাযোগ ও ভর্তি" defaultOpen>
                        <div className="grid gap-3">
                            <textarea value={content.admission_text} onChange={(e) => setContent({ ...content, admission_text: e.target.value })} placeholder="Admission text" className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" />
                            <input value={content.contact_phone} onChange={(e) => setContent({ ...content, contact_phone: e.target.value })} placeholder="Phone" className="rounded-2xl border border-slate-200 px-4 py-3" />
                            <input value={content.contact_email} onChange={(e) => setContent({ ...content, contact_email: e.target.value })} placeholder="Email" className="rounded-2xl border border-slate-200 px-4 py-3" />
                            <input value={content.address} onChange={(e) => setContent({ ...content, address: e.target.value })} placeholder="Address" className="rounded-2xl border border-slate-200 px-4 py-3" />
                            <input value={content.office_hours} onChange={(e) => setContent({ ...content, office_hours: e.target.value })} placeholder="Office hours" className="rounded-2xl border border-slate-200 px-4 py-3" />
                        </div>
                        {schoolMode && (
                            <div className="mt-4 space-y-3">
                                {content.admission_features.map((item, index) => (
                                    <div key={`admission-${index}`} className="flex gap-2">
                                        <input value={item} onChange={(e) => updateList('admission_features', index, null, e.target.value)} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3" />
                                        <button type="button" onClick={() => removeListItem('admission_features', index)} className="rounded-2xl bg-white px-3 text-slate-400"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addListItem('admission_features', '')} className="inline-flex items-center gap-2 text-sm font-black text-slate-700">
                                    <Plus size={16} /> ভর্তি সুবিধা যোগ করুন
                                </button>
                            </div>
                        )}
                    </SectionCard>
                    )}

                    {activeCmsTab === 'contact' && (
                    <SectionCard title="Footer, social & developer" defaultOpen>
                        <div className="grid gap-3">
                            <input value={content.footer_links?.site_name || ''} onChange={(e) => updateFooterField('site_name', e.target.value)} placeholder="Website display name" className="rounded-2xl border border-slate-200 px-4 py-3" />
                            <textarea value={content.footer_links?.footer_description || ''} onChange={(e) => updateFooterField('footer_description', e.target.value)} placeholder="Footer description" className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3" />

                            <div className="rounded-2xl bg-white p-3">
                                <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Quick links</p>
                                <div className="space-y-2">
                                    {listValue(content.footer_links?.quick_links, []).map((item, index) => (
                                        <input key={`quick-${index}`} value={item} onChange={(e) => updateFooterList('quick_links', index, e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                                    ))}
                                </div>
                                <button type="button" onClick={() => addFooterListItem('quick_links')} className="mt-3 text-sm font-black text-slate-700">+ link</button>
                            </div>

                            <div className="rounded-2xl bg-white p-3">
                                <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Academic links</p>
                                <div className="space-y-2">
                                    {listValue(content.footer_links?.academic_links, []).map((item, index) => (
                                        <input key={`academic-${index}`} value={item} onChange={(e) => updateFooterList('academic_links', index, e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                                    ))}
                                </div>
                                <button type="button" onClick={() => addFooterListItem('academic_links')} className="mt-3 text-sm font-black text-slate-700">+ link</button>
                            </div>

                            <div className="grid gap-2 md:grid-cols-2">
                                <input value={content.footer_links?.social_links?.facebook || ''} onChange={(e) => updateFooterNested('social_links', 'facebook', e.target.value)} placeholder="Facebook URL" className="rounded-xl border border-slate-200 px-3 py-2" />
                                <input value={content.footer_links?.social_links?.youtube || ''} onChange={(e) => updateFooterNested('social_links', 'youtube', e.target.value)} placeholder="YouTube URL" className="rounded-xl border border-slate-200 px-3 py-2" />
                                <input value={content.footer_links?.social_links?.website || ''} onChange={(e) => updateFooterNested('social_links', 'website', e.target.value)} placeholder="External website URL" className="rounded-xl border border-slate-200 px-3 py-2 md:col-span-2" />
                            </div>

                            <div className="rounded-2xl bg-white p-3">
                                <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Developer info</p>
                                <div className="grid gap-2">
                                    <input value={content.footer_links?.developer?.name || ''} onChange={(e) => updateFooterNested('developer', 'name', e.target.value)} placeholder="Developer / agency name" className="rounded-xl border border-slate-200 px-3 py-2" />
                                    <input value={content.footer_links?.developer?.url || ''} onChange={(e) => updateFooterNested('developer', 'url', e.target.value)} placeholder="Developer website URL" className="rounded-xl border border-slate-200 px-3 py-2" />
                                    <input value={content.footer_links?.developer?.facebook || ''} onChange={(e) => updateFooterNested('developer', 'facebook', e.target.value)} placeholder="Developer Facebook URL" className="rounded-xl border border-slate-200 px-3 py-2" />
                                    <input value={content.footer_links?.developer?.phone || ''} onChange={(e) => updateFooterNested('developer', 'phone', e.target.value)} placeholder="Developer phone" className="rounded-xl border border-slate-200 px-3 py-2" />
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                    )}

                    {activeCmsTab === 'seo' && (
                    <SectionCard title="SEO & share preview" defaultOpen>
                        <div className="grid gap-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Search result</p>
                                <input
                                    value={content.footer_links?.seo?.title || ''}
                                    onChange={(e) => updateFooterNested('seo', 'title', e.target.value)}
                                    placeholder="SEO title"
                                    className="mb-3 w-full rounded-2xl border border-slate-200 px-4 py-3"
                                />
                                <textarea
                                    value={content.footer_links?.seo?.description || ''}
                                    onChange={(e) => updateFooterNested('seo', 'description', e.target.value)}
                                    placeholder="Meta description"
                                    className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3"
                                />
                                <input
                                    value={content.footer_links?.seo?.keywords || ''}
                                    onChange={(e) => updateFooterNested('seo', 'keywords', e.target.value)}
                                    placeholder="Keywords, comma separated"
                                    className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3"
                                />
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Social share image</p>
                                <input
                                    value={content.footer_links?.seo?.share_image_url || ''}
                                    onChange={(e) => updateFooterNested('seo', 'share_image_url', e.target.value)}
                                    placeholder="Facebook / WhatsApp share image URL"
                                    className="mb-3 w-full rounded-2xl border border-slate-200 px-4 py-3"
                                />
                                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white">
                                    {uploadingField === 'seo-share' ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                                    Upload share image
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], 'seo-share', (url) => updateFooterNested('seo', 'share_image_url', url))} />
                                </label>
                                <button type="button" onClick={() => openMediaTarget('share')} className="ml-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">Choose from library</button>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Favicon / browser icon</p>
                                <input
                                    value={content.footer_links?.seo?.favicon_url || ''}
                                    onChange={(e) => updateFooterNested('seo', 'favicon_url', e.target.value)}
                                    placeholder="Favicon URL"
                                    className="mb-3 w-full rounded-2xl border border-slate-200 px-4 py-3"
                                />
                                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
                                    {uploadingField === 'seo-favicon' ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                                    Upload favicon/logo
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], 'seo-favicon', (url) => updateFooterNested('seo', 'favicon_url', url))} />
                                </label>
                                <button type="button" onClick={() => openMediaTarget('favicon')} className="ml-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">Choose from library</button>
                            </div>

                            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                                {(content.footer_links?.seo?.share_image_url || content.banner_image_url) ? (
                                    <img src={content.footer_links?.seo?.share_image_url || content.banner_image_url} alt="" className="h-36 w-full object-cover" />
                                ) : (
                                    <div className="h-36 bg-gradient-to-br from-slate-900 to-slate-700" />
                                )}
                                <div className="p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{institution?.subdomain || 'digigram'}</p>
                                    <h4 className="mt-2 text-lg font-black text-slate-900">{content.footer_links?.seo?.title || content.footer_links?.site_name || institution.name}</h4>
                                    <p className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-slate-500">
                                        {content.footer_links?.seo?.description || content.hero_subtitle || content.about_text || 'Share preview description will appear here.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                    )}

                    {activeCmsTab === 'design' && (
                    <SectionCard title="Design settings" defaultOpen>
                        <div className="mb-4 flex items-center gap-2">
                            <Palette size={18} className="text-slate-600" />
                            <span className="font-black text-slate-800">রং ও font</span>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <span className="mb-2 block text-xs font-black text-slate-500">Color preset</span>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {COLOR_PRESETS.map((preset) => (
                                        <button
                                            key={preset.name}
                                            type="button"
                                            onClick={() => setTheme({ ...theme, primary_color: preset.primary, accent_color: preset.accent })}
                                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left font-black text-slate-700 hover:border-slate-400"
                                        >
                                            <span className="flex -space-x-2">
                                                <span className="h-6 w-6 rounded-full border-2 border-white" style={{ backgroundColor: preset.primary }} />
                                                <span className="h-6 w-6 rounded-full border-2 border-white" style={{ backgroundColor: preset.accent }} />
                                            </span>
                                            {preset.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {schoolMode && (
                                <div>
                                    <span className="mb-2 block text-xs font-black text-slate-500">Template</span>
                                    <div className="grid gap-2">
                                        {SCHOOL_WEBSITE_TEMPLATES.map((template) => (
                                            <button
                                                key={template.value}
                                                type="button"
                                                onClick={() => setTheme({ ...theme, template: template.value })}
                                                className={`rounded-2xl border px-4 py-3 text-left transition ${theme.template === template.value ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'}`}
                                            >
                                                <span className="block font-black">{template.label}</span>
                                                <span className={`mt-1 block text-xs font-bold ${theme.template === template.value ? 'text-white/70' : 'text-slate-400'}`}>
                                                    {template.description}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <label className="block">
                                <span className="mb-2 block text-xs font-black text-slate-500">Primary color</span>
                                <input type="color" value={theme.primary_color} onChange={(e) => setTheme({ ...theme, primary_color: e.target.value })} className="h-12 w-full cursor-pointer rounded-xl border-0 bg-transparent" />
                            </label>
                            <label className="block">
                                <span className="mb-2 block text-xs font-black text-slate-500">Accent color</span>
                                <input type="color" value={theme.accent_color} onChange={(e) => setTheme({ ...theme, accent_color: e.target.value })} className="h-12 w-full cursor-pointer rounded-xl border-0 bg-transparent" />
                            </label>
                            <label className="block">
                                <span className="mb-2 block text-xs font-black text-slate-500">Layout</span>
                                <select value={theme.layout_variant} onChange={(e) => setTheme({ ...theme, layout_variant: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold">
                                    {LAYOUT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="mb-2 block text-xs font-black text-slate-500">Font</span>
                                <select value={theme.font_family} onChange={(e) => setTheme({ ...theme, font_family: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold">
                                    {INSTITUTION_FONT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </SectionCard>
                    )}

                    {activeCmsTab === 'design' && (
                    <SectionCard title="Menu management" defaultOpen>
                        <div className="grid gap-2">
                            {menuOptions.map((item) => {
                                const checked = theme.menu_items.includes(item.value);
                                return (
                                    <label key={item.value} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 font-bold text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => setTheme({
                                                ...theme,
                                                menu_items: e.target.checked
                                                    ? [...theme.menu_items, item.value]
                                                    : theme.menu_items.filter((value) => value !== item.value)
                                            })}
                                        />
                                        {item.label}
                                    </label>
                                );
                            })}
                        </div>
                    </SectionCard>
                    )}

                    {activeCmsTab === 'history' && (
                    <SectionCard title="Publish history" defaultOpen>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4">
                                <div>
                                    <p className="font-black text-slate-900">Published versions</p>
                                    <p className="mt-1 text-sm font-bold text-slate-500">Restore puts a version into draft first. Live website changes only after publish.</p>
                                </div>
                                <button type="button" onClick={loadPublishHistory} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700">
                                    {historyLoading ? <Loader2 size={15} className="animate-spin" /> : <Clock3 size={15} />}
                                    Refresh
                                </button>
                            </div>
                            {historyLoading && publishHistory.length === 0 && (
                                <p className="rounded-2xl bg-white px-4 py-5 text-sm font-black text-slate-500">Loading publish history...</p>
                            )}
                            {!historyLoading && publishHistory.length === 0 && (
                                <p className="rounded-2xl bg-white px-4 py-5 text-sm font-black text-slate-500">No publish snapshot yet. Publish once to start history.</p>
                            )}
                            {publishHistory.map((version, index) => (
                                <article key={version.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                                                {index === 0 ? 'Latest publish' : `Version ${publishHistory.length - index}`}
                                            </p>
                                            <h3 className="mt-1 text-base font-black text-slate-900">
                                                {version.content_snapshot?.footer_links?.site_name || version.content_snapshot?.hero_title || institution.name}
                                            </h3>
                                            <p className="mt-1 text-sm font-bold text-slate-500">
                                                {new Date(version.published_at).toLocaleString()}
                                            </p>
                                            <p className="mt-2 line-clamp-2 text-sm font-bold text-slate-600">
                                                {version.content_snapshot?.hero_subtitle || version.content_snapshot?.about_text || 'Saved website snapshot'}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                                                {version.theme_snapshot?.template || 'classic'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => restoreHistoryDraft(version)}
                                                disabled={restoringHistoryId === version.id}
                                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-black text-white disabled:opacity-60"
                                            >
                                                {restoringHistoryId === version.id ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                                                Restore to Draft
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </SectionCard>
                    )}
                </div>
            </div>

            <button disabled={saving || publishing} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-black text-white disabled:opacity-60">
                <Save size={18} />
                {saving ? 'Saving draft...' : 'Save Draft'}
            </button>
        </form>
    );
}

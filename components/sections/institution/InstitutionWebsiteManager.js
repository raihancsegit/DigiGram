'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Loader2, Palette, Plus, Save, Settings2, Trash2 } from 'lucide-react';
import {
    getInstitutionDesignProfile,
    INSTITUTION_FONT_OPTIONS,
    INSTITUTION_MENU_OPTIONS,
    SCHOOL_WEBSITE_TEMPLATES
} from '@/lib/constants/institutionDesignProfiles';
import { institutionPortalService } from '@/lib/services/institutionPortalService';
import { institutionService } from '@/lib/services/institutionService';

const DEFAULT_MENU = ['home', 'about', 'classes', 'teachers', 'facilities', 'admission', 'notices', 'contact'];
const SCHOOL_CATEGORIES = ['school', 'primary_school', 'high_school', 'college', 'alim_madrasa', 'kindergarten'];

const defaults = {
    ticker: ['নতুন শিক্ষাবর্ষে ভর্তি চলছে'],
    stats: [
        { value: '২৫+', label: 'বছরের অভিজ্ঞতা' },
        { value: '১২০০+', label: 'শিক্ষার্থী' }
    ],
    highlights: ['অভিজ্ঞ শিক্ষক', 'নিয়মিত অভিভাবক যোগাযোগ'],
    classes: [{ title: 'প্রাথমিক বিভাগ', description: 'ভিত্তি মজবুত করার পাঠক্রম', badge: '১ম-৫ম' }],
    teachers: [{ name: 'প্রধান শিক্ষক', subject: 'প্রশাসন', experience: 'অভিজ্ঞ নেতৃত্ব' }],
    facilities: [{ title: 'ডিজিটাল ক্লাসরুম', description: 'স্মার্ট পাঠদান ও উপস্থিতি ট্র্যাকিং' }],
    admissionFeatures: ['অনলাইন প্রাথমিক আবেদন']
};

function listValue(value, fallback) {
    return Array.isArray(value) && value.length ? value : fallback;
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

export default function InstitutionWebsiteManager({ institution, initialPage, onInstitutionUpdate }) {
    const design = getInstitutionDesignProfile(institution?.category);
    const schoolMode = SCHOOL_CATEGORIES.includes(institution?.category);
    const [content, setContent] = useState({
        hero_title: initialPage?.hero_title || '',
        hero_subtitle: initialPage?.hero_subtitle || '',
        about_text: initialPage?.about_text || '',
        principal_message: initialPage?.principal_message || '',
        admission_text: initialPage?.admission_text || '',
        result_text: initialPage?.result_text || '',
        contact_phone: initialPage?.contact_phone || '',
        contact_email: initialPage?.contact_email || '',
        address: initialPage?.address || '',
        established_year: initialPage?.established_year || '',
        approval_text: initialPage?.approval_text || '',
        office_hours: initialPage?.office_hours || '',
        logo_url: initialPage?.logo_url || '',
        banner_image_url: initialPage?.banner_image_url || '',
        notice_ticker: listValue(initialPage?.notice_ticker, defaults.ticker),
        stats: listValue(initialPage?.stats, defaults.stats),
        about_highlights: listValue(initialPage?.about_highlights, defaults.highlights),
        class_sections: listValue(initialPage?.class_sections, defaults.classes),
        public_teachers: listValue(initialPage?.public_teachers, defaults.teachers),
        facilities: listValue(initialPage?.facilities, defaults.facilities),
        admission_features: listValue(initialPage?.admission_features, defaults.admissionFeatures),
        footer_links: initialPage?.footer_links || {
            quick_links: ['আমাদের সম্পর্কে', 'শ্রেণি', 'নোটিশ'],
            academic_links: ['ভর্তি', 'ফলাফল', 'পরীক্ষা']
        }
    });
    const [theme, setTheme] = useState({
        preset: institution?.theme?.preset || institution?.category || 'high_school',
        template: institution?.theme?.template || 'classic',
        primary_color: institution?.theme?.primary_color || design.primaryColor,
        font_family: institution?.theme?.font_family || design.fontFamily,
        menu_items: institution?.theme?.menu_items || DEFAULT_MENU
    });
    const [saving, setSaving] = useState(false);
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

    async function saveWebsite(event) {
        event.preventDefault();
        setSaving(true);
        try {
            await Promise.all([
                institutionPortalService.upsertPage({
                    institution_id: institution.id,
                    ...content
                }),
                institutionService.updateBranding(institution.id, theme)
            ]);
            onInstitutionUpdate?.({ ...institution, theme });
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={saveWebsite} className="rounded-[32px] border border-slate-200 bg-white p-6">
            <div className="mb-5 flex items-center gap-3">
                <Settings2 className="text-slate-700" />
                <div>
                    <h2 className="text-xl font-black text-slate-800">Website CMS</h2>
                    <p className="text-sm font-bold text-slate-400">প্রতিষ্ঠানের public website এখান থেকে নিয়ন্ত্রণ করুন।</p>
                </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
                <div className="space-y-4">
                    <SectionCard title="মূল তথ্য" defaultOpen>
                        <div className="grid gap-3">
                            <div className="grid gap-3 md:grid-cols-2">
                                <input value={content.logo_url} onChange={(e) => setContent({ ...content, logo_url: e.target.value })} placeholder="Logo image URL" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
                                <input value={content.banner_image_url} onChange={(e) => setContent({ ...content, banner_image_url: e.target.value })} placeholder="Banner image URL" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
                            </div>
                            <input value={content.hero_title} onChange={(e) => setContent({ ...content, hero_title: e.target.value })} placeholder="Hero title" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
                            <input value={content.hero_subtitle} onChange={(e) => setContent({ ...content, hero_subtitle: e.target.value })} placeholder="Hero subtitle" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
                            <textarea value={content.about_text} onChange={(e) => setContent({ ...content, about_text: e.target.value })} placeholder="About text" className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3" />
                            <textarea value={content.principal_message} onChange={(e) => setContent({ ...content, principal_message: e.target.value })} placeholder="Principal message" className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" />
                        </div>
                    </SectionCard>

                    {schoolMode && (
                        <>
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

                            <SectionCard title="শ্রেণি">
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

                            <SectionCard title="শিক্ষকমণ্ডলী">
                                <div className="space-y-3">
                                    {content.public_teachers.map((item, index) => (
                                        <div key={`teacher-${index}`} className="grid gap-2 rounded-2xl bg-white p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                                            <input value={item.name} onChange={(e) => updateList('public_teachers', index, 'name', e.target.value)} placeholder="নাম" className="rounded-xl border border-slate-200 px-3 py-2" />
                                            <input value={item.subject} onChange={(e) => updateList('public_teachers', index, 'subject', e.target.value)} placeholder="বিষয়" className="rounded-xl border border-slate-200 px-3 py-2" />
                                            <input value={item.experience} onChange={(e) => updateList('public_teachers', index, 'experience', e.target.value)} placeholder="অভিজ্ঞতা" className="rounded-xl border border-slate-200 px-3 py-2" />
                                            <input value={item.image_url || ''} onChange={(e) => updateList('public_teachers', index, 'image_url', e.target.value)} placeholder="Photo URL" className="rounded-xl border border-slate-200 px-3 py-2 md:col-span-3" />
                                            <button type="button" onClick={() => removeListItem('public_teachers', index)} className="rounded-xl px-3 text-slate-400"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => addListItem('public_teachers', { name: '', subject: '', experience: '', image_url: '' })} className="mt-3 inline-flex items-center gap-2 text-sm font-black text-slate-700">
                                    <Plus size={16} /> শিক্ষক যোগ করুন
                                </button>
                            </SectionCard>

                            <SectionCard title="সুযোগ-সুবিধা">
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
                        </>
                    )}
                </div>

                <div className="space-y-4">
                    <SectionCard title="যোগাযোগ ও ভর্তি">
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

                    <SectionCard title="Design settings">
                        <div className="mb-4 flex items-center gap-2">
                            <Palette size={18} className="text-slate-600" />
                            <span className="font-black text-slate-800">রং ও font</span>
                        </div>
                        <div className="space-y-3">
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
                                <span className="mb-2 block text-xs font-black text-slate-500">Font</span>
                                <select value={theme.font_family} onChange={(e) => setTheme({ ...theme, font_family: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold">
                                    {INSTITUTION_FONT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </SectionCard>

                    <SectionCard title="Menu management">
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
                </div>
            </div>

            <button disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-black text-white disabled:opacity-60">
                <Save size={18} />
                {saving ? 'সেভ হচ্ছে...' : 'Website save করুন'}
            </button>
        </form>
    );
}

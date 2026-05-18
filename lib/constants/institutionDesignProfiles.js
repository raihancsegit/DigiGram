export const INSTITUTION_DESIGN_PROFILES = {
    primary_school: {
        eyebrow: 'প্রাইমারি স্কুল',
        heroLine: 'শিশুর শেখা, উপস্থিতি ও অগ্রগতি একসাথে',
        accent: 'sky',
        surface: 'from-sky-50 via-white to-emerald-50',
        badge: 'bg-sky-100 text-sky-700',
        button: 'bg-sky-600 hover:bg-sky-700',
        iconWrap: 'bg-sky-100 text-sky-700',
        primaryColor: '#0284c7',
        fontFamily: 'hind_siliguri'
    },
    high_school: {
        eyebrow: 'হাই স্কুল',
        heroLine: 'শৃঙ্খলা, ফলাফল ও ভবিষ্যৎ প্রস্তুতির ডিজিটাল কেন্দ্র',
        accent: 'teal',
        surface: 'from-teal-50 via-white to-cyan-50',
        badge: 'bg-teal-100 text-teal-700',
        button: 'bg-teal-600 hover:bg-teal-700',
        iconWrap: 'bg-teal-100 text-teal-700',
        primaryColor: '#0f766e',
        fontFamily: 'hind_siliguri'
    },
    college: {
        eyebrow: 'কলেজ',
        heroLine: 'বিষয়ভিত্তিক শিক্ষা, ফলাফল ও উচ্চশিক্ষা ট্র্যাকিং',
        accent: 'indigo',
        surface: 'from-indigo-50 via-white to-slate-50',
        badge: 'bg-indigo-100 text-indigo-700',
        button: 'bg-indigo-600 hover:bg-indigo-700',
        iconWrap: 'bg-indigo-100 text-indigo-700',
        primaryColor: '#4338ca',
        fontFamily: 'hind_siliguri'
    },
    alim_madrasa: {
        eyebrow: 'আলিম মাদ্রাসা',
        heroLine: 'দ্বীনি শিক্ষা ও আধুনিক ব্যবস্থাপনার সমন্বয়',
        accent: 'emerald',
        surface: 'from-emerald-50 via-white to-lime-50',
        badge: 'bg-emerald-100 text-emerald-700',
        button: 'bg-emerald-600 hover:bg-emerald-700',
        iconWrap: 'bg-emerald-100 text-emerald-700',
        primaryColor: '#059669',
        fontFamily: 'hind_siliguri'
    },
    kindergarten: {
        eyebrow: 'কিন্ডারগার্টেন',
        heroLine: 'আনন্দময় শেখা, নিরাপদ যত্ন ও অভিভাবক সংযোগ',
        accent: 'rose',
        surface: 'from-rose-50 via-white to-amber-50',
        badge: 'bg-rose-100 text-rose-700',
        button: 'bg-rose-600 hover:bg-rose-700',
        iconWrap: 'bg-rose-100 text-rose-700',
        primaryColor: '#e11d48',
        fontFamily: 'hind_siliguri'
    },
    mosque: {
        eyebrow: 'মসজিদ',
        heroLine: 'ইবাদত, ঘোষণা ও স্বচ্ছ হিসাবের ডিজিটাল কেন্দ্র',
        accent: 'emerald',
        surface: 'from-emerald-50 via-white to-teal-50',
        badge: 'bg-emerald-100 text-emerald-700',
        button: 'bg-emerald-600 hover:bg-emerald-700',
        iconWrap: 'bg-emerald-100 text-emerald-700',
        primaryColor: '#047857',
        fontFamily: 'hind_siliguri'
    }
};

export function getInstitutionDesignProfile(category) {
    return INSTITUTION_DESIGN_PROFILES[category] || INSTITUTION_DESIGN_PROFILES.high_school;
}

export const INSTITUTION_FONT_OPTIONS = [
    { value: 'hind_siliguri', label: 'Hind Siliguri' },
    { value: 'noto_sans_bengali', label: 'Noto Sans Bengali' },
    { value: 'system', label: 'System' }
];

export const SCHOOL_WEBSITE_TEMPLATES = [
    {
        value: 'classic',
        label: 'Classic Academy',
        description: 'গম্ভীর, পরিচ্ছন্ন, ঐতিহ্যধর্মী school look',
        shellClass: 'bg-[#fffdf9]',
        sectionClass: 'bg-[#f5f3ee]',
        cardClass: 'rounded-2xl',
        headerClass: 'bg-[var(--school-primary)] text-white',
        noticeClass: 'border-amber-200 bg-amber-50 text-amber-900',
        heroClass: 'bg-[var(--school-primary)] text-white',
        heroGridClass: 'lg:grid-cols-[1fr_0.85fr]',
        heroTitleClass: 'md:text-5xl',
        statClass: 'border-white/15 bg-white/10 text-white',
        statValueClass: 'text-amber-300',
        previewClass: 'lg:grid-cols-[0.8fr_1fr]',
        sectionTitleClass: 'text-slate-900'
    },
    {
        value: 'modern',
        label: 'Modern Campus',
        description: 'হালকা, উজ্জ্বল, সমসাময়িক layout',
        shellClass: 'bg-slate-50',
        sectionClass: 'bg-white',
        cardClass: 'rounded-[28px]',
        headerClass: 'bg-white text-slate-950',
        noticeClass: 'border-cyan-100 bg-cyan-50 text-cyan-950',
        heroClass: 'bg-slate-950 text-white',
        heroGridClass: 'lg:grid-cols-[0.9fr_1.1fr]',
        heroTitleClass: 'md:text-6xl',
        statClass: 'border-white/10 bg-white text-slate-950 shadow-2xl shadow-slate-950/15',
        statValueClass: 'text-[var(--school-primary)]',
        previewClass: 'lg:grid-cols-[1fr_1fr]',
        sectionTitleClass: 'text-slate-950'
    },
    {
        value: 'editorial',
        label: 'Editorial School',
        description: 'বড় typography, শান্ত layout, premium feel',
        shellClass: 'bg-[#fcfbf7]',
        sectionClass: 'bg-[#f2efe7]',
        cardClass: 'rounded-none',
        headerClass: 'border-b border-slate-900 bg-[#fcfbf7] text-slate-950',
        noticeClass: 'border-slate-300 bg-transparent text-slate-800',
        heroClass: 'border-b border-slate-900 bg-[#fcfbf7] text-slate-950',
        heroGridClass: 'lg:grid-cols-[1.15fr_0.65fr]',
        heroTitleClass: 'md:text-6xl',
        statClass: 'border-t border-slate-900 bg-transparent text-slate-950',
        statValueClass: 'text-slate-950',
        previewClass: 'lg:grid-cols-[1fr_0.8fr]',
        sectionTitleClass: 'text-slate-950'
    }
];

export function getSchoolWebsiteTemplate(template) {
    return SCHOOL_WEBSITE_TEMPLATES.find((item) => item.value === template) || SCHOOL_WEBSITE_TEMPLATES[0];
}

export const INSTITUTION_MENU_OPTIONS = [
    { value: 'home', label: 'হোম' },
    { value: 'about', label: 'আমাদের সম্পর্কে' },
    { value: 'teachers', label: 'শিক্ষক' },
    { value: 'academics', label: 'শিক্ষা কার্যক্রম' },
    { value: 'results', label: 'ফলাফল' },
    { value: 'notices', label: 'নোটিশ' },
    { value: 'contact', label: 'যোগাযোগ' }
];

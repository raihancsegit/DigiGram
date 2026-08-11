'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
    ArrowRight,
    Bell,
    BookOpen,
    ClipboardList,
    GraduationCap,
    Trophy,
    Users
} from 'lucide-react';

const VARIANTS = {
    school: {
        shell: 'bg-[#f5f9fb]', hero: 'bg-[#063b57]', accent: 'text-cyan-300', button: 'bg-[#0795a4] text-white',
        soft: 'bg-[#e9f8fa]', border: 'border-cyan-100', heading: 'Inspiring Excellence, Building Tomorrow',
        eyebrow: 'শিক্ষা · শৃঙ্খলা · অগ্রগতি', shape: 'rounded-none'
    },
    college: {
        shell: 'bg-[#f7f6f2]', hero: 'bg-[#101a42]', accent: 'text-amber-300', button: 'bg-[#d1a83d] text-slate-950',
        soft: 'bg-[#faf6e8]', border: 'border-amber-100', heading: 'Learn. Lead. Make an Impact.',
        eyebrow: 'Excellence in Higher Education', shape: 'rounded-none'
    },
    kindergarten: {
        shell: 'bg-[#fff9ef]', hero: 'bg-[#fff5e8]', accent: 'text-[#ff5b5f]', button: 'bg-[#ff5b5f] text-white',
        soft: 'bg-[#fff0df]', border: 'border-orange-100', heading: 'Happy Children, Bright Futures',
        eyebrow: 'A joyful place to learn and grow', shape: 'rounded-[2.25rem]'
    },
    madrasa: {
        shell: 'bg-[#fbfaf3]', hero: 'bg-[#f8f4e8]', accent: 'text-[#0a6847]', button: 'bg-[#086342] text-white',
        soft: 'bg-[#edf6ef]', border: 'border-emerald-100', heading: 'Knowledge. Character. Faith.',
        eyebrow: 'দ্বীনি ও আধুনিক শিক্ষার সমন্বয়', shape: 'rounded-none'
    }
};

function categoryKey(category) {
    if (category === 'college') return 'college';
    if (category === 'kindergarten') return 'kindergarten';
    if (['dakhil_madrasa', 'alim_madrasa'].includes(category)) return 'madrasa';
    return 'school';
}

export default function InstitutionReferenceHome({
    institution,
    page,
    slide,
    stats,
    quickLinks,
    programs,
    gallery,
    notices,
    onNavigate,
    onSlide
}) {
    const key = categoryKey(institution.category);
    const variant = VARIANTS[key];
    const isLightHero = key === 'kindergarten' || key === 'madrasa';
    const [failedImageUrls, setFailedImageUrls] = useState([]);
    const image = [slide?.image_url, page?.banner_image_url, ...gallery.map((item) => item?.image_url)]
        .find((url, index, rows) => url && rows.indexOf(url) === index && !failedImageUrls.includes(url));
    const heroTitle = page?.hero_title || slide?.title || variant.heading;
    const heroSubtitle = slide?.subtitle || page?.hero_subtitle;

    return (
        <main className={variant.shell} data-institution-home={key}>
            <section className={`relative overflow-hidden ${variant.hero} ${isLightHero ? 'text-slate-900' : 'text-white'}`}>
                {key === 'kindergarten' && <div className="pointer-events-none absolute -left-12 top-12 h-36 w-36 rounded-full bg-sky-300/50" />}
                {key === 'madrasa' && <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 opacity-30 [background-image:radial-gradient(#c8a84e_1px,transparent_1px)] [background-size:18px_18px]" />}
                <div className="mx-auto grid min-h-[470px] max-w-7xl lg:grid-cols-[0.86fr_1.14fr]">
                    <div className="relative z-10 flex flex-col justify-center px-6 py-14 md:px-12 lg:px-14">
                        <p className={`text-xs font-black uppercase tracking-[0.2em] ${variant.accent}`}>{slide?.badge || variant.eyebrow}</p>
                        <h2 className={`mt-5 max-w-xl text-4xl font-black leading-[1.08] md:text-6xl ${key === 'college' || key === 'madrasa' ? 'font-serif' : ''}`}>
                            {heroTitle || variant.heading}
                        </h2>
                        <p className={`mt-6 max-w-lg text-base font-medium leading-8 ${isLightHero ? 'text-slate-600' : 'text-white/75'}`}>{heroSubtitle}</p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <button type="button" onClick={() => onNavigate('admission')} className={`inline-flex items-center gap-3 rounded px-6 py-3 text-sm font-black shadow-lg ${variant.button} ${key === 'kindergarten' ? 'rounded-xl' : ''}`}>
                                {slide?.button_label || 'Admission Open'} <ArrowRight size={17} />
                            </button>
                            <button type="button" onClick={() => onNavigate('about')} className={`rounded border px-6 py-3 text-sm font-black ${isLightHero ? 'border-slate-300 text-slate-700' : 'border-white/25 text-white'}`}>আরও জানুন</button>
                        </div>
                    </div>
                    <div className={`relative min-h-[330px] overflow-hidden lg:min-h-full ${variant.shape}`}>
                        {image ? <Image src={image} alt={`${institution.name} campus`} fill preload sizes="(max-width: 1024px) 100vw, 58vw" quality={72} className="object-cover" onError={() => setFailedImageUrls((urls) => urls.includes(image) ? urls : [...urls, image])} /> : <div className={`absolute inset-0 ${key === 'college' ? 'bg-gradient-to-br from-[#283765] to-[#101a42]' : key === 'kindergarten' ? 'bg-gradient-to-br from-rose-100 via-orange-100 to-sky-200' : key === 'madrasa' ? 'bg-gradient-to-br from-emerald-100 via-amber-50 to-emerald-300' : 'bg-gradient-to-br from-cyan-700 to-[#063b57]'}`} />}
                        <div className={`absolute inset-0 ${isLightHero ? 'bg-gradient-to-r from-black/10 to-transparent' : 'bg-gradient-to-r from-black/20 to-transparent'}`} />
                        {key === 'kindergarten' && <div className="absolute inset-y-0 left-0 w-24 -translate-x-12 rounded-[50%] bg-[#fff5e8]" />}
                    </div>
                </div>
                <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2 lg:left-[44%]">
                    {[-1, 1].map((direction) => <button key={direction} type="button" onClick={() => onSlide(direction)} aria-label="স্লাইড পরিবর্তন" className="h-8 w-8 rounded-full border border-white/20 bg-slate-950/55 text-sm text-white">{direction < 0 ? '‹' : '›'}</button>)}
                </div>
            </section>

            {notices[0] && <div className={`${key === 'college' ? 'bg-[#101a42]' : key === 'madrasa' ? 'bg-[#086342]' : key === 'kindergarten' ? 'bg-[#ff5b5f]' : 'bg-[#063b57]'} text-white`}>
                <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 text-sm">
                    <Bell className="shrink-0" size={17} />
                    <strong className="shrink-0">নোটিশ</strong>
                    <span className="h-5 w-px bg-white/25" />
                    <p className="min-w-0 flex-1 truncate font-medium text-white/85">{notices[0].title}</p>
                    <button type="button" onClick={() => onNavigate('notices')} className="hidden shrink-0 items-center gap-2 font-black sm:inline-flex">সব নোটিশ <ArrowRight size={15} /></button>
                </div>
            </div>}

            <section className="relative z-10 mx-auto -mt-px max-w-7xl px-4 pb-14">
                <div className={`grid overflow-hidden border bg-white shadow-xl md:grid-cols-4 ${variant.border} ${key === 'kindergarten' ? 'rounded-3xl' : ''}`}>
                    {quickLinks.slice(0, 4).map((item, index) => {
                        const Icon = item.icon || BookOpen;
                        return <button type="button" key={`${item.page}-${index}`} onClick={() => onNavigate(item.page)} className={`flex min-h-28 items-center gap-4 border-b p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg md:border-b-0 md:border-r ${variant.border} ${index === 2 ? variant.soft : 'bg-white'}`}>
                            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${variant.soft} ${variant.accent}`}><Icon size={23} /></span>
                            <span><strong className="block text-sm text-slate-900">{item.label}</strong><small className="mt-1 block text-slate-500">{item.detail}</small></span>
                        </button>;
                    })}
                </div>
                <div className="grid border-x border-b bg-white sm:grid-cols-2 lg:grid-cols-4">
                    {stats.slice(0, 4).map((item, index) => <div key={`${item.label}-${index}`} className="flex items-center gap-4 border-b p-5 sm:border-r lg:border-b-0">
                        <span className={`text-2xl ${variant.accent}`}>{[GraduationCap, Users, BookOpen, Trophy].map((Icon, iconIndex) => iconIndex === index && <Icon key={iconIndex} size={25} />)}</span>
                        <span><strong className="block text-xl font-black text-slate-900">{item.value}</strong><small className="text-slate-500">{item.label}</small></span>
                    </div>)}
                </div>
            </section>

            <section className="bg-white py-20">
                <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
                    <div>
                        <p className={`text-xs font-black uppercase tracking-[0.2em] ${variant.accent}`}>Welcome to our institution</p>
                        <h2 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">{institution.name}</h2>
                        <p className="mt-5 text-base font-medium leading-8 text-slate-600">{page?.about_text || heroSubtitle}</p>
                        <div className="mt-7 space-y-3">
                            {programs.slice(0, 3).map((item, index) => <div key={`${item.title}-${index}`} className="flex gap-3 text-sm font-bold text-slate-700"><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${variant.soft} ${variant.accent}`}>✓</span>{item.title}</div>)}
                        </div>
                        <button type="button" onClick={() => onNavigate('about')} className={`mt-8 inline-flex items-center gap-2 rounded px-5 py-3 text-sm font-black ${variant.button}`}>প্রতিষ্ঠান সম্পর্কে <ArrowRight size={16} /></button>
                    </div>
                    <div className="grid min-h-[440px] gap-4 sm:grid-cols-2">
                        <article className={`relative overflow-hidden sm:row-span-2 ${key === 'kindergarten' ? 'rounded-3xl' : 'rounded-lg'}`}>
                            {gallery?.[0]?.image_url && <Image src={gallery[0].image_url} alt={gallery[0].title || 'Campus'} fill sizes="(max-width: 1024px) 100vw, 36vw" quality={68} className="object-cover" />}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent" />
                            <div className="absolute bottom-0 p-6 text-white"><h3 className="text-2xl font-black">{gallery?.[0]?.title}</h3><p className="mt-2 text-sm text-white/75">{gallery?.[0]?.caption}</p></div>
                        </article>
                        {gallery?.slice(1, 3).map((item, index) => <article key={`${item.title}-${index}`} className={`relative min-h-52 overflow-hidden ${key === 'kindergarten' ? 'rounded-3xl' : 'rounded-lg'}`}>
                            {item.image_url && <Image src={item.image_url} alt={item.title || 'Campus'} fill sizes="(max-width: 640px) 100vw, 25vw" quality={65} className="object-cover" />}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" /><h3 className="absolute bottom-4 left-4 right-4 font-black text-white">{item.title}</h3>
                        </article>)}
                    </div>
                </div>
            </section>

            <section className={`py-20 ${variant.soft}`}>
                <div className="mx-auto max-w-7xl px-4">
                    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className={`text-xs font-black uppercase tracking-[0.2em] ${variant.accent}`}>Academic life</p><h2 className="mt-3 text-4xl font-black text-slate-950">শিক্ষা, নেতৃত্ব ও সুন্দর ক্যাম্পাস</h2></div><button type="button" onClick={() => onNavigate('classes')} className="inline-flex items-center gap-2 font-black text-slate-700">সব দেখুন <ArrowRight size={16} /></button></div>
                    <div className="mt-9 grid gap-5 md:grid-cols-3">
                        {programs.slice(0, 3).map((item, index) => <article key={`${item.title}-${index}`} className={`border bg-white p-7 shadow-sm ${variant.border} ${key === 'kindergarten' ? 'rounded-3xl' : 'rounded-lg'}`}><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${variant.soft} ${variant.accent}`}><BookOpen size={22} /></span><h3 className="mt-5 text-xl font-black text-slate-950">{item.title}</h3><p className="mt-3 text-sm font-medium leading-7 text-slate-500">{item.description}</p></article>)}
                    </div>
                </div>
            </section>

            <section className="bg-white py-20">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[1.15fr_0.85fr]">
                    <div><p className={`text-xs font-black uppercase tracking-[0.2em] ${variant.accent}`}>Notice board</p><h2 className="mt-3 text-4xl font-black text-slate-950">সর্বশেষ নোটিশ ও আপডেট</h2><div className="mt-7 grid gap-3">{notices.slice(0, 3).map((notice, index) => <button type="button" onClick={() => onNavigate('notices')} key={notice.id || index} className="flex items-center gap-4 rounded-lg border border-slate-200 p-5 text-left hover:border-slate-300"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${variant.soft} ${variant.accent}`}><Bell size={19} /></span><span><strong className="block text-slate-900">{notice.title}</strong><small className="mt-1 block text-slate-500">বিস্তারিত জানতে নোটিশ বোর্ড দেখুন</small></span></button>)}</div></div>
                    <aside className={`p-8 text-white shadow-xl ${key === 'college' ? 'bg-[#101a42]' : key === 'kindergarten' ? 'rounded-3xl bg-[#ff5b5f]' : key === 'madrasa' ? 'bg-[#086342]' : 'bg-[#063b57]'}`}><ClipboardList size={32} /><p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-white/65">Admission desk</p><h3 className="mt-3 text-3xl font-black">নতুন শিক্ষাবর্ষে ভর্তি চলছে</h3><p className="mt-4 leading-7 text-white/75">ভর্তি যোগ্যতা, প্রয়োজনীয় কাগজপত্র ও আবেদন প্রক্রিয়া সহজে দেখুন।</p><button type="button" onClick={() => onNavigate('admission')} className="mt-8 inline-flex items-center gap-2 rounded bg-white px-5 py-3 text-sm font-black text-slate-950">ভর্তি তথ্য <ArrowRight size={16} /></button></aside>
                </div>
            </section>
        </main>
    );
}

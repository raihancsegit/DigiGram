'use client';

import Image from 'next/image';
import { ArrowLeft, ArrowRight, Bell } from 'lucide-react';
import { useState } from 'react';

const PRESETS = {
    school: { shell: 'bg-[#063b57]', accent: 'text-cyan-300', button: 'bg-cyan-500 text-white' },
    college: { shell: 'bg-[#101a42]', accent: 'text-amber-300', button: 'bg-amber-400 text-slate-950' },
    kindergarten: { shell: 'bg-[#fff3e6] text-slate-950', accent: 'text-[#ef624d]', button: 'bg-[#ef624d] text-white' },
    madrasa: { shell: 'bg-[#f7f1df] text-slate-950', accent: 'text-[#0b6b4f]', button: 'bg-[#0b6b4f] text-white' }
};

function categoryKey(category) {
    if (category === 'college') return 'college';
    if (category === 'kindergarten') return 'kindergarten';
    if (['dakhil_madrasa', 'alim_madrasa'].includes(category)) return 'madrasa';
    return 'school';
}

export default function InstitutionPageHero({ category, siteName, kind, title, subtitle, image, fallbackImages = [], onNavigate }) {
    const key = categoryKey(category);
    const preset = PRESETS[key];
    const light = key === 'kindergarten' || key === 'madrasa';
    const [failedImageUrls, setFailedImageUrls] = useState([]);
    const displayImage = [image, ...fallbackImages]
        .find((url, index, rows) => url && rows.indexOf(url) === index && !failedImageUrls.includes(url));

    return (
        <section className={`relative overflow-hidden border-b ${preset.shell} ${light ? 'border-slate-200' : 'border-white/10 text-white'}`} data-page-hero={key}>
            <div className="mx-auto grid max-w-7xl lg:min-h-[340px] lg:grid-cols-[0.9fr_1.1fr]">
                <div className="relative z-10 flex flex-col justify-center px-5 py-12 md:px-10 lg:px-14">
                    <button type="button" onClick={() => onNavigate('home')} className={`mb-7 inline-flex w-fit items-center gap-2 text-xs font-black ${light ? 'text-slate-500' : 'text-white/65'}`}><ArrowLeft size={15} /> হোমে ফিরুন</button>
                    <p className={`text-xs font-black uppercase tracking-[0.22em] ${preset.accent}`}>{kind} · {siteName}</p>
                    <h2 className={`mt-4 text-4xl font-black leading-tight md:text-5xl ${key === 'college' || key === 'madrasa' ? 'font-serif' : ''}`}>{title}</h2>
                    <p className={`mt-4 max-w-xl font-medium leading-8 ${light ? 'text-slate-600' : 'text-white/70'}`}>{subtitle}</p>
                    <div className="mt-7 flex flex-wrap gap-3">
                        <button type="button" onClick={() => onNavigate('admission')} className={`inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-black ${preset.button}`}>ভর্তি তথ্য <ArrowRight size={16} /></button>
                        <button type="button" onClick={() => onNavigate('notices')} className={`inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-black ${light ? 'border-slate-300 text-slate-700' : 'border-white/20 text-white'}`}><Bell size={16} /> নোটিশ</button>
                    </div>
                </div>
                <div className="relative min-h-[260px] overflow-hidden bg-slate-200 lg:min-h-full">
                    {displayImage && <Image src={displayImage} alt={`${siteName} campus`} fill sizes="(max-width: 1024px) 100vw, 55vw" quality={72} className="object-cover" onError={() => setFailedImageUrls((urls) => urls.includes(displayImage) ? urls : [...urls, displayImage])} />}
                    {!displayImage && <div className={`absolute inset-0 ${key === 'college' ? 'bg-gradient-to-br from-[#263667] to-[#101a42]' : key === 'kindergarten' ? 'bg-gradient-to-br from-orange-100 via-rose-100 to-sky-100' : key === 'madrasa' ? 'bg-gradient-to-br from-emerald-100 via-amber-50 to-emerald-200' : 'bg-gradient-to-br from-cyan-800 to-[#063b57]'}`} />}
                    <div className={`absolute inset-0 bg-gradient-to-r ${light ? 'from-black/5 to-transparent' : 'from-black/20 to-transparent'}`} />
                </div>
            </div>
        </section>
    );
}

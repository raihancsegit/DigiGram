import Link from 'next/link';
import {
    ArrowRight,
    BriefcaseBusiness,
    CheckCircle2,
    FileBadge,
    FolderLock,
    GraduationCap,
    HandHeart,
    HeartPulse,
    MapPinned,
    ReceiptText,
    Siren,
    Sprout,
} from 'lucide-react';
import { CITIZEN_SERVICE_GROUPS, CITIZEN_SERVICES } from '@/lib/constants/citizenServices';

const ICONS = { BriefcaseBusiness, FileBadge, FolderLock, GraduationCap, HandHeart, HeartPulse, MapPinned, ReceiptText, Siren, Sprout };
const GROUP_LABELS = Object.fromEntries(CITIZEN_SERVICE_GROUPS.map((group) => [group.id, group.label]));

const TONES = [
    'bg-teal-50 text-teal-700 ring-teal-100',
    'bg-amber-50 text-amber-700 ring-amber-100',
    'bg-rose-50 text-rose-700 ring-rose-100',
    'bg-sky-50 text-sky-700 ring-sky-100',
    'bg-violet-50 text-violet-700 ring-violet-100',
];

export default function HomeCitizenServicesSection() {
    return (
        <section id="citizen-services" className="bg-slate-50 px-4 py-12 sm:px-6 md:py-20">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-teal-700 ring-1 ring-slate-200">
                            <CheckCircle2 size={15} /> ঘরে বসে কাজ শুরু করুন
                        </p>
                        <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl md:text-5xl">সমন্বিত নাগরিক সেবা কেন্দ্র</h2>
                        <p className="mt-4 max-w-3xl font-medium leading-7 text-slate-600">
                            যে কাজটি প্রয়োজন সেটি বাছাই করে সরাসরি আবেদন, অভিযোগ, appointment, payment বা সহায়তা শুরু করুন।
                        </p>
                    </div>
                    <Link href="/citizen/services" className="inline-flex w-fit items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-teal-700">
                        Search ও সব নির্দেশিকা <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {CITIZEN_SERVICES.map((service, index) => {
                        const Icon = ICONS[service.icon] || FileBadge;
                        return (
                            <article key={service.id} className="flex min-h-[310px] flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl">
                                <div className="flex items-start justify-between gap-3">
                                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${TONES[index % TONES.length]}`}><Icon size={23} /></span>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black text-slate-500">{GROUP_LABELS[service.group]}</span>
                                </div>
                                <h3 className="mt-5 text-xl font-black leading-tight text-slate-950">{service.title}</h3>
                                <p className="mt-3 flex-1 text-sm font-medium leading-6 text-slate-500">{service.summary}</p>
                                <Link href={service.primaryHref} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-950">
                                    {service.primaryLabel} <ArrowRight size={15} />
                                </Link>
                                <Link href={`/citizen/services/${service.id}`} className="mt-2 text-center text-xs font-black text-slate-500 transition hover:text-teal-700">কী কী লাগবে দেখুন</Link>
                            </article>
                        );
                    })}
                </div>

                <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold leading-6 text-amber-950 sm:flex-row sm:items-center sm:justify-between">
                    <p>জীবনঝুঁকি বা তাৎক্ষণিক বিপদে online আবেদন নয়—সরাসরি ৯৯৯-এ কল করুন। সরকারি অনুমোদন সংশ্লিষ্ট কর্তৃপক্ষ প্রদান করে।</p>
                    <Link href="/track" className="shrink-0 rounded-2xl bg-amber-900 px-5 py-3 text-center text-white">আবেদনের অবস্থা দেখুন</Link>
                </div>
            </div>
        </section>
    );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, FileCheck2, Users } from 'lucide-react';
import { CITIZEN_SERVICES, getCitizenService } from '@/lib/constants/citizenServices';

export function generateStaticParams() {
    return CITIZEN_SERVICES.map((service) => ({ serviceId: service.id }));
}

export async function generateMetadata({ params }) {
    const { serviceId } = await params;
    const service = getCitizenService(serviceId);
    return service ? { title: service.title, description: service.summary } : { title: 'সেবা পাওয়া যায়নি' };
}

export default async function CitizenServiceDetailPage({ params }) {
    const { serviceId } = await params;
    const service = getCitizenService(serviceId);
    if (!service) notFound();

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 md:py-14">
            <div className="mx-auto max-w-5xl">
                <Link href="/citizen/services" className="inline-flex items-center gap-2 text-sm font-black text-slate-600"><ArrowLeft size={16} /> সব নাগরিক সেবা</Link>
                <section className="mt-5 overflow-hidden rounded-[36px] bg-slate-950 p-6 text-white shadow-2xl sm:p-10">
                    <p className="text-xs font-black text-teal-300">নাগরিক সেবা নির্দেশিকা</p>
                    <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">{service.title}</h1>
                    <p className="mt-4 max-w-3xl font-medium leading-7 text-slate-300">{service.summary}</p>
                    <div className="mt-7 flex flex-wrap gap-3">
                        <Link href={service.primaryHref} className="inline-flex items-center gap-2 rounded-2xl bg-teal-500 px-6 py-3 font-black text-white transition hover:bg-teal-400">{service.primaryLabel} <ArrowRight size={17} /></Link>
                        <Link href={service.secondaryHref} className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3 font-black text-white ring-1 ring-white/15 transition hover:bg-white/15">{service.secondaryLabel}</Link>
                    </div>
                </section>

                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    <InfoCard icon={Users} title="কার জন্য"><p>{service.audience}</p></InfoCard>
                    <InfoCard icon={FileCheck2} title="যা প্রস্তুত রাখবেন"><List items={service.documents} /></InfoCard>
                </div>
                <InfoCard icon={ClipboardList} title="যেভাবে কাজটি করবেন" className="mt-5"><ol className="grid gap-3 sm:grid-cols-2">{service.steps.map((step, index) => <li key={step} className="flex gap-3 rounded-2xl bg-slate-50 p-4 font-bold leading-6 text-slate-700"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs text-white">{index + 1}</span>{step}</li>)}</ol></InfoCard>
                <div className="mt-5 flex gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold leading-6 text-amber-950"><AlertTriangle className="mt-0.5 shrink-0" size={21} />{service.note}</div>
            </div>
        </main>
    );
}

function InfoCard({ icon: Icon, title, className = '', children }) {
    return <section className={`rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm ${className}`}><h2 className="flex items-center gap-3 text-xl font-black text-slate-950"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Icon size={21} /></span>{title}</h2><div className="mt-5 font-medium leading-7 text-slate-600">{children}</div></section>;
}

function List({ items }) {
    return <ul className="space-y-3">{items.map((item) => <li key={item} className="flex items-start gap-2"><CheckCircle2 size={18} className="mt-1 shrink-0 text-teal-600" />{item}</li>)}</ul>;
}

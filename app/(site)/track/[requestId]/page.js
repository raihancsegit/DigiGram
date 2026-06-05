import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Hourglass,
    FileText,
    Home,
    MessageSquareText,
    PackageCheck,
    Phone,
    ShieldCheck,
    XCircle
} from 'lucide-react';
import { getServiceSla } from '@/lib/utils/serviceSla';

export const dynamic = 'force-dynamic';

const STATUS_STEPS = [
    { key: 'pending', label: 'জমা হয়েছে', icon: Clock3 },
    { key: 'processing', label: 'প্রসেসিং চলছে', icon: FileText },
    { key: 'ready', label: 'সংগ্রহের জন্য প্রস্তুত', icon: PackageCheck },
    { key: 'completed', label: 'সম্পন্ন', icon: CheckCircle2 }
];

const STATUS_LABELS = {
    pending: 'অপেক্ষমাণ',
    processing: 'প্রক্রিয়াধীন',
    ready: 'প্রস্তুত',
    completed: 'সম্পন্ন',
    rejected: 'বাতিল'
};

const REQUEST_LABELS = {
    birth_registration: 'জন্ম নিবন্ধন আবেদন',
    death_certificate: 'মৃত্যু সনদ আবেদন',
    utility_request: 'ইউটিলিটি সেবা আবেদন'
};

function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

function formatDate(value) {
    if (!value) return 'তারিখ দেওয়া হয়নি';
    return new Date(value).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function maskPhone(phone) {
    if (!phone || phone.length < 7) return phone || 'মোবাইল নম্বর নেই';
    return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
}

function toBnDigits(value) {
    return String(value).replace(/\d/g, (digit) => '০১২৩৪৫৬৭৮৯'[digit]);
}

function getCitizenSlaMeta(request) {
    const sla = getServiceSla(request);

    if (request.status === 'rejected') {
        return {
            ...sla,
            title: 'আবেদনটি বাতিল হয়েছে',
            detail: 'Officer note দেখুন অথবা ইউনিয়ন পরিষদে যোগাযোগ করুন।',
            className: 'border-rose-200 bg-rose-50 text-rose-800',
            barClassName: 'bg-rose-500'
        };
    }

    if (request.status === 'completed') {
        return {
            ...sla,
            title: 'সেবা সম্পন্ন হয়েছে',
            detail: 'এই আবেদনের অফিস কার্যক্রম সম্পন্ন করা হয়েছে।',
            className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
            barClassName: 'bg-emerald-500'
        };
    }

    if (request.status === 'ready') {
        return {
            ...sla,
            title: request.collection_date ? 'সংগ্রহের তারিখ নির্ধারিত' : 'সংগ্রহের জন্য প্রস্তুত',
            detail: request.collection_date
                ? `${formatDate(request.collection_date)} তারিখে প্রয়োজনীয় কাগজসহ ইউনিয়ন পরিষদে আসুন।`
                : 'সংগ্রহের তারিখ জানতে ইউনিয়ন পরিষদের সাথে যোগাযোগ করুন।',
            className: 'border-teal-200 bg-teal-50 text-teal-800',
            barClassName: 'bg-teal-500'
        };
    }

    if (sla.state === 'overdue') {
        return {
            ...sla,
            title: `লক্ষ্যমাত্রার চেয়ে ${toBnDigits(Math.abs(sla.remainingDays))} দিন বেশি হয়েছে`,
            detail: 'আবেদনটি অফিসের অগ্রাধিকার তালিকায় থাকা উচিত। প্রয়োজনে ইউনিয়ন পরিষদে যোগাযোগ করুন।',
            className: 'border-rose-200 bg-rose-50 text-rose-800',
            barClassName: 'bg-rose-500'
        };
    }

    if (sla.state === 'due_soon') {
        return {
            ...sla,
            title: sla.remainingDays === 0 ? 'আজ লক্ষ্যমাত্রার শেষ দিন' : 'আর প্রায় ১ দিন সময় আছে',
            detail: 'আবেদনটি বর্তমানে সক্রিয়ভাবে প্রক্রিয়াধীন আছে।',
            className: 'border-amber-200 bg-amber-50 text-amber-800',
            barClassName: 'bg-amber-500'
        };
    }

    return {
        ...sla,
        title: `আনুমানিক ${toBnDigits(sla.remainingDays)} দিন বাকি`,
        detail: `${toBnDigits(sla.targetDays)} কার্যদিবসের সেবা লক্ষ্যমাত্রা অনুযায়ী আবেদনটি চলছে।`,
        className: 'border-sky-200 bg-sky-50 text-sky-800',
        barClassName: 'bg-sky-500'
    };
}

export default async function TrackServiceRequestPage({ params }) {
    const { requestId } = await params;
    const lookup = decodeURIComponent(requestId || '').trim();
    if (!lookup) notFound();

    const supabase = createAdminClient();
    const { data: request, error } = await supabase
        .from('service_requests')
        .select(`
            *,
            household:households(
                owner_name,
                house_no,
                phone,
                village:villages(bn_name),
                ward:locations(name_bn)
            )
        `)
        .or(`id.eq.${lookup},certificate_no.eq.${lookup}`)
        .maybeSingle();

    if (error) throw error;
    if (!request) notFound();

    const [{ data: events }, { data: smsRows }] = await Promise.all([
        supabase
            .from('service_request_events')
            .select('status,note,created_at')
            .eq('service_request_id', request.id)
            .order('created_at', { ascending: true }),
        supabase
            .from('service_request_sms')
            .select('event_key,status,queued_at,sent_at,error_message')
            .eq('service_request_id', request.id)
            .order('queued_at', { ascending: false })
    ]);

    const currentStep = request.status === 'rejected'
        ? -1
        : Math.max(STATUS_STEPS.findIndex((step) => step.key === request.status), 0);
    const isFinal = ['ready', 'completed'].includes(request.status);
    const sla = getCitizenSlaMeta(request);

    return (
        <main className="min-h-screen bg-[#f4f7fb] px-4 py-5 text-slate-900 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-5xl">
                <Link
                    href="/"
                    className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:text-teal-700"
                >
                    <ArrowLeft size={16} />
                    DigiGram-এ ফিরে যান
                </Link>

                <section className="overflow-hidden rounded-[28px] bg-white shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
                    <div className="bg-slate-950 px-5 py-8 text-white sm:px-8">
                        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.25em] text-teal-300">Application Tracking</p>
                                <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                                    {REQUEST_LABELS[request.request_type] || 'সেবা আবেদন'}
                                </h1>
                                <p className="mt-2 text-sm font-bold text-slate-300">
                                    Tracking ID: <span className="break-all text-white">{request.id}</span>
                                </p>
                            </div>
                            <div className={`inline-flex w-fit items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black ${
                                request.status === 'rejected'
                                    ? 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/40'
                                    : 'bg-teal-500/15 text-teal-200 ring-1 ring-teal-400/40'
                            }`}>
                                {request.status === 'rejected' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                                {STATUS_LABELS[request.status] || request.status}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-5 p-5 sm:p-8 lg:grid-cols-[1.25fr_0.75fr]">
                        <div className="space-y-5">
                            <div className={`rounded-3xl border p-5 sm:p-6 ${sla.className}`}>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                                            <Hourglass size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest opacity-70">Service Timeline</p>
                                            <h2 className="mt-1 text-lg font-black sm:text-xl">{sla.title}</h2>
                                            <p className="mt-1 text-sm font-bold opacity-80">{sla.detail}</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 rounded-2xl bg-white/80 px-4 py-3 text-left shadow-sm sm:text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">লক্ষ্যমাত্রা</p>
                                        <p className="mt-1 text-sm font-black">{formatDate(sla.dueDate)}</p>
                                    </div>
                                </div>
                                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/80">
                                    <div
                                        className={`h-full rounded-full ${sla.barClassName}`}
                                        style={{ width: `${request.status === 'completed' ? 100 : Math.max(8, sla.progress)}%` }}
                                    />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs font-black opacity-70">
                                    <span>{toBnDigits(sla.ageDays)} দিন পার হয়েছে</span>
                                    <span>{toBnDigits(sla.targetDays)} দিনের লক্ষ্য</span>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
                                <h2 className="text-lg font-black text-slate-900">বর্তমান অবস্থা</h2>
                                {request.status === 'rejected' ? (
                                    <div className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">
                                        আবেদনটি বাতিল করা হয়েছে। বিস্তারিত জানতে ইউনিয়ন পরিষদে যোগাযোগ করুন।
                                    </div>
                                ) : (
                                    <div className="mt-5 grid gap-3 sm:grid-cols-4">
                                        {STATUS_STEPS.map((step, index) => {
                                            const Icon = step.icon;
                                            const done = index <= currentStep;
                                            return (
                                                <div
                                                    key={step.key}
                                                    className={`rounded-2xl border p-4 ${
                                                        done
                                                            ? 'border-teal-200 bg-teal-50 text-teal-800'
                                                            : 'border-slate-200 bg-white text-slate-400'
                                                    }`}
                                                >
                                                    <Icon size={20} />
                                                    <p className="mt-3 text-sm font-black">{step.label}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <InfoCard icon={FileText} label="আবেদনকারী" value={request.applicant_name || 'নাম নেই'} />
                                <InfoCard icon={Phone} label="মোবাইল" value={maskPhone(request.contact_phone)} />
                                <InfoCard icon={Home} label="বাড়ি/গ্রাম" value={`${request.household?.owner_name || 'বাড়ি'} · ${request.household?.village?.bn_name || 'গ্রাম নেই'}`} />
                                <InfoCard icon={CalendarDays} label="জমার তারিখ" value={formatDate(request.created_at)} />
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">এখন কী করবেন</p>
                                        <p className="mt-1 text-sm font-black text-slate-900">
                                            {request.status === 'pending' && 'আবেদন গ্রহণ করা হয়েছে। আপাতত নতুন করে আবেদন করার প্রয়োজন নেই।'}
                                            {request.status === 'processing' && 'অফিস যাচাই করছে। অতিরিক্ত কাগজ চাইলে SMS বা officer note-এ জানানো হবে।'}
                                            {request.status === 'ready' && (request.collection_date
                                                ? `${formatDate(request.collection_date)} তারিখে মূল কাগজপত্র নিয়ে ইউনিয়ন পরিষদে যান।`
                                                : 'সংগ্রহের তারিখ নিশ্চিত করতে ইউনিয়ন পরিষদে যোগাযোগ করুন।')}
                                            {request.status === 'completed' && 'সনদ বা সেবা সংগ্রহ করা হয়ে থাকলে আর কোনো পদক্ষেপ প্রয়োজন নেই।'}
                                            {request.status === 'rejected' && 'Officer note দেখে প্রয়োজনীয় তথ্য ঠিক করে ইউনিয়ন পরিষদে যোগাযোগ করুন।'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {request.feedback && (
                                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                                    <p className="text-xs font-black uppercase tracking-widest text-amber-600">Officer Note</p>
                                    <p className="mt-2 text-sm font-bold text-amber-900">{request.feedback}</p>
                                </div>
                            )}

                            {isFinal && (
                                <div className="rounded-3xl border border-teal-200 bg-teal-50 p-5">
                                    <p className="text-lg font-black text-teal-900">
                                        {request.status === 'completed' ? 'সেবা সম্পন্ন হয়েছে' : 'আবেদন প্রস্তুত হয়েছে'}
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-teal-700">
                                        {request.collection_date
                                            ? `সংগ্রহের তারিখ: ${formatDate(request.collection_date)}`
                                            : 'ইউনিয়ন পরিষদে যোগাযোগ করে সংগ্রহ করুন।'}
                                    </p>
                                    {request.certificate_no && (
                                        <Link
                                            href={`/certificate/${request.id}`}
                                            className="mt-4 inline-flex rounded-2xl bg-teal-700 px-5 py-3 text-sm font-black text-white transition hover:bg-teal-800"
                                        >
                                            সার্টিফিকেট প্রিভিউ দেখুন
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>

                        <aside className="space-y-5">
                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="flex items-center gap-2 text-lg font-black">
                                    <MessageSquareText size={20} />
                                    SMS আপডেট
                                </h3>
                                <div className="mt-4 space-y-3">
                                    {(smsRows || []).length === 0 ? (
                                        <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                                            এখনো SMS queue পাওয়া যায়নি।
                                        </p>
                                    ) : (
                                        smsRows.map((sms, index) => (
                                            <div key={`${sms.event_key}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                                                <p className="text-sm font-black text-slate-800">{STATUS_LABELS[sms.event_key] || sms.event_key}</p>
                                                <p className="mt-1 text-xs font-bold text-slate-500">
                                                    {sms.sent_at ? `পাঠানো: ${formatDate(sms.sent_at)}` : `Queue: ${formatDate(sms.queued_at)}`}
                                                </p>
                                                {sms.error_message && <p className="mt-1 text-xs font-bold text-rose-600">{sms.error_message}</p>}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="text-lg font-black">অফিস টাইমলাইন</h3>
                                <div className="mt-4 space-y-4">
                                    {(events || []).length === 0 ? (
                                        <p className="text-sm font-bold text-slate-500">প্রাথমিক আবেদন জমা হয়েছে।</p>
                                    ) : (
                                        events.map((event, index) => (
                                            <div key={`${event.status}-${index}`} className="border-l-2 border-teal-200 pl-4">
                                                <p className="text-sm font-black text-slate-900">{STATUS_LABELS[event.status] || event.status}</p>
                                                <p className="text-xs font-bold text-slate-500">{formatDate(event.created_at)}</p>
                                                {event.note && <p className="mt-1 text-xs font-semibold text-slate-600">{event.note}</p>}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                </section>
            </div>
        </main>
    );
}

function InfoCard({ icon: Icon, label, value }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-teal-700">
                    <Icon size={20} />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="mt-1 truncate text-sm font-black text-slate-900">{value}</p>
                </div>
            </div>
        </div>
    );
}

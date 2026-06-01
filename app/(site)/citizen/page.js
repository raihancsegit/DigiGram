'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import {
    Bell,
    Banknote,
    BriefcaseBusiness,
    CalendarCheck,
    Droplet,
    FileText,
    HeartPulse,
    Home,
    IdCard,
    Leaf,
    Loader2,
    ListChecks,
    MapPin,
    MessageSquareWarning,
    Phone,
    ShoppingBag,
    ShieldCheck,
    TicketCheck,
    HelpCircle
} from 'lucide-react';
import { toBnDigits } from '@/lib/utils/format';
import { searchLocations } from '@/lib/services/hierarchyService';
import RelatedServiceLinks from '@/components/common/RelatedServiceLinks';
import { menuStyles } from '@/components/common/menuStyles';

const STATUS_LABELS = {
    pending: 'অপেক্ষমাণ',
    processing: 'প্রক্রিয়াধীন',
    ready: 'প্রস্তুত',
    completed: 'সম্পন্ন',
    rejected: 'বাতিল',
    submitted: 'জমা হয়েছে',
    reviewing: 'পর্যালোচনায়',
    assigned: 'দায়িত্ব দেওয়া হয়েছে',
    resolved: 'সমাধান হয়েছে',
    active: 'চলমান',
    matched: 'ডোনার পাওয়া গেছে',
    closed: 'বন্ধ'
};

const PRIORITY_LABELS = {
    low: 'Low',
    normal: 'Normal',
    urgent: 'Urgent',
    emergency: 'Emergency'
};

function formatDate(value) {
    if (!value) return '';
    return toBnDigits(new Date(value).toLocaleDateString('bn-BD'));
}

async function postJson(url, payload) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Request failed');
    return result;
}

export default function CitizenCenterPage() {
    const { selected } = useSelector((state) => state.location);
    const [phone, setPhone] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [debugCode, setDebugCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [inbox, setInbox] = useState(null);
    const [activeInboxTab, setActiveInboxTab] = useState('timeline');
    const [complaint, setComplaint] = useState({ citizenName: '', complaintType: 'road', priority: 'normal', title: '', description: '', locationText: '' });
    const [appointment, setAppointment] = useState({ citizenName: '', appointmentType: 'office_visit', priority: 'normal', title: '', description: '', locationText: '', preferredDate: '', preferredTimeSlot: 'morning' });
    const [lifeSupport, setLifeSupport] = useState({ citizenName: '', caseType: 'document', category: '', priority: 'normal', title: '', description: '', locationText: '' });
    const [blood, setBlood] = useState({ requesterName: '', bloodGroup: 'A+', patientName: '', hospitalOrLocation: '', neededAt: '', note: '' });
    const [locationQuery, setLocationQuery] = useState('');
    const [locationResults, setLocationResults] = useState([]);
    const [selectedScope, setSelectedScope] = useState({ scopeType: '', scopeId: '', label: '' });
    const [notice, setNotice] = useState('');
    const [lastAction, setLastAction] = useState(null);

    useEffect(() => {
        if (selected?.wardId && selected?.ward) {
            setSelectedScope({ scopeType: 'ward', scopeId: selected.wardId, label: `${selected.ward}, ${selected.union || ''}` });
        }
    }, [selected?.wardId, selected?.ward, selected?.union]);

    useEffect(() => {
        let active = true;
        if (!locationQuery || locationQuery.trim().length < 2) {
            setLocationResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            const results = await searchLocations(locationQuery.trim());
            if (active) setLocationResults(results || []);
        }, 300);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [locationQuery]);

    const totals = useMemo(() => {
        if (!inbox) return { services: 0, complaints: 0, blood: 0, reminders: 0 };
        return {
            services: inbox.serviceRequests?.length || 0,
            complaints: inbox.complaints?.length || 0,
            appointments: inbox.appointments?.length || 0,
            lifeSupport: inbox.lifeSupportCases?.length || 0,
            blood: inbox.bloodRequests?.length || 0,
            reminders: inbox.reminders?.length || 0,
            taxes: inbox.householdTaxes?.filter((item) => item.status !== 'paid')?.length || 0,
            timeline: inbox.timeline?.length || 0
        };
    }, [inbox]);

    async function requestOtp(event) {
        event.preventDefault();
        setLoading(true);
        setNotice('');
        try {
            const result = await postJson('/api/citizen/otp', { phone });
            setDebugCode(result.debugCode || '');
            setNotice('OTP পাঠানো হয়েছে। Development mode হলে নিচে code দেখাবে।');
        } catch (error) {
            setNotice(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadInbox(event) {
        event.preventDefault();
        setLoading(true);
        setNotice('');
        try {
            const result = await postJson('/api/citizen/inbox', { phone, otpCode });
            setInbox(result.data);
            setNotice('আপনার citizen inbox load হয়েছে।');
        } catch (error) {
            setNotice(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function submitComplaint(event) {
        event.preventDefault();
        setLoading(true);
        setNotice('');
        try {
            const result = await postJson('/api/citizen/complaints', { phone, ...complaint, scopeType: selectedScope.scopeType || null, scopeId: selectedScope.scopeId || null });
            setComplaint({ citizenName: complaint.citizenName, complaintType: 'road', priority: 'normal', title: '', description: '', locationText: '' });
            setLastAction({
                type: 'complaint',
                title: 'Complaint জমা হয়েছে',
                referenceId: result.data?.id,
                status: result.data?.status || 'submitted',
                message: 'দায়িত্বপ্রাপ্ত অফিসার review করলে citizen inbox এবং SMS update পাবেন।',
                smsQueued: result.sms?.queued,
                nextTab: 'complaints'
            });
            setNotice('Complaint জমা হয়েছে। এলাকা select করা থাকলে সংশ্লিষ্ট ইউনিয়ন/ওয়ার্ড পোর্টালে যাবে এবং SMS balance থাকলে SMS যাবে।');
            if (otpCode) await loadInbox({ preventDefault() {} });
        } catch (error) {
            setNotice(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function submitAppointment(event) {
        event.preventDefault();
        setLoading(true);
        setNotice('');
        try {
            const result = await postJson('/api/citizen/appointments', {
                phone,
                ...appointment,
                scopeType: selectedScope.scopeType || null,
                scopeId: selectedScope.scopeId || null
            });
            setAppointment({
                citizenName: appointment.citizenName,
                appointmentType: 'office_visit',
                priority: 'normal',
                title: '',
                description: '',
                locationText: '',
                preferredDate: '',
                preferredTimeSlot: 'morning'
            });
            setLastAction({
                type: 'appointment',
                title: 'Office serial request জমা হয়েছে',
                referenceId: result.data?.id,
                status: result.data?.status || 'submitted',
                message: result.data?.serial_no
                    ? `আপনার serial ${toBnDigits(result.data.serial_no)}। Officer schedule করলে SMS/Inbox update পাবেন।`
                    : 'Officer schedule করলে SMS/Inbox update পাবেন।',
                smsQueued: result.sms?.queued,
                nextTab: 'appointments'
            });
            setNotice('Office serial/appointment request জমা হয়েছে। SMS balance থাকলে citizen-কে SMS যাবে।');
            if (otpCode) await loadInbox({ preventDefault() {} });
        } catch (error) {
            setNotice(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function submitLifeSupport(event) {
        event.preventDefault();
        setLoading(true);
        setNotice('');
        try {
            const result = await postJson('/api/citizen/life-support', {
                phone,
                ...lifeSupport,
                scopeType: selectedScope.scopeType || null,
                scopeId: selectedScope.scopeId || null
            });
            setLifeSupport({
                citizenName: lifeSupport.citizenName,
                caseType: 'document',
                category: '',
                priority: 'normal',
                title: '',
                description: '',
                locationText: ''
            });
            setLastAction({
                type: 'life_support',
                title: 'Life support request জমা হয়েছে',
                referenceId: result.data?.id,
                status: result.data?.status || 'submitted',
                message: 'Officer review করলে SMS/Inbox update পাবেন।',
                smsQueued: result.sms?.queued,
                nextTab: 'lifeSupport'
            });
            setNotice('Request জমা হয়েছে। Document/benefit/health/problem/job/farmer desk থেকে follow-up হবে।');
            if (otpCode) await loadInbox({ preventDefault() {} });
        } catch (error) {
            setNotice(error.message);
        } finally {
            setLoading(false);
        }
    }

    function selectComplaintLocation(item) {
        if (!item) return;
        let scopeType = item.type;
        let scopeId = item.id;
        let label = item.name_bn || item.name_en || '';

        if (item.type === 'ward') {
            label = `${item.name_bn || item.name_en}, ${item.parent?.name_bn || ''}`;
        }
        if (item.type === 'village') {
            label = `${item.name_bn || item.name_en}, ${item.parent?.name_bn || ''}, ${item.parent?.parent?.name_bn || ''}`;
        }

        setSelectedScope({ scopeType, scopeId, label });
        setLocationQuery('');
        setLocationResults([]);
    }

    async function submitBlood(event) {
        event.preventDefault();
        setLoading(true);
        setNotice('');
        try {
            const result = await postJson('/api/citizen/blood', { phone, ...blood });
            setBlood({ requesterName: blood.requesterName, bloodGroup: 'A+', patientName: '', hospitalOrLocation: '', neededAt: '', note: '' });
            setLastAction({
                type: 'blood',
                title: 'Blood request জমা হয়েছে',
                referenceId: result.data?.id,
                status: result.data?.status || 'active',
                message: `সম্ভাব্য donor ${toBnDigits(result.possibleDonors?.length || 0)} জন পাওয়া গেছে। দায়িত্বপ্রাপ্ত team follow-up করবে।`,
                smsQueued: null,
                nextTab: 'blood'
            });
            setNotice(`Blood request জমা হয়েছে। সম্ভাব্য donor: ${toBnDigits(result.possibleDonors?.length || 0)} জন।`);
            if (otpCode) await loadInbox({ preventDefault() {} });
        } catch (error) {
            setNotice(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#f5f8fb] px-4 py-5 text-slate-900 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-6xl">
                <section className="overflow-hidden rounded-[34px] bg-slate-950 text-white shadow-2xl shadow-slate-300/50">
                    <div className="grid gap-6 p-6 md:grid-cols-[1fr_0.8fr] md:p-9">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-300">Citizen Center</p>
                            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">আপনার সব কাজ এক inbox-এ</h1>
                            <p className="mt-4 max-w-2xl text-sm font-bold text-slate-300">
                                আবেদন, complaint, blood emergency, reminder এবং household update শুধু মোবাইল নম্বর দিয়ে দেখুন।
                            </p>
                        </div>
                        <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/10">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="text-teal-300" />
                                <p className="font-black">OTP verified access</p>
                            </div>
                            <p className="mt-3 text-sm font-bold text-slate-300">
                                ব্যক্তিগত তথ্য দেখার আগে মোবাইল OTP লাগে, তাই অন্য কেউ আপনার inbox দেখতে পারবে না।
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <QuickLinkCard
                        href="#complaint"
                        icon={MessageSquareWarning}
                        title="Complaint দিন"
                        text="এলাকা select করে সমস্যা জমা দিন।"
                        tone="rose"
                    />
                    <QuickLinkCard
                        href="#blood"
                        icon={Droplet}
                        title="Blood emergency"
                        text="রক্ত দরকার হলে দ্রুত request করুন।"
                        tone="red"
                    />
                    <QuickLinkCard
                        href="/services/market"
                        icon={ShoppingBag}
                        title="বাজার দর"
                        text="দাম alert ও demand board দেখুন।"
                        tone="amber"
                    />
                    <QuickLinkCard
                        href="/lost-found"
                        icon={HelpCircle}
                        title="হারানো-প্রাপ্তি"
                        text="Report, claim ও verified return।"
                        tone="indigo"
                    />
                </section>

                <RelatedServiceLinks
                    currentKey="citizen"
                    preset="citizen"
                    title="নাগরিক কাজের পাশে দরকারি link"
                    subtitle="Complaint, blood, বাজার দর বা হারানো-প্রাপ্তি একই জায়গা থেকে খুলুন।"
                    className="mt-5"
                />

                <CitizenDailyDashboard />

                <CitizenServiceShortcuts />

                <CitizenJourney />

                <section id="inbox" className="mt-5 grid scroll-mt-24 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <Phone className="text-teal-600" />
                            <h2 className="text-xl font-black">মোবাইল যাচাই</h2>
                        </div>
                        <form onSubmit={requestOtp} className="grid gap-3">
                            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" className="rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-teal-400" />
                            <button disabled={loading} className="rounded-2xl bg-teal-600 px-4 py-3 font-black text-white disabled:opacity-50">
                                OTP নিন
                            </button>
                        </form>
                        <form onSubmit={loadInbox} className="mt-4 grid gap-3">
                            <input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="OTP code" className="rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-teal-400" />
                            <button disabled={loading} className="rounded-2xl bg-slate-950 px-4 py-3 font-black text-white disabled:opacity-50">
                                {loading ? <Loader2 className="mx-auto animate-spin" /> : 'Inbox দেখুন'}
                            </button>
                        </form>
                        {debugCode && (
                            <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-black text-amber-700">
                                Dev OTP: {debugCode}
                            </p>
                        )}
                        {notice && <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-600">{notice}</p>}
                        {lastAction && (
                            <ActionSuccessCard
                                action={lastAction}
                                hasInbox={Boolean(inbox)}
                                onOpenInbox={() => {
                                    if (lastAction.nextTab) setActiveInboxTab(lastAction.nextTab);
                                }}
                            />
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                        <Metric icon={FileText} label="আবেদন" value={totals.services} />
                        <Metric icon={CalendarCheck} label="Serial" value={totals.appointments} />
                        <Metric icon={ShieldCheck} label="Support" value={totals.lifeSupport} />
                        <Metric icon={MessageSquareWarning} label="Complaint" value={totals.complaints} />
                        <Metric icon={Droplet} label="Blood" value={totals.blood} />
                        <Metric icon={Banknote} label="Tax due" value={totals.taxes} />
                    </div>
                </section>

                {inbox && (
                    <section className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="space-y-5">
                            <InboxActionCenter
                                inbox={inbox}
                                totals={totals}
                                activeTab={activeInboxTab}
                                setActiveTab={setActiveInboxTab}
                            />
                            <CitizenReadinessCard inbox={inbox} totals={totals} setActiveTab={setActiveInboxTab} />

                            <div className="rounded-[30px] border border-slate-200 bg-white p-3 shadow-sm">
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-9">
                                    {[
                                        ['timeline', 'Timeline', ListChecks, totals.timeline],
                                        ['appointments', 'Serial', CalendarCheck, totals.appointments],
                                        ['lifeSupport', 'Support', ShieldCheck, totals.lifeSupport],
                                        ['services', 'আবেদন', FileText, totals.services],
                                        ['complaints', 'অভিযোগ', MessageSquareWarning, totals.complaints],
                                        ['blood', 'রক্ত', Droplet, totals.blood],
                                        ['reminders', 'Reminder', Bell, totals.reminders],
                                        ['taxes', 'Tax', Banknote, inbox.householdTaxes?.length || 0],
                                        ['households', 'বাড়ি', Home, inbox.households?.length || 0]
                                    ].map(([id, label, Icon, count]) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setActiveInboxTab(id)}
                                            aria-current={activeInboxTab === id ? 'page' : undefined}
                                            className={`rounded-2xl px-3 py-3 text-left transition-all ${menuStyles.tab(activeInboxTab === id, 'teal')}`}
                                        >
                                            <Icon size={18} />
                                            <span className="mt-2 block text-xs font-black">{label}</span>
                                            <span className="text-lg font-black">{toBnDigits(count || 0)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {activeInboxTab === 'timeline' && (
                                <Panel title="Citizen timeline" icon={ListChecks}>
                                    {(inbox.timeline || []).length === 0 ? <Empty text="এখনো timeline update নেই।" /> : (
                                        <div className="space-y-3">
                                            {inbox.timeline.map((item) => (
                                                <TimelineItem key={item.id} item={item} />
                                            ))}
                                        </div>
                                    )}
                                </Panel>
                            )}

                            {activeInboxTab === 'services' && (
                                <Panel title="সেবা আবেদন" icon={FileText}>
                                    {(inbox.serviceRequests || []).length === 0 ? <Empty text="এই মোবাইলে কোনো আবেদন নেই।" /> : inbox.serviceRequests.map((item) => (
                                        <div key={item.id} className="rounded-3xl border border-slate-200 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-black text-slate-900">{item.request_type}</p>
                                                    <p className="text-xs font-bold text-slate-400">{formatDate(item.created_at)}</p>
                                                </div>
                                                <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-black text-teal-700">{STATUS_LABELS[item.status] || item.status}</span>
                                            </div>
                                            <Link href={`/track/${item.id}`} className="mt-3 inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white">Track করুন</Link>
                                        </div>
                                    ))}
                                </Panel>
                            )}

                            {activeInboxTab === 'appointments' && (
                                <Panel title="Office serial / Appointment" icon={CalendarCheck}>
                                    {(inbox.appointments || []).length === 0 ? <Empty text="এখনো appointment/serial request নেই।" /> : inbox.appointments.map((item) => (
                                        <div key={item.id} className="rounded-3xl border border-slate-200 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-black text-slate-900">{item.title}</p>
                                                    <p className="mt-1 text-sm font-bold text-slate-500">{item.description || item.location_text || 'Office visit request'}</p>
                                                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black text-slate-600">
                                                        {item.serial_no && <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-700">Serial {toBnDigits(item.serial_no)}</span>}
                                                        {item.preferred_date && <span className="rounded-full bg-slate-100 px-3 py-1">Preferred {formatDate(item.preferred_date)}</span>}
                                                        {item.scheduled_at && <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">সময় {new Date(item.scheduled_at).toLocaleString('bn-BD')}</span>}
                                                    </div>
                                                    {item.feedback && <p className="mt-3 rounded-2xl bg-teal-50 p-3 text-xs font-black text-teal-700">Feedback: {item.feedback}</p>}
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black text-indigo-700">{STATUS_LABELS[item.status] || item.status}</span>
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">{PRIORITY_LABELS[item.priority] || 'Normal'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </Panel>
                            )}

                            {activeInboxTab === 'lifeSupport' && (
                                <Panel title="Daily life support requests" icon={ShieldCheck}>
                                    {(inbox.lifeSupportCases || []).length === 0 ? <Empty text="এখনো life support request নেই।" /> : inbox.lifeSupportCases.map((item) => (
                                        <div key={item.id} className="rounded-3xl border border-slate-200 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-black text-slate-900">{item.title}</p>
                                                    <p className="mt-1 text-sm font-bold text-slate-500">{item.description || item.location_text || item.category || item.case_type}</p>
                                                    {item.scheduled_at && <p className="mt-2 rounded-2xl bg-indigo-50 p-3 text-xs font-black text-indigo-700">সময়: {new Date(item.scheduled_at).toLocaleString('bn-BD')}</p>}
                                                    {item.feedback && <p className="mt-2 rounded-2xl bg-teal-50 p-3 text-xs font-black text-teal-700">Feedback: {item.feedback}</p>}
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-black text-teal-700">{item.case_type}</span>
                                                    <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-700">{STATUS_LABELS[item.status] || item.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </Panel>
                            )}

                            {activeInboxTab === 'complaints' && (
                                <Panel title="Complaint / সমস্যা রিপোর্ট" icon={MessageSquareWarning}>
                                    {(inbox.complaints || []).length === 0 ? <Empty text="এখনো complaint নেই।" /> : inbox.complaints.map((item) => (
                                        <div key={item.id} className="rounded-3xl border border-slate-200 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-black text-slate-900">{item.title}</p>
                                                    <p className="mt-1 text-sm font-bold text-slate-500">{item.description || item.location_text}</p>
                                                    {item.feedback && <p className="mt-3 rounded-2xl bg-teal-50 p-3 text-xs font-black text-teal-700">Feedback: {item.feedback}</p>}
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-700">{STATUS_LABELS[item.status] || item.status}</span>
                                                    <span className="rounded-full bg-rose-50 px-3 py-1 text-[10px] font-black text-rose-700">{PRIORITY_LABELS[item.priority] || 'Normal'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </Panel>
                            )}

                            {activeInboxTab === 'blood' && (
                                <Panel title="Blood request" icon={Droplet}>
                                    {(inbox.bloodRequests || []).length === 0 ? <Empty text="এখনো blood request নেই।" /> : inbox.bloodRequests.map((item) => (
                                        <div key={item.id} className="rounded-3xl border border-slate-200 p-4">
                                            <p className="font-black text-slate-900">{item.blood_group} - {item.patient_name || 'রোগী'}</p>
                                            <p className="mt-1 text-sm font-bold text-slate-500">{item.hospital_or_location}</p>
                                            <span className="mt-3 inline-flex rounded-full bg-rose-50 px-3 py-1 text-[10px] font-black text-rose-700">{STATUS_LABELS[item.status] || item.status}</span>
                                        </div>
                                    ))}
                                </Panel>
                            )}

                            {activeInboxTab === 'reminders' && (
                                <Panel title="Reminder / SMS update" icon={Bell}>
                                    {(inbox.reminders || []).length === 0 ? <Empty text="এখনো reminder নেই।" /> : inbox.reminders.map((item) => (
                                        <div key={item.id} className="rounded-3xl border border-slate-200 p-4">
                                            <p className="font-black text-slate-900">{item.title}</p>
                                            <p className="mt-1 text-sm font-bold text-slate-500">{item.body}</p>
                                            <p className="mt-2 text-[11px] font-black text-slate-400">{formatDate(item.created_at)}</p>
                                        </div>
                                    ))}
                                </Panel>
                            )}

                            {activeInboxTab === 'taxes' && (
                                <Panel title="Holding tax / বকেয়া" icon={Banknote}>
                                    {(inbox.householdTaxes || []).length === 0 ? <Empty text="এই মোবাইলে linked household tax পাওয়া যায়নি।" /> : inbox.householdTaxes.map((item) => (
                                        <div key={item.id} className="rounded-3xl border border-slate-200 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-black text-slate-900">{item.fiscal_year_label || item.year || 'Tax record'}</p>
                                                    <p className="mt-1 text-sm font-bold text-slate-500">Due: {toBnDigits(item.amount_due || 0)} · Paid: {toBnDigits(item.amount_paid || 0)}</p>
                                                    {item.due_date && <p className="mt-1 text-[11px] font-black text-amber-600">Deadline: {formatDate(item.due_date)}</p>}
                                                </div>
                                                <span className={`rounded-full px-3 py-1 text-[10px] font-black ${item.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {item.status || 'due'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </Panel>
                            )}

                            {activeInboxTab === 'households' && (
                                <Panel title="Household" icon={Home}>
                                    {(inbox.households || []).length === 0 ? <Empty text="এই মোবাইলে কোনো household নেই।" /> : inbox.households.map((item) => (
                                        <div key={item.id} className="rounded-3xl border border-slate-200 p-4">
                                            <p className="font-black text-slate-900">{item.owner_name}</p>
                                            <p className="mt-1 text-sm font-bold text-slate-500">হোল্ডিং: {item.house_no || item.id}</p>
                                            <Link href={`/h/${item.id}`} className="mt-3 inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white">Profile দেখুন</Link>
                                        </div>
                                    ))}
                                </Panel>
                            )}
                        </div>

                        <div className="space-y-5">
                            <div id="appointment" className="scroll-mt-24">
                                <Panel title="Office serial / Appointment" icon={CalendarCheck}>
                                    <AppointmentForm
                                        appointment={appointment}
                                        setAppointment={setAppointment}
                                        loading={loading}
                                        onSubmit={submitAppointment}
                                        locationQuery={locationQuery}
                                        setLocationQuery={setLocationQuery}
                                        locationResults={locationResults}
                                        selectedScope={selectedScope}
                                        onSelectLocation={selectComplaintLocation}
                                        onClearLocation={() => setSelectedScope({ scopeType: '', scopeId: '', label: '' })}
                                    />
                                </Panel>
                            </div>

                            <div id="life-support" className="scroll-mt-24">
                                <Panel title="Document, Benefit, Health, Job, Farmer help" icon={ShieldCheck}>
                                    <LifeSupportForm
                                        lifeSupport={lifeSupport}
                                        setLifeSupport={setLifeSupport}
                                        loading={loading}
                                        onSubmit={submitLifeSupport}
                                        locationQuery={locationQuery}
                                        setLocationQuery={setLocationQuery}
                                        locationResults={locationResults}
                                        selectedScope={selectedScope}
                                        onSelectLocation={selectComplaintLocation}
                                        onClearLocation={() => setSelectedScope({ scopeType: '', scopeId: '', label: '' })}
                                    />
                                </Panel>
                            </div>

                            <div id="complaint" className="scroll-mt-24">
                            <Panel title="নতুন Complaint" icon={TicketCheck}>
                                <form onSubmit={submitComplaint} className="grid gap-3">
                                    <input value={complaint.citizenName} onChange={(e) => setComplaint({ ...complaint, citizenName: e.target.value })} placeholder="আপনার নাম" className={inputClass} />
                                    <ComplaintLocationPicker
                                        query={locationQuery}
                                        setQuery={setLocationQuery}
                                        results={locationResults}
                                        selectedScope={selectedScope}
                                        onSelect={selectComplaintLocation}
                                        onClear={() => setSelectedScope({ scopeType: '', scopeId: '', label: '' })}
                                    />
                                    <select value={complaint.complaintType} onChange={(e) => setComplaint({ ...complaint, complaintType: e.target.value })} className={inputClass}>
                                        <option value="road">রাস্তা</option>
                                        <option value="light">লাইট</option>
                                        <option value="water">পানি</option>
                                        <option value="certificate_delay">সনদ/আবেদন delay</option>
                                        <option value="office_appointment">অফিস serial / appointment</option>
                                        <option value="health_checkup">Health checkup / টিকা camp</option>
                                        <option value="general">অন্যান্য</option>
                                    </select>
                                    <select value={complaint.priority} onChange={(e) => setComplaint({ ...complaint, priority: e.target.value })} className={inputClass}>
                                        <option value="normal">সাধারণ</option>
                                        <option value="urgent">জরুরি</option>
                                        <option value="emergency">খুব জরুরি</option>
                                        <option value="low">কম গুরুত্বপূর্ণ</option>
                                    </select>
                                    <input required value={complaint.title} onChange={(e) => setComplaint({ ...complaint, title: e.target.value })} placeholder="সমস্যার শিরোনাম" className={inputClass} />
                                    <input value={complaint.locationText} onChange={(e) => setComplaint({ ...complaint, locationText: e.target.value })} placeholder="লোকেশন" className={inputClass} />
                                    <textarea value={complaint.description} onChange={(e) => setComplaint({ ...complaint, description: e.target.value })} placeholder="বিস্তারিত লিখুন" className={`${inputClass} min-h-[100px]`} />
                                    <button disabled={loading} className="rounded-2xl bg-slate-950 px-4 py-3 font-black text-white disabled:opacity-50">Complaint জমা দিন</button>
                                </form>
                            </Panel>
                            </div>

                            <div id="blood" className="scroll-mt-24">
                            <Panel title="Blood Emergency" icon={Droplet}>
                                <form onSubmit={submitBlood} className="grid gap-3">
                                    <input value={blood.requesterName} onChange={(e) => setBlood({ ...blood, requesterName: e.target.value })} placeholder="আপনার নাম" className={inputClass} />
                                    <select value={blood.bloodGroup} onChange={(e) => setBlood({ ...blood, bloodGroup: e.target.value })} className={inputClass}>
                                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((group) => <option key={group}>{group}</option>)}
                                    </select>
                                    <input value={blood.patientName} onChange={(e) => setBlood({ ...blood, patientName: e.target.value })} placeholder="রোগীর নাম" className={inputClass} />
                                    <input value={blood.hospitalOrLocation} onChange={(e) => setBlood({ ...blood, hospitalOrLocation: e.target.value })} placeholder="হাসপাতাল/লোকেশন" className={inputClass} />
                                    <input type="datetime-local" value={blood.neededAt} onChange={(e) => setBlood({ ...blood, neededAt: e.target.value })} className={inputClass} />
                                    <button disabled={loading} className="rounded-2xl bg-rose-600 px-4 py-3 font-black text-white disabled:opacity-50">Blood request দিন</button>
                                </form>
                            </Panel>
                            </div>
                        </div>
                    </section>
                )}

                {!inbox && (
                    <>
                        <section className="mt-5 grid gap-4 md:grid-cols-3">
                            <Feature icon={Home} title="Household update" text="আপনার বাড়ি, সদস্য, আবেদন ও tax update এক জায়গায়।" />
                            <Feature icon={TicketCheck} title="Complaint ticket" text="সমস্যা জমা দিন, status দেখুন, follow-up কমান।" />
                            <Feature icon={Droplet} title="Blood help" text="Blood দরকার হলে request দিন, donor data থেকে match করা যাবে।" />
                        </section>

                        <section className="mt-5 grid gap-5 lg:grid-cols-2">
                            <div id="life-support" className="scroll-mt-24">
                                <Panel title="Document, Benefit, Health, Job, Farmer help" icon={ShieldCheck}>
                                    <LifeSupportForm
                                        lifeSupport={lifeSupport}
                                        setLifeSupport={setLifeSupport}
                                        loading={loading}
                                        onSubmit={submitLifeSupport}
                                        locationQuery={locationQuery}
                                        setLocationQuery={setLocationQuery}
                                        locationResults={locationResults}
                                        selectedScope={selectedScope}
                                        onSelectLocation={selectComplaintLocation}
                                        onClearLocation={() => setSelectedScope({ scopeType: '', scopeId: '', label: '' })}
                                    />
                                </Panel>
                            </div>

                            <div id="appointment" className="scroll-mt-24">
                                <Panel title="Office serial / Appointment" icon={CalendarCheck}>
                                    <AppointmentForm
                                        appointment={appointment}
                                        setAppointment={setAppointment}
                                        loading={loading}
                                        onSubmit={submitAppointment}
                                        locationQuery={locationQuery}
                                        setLocationQuery={setLocationQuery}
                                        locationResults={locationResults}
                                        selectedScope={selectedScope}
                                        onSelectLocation={selectComplaintLocation}
                                        onClearLocation={() => setSelectedScope({ scopeType: '', scopeId: '', label: '' })}
                                    />
                                </Panel>
                            </div>

                            <div id="complaint" className="scroll-mt-24">
                                <Panel title="নতুন Complaint" icon={TicketCheck}>
                                    <form onSubmit={submitComplaint} className="grid gap-3">
                                        <input value={complaint.citizenName} onChange={(e) => setComplaint({ ...complaint, citizenName: e.target.value })} placeholder="আপনার নাম" className={inputClass} />
                                        <ComplaintLocationPicker
                                            query={locationQuery}
                                            setQuery={setLocationQuery}
                                            results={locationResults}
                                            selectedScope={selectedScope}
                                            onSelect={selectComplaintLocation}
                                            onClear={() => setSelectedScope({ scopeType: '', scopeId: '', label: '' })}
                                        />
                                        <select value={complaint.complaintType} onChange={(e) => setComplaint({ ...complaint, complaintType: e.target.value })} className={inputClass}>
                                            <option value="road">রাস্তা</option>
                                            <option value="light">লাইট</option>
                                            <option value="water">পানি</option>
                                            <option value="certificate_delay">সনদ/আবেদন delay</option>
                                            <option value="office_appointment">অফিস serial / appointment</option>
                                            <option value="health_checkup">Health checkup / টিকা camp</option>
                                            <option value="general">অন্যান্য</option>
                                        </select>
                                        <select value={complaint.priority} onChange={(e) => setComplaint({ ...complaint, priority: e.target.value })} className={inputClass}>
                                            <option value="normal">সাধারণ</option>
                                            <option value="urgent">জরুরি</option>
                                            <option value="emergency">খুব জরুরি</option>
                                            <option value="low">কম গুরুত্বপূর্ণ</option>
                                        </select>
                                        <input required value={complaint.title} onChange={(e) => setComplaint({ ...complaint, title: e.target.value })} placeholder="সমস্যার শিরোনাম" className={inputClass} />
                                        <input value={complaint.locationText} onChange={(e) => setComplaint({ ...complaint, locationText: e.target.value })} placeholder="লোকেশন" className={inputClass} />
                                        <textarea value={complaint.description} onChange={(e) => setComplaint({ ...complaint, description: e.target.value })} placeholder="বিস্তারিত লিখুন" className={`${inputClass} min-h-[100px]`} />
                                        <button disabled={loading} className="rounded-2xl bg-slate-950 px-4 py-3 font-black text-white disabled:opacity-50">Complaint জমা দিন</button>
                                    </form>
                                </Panel>
                            </div>

                            <div id="blood" className="scroll-mt-24">
                                <Panel title="Blood Emergency" icon={Droplet}>
                                    <form onSubmit={submitBlood} className="grid gap-3">
                                        <input value={blood.requesterName} onChange={(e) => setBlood({ ...blood, requesterName: e.target.value })} placeholder="আপনার নাম" className={inputClass} />
                                        <select value={blood.bloodGroup} onChange={(e) => setBlood({ ...blood, bloodGroup: e.target.value })} className={inputClass}>
                                            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((group) => <option key={group}>{group}</option>)}
                                        </select>
                                        <input value={blood.patientName} onChange={(e) => setBlood({ ...blood, patientName: e.target.value })} placeholder="রোগীর নাম" className={inputClass} />
                                        <input value={blood.hospitalOrLocation} onChange={(e) => setBlood({ ...blood, hospitalOrLocation: e.target.value })} placeholder="হাসপাতাল/লোকেশন" className={inputClass} />
                                        <input type="datetime-local" value={blood.neededAt} onChange={(e) => setBlood({ ...blood, neededAt: e.target.value })} className={inputClass} />
                                        <button disabled={loading} className="rounded-2xl bg-rose-600 px-4 py-3 font-black text-white disabled:opacity-50">Blood request দিন</button>
                                    </form>
                                </Panel>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}

const inputClass = 'rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-teal-400';

function AppointmentForm({
    appointment,
    setAppointment,
    loading,
    onSubmit,
    locationQuery,
    setLocationQuery,
    locationResults,
    selectedScope,
    onSelectLocation,
    onClearLocation
}) {
    return (
        <form onSubmit={onSubmit} className="grid gap-3">
            <input
                value={appointment.citizenName}
                onChange={(event) => setAppointment({ ...appointment, citizenName: event.target.value })}
                placeholder="আপনার নাম"
                className={inputClass}
            />
            <ComplaintLocationPicker
                query={locationQuery}
                setQuery={setLocationQuery}
                results={locationResults}
                selectedScope={selectedScope}
                onSelect={onSelectLocation}
                onClear={onClearLocation}
            />
            <div className="grid gap-3 sm:grid-cols-2">
                <select
                    value={appointment.appointmentType}
                    onChange={(event) => setAppointment({ ...appointment, appointmentType: event.target.value })}
                    className={inputClass}
                >
                    <option value="office_visit">Office visit</option>
                    <option value="chairman_meeting">Chairman meeting</option>
                    <option value="member_meeting">Ward member meeting</option>
                    <option value="certificate_help">Certificate help</option>
                    <option value="tax_help">Tax/payment help</option>
                    <option value="health_checkup">Health/checkup camp</option>
                </select>
                <select
                    value={appointment.priority}
                    onChange={(event) => setAppointment({ ...appointment, priority: event.target.value })}
                    className={inputClass}
                >
                    <option value="normal">সাধারণ</option>
                    <option value="urgent">জরুরি</option>
                    <option value="emergency">খুব জরুরি</option>
                    <option value="low">কম গুরুত্বপূর্ণ</option>
                </select>
            </div>
            <input
                required
                value={appointment.title}
                onChange={(event) => setAppointment({ ...appointment, title: event.target.value })}
                placeholder="কাজের বিষয় লিখুন"
                className={inputClass}
            />
            <div className="grid gap-3 sm:grid-cols-2">
                <input
                    type="date"
                    value={appointment.preferredDate}
                    onChange={(event) => setAppointment({ ...appointment, preferredDate: event.target.value })}
                    className={inputClass}
                />
                <select
                    value={appointment.preferredTimeSlot}
                    onChange={(event) => setAppointment({ ...appointment, preferredTimeSlot: event.target.value })}
                    className={inputClass}
                >
                    <option value="morning">সকাল</option>
                    <option value="noon">দুপুর</option>
                    <option value="afternoon">বিকেল</option>
                    <option value="evening">সন্ধ্যা</option>
                    <option value="anytime">যেকোনো সময়</option>
                </select>
            </div>
            <input
                value={appointment.locationText}
                onChange={(event) => setAppointment({ ...appointment, locationText: event.target.value })}
                placeholder="ঠিকানা/লোকেশন"
                className={inputClass}
            />
            <textarea
                value={appointment.description}
                onChange={(event) => setAppointment({ ...appointment, description: event.target.value })}
                placeholder="কি সাহায্য দরকার সংক্ষেপে লিখুন"
                className={`${inputClass} min-h-[96px]`}
            />
            <button disabled={loading} className="rounded-2xl bg-teal-600 px-4 py-3 font-black text-white disabled:opacity-50">
                Office serial request দিন
            </button>
        </form>
    );
}

function LifeSupportForm({
    lifeSupport,
    setLifeSupport,
    loading,
    onSubmit,
    locationQuery,
    setLocationQuery,
    locationResults,
    selectedScope,
    onSelectLocation,
    onClearLocation
}) {
    const typeOptions = [
        ['document', 'Document readiness'],
        ['benefit', 'ভাতা / সহায়তা'],
        ['health', 'Health / vaccine'],
        ['problem', 'Village problem map'],
        ['job', 'Local jobs / skills'],
        ['farmer', 'Farmer support'],
        ['trust_feedback', 'Feedback / trust']
    ];

    const categoryHints = {
        document: 'NID, জন্ম নিবন্ধন, মৃত্যু সনদ, tax paper',
        benefit: 'বিধবা, বয়স্ক, প্রতিবন্ধী, মাতৃত্বকালীন, VGD/VGF',
        health: 'টিকা, checkup, blood group, মা-শিশু স্বাস্থ্য',
        problem: 'রাস্তা, পানি, light, drainage, বর্জ্য',
        job: 'কাজ চাই, worker চাই, skill listing',
        farmer: 'ফসল রোগ, বাজার দর, সার/বীজ, কৃষি পরামর্শ',
        trust_feedback: 'Service feedback, দুর্নীতি/জটিলতা, suggestion'
    };

    return (
        <form onSubmit={onSubmit} className="grid gap-3">
            <input
                value={lifeSupport.citizenName}
                onChange={(event) => setLifeSupport({ ...lifeSupport, citizenName: event.target.value })}
                placeholder="আপনার নাম"
                className={inputClass}
            />
            <ComplaintLocationPicker
                query={locationQuery}
                setQuery={setLocationQuery}
                results={locationResults}
                selectedScope={selectedScope}
                onSelect={onSelectLocation}
                onClear={onClearLocation}
            />
            <div className="grid gap-3 sm:grid-cols-2">
                <select
                    value={lifeSupport.caseType}
                    onChange={(event) => setLifeSupport({ ...lifeSupport, caseType: event.target.value, category: '' })}
                    className={inputClass}
                >
                    {typeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <select
                    value={lifeSupport.priority}
                    onChange={(event) => setLifeSupport({ ...lifeSupport, priority: event.target.value })}
                    className={inputClass}
                >
                    <option value="normal">সাধারণ</option>
                    <option value="urgent">জরুরি</option>
                    <option value="emergency">খুব জরুরি</option>
                    <option value="low">কম গুরুত্বপূর্ণ</option>
                </select>
            </div>
            <input
                value={lifeSupport.category}
                onChange={(event) => setLifeSupport({ ...lifeSupport, category: event.target.value })}
                placeholder={categoryHints[lifeSupport.caseType] || 'Category'}
                className={inputClass}
            />
            <input
                required
                value={lifeSupport.title}
                onChange={(event) => setLifeSupport({ ...lifeSupport, title: event.target.value })}
                placeholder="কাজের বিষয় লিখুন"
                className={inputClass}
            />
            <input
                value={lifeSupport.locationText}
                onChange={(event) => setLifeSupport({ ...lifeSupport, locationText: event.target.value })}
                placeholder="লোকেশন / ঠিকানা"
                className={inputClass}
            />
            <textarea
                value={lifeSupport.description}
                onChange={(event) => setLifeSupport({ ...lifeSupport, description: event.target.value })}
                placeholder="সংক্ষেপে বিস্তারিত লিখুন"
                className={`${inputClass} min-h-[96px]`}
            />
            <button disabled={loading} className="rounded-2xl bg-teal-600 px-4 py-3 font-black text-white disabled:opacity-50">
                Request জমা দিন
            </button>
        </form>
    );
}

function Metric({ icon: Icon, label, value }) {
    return (
        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
            <Icon className="text-teal-600" size={22} />
            <p className="mt-4 text-3xl font-black">{toBnDigits(value || 0)}</p>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
        </div>
    );
}

function QuickLinkCard({ href, icon: Icon, title, text, tone = 'teal' }) {
    const tones = {
        teal: 'bg-teal-50 text-teal-700 border-teal-100',
        rose: 'bg-rose-50 text-rose-700 border-rose-100',
        red: 'bg-red-50 text-red-700 border-red-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    };
    return (
        <Link href={href} className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border ${tones[tone] || tones.teal}`}>
                <Icon size={23} />
            </div>
            <h3 className="text-lg font-black text-slate-900">{title}</h3>
            <p className="mt-1 text-sm font-bold text-slate-500">{text}</p>
        </Link>
    );
}

function CitizenJourney() {
    const steps = [
        { label: 'Step 1', title: 'Phone verify', text: 'OTP দিয়ে নিজের inbox খুলুন।', href: '#inbox', icon: Phone },
        { label: 'Step 2', title: 'Request দিন', text: 'Complaint, blood help বা service request জমা দিন।', href: '#complaint', icon: TicketCheck },
        { label: 'Step 3', title: 'Status দেখুন', text: 'Pending, processing, ready সব update এক জায়গায়।', href: '#inbox', icon: Bell },
        { label: 'Step 4', title: 'SMS update', text: 'কাজ শেষ হলে citizen inbox ও SMS reminder পাবেন।', href: '#inbox', icon: ShieldCheck }
    ];

    return (
        <section className="mt-5 rounded-[30px] border border-teal-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-600">How it works</p>
                    <h2 className="text-2xl font-black text-slate-900">মোবাইল দিয়ে কাজ শেষ করার সহজ flow</h2>
                </div>
                <Link href="#inbox" className="text-sm font-black text-teal-700 hover:text-teal-900">
                    Inbox খুলুন
                </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((step) => {
                    const Icon = step.icon;
                    return (
                        <Link
                            key={step.title}
                            href={step.href}
                            className="group rounded-3xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {step.label}
                                </span>
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm transition group-hover:bg-teal-600 group-hover:text-white">
                                    <Icon size={18} />
                                </span>
                            </div>
                            <h3 className="mt-4 text-lg font-black text-slate-900">{step.title}</h3>
                            <p className="mt-1 text-sm font-bold leading-relaxed text-slate-500">{step.text}</p>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

function CitizenDailyDashboard() {
    const items = [
        {
            title: 'আজকের কাজ',
            text: 'OTP দিয়ে timeline খুললে আবেদন, tax, complaint, reminder একসাথে দেখা যাবে।',
            href: '#inbox',
            icon: ListChecks,
            tone: 'teal',
            badge: 'Daily'
        },
        {
            title: 'অফিস serial',
            text: 'চেয়ারম্যান/সচিব/মেম্বারের কাছে যাওয়ার আগে appointment ticket পাঠান।',
            href: '#appointment',
            icon: CalendarCheck,
            tone: 'indigo',
            badge: 'Queue'
        },
        {
            title: 'Health follow-up',
            text: 'টিকা, checkup, blood group বা নারী/শিশু স্বাস্থ্য camp update নিন।',
            href: '/services/e-clinic',
            icon: HeartPulse,
            tone: 'rose',
            badge: 'Care'
        },
        {
            title: 'Local business',
            text: 'দোকান, বাজার দর, service provider ও SMS alert business route খুলুন।',
            href: '/services/market',
            icon: BriefcaseBusiness,
            tone: 'amber',
            badge: 'Income'
        }
    ];

    return (
        <section className="mt-5 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-4 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-5 text-white md:grid-cols-[1fr_auto] md:p-6">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.26em] text-teal-300">Daily citizen dashboard</p>
                    <h2 className="mt-2 text-2xl font-black sm:text-3xl">প্রতিদিন দরকারি update এক জায়গায়</h2>
                    <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-300">
                        DigiGram যেন শুধু আবেদন করার site না হয়, বরং পরিবার, স্বাস্থ্য, অফিস serial, বাজার ও SMS update দেখার daily tool হয়।
                    </p>
                </div>
                <Link href="#inbox" className="inline-flex h-fit items-center justify-center gap-2 rounded-2xl bg-teal-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-teal-500/20 transition hover:bg-teal-300">
                    <Phone size={18} /> Mobile verify
                </Link>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
                {items.map((item) => (
                    <DashboardUseCard key={item.title} {...item} />
                ))}
            </div>
        </section>
    );
}

function DashboardUseCard({ title, text, href, icon: Icon, tone, badge }) {
    const tones = {
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        rose: 'bg-rose-50 text-rose-700 border-rose-100',
        teal: 'bg-teal-50 text-teal-700 border-teal-100'
    };

    return (
        <Link href={href} className="group rounded-[26px] border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-200/70">
            <div className="flex items-start justify-between gap-3">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${tones[tone] || tones.teal}`}>
                    <Icon size={23} />
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                    {badge}
                </span>
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-900">{title}</h3>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{text}</p>
        </Link>
    );
}

function CitizenServiceShortcuts() {
    const items = [
        {
            title: 'জন্ম নিবন্ধন / NID সহায়তা',
            text: 'Household profile থেকে সদস্য select করে আবেদন করলে তথ্য auto-fill হবে।',
            href: '#inbox',
            icon: FileText,
            tone: 'teal'
        },
        {
            title: 'Holding tax status',
            text: 'বকেয়া, paid amount ও deadline citizen inbox-এর Tax tab-এ দেখা যাবে।',
            href: '#inbox',
            icon: Banknote,
            tone: 'amber'
        },
        {
            title: 'বাড়ির smart profile',
            text: 'মোবাইল verify করলে linked household profile দ্রুত খুলতে পারবেন।',
            href: '#inbox',
            icon: Home,
            tone: 'indigo'
        },
        {
            title: 'অফিস serial / appointment',
            text: 'Complaint form থেকে appointment type select করলে ticket হিসেবে queue-তে যাবে।',
            href: '#complaint',
            icon: CalendarCheck,
            tone: 'teal'
        },
        {
            title: 'Public tracking',
            text: 'আবেদন জমা হলে reference ধরে status, collection date ও feedback দেখুন।',
            href: '#inbox',
            icon: TicketCheck,
            tone: 'rose'
        },
        {
            title: 'Health camp reminder',
            text: 'স্বাস্থ্য checkup, টিকা camp ও blood group update দ্রুত খুলুন।',
            href: '/services/e-clinic',
            icon: HeartPulse,
            tone: 'amber'
        },
        {
            title: 'Household status',
            text: 'Household profile verify করে পরিবার, voter, blood ও document status দেখুন।',
            href: '#inbox',
            icon: IdCard,
            tone: 'indigo'
        }
    ];

    return (
        <section className="mt-5 rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-600">One tap service</p>
                    <h2 className="text-2xl font-black text-slate-900">যে কাজ বেশি লাগে, আগে এখানেই</h2>
                </div>
                <Link href="#inbox" className="text-sm font-black text-teal-700 hover:text-teal-900">
                    Phone verify করুন
                </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {items.map((item) => (
                    <QuickLinkCard key={item.title} {...item} />
                ))}
            </div>
        </section>
    );
}

function InboxActionCenter({ inbox, totals, activeTab, setActiveTab }) {
    const urgentComplaint = (inbox.complaints || []).find((item) => ['urgent', 'emergency'].includes(item.priority) && !['resolved', 'closed'].includes(item.status));
    const activeAppointment = (inbox.appointments || []).find((item) => !['completed', 'rejected', 'no_show'].includes(item.status));
    const activeLifeSupport = (inbox.lifeSupportCases || []).find((item) => !['completed', 'rejected'].includes(item.status));
    const readyService = (inbox.serviceRequests || []).find((item) => ['ready', 'processing'].includes(item.status));
    const activeBlood = (inbox.bloodRequests || []).find((item) => !['closed', 'matched'].includes(item.status));
    const dueTax = (inbox.householdTaxes || []).find((item) => item.status !== 'paid');
    const firstHousehold = (inbox.households || [])[0];

    const actions = [
        readyService && {
            key: 'service',
            tone: 'teal',
            title: readyService.status === 'ready' ? 'সেবা প্রস্তুত' : 'আবেদন চলমান',
            text: readyService.collection_date ? `Collection date: ${formatDate(readyService.collection_date)}` : 'Tracking খুলে কোন ধাপে আছে দেখুন।',
            href: `/track/${readyService.id}`,
            label: 'Track করুন',
            onClick: () => setActiveTab('services')
        },
        dueTax && {
            key: 'tax',
            tone: 'amber',
            title: 'Holding tax due',
            text: `${dueTax.fiscal_year_label || dueTax.year || 'Tax'} · Due ${dueTax.amount_due || 0} · Paid ${dueTax.amount_paid || 0}`,
            href: '#inbox',
            label: 'Tax দেখুন',
            onClick: () => setActiveTab('taxes')
        },
        activeAppointment && {
            key: 'appointment',
            tone: 'teal',
            title: activeAppointment.status === 'scheduled' ? 'Appointment সময় নির্ধারিত' : 'Office serial pending',
            text: activeAppointment.serial_no ? `Serial ${activeAppointment.serial_no} · ${activeAppointment.title}` : activeAppointment.title,
            href: '#appointment',
            label: 'Serial দেখুন',
            onClick: () => setActiveTab('appointments')
        },
        activeLifeSupport && {
            key: 'life-support',
            tone: 'teal',
            title: 'Daily life request চলমান',
            text: `${activeLifeSupport.case_type}: ${activeLifeSupport.title}`,
            href: '#life-support',
            label: 'Support দেখুন',
            onClick: () => setActiveTab('lifeSupport')
        },
        urgentComplaint && {
            key: 'complaint',
            tone: 'rose',
            title: 'জরুরি complaint pending',
            text: urgentComplaint.title,
            href: '#complaint',
            label: 'Follow-up দিন',
            onClick: () => setActiveTab('complaints')
        },
        activeBlood && {
            key: 'blood',
            tone: 'red',
            title: 'Blood request active',
            text: `${activeBlood.blood_group} - ${activeBlood.hospital_or_location || 'লোকেশন দেওয়া হয়নি'}`,
            href: '/services/blood',
            label: 'Donor খুঁজুন',
            onClick: () => setActiveTab('blood')
        },
        firstHousehold && {
            key: 'household',
            tone: 'slate',
            title: 'Household profile',
            text: firstHousehold.owner_name || 'আপনার বাড়ির profile',
            href: `/h/${firstHousehold.id}`,
            label: 'Profile খুলুন',
            onClick: () => setActiveTab('households')
        }
    ].filter(Boolean);

    if (actions.length === 0) {
        return (
            <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                        <ShieldCheck size={20} />
                    </span>
                    <div>
                        <h3 className="text-lg font-black text-slate-900">Action center ready</h3>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                            আপনার inbox-এ {toBnDigits((totals.services + totals.complaints + totals.blood + totals.reminders).toString())}টি update আছে। নিচের tab থেকে বিস্তারিত দেখুন।
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-600">Action Center</p>
                    <h3 className="text-xl font-black text-slate-900">এখন আপনার করণীয়</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {toBnDigits(actions.length)} task
                </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                {actions.map((action) => (
                    <Link
                        key={action.key}
                        href={action.href}
                        onClick={action.onClick}
                        className={`rounded-3xl border p-4 transition hover:-translate-y-0.5 ${
                            action.tone === 'rose' || action.tone === 'red'
                                ? 'border-rose-100 bg-rose-50 text-rose-800 hover:bg-rose-100'
                                : action.tone === 'amber'
                                    ? 'border-amber-100 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : action.tone === 'slate'
                                    ? 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                                    : 'border-teal-100 bg-teal-50 text-teal-800 hover:bg-teal-100'
                        }`}
                    >
                        <p className="font-black">{action.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm font-bold opacity-80">{action.text}</p>
                        <span className="mt-3 inline-flex rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-900 shadow-sm">
                            {action.label}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function CitizenReadinessCard({ inbox, totals, setActiveTab }) {
    const households = inbox.households || [];
    const openServices = (inbox.serviceRequests || []).filter((item) => ['pending', 'processing', 'ready'].includes(item.status)).length;
    const openAppointments = (inbox.appointments || []).filter((item) => !['completed', 'rejected', 'no_show'].includes(item.status)).length;
    const openLifeSupport = (inbox.lifeSupportCases || []).filter((item) => !['completed', 'rejected'].includes(item.status)).length;
    const openComplaints = (inbox.complaints || []).filter((item) => !['resolved', 'closed', 'rejected'].includes(item.status)).length;
    const dueTaxes = (inbox.householdTaxes || []).filter((item) => item.status !== 'paid').length;
    const reminders = inbox.reminders?.length || 0;
    const hasHousehold = households.length > 0;
    const hasRecentTimeline = (inbox.timeline || []).length > 0;

    const checks = [
        {
            key: 'household',
            label: 'Household linked',
            done: hasHousehold,
            help: hasHousehold ? `${toBnDigits(households.length)} profile linked` : 'Phone দিয়ে household link করুন',
            tab: 'households'
        },
        {
            key: 'service',
            label: 'Application clear',
            done: openServices === 0,
            help: openServices ? `${toBnDigits(openServices)} application follow-up` : 'Pending application নেই',
            tab: 'services'
        },
        {
            key: 'support',
            label: 'Support request clear',
            done: openLifeSupport === 0,
            help: openLifeSupport ? `${toBnDigits(openLifeSupport)} support চলমান` : 'Daily support request clear',
            tab: 'lifeSupport'
        },
        {
            key: 'appointment',
            label: 'Office visit clear',
            done: openAppointments === 0,
            help: openAppointments ? `${toBnDigits(openAppointments)} serial/appointment` : 'Office serial pending নেই',
            tab: 'appointments'
        },
        {
            key: 'complaint',
            label: 'Complaint clear',
            done: openComplaints === 0,
            help: openComplaints ? `${toBnDigits(openComplaints)} complaint follow-up` : 'Complaint clear',
            tab: 'complaints'
        },
        {
            key: 'tax',
            label: 'Tax clear',
            done: dueTaxes === 0,
            help: dueTaxes ? `${toBnDigits(dueTaxes)} tax due` : 'Tax due নেই',
            tab: 'taxes'
        },
        {
            key: 'update',
            label: 'Recent update',
            done: hasRecentTimeline || reminders > 0,
            help: hasRecentTimeline ? `${toBnDigits(totals.timeline || 0)} timeline update` : 'OTP inbox নিয়মিত দেখুন',
            tab: 'timeline'
        }
    ];

    const completed = checks.filter((item) => item.done).length;
    const score = Math.round((completed / checks.length) * 100);
    const nextTask = checks.find((item) => !item.done);

    return (
        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[240px_1fr]">
                <div className="rounded-[26px] bg-slate-950 p-5 text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-300">Citizen readiness</p>
                    <div className="mt-4 flex items-end gap-2">
                        <span className="text-5xl font-black leading-none">{toBnDigits(score)}</span>
                        <span className="pb-1 text-xl font-black text-slate-400">%</span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                            className={`h-full rounded-full ${score >= 80 ? 'bg-teal-300' : score >= 50 ? 'bg-amber-300' : 'bg-rose-400'}`}
                            style={{ width: `${score}%` }}
                        />
                    </div>
                    <p className="mt-4 text-sm font-bold leading-6 text-slate-300">
                        পরিবারের কাজ, আবেদন, tax, complaint এবং support update এক নজরে।
                    </p>
                    {nextTask && (
                        <button
                            type="button"
                            onClick={() => setActiveTab(nextTask.tab)}
                            className="mt-4 w-full rounded-2xl bg-teal-400 px-4 py-3 text-sm font-black text-slate-950"
                        >
                            Next: {nextTask.label}
                        </button>
                    )}
                </div>

                <div>
                    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-900">আপনার কাজের checklist</h3>
                            <p className="text-sm font-bold text-slate-500">যেটা incomplete, সেটায় tap করলে relevant tab খুলবে।</p>
                        </div>
                        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {toBnDigits(completed)} / {toBnDigits(checks.length)} done
                        </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {checks.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setActiveTab(item.tab)}
                                className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${
                                    item.done
                                        ? 'border-teal-100 bg-teal-50 text-teal-800'
                                        : 'border-amber-100 bg-amber-50 text-amber-800'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-black">{item.label}</p>
                                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black">
                                        {item.done ? 'OK' : 'Need'}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs font-bold opacity-80">{item.help}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function ActionSuccessCard({ action, hasInbox, onOpenInbox }) {
    const statusLabel = STATUS_LABELS[action.status] || action.status;

    return (
        <div className="mt-3 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-left">
            <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                    <CheckIcon />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-base font-black text-slate-900">{action.title}</p>
                            <p className="mt-1 text-sm font-bold leading-relaxed text-emerald-800">{action.message}</p>
                        </div>
                        <span className="w-fit rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                            {statusLabel}
                        </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white px-3 py-2">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Reference</span>
                            <span className="block truncate">{action.referenceId || 'Pending'}</span>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">SMS</span>
                            <span>{action.smsQueued === true ? 'Queued' : action.smsQueued === false ? 'Wallet empty / not queued' : 'Inbox update'}</span>
                        </div>
                        <Link href="#inbox" onClick={onOpenInbox} className="rounded-2xl bg-slate-950 px-3 py-2 text-center font-black text-white">
                            {hasInbox ? 'Inbox tab দেখুন' : 'OTP দিয়ে Inbox দেখুন'}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckIcon() {
    return <span className="text-xl font-black leading-none">✓</span>;
}

function Panel({ icon: Icon, title, children }) {
    return (
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[30px] sm:p-5">
            <div className="mb-4 flex items-center gap-3">
                <Icon className="text-teal-600" size={22} />
                <h2 className="text-lg font-black sm:text-xl">{title}</h2>
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function Empty({ text }) {
    return <p className="rounded-3xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">{text}</p>;
}

function TimelineItem({ item }) {
    const typeConfig = {
        service: { icon: FileText, color: 'border-teal-100 bg-teal-50 text-teal-700' },
        complaint: { icon: MessageSquareWarning, color: 'border-rose-100 bg-rose-50 text-rose-700' },
        appointment: { icon: CalendarCheck, color: 'border-indigo-100 bg-indigo-50 text-indigo-700' },
        life_support: { icon: ShieldCheck, color: 'border-teal-100 bg-teal-50 text-teal-700' },
        blood: { icon: Droplet, color: 'border-red-100 bg-red-50 text-red-700' },
        reminder: { icon: Bell, color: 'border-sky-100 bg-sky-50 text-sky-700' },
        tax: { icon: Banknote, color: 'border-amber-100 bg-amber-50 text-amber-700' }
    };
    const config = typeConfig[item.type] || { icon: ListChecks, color: 'border-slate-200 bg-slate-50 text-slate-700' };
    const Icon = config.icon;
    const status = String(item.status || '').toLowerCase();
    const statusTone = ['ready', 'completed', 'resolved', 'paid', 'matched'].includes(status)
        ? 'bg-emerald-50 text-emerald-700'
        : ['rejected', 'cancelled', 'closed'].includes(status)
            ? 'bg-rose-50 text-rose-700'
            : 'bg-amber-50 text-amber-700';

    return (
        <div className="flex gap-3 rounded-3xl border border-slate-200 bg-white p-4">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${config.color}`}>
                <Icon size={20} />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <p className="font-black text-slate-900">{item.title}</p>
                        {item.date && <p className="mt-1 text-xs font-bold text-slate-400">{formatDate(item.date)}</p>}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${statusTone}`}>
                        {STATUS_LABELS[item.status] || item.status || item.type}
                    </span>
                </div>
                {item.text && <p className="mt-3 text-sm font-bold leading-6 text-slate-500">{item.text}</p>}
            </div>
        </div>
    );
}

function ComplaintLocationPicker({ query, setQuery, results, selectedScope, onSelect, onClear }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">অভিযোগের এলাকা</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">ইউনিয়ন/ওয়ার্ড/গ্রাম select করলে complaint ঠিক পোর্টালে যাবে।</p>
                </div>
                {selectedScope?.scopeId && (
                    <button type="button" onClick={onClear} className="rounded-xl bg-white px-3 py-2 text-[11px] font-black text-rose-600">
                        Clear
                    </button>
                )}
            </div>

            {selectedScope?.scopeId ? (
                <div className="mt-3 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-black text-teal-800">
                    {selectedScope.label}
                </div>
            ) : (
                <>
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="ইউনিয়ন, ওয়ার্ড বা গ্রামের নাম লিখুন"
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-teal-400"
                    />
                    {results.length > 0 && (
                        <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                            {results.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onSelect(item)}
                                    className="block w-full rounded-xl px-3 py-2 text-left transition hover:bg-teal-50"
                                >
                                    <span className="block text-sm font-black text-slate-800">{item.name_bn || item.name_en}</span>
                                    <span className="text-[11px] font-bold uppercase text-slate-400">
                                        {item.type}
                                        {item.parent?.name_bn ? ` • ${item.parent.name_bn}` : ''}
                                        {item.parent?.parent?.name_bn ? ` • ${item.parent.parent.name_bn}` : ''}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function Feature({ icon: Icon, title, text }) {
    return (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <Icon className="text-teal-600" size={26} />
            <h3 className="mt-5 text-xl font-black">{title}</h3>
            <p className="mt-2 text-sm font-bold text-slate-500">{text}</p>
        </div>
    );
}

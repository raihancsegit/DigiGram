"use client";

import { useEffect, useMemo, useState } from 'react';
import { clinicService } from '@/lib/services/clinicService';
import { getLocationBySlug } from '@/lib/services/hierarchyService';
import {
    Activity,
    Ambulance,
    Baby,
    Calendar,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Clock,
    HeartPulse,
    Loader2,
    MapPin,
    Phone,
    Pill,
    Search,
    ShieldCheck,
    Stethoscope,
    Users
} from 'lucide-react';
import { toBnDigits } from '@/lib/utils/format';

const DOCTOR_PAGE_SIZE = 6;
const DIRECTORY_PAGE_SIZE = 5;

const HEALTH_CARDS = [
    { title: 'শিশু টিকা follow-up', text: '০-৫ বছরের শিশুদের টিকা, ওজন ও জন্ম নিবন্ধন reminder।', icon: Baby, tone: 'bg-cyan-50 text-cyan-700' },
    { title: 'বয়স্ক checkup', text: '৬০+ নাগরিকদের প্রেসার, ডায়াবেটিস ও নিয়মিত স্বাস্থ্য পরামর্শ।', icon: HeartPulse, tone: 'bg-emerald-50 text-emerald-700' },
    { title: 'প্রতিবন্ধী সহায়তা', text: 'প্রতিবন্ধী সদস্যদের চিকিৎসা ও ভাতা follow-up একই জায়গায়।', icon: ShieldCheck, tone: 'bg-violet-50 text-violet-700' },
    { title: 'Blood group readiness', text: 'জরুরি অবস্থার আগে পরিবারের blood group তথ্য পূরণ করা।', icon: Activity, tone: 'bg-rose-50 text-rose-700' }
];

const HOTLINES = [
    { label: 'স্বাস্থ্য বাতায়ন', number: '16263', hint: 'ডাক্তারি পরামর্শ' },
    { label: 'জরুরি সেবা', number: '999', hint: 'অ্যাম্বুলেন্স/ইমার্জেন্সি' },
    { label: 'শিশু সহায়তা', number: '1098', hint: 'শিশু সুরক্ষা' }
];

export function UnionClinicView({ unionSlug }) {
    const [doctors, setDoctors] = useState([]);
    const [ambulances, setAmbulances] = useState([]);
    const [pharmacies, setPharmacies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unionName, setUnionName] = useState('');
    const [query, setQuery] = useState('');
    const [doctorPage, setDoctorPage] = useState(1);

    useEffect(() => {
        let ignore = false;

        async function loadData() {
            setLoading(true);
            try {
                const union = await getLocationBySlug(unionSlug);
                if (!union) {
                    if (!ignore) setUnionName('');
                    return;
                }

                const [docResult, ambResult, pharmacyResult] = await Promise.all([
                    clinicService.getDoctors(union.id, 1, 24),
                    clinicService.getAmbulances(union.id, 1, 24),
                    clinicService.getPharmacies(union.id, 1, 24)
                ]);

                if (ignore) return;
                setUnionName(union.name_bn || union.name_en || union.name || 'ইউনিয়ন');
                setDoctors(normalizeRows(docResult));
                setAmbulances(normalizeRows(ambResult));
                setPharmacies(normalizeRows(pharmacyResult));
            } catch (error) {
                console.error('Clinic Data Load Error:', error);
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        loadData();
        return () => {
            ignore = true;
        };
    }, [unionSlug]);

    const filteredDoctors = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return doctors;
        return doctors.filter((doctor) => `${doctor.name || ''} ${doctor.specialty || ''} ${doctor.qualifications || ''}`.toLowerCase().includes(needle));
    }, [doctors, query]);
    const doctorPages = Math.max(1, Math.ceil(filteredDoctors.length / DOCTOR_PAGE_SIZE));
    const safeDoctorPage = Math.min(doctorPage, doctorPages);
    const visibleDoctors = filteredDoctors.slice((safeDoctorPage - 1) * DOCTOR_PAGE_SIZE, safeDoctorPage * DOCTOR_PAGE_SIZE);

    useEffect(() => {
        setDoctorPage(1);
    }, [query, doctors]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="mb-4 animate-spin text-rose-500" size={42} />
                <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-400">ক্লিনিক তথ্য লোড হচ্ছে...</p>
            </div>
        );
    }

    if (!unionName) {
        return (
            <div className="rounded-[36px] border border-rose-100 bg-white p-10 text-center shadow-sm">
                <Stethoscope className="mx-auto mb-4 text-rose-500" size={46} />
                <h2 className="text-2xl font-black text-slate-900">ইউনিয়ন পাওয়া যায়নি</h2>
                <p className="mt-2 text-sm font-bold text-slate-500">ইউনিয়ন portal থেকে E-Clinic খুললে সঠিক স্বাস্থ্য তথ্য দেখা যাবে।</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[36px] bg-gradient-to-br from-rose-600 via-rose-700 to-slate-950 p-5 text-white shadow-2xl sm:p-8 lg:p-10">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-rose-100">
                            <Stethoscope size={16} />
                            {unionName} ডিজিটাল স্বাস্থ্য সেবা
                        </div>
                        <h1 className="text-4xl font-black leading-tight sm:text-5xl">Smart E-Clinic</h1>
                        <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-rose-50/85">
                            ডাক্তার schedule, অ্যাম্বুলেন্স, ফার্মেসি, hotline এবং household health follow-up এক জায়গা থেকে দেখুন।
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        {HOTLINES.map((item) => (
                            <a key={item.number} href={`tel:${item.number}`} className="rounded-3xl border border-white/15 bg-white/10 p-4 transition hover:bg-white/15">
                                <p className="text-xs font-bold text-rose-100">{item.label}</p>
                                <div className="mt-2 flex items-center justify-between gap-3">
                                    <span className="text-2xl font-black">{toBnDigits(item.number)}</span>
                                    <Phone size={20} />
                                </div>
                                <p className="mt-1 text-[11px] font-bold text-white/60">{item.hint}</p>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {HEALTH_CARDS.map(({ title, text, icon: Icon, tone }) => (
                    <div key={title} className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
                        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
                            <Icon size={22} />
                        </div>
                        <h3 className="text-lg font-black text-slate-950">{title}</h3>
                        <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{text}</p>
                    </div>
                ))}
            </section>

            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <section className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-600">Doctor schedule</p>
                            <h2 className="text-2xl font-black text-slate-950">আজকের ডাক্তার ও সেবা</h2>
                            <p className="mt-1 text-xs font-black text-slate-400">
                                মোট {toBnDigits(String(filteredDoctors.length))} জন · পৃষ্ঠা {toBnDigits(String(safeDoctorPage))}/{toBnDigits(String(doctorPages))}
                            </p>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="ডাক্তার বা specialty খুঁজুন"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
                            />
                        </div>
                    </div>

                    {filteredDoctors.length === 0 ? (
                        <EmptyState text="এই ইউনিয়নে এখনো ডাক্তার schedule যোগ করা হয়নি। ইউনিয়ন admin থেকে ডাক্তার যোগ করলে এখানে দেখা যাবে।" />
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-2">
                                {visibleDoctors.map((doctor) => (
                                    <DoctorCard key={doctor.id || doctor.name} doctor={doctor} />
                                ))}
                            </div>
                            <Pagination
                                className="mt-5"
                                page={safeDoctorPage}
                                totalPages={doctorPages}
                                onPageChange={setDoctorPage}
                            />
                        </>
                    )}
                </section>

                <aside className="space-y-6">
                    <DirectoryCard
                        title="অ্যাম্বুলেন্স"
                        icon={Ambulance}
                        rows={ambulances}
                        emptyText="অ্যাম্বুলেন্স নম্বর যোগ করা হয়নি।"
                        renderRow={(row) => (
                            <>
                                <div>
                                    <p className="text-sm font-black text-slate-900">{row.provider || row.name || 'অ্যাম্বুলেন্স'}</p>
                                    <p className="text-xs font-bold text-slate-400">{row.driver || row.type || 'জরুরি সেবা'}</p>
                                </div>
                                <CallButton phone={row.phone} />
                            </>
                        )}
                    />

                    <DirectoryCard
                        title="ফার্মেসি"
                        icon={Pill}
                        rows={pharmacies}
                        emptyText="ফার্মেসি তথ্য যোগ করা হয়নি।"
                        renderRow={(row) => (
                            <>
                                <div>
                                    <p className="text-sm font-black text-slate-900">{row.name || 'ফার্মেসি'}</p>
                                    <p className="text-xs font-bold text-slate-400">{row.location || 'লোকেশন নেই'}</p>
                                </div>
                                <CallButton phone={row.phone} />
                            </>
                        )}
                    />
                </aside>
            </div>
        </div>
    );
}

function DoctorCard({ doctor }) {
    const days = Array.isArray(doctor.available_days) ? doctor.available_days : [];

    return (
        <div className="rounded-[28px] border border-slate-100 bg-slate-50/70 p-5 transition hover:border-rose-200 hover:bg-white hover:shadow-xl hover:shadow-rose-100/50">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white text-rose-600 shadow-sm">
                        {doctor.image_url ? <img src={doctor.image_url} alt={doctor.name} className="h-full w-full object-cover" /> : <Stethoscope size={26} />}
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-950">{doctor.name || 'ডাক্তার'}</h3>
                        <p className="text-xs font-black text-rose-600">{doctor.specialty || 'General'}</p>
                    </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">
                    <CheckCircle2 size={12} className="mr-1 inline" />
                    verified
                </span>
            </div>
            <div className="space-y-2 border-t border-slate-200 pt-4">
                <p className="flex items-center gap-2 text-xs font-bold text-slate-500"><Clock size={14} /> {doctor.visiting_time || doctor.time || 'সময় যোগ করা হয়নি'}</p>
                <p className="flex items-center gap-2 text-xs font-bold text-slate-500"><Calendar size={14} /> {days.length ? days.join(', ') : 'দিন যোগ করা হয়নি'}</p>
                {doctor.location && <p className="flex items-center gap-2 text-xs font-bold text-slate-500"><MapPin size={14} /> {doctor.location}</p>}
            </div>
        </div>
    );
}

function DirectoryCard({ title, icon: Icon, rows, emptyText, renderRow }) {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const filteredRows = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return rows;
        return rows.filter((row) => Object.values(row || {}).some((value) => String(value || '').toLowerCase().includes(needle)));
    }, [query, rows]);
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / DIRECTORY_PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const visibleRows = filteredRows.slice((safePage - 1) * DIRECTORY_PAGE_SIZE, safePage * DIRECTORY_PAGE_SIZE);

    return (
        <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                    <Icon size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-950">{title}</h3>
                    <p className="text-[10px] font-black text-slate-400">{toBnDigits(String(filteredRows.length))}টি রেকর্ড</p>
                </div>
            </div>
            <label className="relative mb-4 block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setPage(1);
                    }}
                    placeholder={`${title} খুঁজুন`}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-bold outline-none focus:border-rose-300 focus:bg-white"
                />
            </label>
            {filteredRows.length === 0 ? (
                <EmptyState text={emptyText} compact />
            ) : (
                <>
                    <div className="space-y-3">
                        {visibleRows.map((row) => (
                            <div key={row.id || row.phone || row.name} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                                {renderRow(row)}
                            </div>
                        ))}
                    </div>
                    <Pagination
                        className="mt-4"
                        page={safePage}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        compact
                    />
                </>
            )}
        </div>
    );
}

function Pagination({ page, totalPages, onPageChange, className = '', compact = false }) {
    return (
        <div className={`flex items-center justify-center gap-2 ${className}`}>
            <button
                type="button"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                className={`${compact ? 'h-9 px-3' : 'h-11 px-4'} inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white text-xs font-black text-slate-600 disabled:opacity-40`}
            >
                <ChevronLeft size={15} />
                আগে
            </button>
            <span className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} rounded-2xl bg-slate-950 text-xs font-black text-white`}>
                {toBnDigits(String(page))}/{toBnDigits(String(totalPages))}
            </span>
            <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className={`${compact ? 'h-9 px-3' : 'h-11 px-4'} inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white text-xs font-black text-slate-600 disabled:opacity-40`}
            >
                পরে
                <ChevronRight size={15} />
            </button>
        </div>
    );
}

function CallButton({ phone }) {
    if (!phone) return <span className="rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-400">নম্বর নেই</span>;
    return (
        <a href={`tel:${phone}`} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white transition hover:bg-rose-600">
            <Phone size={16} />
        </a>
    );
}

function EmptyState({ text, compact = false }) {
    return (
        <div className={`rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center ${compact ? 'p-4' : 'p-8'}`}>
            <Users className="mx-auto mb-2 text-slate-300" size={compact ? 24 : 34} />
            <p className="text-sm font-bold leading-6 text-slate-500">{text}</p>
        </div>
    );
}

function normalizeRows(result) {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    return [];
}

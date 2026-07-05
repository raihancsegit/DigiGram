'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    CreditCard,
    FileText,
    Loader2,
    Save,
    User,
    Users,
    X
} from 'lucide-react';
import { householdService } from '@/lib/services/householdService';

const SERVICE_CONFIG = {
    birth_registration: {
        title: 'জন্ম নিবন্ধন আবেদন',
        shortTitle: 'জন্ম নিবন্ধন',
        subjectLabel: 'যার জন্ম নিবন্ধন হবে',
        dateLabel: 'জন্ম তারিখ',
        dateKey: 'birth_date',
        fee: 50,
        color: 'teal',
        note: 'Family tree থেকে সদস্য বাছাই করলে জন্ম তারিখ, পিতা-মাতা ও ঠিকানা বসে যাবে।'
    },
    death_certificate: {
        title: 'মৃত্যু সনদ আবেদন',
        shortTitle: 'মৃত্যু সনদ',
        subjectLabel: 'মৃত ব্যক্তির নাম',
        dateLabel: 'মৃত্যুর তারিখ',
        dateKey: 'death_date',
        fee: 50,
        color: 'rose',
        note: 'মৃত ব্যক্তিকে family tree থেকে বাছাই করুন, তারপর মৃত্যুর তারিখ/স্থান যোগ করুন।'
    },
    warish_certificate: {
        title: 'ওয়ারিশ সনদ আবেদন',
        shortTitle: 'ওয়ারিশ সনদ',
        subjectLabel: 'যার ওয়ারিশ সনদ লাগবে',
        dateLabel: 'মৃত্যুর তারিখ',
        dateKey: 'death_date',
        fee: 150,
        color: 'amber',
        note: 'ব্যক্তি বাছাই করলে একই household-এর সদস্যদের সম্ভাব্য ওয়ারিশ হিসেবে দেখাবে।'
    },
    utility_request: {
        title: 'ইউটিলিটি সেবার আবেদন',
        shortTitle: 'ইউটিলিটি সেবা',
        subjectLabel: 'যার নামে আবেদন',
        dateLabel: 'তারিখ',
        dateKey: 'service_date',
        fee: 0,
        color: 'blue',
        note: 'Manual তথ্য দিয়ে আবেদন করা যাবে।'
    }
};

const FIELD_INPUT_CLASS = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10';

function normalizeResident(resident = {}, index = 0) {
    const name = resident.name || resident.full_name || resident.name_bn || resident.member_name || '';
    return {
        ...resident,
        id: resident.id || resident.resident_id || `resident-${index}`,
        name,
        dob: resident.dob || resident.birth_date || resident.date_of_birth || '',
        father_name: resident.father_name || resident.fatherName || '',
        mother_name: resident.mother_name || resident.motherName || '',
        nid: resident.nid || resident.nid_no || '',
        birth_reg_no: resident.birth_reg_no || resident.birth_certificate_no || resident.birth_registration_no || '',
        gender: resident.gender || '',
        phone: resident.phone || resident.mobile || '',
        address: resident.address || ''
    };
}

function getHouseholdAddress(profile) {
    return [
        profile?.village?.bn_name || profile?.village?.name,
        profile?.house_no ? `বাড়ি ${profile.house_no}` : ''
    ].filter(Boolean).join(', ');
}

export default function ServiceRequestModal({
    householdId,
    serviceType,
    householdProfile = null,
    residents = [],
    initialResidentId = '',
    onCreated,
    onClose
}) {
    const config = SERVICE_CONFIG[serviceType] || SERVICE_CONFIG.utility_request;
    const residentOptions = useMemo(
        () => (residents || []).map(normalizeResident).filter((resident) => resident.name || resident.id),
        [residents]
    );
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [createdRequest, setCreatedRequest] = useState(null);
    const [error, setError] = useState('');
    const [selectedResidentId, setSelectedResidentId] = useState(initialResidentId || '');
    const [selectedHeirIds, setSelectedHeirIds] = useState([]);
    const [formData, setFormData] = useState({
        applicant_name: '',
        applicant_phone: '',
        applicant_relation: 'পরিবারের সদস্য',
        subject_name: '',
        father_name: '',
        mother_name: '',
        date_value: '',
        place_of_death: '',
        request_note: ''
    });

    const selectedResident = useMemo(
        () => residentOptions.find((resident) => String(resident.id) === String(selectedResidentId)) || null,
        [residentOptions, selectedResidentId]
    );
    const heirs = useMemo(
        () => residentOptions.filter((resident) => String(resident.id) !== String(selectedResidentId)),
        [residentOptions, selectedResidentId]
    );
    const payLink = `/pay?phone=${encodeURIComponent(formData.applicant_phone || '')}`;

    useEffect(() => {
        setSelectedResidentId(initialResidentId || '');
    }, [initialResidentId]);

    useEffect(() => {
        const ownerName = householdProfile?.owner_name || '';
        const phone = householdProfile?.phone || householdProfile?.mobile || '';
        setFormData((current) => ({
            ...current,
            applicant_name: current.applicant_name || ownerName,
            applicant_phone: current.applicant_phone || phone
        }));
    }, [householdProfile]);

    useEffect(() => {
        if (!selectedResident) return;

        setFormData((current) => ({
            ...current,
            subject_name: selectedResident.name || current.subject_name,
            father_name: selectedResident.father_name || current.father_name,
            mother_name: selectedResident.mother_name || current.mother_name,
            date_value: serviceType === 'birth_registration'
                ? selectedResident.dob || current.date_value
                : current.date_value,
            applicant_phone: current.applicant_phone || selectedResident.phone || householdProfile?.phone || ''
        }));

        if (serviceType === 'warish_certificate') {
            setSelectedHeirIds(heirs.map((resident) => String(resident.id)));
        }
    }, [selectedResident, serviceType, heirs, householdProfile?.phone]);

    function updateField(key, value) {
        setFormData((current) => ({ ...current, [key]: value }));
    }

    function toggleHeir(id) {
        const value = String(id);
        setSelectedHeirIds((current) => (
            current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value]
        ));
    }

    function buildMetaData() {
        const selectedHeirs = heirs
            .filter((resident) => selectedHeirIds.includes(String(resident.id)))
            .map((resident) => ({
                id: resident.id,
                name: resident.name,
                nid: resident.nid || null,
                birth_reg_no: resident.birth_reg_no || null,
                father_name: resident.father_name || null,
                mother_name: resident.mother_name || null,
                relation: resident.relation || resident.relationship || null
            }));

        return {
            source: 'household_profile_certificate_apply',
            service_title: config.title,
            family_tree_prefilled: Boolean(selectedResident),
            selected_resident_id: selectedResident?.id || null,
            subject_name: formData.subject_name,
            applicant_relation: formData.applicant_relation,
            household_owner: householdProfile?.owner_name || null,
            household_no: householdProfile?.house_no || null,
            household_address: getHouseholdAddress(householdProfile),
            subject_snapshot: selectedResident ? {
                id: selectedResident.id,
                name: selectedResident.name,
                dob: selectedResident.dob || null,
                nid: selectedResident.nid || null,
                birth_reg_no: selectedResident.birth_reg_no || null,
                gender: selectedResident.gender || null
            } : null,
            heirs: serviceType === 'warish_certificate' ? selectedHeirs : [],
            payment: {
                fee_amount: config.fee,
                status: config.fee > 0 ? 'due' : 'not_required'
            }
        };
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const isDeathLike = ['death_certificate', 'warish_certificate'].includes(serviceType);
            const request = await householdService.createServiceRequest({
                household_id: householdId,
                resident_id: selectedResident?.id || null,
                request_type: serviceType,
                title: config.title,
                applicant_name: formData.applicant_name,
                contact_phone: formData.applicant_phone,
                details: formData.request_note || null,
                father_name: formData.father_name || null,
                mother_name: formData.mother_name || null,
                applicant_dob: selectedResident?.dob || (serviceType === 'birth_registration' ? formData.date_value : null),
                applicant_gender: selectedResident?.gender || null,
                applicant_nid: selectedResident?.nid || null,
                applicant_birth_reg: selectedResident?.birth_reg_no || null,
                applicant_address: selectedResident?.address || getHouseholdAddress(householdProfile) || null,
                death_date: isDeathLike ? formData.date_value || null : null,
                place_of_death: isDeathLike ? formData.place_of_death || null : null,
                blood_group: selectedResident?.blood_group || null,
                fee_amount: config.fee,
                amount_paid: 0,
                payment_status: config.fee > 0 ? 'due' : 'not_required',
                meta_data: buildMetaData()
            });
            setCreatedRequest(request);
            if (onCreated) onCreated(request);
            setSuccess(true);
        } catch (err) {
            const duplicate = String(err?.message || '').toLowerCase().includes('duplicate')
                || String(err?.code || '') === '23505';
            setError(duplicate
                ? 'এই সদস্যের জন্য একই ধরনের আবেদন ইতোমধ্যে চলমান আছে। Track পেজ থেকে আগের আবেদন দেখুন।'
                : 'আবেদন জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        } finally {
            setSaving(false);
        }
    }

    if (success) {
        return (
            <div className="flex h-[100dvh] w-full max-w-md flex-col justify-center bg-white p-8 text-center shadow-2xl sm:h-auto sm:rounded-[32px] sm:p-10">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                    <CheckCircle2 size={40} />
                </div>
                <h3 className="mb-2 text-2xl font-black text-slate-800">আবেদন সফল!</h3>
                <p className="text-sm font-bold leading-6 text-slate-500">
                    আবেদন জমা হয়েছে। Pending, processing, ready বা completed হলে মোবাইলে notification/SMS যাবে।
                </p>
                {createdRequest?.id && (
                    <>
                        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tracking ID</p>
                            <p className="mt-1 break-all font-black text-slate-800">{createdRequest.id}</p>
                            {config.fee > 0 && (
                                <p className="mt-3 text-xs font-black text-rose-700">Service fee: ৳{config.fee.toLocaleString('bn-BD')} due</p>
                            )}
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <Link
                                href={`/track/${createdRequest.id}`}
                                className="flex min-h-12 items-center justify-center rounded-2xl bg-teal-600 px-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-teal-700"
                            >
                                আবেদন ট্র্যাক
                            </Link>
                            {config.fee > 0 && (
                                <Link
                                    href={payLink}
                                    className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800"
                                >
                                    <CreditCard size={16} /> Pay
                                </Link>
                            )}
                        </div>
                    </>
                )}
                <button
                    onClick={onClose}
                    className="mt-6 w-full rounded-2xl bg-slate-100 py-4 text-sm font-black uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-200"
                >
                    ঠিক আছে
                </button>
            </div>
        );
    }

    return (
        <div className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white p-4 shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-[32px] sm:p-8">
            <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-2xl bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 sm:right-6 sm:top-6">
                <X size={22} />
            </button>

            <div className="mb-5 flex items-start gap-3 pr-12">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                    <FileText size={24} />
                </div>
                <div className="min-w-0">
                    <h3 className="break-words text-xl font-black leading-tight text-slate-800">{config.title}</h3>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{config.note}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto pb-3">
                {residentOptions.length > 0 ? (
                    <section className="rounded-3xl border border-teal-100 bg-teal-50/60 p-4">
                        <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-700">
                            <Users size={14} /> Family tree থেকে সদস্য বাছাই
                        </label>
                        <select
                            value={selectedResidentId}
                            onChange={(event) => setSelectedResidentId(event.target.value)}
                            className="min-h-12 w-full rounded-2xl border border-teal-100 bg-white px-4 text-sm font-black text-slate-800 outline-none focus:border-teal-500"
                        >
                            <option value="">Manual entry / নতুন ব্যক্তি</option>
                            {residentOptions.map((resident) => (
                                <option key={resident.id} value={resident.id}>
                                    {resident.name || 'নাম নেই'}{resident.dob ? ` - ${resident.dob}` : ''}
                                </option>
                            ))}
                        </select>
                    </section>
                ) : (
                    <div className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
                        <AlertCircle className="mt-0.5 shrink-0" size={18} />
                        <span>Auto-fill করতে household locker unlock করুন। এখন manual entry দিয়েও আবেদন করা যাবে।</span>
                    </div>
                )}

                {error && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
                        {error}
                    </div>
                )}

                <section className="grid gap-4 md:grid-cols-2">
                    <Field label="আবেদনকারীর নাম" icon={User}>
                        <input
                            required
                            value={formData.applicant_name}
                            onChange={(event) => updateField('applicant_name', event.target.value)}
                            className={FIELD_INPUT_CLASS}
                            placeholder="উদা: মোঃ রহিম"
                        />
                    </Field>
                    <Field label="মোবাইল নম্বর" icon={User}>
                        <input
                            required
                            value={formData.applicant_phone}
                            onChange={(event) => updateField('applicant_phone', event.target.value)}
                            className={FIELD_INPUT_CLASS}
                            inputMode="tel"
                            placeholder="017XXXXXXXX"
                        />
                    </Field>
                    <Field label="আবেদনকারীর সম্পর্ক">
                        <input
                            value={formData.applicant_relation}
                            onChange={(event) => updateField('applicant_relation', event.target.value)}
                            className={FIELD_INPUT_CLASS}
                            placeholder="পিতা / মাতা / সন্তান / নিজে"
                        />
                    </Field>
                    <Field label={config.subjectLabel}>
                        <input
                            required
                            value={formData.subject_name}
                            onChange={(event) => updateField('subject_name', event.target.value)}
                            className={FIELD_INPUT_CLASS}
                            placeholder="পূর্ণ নাম"
                        />
                    </Field>
                    <Field label="পিতার নাম">
                        <input
                            required
                            value={formData.father_name}
                            onChange={(event) => updateField('father_name', event.target.value)}
                            className={FIELD_INPUT_CLASS}
                        />
                    </Field>
                    <Field label="মাতার নাম">
                        <input
                            required
                            value={formData.mother_name}
                            onChange={(event) => updateField('mother_name', event.target.value)}
                            className={FIELD_INPUT_CLASS}
                        />
                    </Field>
                    <Field label={config.dateLabel} icon={Calendar}>
                        <input
                            required
                            type="date"
                            value={formData.date_value}
                            onChange={(event) => updateField('date_value', event.target.value)}
                            className={FIELD_INPUT_CLASS}
                        />
                    </Field>
                    {['death_certificate', 'warish_certificate'].includes(serviceType) && (
                        <Field label="মৃত্যুর স্থান">
                            <input
                                value={formData.place_of_death}
                                onChange={(event) => updateField('place_of_death', event.target.value)}
                                className={FIELD_INPUT_CLASS}
                                placeholder="গ্রাম/হাসপাতাল/স্থান"
                            />
                        </Field>
                    )}
                </section>

                {serviceType === 'warish_certificate' && (
                    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-black text-slate-800">সম্ভাব্য ওয়ারিশ</p>
                                <p className="mt-1 text-xs font-bold text-slate-500">Family tree থেকে যাদের সনদে রাখতে হবে select করুন।</p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                                {selectedHeirIds.length} জন
                            </span>
                        </div>
                        {heirs.length === 0 ? (
                            <p className="rounded-2xl bg-white px-4 py-5 text-center text-sm font-bold text-slate-500">
                                Locker data না থাকলে ওয়ারিশদের নাম note-এ লিখুন।
                            </p>
                        ) : (
                            <div className="grid gap-2 sm:grid-cols-2">
                                {heirs.map((resident) => (
                                    <label key={resident.id} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={selectedHeirIds.includes(String(resident.id))}
                                            onChange={() => toggleHeir(resident.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                        />
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-black text-slate-800">{resident.name || 'নাম নেই'}</span>
                                            <span className="block truncate text-[10px] font-bold text-slate-400">{resident.relation || resident.relationship || resident.gender || 'Family member'}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                <Field label="অতিরিক্ত নোট">
                    <textarea
                        value={formData.request_note}
                        onChange={(event) => updateField('request_note', event.target.value)}
                        className={`${FIELD_INPUT_CLASS} min-h-[96px] resize-none`}
                        placeholder={serviceType === 'warish_certificate' ? 'ওয়ারিশদের সম্পর্ক/বিশেষ তথ্য লিখুন...' : 'প্রয়োজন হলে বিস্তারিত লিখুন...'}
                    />
                </Field>

                <section className="rounded-3xl border border-slate-200 bg-slate-950 p-4 text-white">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Fee & status</p>
                            <p className="mt-1 text-sm font-bold text-slate-300">Submit হলে pending থাকবে, office status বদলালে SMS যাবে।</p>
                        </div>
                        <p className="shrink-0 text-2xl font-black">৳{config.fee.toLocaleString('bn-BD')}</p>
                    </div>
                </section>

                <button
                    disabled={saving}
                    className="sticky bottom-0 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-teal-600 px-5 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-teal-600/20 transition-all hover:bg-teal-700 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    আবেদন নিশ্চিত করুন
                </button>
            </form>
        </div>
    );
}

function Field({ label, icon: Icon, children }) {
    return (
        <label className="grid gap-2 text-sm font-black text-slate-700">
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
                {Icon && <Icon size={13} />} {label}
            </span>
            {children}
        </label>
    );
}

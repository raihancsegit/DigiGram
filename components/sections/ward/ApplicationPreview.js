import React from 'react';
import { FileText, ShieldCheck } from 'lucide-react';
import { toBnDigits } from '@/lib/utils/format';

function formatDate(value) {
    if (!value) return 'প্রযোজ্য নয়';
    return toBnDigits(new Date(value).toLocaleDateString('bn-BD', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }));
}

function CertificateShell({ title, subtitle, children, tone = 'birth' }) {
    const isDeath = tone === 'death';

    return (
        <div className={`relative overflow-hidden rounded-[28px] border-[6px] border-double p-7 shadow-sm ${
            isDeath ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-amber-200 bg-[#fbf8ef] text-slate-800'
        }`}>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className={`rotate-[-24deg] text-6xl font-black tracking-[0.3em] opacity-[0.06] ${
                    isDeath ? 'text-slate-700' : 'text-amber-800'
                }`}>
                    PREVIEW
                </span>
            </div>

            <div className="relative z-10 border-b border-current/15 pb-5 text-center">
                <p className="text-xs font-bold">Government of the People&apos;s Republic of Bangladesh</p>
                <p className="mt-1 text-[11px] font-bold">Office of the Birth and Death Registrar</p>
                <h4 className="mt-4 text-xl font-black">{title}</h4>
                <p className="mt-1 text-[11px] font-bold">{subtitle}</p>
            </div>

            <div className="relative z-10 pt-6">
                {children}
            </div>

            <div className="relative z-10 mt-8 flex items-end justify-between border-t border-current/15 pt-5 text-[10px] font-bold">
                <div>
                    <p>সিল ও স্বাক্ষর</p>
                    <p className="mt-8 border-t border-current/30 pt-1">রেজিস্ট্রার অফিস</p>
                </div>
                <div className="text-right">
                    <p>ডিজিগ্রাম প্রিভিউ কপি</p>
                    <p className="mt-8 border-t border-current/30 pt-1">অনুমোদনের পর চূড়ান্ত সনদ</p>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, className = '' }) {
    return (
        <div className={className}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
            <p className="mt-1 text-sm font-black">{value || 'প্রযোজ্য নয়'}</p>
        </div>
    );
}

export default function ApplicationPreview({ serviceForm, applicant, household }) {
    const applicantName = serviceForm.applicant_name || 'নাম দেওয়া হয়নি';
    const applicantGender = serviceForm.applicant_gender === 'Female' ? 'নারী' : 'পুরুষ';
    const address = serviceForm.applicant_address || `${household?.house_no ? `হোল্ডিং: ${household.house_no}, ` : ''}${household?.village_name || 'গ্রাম উল্লেখ নেই'}`;

    if (serviceForm.request_type === 'birth_registration') {
        return (
            <CertificateShell
                title="Birth Registration Certificate"
                subtitle="জন্ম নিবন্ধন সনদ - আবেদন প্রিভিউ"
            >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="নাম" value={applicantName} className="md:col-span-2" />
                    <Field label="জন্ম তারিখ" value={formatDate(serviceForm.applicant_dob)} />
                    <Field label="লিঙ্গ" value={applicantGender} />
                    <Field label="জন্ম নিবন্ধন নম্বর" value={toBnDigits(serviceForm.applicant_birth_reg || 'প্রযোজ্য নয়')} />
                    <Field label="রক্তের গ্রুপ" value={serviceForm.blood_group || 'অজানা'} />
                    <Field label="পিতার নাম" value={serviceForm.father_name} />
                    <Field label="মাতার নাম" value={serviceForm.mother_name} />
                    <Field label="স্থায়ী ঠিকানা" value={address} className="md:col-span-2" />
                </div>
            </CertificateShell>
        );
    }

    if (serviceForm.request_type === 'death_certificate') {
        return (
            <CertificateShell
                title="Death Registration Certificate"
                subtitle="মৃত্যু নিবন্ধন সনদ - আবেদন প্রিভিউ"
                tone="death"
            >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="মৃত ব্যক্তির নাম" value={applicantName} className="md:col-span-2" />
                    <Field label="জন্ম তারিখ" value={formatDate(serviceForm.applicant_dob)} />
                    <Field label="মৃত্যুর তারিখ" value={formatDate(serviceForm.death_date)} />
                    <Field label="লিঙ্গ" value={applicantGender} />
                    <Field label="মৃত্যুর স্থান" value={serviceForm.place_of_death || 'উল্লেখ নেই'} />
                    <Field label="পিতার নাম" value={serviceForm.father_name} />
                    <Field label="মাতার নাম" value={serviceForm.mother_name} />
                    <Field label="স্থায়ী ঠিকানা" value={address} className="md:col-span-2" />
                </div>
            </CertificateShell>
        );
    }

    if (serviceForm.request_type === 'warish_certificate') {
        const heirs = Array.isArray(serviceForm.meta_data?.heirs) ? serviceForm.meta_data.heirs : [];
        return (
            <CertificateShell
                title="Inheritance Certificate"
                subtitle="ওয়ারিশ সনদ - আবেদন প্রিভিউ"
            >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="যার ওয়ারিশ সনদ" value={serviceForm.meta_data?.subject_name || applicantName} className="md:col-span-2" />
                    <Field label="মৃত্যুর তারিখ" value={formatDate(serviceForm.death_date)} />
                    <Field label="মৃত্যুর স্থান" value={serviceForm.place_of_death || 'উল্লেখ নেই'} />
                    <Field label="পিতার নাম" value={serviceForm.father_name} />
                    <Field label="মাতার নাম" value={serviceForm.mother_name} />
                    <Field label="স্থায়ী ঠিকানা" value={address} className="md:col-span-2" />
                    <div className="md:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">ওয়ারিশগণ</p>
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                            {heirs.length > 0 ? heirs.map((heir, index) => (
                                <p key={`${heir.id || heir.name || index}`} className="rounded-xl border border-current/10 bg-white/60 px-3 py-2 text-sm font-black">
                                    {toBnDigits(index + 1)}. {heir.name || 'নাম নেই'}{heir.relation ? ` - ${heir.relation}` : ''}
                                </p>
                            )) : (
                                <p className="rounded-xl border border-current/10 bg-white/60 px-3 py-2 text-sm font-black">ওয়ারিশের তথ্য অফিস যাচাই করবে</p>
                            )}
                        </div>
                    </div>
                </div>
            </CertificateShell>
        );
    }

    if (['nid_application', 'nid_correction'].includes(serviceForm.request_type)) {
        return (
            <div className="relative overflow-hidden rounded-[28px] border border-emerald-100 bg-emerald-50 p-7">
                <ShieldCheck className="absolute right-6 top-6 text-emerald-200" size={64} />
                <h4 className="text-lg font-black text-emerald-800">NID আবেদন প্রিভিউ</h4>
                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="নাম" value={applicantName} />
                    <Field label="NID" value={toBnDigits(serviceForm.applicant_nid || 'প্রযোজ্য নয়')} />
                    <Field label="পিতার নাম" value={serviceForm.father_name} />
                    <Field label="মাতার নাম" value={serviceForm.mother_name} />
                </div>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-7">
            <FileText className="absolute right-6 top-6 text-slate-200" size={64} />
            <h4 className="text-lg font-black text-slate-800">আবেদন প্রিভিউ</h4>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="আবেদনকারী" value={applicantName} />
                <Field label="যোগাযোগ" value={toBnDigits(serviceForm.contact_phone || 'প্রযোজ্য নয়')} />
                <Field label="ঠিকানা" value={address} className="md:col-span-2" />
                <Field label="বিস্তারিত" value={serviceForm.details || 'কোনো অতিরিক্ত তথ্য নেই'} className="md:col-span-2" />
            </div>
        </div>
    );
}

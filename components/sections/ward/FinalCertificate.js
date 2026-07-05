import { toBnDigits } from '@/lib/utils/format';

function formatDate(value) {
    if (!value) return 'প্রযোজ্য নয়';
    return toBnDigits(new Date(value).toLocaleDateString('bn-BD', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }));
}

function Field({ label, value, className = '' }) {
    return (
        <div className={className}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
            <p className="mt-1 text-sm font-black">{value || 'প্রযোজ্য নয়'}</p>
        </div>
    );
}

export default function FinalCertificate({ request, verificationUrl }) {
    const isDeath = request.request_type === 'death_certificate';
    const isWarish = request.request_type === 'warish_certificate';
    const title = isWarish ? 'Inheritance Certificate' : isDeath ? 'Death Registration Certificate' : 'Birth Registration Certificate';
    const subtitle = isWarish ? 'ওয়ারিশ সনদ' : isDeath ? 'মৃত্যু নিবন্ধন সনদ' : 'জন্ম নিবন্ধন সনদ';
    const heirs = Array.isArray(request.meta_data?.heirs) ? request.meta_data.heirs : [];

    return (
        <article className={`relative mx-auto w-full max-w-4xl overflow-hidden border-[8px] border-double p-8 shadow-sm ${
            isDeath ? 'border-slate-300 bg-slate-100 text-slate-700' : isWarish ? 'border-teal-200 bg-teal-50/40 text-slate-800' : 'border-amber-200 bg-[#fbf8ef] text-slate-800'
        }`}>
            <header className="border-b border-current/15 pb-6 text-center">
                <p className="text-xs font-bold">Government of the People&apos;s Republic of Bangladesh</p>
                <p className="mt-1 text-[11px] font-bold">Office of the Birth and Death Registrar</p>
                <h1 className="mt-4 text-2xl font-black">{title}</h1>
                <p className="mt-1 text-sm font-bold">{subtitle}</p>
                <p className="mt-3 text-[11px] font-bold">সনদ নং: {request.certificate_no}</p>
            </header>

            <section className="grid grid-cols-1 gap-5 pt-7 md:grid-cols-2">
                <Field label={isDeath ? 'মৃত ব্যক্তির নাম' : isWarish ? 'যার ওয়ারিশ সনদ' : 'নাম'} value={request.meta_data?.subject_name || request.applicant_name} className="md:col-span-2" />
                <Field label="জন্ম তারিখ" value={formatDate(request.applicant_dob)} />
                {isDeath || isWarish ? (
                    <Field label="মৃত্যুর তারিখ" value={formatDate(request.death_date)} />
                ) : (
                    <Field label="জন্ম নিবন্ধন নম্বর" value={toBnDigits(request.applicant_birth_reg || 'প্রযোজ্য নয়')} />
                )}
                <Field label="লিঙ্গ" value={request.applicant_gender === 'Female' ? 'নারী' : 'পুরুষ'} />
                {isDeath || isWarish ? (
                    <Field label="মৃত্যুর স্থান" value={request.place_of_death} />
                ) : (
                    <Field label="রক্তের গ্রুপ" value={request.blood_group || 'অজানা'} />
                )}
                <Field label="পিতার নাম" value={request.father_name} />
                <Field label="মাতার নাম" value={request.mother_name} />
                <Field label="ঠিকানা" value={request.applicant_address} className="md:col-span-2" />
                {isWarish && (
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
                )}
            </section>

            <footer className="mt-10 grid grid-cols-1 gap-6 border-t border-current/15 pt-6 md:grid-cols-[1fr_auto]">
                <div className="text-[11px] font-bold">
                    <p>ইস্যুর তারিখ: {formatDate(request.issued_at || request.updated_at)}</p>
                    <p className="mt-8 w-44 border-t border-current/30 pt-2">রেজিস্ট্রারের স্বাক্ষর</p>
                </div>
                <div className="text-left md:text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">যাচাই লিংক</p>
                    <p className="mt-1 max-w-xs break-all text-[11px] font-bold">{verificationUrl}</p>
                </div>
            </footer>
        </article>
    );
}

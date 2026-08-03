import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, School, ShieldCheck } from 'lucide-react';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { certificateNo } = await params;
    return {
        title: `Pilot Certificate ${certificateNo} | DigiGram`,
        description: 'Verify an approved DigiGram school pilot certificate.'
    };
}

export default async function SchoolPilotCertificatePage({ params }) {
    const { certificateNo } = await params;
    const { data: approval } = await supabaseAdmin
        .from('school_pilot_approvals')
        .select('institution_id,status,approved_at,certificate_no,institutions(name,type)')
        .eq('certificate_no', certificateNo)
        .eq('status', 'approved')
        .maybeSingle();
    if (!approval) notFound();

    const { count: verifiedChecks } = await supabaseAdmin
        .from('school_pilot_signoffs')
        .select('id', { count: 'exact', head: true })
        .eq('institution_id', approval.institution_id)
        .eq('completed', true);

    return (
        <main className="min-h-screen bg-slate-100 px-4 py-10">
            <article className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-teal-200 bg-white shadow-xl">
                <header className="bg-slate-950 p-8 text-center text-white">
                    <ShieldCheck className="mx-auto text-teal-300" size={52} />
                    <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-teal-200">Verified DigiGram Pilot</p>
                    <h1 className="mt-3 text-3xl font-black">School Pilot Approval Certificate</h1>
                </header>
                <div className="p-6 sm:p-10">
                    <div className="flex items-center gap-4 rounded-2xl bg-teal-50 p-5">
                        <School className="text-teal-800" size={36} />
                        <div>
                            <h2 className="text-2xl font-black text-slate-950">{approval.institutions?.name}</h2>
                            <p className="font-bold capitalize text-slate-500">{approval.institutions?.type}</p>
                        </div>
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-400">Certificate</p><p className="mt-1 font-black text-slate-900">{approval.certificate_no}</p></div>
                        <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-400">Approved</p><p className="mt-1 font-black text-slate-900">{new Date(approval.approved_at).toLocaleDateString('bn-BD')}</p></div>
                        <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-400">UAT checks</p><p className="mt-1 font-black text-slate-900">{verifiedChecks || 0}/7</p></div>
                    </div>
                    <div className="mt-6 flex items-center gap-3 rounded-2xl border border-teal-200 p-4 text-teal-900">
                        <CheckCircle2 size={24} /><p className="font-black">এই certificate DigiGram database-এ valid এবং approved।</p>
                    </div>
                    <Link href="/" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">DigiGram home</Link>
                </div>
            </article>
        </main>
    );
}

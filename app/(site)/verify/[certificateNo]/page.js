import { notFound } from 'next/navigation';
import { supabasePublic } from '@/lib/utils/supabase';
import { CheckCircle2, XCircle } from 'lucide-react';
import FinalCertificate from '@/components/sections/ward/FinalCertificate';

export const dynamic = 'force-dynamic';

export default async function VerifyCertificatePage({ params }) {
    const { certificateNo } = await params;
    const { data: request } = await supabasePublic
        .from('service_requests')
        .select('*')
        .eq('certificate_no', decodeURIComponent(certificateNo))
        .single();

    if (!request) notFound();

    const valid = ['ready', 'completed'].includes(request.status);

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className={`mx-auto mb-6 flex max-w-4xl items-center gap-4 rounded-3xl border p-5 ${
                valid ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
            }`}>
                {valid ? <CheckCircle2 className="text-emerald-600" /> : <XCircle className="text-rose-600" />}
                <div>
                    <h1 className="font-black text-slate-800">{valid ? 'সনদটি বৈধ' : 'সনদটি বৈধ নয়'}</h1>
                    <p className="text-sm font-bold text-slate-500">সনদ নং: {request.certificate_no}</p>
                </div>
            </div>
            {valid && <FinalCertificate request={request} verificationUrl={`/verify/${encodeURIComponent(request.certificate_no)}`} />}
        </main>
    );
}

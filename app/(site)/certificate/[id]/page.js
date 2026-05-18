import { notFound } from 'next/navigation';
import { supabasePublic } from '@/lib/utils/supabase';
import FinalCertificate from '@/components/sections/ward/FinalCertificate';
import PrintCertificateButton from '@/components/sections/ward/PrintCertificateButton';

export const dynamic = 'force-dynamic';

export default async function CertificatePage({ params }) {
    const { id } = await params;
    const { data: request } = await supabasePublic
        .from('service_requests')
        .select('*')
        .eq('id', id)
        .single();

    if (!request || !['ready', 'completed'].includes(request.status) || !request.certificate_no) {
        notFound();
    }

    const verificationUrl = `/verify/${encodeURIComponent(request.certificate_no)}`;

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8 print:bg-white print:p-0">
            <div className="mx-auto mb-6 flex max-w-4xl items-center justify-between print:hidden">
                <div>
                    <h1 className="text-xl font-black text-slate-800">চূড়ান্ত সনদ</h1>
                    <p className="text-sm font-bold text-slate-500">{request.certificate_no}</p>
                </div>
                <PrintCertificateButton />
            </div>
            <FinalCertificate request={request} verificationUrl={verificationUrl} />
        </main>
    );
}

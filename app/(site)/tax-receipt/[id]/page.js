import { notFound } from 'next/navigation';
import { supabasePublic } from '@/lib/utils/supabase';
import TaxReceipt from '@/components/sections/ward/TaxReceipt';
import PrintCertificateButton from '@/components/sections/ward/PrintCertificateButton';

export const dynamic = 'force-dynamic';

export default async function TaxReceiptPage({ params }) {
    const { id } = await params;
    const { data: payment } = await supabasePublic
        .from('household_tax_payments')
        .select('*, tax:household_taxes(*)')
        .eq('id', id)
        .single();

    if (!payment?.tax) notFound();

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8 print:bg-white print:p-0">
            <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between print:hidden">
                <div>
                    <h1 className="text-xl font-black text-slate-800">কর রসিদ</h1>
                    <p className="text-sm font-bold text-slate-500">{payment.receipt_no}</p>
                </div>
                <PrintCertificateButton />
            </div>
            <TaxReceipt tax={payment.tax} payment={payment} verificationUrl={`/verify-tax/${encodeURIComponent(payment.receipt_no)}`} />
        </main>
    );
}

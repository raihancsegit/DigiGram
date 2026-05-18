import { notFound } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { supabasePublic } from '@/lib/utils/supabase';
import TaxReceipt from '@/components/sections/ward/TaxReceipt';

export const dynamic = 'force-dynamic';

export default async function VerifyTaxReceiptPage({ params }) {
    const { receiptNo } = await params;
    const { data: payment } = await supabasePublic
        .from('household_tax_payments')
        .select('*, tax:household_taxes(*)')
        .eq('receipt_no', decodeURIComponent(receiptNo))
        .single();

    if (!payment?.tax) notFound();

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto mb-6 flex max-w-3xl items-center gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <CheckCircle2 className="text-emerald-600" />
                <div>
                    <h1 className="font-black text-slate-800">কর রসিদটি বৈধ</h1>
                    <p className="text-sm font-bold text-slate-500">রসিদ নং: {payment.receipt_no}</p>
                </div>
            </div>
            <TaxReceipt tax={payment.tax} payment={payment} verificationUrl={`/verify-tax/${encodeURIComponent(payment.receipt_no)}`} />
        </main>
    );
}

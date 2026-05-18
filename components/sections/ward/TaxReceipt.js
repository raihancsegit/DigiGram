import { toBnDigits } from '@/lib/utils/format';

function money(value) {
    return toBnDigits(Number(value || 0).toFixed(0));
}

function formatDate(value) {
    if (!value) return '';
    return toBnDigits(new Date(value).toLocaleDateString('bn-BD'));
}

export default function TaxReceipt({ tax, payment, verificationUrl }) {
    const total = Number(tax.amount_due || 0);

    return (
        <article className="mx-auto w-full max-w-3xl border border-slate-300 bg-white p-6 text-slate-900 shadow-sm print:max-w-none print:border-slate-400 print:p-5 print:shadow-none">
            <header className="relative border-b border-slate-300 pb-4 text-center">
                <div className="absolute right-0 top-0 border border-slate-300 px-3 py-2 text-[10px] font-bold">
                    QR যাচাই
                </div>
                <p className="text-lg font-black">০২ নং হুজুরী পাড়া ইউনিয়ন</p>
                <p className="text-sm font-bold">পবা, রাজশাহী</p>
                <h1 className="mt-4 text-xl font-black">ইউপি করের বিল</h1>
                <p className="mt-1 text-sm font-bold">অর্থবছর: {toBnDigits(tax.fiscal_year_label || tax.year)}</p>
            </header>

            <section className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 text-sm font-bold">
                <p>ওয়ার্ড: {toBnDigits(tax.ward_no || '')}</p>
                <p>হোল্ডিং নং: {toBnDigits(tax.holding_no || '')}</p>
                <p>করদাতার নাম: {tax.taxpayer_name || ''}</p>
                <p>পিতা/স্বামীর নাম: {tax.guardian_name || ''}</p>
                <p className="col-span-2">বিলের ঠিকানা: {tax.address || ''}</p>
                <p>বিল ইস্যুর তারিখ: {formatDate(tax.issued_at || tax.created_at)}</p>
                <p>জমাদানের শেষ তারিখ: {formatDate(tax.due_date)}</p>
            </section>

            <table className="mt-6 w-full border-collapse text-center text-sm">
                <thead>
                    <tr>
                        <th className="border border-slate-400 px-2 py-2">করের বিবরণ</th>
                        <th className="border border-slate-400 px-2 py-2">বকেয়া</th>
                        <th className="border border-slate-400 px-2 py-2">১ম কিস্তি</th>
                        <th className="border border-slate-400 px-2 py-2">২য় কিস্তি</th>
                        <th className="border border-slate-400 px-2 py-2">৩য় কিস্তি</th>
                        <th className="border border-slate-400 px-2 py-2">৪র্থ কিস্তি</th>
                        <th className="border border-slate-400 px-2 py-2">মোট</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border border-slate-400 px-2 py-3 font-bold">হোল্ডিং কর</td>
                        <td className="border border-slate-400 px-2 py-3">{money(tax.previous_due)}</td>
                        <td className="border border-slate-400 px-2 py-3">{money(tax.quarter_1)}</td>
                        <td className="border border-slate-400 px-2 py-3">{money(tax.quarter_2)}</td>
                        <td className="border border-slate-400 px-2 py-3">{money(tax.quarter_3)}</td>
                        <td className="border border-slate-400 px-2 py-3">{money(tax.quarter_4)}</td>
                        <td className="border border-slate-400 px-2 py-3 font-black">{money(total)}</td>
                    </tr>
                </tbody>
            </table>

            <section className="mt-5 grid grid-cols-2 border border-slate-400 text-sm font-bold">
                <div className="border-r border-slate-400 p-4">
                    <p>প্রাপ্ত টাকা: {money(payment?.amount || tax.amount_paid)} /-</p>
                    <p className="mt-3">রসিদ নং: {toBnDigits(payment?.receipt_no || tax.receipt_no || '')}</p>
                    <p className="mt-3">আদায়ের তারিখ: {formatDate(payment?.paid_date || tax.paid_date)}</p>
                </div>
                <div className="p-4 text-right">
                    <p className="mt-10 border-t border-slate-400 pt-2">চেয়ারম্যান/আদায়কারীর স্বাক্ষর</p>
                    <p className="mt-2 text-xs">{payment?.collected_by || ''}</p>
                </div>
            </section>

            <footer className="mt-5 border-t border-slate-200 pt-4 text-xs font-bold">
                <p>যাচাই লিংক: {verificationUrl}</p>
            </footer>
        </article>
    );
}

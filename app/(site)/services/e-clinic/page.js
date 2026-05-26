import Link from 'next/link';
import { UnionClinicView } from './components/UnionClinicView';

export default async function EClinicPage(props) {
    const searchParams = await props.searchParams;
    const unionSlug = searchParams?.u;

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
            {unionSlug ? (
                <UnionClinicView unionSlug={unionSlug} />
            ) : (
                <div className="rounded-[40px] border border-dashed border-slate-300 bg-white px-5 py-16 text-center shadow-sm">
                    <h2 className="mb-4 text-2xl font-black text-slate-800">ইউনিয়ন নির্বাচন করুন</h2>
                    <p className="mx-auto mb-6 max-w-xl text-sm font-bold leading-7 text-slate-500">
                        E-Clinic সেবা দেখতে ইউনিয়ন portal থেকে প্রবেশ করুন। তখন ওই ইউনিয়নের ডাক্তার, অ্যাম্বুলেন্স, ফার্মেসি ও hotline দেখা যাবে।
                    </p>
                    <Link href="/" className="inline-flex rounded-2xl bg-rose-600 px-8 py-3 font-black text-white transition-all hover:bg-rose-700">
                        হোমে ফিরে যান
                    </Link>
                </div>
            )}
        </div>
    );
}

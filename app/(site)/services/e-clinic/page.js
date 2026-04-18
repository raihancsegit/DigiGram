import { UnionClinicView } from './components/UnionClinicView';

export default async function EClinicPage(props) {
    const searchParams = await props.searchParams;
    const unionSlug = searchParams?.u;

    return (
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-8 px-4">
            {unionSlug ? (
                <UnionClinicView unionSlug={unionSlug} />
            ) : (
                <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-300">
                    <h2 className="text-2xl font-black text-slate-800 mb-4">ইউনিয়ন নির্বাচন করুন</h2>
                    <p className="text-slate-500 mb-6">সেবাটি উপভোগ করতে আপনার ইউনিয়ন পোর্টাল থেকে প্রবেশ করুন।</p>
                    <a href="/" className="px-8 py-3 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all">হোমে ফিরে যান</a>
                </div>
            )}
        </div>
    );
}

import { getInstitutionByDomain } from '@/lib/services/hierarchyService';

export const dynamic = 'force-dynamic';

export default async function TenantHomePage({ params }) {
    const resolvedParams = await params;
    const { domain } = resolvedParams;

    const decodedDomain = decodeURIComponent(domain);
    const rawSubdomain = decodedDomain.replace('.localhost:3000', '').replace('.localhost', '');
    const data = await getInstitutionByDomain(rawSubdomain);
    
    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-black text-slate-800 mb-2">প্রতিষ্ঠানটি খুঁজে পাওয়া যায়নি</h2>
                    <p className="text-slate-500 font-bold">অনুগ্রহ করে সঠিক ইউআরএল চেক করুন।</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
                <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">🏫</span>
                </div>
                <h2 className="text-4xl font-black text-slate-800 mb-4">Welcome to {data.name}!</h2>
                <p className="text-slate-500 mb-8 max-w-2xl mx-auto">
                    This is a fully isolated multi-tenant subdomain. Students and teachers of this institution can login here to manage
                    their specific attendance, results, and SMS gateway.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="p-6 rounded-2xl bg-teal-50 border border-teal-100">
                        <h3 className="font-black text-teal-800 mb-2">Notice Board</h3>
                        <p className="text-sm text-teal-600 font-bold">No new notices for today.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-sky-50 border border-sky-100">
                        <h3 className="font-black text-sky-800 mb-2">Student Portal</h3>
                        <p className="text-sm text-sky-600 font-bold">Login to view results.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100">
                        <h3 className="font-black text-indigo-800 mb-2">Teacher Dashboard</h3>
                        <p className="text-sm text-indigo-600 font-bold">Submit attendance logs.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

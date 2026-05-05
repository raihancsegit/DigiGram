import { notFound } from 'next/navigation';
import { getInstitutionByDomain } from '@/lib/services/hierarchyService';

export default async function TenantLayout({ children, params }) {
    const resolvedParams = await params;
    const { domain } = resolvedParams;

    const decodedDomain = decodeURIComponent(domain);
    // Remove the .localhost or root domain postfix if testing locally securely
    const rawSubdomain = decodedDomain.replace('.localhost:3000', '').replace('.localhost', '');

    const institution = await getInstitutionByDomain(rawSubdomain);
    
    if (!institution) {
        return notFound();
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Shared Institution Header specific to the active tenant */}
            <header className="bg-white border-b shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-slate-800">{institution.name}</h1>
                        <p className="text-xs text-teal-600 font-bold uppercase tracking-widest">{institution.type} Portal</p>
                    </div>
                </div>
            </header>
            
            <main>
                {children}
            </main>
        </div>
    );
}

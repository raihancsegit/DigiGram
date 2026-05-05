export const dynamic = 'force-dynamic';

export default async function TenantLayout({ children, params }) {
    const resolvedParams = await params;
    const { domain } = resolvedParams;

    return (
        <div className="bg-slate-50 min-h-screen">
            <header className="bg-white border-b shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-slate-800">Debug {domain}</h1>
                    </div>
                </div>
            </header>
            
            <main>
                {children}
            </main>
        </div>
    );
}

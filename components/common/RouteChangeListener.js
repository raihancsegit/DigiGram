'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import GlobalLoading from './GlobalLoading';

export default function RouteChangeListener() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // When the pathname or searchParams change, it means navigation happened
        // We show the loader for a brief moment to make it feel smooth
        // and ensure the new page content is ready.
        const showTimeout = setTimeout(() => {
            setLoading(true);
        }, 0);
        
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 500); // Small delay for the "smooth" feel

        return () => {
            clearTimeout(showTimeout);
            clearTimeout(timeout);
        };
    }, [pathname, searchParams]);

    return <GlobalLoading isVisible={loading} />;
}

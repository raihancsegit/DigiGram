'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import GlobalLoading from './GlobalLoading';

export default function RouteChangeListener() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        const scrollFrame = window.requestAnimationFrame(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        });
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 350);

        return () => {
            window.cancelAnimationFrame(scrollFrame);
            clearTimeout(timeout);
        };
    }, [pathname, searchParams]);

    useEffect(() => {
        if (!loading) return undefined;
        const forceScrollTop = () => {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        };
        const previousBodyOverflow = document.body.style.overflow;
        const previousHtmlOverflow = document.documentElement.style.overflow;
        forceScrollTop();
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        const scrollFrame = window.requestAnimationFrame(() => {
            forceScrollTop();
        });
        const scrollTimer = window.setTimeout(forceScrollTop, 50);
        // Release a genuinely stalled navigation without making the UI appear frozen.
        const stalledNavigationTimer = setTimeout(() => {
            setLoading(false);
        }, 5_000);

        return () => {
            window.cancelAnimationFrame(scrollFrame);
            window.clearTimeout(scrollTimer);
            document.body.style.overflow = previousBodyOverflow;
            document.documentElement.style.overflow = previousHtmlOverflow;
            clearTimeout(stalledNavigationTimer);
        };
    }, [loading]);

    useEffect(() => {
        const resetScrollForLoading = () => {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        };

        const startLoadingForUrl = (urlLike) => {
            if (!urlLike) return;
            const url = new URL(urlLike, window.location.href);
            if (url.origin !== window.location.origin) return;
            if (url.pathname === window.location.pathname && url.search === window.location.search) return;

            resetScrollForLoading();
            setLoading(true);
        };

        const handleNavigationClick = (event) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            const anchor = event.target.closest?.('a[href]');
            if (!anchor || anchor.target || anchor.hasAttribute('download')) return;

            startLoadingForUrl(anchor.href);
        };

        const handlePopState = () => {
            resetScrollForLoading();
            setLoading(true);
        };

        const originalPushState = window.history.pushState;
        const originalReplaceState = window.history.replaceState;
        window.history.pushState = function patchedPushState(...args) {
            startLoadingForUrl(args[2]);
            return originalPushState.apply(this, args);
        };
        window.history.replaceState = function patchedReplaceState(...args) {
            startLoadingForUrl(args[2]);
            return originalReplaceState.apply(this, args);
        };

        document.addEventListener('click', handleNavigationClick, true);
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.history.pushState = originalPushState;
            window.history.replaceState = originalReplaceState;
            document.removeEventListener('click', handleNavigationClick, true);
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    return <GlobalLoading isVisible={loading} />;
}

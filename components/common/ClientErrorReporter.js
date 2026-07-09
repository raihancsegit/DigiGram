'use client';

import { useEffect } from 'react';

function sendClientError(payload) {
    fetch('/api/monitoring/client-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'client-error', path: window.location.pathname, ...payload }),
        keepalive: true,
    }).catch(() => {});
}

export default function ClientErrorReporter() {
    useEffect(() => {
        const handleError = (event) => {
            sendClientError({
                message: event.message || 'Unhandled browser error',
                source: event.filename || null,
                line: event.lineno || null,
                column: event.colno || null,
            });
        };
        const handleRejection = (event) => {
            const reason = event.reason;
            sendClientError({
                message: reason instanceof Error ? reason.message : String(reason || 'Unhandled promise rejection'),
            });
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);
        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, []);

    return null;
}

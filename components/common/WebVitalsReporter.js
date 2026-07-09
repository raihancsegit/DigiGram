'use client';

import { useReportWebVitals } from 'next/web-vitals';

function reportMetric(metric) {
    const payload = JSON.stringify({
        type: 'web-vital',
        name: metric.name,
        id: metric.id,
        value: metric.value,
        delta: metric.delta,
        rating: metric.rating,
        navigationType: metric.navigationType,
        path: window.location.pathname,
    });

    if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/monitoring/client-event', payload);
        return;
    }

    fetch('/api/monitoring/client-event', {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
    }).catch(() => {});
}

export default function WebVitalsReporter() {
    useReportWebVitals(reportMetric);
    return null;
}

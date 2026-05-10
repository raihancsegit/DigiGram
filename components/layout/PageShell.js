import { layout } from '@/lib/theme';

/**
 * হোম/পেজ শেল — ক্যানভাস ব্যাকগ্রাউন্ড + ম্যাক্স উইডথ এক জায়গায়।
 */
export default function PageShell({ children, className = '' }) {
    return (
        <main
            className={['dg-page-canvas mx-auto min-h-screen font-bengali relative w-full', className].filter(Boolean).join(' ')}
            style={{ maxWidth: layout.maxWidthPx }}
        >
            {children}
        </main>
    );
}

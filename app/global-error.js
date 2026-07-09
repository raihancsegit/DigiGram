'use client';

export default function GlobalError({ unstable_retry }) {
    return (
        <html lang="bn">
            <body>
                <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'sans-serif', background: '#f8fafc' }}>
                    <section style={{ maxWidth: 560, padding: 32, borderRadius: 28, background: 'white', textAlign: 'center' }}>
                        <h1>সাইটে সাময়িক সমস্যা হয়েছে</h1>
                        <p>কিছুক্ষণ পর আবার চেষ্টা করুন।</p>
                        <button type="button" onClick={() => unstable_retry()} style={{ marginTop: 16, minHeight: 48, padding: '0 24px', border: 0, borderRadius: 16, background: '#0d9488', color: 'white', fontWeight: 700 }}>
                            আবার চেষ্টা করুন
                        </button>
                    </section>
                </main>
            </body>
        </html>
    );
}

import { ImageResponse } from 'next/og';

export const alt = 'DigiGram digital citizen services portal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: 72,
                    background: 'linear-gradient(135deg, #020617 0%, #0f172a 55%, #0f766e 100%)',
                    color: 'white',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 30, color: '#5eead4', fontWeight: 700 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#14b8a6', color: '#020617', fontSize: 20 }}>DG</div>
                    DIGIGRAM
                </div>
                <div style={{ marginTop: 46, maxWidth: 960, fontSize: 72, lineHeight: 1.08, fontWeight: 800 }}>
                    Citizen services and local information in one place
                </div>
                <div style={{ marginTop: 28, fontSize: 30, color: '#cbd5e1' }}>
                    Union · Ward · Village · Market · Education · Health
                </div>
            </div>
        ),
        size
    );
}

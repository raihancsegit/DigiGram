import { NextResponse } from 'next/server';

const ALLOWED_TYPES = new Set(['client-error', 'web-vital']);
const ALLOWED_VITALS = new Set(['CLS', 'FCP', 'INP', 'LCP', 'TTFB']);
const rateLimit = new Map();

function cleanText(value, maxLength = 300) {
    return typeof value === 'string' ? value.replace(/[\r\n\t]+/g, ' ').slice(0, maxLength) : null;
}

export async function POST(request) {
    try {
        const contentLength = Number(request.headers.get('content-length') || 0);
        if (contentLength > 4096) {
            return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
        }
        const forwardedFor = request.headers.get('x-forwarded-for') || 'local';
        const clientKey = forwardedFor.split(',')[0].trim();
        const now = Date.now();
        const previous = rateLimit.get(clientKey);
        const current = !previous || now - previous.startedAt > 60_000
            ? { startedAt: now, count: 1 }
            : { ...previous, count: previous.count + 1 };
        rateLimit.set(clientKey, current);
        if (current.count > 60) {
            return NextResponse.json({ error: 'Too many events' }, { status: 429 });
        }

        const body = await request.json();
        if (!ALLOWED_TYPES.has(body?.type)) {
            return NextResponse.json({ error: 'Unsupported event type' }, { status: 400 });
        }

        const event = {
            type: body.type,
            path: cleanText(body.path, 180),
            timestamp: new Date().toISOString(),
        };

        if (body.type === 'web-vital') {
            if (!ALLOWED_VITALS.has(body.name) || !Number.isFinite(Number(body.value))) {
                return NextResponse.json({ error: 'Invalid web vital' }, { status: 400 });
            }
            Object.assign(event, {
                name: body.name,
                id: cleanText(body.id, 120),
                value: Number(body.value),
                delta: Number(body.delta || 0),
                rating: cleanText(body.rating, 32),
                navigationType: cleanText(body.navigationType, 32),
            });
            console.info('[web-vital]', event);
        } else {
            Object.assign(event, {
                message: cleanText(body.message),
                source: cleanText(body.source, 180),
                line: Number(body.line || 0) || null,
                column: Number(body.column || 0) || null,
            });
            console.error('[client-error]', event);
        }

        return new NextResponse(null, { status: 204 });
    } catch {
        return NextResponse.json({ error: 'Invalid monitoring payload' }, { status: 400 });
    }
}

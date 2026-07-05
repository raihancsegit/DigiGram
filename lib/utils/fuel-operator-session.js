import 'server-only';

import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'digigram_fuel_operator';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function getSecret() {
    const secret = process.env.FUEL_OPERATOR_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) throw new Error('Fuel operator session secret is not configured');
    return secret;
}

function sign(value) {
    return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function safeEqual(left, right) {
    const leftBuffer = Buffer.from(left || '');
    const rightBuffer = Buffer.from(right || '');
    return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createToken(unionSlug) {
    const payload = Buffer.from(JSON.stringify({
        unionSlug,
        expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000
    })).toString('base64url');
    return `${payload}.${sign(payload)}`;
}

function readToken(token) {
    try {
        const [payload, signature] = String(token || '').split('.');
        if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
        const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!session.unionSlug || Number(session.expiresAt) <= Date.now()) return null;
        return session;
    } catch {
        return null;
    }
}

export async function createFuelOperatorSession(unionSlug) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, createToken(unionSlug), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/services/fuel',
        maxAge: SESSION_TTL_SECONDS
    });
}

export async function clearFuelOperatorSession() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export async function requireFuelOperatorSession(unionSlug) {
    const cookieStore = await cookies();
    const session = readToken(cookieStore.get(COOKIE_NAME)?.value);
    if (!session || session.unionSlug !== unionSlug) {
        throw new Error('Operator session expired. Please log in again.');
    }
    return session;
}

export async function hasFuelOperatorSession(unionSlug) {
    try {
        await requireFuelOperatorSession(unionSlug);
        return true;
    } catch {
        return false;
    }
}

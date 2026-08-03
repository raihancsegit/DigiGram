import test from 'node:test';
import assert from 'node:assert/strict';

import { consumeRateLimit, rateLimitHeaders } from '../lib/utils/rate-limit.js';

function request(ip) {
    return { headers: new Headers({ 'x-forwarded-for': ip }) };
}

const unavailableClient = {
    async rpc() {
        return { data: null, error: { code: 'PGRST202', message: 'Function is not available' } };
    }
};

test('fallback limiter enforces a fixed window without exposing identity', async () => {
    const scope = `test-${crypto.randomUUID()}`;
    const options = {
        request: request('203.0.113.10'),
        scope,
        limit: 2,
        windowSeconds: 60,
        client: unavailableClient,
        now: 1_000
    };

    const first = await consumeRateLimit(options);
    const second = await consumeRateLimit(options);
    const blocked = await consumeRateLimit(options);

    assert.equal(first.allowed, true);
    assert.equal(second.allowed, true);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.deepEqual(rateLimitHeaders(blocked), {
        'Retry-After': '60',
        'X-RateLimit-Remaining': '0'
    });
});

test('fallback limiter resets after the configured window', async () => {
    const scope = `test-${crypto.randomUUID()}`;
    const options = {
        request: request('203.0.113.11'),
        scope,
        limit: 1,
        windowSeconds: 10,
        client: unavailableClient
    };

    assert.equal((await consumeRateLimit({ ...options, now: 5_000 })).allowed, true);
    assert.equal((await consumeRateLimit({ ...options, now: 6_000 })).allowed, false);
    assert.equal((await consumeRateLimit({ ...options, now: 15_000 })).allowed, true);
});

import crypto from 'node:crypto';

const fallbackBuckets = new Map();
let fallbackWarningShown = false;

export async function consumeRateLimit({
    request,
    scope,
    limit,
    windowSeconds,
    identity,
    client,
    now = Date.now()
}) {
    const safeLimit = clampInteger(limit, 1, 10_000);
    const safeWindow = clampInteger(windowSeconds, 1, 86_400);
    const rawIdentity = identity || getClientIp(request);
    const bucketKey = createBucketKey(scope, rawIdentity);

    try {
        if (!client?.rpc) throw new Error('Distributed rate-limit client is unavailable');
        const { data, error } = await client.rpc('consume_api_rate_limit', {
            p_bucket_key: bucketKey,
            p_limit: safeLimit,
            p_window_seconds: safeWindow
        });
        if (error) throw error;

        const result = Array.isArray(data) ? data[0] : data;
        if (result && typeof result.allowed === 'boolean') {
            return {
                allowed: result.allowed,
                remaining: Math.max(0, Number(result.remaining || 0)),
                retryAfter: Math.max(1, Number(result.retry_after || 1)),
                source: 'database'
            };
        }
        throw new Error('Invalid rate-limit response');
    } catch (error) {
        if (!fallbackWarningShown) {
            fallbackWarningShown = true;
            console.warn('Distributed rate limiter unavailable; using process-local fallback:', error?.code || error?.message);
        }
        return consumeFallback(bucketKey, safeLimit, safeWindow, now);
    }
}

export function rateLimitHeaders(result) {
    return {
        'Retry-After': String(result.retryAfter),
        'X-RateLimit-Remaining': String(result.remaining)
    };
}

function consumeFallback(bucketKey, limit, windowSeconds, now) {
    const windowMs = windowSeconds * 1000;
    const previous = fallbackBuckets.get(bucketKey);
    const bucket = !previous || now >= previous.resetAt
        ? { count: 1, resetAt: now + windowMs }
        : { count: previous.count + 1, resetAt: previous.resetAt };

    fallbackBuckets.set(bucketKey, bucket);
    pruneFallbackBuckets(now);

    return {
        allowed: bucket.count <= limit,
        remaining: Math.max(0, limit - bucket.count),
        retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
        source: 'memory'
    };
}

function getClientIp(request) {
    const headers = request?.headers;
    const forwarded = headers?.get?.('cf-connecting-ip')
        || headers?.get?.('x-real-ip')
        || headers?.get?.('x-forwarded-for')
        || 'unknown';
    return String(forwarded).split(',')[0].trim().slice(0, 128);
}

function createBucketKey(scope, identity) {
    const safeScope = String(scope || 'api').replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 80) || 'api';
    const digest = crypto
        .createHash('sha256')
        .update(String(identity || 'unknown'))
        .digest('hex');
    return `${safeScope}:${digest}`;
}

function clampInteger(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, Math.floor(Number(value) || minimum)));
}

function pruneFallbackBuckets(now) {
    if (fallbackBuckets.size < 2_000) return;
    for (const [key, bucket] of fallbackBuckets) {
        if (now >= bucket.resetAt) fallbackBuckets.delete(key);
    }
}

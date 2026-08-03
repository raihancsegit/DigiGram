const SENSITIVE_KEY_PATTERN = /(authorization|cookie|password|passcode|pin|otp|token|secret|api[-_]?key|service[-_]?role|phone|email)/i;
const MAX_DEPTH = 4;
const MAX_KEYS = 40;

function cleanString(value, maxLength = 500) {
    return String(value)
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/(bearer\s+)[^\s]+/gi, '$1[REDACTED]')
        .slice(0, maxLength);
}

export function sanitizeMonitoringValue(value, depth = 0, seen = new WeakSet()) {
    if (value == null || typeof value === 'boolean' || typeof value === 'number') return value;
    if (typeof value === 'string') return cleanString(value);
    if (typeof value !== 'object') return cleanString(value);
    if (depth >= MAX_DEPTH) return '[TRUNCATED]';
    if (seen.has(value)) return '[CIRCULAR]';

    seen.add(value);
    if (Array.isArray(value)) {
        return value.slice(0, 20).map((item) => sanitizeMonitoringValue(item, depth + 1, seen));
    }

    const safe = {};
    for (const [key, item] of Object.entries(value).slice(0, MAX_KEYS)) {
        safe[key] = SENSITIVE_KEY_PATTERN.test(key)
            ? '[REDACTED]'
            : sanitizeMonitoringValue(item, depth + 1, seen);
    }
    return safe;
}

export function createMonitoringEvent(error, context = {}) {
    const safeError = error instanceof Error
        ? {
            name: cleanString(error.name, 80),
            message: cleanString(error.message),
            code: error.code ? cleanString(error.code, 80) : undefined,
        }
        : { message: cleanString(error || 'Unknown server error') };

    return {
        level: 'error',
        event: 'server-error',
        timestamp: new Date().toISOString(),
        error: sanitizeMonitoringValue(safeError),
        context: sanitizeMonitoringValue(context),
    };
}

async function sendWebhook(event) {
    const webhookUrl = process.env.ERROR_MONITOR_WEBHOOK_URL;
    if (!webhookUrl) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
            signal: controller.signal,
        });
        if (!response.ok) {
            console.warn('[monitoring-webhook-failed]', { status: response.status });
        }
    } catch (error) {
        console.warn('[monitoring-webhook-failed]', {
            reason: error instanceof Error ? cleanString(error.message, 160) : 'unknown',
        });
    } finally {
        clearTimeout(timeout);
    }
}

export function reportServerError(error, context = {}) {
    const event = createMonitoringEvent(error, context);
    console.error('[server-error]', JSON.stringify(event));
    return sendWebhook(event);
}

function buildProviderHeaders(gateway = {}) {
    const config = parseConfig(gateway.config);
    const headers = {
        'Content-Type': 'application/json',
        ...(config.headers || {})
    };

    const apiKey = resolveApiKey(gateway, config);
    if (apiKey && !headers.Authorization) {
        const authScheme = config.auth_scheme === null ? '' : (config.auth_scheme || 'Bearer ');
        const authHeader = config.auth_header || 'Authorization';
        headers[authHeader] = `${authScheme}${apiKey}`;
    }

    return headers;
}

function buildProviderPayload(gateway, sms) {
    const config = parseConfig(gateway.config);
    const recipientKey = config.recipient_key || 'to';
    const messageKey = config.message_key || 'message';
    const senderKey = config.sender_key || 'sender_id';

    return {
        ...(config.static_payload || {}),
        [recipientKey]: sms.recipient_phone,
        [messageKey]: sms.message,
        ...(gateway.sender_id ? { [senderKey]: gateway.sender_id } : {})
    };
}

function buildRequestUrl(gateway, payload) {
    const config = parseConfig(gateway.config);
    if (config.payload_mode !== 'query') return gateway.api_base_url;
    const url = new URL(gateway.api_base_url);
    Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });
    return url.toString();
}

function buildRequestBody(gateway, payload) {
    const mode = parseConfig(gateway.config).payload_mode || 'json';
    if (mode === 'query') return undefined;
    if (mode === 'form') return new URLSearchParams(payload).toString();
    return JSON.stringify(payload);
}

function buildRequestHeaders(gateway) {
    const config = parseConfig(gateway.config);
    const headers = buildProviderHeaders(gateway);
    if (config.payload_mode === 'form') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    return headers;
}

function extractProviderMessageId(result) {
    if (!result || typeof result !== 'object') return null;
    return result.message_id || result.messageId || result.id || result.sid || result.data?.id || null;
}

function parseConfig(value) {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch {
        return {};
    }
}

function resolveApiKey(gateway, config) {
    if (config.api_key_env) return process.env[config.api_key_env] || '';
    return gateway.api_key || '';
}

function readPath(value, path) {
    if (!path) return undefined;
    return String(path).split('.').reduce((current, key) => current?.[key], value);
}

function providerAccepted(response, result, config) {
    if (!response.ok) return false;
    if (!config.success_path) return true;
    const actual = readPath(result, config.success_path);
    const accepted = Array.isArray(config.success_values) ? config.success_values : [true, 'true', 1, '1', 'success', 'ok'];
    return accepted.some((value) => String(value).toLowerCase() === String(actual).toLowerCase());
}

function safeProviderResponse(result) {
    if (!result || typeof result !== 'object') return {};
    const text = JSON.stringify(result);
    if (text.length <= 4000) return result;
    return { truncated: true, preview: text.slice(0, 4000) };
}

export async function sendSmsViaGateway(gateway, sms) {
    if (!gateway) {
        return { ok: false, error: 'No active SMS gateway configured' };
    }

    if (gateway.provider === 'mock') {
        return {
            ok: true,
            delivered: true,
            deliveryStatus: 'delivered',
            providerMessageId: `mock-${sms.id}`,
            response: { mocked: true }
        };
    }

    if (!gateway.api_base_url) {
        return { ok: false, error: 'SMS gateway API URL is missing' };
    }

    try {
        const config = parseConfig(gateway.config);
        const payload = buildProviderPayload(gateway, sms);
        const response = await fetch(buildRequestUrl(gateway, payload), {
            method: config.method || (config.payload_mode === 'query' ? 'GET' : 'POST'),
            headers: buildRequestHeaders(gateway),
            body: buildRequestBody(gateway, payload),
            signal: AbortSignal.timeout(Number(gateway.timeout_ms || config.timeout_ms || 15000))
        });

        const text = await response.text();
        let result = null;
        try {
            result = text ? JSON.parse(text) : null;
        } catch {
            result = { raw: text.slice(0, 4000) };
        }

        if (!providerAccepted(response, result, config)) {
            return {
                ok: false,
                httpStatus: response.status,
                error: result?.error || result?.message || `Provider rejected request (${response.status})`,
                response: safeProviderResponse(result)
            };
        }

        return {
            ok: true,
            delivered: Boolean(config.treat_accepted_as_delivered),
            deliveryStatus: config.treat_accepted_as_delivered ? 'delivered' : 'accepted',
            httpStatus: response.status,
            providerMessageId: extractProviderMessageId(result),
            response: safeProviderResponse(result)
        };
    } catch (error) {
        return {
            ok: false,
            httpStatus: null,
            error: error?.name === 'TimeoutError' ? 'SMS provider request timed out' : (error.message || 'SMS provider request failed'),
            response: {}
        };
    }
}

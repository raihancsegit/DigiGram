function buildProviderHeaders(gateway = {}) {
    const config = gateway.config || {};
    const headers = {
        'Content-Type': 'application/json',
        ...(config.headers || {})
    };

    if (gateway.api_key && !headers.Authorization) {
        headers.Authorization = `Bearer ${gateway.api_key}`;
    }

    return headers;
}

function buildProviderPayload(gateway, sms) {
    const config = gateway.config || {};
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
    if (gateway.config?.payload_mode !== 'query') return gateway.api_base_url;
    const url = new URL(gateway.api_base_url);
    Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });
    return url.toString();
}

function buildRequestBody(gateway, payload) {
    const mode = gateway.config?.payload_mode || 'json';
    if (mode === 'query') return undefined;
    if (mode === 'form') return new URLSearchParams(payload).toString();
    return JSON.stringify(payload);
}

function buildRequestHeaders(gateway) {
    const headers = buildProviderHeaders(gateway);
    if (gateway.config?.payload_mode === 'form') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    return headers;
}

function extractProviderMessageId(result) {
    if (!result || typeof result !== 'object') return null;
    return result.message_id || result.messageId || result.id || result.sid || result.data?.id || null;
}

export async function sendSmsViaGateway(gateway, sms) {
    if (!gateway) {
        return { ok: false, error: 'No active SMS gateway configured' };
    }

    if (gateway.provider === 'mock') {
        return {
            ok: true,
            providerMessageId: `mock-${sms.id}`,
            response: { mocked: true }
        };
    }

    if (!gateway.api_base_url) {
        return { ok: false, error: 'SMS gateway API URL is missing' };
    }

    const payload = buildProviderPayload(gateway, sms);
    const response = await fetch(buildRequestUrl(gateway, payload), {
        method: gateway.config?.method || (gateway.config?.payload_mode === 'query' ? 'GET' : 'POST'),
        headers: buildRequestHeaders(gateway),
        body: buildRequestBody(gateway, payload)
    });

    const text = await response.text();
    let result = null;
    try {
        result = text ? JSON.parse(text) : null;
    } catch {
        result = { raw: text };
    }

    if (!response.ok) {
        return {
            ok: false,
            error: result?.error || result?.message || `Provider HTTP ${response.status}`,
            response: result
        };
    }

    return {
        ok: true,
        providerMessageId: extractProviderMessageId(result),
        response: result
    };
}

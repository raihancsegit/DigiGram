const DEFAULT_JSON_LIMIT = 16 * 1024;

export async function readJsonObject(request, { maxBytes = DEFAULT_JSON_LIMIT } = {}) {
    const contentLength = Number(request.headers?.get?.('content-length') || 0);
    if (contentLength > maxBytes) {
        return { error: 'Request payload is too large', status: 413 };
    }

    let text;
    try {
        text = await request.text();
    } catch {
        return { error: 'Request body could not be read', status: 400 };
    }

    if (new TextEncoder().encode(text).byteLength > maxBytes) {
        return { error: 'Request payload is too large', status: 413 };
    }

    try {
        const data = JSON.parse(text);
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return { error: 'A JSON object is required', status: 400 };
        }
        return { data };
    } catch {
        return { error: 'Invalid JSON payload', status: 400 };
    }
}

export function validateTextFields(input, schema) {
    const values = {};
    const errors = {};

    for (const [field, rules] of Object.entries(schema)) {
        const raw = input[field];
        const missing = raw === undefined || raw === null || raw === '';

        if (missing) {
            if (rules.required) errors[field] = [`${rules.label || field} is required`];
            values[field] = rules.defaultValue ?? null;
            continue;
        }
        if (typeof raw !== 'string') {
            errors[field] = [`${rules.label || field} must be text`];
            continue;
        }

        const value = raw.trim();
        if (rules.required && !value) {
            errors[field] = [`${rules.label || field} is required`];
            continue;
        }
        if (rules.maxLength && value.length > rules.maxLength) {
            errors[field] = [`${rules.label || field} must be ${rules.maxLength} characters or less`];
            continue;
        }
        if (rules.allowed && !rules.allowed.has(value)) {
            errors[field] = [`${rules.label || field} is invalid`];
            continue;
        }
        if (rules.pattern && value && !rules.pattern.test(value)) {
            errors[field] = [`${rules.label || field} has an invalid format`];
            continue;
        }
        values[field] = value || rules.defaultValue || null;
    }

    return {
        values,
        errors,
        valid: Object.keys(errors).length === 0
    };
}

export function validateOptionalNumber(value, {
    field,
    minimum,
    maximum
}) {
    if (value === undefined || value === null || value === '') {
        return { value: null };
    }
    const number = Number(value);
    if (!Number.isFinite(number) || number < minimum || number > maximum) {
        return { error: `${field} must be between ${minimum} and ${maximum}` };
    }
    return { value: number };
}

export function validateMetadata(value, { maxBytes = 4096 } = {}) {
    if (value === undefined || value === null) return { value: {} };
    if (typeof value !== 'object' || Array.isArray(value)) {
        return { error: 'Metadata must be an object' };
    }
    try {
        if (new TextEncoder().encode(JSON.stringify(value)).byteLength > maxBytes) {
            return { error: 'Metadata is too large' };
        }
        return { value };
    } catch {
        return { error: 'Metadata is invalid' };
    }
}

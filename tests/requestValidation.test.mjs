import test from 'node:test';
import assert from 'node:assert/strict';

import {
    readJsonObject,
    validateMetadata,
    validateOptionalNumber,
    validateTextFields
} from '../lib/utils/request-validation.js';

test('reads bounded JSON objects and rejects oversized payloads', async () => {
    const valid = new Request('https://example.test', {
        method: 'POST',
        body: JSON.stringify({ title: '  Valid title  ' })
    });
    assert.deepEqual(await readJsonObject(valid), { data: { title: '  Valid title  ' } });

    const oversized = new Request('https://example.test', {
        method: 'POST',
        body: JSON.stringify({ title: 'x'.repeat(100) })
    });
    assert.deepEqual(await readJsonObject(oversized, { maxBytes: 32 }), {
        error: 'Request payload is too large',
        status: 413
    });
});

test('returns field-level errors and sanitized values', () => {
    const result = validateTextFields({
        title: '  Road repair  ',
        priority: 'root',
        description: 'x'.repeat(21)
    }, {
        title: { required: true, maxLength: 20 },
        priority: { allowed: new Set(['normal', 'urgent']) },
        description: { maxLength: 20 }
    });

    assert.equal(result.values.title, 'Road repair');
    assert.match(result.errors.priority[0], /invalid/);
    assert.match(result.errors.description[0], /20 characters/);
    assert.equal(result.valid, false);
});

test('validates numeric coordinates and bounded metadata', () => {
    assert.deepEqual(validateOptionalNumber('23.7', {
        field: 'Latitude',
        minimum: -90,
        maximum: 90
    }), { value: 23.7 });
    assert.match(validateOptionalNumber(200, {
        field: 'Longitude',
        minimum: -180,
        maximum: 180
    }).error, /between/);
    assert.deepEqual(validateMetadata({ source: 'citizen' }), {
        value: { source: 'citizen' }
    });
    assert.match(validateMetadata(['not', 'an', 'object']).error, /object/);
});

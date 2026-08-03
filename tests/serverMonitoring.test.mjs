import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
    createMonitoringEvent,
    sanitizeMonitoringValue
} from '../lib/utils/server-monitoring.js';

test('monitoring payloads redact secrets and personal contact fields', () => {
    const safe = sanitizeMonitoringValue({
        authorization: 'Bearer very-secret-token',
        nested: {
            pin: '1234',
            phone: '01700000000',
            email: 'person@example.com',
            harmless: 'kept'
        }
    });

    assert.equal(safe.authorization, '[REDACTED]');
    assert.equal(safe.nested.pin, '[REDACTED]');
    assert.equal(safe.nested.phone, '[REDACTED]');
    assert.equal(safe.nested.email, '[REDACTED]');
    assert.equal(safe.nested.harmless, 'kept');
});

test('server error events are bounded and do not include stacks', () => {
    const error = new Error('Database failed');
    error.code = 'DB_DOWN';
    const event = createMonitoringEvent(error, { route: '/api/example' });

    assert.equal(event.event, 'server-error');
    assert.equal(event.error.message, 'Database failed');
    assert.equal(event.error.code, 'DB_DOWN');
    assert.equal(event.context.route, '/api/example');
    assert.equal('stack' in event.error, false);
});

test('critical routes pass failures into the monitoring pipeline', () => {
    for (const file of [
        'app/api/citizen/otp/route.js',
        'app/api/payments/citizen/route.js',
        'app/api/household/upload-document/route.js'
    ]) {
        const source = fs.readFileSync(file, 'utf8');
        assert.match(
            source,
            /internalServerError\([\s\S]*?error|internalServerError\([\s\S]*?err/,
            `${file} should report its caught error`
        );
    }
});

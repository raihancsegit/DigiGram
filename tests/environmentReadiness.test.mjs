import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('environment audit covers core secrets without printing their values', () => {
    const source = fs.readFileSync('scripts/environment-readiness.mjs', 'utf8');
    for (const name of [
        'SUPABASE_SERVICE_ROLE_KEY',
        'CITIZEN_SESSION_SECRET',
        'FUEL_OPERATOR_SESSION_SECRET',
        'CRON_SECRET',
        'SMS_WORKER_SECRET',
        'SMS_WEBHOOK_SECRET'
    ]) {
        assert.ok(source.includes(`'${name}'`), `${name} should be audited`);
    }
    assert.doesNotMatch(source, /console\.(?:log|warn|error)\([^)]*process\.env\[/);
});

test('environment audit rejects secret-like NEXT_PUBLIC names', () => {
    const source = fs.readFileSync('scripts/environment-readiness.mjs', 'utf8');
    assert.match(source, /startsWith\('NEXT_PUBLIC_'\)/);
    assert.match(source, /SECRET\|SERVICE_ROLE\|PASSWORD\|TOKEN\|API_KEY/);
    assert.match(source, /ENV_AUDIT_STRICT/);
});

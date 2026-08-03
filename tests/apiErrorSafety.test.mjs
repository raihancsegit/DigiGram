import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const PUBLIC_ROUTES = [
    'app/api/citizen/otp/route.js',
    'app/api/citizen/complaints/route.js',
    'app/api/citizen/appointments/route.js',
    'app/api/citizen/life-support/route.js',
    'app/api/citizen/blood/route.js',
    'app/api/citizen/consent/route.js',
    'app/api/payments/citizen/route.js',
    'app/api/household/documents/route.js',
    'app/api/household/delete-document/route.js',
    'app/api/household/upload-document/route.js',
    'app/api/public/households/route.js'
];

test('high-risk public routes do not expose unexpected error details', () => {
    for (const file of PUBLIC_ROUTES) {
        const source = fs.readFileSync(file, 'utf8');
        assert.match(source, /internalServerError\(/, `${file} should use a generic 500 response`);
        assert.doesNotMatch(
            source,
            /NextResponse\.json\(\{\s*error:\s*(?:err|error)\.message[^}]*\}\s*,\s*\{\s*status:\s*500/,
            `${file} should not return raw exception messages`
        );
    }
});

test('upload routes validate content before storing it', () => {
    for (const file of [
        'app/api/household/upload-document/route.js',
        'app/api/admin/upload-avatar/route.js',
        'app/api/admin/upload-donation-image/route.js',
        'app/api/admin/upload-institution-image/route.js'
    ]) {
        const source = fs.readFileSync(file, 'utf8');
        assert.match(source, /validateUploadedFile\(/, `${file} should validate upload content`);
        assert.match(source, /createSafeUploadName\(/, `${file} should create its own filename`);
    }
});

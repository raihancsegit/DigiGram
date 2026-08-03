import test from 'node:test';
import assert from 'node:assert/strict';

import {
    createSafeUploadName,
    sanitizeStorageSegment,
    validateUploadedFile
} from '../lib/utils/upload-security.js';

function upload(bytes, type) {
    return new Blob([Uint8Array.from(bytes)], { type });
}

test('accepts supported files by MIME type and signature', async () => {
    const jpeg = upload([0xff, 0xd8, 0xff, 0xe0, 0x00], 'image/jpeg');
    const pdf = upload([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31], 'application/pdf');

    assert.deepEqual(await validateUploadedFile(jpeg), {
        extension: 'jpg',
        mimeType: 'image/jpeg'
    });
    assert.deepEqual(await validateUploadedFile(pdf, { kind: 'document' }), {
        extension: 'pdf',
        mimeType: 'application/pdf'
    });
});

test('rejects spoofed, unsupported, empty, and oversized uploads', async () => {
    const spoofed = upload([0x3c, 0x73, 0x76, 0x67], 'image/png');
    const svg = upload([0x3c, 0x73, 0x76, 0x67], 'image/svg+xml');
    const empty = upload([], 'image/png');
    const oversized = upload([0xff, 0xd8, 0xff], 'image/jpeg');

    assert.match((await validateUploadedFile(spoofed)).error, /does not match/);
    assert.match((await validateUploadedFile(svg)).error, /Only JPG/);
    assert.match((await validateUploadedFile(empty)).error, /empty/);
    assert.match((await validateUploadedFile(oversized, { maxBytes: 2 })).error, /0MB or less/);
});

test('generates server-controlled storage paths', () => {
    assert.equal(sanitizeStorageSegment('../../National ID card'), 'National-ID-card');
    assert.match(createSafeUploadName('png'), /^\d+-[0-9a-f-]{36}\.png$/);
});

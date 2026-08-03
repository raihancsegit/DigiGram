import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('mobile citizen audit is non-destructive', () => {
    const source = fs.readFileSync('scripts/mobile-citizen-audit.mjs', 'utf8');
    assert.match(source, /phone:\s*'invalid'/);
    assert.doesNotMatch(source, /document-upload|action:\s*['"]submit['"]/);
    assert.doesNotMatch(source, /method:\s*['"]DELETE['"]|method:\s*['"]PATCH['"]/);
});

test('narrow mobile chrome respects width and safe areas', () => {
    const footer = fs.readFileSync('components/layout/SiteFooter.js', 'utf8');
    const bottomNav = fs.readFileSync('components/layout/BottomNav.js', 'utf8');
    assert.match(footer, /w-full min-w-0/);
    assert.match(bottomNav, /safe-area-inset-bottom/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

test('PWA manifest and offline fallback are configured', () => {
    const manifest = JSON.parse(read('app/manifest.json'));
    assert.equal(manifest.lang, 'bn-BD');
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.scope, '/');
    assert.ok(manifest.icons.length >= 2);

    const worker = read('public/sw.js');
    assert.match(worker, /['"]\/offline['"]/);
    assert.match(worker, /event\.request\.mode === ['"]navigate['"]/);
    assert.ok(fs.existsSync('app/(site)/offline/page.js'));
});

test('global recovery and monitoring surfaces exist', () => {
    assert.ok(fs.existsSync('app/error.js'));
    assert.ok(fs.existsSync('app/global-error.js'));
    assert.ok(fs.existsSync('app/api/monitoring/client-event/route.js'));
    assert.ok(fs.existsSync('components/common/WebVitalsReporter.js'));
    assert.ok(fs.existsSync('components/common/ClientErrorReporter.js'));
});

test('public hierarchy pages provide dynamic metadata', () => {
    for (const file of [
        'app/(site)/u/[unionSlug]/page.js',
        'app/(site)/w/[id]/page.js',
        'app/(site)/g/[villageId]/page.js',
    ]) {
        assert.match(read(file), /export async function generateMetadata/);
    }
});

test('accessibility foundation includes skip link and focus styles', () => {
    assert.match(read('app/layout.js'), /href="#main-content"/);
    assert.match(read('components/layout/SiteShell.js'), /id="main-content"/);
    assert.match(read('app/globals.css'), /:focus-visible/);
    assert.match(read('app/globals.css'), /min-height:\s*44px/);
});

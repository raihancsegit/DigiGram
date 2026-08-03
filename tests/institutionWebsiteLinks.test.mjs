import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const adminPage = fs.readFileSync('app/(site)/admin/institutions/page.js', 'utf8');
const demoRoute = fs.readFileSync('app/api/admin/demo-data/route.js', 'utf8');
const unionPage = fs.readFileSync('app/(site)/admin/union/page.js', 'utf8');

test('institution website buttons use the deployed tenant route instead of localhost', () => {
    assert.doesNotMatch(adminPage, /inst\.subdomain\}\.localhost:3000/);
    assert.match(adminPage, /`\/institution\/\$\{inst\.id\}`/);
});

test('local institution demos include website content and a public notice', () => {
    assert.match(demoRoute, /const institution = await insertTracked\(batchId, 'institutions'/);
    assert.match(demoRoute, /insertTracked\(batchId, 'institution_pages'/);
    assert.match(demoRoute, /insertTracked\(batchId, 'institution_notices'/);
});

test('union actions reserve space and keep service settings label readable', () => {
    assert.match(unionPage, /min-w-\[900px\] table-fixed/);
    assert.match(unionPage, /whitespace-nowrap rounded-xl border border-teal-200/);
});

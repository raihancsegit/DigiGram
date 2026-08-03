import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

test('public household lists have bounded server-side pagination', () => {
    const route = read('app/api/public/households/route.js');
    assert.match(route, /boundedInteger\(searchParams\.get\('limit'\), 100, 1, 200\)/);
    assert.match(route, /\.range\(from, to\)/);
    assert.match(route, /\.limit\(Math\.min\(limit \* 20, 4000\)\)/);
    assert.match(route, /pagination:\s*\{/);
    assert.match(route, /hasMore:/);
});

test('citizen inbox lists are bounded and avoid select-star', () => {
    const route = read('app/api/citizen/inbox/route.js');
    assert.doesNotMatch(route, /\.select\(\s*['"`]\*['"`]\s*\)/);
    for (const limit of [10, 20, 30, 40, 50]) {
        assert.match(route, new RegExp(`\\.limit\\(${limit}\\)`));
    }
});

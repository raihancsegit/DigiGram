import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const seedRoute = fs.readFileSync('app/api/admin/seed-school/route.js', 'utf8');

test('school demo seed verifies all pilot-critical records before reporting success', () => {
    assert.match(seedRoute, /async function verifySeedResult/);
    for (const table of [
        'school_classes',
        'institution_memberships',
        'school_students',
        'school_lessons',
        'institution_notices',
        'institution_pages'
    ]) {
        assert.match(seedRoute, new RegExp(`['"]${table}['"]`));
    }
    assert.match(seedRoute, /SEED_VERIFICATION_FAILED/);
    assert.match(seedRoute, /const verification = await verifySeedResult/);
    assert.match(seedRoute, /verification,\s*summary:/);
});

test('school website seed write cannot fail silently', () => {
    assert.match(seedRoute, /const \{ error: websitePageError \} = await admin\.from\('institution_pages'\)\.upsert/);
    assert.match(seedRoute, /if \(websitePageError\) throw websitePageError/);
});

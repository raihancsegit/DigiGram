import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const adminPage = fs.readFileSync('app/(site)/admin/institutions/page.js', 'utf8');
const demoRoute = fs.readFileSync('app/api/admin/demo-data/route.js', 'utf8');
const unionPage = fs.readFileSync('app/(site)/admin/union/page.js', 'utf8');
const schoolAdmin = fs.readFileSync('components/sections/school/SchoolAdminClient.js', 'utf8');
const schoolPortal = fs.readFileSync('components/sections/school/SchoolPortalShell.js', 'utf8');
const websiteManager = fs.readFileSync('components/sections/institution/InstitutionWebsiteManager.js', 'utf8');
const publicInstitutionRoute = fs.readFileSync('app/institution/[institutionId]/page.js', 'utf8');

test('institution website buttons use the deployed tenant route instead of localhost', () => {
    assert.doesNotMatch(adminPage, /inst\.subdomain\}\.localhost:3000/);
    assert.match(adminPage, /getInstitutionWebsiteHref\(inst\)/);
    for (const source of [adminPage, schoolAdmin, schoolPortal, websiteManager]) {
        assert.doesNotMatch(source, /http:\/\/\$\{institution\?*\.subdomain\}\.localhost:3000/);
    }
});

test('id-based institution website route renders the full tenant website design', () => {
    assert.match(publicInstitutionRoute, /import TenantWebsiteClient/);
    assert.match(publicInstitutionRoute, /<TenantWebsiteClient/);
    assert.doesNotMatch(publicInstitutionRoute, /import PublicInstitutionWebsite/);
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

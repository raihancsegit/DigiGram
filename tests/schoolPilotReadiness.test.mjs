import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const route = fs.readFileSync('app/api/admin/launch/school-readiness/route.js', 'utf8');
const panel = fs.readFileSync('app/(site)/admin/launch/SchoolPilotReadinessPanel.js', 'utf8');
const launchPage = fs.readFileSync('app/(site)/admin/launch/page.js', 'utf8');
const certificatePage = fs.readFileSync('app/(site)/school/pilot/[certificateNo]/page.js', 'utf8');

test('school pilot readiness API is super-admin protected and checks operational data', () => {
    assert.match(route, /requireRequestProfile\(request, \['super_admin'\]\)/);
    for (const table of ['school_academic_sessions', 'school_classes', 'school_students', 'school_fee_types', 'school_routine_periods', 'institution_pages']) {
        assert.match(route, new RegExp(`['"]${table}['"]`));
    }
    assert.match(route, /get_digigram_migration_status/);
    assert.match(route, /school_pilot_signoffs/);
});

test('launch page renders the live school readiness panel', () => {
    assert.match(panel, /\/api\/admin\/launch\/school-readiness/);
    assert.match(panel, /school\.checks\.map/);
    assert.match(launchPage, /<SchoolPilotReadinessPanel \/>/);
});

test('readiness panel guides the next fix and verifies demo imports', () => {
    assert.match(panel, /function getNextAction/);
    assert.match(panel, /Run migrations/);
    assert.match(panel, /Import verified demo/);
    assert.match(panel, /Complete operations/);
    assert.match(panel, /Publish website/);
    assert.match(panel, /authenticatedFetch\('\/api\/admin\/seed-school'/);
    assert.match(panel, /verification\?\.passed/);
});

test('pilot UAT sign-off is persisted with verifier metadata', () => {
    assert.match(route, /export async function POST/);
    assert.match(route, /canManageInstitution\(auth\.profile, institutionId\)/);
    assert.match(route, /verified_by: completed \? auth\.profile\.id/);
    assert.match(route, /verified_at: completed \? new Date\(\)\.toISOString\(\)/);
    assert.match(panel, /const UAT_ITEMS/);
    assert.match(panel, /updateSignoff/);
    assert.match(panel, /Pilot UAT sign-off/);
    assert.match(panel, /exportUatReport/);
    assert.match(panel, /evidence note/);
    assert.match(panel, /verified_at/);
    assert.match(route, /action === 'approve'/);
    assert.match(route, /Operational readiness is incomplete/);
    assert.match(route, /school_pilot_approvals/);
    assert.match(panel, /Final pilot approval/);
    assert.match(panel, /Verify certificate/);
    assert.match(certificatePage, /await params/);
    assert.match(certificatePage, /\.eq\('status', 'approved'\)/);
});

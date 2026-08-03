import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const baseUrl = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
const failures = [];
let checks = 0;

function pass(label) {
    checks += 1;
    console.log(`PASS  ${label}`);
}

function fail(label, detail) {
    checks += 1;
    failures.push({ label, detail });
    console.error(`FAIL  ${label}: ${detail}`);
}

function expect(label, file, patterns) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const missing = patterns.filter((pattern) => !pattern.test(source));
    if (missing.length) fail(label, `missing ${missing.map(String).join(', ')}`);
    else pass(label);
}

async function expectLocked(pathname, method = 'GET') {
    try {
        const hasBody = !['GET', 'HEAD'].includes(method);
        const response = await fetch(`${baseUrl}${pathname}`, {
            method,
            headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
            body: hasBody ? '{}' : undefined,
            redirect: 'manual'
        });
        if ([401, 403].includes(response.status)) pass(`${method} ${pathname} locked (${response.status})`);
        else fail(`${method} ${pathname}`, `expected 401/403, received ${response.status}`);
    } catch (error) {
        fail(`${method} ${pathname}`, error instanceof Error ? error.message : 'request failed');
    }
}

expect('Location access walks parent scopes', 'lib/utils/server-auth.js', [
    /canAccessLocation/,
    /currentId === profile\.access_scope_id/,
    /depth < 6/
]);
expect('Institution access checks direct scope and membership', 'lib/utils/server-auth.js', [
    /canManageInstitution/,
    /institution_memberships/,
    /member_role', 'admin'/
]);
expect('Limited admins have an explicit path allowlist', 'lib/utils/portalRoutes.js', [
    /LIMITED_ADMIN_PATHS/,
    /institution_admin/,
    /canAccessAdminPath/
]);
expect('Admin layout enforces the path allowlist', 'app/(site)/admin/layout.js', [
    /canAccessAdminPath\(profile\.role, pathname\)/,
    /canAccessAdminPath\(user\?\.role, pathname\)/
]);
expect('Admin menu hides disallowed paths', 'components/layout/AdminShell.js', [
    /canAccessAdminPath\(user\?\.role, item\.path\)/
]);

const lockedRoutes = [
    ['/api/admin/overview', 'GET'],
    ['/api/admin/migrations', 'GET'],
    ['/api/admin/governance', 'GET'],
    ['/api/admin/mutate-location', 'POST'],
    ['/api/admin/mutate-user', 'POST'],
    ['/api/admin/upload-institution-image', 'GET'],
    ['/api/citizen/complaints/manage?scopeType=union&scopeId=00000000-0000-0000-0000-000000000000', 'GET'],
    ['/api/citizen/appointments/manage?scopeType=ward&scopeId=00000000-0000-0000-0000-000000000000', 'GET'],
    ['/api/citizen/life-support/manage?scopeType=ward&scopeId=00000000-0000-0000-0000-000000000000', 'GET'],
];

for (const [pathname, method] of lockedRoutes) await expectLocked(pathname, method);

console.log(`\n${checks - failures.length}/${checks} role-boundary checks passed.`);
if (failures.length) process.exitCode = 1;

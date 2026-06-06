import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const warnings = [];
let checks = 0;

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function pass(label) {
    checks += 1;
    console.log(`PASS  ${label}`);
}

function fail(label, detail) {
    checks += 1;
    failures.push({ label, detail });
    console.error(`FAIL  ${label}: ${detail}`);
}

function warn(label, detail) {
    warnings.push({ label, detail });
    console.warn(`WARN  ${label}: ${detail}`);
}

function expectText(label, text, patterns) {
    const missing = patterns.filter((pattern) => !pattern.test(text));
    if (missing.length === 0) pass(label);
    else fail(label, `missing ${missing.map(String).join(', ')}`);
}

const guardedRoutes = {
    'app/api/admin/create-user/route.js': [/requireRequestProfile/, /super_admin/],
    'app/api/admin/mutate-location/route.js': [/requireRequestProfile/, /super_admin/],
    'app/api/admin/mutate-user/route.js': [/requireRequestProfile/, /super_admin/],
    'app/api/admin/mutate-service/route.js': [/requireRequestProfile/, /super_admin/],
    'app/api/admin/maintenance/route.js': [/requireRequestProfile/, /super_admin/],
    'app/api/admin/sms/route.js': [/requireRequestProfile/, /super_admin/],
    'app/api/admin/mutate-market/route.js': [/requireRequestProfile/, /canAccessLocation/],
    'app/api/admin/mutate-donation/route.js': [/requireRequestProfile/, /canAccessLocation/],
    'app/api/admin/sync-household-villages/route.js': [/requireRequestProfile/, /canAccessLocation/],
    'app/api/admin/seed-school/route.js': [/requireRequestProfile/, /canManageInstitution/],
    'app/api/admin/upload-institution-image/route.js': [/requireRequestProfile/, /canManageInstitution/],
    'app/api/admin/upload-avatar/route.js': [/requireRequestProfile/, /auth\.profile\.id\s*!==\s*userId/]
};

for (const [file, patterns] of Object.entries(guardedRoutes)) {
    expectText(`${file} authorization`, read(file), patterns);
}

const adminRouteFiles = [];
function collectRoutes(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) collectRoutes(fullPath);
        if (entry.isFile() && entry.name === 'route.js') adminRouteFiles.push(fullPath);
    }
}
collectRoutes(path.join(root, 'app', 'api', 'admin'));

for (const absolutePath of adminRouteFiles) {
    const relativePath = path.relative(root, absolutePath).replaceAll('\\', '/');
    const source = fs.readFileSync(absolutePath, 'utf8');
    if (
        /requireRequestProfile|getRequestProfile|auth\.getUser|authorization/.test(source)
    ) {
        pass(`${relativePath} has request authentication`);
    } else {
        fail(`${relativePath} has request authentication`, 'service-role admin route is unguarded');
    }
}

const serverAuth = read('lib/utils/server-auth.js');
expectText('Location scope walks the hierarchy', serverAuth, [
    /canAccessLocation/,
    /parent_id/,
    /profile\.access_scope_id/
]);
expectText('Institution scope supports membership and direct scope', serverAuth, [
    /canManageInstitution/,
    /institution_memberships/,
    /profile\.access_scope_id\s*===\s*institutionId/
]);

const hardeningSql = read('database/63_role_rls_security_audit.sql');
expectText('Legacy village policies are removed', hardeningSql, [
    /DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public\.villages/,
    /DROP POLICY IF EXISTS "Enable update for authenticated users" ON public\.villages/,
    /Scoped officers can manage villages/
]);
expectText('Household documents remain private', hardeningSql, [
    /DROP POLICY IF EXISTS "Enable read access for all users" ON public\.household_documents/,
    /Scoped officers can read household documents/,
    /household_is_in_auth_village/
]);
expectText('Locker PIN mutation checks exact household scope', hardeningSql, [
    /CREATE OR REPLACE FUNCTION public\.set_household_locker_pin/,
    /Household is outside your assigned scope/,
    /household_is_in_auth_village/
]);
expectText('Database security diagnostic view exists', hardeningSql, [
    /CREATE OR REPLACE VIEW public\.admin_rls_security_audit/,
    /rls_disabled/,
    /review_permissive_policy/
]);

const allClientSources = [];
for (const directory of ['app', 'components', 'lib']) {
    const start = path.join(root, directory);
    const stack = [start];
    while (stack.length) {
        const current = stack.pop();
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) stack.push(fullPath);
            if (entry.isFile() && entry.name.endsWith('.js')) allClientSources.push(fullPath);
        }
    }
}

for (const file of allClientSources) {
    const source = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(root, file).replaceAll('\\', '/');
    if (/fetch\((['"`])\/api\/admin\//.test(source) && !/authenticatedFetch|Authorization/.test(source)) {
        fail(`${relativePath} admin API client`, 'admin API call does not attach a session token');
    }
}

const legacySql = [
    'database/update_schema.sql',
    'database/household_documents.sql'
].filter((file) => fs.existsSync(path.join(root, file)));
if (legacySql.length) {
    warn(
        'Legacy SQL files remain in the repository',
        `${legacySql.join(', ')} contain historical permissive policies; always run database/63_role_rls_security_audit.sql last`
    );
}

console.log(`\n${checks - failures.length}/${checks} security checks passed.`);
if (warnings.length) console.log(`${warnings.length} warning(s) require operational awareness.`);
if (failures.length) process.exitCode = 1;


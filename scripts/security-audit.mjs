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

const publicHardeningSql = read('database/70_security_hardening_fuel_otp_public_forms.sql');
expectText('Fuel demo mutation policies are removed', publicHardeningSql, [
    /DROP POLICY IF EXISTS "Anyone can upsert refill log"/,
    /DROP POLICY IF EXISTS "Anyone can upsert vehicle"/,
    /REVOKE ALL ON public\.fuel_pump_settings FROM anon, authenticated/
]);
expectText('Fuel operator PIN is hashed and service-role only', publicHardeningSql, [
    /access_password_hash/,
    /verify_fuel_operator_password/,
    /GRANT EXECUTE ON FUNCTION public\.verify_fuel_operator_password\(TEXT, TEXT\) TO service_role/
]);

const fuelActions = read('app/(site)/services/fuel/actions.js');
expectText('Fuel operator mutations require a signed session', fuelActions, [
    /requireFuelOperatorSession\(unionSlug\)/,
    /createFuelOperatorSession\(unionSlug\)/,
    /logoutOperatorAction/
]);

const marketComplaintRoute = read('app/api/market/complaints/route.js');
expectText('Market complaint management requires scoped authentication', marketComplaintRoute, [
    /requireRequestProfile\(request, \['super_admin', 'chairman', 'market_manager'\]\)/,
    /canAccessLocation\(auth\.profile, complaint\.location_id\)/
]);

const citizenOtp = read('lib/utils/citizen-otp.js');
expectText('Citizen OTP is atomically consumed and exchanged for a session', citizenOtp, [
    /\.update\(\{ used_at: new Date\(\)\.toISOString\(\) \}\)/,
    /createCitizenAccessToken/,
    /verifyCitizenAccessToken/
]);

const secureOfflineStorage = read('lib/utils/secureOfflineStorage.js');
expectText('Household offline drafts use encrypted device storage', secureOfflineStorage, [
    /name: 'AES-GCM'/,
    /indexedDB/,
    /extractable|false/
]);

const householdOutbox = read('lib/services/householdOfflineOutbox.js');
expectText('Household offline outbox encrypts sensitive payloads', householdOutbox, [
    /encryptOfflineJson/,
    /digigram-household-outbox:v2/,
    /removeItem\(LEGACY_OUTBOX_KEY\)/
]);

const householdEntryForm = read('components/sections/ward/HouseholdEntryForm.js');
expectText('Household field drafts no longer write plaintext localStorage', householdEntryForm, [
    /writeSecureLocalJson/,
    /readSecureLocalJson/
]);
if (/window\.localStorage\.setItem\(draftKey/.test(householdEntryForm)) {
    fail('Household field draft storage', 'draftKey is still written to plaintext localStorage');
}

const duplicateReviewSql = read('database/71_duplicate_citizen_review.sql');
expectText('Duplicate citizen decisions are audited and non-destructive', duplicateReviewSql, [
    /CREATE TABLE IF NOT EXISTS public\.duplicate_citizen_reviews/,
    /confirmed_duplicate/,
    /different_people/,
    /No resident is deleted automatically/
]);

const dataQualityRoute = read('app/api/admin/data-quality/route.js');
expectText('Duplicate review API validates the matched resident group', dataQualityRoute, [
    /action === 'review_duplicate'/,
    /fingerprintValid/,
    /duplicate_citizen_reviews/
]);

const governanceRoute = read('app/api/admin/governance/route.js');
expectText('Governance center is restricted to super admins', governanceRoute, [
    /requireRequestProfile\(request, \['super_admin'\]\)/,
    /rollback_duplicate_resident_merge/
]);

const officerDeviceRoute = read('app/api/officer/device/route.js');
expectText('Officer device registration requires an authenticated officer', officerDeviceRoute, [
    /requireRequestProfile\(request, OFFICER_ROLES\)/,
    /device_token_hash/
]);

const governanceMigration = read('database/72_citizen_governance_center.sql');
expectText('Citizen merge is reversible and never deletes resident records', governanceMigration, [
    /rollback_duplicate_resident_merge/,
    /merged_into_resident_id/,
    /Reversible, audited duplicate-resident merges/
]);
if (/DELETE FROM public\.residents/i.test(governanceMigration)) {
    fail('Citizen merge safety', 'governance migration deletes resident records');
}

const demoDataRoute = read('app/api/admin/demo-data/route.js');
expectText('Demo data manager is authenticated and registry-scoped', demoDataRoute, [
    /requireRequestProfile\(request, \['super_admin'\]\)/,
    /demo_data_records/,
    /record\.table_name/,
    /record\.record_id/
]);

const demoRegistrySql = read('database/73_demo_data_registry.sql');
expectText('Demo cleanup registry tracks exact generated rows', demoRegistrySql, [
    /CREATE TABLE IF NOT EXISTS public\.demo_data_batches/,
    /CREATE TABLE IF NOT EXISTS public\.demo_data_records/,
    /UNIQUE\(batch_id, table_name, record_id\)/
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

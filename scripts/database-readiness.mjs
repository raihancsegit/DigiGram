import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const databaseDir = path.join(root, 'database');
const registryFile = path.join(databaseDir, '66_migration_registry.sql');
const requiredAfterRegistry = ['74', '75', '76', '78', '79', '80', '81', '82', '83', '84', '85'];
const schoolOperationsTables = [
    'school_academic_sessions',
    'school_routine_periods',
    'school_fee_types',
    'school_fee_invoices',
    'school_fee_payments',
    'school_staff_attendance',
    'school_payroll_runs',
    'school_student_documents',
    'school_student_transitions',
    'school_staff_compensation',
    'school_finance_entries'
    ,'school_pilot_signoffs'
    ,'school_pilot_approvals'
];
const legacyFiles = ['update_schema.sql', 'household_documents.sql'];
const failures = [];
const warnings = [];

function pass(label) {
    console.log(`PASS  ${label}`);
}

function fail(label, detail) {
    failures.push({ label, detail });
    console.error(`FAIL  ${label}: ${detail}`);
}

function warn(label, detail) {
    warnings.push({ label, detail });
    console.warn(`WARN  ${label}: ${detail}`);
}

const sqlFiles = fs.readdirSync(databaseDir)
    .filter((name) => /^\d{2}_.+\.sql$/.test(name))
    .sort((a, b) => Number(a.slice(0, 2)) - Number(b.slice(0, 2)) || a.localeCompare(b));

for (const id of requiredAfterRegistry) {
    const matches = sqlFiles.filter((name) => name.startsWith(`${id}_`));
    if (matches.length === 1) pass(`Migration ${id} has one canonical SQL file`);
    else fail(`Migration ${id} canonical file`, `found ${matches.length}`);
}

const schoolMigrationSql = ['79', '80', '81', '82', '83', '84', '85']
    .map((id) => {
        const file = sqlFiles.find((name) => name.startsWith(`${id}_`));
        return file ? fs.readFileSync(path.join(databaseDir, file), 'utf8') : '';
    })
    .join('\n');
for (const table of schoolOperationsTables) {
    if (schoolMigrationSql.includes(table)) pass(`School operations schema includes ${table}`);
    else fail(`School operations schema ${table}`, 'table is not declared in migrations 79-82');
}

const registrySql = fs.readFileSync(registryFile, 'utf8');
for (const id of requiredAfterRegistry) {
    const file = sqlFiles.find((name) => name.startsWith(`${id}_`));
    if (file && registrySql.includes(`'database/${file}'`)) {
        pass(`Migration ${id} is tracked by migration 66`);
    } else {
        fail(`Migration ${id} registry coverage`, `${file || 'SQL file'} is not tracked`);
    }
}

if (fs.existsSync(path.join(databaseDir, '63_role_rls_security_audit.sql'))) {
    pass('Final RLS hardening migration exists');
} else {
    fail('Final RLS hardening migration', 'database/63_role_rls_security_audit.sql is missing');
}

for (const file of legacyFiles) {
    if (fs.existsSync(path.join(databaseDir, file))) {
        warn(`${file} is legacy-only`, 'do not run it during a new deployment');
    }
}

console.log('\nRequired production order: numbered feature migrations → 66 registry refresh → 63 final RLS hardening.');
console.log(`${failures.length ? 'NOT READY' : 'READY'}: ${failures.length} failure(s), ${warnings.length} warning(s).`);
if (failures.length) process.exitCode = 1;

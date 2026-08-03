import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('migration registry tracks all production migrations added after 73', () => {
    const registry = fs.readFileSync('database/66_migration_registry.sql', 'utf8');
    for (const file of [
        '74_household_based_school_enrollment.sql',
        '75_school_homework_attendance_upgrade.sql',
        '76_household_certificate_service_upgrade.sql',
        '78_distributed_api_rate_limits.sql',
        '79_school_operations_foundation.sql',
        '80_school_academic_organization.sql',
        '81_school_student_lifecycle.sql',
        '82_school_finance_and_payroll.sql'
        ,'83_school_pilot_signoff.sql',
        '84_school_pilot_approval.sql',
        '85_school_pilot_certificate.sql'
    ]) {
        assert.ok(registry.includes(`database/${file}`), `${file} should be tracked`);
    }
});

test('school operations migrations keep finance and student data institution-scoped', () => {
    const operations = fs.readFileSync('database/79_school_operations_foundation.sql', 'utf8');
    const organization = fs.readFileSync('database/80_school_academic_organization.sql', 'utf8');
    const lifecycle = fs.readFileSync('database/81_school_student_lifecycle.sql', 'utf8');
    const finance = fs.readFileSync('database/82_school_finance_and_payroll.sql', 'utf8');
    const pilot = fs.readFileSync('database/83_school_pilot_signoff.sql', 'utf8');
    const approval = fs.readFileSync('database/84_school_pilot_approval.sql', 'utf8');
    const certificate = fs.readFileSync('database/85_school_pilot_certificate.sql', 'utf8');
    for (const [name, sql] of Object.entries({ operations, organization, lifecycle, finance, pilot, approval, certificate })) {
        const minimumLength = name === 'certificate' ? 500 : 1000;
        assert.ok(sql.length > minimumLength, `${name} migration appears truncated`);
    }
    for (const sql of [operations, lifecycle, finance]) {
        assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
        assert.match(sql, /institution_memberships/);
        assert.match(sql, /institution_id/);
    }
    assert.match(operations, /record_school_fee_payment/);
    assert.match(operations, /Students read own fee invoices/);
    assert.match(lifecycle, /transition_school_student/);
    assert.match(lifecycle, /Students read own documents/);
    assert.match(lifecycle, /UPDATE public\.residents SET/);
    assert.match(finance, /Payment exceeds outstanding amount/);
    assert.match(pilot, /school_pilot_signoffs/);
    assert.match(pilot, /verified_by/);
    assert.match(approval, /school_pilot_approvals/);
    assert.match(certificate, /certificate_no/);
});

test('launch checklist marks demo and legacy SQL as non-production', () => {
    const checklist = fs.readFileSync('docs/launch_readiness_checklist.md', 'utf8');
    assert.match(checklist, /77_demo_location_cleanup_and_bangla_fix\.sql.*production-e run korben na/);
    assert.match(checklist, /update_schema\.sql.*legacy-only/);
    assert.match(checklist, /63_role_rls_security_audit\.sql.*final RLS hardening/);
});

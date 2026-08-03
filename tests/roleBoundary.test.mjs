import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessAdminPath } from '../lib/utils/portalRoutes.js';

test('super admin can access every admin path', () => {
    assert.equal(canAccessAdminPath('super_admin', '/admin'), true);
    assert.equal(canAccessAdminPath('super_admin', '/admin/governance'), true);
});

test('institution roles are restricted to institution and settings paths', () => {
    for (const role of ['institution_admin', 'school_admin', 'mosque_admin', 'clinic_admin']) {
        assert.equal(canAccessAdminPath(role, '/admin/institutions'), true);
        assert.equal(canAccessAdminPath(role, '/admin/institutions/example'), true);
        assert.equal(canAccessAdminPath(role, '/admin/settings'), true);
        assert.equal(canAccessAdminPath(role, '/admin'), false);
        assert.equal(canAccessAdminPath(role, '/admin/governance'), false);
        assert.equal(canAccessAdminPath(role, '/admin/members'), false);
    }
});

test('non-admin roles cannot access admin paths', () => {
    for (const role of ['chairman', 'ward_member', 'volunteer', 'teacher', 'student', null]) {
        assert.equal(canAccessAdminPath(role, '/admin/institutions'), false);
    }
});

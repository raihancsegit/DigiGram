export function getPortalRouteForRole(role) {
    if (role === 'super_admin') return '/admin';
    if (role === 'chairman') return '/chairman/dashboard';
    if (role === 'ward_member') return '/ward-member/dashboard';
    if (role === 'volunteer') return '/volunteer/dashboard';
    if (role === 'market_manager') return '/market-manager';
    if (role === 'institution_admin' || role === 'school_admin' || role === 'mosque_admin' || role === 'clinic_admin') return '/admin/institutions';
    if (role === 'teacher') return '/login';
    if (role === 'student') return '/citizen';
    return '/';
}

export function isAdminPortalRole(role) {
    return role === 'super_admin' || String(role || '').endsWith('_admin');
}

const LIMITED_ADMIN_PATHS = {
    institution_admin: ['/admin/institutions', '/admin/settings'],
    school_admin: ['/admin/institutions', '/admin/settings'],
    mosque_admin: ['/admin/institutions', '/admin/settings'],
    clinic_admin: ['/admin/institutions', '/admin/settings'],
};

export function canAccessAdminPath(role, pathname) {
    if (role === 'super_admin') return true;
    const allowed = LIMITED_ADMIN_PATHS[role] || [];
    return allowed.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

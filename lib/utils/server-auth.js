import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

function getBearerToken(request) {
    const authorization = request.headers.get('authorization') || '';
    return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : null;
}

export async function getRequestProfile(request) {
    const token = getBearerToken(request);
    if (!token) return null;

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user?.id) return null;

    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id,email,first_name,last_name,role,access_scope_id,permissions')
        .eq('id', authData.user.id)
        .maybeSingle();

    if (profileError || !profile) return null;
    return profile;
}

export async function requireRequestProfile(request, allowedRoles = []) {
    const profile = await getRequestProfile(request);
    if (!profile) {
        return {
            profile: null,
            response: NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        };
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
        return {
            profile: null,
            response: NextResponse.json({ error: 'You do not have permission for this action' }, { status: 403 })
        };
    }

    return { profile, response: null };
}

export async function canAccessLocation(profile, locationId) {
    if (!profile || !locationId) return false;
    if (profile.role === 'super_admin') return true;
    if (!profile.access_scope_id) return false;

    let currentId = locationId;
    for (let depth = 0; depth < 6 && currentId; depth += 1) {
        if (currentId === profile.access_scope_id) return true;
        const { data, error } = await supabaseAdmin
            .from('locations')
            .select('parent_id')
            .eq('id', currentId)
            .maybeSingle();
        if (error || !data) return false;
        currentId = data.parent_id;
    }
    return false;
}

export async function canManageInstitution(profile, institutionId) {
    if (!profile || !institutionId) return false;
    if (profile.role === 'super_admin') return true;
    if (
        ['institution_admin', 'school_admin'].includes(profile.role)
        && profile.access_scope_id === institutionId
    ) {
        return true;
    }

    const { data: membership } = await supabaseAdmin
        .from('institution_memberships')
        .select('id')
        .eq('institution_id', institutionId)
        .eq('profile_id', profile.id)
        .eq('is_active', true)
        .eq('member_role', 'admin')
        .maybeSingle();
    if (membership) return true;

    const { data: institution, error } = await supabaseAdmin
        .from('institutions')
        .select('location_id,village_location_id')
        .eq('id', institutionId)
        .maybeSingle();
    if (error || !institution) return false;

    return (
        await canAccessLocation(profile, institution.village_location_id)
        || await canAccessLocation(profile, institution.location_id)
    );
}

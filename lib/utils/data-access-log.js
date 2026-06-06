import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

function hashIp(request) {
    const forwarded = request?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim();
    const realIp = request?.headers?.get('x-real-ip')?.trim();
    const value = forwarded || realIp;
    if (!value) return null;
    return createHash('sha256').update(value).digest('hex');
}

export async function recordDataAccess({
    request,
    actor = null,
    citizenPhone = null,
    householdId = null,
    resourceType,
    resourceId = null,
    action,
    accessChannel = 'web',
    metadata = {}
}) {
    try {
        const { error } = await supabaseAdmin
            .from('data_access_logs')
            .insert([{
                actor_id: actor?.id || null,
                actor_role: actor?.role || (citizenPhone ? 'citizen' : null),
                citizen_phone: citizenPhone || null,
                household_id: householdId || null,
                resource_type: resourceType,
                resource_id: resourceId ? String(resourceId) : null,
                action,
                access_channel: accessChannel,
                ip_hash: hashIp(request),
                metadata
            }]);

        if (error && !['42P01', 'PGRST205'].includes(error.code)) {
            console.warn('Data access audit log skipped:', error.message);
        }
    } catch (error) {
        console.warn('Data access audit log skipped:', error.message);
    }
}

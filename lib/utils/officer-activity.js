import { supabaseAdmin } from '@/lib/utils/supabase-admin';

const SETUP_ERROR_CODES = new Set(['42P01', 'PGRST204', 'PGRST205']);

export async function loadOfficerActivity(sourceType, rows) {
    const ids = (rows || []).map((item) => item.id).filter(Boolean);
    if (ids.length === 0) return new Map();

    const { data, error } = await supabaseAdmin
        .from('officer_activity_events')
        .select('id,source_id,actor_role,actor_name,action,from_status,to_status,note,metadata,created_at')
        .eq('source_type', sourceType)
        .in('source_id', ids)
        .order('created_at', { ascending: false })
        .limit(Math.min(ids.length * 8, 800));

    if (error) {
        if (!SETUP_ERROR_CODES.has(error.code)) {
            console.warn('Officer activity load failed:', error);
        }
        return new Map();
    }

    return (data || []).reduce((map, event) => {
        const current = map.get(event.source_id) || [];
        if (current.length < 8) current.push(event);
        map.set(event.source_id, current);
        return map;
    }, new Map());
}

export async function recordOfficerActivity({
    sourceType,
    sourceId,
    assignedScopeId,
    actor,
    action,
    fromStatus,
    toStatus,
    note,
    metadata
}) {
    const actorName = [actor?.first_name, actor?.last_name].filter(Boolean).join(' ') || actor?.email || null;
    const { error } = await supabaseAdmin
        .from('officer_activity_events')
        .insert([{
            source_type: sourceType,
            source_id: sourceId,
            assigned_scope_id: assignedScopeId || null,
            actor_id: actor?.id || null,
            actor_role: actor?.role || null,
            actor_name: actorName,
            action,
            from_status: fromStatus || null,
            to_status: toStatus || null,
            note: note || null,
            metadata: metadata || {}
        }]);

    if (error && !SETUP_ERROR_CODES.has(error.code)) {
        console.warn('Officer activity record failed:', error);
    }
}


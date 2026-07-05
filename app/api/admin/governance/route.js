import { NextResponse } from 'next/server';
import { requireRequestProfile } from '@/lib/utils/server-auth';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

function missingRelation(error) {
    return ['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error?.code);
}

function safeSearch(value) {
    return String(value || '').trim().replace(/[%_,()]/g, ' ').replace(/\s+/g, ' ').slice(0, 80);
}

async function countRows(table, apply = (query) => query) {
    const { count, error } = await apply(
        supabaseAdmin.from(table).select('id', { count: 'exact', head: true })
    );
    if (error) {
        if (missingRelation(error)) return null;
        throw error;
    }
    return count || 0;
}

async function searchCitizens(queryText) {
    const q = safeSearch(queryText);
    if (q.length < 2) return [];

    const { data, error } = await supabaseAdmin
        .from('residents')
        .select('id,household_id,name,bn_name,nid,birth_reg_no,dob,gender,blood_group,father_name,mother_name,merged_into_resident_id')
        .is('merged_into_resident_id', null)
        .or(`name.ilike.%${q}%,bn_name.ilike.%${q}%,nid.ilike.%${q}%,birth_reg_no.ilike.%${q}%`)
        .limit(30);
    let residentRows = data || [];
    if (error) {
        if (error.code === '42703') {
            const fallback = await supabaseAdmin
                .from('residents')
                .select('id,household_id,name,bn_name,nid,birth_reg_no,dob,gender,blood_group,father_name,mother_name')
                .or(`name.ilike.%${q}%,bn_name.ilike.%${q}%,nid.ilike.%${q}%,birth_reg_no.ilike.%${q}%`)
                .limit(30);
            if (fallback.error) throw fallback.error;
            residentRows = fallback.data || [];
        } else {
            throw error;
        }
    }

    const rows = residentRows;
    const householdIds = [...new Set(rows.map((row) => row.household_id).filter(Boolean))];
    let households = [];
    if (householdIds.length) {
        const result = await supabaseAdmin
            .from('households')
            .select('id,house_no,owner_name,phone,ward_id,location_village_id')
            .in('id', householdIds);
        if (result.error) throw result.error;
        households = result.data || [];
    }
    const householdById = new Map(households.map((row) => [row.id, row]));
    return rows.map((row) => ({ ...row, household: householdById.get(row.household_id) || null }));
}

export async function GET(request) {
    const { profile, response } = await requireRequestProfile(request, ['super_admin']);
    if (response) return response;

    try {
        const url = new URL(request.url);
        const q = url.searchParams.get('q');
        const [devicesResult, rulesResult, snapshotsResult, mergeResult, consentCount, activeDeviceCount] = await Promise.all([
            supabaseAdmin
                .from('officer_devices')
                .select('*,profile:profiles(id,first_name,last_name,role,email)')
                .order('last_seen_at', { ascending: false })
                .limit(100),
            supabaseAdmin.from('sms_automation_rules').select('*').order('category').order('title'),
            supabaseAdmin.from('system_recovery_snapshots').select('*').order('created_at', { ascending: false }).limit(20),
            supabaseAdmin
                .from('citizen_merge_events')
                .select('*,primary:residents!citizen_merge_events_primary_resident_id_fkey(id,name,bn_name),duplicate:residents!citizen_merge_events_duplicate_resident_id_fkey(id,name,bn_name)')
                .order('merged_at', { ascending: false })
                .limit(30),
            countRows('citizen_consents', (query) => query.eq('granted', true)),
            countRows('officer_devices', (query) => query.is('revoked_at', null))
        ]);

        const setupRequired = [devicesResult, rulesResult, snapshotsResult, mergeResult]
            .some((result) => result.error && missingRelation(result.error));
        for (const result of [devicesResult, rulesResult, snapshotsResult, mergeResult]) {
            if (result.error && !missingRelation(result.error)) throw result.error;
        }

        return NextResponse.json({
            success: true,
            setupRequired,
            citizens: q ? await searchCitizens(q) : [],
            devices: devicesResult.data || [],
            rules: rulesResult.data || [],
            snapshots: snapshotsResult.data || [],
            merges: mergeResult.data || [],
            summary: {
                activeDevices: activeDeviceCount || 0,
                grantedConsents: consentCount || 0,
                activeRules: (rulesResult.data || []).filter((row) => row.enabled).length,
                reversibleMerges: (mergeResult.data || []).filter((row) => row.status === 'completed').length
            },
            actor: profile.id
        });
    } catch (error) {
        console.error('Governance center load failed:', error);
        return NextResponse.json({ error: error.message || 'Governance Center load failed' }, { status: 500 });
    }
}

export async function POST(request) {
    const { profile, response } = await requireRequestProfile(request, ['super_admin']);
    if (response) return response;

    try {
        const body = await request.json();

        if (body.action === 'revoke_device') {
            const { data, error } = await supabaseAdmin
                .from('officer_devices')
                .update({ revoked_at: new Date().toISOString() })
                .eq('id', body.id)
                .select()
                .single();
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (body.action === 'restore_device') {
            const { data, error } = await supabaseAdmin
                .from('officer_devices')
                .update({ revoked_at: null })
                .eq('id', body.id)
                .select()
                .single();
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (body.action === 'save_rule') {
            const cooldown = Math.max(1, Math.min(8760, Number(body.cooldownHours) || 24));
            const { data, error } = await supabaseAdmin
                .from('sms_automation_rules')
                .update({
                    enabled: Boolean(body.enabled),
                    cooldown_hours: cooldown,
                    template_text: String(body.templateText || '').slice(0, 1000) || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', body.id)
                .select()
                .single();
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (body.action === 'create_snapshot') {
            const tables = [
                'profiles', 'locations', 'households', 'residents', 'service_requests',
                'citizen_complaints', 'household_taxes', 'sms_messages', 'institutions'
            ];
            const summary = {};
            for (const table of tables) {
                summary[table] = await countRows(table);
            }
            const { data, error } = await supabaseAdmin
                .from('system_recovery_snapshots')
                .insert({
                    snapshot_type: 'health_summary',
                    label: String(body.label || 'Manual recovery checkpoint').slice(0, 120),
                    status: 'ready',
                    summary,
                    created_by: profile.id
                })
                .select()
                .single();
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (body.action === 'rollback_merge') {
            const { error } = await supabaseAdmin.rpc('rollback_duplicate_resident_merge', {
                target_event_id: body.id,
                actor_id: profile.id
            });
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Unknown governance action' }, { status: 400 });
    } catch (error) {
        console.error('Governance center update failed:', error);
        if (missingRelation(error)) {
            return NextResponse.json({ error: 'Run database/72_citizen_governance_center.sql first.' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message || 'Governance update failed' }, { status: 500 });
    }
}

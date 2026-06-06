import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

const ACTIVE_STATUSES = ['open', 'assigned', 'in_progress'];
const VALID_STATUSES = new Set([...ACTIVE_STATUSES, 'resolved', 'dismissed']);

function bearerToken(request) {
    const header = request.headers.get('authorization') || '';
    return header.startsWith('Bearer ') ? header.slice(7) : null;
}

async function getProfile(request) {
    const token = bearerToken(request);
    if (!token) return null;
    const { data: authData, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !authData?.user) return null;
    const { data } = await supabaseAdmin
        .from('profiles')
        .select('id,role')
        .eq('id', authData.user.id)
        .maybeSingle();
    return data || null;
}

async function fetchAll(table, columns) {
    const rows = [];
    const size = 1000;
    for (let start = 0; ; start += size) {
        const { data, error } = await supabaseAdmin
            .from(table)
            .select(columns)
            .order('id')
            .range(start, start + size - 1);
        if (error) throw error;
        rows.push(...(data || []));
        if (!data || data.length < size) break;
    }
    return rows;
}

function text(value) {
    return String(value || '').trim();
}

function normalize(value) {
    return text(value).toLowerCase().replace(/[^0-9a-z\u0980-\u09ff]/g, '');
}

function locationName(location) {
    return location?.name_bn || location?.name_en || 'নামহীন এলাকা';
}

function percentage(good, total) {
    return total ? Math.round((good / total) * 100) : 100;
}

function emptyMetric(id, name, parentId = null) {
    return {
        id, name, parentId, households: 0, residents: 0,
        missingIdentity: 0, missingBlood: 0, missingGps: 0,
        missingVillage: 0, missingCreator: 0, duplicates: 0,
        openTasks: 0, score: 100
    };
}

function calculateScore(metric) {
    return Math.max(0, Math.round(
        percentage(metric.residents - metric.missingIdentity, metric.residents) * 0.30
        + percentage(metric.residents - metric.missingBlood, metric.residents) * 0.15
        + percentage(metric.households - metric.missingGps, metric.households) * 0.15
        + percentage(metric.households - metric.missingVillage, metric.households) * 0.15
        + percentage(metric.households - metric.missingCreator, metric.households) * 0.10
        + percentage(metric.residents - metric.duplicates, metric.residents) * 0.15
    ));
}

const ISSUE_LABELS = {
    missing_identity: 'NID বা জন্ম নিবন্ধন নেই',
    missing_blood_group: 'রক্তের গ্রুপ নেই',
    missing_gps: 'GPS লোকেশন নেই',
    missing_village: 'গ্রাম ম্যাপিং নেই',
    missing_creator: 'ডাটা এন্ট্রি কর্মকর্তা নেই',
    duplicate_resident: 'সম্ভাব্য ডুপ্লিকেট নাগরিক'
};

function makeIssue(type, entityType, entityId, name, scope, householdId = null) {
    return {
        key: `${type}:${entityType}:${entityId}`,
        issueType: type,
        issueLabel: ISSUE_LABELS[type],
        entityType,
        entityId,
        entityName: name || 'নাম পাওয়া যায়নি',
        householdId,
        wardId: scope?.wardId || null,
        villageId: scope?.villageId || null,
        unionId: scope?.unionId || null
    };
}

function missingTable(error) {
    return ['42P01', 'PGRST205'].includes(error?.code);
}

function finalize(metrics) {
    return [...metrics.values()]
        .map((metric) => ({ ...metric, score: calculateScore(metric) }))
        .sort((a, b) => a.score - b.score || b.residents - a.residents);
}

export async function GET(request) {
    try {
        const profile = await getProfile(request);
        if (!profile || profile.role !== 'super_admin') {
            return NextResponse.json({ error: 'শুধু সুপার অ্যাডমিন এই রিপোর্ট দেখতে পারবেন।' }, { status: 403 });
        }

        const [locations, households, residents, profiles] = await Promise.all([
            fetchAll('locations', 'id,name_bn,name_en,type,parent_id'),
            fetchAll('households', 'id,house_no,owner_name,ward_id,location_village_id,lat,lng,added_by_user_id'),
            fetchAll('residents', 'id,household_id,name,bn_name,nid,birth_reg_no,blood_group,dob,father_name,mother_name'),
            fetchAll('profiles', 'id,first_name,last_name,role,access_scope_id')
        ]);

        const locationById = new Map(locations.map((row) => [row.id, row]));
        const unionMetrics = new Map();
        const wardMetrics = new Map();
        const volunteerMetrics = new Map();
        const householdScopes = new Map();
        const issues = [];

        locations.filter((row) => row.type === 'union').forEach((row) => {
            unionMetrics.set(row.id, emptyMetric(row.id, locationName(row)));
        });
        locations.filter((row) => row.type === 'ward').forEach((row) => {
            wardMetrics.set(row.id, emptyMetric(row.id, locationName(row), row.parent_id));
        });
        profiles.filter((row) => row.role === 'volunteer').forEach((row) => {
            volunteerMetrics.set(row.id, {
                ...emptyMetric(row.id, `${text(row.first_name)} ${text(row.last_name)}`.trim() || 'নামহীন ভলান্টিয়ার'),
                villageId: row.access_scope_id
            });
        });

        for (const household of households) {
            const ward = locationById.get(household.ward_id);
            const scope = {
                wardId: household.ward_id,
                villageId: household.location_village_id,
                unionId: ward?.parent_id || null,
                volunteerId: household.added_by_user_id
            };
            householdScopes.set(household.id, scope);
            const metrics = [
                wardMetrics.get(scope.wardId),
                unionMetrics.get(scope.unionId),
                volunteerMetrics.get(scope.volunteerId)
            ].filter(Boolean);
            metrics.forEach((metric) => {
                metric.households += 1;
                if (household.lat == null || household.lng == null) metric.missingGps += 1;
                if (!household.location_village_id) metric.missingVillage += 1;
                if (!household.added_by_user_id) metric.missingCreator += 1;
            });
            const label = household.owner_name || household.house_no;
            if (household.lat == null || household.lng == null) {
                issues.push(makeIssue('missing_gps', 'household', household.id, label, scope, household.id));
            }
            if (!household.location_village_id) {
                issues.push(makeIssue('missing_village', 'household', household.id, label, scope, household.id));
            }
            if (!household.added_by_user_id) {
                issues.push(makeIssue('missing_creator', 'household', household.id, label, scope, household.id));
            }
        }

        const duplicateGroups = new Map();
        for (const resident of residents) {
            const scope = householdScopes.get(resident.household_id) || {};
            const metrics = [
                wardMetrics.get(scope.wardId),
                unionMetrics.get(scope.unionId),
                volunteerMetrics.get(scope.volunteerId)
            ].filter(Boolean);
            const identityMissing = !text(resident.nid) && !text(resident.birth_reg_no);
            const bloodMissing = !text(resident.blood_group);
            metrics.forEach((metric) => {
                metric.residents += 1;
                if (identityMissing) metric.missingIdentity += 1;
                if (bloodMissing) metric.missingBlood += 1;
            });
            const label = resident.bn_name || resident.name;
            if (identityMissing) {
                issues.push(makeIssue('missing_identity', 'resident', resident.id, label, scope, resident.household_id));
            }
            if (bloodMissing) {
                issues.push(makeIssue('missing_blood_group', 'resident', resident.id, label, scope, resident.household_id));
            }

            const identityKey = text(resident.nid)
                ? `nid:${normalize(resident.nid)}`
                : text(resident.birth_reg_no)
                    ? `birth:${normalize(resident.birth_reg_no)}`
                    : resident.dob && resident.name
                        ? `bio:${normalize(resident.name)}:${normalize(resident.father_name)}:${normalize(resident.mother_name)}:${resident.dob}`
                        : null;
            if (identityKey) {
                const group = duplicateGroups.get(identityKey) || [];
                group.push({ resident, scope });
                duplicateGroups.set(identityKey, group);
            }
        }

        for (const group of duplicateGroups.values()) {
            if (group.length < 2) continue;
            for (const { resident, scope } of group) {
                [
                    wardMetrics.get(scope.wardId),
                    unionMetrics.get(scope.unionId),
                    volunteerMetrics.get(scope.volunteerId)
                ].filter(Boolean).forEach((metric) => { metric.duplicates += 1; });
                issues.push(makeIssue(
                    'duplicate_resident',
                    'resident',
                    resident.id,
                    resident.bn_name || resident.name,
                    scope,
                    resident.household_id
                ));
            }
        }

        let tasks = [];
        let setupRequired = false;
        const { data: taskRows, error: taskError } = await supabaseAdmin
            .from('data_quality_tasks')
            .select('*,assignee:profiles!data_quality_tasks_assigned_to_fkey(id,first_name,last_name)')
            .order('created_at', { ascending: false })
            .limit(500);
        if (taskError) {
            if (missingTable(taskError)) setupRequired = true;
            else throw taskError;
        } else {
            tasks = taskRows || [];
            tasks.filter((task) => ACTIVE_STATUSES.includes(task.status)).forEach((task) => {
                if (wardMetrics.has(task.ward_id)) wardMetrics.get(task.ward_id).openTasks += 1;
                if (unionMetrics.has(task.union_id)) unionMetrics.get(task.union_id).openTasks += 1;
            });
        }

        const wardRanking = finalize(wardMetrics);
        const total = emptyMetric('all', 'সকল এলাকা');
        wardRanking.forEach((metric) => {
            Object.keys(total).forEach((key) => {
                if (typeof total[key] === 'number' && key !== 'score') total[key] += metric[key] || 0;
            });
        });
        total.score = calculateScore(total);

        return NextResponse.json({
            success: true,
            summary: total,
            unionRanking: finalize(unionMetrics),
            wardRanking,
            volunteerRanking: finalize(volunteerMetrics).filter((row) => row.households || row.residents),
            issues: issues.slice(0, 3000),
            tasks,
            assignees: profiles
                .filter((row) => ['ward_member', 'volunteer'].includes(row.role))
                .map((row) => ({
                    id: row.id,
                    name: `${text(row.first_name)} ${text(row.last_name)}`.trim() || 'নামহীন কর্মকর্তা',
                    role: row.role
                })),
            setupRequired
        });
    } catch (error) {
        console.error('Data quality command center load failed:', error);
        return NextResponse.json({ error: error.message || 'ডাটা কোয়ালিটি রিপোর্ট লোড হয়নি।' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const profile = await getProfile(request);
        if (!profile || profile.role !== 'super_admin') {
            return NextResponse.json({ error: 'অনুমতি নেই।' }, { status: 403 });
        }
        const body = await request.json();

        if (body.action === 'create_task') {
            const issue = body.issue;
            if (!issue?.entityId || !issue?.issueType) {
                return NextResponse.json({ error: 'সঠিক issue নির্বাচন করুন।' }, { status: 400 });
            }
            const { data, error } = await supabaseAdmin.from('data_quality_tasks').insert([{
                issue_type: issue.issueType,
                entity_type: issue.entityType,
                entity_id: issue.entityId,
                union_id: issue.unionId || null,
                ward_id: issue.wardId || null,
                village_id: issue.villageId || null,
                title: `${issue.issueLabel}: ${issue.entityName}`,
                priority: 'high',
                created_by: profile.id
            }]).select().single();
            if (error?.code === '23505') {
                return NextResponse.json({ error: 'এই সমস্যার active task আগে থেকেই আছে।' }, { status: 409 });
            }
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (body.action === 'update_task') {
            if (!body.id) {
                return NextResponse.json({ error: 'Task ID প্রয়োজন।' }, { status: 400 });
            }
            const update = {};
            if (VALID_STATUSES.has(body.status)) update.status = body.status;
            if ('assignedTo' in body) {
                update.assigned_to = body.assignedTo || null;
                if (!body.status) update.status = body.assignedTo ? 'assigned' : 'open';
            }
            if (!Object.keys(update).length) {
                return NextResponse.json({ error: 'Update করার তথ্য নেই।' }, { status: 400 });
            }
            const { data, error } = await supabaseAdmin
                .from('data_quality_tasks')
                .update(update)
                .eq('id', body.id)
                .select()
                .single();
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        return NextResponse.json({ error: 'অজানা action।' }, { status: 400 });
    } catch (error) {
        console.error('Data quality task update failed:', error);
        if (missingTable(error)) {
            return NextResponse.json({ error: 'প্রথমে database/62_data_quality_command_center.sql চালান।' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message || 'Task update হয়নি।' }, { status: 500 });
    }
}

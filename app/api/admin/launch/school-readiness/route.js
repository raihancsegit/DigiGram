import { NextResponse } from 'next/server';
import { canManageInstitution, requireRequestProfile } from '@/lib/utils/server-auth';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export const dynamic = 'force-dynamic';

const SCHOOL_TYPES = ['school', 'college', 'madrassa', 'madrasa', 'kindergarten', 'primary'];
const PILOT_ITEM_KEYS = new Set([
    'teacher_login',
    'student_login',
    'guardian_verify',
    'attendance',
    'fee_receipt',
    'result_card',
    'website_mobile'
]);

async function safeRows(table, columns, refine = (query) => query) {
    try {
        const { data, error } = await refine(supabaseAdmin.from(table).select(columns));
        return { rows: data || [], error: error?.message || null };
    } catch (error) {
        return { rows: [], error: error.message || String(error) };
    }
}

async function hasInstitutionRows(table, institutionId, refine = (query) => query) {
    const { count, error } = await refine(
        supabaseAdmin.from(table).select('id', { count: 'exact', head: true }).eq('institution_id', institutionId)
    );
    if (error) throw error;
    return (count || 0) > 0;
}

function countByInstitution(rows) {
    return rows.reduce((counts, row) => {
        if (row.institution_id) counts[row.institution_id] = (counts[row.institution_id] || 0) + 1;
        return counts;
    }, {});
}

function scoreChecks(checks) {
    const passed = checks.filter((item) => item.ok).length;
    return Math.round((passed / checks.length) * 100);
}

export async function GET(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin']);
        if (auth.response) return auth.response;

        const [
            institutions,
            sessions,
            classes,
            teachers,
            students,
            feeTypes,
            routines,
            pages,
            signoffs,
            approvals,
            migrations
        ] = await Promise.all([
            safeRows('institutions', 'id,name,type,subdomain', (query) => query.in('type', SCHOOL_TYPES).order('name').limit(50)),
            safeRows('school_academic_sessions', 'institution_id'),
            safeRows('school_classes', 'institution_id'),
            safeRows('institution_memberships', 'institution_id', (query) => query.eq('member_role', 'teacher').eq('is_active', true)),
            safeRows('school_students', 'institution_id', (query) => query.eq('active', true)),
            safeRows('school_fee_types', 'institution_id', (query) => query.eq('is_active', true)),
            safeRows('school_routine_periods', 'institution_id', (query) => query.eq('is_active', true)),
            safeRows('institution_pages', 'institution_id,published_at'),
            safeRows('school_pilot_signoffs', 'institution_id,item_key,completed,note,verified_by,verified_at'),
            safeRows('school_pilot_approvals', 'institution_id,status,approved_by,approved_at,note,certificate_no'),
            supabaseAdmin.rpc('get_digigram_migration_status')
        ]);

        const datasets = { sessions, classes, teachers, students, feeTypes, routines, pages };
        const counts = Object.fromEntries(
            Object.entries(datasets).map(([key, result]) => [key, countByInstitution(result.rows)])
        );
        const publishedInstitutionIds = new Set(
            pages.rows.filter((page) => page.published_at).map((page) => page.institution_id)
        );
        const signoffsByInstitution = signoffs.rows.reduce((groups, item) => {
            groups[item.institution_id] ||= [];
            groups[item.institution_id].push(item);
            return groups;
        }, {});
        const migrationRows = migrations.data || [];
        const approvalsByInstitution = Object.fromEntries(approvals.rows.map((item) => [item.institution_id, item]));
        const migrationReady = !migrations.error
            && migrationRows.length > 0
            && migrationRows.every((migration) => migration.installed);
        const schemaReady = Object.values(datasets).every((result) => !result.error);

        const schools = institutions.rows.map((institution) => {
            const id = institution.id;
            const checks = [
                { key: 'schema', label: 'Operations schema', ok: schemaReady },
                { key: 'migration', label: 'Migrations', ok: migrationReady },
                { key: 'session', label: 'Academic session', ok: (counts.sessions[id] || 0) > 0 },
                { key: 'class', label: 'Classes', ok: (counts.classes[id] || 0) > 0 },
                { key: 'people', label: 'Teachers & students', ok: (counts.teachers[id] || 0) > 0 && (counts.students[id] || 0) > 0 },
                { key: 'routine', label: 'Routine', ok: (counts.routines[id] || 0) > 0 },
                { key: 'fees', label: 'Fee structure', ok: (counts.feeTypes[id] || 0) > 0 },
                { key: 'website', label: 'Website published', ok: publishedInstitutionIds.has(id) }
            ];
            return {
                ...institution,
                score: scoreChecks(checks),
                status: checks.every((item) => item.ok) ? 'ready' : checks.some((item) => item.ok) ? 'in_progress' : 'blocked',
                checks,
                counts: {
                    sessions: counts.sessions[id] || 0,
                    classes: counts.classes[id] || 0,
                    teachers: counts.teachers[id] || 0,
                    students: counts.students[id] || 0,
                    routines: counts.routines[id] || 0,
                    feeTypes: counts.feeTypes[id] || 0
                },
                signoffs: signoffsByInstitution[id] || [],
                approval: approvalsByInstitution[id] || null
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                generatedAt: new Date().toISOString(),
                migrationReady,
                schemaReady,
                sourceErrors: Object.fromEntries(
                    Object.entries(datasets).filter(([, result]) => result.error).map(([key, result]) => [key, result.error])
                ),
                summary: {
                    total: schools.length,
                    ready: schools.filter((school) => school.status === 'ready').length,
                    inProgress: schools.filter((school) => school.status === 'in_progress').length,
                    blocked: schools.filter((school) => school.status === 'blocked').length
                },
                schools
            }
        });
    } catch (error) {
        console.error('School pilot readiness load failed:', error);
        return NextResponse.json({ error: error.message || 'School pilot readiness load failed' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin', 'institution_admin', 'school_admin']);
        if (auth.response) return auth.response;
        const { institutionId, itemKey, completed, note = null, action } = await request.json();
        if (action === 'approve') {
            if (auth.profile.role !== 'super_admin' || !institutionId) {
                return NextResponse.json({ error: 'Super admin approval is required' }, { status: 403 });
            }
            const { count: completedCount, error: signoffError } = await supabaseAdmin
                .from('school_pilot_signoffs')
                .select('id', { count: 'exact', head: true })
                .eq('institution_id', institutionId)
                .eq('completed', true);
            if (signoffError) throw signoffError;
            if (completedCount !== PILOT_ITEM_KEYS.size) {
                return NextResponse.json({ error: 'Complete all 7 UAT items before approval' }, { status: 409 });
            }
            const readiness = await Promise.all([
                hasInstitutionRows('school_academic_sessions', institutionId),
                hasInstitutionRows('school_classes', institutionId),
                hasInstitutionRows('institution_memberships', institutionId, (query) => query.eq('member_role', 'teacher').eq('is_active', true)),
                hasInstitutionRows('school_students', institutionId, (query) => query.eq('active', true)),
                hasInstitutionRows('school_routine_periods', institutionId, (query) => query.eq('is_active', true)),
                hasInstitutionRows('school_fee_types', institutionId, (query) => query.eq('is_active', true)),
                hasInstitutionRows('institution_pages', institutionId, (query) => query.not('published_at', 'is', null))
            ]);
            if (!readiness.every(Boolean)) {
                return NextResponse.json({ error: 'Operational readiness is incomplete' }, { status: 409 });
            }
            const { data, error } = await supabaseAdmin
                .from('school_pilot_approvals')
                .upsert({
                    institution_id: institutionId,
                    status: 'approved',
                    approved_by: auth.profile.id,
                    approved_at: new Date().toISOString(),
                    note: note ? String(note).slice(0, 500) : null,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'institution_id' })
                .select('institution_id,status,approved_by,approved_at,note,certificate_no')
                .single();
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }
        if (!institutionId || !PILOT_ITEM_KEYS.has(itemKey) || typeof completed !== 'boolean') {
            return NextResponse.json({ error: 'institutionId, itemKey and completed are required' }, { status: 400 });
        }
        if (!(await canManageInstitution(auth.profile, institutionId))) {
            return NextResponse.json({ error: 'This institution is outside your assigned scope' }, { status: 403 });
        }

        const { data, error } = await supabaseAdmin
            .from('school_pilot_signoffs')
            .upsert({
                institution_id: institutionId,
                item_key: itemKey,
                completed,
                note: note ? String(note).slice(0, 500) : null,
                verified_by: completed ? auth.profile.id : null,
                verified_at: completed ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            }, { onConflict: 'institution_id,item_key' })
            .select('institution_id,item_key,completed,note,verified_by,verified_at')
            .single();
        if (error) throw error;
        if (!completed) {
            await supabaseAdmin.from('school_pilot_approvals').delete().eq('institution_id', institutionId);
        }
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('School pilot sign-off update failed:', error);
        return NextResponse.json({ error: error.message || 'School pilot sign-off update failed' }, { status: 500 });
    }
}

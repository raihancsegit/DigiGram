import { NextResponse } from 'next/server';
import { requireRequestProfile } from '@/lib/utils/server-auth';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export const dynamic = 'force-dynamic';

const REQUIRED_ENV = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL', group: 'core', configured: () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase anon key', group: 'core', configured: () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Service role key', group: 'core', configured: () => Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) },
    { key: 'SMS_WORKER_SECRET / CRON_SECRET', label: 'SMS worker secret', group: 'sms', configured: () => Boolean(process.env.SMS_WORKER_SECRET || process.env.CRON_SECRET) },
    { key: 'SMS_WEBHOOK_SECRET', label: 'SMS webhook secret', group: 'sms', configured: () => Boolean(process.env.SMS_WEBHOOK_SECRET) },
    { key: 'GEMINI_API_KEY', label: 'Gemini API key', group: 'ai', configured: () => Boolean(process.env.GEMINI_API_KEY) }
];

async function safeCount(table, applyFilter = (query) => query) {
    try {
        const query = applyFilter(supabaseAdmin.from(table).select('*', { count: 'exact', head: true }));
        const { count, error } = await query;
        if (error) return { count: 0, error: error.message, code: error.code || null };
        return { count: count || 0, error: null, code: null };
    } catch (error) {
        return { count: 0, error: error.message || String(error), code: null };
    }
}

async function safeRpc(name) {
    try {
        const { data, error } = await supabaseAdmin.rpc(name);
        if (error) return { data: [], error: error.message, code: error.code || null };
        return { data: data || [], error: null, code: null };
    } catch (error) {
        return { data: [], error: error.message || String(error), code: null };
    }
}

function statusTone(ok, warning = false) {
    if (ok) return 'ready';
    return warning ? 'warning' : 'danger';
}

function buildStatusItems({ env, counts, migrations }) {
    const missingEnv = env.filter((item) => !item.configured).length;
    const migrationMissing = migrations.summary.missing;

    return [
        {
            key: 'environment',
            label: 'Environment',
            value: `${env.length - missingEnv}/${env.length}`,
            detail: missingEnv === 0 ? 'Required secrets configured' : `${missingEnv} secret/config missing`,
            tone: statusTone(missingEnv === 0, missingEnv <= 2)
        },
        {
            key: 'migrations',
            label: 'Migrations',
            value: migrations.ready ? `${migrations.summary.installed}/${migrations.summary.total}` : 'Setup',
            detail: migrations.ready
                ? (migrationMissing === 0 ? 'Registry reports all known migrations installed' : `${migrationMissing} migration missing`)
                : 'Migration registry RPC not available',
            tone: statusTone(migrations.ready && migrationMissing === 0, migrations.ready)
        },
        {
            key: 'sms',
            label: 'SMS Engine',
            value: counts.activeSmsGateways.count,
            detail: counts.activeSmsGateways.count > 0
                ? `${counts.queuedSms.count} queued, ${counts.failedSms.count} failed`
                : 'No active gateway found',
            tone: statusTone(counts.activeSmsGateways.count > 0 && counts.failedSms.count === 0, counts.activeSmsGateways.count > 0)
        },
        {
            key: 'citizen',
            label: 'Citizen Workload',
            value: counts.openComplaints.count + counts.openAppointments.count + counts.openLifeSupport.count,
            detail: `${counts.openComplaints.count} complaints, ${counts.openAppointments.count} appointments, ${counts.openLifeSupport.count} life support`,
            tone: statusTone(!counts.openComplaints.error && !counts.openAppointments.error && !counts.openLifeSupport.error, true)
        },
        {
            key: 'demo',
            label: 'Demo Registry',
            value: counts.demoBatches.count,
            detail: counts.demoBatches.error ? 'Run database/73_demo_data_registry.sql' : 'Demo cleanup registry reachable',
            tone: statusTone(!counts.demoBatches.error, true)
        },
        {
            key: 'security',
            label: 'Security Audit',
            value: counts.securityAuditIssues.count,
            detail: counts.securityAuditIssues.error ? 'Run database/63_role_rls_security_audit.sql' : 'Unsafe RLS rows from audit view',
            tone: statusTone(!counts.securityAuditIssues.error && counts.securityAuditIssues.count === 0, !counts.securityAuditIssues.error)
        }
    ];
}

function calculateScore(statusItems) {
    const points = statusItems.reduce((total, item) => {
        if (item.tone === 'ready') return total + 1;
        if (item.tone === 'warning') return total + 0.5;
        return total;
    }, 0);
    return Math.round((points / statusItems.length) * 100);
}

export async function GET(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin']);
        if (auth.response) return auth.response;

        const env = REQUIRED_ENV.map((item) => ({
            key: item.key,
            label: item.label,
            group: item.group,
            configured: item.configured()
        }));

        const [
            totalHouseholds,
            totalResidents,
            householdsMissingGps,
            activeSmsGateways,
            smsWallets,
            lowBalanceWallets,
            queuedSms,
            failedSms,
            pendingRecharge,
            openComplaints,
            openAppointments,
            openLifeSupport,
            activeMarketAlerts,
            activeLostFound,
            institutions,
            demoBatches,
            securityAuditIssues,
            migrationStatus
        ] = await Promise.all([
            safeCount('households'),
            safeCount('residents'),
            safeCount('households', (query) => query.or('lat.is.null,lng.is.null')),
            safeCount('sms_gateways', (query) => query.eq('is_active', true)),
            safeCount('sms_wallets'),
            safeCount('sms_wallets', (query) => query.lte('balance', 50)),
            safeCount('sms_messages', (query) => query.eq('status', 'queued')),
            safeCount('sms_messages', (query) => query.eq('status', 'failed')),
            safeCount('sms_recharge_requests', (query) => query.eq('status', 'pending')),
            safeCount('citizen_complaints', (query) => query.in('status', ['submitted', 'reviewing', 'assigned'])),
            safeCount('citizen_appointments', (query) => query.in('status', ['pending', 'confirmed'])),
            safeCount('citizen_life_support_cases', (query) => query.in('status', ['submitted', 'reviewing', 'approved'])),
            safeCount('market_price_alert_subscriptions', (query) => query.eq('is_active', true)),
            safeCount('lost_found_posts', (query) => query.eq('status', 'active')),
            safeCount('institutions'),
            safeCount('demo_data_batches'),
            safeCount('admin_rls_security_audit', (query) => query.neq('status', 'ok').neq('status', 'missing_table')),
            safeRpc('get_digigram_migration_status')
        ]);

        const migrationRows = migrationStatus.data || [];
        const migrations = {
            ready: !migrationStatus.error,
            error: migrationStatus.error,
            summary: {
                total: migrationRows.length,
                installed: migrationRows.filter((item) => item.installed).length,
                missing: migrationRows.filter((item) => !item.installed).length
            }
        };

        const counts = {
            totalHouseholds,
            totalResidents,
            householdsMissingGps,
            activeSmsGateways,
            smsWallets,
            lowBalanceWallets,
            queuedSms,
            failedSms,
            pendingRecharge,
            openComplaints,
            openAppointments,
            openLifeSupport,
            activeMarketAlerts,
            activeLostFound,
            institutions,
            demoBatches,
            securityAuditIssues
        };
        const statusItems = buildStatusItems({ env, counts, migrations });

        return NextResponse.json({
            success: true,
            data: {
                generatedAt: new Date().toISOString(),
                score: calculateScore(statusItems),
                env,
                counts,
                migrations,
                statusItems
            }
        });
    } catch (error) {
        console.error('Launch health load failed:', error);
        return NextResponse.json({ error: error.message || 'Launch health load failed' }, { status: 500 });
    }
}

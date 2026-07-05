import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { getRequestProfile } from '@/lib/utils/server-auth';
import { sendSmsViaGateway } from '@/lib/services/smsProviderGateway';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function secretMatches(request) {
    const workerSecret = process.env.SMS_WORKER_SECRET;
    const cronSecret = process.env.CRON_SECRET;
    const authorization = request.headers.get('authorization') || '';
    const workerHeader = request.headers.get('x-worker-secret');

    return Boolean(
        (workerSecret && workerHeader === workerSecret)
        || (workerSecret && authorization === `Bearer ${workerSecret}`)
        || (cronSecret && authorization === `Bearer ${cronSecret}`)
    );
}

async function canProcess(request) {
    if (secretMatches(request)) return true;
    const profile = await getRequestProfile(request);
    return profile?.role === 'super_admin';
}

function normalizeLimit(value) {
    return Math.min(Math.max(Number(value || 20), 1), 100);
}

function retryDelayMinutes(attempt) {
    return Math.min(5 * (2 ** Math.max(Number(attempt || 1) - 1, 0)), 360);
}

async function updateGatewayHealth(gatewayId, success, errorMessage = null) {
    if (success) {
        await supabaseAdmin
            .from('sms_gateways')
            .update({
                health_status: 'healthy',
                last_success_at: new Date().toISOString(),
                consecutive_failures: 0,
                last_error: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', gatewayId);
        return;
    }

    const { data: gateway } = await supabaseAdmin
        .from('sms_gateways')
        .select('consecutive_failures')
        .eq('id', gatewayId)
        .maybeSingle();
    const failures = Number(gateway?.consecutive_failures || 0) + 1;

    await supabaseAdmin
        .from('sms_gateways')
        .update({
            health_status: failures >= 3 ? 'down' : 'degraded',
            last_failure_at: new Date().toISOString(),
            consecutive_failures: failures,
            last_error: String(errorMessage || 'Provider failed').slice(0, 1000),
            updated_at: new Date().toISOString()
        })
        .eq('id', gatewayId);
}

async function recordAttempt({ sms, gateway, sent, workerId, durationMs }) {
    const status = sent.ok ? 'sent' : 'failed';
    const { error } = await supabaseAdmin.from('sms_delivery_attempts').insert([{
        sms_message_id: sms.id,
        gateway_id: gateway.id,
        attempt_no: sms.attempts,
        worker_id: workerId,
        status,
        provider_message_id: sent.providerMessageId || null,
        provider_http_status: sent.httpStatus || null,
        response_body: sent.response || {},
        error_message: sent.error ? String(sent.error).slice(0, 2000) : null,
        duration_ms: durationMs
    }]);
    if (error) console.error('SMS delivery-attempt audit failed:', error);
}

async function processQueuedSms(limit) {
    const { data: gateways, error: gatewayError } = await supabaseAdmin
        .from('sms_gateways')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true })
        .order('consecutive_failures', { ascending: true })
        .order('updated_at', { ascending: false });

    if (gatewayError) {
        if (['42703', 'PGRST204'].includes(gatewayError.code)) {
            return {
                error: 'SMS failover migration is not installed. Run database/69_sms_failover_webhook.sql.',
                status: 409
            };
        }
        throw gatewayError;
    }
    if (!gateways?.length) {
        return { error: 'No active SMS gateway configured', status: 409 };
    }
    const workerGateways = gateways.some((gateway) => gateway.provider !== 'mock')
        ? gateways.filter((gateway) => gateway.provider !== 'mock')
        : gateways;

    const workerId = `sms-${randomUUID()}`;
    const { data: messages, error: messageError } = await supabaseAdmin.rpc('claim_sms_messages', {
        p_limit: limit,
        p_worker_id: workerId
    });
    if (messageError) {
        if (messageError.code === 'PGRST202' || messageError.code === '42883') {
            return {
                error: 'SMS retry migration is not installed. Run database/68_sms_delivery_monitoring.sql.',
                status: 409
            };
        }
        throw messageError;
    }

    const results = [];
    for (const sms of messages || []) {
        let sent = null;
        let usedGateway = null;
        const gatewayAttempts = [];

        for (const gateway of workerGateways) {
            const startedAt = Date.now();
            const attemptResult = await sendSmsViaGateway(gateway, sms);
            const durationMs = Date.now() - startedAt;
            await recordAttempt({
                sms,
                gateway,
                sent: attemptResult,
                workerId,
                durationMs
            });
            await updateGatewayHealth(gateway.id, attemptResult.ok, attemptResult.error);
            gatewayAttempts.push({
                gatewayId: gateway.id,
                gatewayName: gateway.name,
                ok: attemptResult.ok,
                error: attemptResult.error || null
            });

            if (attemptResult.ok) {
                sent = attemptResult;
                usedGateway = gateway;
                break;
            }
        }

        if (!sent) {
            sent = {
                ok: false,
                error: gatewayAttempts.map((item) => `${item.gatewayName}: ${item.error}`).join(' | '),
                response: { gateway_attempts: gatewayAttempts }
            };
        }

        const finalFailure = !sent.ok && Number(sms.attempts || 0) >= Number(sms.max_attempts || 4);
        const now = new Date();
        const nextAttemptAt = new Date(now.getTime() + retryDelayMinutes(sms.attempts) * 60 * 1000);

        const updatePayload = sent.ok
            ? {
                status: 'sent',
                gateway_id: usedGateway.id,
                provider_message_id: sent.providerMessageId || null,
                provider_response: sent.response || {},
                delivery_status: sent.deliveryStatus || 'accepted',
                delivery_error: null,
                delivery_updated_at: now.toISOString(),
                error_message: null,
                sent_at: now.toISOString(),
                delivered_at: sent.delivered ? now.toISOString() : null,
                locked_at: null,
                locked_until: null,
                locked_by: null
            }
            : {
                status: finalFailure ? 'failed' : 'queued',
                gateway_id: null,
                provider_response: sent.response || {},
                delivery_status: 'provider_failed',
                delivery_error: String(sent.error || 'SMS provider failed').slice(0, 2000),
                delivery_updated_at: now.toISOString(),
                error_message: String(sent.error || 'SMS provider failed').slice(0, 2000),
                next_attempt_at: nextAttemptAt.toISOString(),
                locked_at: null,
                locked_until: null,
                locked_by: null
            };

        const { error: updateError } = await supabaseAdmin
            .from('sms_messages')
            .update(updatePayload)
            .eq('id', sms.id)
            .eq('locked_by', workerId);
        if (updateError) throw updateError;

        results.push({
            id: sms.id,
            status: sent.ok ? 'sent' : (finalFailure ? 'failed' : 'retry'),
            attempt: sms.attempts,
            nextAttemptAt: sent.ok || finalFailure ? null : nextAttemptAt.toISOString(),
            providerMessageId: sent.providerMessageId || null,
            error: sent.error || null,
            gatewayAttempts
        });
    }

    return {
        success: true,
        gateways: workerGateways.map((gateway) => ({
            id: gateway.id,
            name: gateway.name,
            provider: gateway.provider,
            priority: gateway.priority
        })),
        processed: results.length,
        sent: results.filter((item) => item.status === 'sent').length,
        retrying: results.filter((item) => item.status === 'retry').length,
        failed: results.filter((item) => item.status === 'failed').length,
        results
    };
}

async function handleProcess(request, limit) {
    try {
        if (!(await canProcess(request))) {
            return NextResponse.json({ error: 'Unauthorized SMS worker' }, { status: 401 });
        }

        const result = await processQueuedSms(normalizeLimit(limit));
        return NextResponse.json(result, { status: result.status || 200 });
    } catch (error) {
        console.error('SMS process failed:', error);
        return NextResponse.json({ error: error.message || 'SMS process failed' }, { status: 500 });
    }
}

export async function GET(request) {
    return handleProcess(request, new URL(request.url).searchParams.get('limit'));
}

export async function POST(request) {
    const body = await request.json().catch(() => ({}));
    return handleProcess(request, body.limit);
}

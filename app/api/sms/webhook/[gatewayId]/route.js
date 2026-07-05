import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export const dynamic = 'force-dynamic';

function parseConfig(value) {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch {
        return {};
    }
}

function readPath(value, path) {
    if (!path) return undefined;
    return String(path).split('.').reduce((current, key) => current?.[key], value);
}

function safeCompare(left, right) {
    const leftBuffer = Buffer.from(String(left || ''));
    const rightBuffer = Buffer.from(String(right || ''));
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function webhookSecret(config) {
    const envName = config.webhook_secret_env || 'SMS_WEBHOOK_SECRET';
    return process.env[envName] || '';
}

function verifyWebhook(request, rawBody, config) {
    const secret = webhookSecret(config);
    if (!secret) return false;

    const authorization = request.headers.get('authorization') || '';
    const directHeader = request.headers.get(config.webhook_secret_header || 'x-webhook-secret') || '';
    if (safeCompare(authorization, `Bearer ${secret}`) || safeCompare(directHeader, secret)) return true;

    const signatureHeader = config.webhook_signature_header;
    if (!signatureHeader) return false;
    const receivedSignature = request.headers.get(signatureHeader) || '';
    const algorithm = config.webhook_hmac_algorithm || 'sha256';
    const encoding = config.webhook_signature_encoding || 'hex';
    const prefix = config.webhook_signature_prefix || '';
    const calculated = `${prefix}${createHmac(algorithm, secret).update(rawBody).digest(encoding)}`;
    return safeCompare(receivedSignature, calculated);
}

function normalizeStatus(providerStatus, config) {
    const raw = String(providerStatus || '').trim().toLowerCase();
    const customMap = config.delivery_status_map || {};
    const custom = customMap[providerStatus] || customMap[raw];
    if (custom) return String(custom).toLowerCase();
    if (['delivered', 'delivery_success', 'success', 'delivrd'].includes(raw)) return 'delivered';
    if (['failed', 'rejected', 'expired', 'undelivered', 'delivery_failed'].includes(raw)) return 'failed';
    if (['sent', 'accepted', 'submitted', 'queued'].includes(raw)) return 'sent';
    return 'unknown';
}

async function parsePayload(request, rawBody) {
    if (request.method === 'GET') {
        return Object.fromEntries(new URL(request.url).searchParams);
    }
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return rawBody ? JSON.parse(rawBody) : {};
    if (contentType.includes('application/x-www-form-urlencoded')) {
        return Object.fromEntries(new URLSearchParams(rawBody));
    }
    try {
        return rawBody ? JSON.parse(rawBody) : {};
    } catch {
        return { raw: rawBody.slice(0, 4000) };
    }
}

async function handleWebhook(request, context) {
    const { gatewayId } = await context.params;
    let webhookRow = null;

    try {
        const { data: gateway, error: gatewayError } = await supabaseAdmin
            .from('sms_gateways')
            .select('id,provider,config')
            .eq('id', gatewayId)
            .maybeSingle();
        if (gatewayError) throw gatewayError;
        if (!gateway) {
            return NextResponse.json({ error: 'SMS webhook is not available' }, { status: 404 });
        }

        const config = parseConfig(gateway.config);
        if (config.webhook_enabled === false) {
            return NextResponse.json({ error: 'SMS webhook is disabled' }, { status: 404 });
        }
        const rawBody = await request.text();
        if (!verifyWebhook(request, rawBody, config)) {
            return NextResponse.json({ error: 'Invalid SMS webhook signature' }, { status: 401 });
        }

        const payload = await parsePayload(request, rawBody);
        const providerMessageId = readPath(payload, config.webhook_message_id_path || 'message_id')
            || payload.messageId
            || payload.id
            || payload.sid;
        const providerStatus = readPath(payload, config.webhook_status_path || 'status')
            || payload.delivery_status
            || payload.message_status;
        const normalizedStatus = normalizeStatus(providerStatus, config);

        if (!providerMessageId || !providerStatus) {
            const { data } = await supabaseAdmin.from('sms_delivery_webhooks').insert([{
                gateway_id: gateway.id,
                provider_message_id: providerMessageId || null,
                provider_status: providerStatus || null,
                normalized_status: normalizedStatus,
                payload,
                processed: false,
                error_message: 'Provider message id or status is missing'
            }]).select().single();
            webhookRow = data;
            return NextResponse.json({ error: 'Provider message id and status are required' }, { status: 400 });
        }

        const { data: sms } = await supabaseAdmin
            .from('sms_messages')
            .select('id,status,delivered_at')
            .eq('gateway_id', gateway.id)
            .eq('provider_message_id', String(providerMessageId))
            .maybeSingle();

        const now = new Date().toISOString();
        let processed = false;
        let processingError = null;
        if (!sms) {
            processingError = 'Matching SMS message was not found';
        } else if (normalizedStatus === 'unknown') {
            processingError = `Unknown provider status: ${providerStatus}`;
        } else {
            const effectiveStatus = sms.status === 'delivered' && normalizedStatus !== 'delivered'
                ? 'delivered'
                : normalizedStatus;
            const updatePayload = {
                status: effectiveStatus,
                delivery_status: String(providerStatus),
                delivery_error: effectiveStatus === 'failed'
                    ? String(readPath(payload, config.webhook_error_path || 'error') || payload.reason || providerStatus).slice(0, 2000)
                    : null,
                delivery_updated_at: now,
                delivered_at: effectiveStatus === 'delivered' ? (sms.delivered_at || now) : null
            };
            const { error: updateError } = await supabaseAdmin
                .from('sms_messages')
                .update(updatePayload)
                .eq('id', sms.id);
            if (updateError) throw updateError;
            processed = true;
        }

        const { data, error: logError } = await supabaseAdmin.from('sms_delivery_webhooks').insert([{
            gateway_id: gateway.id,
            sms_message_id: sms?.id || null,
            provider_message_id: String(providerMessageId),
            provider_status: String(providerStatus),
            normalized_status: normalizedStatus,
            payload,
            processed,
            error_message: processingError
        }]).select().single();
        if (logError) throw logError;
        webhookRow = data;

        return NextResponse.json({
            success: true,
            processed,
            messageId: sms?.id || null,
            status: normalizedStatus
        });
    } catch (error) {
        console.error('SMS delivery webhook failed:', error);
        if (webhookRow?.id) {
            await supabaseAdmin
                .from('sms_delivery_webhooks')
                .update({ processed: false, error_message: error.message || 'Webhook failed' })
                .eq('id', webhookRow.id);
        }
        const databaseUnavailable = error?.code === '42P01'
            || error?.code === '42703'
            || /fetch failed|sms_delivery_webhooks|webhook_enabled/i.test(error?.message || '');
        return NextResponse.json(
            {
                error: databaseUnavailable
                    ? 'SMS delivery webhook is not ready. Apply migration 69 and check the database connection.'
                    : 'SMS delivery webhook failed'
            },
            { status: databaseUnavailable ? 503 : 500 }
        );
    }
}

export async function POST(request, context) {
    return handleWebhook(request, context);
}

export async function GET(request, context) {
    return handleWebhook(request, context);
}

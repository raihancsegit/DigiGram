import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { sendSmsViaGateway } from '@/lib/services/smsProviderGateway';

export const dynamic = 'force-dynamic';

function canProcess(request) {
    const workerSecret = process.env.SMS_WORKER_SECRET;
    const cronSecret = process.env.CRON_SECRET;
    if (!workerSecret && !cronSecret) return true;
    const url = new URL(request.url);
    const authHeader = request.headers.get('authorization');

    return (
        (workerSecret && request.headers.get('x-worker-secret') === workerSecret)
        || (workerSecret && url.searchParams.get('secret') === workerSecret)
        || (cronSecret && authHeader === `Bearer ${cronSecret}`)
    );
}

function normalizeLimit(value) {
    return Math.min(Math.max(Number(value || 20), 1), 100);
}

async function processQueuedSms(limit) {
    const { data: gateway, error: gatewayError } = await supabaseAdmin
        .from('sms_gateways')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (gatewayError) throw gatewayError;
    if (!gateway) {
        return { error: 'No active SMS gateway configured', status: 409 };
    }

    const { data: messages, error: messageError } = await supabaseAdmin
        .from('sms_messages')
        .select('*')
        .eq('status', 'queued')
        .order('queued_at', { ascending: true })
        .limit(limit);

    if (messageError) throw messageError;

    const results = [];
    for (const sms of messages || []) {
        const sent = await sendSmsViaGateway(gateway, sms);
        const updatePayload = sent.ok
            ? {
                status: 'sent',
                provider_message_id: sent.providerMessageId,
                error_message: null,
                sent_at: new Date().toISOString()
            }
            : {
                status: 'failed',
                error_message: sent.error || 'SMS provider failed'
            };

        const { error: updateError } = await supabaseAdmin
            .from('sms_messages')
            .update(updatePayload)
            .eq('id', sms.id);

        if (updateError) throw updateError;

        results.push({
            id: sms.id,
            status: updatePayload.status,
            providerMessageId: updatePayload.provider_message_id || null,
            error: updatePayload.error_message || null
        });
    }

    return {
        success: true,
        gateway: {
            id: gateway.id,
            name: gateway.name,
            provider: gateway.provider
        },
        processed: results.length,
        sent: results.filter((item) => item.status === 'sent').length,
        failed: results.filter((item) => item.status === 'failed').length,
        results
    };
}

export async function GET(request) {
    try {
        if (!canProcess(request)) {
            return NextResponse.json({ error: 'Unauthorized SMS worker' }, { status: 401 });
        }

        const url = new URL(request.url);
        const result = await processQueuedSms(normalizeLimit(url.searchParams.get('limit')));
        return NextResponse.json(result, { status: result.status || 200 });
    } catch (error) {
        console.error('SMS process failed:', error);
        return NextResponse.json({ error: error.message || 'SMS process failed' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        if (!canProcess(request)) {
            return NextResponse.json({ error: 'Unauthorized SMS worker' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const result = await processQueuedSms(normalizeLimit(body.limit));
        return NextResponse.json(result, { status: result.status || 200 });
    } catch (error) {
        console.error('SMS process failed:', error);
        return NextResponse.json({ error: error.message || 'SMS process failed' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { requireRequestProfile } from '@/lib/utils/server-auth';
import { sendSmsViaGateway } from '@/lib/services/smsProviderGateway';

function monthKey(dateValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
    const [year, month] = key.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('bn-BD', {
        month: 'short',
        year: '2-digit'
    });
}

function ownerLabel(ownerType, ownerId, locationMap, institutionMap) {
    const owner = ownerType === 'location' ? locationMap[ownerId] : institutionMap[ownerId];
    return owner?.name_bn || owner?.name || owner?.name_en || ownerId;
}

function ageHours(dateValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 0;
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
}

function parseGatewayConfig(value) {
    if (!value) return {};
    if (typeof value === 'object') return value;
    return JSON.parse(value);
}

function redactObject(value) {
    if (Array.isArray(value)) return value.map(redactObject);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => {
        if (/key|token|secret|password|authorization/i.test(key)) return [key, item ? '********' : ''];
        return [key, redactObject(item)];
    }));
}

function restoreRedactedValues(nextValue, currentValue) {
    if (Array.isArray(nextValue)) {
        return nextValue.map((item, index) => restoreRedactedValues(item, currentValue?.[index]));
    }
    if (!nextValue || typeof nextValue !== 'object') {
        return nextValue === '********' ? currentValue : nextValue;
    }
    return Object.fromEntries(Object.entries(nextValue).map(([key, item]) => [
        key,
        restoreRedactedValues(item, currentValue?.[key])
    ]));
}

function publicGateway(gateway) {
    if (!gateway) return gateway;
    const { api_key: apiKey, ...safe } = gateway;
    return {
        ...safe,
        config: redactObject(safe.config || {}),
        has_api_key: Boolean(apiKey)
    };
}

function normalizeBdPhone(value) {
    const rawPhone = String(value || '').replace(/[^\d+]/g, '');
    const phone = rawPhone.startsWith('+880')
        ? rawPhone
        : rawPhone.startsWith('880')
            ? `+${rawPhone}`
            : rawPhone.startsWith('01')
                ? `+88${rawPhone}`
                : rawPhone;
    return /^\+8801[3-9]\d{8}$/.test(phone) ? phone : null;
}

export async function GET(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin']);
        if (auth.response) return auth.response;

        const [
            { data: gateways, error: gatewayError },
            { data: packages, error: packageError },
            { data: wallets, error: walletError },
            { data: rechargeRequests, error: rechargeError },
            { data: messages, error: messageError },
            { data: transactions, error: transactionError },
            { data: deliveryAttempts, error: deliveryAttemptError },
            { data: deliveryWebhooks, error: deliveryWebhookError }
        ] = await Promise.all([
            supabaseAdmin.from('sms_gateways').select('*').order('created_at', { ascending: false }),
            supabaseAdmin.from('sms_packages').select('*').order('sort_order', { ascending: true }).order('credits', { ascending: true }),
            supabaseAdmin.from('sms_wallets').select('*').order('updated_at', { ascending: false }).limit(100),
            supabaseAdmin.from('sms_recharge_requests').select('*, package:sms_packages(name)').order('created_at', { ascending: false }).limit(100),
            supabaseAdmin.from('sms_messages').select('*').order('queued_at', { ascending: false }).limit(300),
            supabaseAdmin.from('sms_wallet_transactions').select('*').order('created_at', { ascending: false }).limit(300),
            supabaseAdmin.from('sms_delivery_attempts').select('*').order('created_at', { ascending: false }).limit(200),
            supabaseAdmin.from('sms_delivery_webhooks').select('*').order('received_at', { ascending: false }).limit(100)
        ]);

        if (gatewayError) throw gatewayError;
        if (packageError) throw packageError;
        if (walletError) throw walletError;
        if (rechargeError) throw rechargeError;
        if (messageError) throw messageError;
        if (transactionError) throw transactionError;
        if (deliveryAttemptError && !['42P01', 'PGRST205'].includes(deliveryAttemptError.code)) throw deliveryAttemptError;
        if (deliveryWebhookError && !['42P01', 'PGRST205'].includes(deliveryWebhookError.code)) throw deliveryWebhookError;

        const safeGateways = (gateways || []).map(publicGateway);
        const locationIds = [...new Set((wallets || []).filter((item) => item.owner_type === 'location').map((item) => item.owner_id))];
        const institutionIds = [...new Set((wallets || []).filter((item) => item.owner_type === 'institution').map((item) => item.owner_id))];

        const [{ data: locations }, { data: institutions }] = await Promise.all([
            locationIds.length
                ? supabaseAdmin.from('locations').select('id,name_bn,name_en,type').in('id', locationIds)
                : Promise.resolve({ data: [] }),
            institutionIds.length
                ? supabaseAdmin.from('institutions').select('id,name,type,category').in('id', institutionIds)
                : Promise.resolve({ data: [] })
        ]);

        const locationMap = Object.fromEntries((locations || []).map((item) => [item.id, item]));
        const institutionMap = Object.fromEntries((institutions || []).map((item) => [item.id, item]));
        const enrichedWallets = (wallets || []).map((wallet) => ({
            ...wallet,
            owner: wallet.owner_type === 'location'
                ? locationMap[wallet.owner_id] || null
                : institutionMap[wallet.owner_id] || null
        }));

        const messageList = messages || [];
        const rechargeList = rechargeRequests || [];
        const txList = transactions || [];
        const packageList = packages || [];
        const categoryStats = messageList.reduce((acc, item) => {
            const key = item.category || item.source_type || 'general';
            if (!acc[key]) acc[key] = { category: key, queued: 0, sent: 0, failed: 0, skipped: 0, total: 0 };
            acc[key][item.status] = (acc[key][item.status] || 0) + 1;
            acc[key].total += 1;
            return acc;
        }, {});
        const ownerStats = messageList.reduce((acc, item) => {
            const key = `${item.owner_type}:${item.owner_id}`;
            if (!acc[key]) {
                acc[key] = {
                    owner_type: item.owner_type,
                    owner_id: item.owner_id,
                    owner_name: ownerLabel(item.owner_type, item.owner_id, locationMap, institutionMap),
                    total: 0,
                    queued: 0,
                    sent: 0,
                    failed: 0
                };
            }
            acc[key].total += 1;
            acc[key][item.status] = (acc[key][item.status] || 0) + 1;
            return acc;
        }, {});
        const lowBalanceWallets = enrichedWallets.filter((wallet) => Number(wallet.balance || 0) <= Number(wallet.low_balance_threshold || 50));
        const approvedRechargeRevenue = rechargeList
            .filter((item) => item.status === 'approved')
            .reduce((sum, item) => sum + Number(item.payable_amount || 0), 0);
        const approvedRechargeCredits = rechargeList
            .filter((item) => item.status === 'approved')
            .reduce((sum, item) => sum + Number(item.requested_credits || 0), 0);
        const usedCredits = txList
            .filter((item) => item.transaction_type === 'usage')
            .reduce((sum, item) => sum + Math.abs(Number(item.credits || 0)), 0);
        const averageCreditPrice = approvedRechargeCredits > 0 ? approvedRechargeRevenue / approvedRechargeCredits : 0;

        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);
        const monthKeys = Array.from({ length: 6 }).map((_, index) => {
            const date = new Date(currentMonthStart);
            date.setMonth(currentMonthStart.getMonth() - (5 - index));
            return monthKey(date);
        });
        const monthlyReport = monthKeys.map((key) => {
            const approvedInMonth = rechargeList.filter((item) => item.status === 'approved' && monthKey(item.reviewed_at || item.created_at) === key);
            const usageInMonth = txList.filter((item) => item.transaction_type === 'usage' && monthKey(item.created_at) === key);
            const messagesInMonth = messageList.filter((item) => monthKey(item.queued_at || item.created_at) === key);
            return {
                key,
                label: monthLabel(key),
                revenue: approvedInMonth.reduce((sum, item) => sum + Number(item.payable_amount || 0), 0),
                purchasedCredits: approvedInMonth.reduce((sum, item) => sum + Number(item.requested_credits || 0), 0),
                usedCredits: usageInMonth.reduce((sum, item) => sum + Math.abs(Number(item.credits || 0)), 0),
                sent: messagesInMonth.filter((item) => item.status === 'sent').length,
                failed: messagesInMonth.filter((item) => item.status === 'failed').length,
                queued: messagesInMonth.filter((item) => item.status === 'queued').length
            };
        });

        const walletBusinessRows = enrichedWallets.map((wallet) => {
            const walletRecharge = rechargeList.filter((item) => item.owner_type === wallet.owner_type && item.owner_id === wallet.owner_id && item.status === 'approved');
            const walletUsage = txList.filter((item) => item.wallet_id === wallet.id && item.transaction_type === 'usage');
            const threshold = Number(wallet.low_balance_threshold || 50);
            const suggestedPackage = packageList
                .filter((item) => Number(item.credits || 0) >= Math.max(threshold * 4, 100))
                .sort((a, b) => Number(a.price || 0) - Number(b.price || 0))[0] || packageList[0] || null;
            return {
                ...wallet,
                owner_name: ownerLabel(wallet.owner_type, wallet.owner_id, locationMap, institutionMap),
                purchasedCredits: walletRecharge.reduce((sum, item) => sum + Number(item.requested_credits || 0), 0),
                revenue: walletRecharge.reduce((sum, item) => sum + Number(item.payable_amount || 0), 0),
                usedCredits: walletUsage.reduce((sum, item) => sum + Math.abs(Number(item.credits || 0)), 0),
                estimatedBalanceValue: Number(wallet.balance || 0) * averageCreditPrice,
                needsFollowup: Number(wallet.balance || 0) <= threshold,
                suggestedPackage: suggestedPackage ? {
                    name: suggestedPackage.name,
                    credits: suggestedPackage.credits,
                    price: suggestedPackage.price
                } : null
            };
        }).sort((a, b) => {
            if (a.needsFollowup !== b.needsFollowup) return a.needsFollowup ? -1 : 1;
            return Number(a.balance || 0) - Number(b.balance || 0);
        });

        const rechargeFunnel = {
            pending: rechargeList.filter((item) => item.status === 'pending').length,
            approved: rechargeList.filter((item) => item.status === 'approved').length,
            rejected: rechargeList.filter((item) => item.status === 'rejected').length,
            pendingRevenue: rechargeList
                .filter((item) => item.status === 'pending')
                .reduce((sum, item) => sum + Number(item.payable_amount || 0), 0)
        };
        const failedRate = messageList.length > 0
            ? Math.round((messageList.filter((item) => item.status === 'failed').length / messageList.length) * 100)
            : 0;
        const stalePendingRecharges = rechargeList
            .filter((item) => item.status === 'pending')
            .map((item) => ({ ...item, age_hours: ageHours(item.created_at) }))
            .filter((item) => item.age_hours >= 24);
        const activeGatewayCount = safeGateways.filter((gateway) => gateway.is_active).length;
        const latestMonth = monthlyReport[monthlyReport.length - 1] || {};
        const actionQueue = [
            ...stalePendingRecharges.slice(0, 5).map((item) => ({
                id: `stale-recharge-${item.id}`,
                type: 'pending_recharge',
                severity: item.age_hours >= 48 ? 'critical' : 'warning',
                title: 'Recharge approval আটকে আছে',
                message: `${ownerLabel(item.owner_type, item.owner_id, locationMap, institutionMap)} - ${Number(item.requested_credits || 0).toLocaleString('bn-BD')} SMS, ${item.age_hours} ঘণ্টা pending.`,
                amount: Number(item.payable_amount || 0),
                targetTab: 'recharge'
            })),
            ...walletBusinessRows.filter((wallet) => wallet.needsFollowup).slice(0, 6).map((wallet) => ({
                id: `low-balance-${wallet.id}`,
                type: 'low_balance',
                severity: Number(wallet.balance || 0) <= 0 ? 'critical' : 'warning',
                title: 'Low balance follow-up',
                message: `${wallet.owner_name} wallet-এ ${Number(wallet.balance || 0).toLocaleString('bn-BD')} SMS আছে। Suggested: ${wallet.suggestedPackage?.name || 'small package'}.`,
                amount: Number(wallet.suggestedPackage?.price || 0),
                targetTab: 'wallets'
            })),
            ...(failedRate >= 10 ? [{
                id: 'gateway-failed-rate',
                type: 'gateway_health',
                severity: failedRate >= 25 ? 'critical' : 'warning',
                title: 'Gateway health check দরকার',
                message: `Recent SMS failed rate ${failedRate}%। Active gateway: ${activeGatewayCount}. Provider/API status check করুন।`,
                amount: 0,
                targetTab: 'messages'
            }] : []),
            ...(activeGatewayCount === 0 ? [{
                id: 'no-active-gateway',
                type: 'gateway_missing',
                severity: 'critical',
                title: 'Active SMS gateway নেই',
                message: 'SMS business চালাতে অন্তত ১টি active gateway দরকার।',
                amount: 0,
                targetTab: 'gateway'
            }] : []),
            ...(Number(latestMonth.usedCredits || 0) > Number(latestMonth.purchasedCredits || 0) && Number(latestMonth.usedCredits || 0) > 0 ? [{
                id: 'usage-crossed-purchase',
                type: 'monthly_usage',
                severity: 'info',
                title: 'Usage purchase-এর চেয়ে বেশি',
                message: `${latestMonth.label || 'এই মাসে'} ${Number(latestMonth.usedCredits || 0).toLocaleString('bn-BD')} SMS used হয়েছে। Bigger package recommend করুন।`,
                amount: 0,
                targetTab: 'wallets'
            }] : [])
        ].sort((a, b) => {
            const order = { critical: 0, warning: 1, info: 2 };
            return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
        });

        const stats = {
            totalWallets: enrichedWallets.length,
            totalBalance: enrichedWallets.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0),
            pendingRecharge: rechargeList.filter((item) => item.status === 'pending').length,
            queuedMessages: messageList.filter((item) => item.status === 'queued').length,
            sentMessages: messageList.filter((item) => item.status === 'sent').length,
            deliveredMessages: messageList.filter((item) => item.status === 'delivered').length,
            failedMessages: messageList.filter((item) => item.status === 'failed').length,
            retryingMessages: messageList.filter((item) => item.status === 'queued' && Number(item.attempts || 0) > 0).length,
            totalQueuedWindow: messageList.length,
            approvedRechargeRevenue,
            approvedRechargeCredits,
            usedCredits,
            lowBalanceCount: lowBalanceWallets.length,
            averageCreditPrice,
            activeGatewayCount
        };

        return NextResponse.json({
            success: true,
            data: {
                gateways: safeGateways,
                packages: packageList,
                wallets: enrichedWallets,
                walletBusinessRows,
                rechargeRequests: rechargeRequests || [],
                messages: messageList.slice(0, 80),
                deliveryAttempts: deliveryAttempts || [],
                deliveryWebhooks: deliveryWebhooks || [],
                transactions: txList,
                lowBalanceWallets,
                categoryStats: Object.values(categoryStats).sort((a, b) => b.total - a.total),
                ownerStats: Object.values(ownerStats).sort((a, b) => b.total - a.total).slice(0, 12),
                monthlyReport,
                rechargeFunnel,
                actionQueue,
                stats
            }
        });
    } catch (error) {
        console.error('Admin SMS fetch failed:', error);
        return NextResponse.json({ error: error.message || 'SMS fetch failed' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin']);
        if (auth.response) return auth.response;

        const body = await request.json();
        const { action } = body;

        if (action === 'create_gateway') {
            let config = {};
            try {
                config = parseGatewayConfig(body.config || body.configText);
            } catch {
                return NextResponse.json({ error: 'Gateway config must be valid JSON' }, { status: 400 });
            }
            config.webhook_enabled = body.webhookEnabled !== false;

            const { data, error } = await supabaseAdmin
                .from('sms_gateways')
                .insert([{
                    name: body.name,
                    provider: body.provider,
                    sender_id: body.senderId || null,
                    api_base_url: body.apiBaseUrl || null,
                    api_key: body.apiKey || null,
                    is_active: Boolean(body.isActive),
                    config,
                    timeout_ms: Math.min(Math.max(Number(body.timeoutMs || 15000), 1000), 60000),
                    priority: Math.min(Math.max(Number(body.priority || 100), 1), 999),
                    webhook_enabled: body.webhookEnabled !== false
                }])
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, data: publicGateway(data) });
        }

        if (action === 'toggle_gateway') {
            if (!body.gatewayId) {
                return NextResponse.json({ error: 'gatewayId is required' }, { status: 400 });
            }

            const { data, error } = await supabaseAdmin
                .from('sms_gateways')
                .update({
                    is_active: Boolean(body.isActive),
                    ...(body.priority ? { priority: Math.min(Math.max(Number(body.priority), 1), 999) } : {}),
                    updated_at: new Date().toISOString()
                })
                .eq('id', body.gatewayId)
                .select()
                .single();
            if (error) throw error;
            return NextResponse.json({ success: true, data: publicGateway(data) });
        }

        if (action === 'update_gateway') {
            if (!body.gatewayId) {
                return NextResponse.json({ error: 'gatewayId is required' }, { status: 400 });
            }

            const { data: currentGateway, error: currentError } = await supabaseAdmin
                .from('sms_gateways')
                .select('*')
                .eq('id', body.gatewayId)
                .single();
            if (currentError) throw currentError;

            let nextConfig = {};
            try {
                nextConfig = parseGatewayConfig(body.config || body.configText);
            } catch {
                return NextResponse.json({ error: 'Gateway config must be valid JSON' }, { status: 400 });
            }
            nextConfig = restoreRedactedValues(nextConfig, parseGatewayConfig(currentGateway.config));
            nextConfig.webhook_enabled = body.webhookEnabled !== false;

            const { data, error } = await supabaseAdmin
                .from('sms_gateways')
                .update({
                    name: String(body.name || '').trim(),
                    provider: String(body.provider || '').trim(),
                    sender_id: body.senderId || null,
                    api_base_url: body.apiBaseUrl || null,
                    ...(body.apiKey ? { api_key: body.apiKey } : {}),
                    is_active: Boolean(body.isActive),
                    config: nextConfig,
                    timeout_ms: Math.min(Math.max(Number(body.timeoutMs || 15000), 1000), 60000),
                    priority: Math.min(Math.max(Number(body.priority || 100), 1), 999),
                    webhook_enabled: body.webhookEnabled !== false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', body.gatewayId)
                .select()
                .single();
            if (error) throw error;
            return NextResponse.json({ success: true, data: publicGateway(data) });
        }

        if (action === 'delete_gateway') {
            if (!body.gatewayId) {
                return NextResponse.json({ error: 'gatewayId is required' }, { status: 400 });
            }

            const [{ count: messageCount, error: messageCountError }, { count: attemptCount, error: attemptCountError }] = await Promise.all([
                supabaseAdmin.from('sms_messages').select('id', { count: 'exact', head: true }).eq('gateway_id', body.gatewayId),
                supabaseAdmin.from('sms_delivery_attempts').select('id', { count: 'exact', head: true }).eq('gateway_id', body.gatewayId)
            ]);
            if (messageCountError && !['42703', 'PGRST204'].includes(messageCountError.code)) throw messageCountError;
            if (attemptCountError && !['42P01', 'PGRST205'].includes(attemptCountError.code)) throw attemptCountError;
            if (Number(messageCount || 0) > 0 || Number(attemptCount || 0) > 0) {
                return NextResponse.json({
                    error: 'এই gateway-এর delivery history আছে। Audit data রাখতে gateway deactivate করুন।'
                }, { status: 409 });
            }

            const { error } = await supabaseAdmin
                .from('sms_gateways')
                .delete()
                .eq('id', body.gatewayId);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'test_gateway') {
            if (!body.gatewayId) {
                return NextResponse.json({ error: 'gatewayId is required' }, { status: 400 });
            }

            const phone = normalizeBdPhone(body.phone);
            if (!phone) {
                return NextResponse.json({ error: 'Valid Bangladesh mobile number is required' }, { status: 400 });
            }

            const { data: gateway, error: gatewayError } = await supabaseAdmin
                .from('sms_gateways')
                .select('*')
                .eq('id', body.gatewayId)
                .single();
            if (gatewayError) throw gatewayError;

            const result = await sendSmsViaGateway(gateway, {
                id: `gateway-test-${Date.now()}`,
                recipient_phone: phone,
                message: String(body.message || 'DigiGram SMS gateway test successful.').slice(0, 500)
            });
            const now = new Date().toISOString();
            await supabaseAdmin
                .from('sms_gateways')
                .update({
                    health_status: result.ok ? 'healthy' : 'down',
                    consecutive_failures: result.ok ? 0 : Number(gateway.consecutive_failures || 0) + 1,
                    last_success_at: result.ok ? now : gateway.last_success_at,
                    last_failure_at: result.ok ? gateway.last_failure_at : now,
                    last_error: result.ok ? null : String(result.error || 'Gateway test failed').slice(0, 2000),
                    updated_at: now
                })
                .eq('id', gateway.id);

            if (!result.ok) {
                return NextResponse.json({
                    error: result.error || 'Gateway test failed',
                    httpStatus: result.httpStatus || null
                }, { status: 502 });
            }

            return NextResponse.json({
                success: true,
                data: {
                    phone,
                    deliveryStatus: result.deliveryStatus,
                    providerMessageId: result.providerMessageId,
                    mocked: gateway.provider === 'mock'
                }
            });
        }

        if (action === 'quick_test_sms') {
            const phone = normalizeBdPhone(body.phone);
            if (!phone) {
                return NextResponse.json({ error: 'Valid Bangladesh mobile number is required' }, { status: 400 });
            }

            const message = String(body.message || '').trim() || 'DigiGram SMS quick test successful.';
            if (message.length > 500) {
                return NextResponse.json({ error: 'Message must be 500 characters or less' }, { status: 400 });
            }

            const { data: gateway, error: gatewayError } = await supabaseAdmin
                .from('sms_gateways')
                .select('*')
                .eq('is_active', true)
                .order('priority', { ascending: true })
                .limit(1)
                .maybeSingle();
            if (gatewayError) throw gatewayError;
            if (!gateway) {
                return NextResponse.json({ error: 'No active SMS gateway configured' }, { status: 409 });
            }

            const result = await sendSmsViaGateway(gateway, {
                id: `quick-test-${Date.now()}`,
                recipient_phone: phone,
                message
            });
            const now = new Date().toISOString();
            await supabaseAdmin
                .from('sms_gateways')
                .update({
                    health_status: result.ok ? 'healthy' : 'down',
                    consecutive_failures: result.ok ? 0 : Number(gateway.consecutive_failures || 0) + 1,
                    last_success_at: result.ok ? now : gateway.last_success_at,
                    last_failure_at: result.ok ? gateway.last_failure_at : now,
                    last_error: result.ok ? null : String(result.error || 'Quick SMS test failed').slice(0, 2000),
                    updated_at: now
                })
                .eq('id', gateway.id);

            if (!result.ok) {
                return NextResponse.json({
                    error: result.error || 'Quick SMS test failed',
                    httpStatus: result.httpStatus || null,
                    gateway: publicGateway(gateway)
                }, { status: 502 });
            }

            return NextResponse.json({
                success: true,
                data: {
                    phone,
                    gateway: publicGateway(gateway),
                    deliveryStatus: result.deliveryStatus,
                    providerMessageId: result.providerMessageId,
                    mocked: gateway.provider === 'mock'
                }
            });
        }

        if (action === 'retry_failed') {
            let query = supabaseAdmin
                .from('sms_messages')
                .update({
                    status: 'queued',
                    attempts: 0,
                    next_attempt_at: new Date().toISOString(),
                    locked_at: null,
                    locked_until: null,
                    locked_by: null,
                    error_message: null
                })
                .eq('status', 'failed');

            if (Array.isArray(body.messageIds) && body.messageIds.length > 0) {
                query = query.in('id', body.messageIds.slice(0, 100));
            }

            const { data, error } = await query.select('id');
            if (error) {
                if (['42703', 'PGRST204'].includes(error.code)) {
                    return NextResponse.json({
                        error: 'SMS retry migration is not installed. Run database/68_sms_delivery_monitoring.sql.'
                    }, { status: 409 });
                }
                throw error;
            }
            return NextResponse.json({ success: true, retried: data?.length || 0 });
        }

        if (action === 'create_package') {
            const { data, error } = await supabaseAdmin
                .from('sms_packages')
                .insert([{
                    name: body.name,
                    credits: Number(body.credits),
                    price: Number(body.price),
                    description: body.description || null,
                    validity_days: Number(body.validityDays || 365),
                    sort_order: Number(body.sortOrder || 0),
                    is_active: body.isActive !== false
                }])
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (action === 'update_package') {
            if (!body.packageId) {
                return NextResponse.json({ error: 'packageId is required' }, { status: 400 });
            }
            const { data, error } = await supabaseAdmin
                .from('sms_packages')
                .update({
                    name: String(body.name || '').trim(),
                    credits: Math.max(Number(body.credits || 0), 1),
                    price: Math.max(Number(body.price || 0), 0),
                    description: body.description || null,
                    validity_days: Math.max(Number(body.validityDays || 365), 1),
                    sort_order: Number(body.sortOrder || 0),
                    is_active: body.isActive !== false
                })
                .eq('id', body.packageId)
                .select()
                .single();
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (action === 'toggle_package') {
            if (!body.packageId) {
                return NextResponse.json({ error: 'packageId is required' }, { status: 400 });
            }
            const { data, error } = await supabaseAdmin
                .from('sms_packages')
                .update({ is_active: Boolean(body.isActive) })
                .eq('id', body.packageId)
                .select()
                .single();
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (action === 'delete_package') {
            if (!body.packageId) {
                return NextResponse.json({ error: 'packageId is required' }, { status: 400 });
            }
            const { count, error: countError } = await supabaseAdmin
                .from('sms_recharge_requests')
                .select('id', { count: 'exact', head: true })
                .eq('package_id', body.packageId);
            if (countError) throw countError;
            if (Number(count || 0) > 0) {
                return NextResponse.json({
                    error: 'এই package দিয়ে recharge হয়েছে। হিসাব ঠিক রাখতে package inactive করুন।'
                }, { status: 409 });
            }
            const { error } = await supabaseAdmin
                .from('sms_packages')
                .delete()
                .eq('id', body.packageId);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'approve_recharge' || action === 'reject_recharge') {
            const { data: recharge, error: rechargeError } = await supabaseAdmin
                .from('sms_recharge_requests')
                .select('*')
                .eq('id', body.rechargeId)
                .single();

            if (rechargeError) throw rechargeError;
            if (!recharge) return NextResponse.json({ error: 'Recharge request not found' }, { status: 404 });
            if (recharge.status !== 'pending') return NextResponse.json({ error: 'Recharge already reviewed' }, { status: 409 });

            if (action === 'reject_recharge') {
                const { data, error } = await supabaseAdmin
                    .from('sms_recharge_requests')
                    .update({
                        status: 'rejected',
                        reviewed_at: new Date().toISOString(),
                        note: body.note || recharge.note
                    })
                    .eq('id', recharge.id)
                    .select()
                    .single();
                if (error) throw error;
                return NextResponse.json({ success: true, data });
            }

            const { data: wallet, error: walletError } = await supabaseAdmin
                .from('sms_wallets')
                .upsert({
                    owner_type: recharge.owner_type,
                    owner_id: recharge.owner_id
                }, { onConflict: 'owner_type,owner_id' })
                .select()
                .single();
            if (walletError) throw walletError;

            const nextBalance = Number(wallet.balance || 0) + Number(recharge.requested_credits || 0);
            const { error: updateError } = await supabaseAdmin
                .from('sms_wallets')
                .update({ balance: nextBalance, updated_at: new Date().toISOString() })
                .eq('id', wallet.id);
            if (updateError) throw updateError;

            const { error: txError } = await supabaseAdmin
                .from('sms_wallet_transactions')
                .insert([{
                    wallet_id: wallet.id,
                    transaction_type: 'purchase',
                    credits: Number(recharge.requested_credits || 0),
                    reference_type: 'sms_recharge_request',
                    reference_id: recharge.id,
                    note: `Recharge approved: ${recharge.transaction_id || recharge.payment_method || 'manual'}`
                }]);
            if (txError) throw txError;

            const { data, error } = await supabaseAdmin
                .from('sms_recharge_requests')
                .update({
                    wallet_id: wallet.id,
                    status: 'approved',
                    reviewed_at: new Date().toISOString(),
                    note: body.note || recharge.note
                })
                .eq('id', recharge.id)
                .select()
                .single();
            if (error) throw error;

            return NextResponse.json({ success: true, data, balance: nextBalance });
        }

        if (action === 'adjust_wallet') {
            const credits = Number(body.credits || 0);
            if (!body.ownerType || !body.ownerId || !credits) {
                return NextResponse.json({ error: 'ownerType, ownerId and credits are required' }, { status: 400 });
            }

            const { data: wallet, error: walletError } = await supabaseAdmin
                .from('sms_wallets')
                .upsert({ owner_type: body.ownerType, owner_id: body.ownerId }, { onConflict: 'owner_type,owner_id' })
                .select()
                .single();
            if (walletError) throw walletError;

            const currentBalance = Number(wallet.balance || 0);
            const nextBalance = Math.max(0, currentBalance + credits);
            const appliedCredits = nextBalance - currentBalance;
            if (!appliedCredits) {
                return NextResponse.json({ error: 'Wallet balance unchanged' }, { status: 409 });
            }
            const { error: updateError } = await supabaseAdmin
                .from('sms_wallets')
                .update({ balance: nextBalance, updated_at: new Date().toISOString() })
                .eq('id', wallet.id);
            if (updateError) throw updateError;

            const { error: transactionError } = await supabaseAdmin.from('sms_wallet_transactions').insert([{
                wallet_id: wallet.id,
                transaction_type: 'adjustment',
                credits: appliedCredits,
                note: body.note || 'Manual admin adjustment'
            }]);
            if (transactionError) {
                await supabaseAdmin
                    .from('sms_wallets')
                    .update({ balance: currentBalance, updated_at: new Date().toISOString() })
                    .eq('id', wallet.id);
                throw transactionError;
            }

            return NextResponse.json({
                success: true,
                data: { ...wallet, balance: nextBalance },
                appliedCredits
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Admin SMS mutation failed:', error);
        return NextResponse.json({ error: error.message || 'SMS mutation failed' }, { status: 500 });
    }
}

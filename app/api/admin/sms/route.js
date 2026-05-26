import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

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

export async function GET() {
    try {
        const [
            { data: gateways, error: gatewayError },
            { data: packages, error: packageError },
            { data: wallets, error: walletError },
            { data: rechargeRequests, error: rechargeError },
            { data: messages, error: messageError },
            { data: transactions, error: transactionError }
        ] = await Promise.all([
            supabaseAdmin.from('sms_gateways').select('*').order('created_at', { ascending: false }),
            supabaseAdmin.from('sms_packages').select('*').order('sort_order', { ascending: true }).order('credits', { ascending: true }),
            supabaseAdmin.from('sms_wallets').select('*').order('updated_at', { ascending: false }).limit(100),
            supabaseAdmin.from('sms_recharge_requests').select('*, package:sms_packages(name)').order('created_at', { ascending: false }).limit(100),
            supabaseAdmin.from('sms_messages').select('*').order('queued_at', { ascending: false }).limit(300),
            supabaseAdmin.from('sms_wallet_transactions').select('*').order('created_at', { ascending: false }).limit(300)
        ]);

        if (gatewayError) throw gatewayError;
        if (packageError) throw packageError;
        if (walletError) throw walletError;
        if (rechargeError) throw rechargeError;
        if (messageError) throw messageError;
        if (transactionError) throw transactionError;

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
        const activeGatewayCount = (gateways || []).filter((gateway) => gateway.is_active).length;
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
            failedMessages: messageList.filter((item) => item.status === 'failed').length,
            totalQueuedWindow: messageList.length,
            approvedRechargeRevenue,
            approvedRechargeCredits,
            usedCredits,
            lowBalanceCount: lowBalanceWallets.length,
            averageCreditPrice
        };

        return NextResponse.json({
            success: true,
            data: {
                gateways: gateways || [],
                packages: packageList,
                wallets: enrichedWallets,
                walletBusinessRows,
                rechargeRequests: rechargeRequests || [],
                messages: messageList.slice(0, 80),
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
        const body = await request.json();
        const { action } = body;

        if (action === 'create_gateway') {
            const { data, error } = await supabaseAdmin
                .from('sms_gateways')
                .insert([{
                    name: body.name,
                    provider: body.provider,
                    sender_id: body.senderId || null,
                    api_base_url: body.apiBaseUrl || null,
                    api_key: body.apiKey || null,
                    is_active: Boolean(body.isActive)
                }])
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
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

            const nextBalance = Math.max(0, Number(wallet.balance || 0) + credits);
            const { error: updateError } = await supabaseAdmin
                .from('sms_wallets')
                .update({ balance: nextBalance, updated_at: new Date().toISOString() })
                .eq('id', wallet.id);
            if (updateError) throw updateError;

            await supabaseAdmin.from('sms_wallet_transactions').insert([{
                wallet_id: wallet.id,
                transaction_type: 'adjustment',
                credits,
                note: body.note || 'Manual admin adjustment'
            }]);

            return NextResponse.json({ success: true, data: { ...wallet, balance: nextBalance } });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Admin SMS mutation failed:', error);
        return NextResponse.json({ error: error.message || 'SMS mutation failed' }, { status: 500 });
    }
}

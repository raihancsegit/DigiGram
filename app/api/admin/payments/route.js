import { NextResponse } from 'next/server';
import { requireRequestProfile } from '@/lib/utils/server-auth';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export const dynamic = 'force-dynamic';

function isMissingPaymentSchema(error) {
    return ['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error?.code);
}

export async function GET(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin']);
        if (auth.response) return auth.response;

        const [{ data: transactions, error: transactionError }, { data: gateways, error: gatewayError }] = await Promise.all([
            supabaseAdmin.from('payment_transactions').select('*').order('created_at', { ascending: false }).limit(200),
            supabaseAdmin.from('payment_gateways').select('*').order('display_name')
        ]);
        if (transactionError) throw transactionError;
        if (gatewayError) throw gatewayError;

        const rows = transactions || [];
        return NextResponse.json({
            success: true,
            data: {
                transactions: rows,
                gateways: gateways || [],
                stats: {
                    pending: rows.filter((item) => item.status === 'pending').length,
                    verified: rows.filter((item) => item.status === 'verified').length,
                    rejected: rows.filter((item) => item.status === 'rejected').length,
                    verifiedRevenue: rows
                        .filter((item) => item.status === 'verified')
                        .reduce((sum, item) => sum + Number(item.amount || 0), 0)
                }
            }
        });
    } catch (error) {
        console.error('Admin payments fetch failed:', error);
        if (isMissingPaymentSchema(error)) {
            return NextResponse.json({
                error: 'Payment database setup বাকি',
                setupRequired: true,
                migration: 'database/64_unified_payment_center.sql'
            }, { status: 503 });
        }
        return NextResponse.json({ error: error.message || 'Payment overview failed' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin']);
        if (auth.response) return auth.response;
        const body = await request.json();

        if (body.action === 'review') {
            if (!body.paymentId || !['approve', 'reject'].includes(body.decision)) {
                return NextResponse.json({ error: 'Payment and review decision are required' }, { status: 400 });
            }

            if (body.decision === 'approve') {
                const { data, error } = await supabaseAdmin.rpc('approve_payment_transaction', {
                    target_payment_id: body.paymentId,
                    reviewer_id: auth.profile.id,
                    reviewer_note: body.note || null
                });
                if (error) throw error;
                return NextResponse.json({ success: true, data });
            }

            const { data, error } = await supabaseAdmin
                .from('payment_transactions')
                .update({
                    status: 'rejected',
                    reviewed_by: auth.profile.id,
                    reviewed_at: new Date().toISOString(),
                    review_note: body.note || 'Rejected by admin',
                    updated_at: new Date().toISOString()
                })
                .eq('id', body.paymentId)
                .eq('status', 'pending')
                .select()
                .maybeSingle();
            if (error) throw error;
            if (!data) return NextResponse.json({ error: 'Payment already reviewed or not found' }, { status: 409 });
            return NextResponse.json({ success: true, data });
        }

        if (body.action === 'gateway') {
            const provider = String(body.provider || '').trim().toLowerCase();
            if (!provider || !body.displayName) {
                return NextResponse.json({ error: 'Provider and display name are required' }, { status: 400 });
            }
            const { data, error } = await supabaseAdmin
                .from('payment_gateways')
                .upsert({
                    provider,
                    display_name: body.displayName,
                    account_number: body.accountNumber || null,
                    instructions: body.instructions || null,
                    is_active: Boolean(body.isActive),
                    test_mode: Boolean(body.testMode),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'provider' })
                .select()
                .single();
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        return NextResponse.json({ error: 'Unsupported payment action' }, { status: 400 });
    } catch (error) {
        console.error('Admin payment action failed:', error);
        if (isMissingPaymentSchema(error)) {
            return NextResponse.json({
                error: 'Payment database setup বাকি',
                setupRequired: true,
                migration: 'database/64_unified_payment_center.sql'
            }, { status: 503 });
        }
        return NextResponse.json({ error: error.message || 'Payment action failed' }, { status: 500 });
    }
}

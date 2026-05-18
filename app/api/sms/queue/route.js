import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export async function POST(request) {
    try {
        const body = await request.json();
        const { ownerType, ownerId, recipientPhone, message, category, sourceType, sourceId } = body;

        if (!ownerType || !ownerId || !recipientPhone || !message || !category) {
            return NextResponse.json({ error: 'Missing SMS queue fields' }, { status: 400 });
        }

        const { data: wallet, error: walletError } = await supabaseAdmin
            .from('sms_wallets')
            .upsert({
                owner_type: ownerType,
                owner_id: ownerId
            }, { onConflict: 'owner_type,owner_id' })
            .select()
            .single();

        if (walletError) throw walletError;

        if (Number(wallet.balance || 0) < 1) {
            return NextResponse.json({ error: 'SMS balance is empty' }, { status: 409 });
        }

        const { data: sms, error: smsError } = await supabaseAdmin
            .from('sms_messages')
            .insert([{
                wallet_id: wallet.id,
                owner_type: ownerType,
                owner_id: ownerId,
                recipient_phone: recipientPhone,
                message,
                category,
                source_type: sourceType || null,
                source_id: sourceId || null
            }])
            .select()
            .single();

        if (smsError) throw smsError;

        const nextBalance = Number(wallet.balance || 0) - 1;
        const { error: updateError } = await supabaseAdmin
            .from('sms_wallets')
            .update({ balance: nextBalance, updated_at: new Date().toISOString() })
            .eq('id', wallet.id);

        if (updateError) throw updateError;

        const { error: transactionError } = await supabaseAdmin
            .from('sms_wallet_transactions')
            .insert([{
                wallet_id: wallet.id,
                transaction_type: 'usage',
                credits: -1,
                reference_type: sourceType || null,
                reference_id: sourceId || null,
                note: category
            }]);

        if (transactionError) throw transactionError;
        return NextResponse.json({ success: true, data: sms, remainingBalance: nextBalance });
    } catch (error) {
        console.error('SMS queue failed:', error);
        return NextResponse.json({ error: error.message || 'SMS queue failed' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export async function POST(request) {
    try {
        const body = await request.json();
        const { ownerType, ownerId, packageId, transactionId, payerPhone, paymentMethod = 'manual', note } = body;

        if (!ownerType || !ownerId || !packageId) {
            return NextResponse.json({ error: 'ownerType, ownerId and packageId are required' }, { status: 400 });
        }

        const { data: smsPackage, error: packageError } = await supabaseAdmin
            .from('sms_packages')
            .select('*')
            .eq('id', packageId)
            .eq('is_active', true)
            .single();

        if (packageError) throw packageError;
        if (!smsPackage) return NextResponse.json({ error: 'SMS package not found' }, { status: 404 });

        const { data: wallet, error: walletError } = await supabaseAdmin
            .from('sms_wallets')
            .upsert({ owner_type: ownerType, owner_id: ownerId }, { onConflict: 'owner_type,owner_id' })
            .select()
            .single();
        if (walletError) throw walletError;

        const { data, error } = await supabaseAdmin
            .from('sms_recharge_requests')
            .insert([{
                wallet_id: wallet.id,
                owner_type: ownerType,
                owner_id: ownerId,
                package_id: smsPackage.id,
                requested_credits: Number(smsPackage.credits || 0),
                payable_amount: Number(smsPackage.price || 0),
                payment_method: paymentMethod,
                transaction_id: transactionId || null,
                payer_phone: payerPhone || null,
                note: note || null
            }])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('SMS recharge request failed:', error);
        return NextResponse.json({ error: error.message || 'SMS recharge request failed' }, { status: 500 });
    }
}

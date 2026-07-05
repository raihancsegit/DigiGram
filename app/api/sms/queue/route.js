import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { canAccessLocation, canManageInstitution, requireRequestProfile } from '@/lib/utils/server-auth';

async function canManageOwner(profile, ownerType, ownerId) {
    if (ownerType === 'institution') {
        if (await canManageInstitution(profile, ownerId)) return true;
        const { data: membership } = await supabaseAdmin
            .from('institution_memberships')
            .select('id')
            .eq('institution_id', ownerId)
            .eq('profile_id', profile.id)
            .eq('is_active', true)
            .in('member_role', ['admin', 'teacher'])
            .maybeSingle();
        return Boolean(membership);
    }
    if (ownerType === 'location') return canAccessLocation(profile, ownerId);
    return false;
}

export async function POST(request) {
    try {
        const auth = await requireRequestProfile(request);
        if (auth.response) return auth.response;

        const body = await request.json();
        const { ownerType, ownerId, recipientPhone, message, category, sourceType, sourceId } = body;

        if (!ownerType || !ownerId || !recipientPhone || !message || !category) {
            return NextResponse.json({ error: 'Missing SMS queue fields' }, { status: 400 });
        }
        if (!(await canManageOwner(auth.profile, ownerType, ownerId))) {
            return NextResponse.json({ error: 'You cannot send SMS from this account' }, { status: 403 });
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

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { canAccessLocation, canManageInstitution, requireRequestProfile } from '@/lib/utils/server-auth';

export async function GET(request) {
    try {
        const auth = await requireRequestProfile(request);
        if (auth.response) return auth.response;

        const { searchParams } = new URL(request.url);
        const ownerType = searchParams.get('ownerType');
        const ownerId = searchParams.get('ownerId');

        if (!ownerType || !ownerId) {
            return NextResponse.json({ error: 'ownerType and ownerId are required' }, { status: 400 });
        }
        const allowed = ownerType === 'institution'
            ? await canManageInstitution(auth.profile, ownerId)
            : ownerType === 'location' && await canAccessLocation(auth.profile, ownerId);
        if (!allowed) {
            return NextResponse.json({ error: 'You cannot access this SMS wallet' }, { status: 403 });
        }

        const { data: wallet, error: walletError } = await supabaseAdmin
            .from('sms_wallets')
            .upsert({ owner_type: ownerType, owner_id: ownerId }, { onConflict: 'owner_type,owner_id' })
            .select()
            .single();
        if (walletError) throw walletError;

        const [{ data: packages }, { data: recharges }, { data: messages }, { data: transactions }, { data: templates }, { data: campaigns }] = await Promise.all([
            supabaseAdmin.from('sms_packages').select('*').eq('is_active', true).order('sort_order', { ascending: true }).order('credits', { ascending: true }),
            supabaseAdmin.from('sms_recharge_requests').select('*, package:sms_packages(name)').eq('owner_type', ownerType).eq('owner_id', ownerId).order('created_at', { ascending: false }).limit(20),
            supabaseAdmin.from('sms_messages').select('*').eq('owner_type', ownerType).eq('owner_id', ownerId).order('queued_at', { ascending: false }).limit(30),
            supabaseAdmin.from('sms_wallet_transactions').select('*').eq('wallet_id', wallet.id).order('created_at', { ascending: false }).limit(30),
            supabaseAdmin
                .from('sms_templates')
                .select('*')
                .eq('is_active', true)
                .or(`owner_type.eq.global,and(owner_type.eq.${ownerType},owner_id.eq.${ownerId})`)
                .order('created_at', { ascending: true }),
            supabaseAdmin
                .from('sms_campaigns')
                .select('*')
                .eq('owner_type', ownerType)
                .eq('owner_id', ownerId)
                .order('created_at', { ascending: false })
                .limit(20)
        ]);

        return NextResponse.json({
            success: true,
            data: {
                wallet,
                packages: packages || [],
                rechargeRequests: recharges || [],
                messages: messages || [],
                transactions: transactions || [],
                templates: templates || [],
                campaigns: campaigns || []
            }
        });
    } catch (error) {
        console.error('SMS wallet fetch failed:', error);
        return NextResponse.json({ error: error.message || 'SMS wallet fetch failed' }, { status: 500 });
    }
}

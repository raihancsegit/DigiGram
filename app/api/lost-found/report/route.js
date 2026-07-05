import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { verifyCitizenOtp } from '@/lib/utils/citizen-otp';

function normalizePhone(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

async function getUnionHouseholdPhones(locationId) {
    const { data: wards } = await supabaseAdmin
        .from('locations')
        .select('id')
        .eq('parent_id', locationId);

    const wardIds = (wards || []).map((item) => item.id);
    if (wardIds.length === 0) return [];

    const { data: households, error } = await supabaseAdmin
        .from('households')
        .select('phone')
        .in('ward_id', wardIds)
        .not('phone', 'is', null)
        .limit(1000);

    if (error) throw error;
    return [...new Set((households || []).map((item) => normalizePhone(item.phone)).filter((phone) => /^01[0-9]{9}$/.test(phone)))];
}

async function queueLostFoundBlast({ post, locationId, phone }) {
    const { data: wallet, error: walletError } = await supabaseAdmin
        .from('sms_wallets')
        .upsert({ owner_type: 'location', owner_id: locationId }, { onConflict: 'owner_type,owner_id' })
        .select()
        .single();

    if (walletError) throw walletError;

    const recipients = await getUnionHouseholdPhones(locationId);
    const sendLimit = Math.min(Number(wallet.balance || 0), 500);
    const sendable = recipients.slice(0, sendLimit);

    if (sendable.length === 0) {
        await supabaseAdmin.from('lost_found_sms_blasts').insert([{
            post_id: post.id,
            location_id: locationId,
            wallet_id: wallet.id,
            requested_by_phone: phone,
            recipient_count: 0,
            status: 'skipped_no_wallet'
        }]);
        await supabaseAdmin
            .from('lost_found_posts')
            .update({ sms_blast_status: 'skipped_no_wallet', sms_blast_count: 0 })
            .eq('id', post.id);
        return { status: 'skipped_no_wallet', count: 0 };
    }

    const typeLabel = post.type === 'lost' ? 'হারানো' : 'প্রাপ্তি';
    const message = `${typeLabel}: ${post.title}. এলাকা: ${post.location || 'আপনার ইউনিয়ন'}। যোগাযোগ: ${post.contact_phone}. DigiGram হারানো-প্রাপ্তি।`;
    const rows = sendable.map((recipientPhone) => ({
        wallet_id: wallet.id,
        owner_type: 'location',
        owner_id: locationId,
        recipient_phone: recipientPhone,
        message,
        category: 'lost_found_blast',
        source_type: 'lost_found_posts',
        source_id: post.id
    }));

    const { error: smsError } = await supabaseAdmin.from('sms_messages').insert(rows);
    if (smsError) throw smsError;

    const nextBalance = Number(wallet.balance || 0) - sendable.length;
    await supabaseAdmin
        .from('sms_wallets')
        .update({ balance: nextBalance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id);

    await supabaseAdmin.from('sms_wallet_transactions').insert([{
        wallet_id: wallet.id,
        transaction_type: 'usage',
        credits: -sendable.length,
        reference_type: 'lost_found_posts',
        reference_id: post.id,
        note: 'lost_found_sms_blast'
    }]);

    await supabaseAdmin.from('lost_found_sms_blasts').insert([{
        post_id: post.id,
        location_id: locationId,
        wallet_id: wallet.id,
        requested_by_phone: phone,
        recipient_count: sendable.length,
        status: 'queued'
    }]);

    await supabaseAdmin
        .from('lost_found_posts')
        .update({ sms_blast_status: 'queued', sms_blast_count: sendable.length })
        .eq('id', post.id);

    return { status: 'queued', count: sendable.length };
}

export async function POST(request) {
    try {
        const body = await request.json();
        const phone = normalizePhone(body.contact_phone || body.reporterPhone);
        const otpCode = body.otpCode;

        if (!/^01[0-9]{9}$/.test(phone)) {
            return NextResponse.json({ error: 'Valid mobile number is required' }, { status: 400 });
        }

        const isVerified = await verifyCitizenOtp(phone, otpCode, 'lost_found_report');
        if (!isVerified) {
            return NextResponse.json({ error: 'OTP মিলছে না বা মেয়াদ শেষ হয়েছে' }, { status: 401 });
        }

        if (!body.location_id || !body.title || !body.category || !body.contact_name) {
            return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
        }

        const insertPayload = {
            location_id: body.location_id,
            type: body.type === 'found' ? 'found' : 'lost',
            category: body.category,
            title: body.title,
            description: body.description || '',
            location: body.location || '',
            event_date: body.event_date || '',
            contact_name: body.contact_name,
            contact_phone: phone,
            status: 'active',
            image_url: body.image_url || '',
            reward_amount: body.reward_amount || '',
            gd_number: body.gd_number || '',
            last_seen_area: body.last_seen_area || '',
            is_global: Boolean(body.is_global),
            phone_verified: true,
            verified_at: new Date().toISOString(),
            reporter_phone: phone,
            reporter_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
            sms_blast_requested: Boolean(body.smsBlast)
        };

        const { data: post, error } = await supabaseAdmin
            .from('lost_found_posts')
            .insert([insertPayload])
            .select()
            .single();

        if (error) throw error;

        let blast = null;
        if (body.smsBlast) {
            blast = await queueLostFoundBlast({ post, locationId: body.location_id, phone });
        }

        return NextResponse.json({ success: true, data: post, blast });
    } catch (error) {
        console.error('Lost found report failed:', error);
        return NextResponse.json({ error: error.message || 'Lost found report failed' }, { status: 500 });
    }
}

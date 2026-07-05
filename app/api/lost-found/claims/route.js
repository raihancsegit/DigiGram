import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { verifyCitizenOtp } from '@/lib/utils/citizen-otp';

function normalizePhone(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

async function queueClaimStatusSms({ claim, status, note }) {
    const { data: wallet } = await supabaseAdmin
        .from('sms_wallets')
        .upsert({ owner_type: 'location', owner_id: claim.location_id }, { onConflict: 'owner_type,owner_id' })
        .select()
        .single();

    if (!wallet || Number(wallet.balance || 0) < 1) return { queued: false };

    const statusText = status === 'approved' ? 'অনুমোদিত হয়েছে' : 'বাতিল হয়েছে';
    const message = `হারানো-প্রাপ্তি claim ${statusText}। ${note ? `নোট: ${note}` : ''} DigiGram`;

    const { data: sms, error } = await supabaseAdmin.from('sms_messages').insert([{
        wallet_id: wallet.id,
        owner_type: 'location',
        owner_id: claim.location_id,
        recipient_phone: claim.claimant_phone,
        message,
        category: 'lost_found_claim',
        source_type: 'lost_found_claims',
        source_id: claim.id
    }]).select().single();
    if (error) throw error;

    await supabaseAdmin
        .from('sms_wallets')
        .update({ balance: Number(wallet.balance || 0) - 1, updated_at: new Date().toISOString() })
        .eq('id', wallet.id);

    await supabaseAdmin.from('sms_wallet_transactions').insert([{
        wallet_id: wallet.id,
        transaction_type: 'usage',
        credits: -1,
        reference_type: 'lost_found_claims',
        reference_id: claim.id,
        note: 'lost_found_claim_status'
    }]);

    return { queued: true, sms };
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const locationId = searchParams.get('locationId');
        const postId = searchParams.get('postId');

        let query = supabaseAdmin
            .from('lost_found_claims')
            .select('*, post:lost_found_posts(id,title,type,status,contact_phone)')
            .order('created_at', { ascending: false })
            .limit(100);

        if (locationId) query = query.eq('location_id', locationId);
        if (postId) query = query.eq('post_id', postId);

        const { data, error } = await query;
        if (error) throw error;
        return NextResponse.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Lost found claims fetch failed:', error);
        return NextResponse.json({ error: error.message || 'Lost found claims fetch failed' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const phone = normalizePhone(body.claimantPhone);

        if (!/^01[0-9]{9}$/.test(phone)) {
            return NextResponse.json({ error: 'Valid mobile number is required' }, { status: 400 });
        }
        if (!body.postId || !body.claimantName || !body.proofNote) {
            return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
        }

        const verified = await verifyCitizenOtp(phone, body.otpCode, 'lost_found_claim');
        if (!verified) {
            return NextResponse.json({ error: 'OTP মিলছে না বা মেয়াদ শেষ হয়েছে' }, { status: 401 });
        }

        const { data: post, error: postError } = await supabaseAdmin
            .from('lost_found_posts')
            .select('id, location_id')
            .eq('id', body.postId)
            .maybeSingle();
        if (postError) throw postError;
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

        const { data: claim, error } = await supabaseAdmin
            .from('lost_found_claims')
            .insert([{
                post_id: body.postId,
                location_id: post.location_id,
                claimant_name: body.claimantName,
                claimant_phone: phone,
                proof_note: body.proofNote,
                proof_image_url: body.proofImageUrl || '',
                phone_verified: true
            }])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, data: claim });
    } catch (error) {
        console.error('Lost found claim create failed:', error);
        return NextResponse.json({ error: error.message || 'Lost found claim create failed' }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const body = await request.json();
        const status = body.status === 'approved' ? 'approved' : body.status === 'rejected' ? 'rejected' : null;
        if (!body.claimId || !status) {
            return NextResponse.json({ error: 'Claim and status are required' }, { status: 400 });
        }

        const { data: claim, error: claimError } = await supabaseAdmin
            .from('lost_found_claims')
            .select('*')
            .eq('id', body.claimId)
            .maybeSingle();
        if (claimError) throw claimError;
        if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });

        const { data: updated, error } = await supabaseAdmin
            .from('lost_found_claims')
            .update({
                status,
                officer_note: body.officerNote || '',
                reviewed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', body.claimId)
            .select()
            .single();
        if (error) throw error;

        if (status === 'approved') {
            await supabaseAdmin
                .from('lost_found_posts')
                .update({ status: 'resolved', updated_at: new Date().toISOString() })
                .eq('id', claim.post_id);
        }

        const sms = await queueClaimStatusSms({ claim: updated, status, note: body.officerNote || '' });
        return NextResponse.json({ success: true, data: updated, sms });
    } catch (error) {
        console.error('Lost found claim update failed:', error);
        return NextResponse.json({ error: error.message || 'Lost found claim update failed' }, { status: 500 });
    }
}

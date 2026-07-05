import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const STATUS_COPY = {
    submitted: 'আপনার আবেদন গ্রহণ করা হয়েছে। বর্তমানে এটি অপেক্ষমাণ অবস্থায় আছে।',
    processing: 'আপনার আবেদনটি বর্তমানে প্রক্রিয়াধীন আছে।',
    ready: 'আপনার আবেদন প্রস্তুত। ইউনিয়ন পরিষদে এসে সংগ্রহ করুন।',
    rejected: 'আপনার আবেদনটি বাতিল করা হয়েছে। বিস্তারিত জানতে ইউনিয়ন পরিষদে যোগাযোগ করুন।',
    completed: 'আপনার আবেদন সম্পন্ন হয়েছে। ধন্যবাদ।'
};

const REQUEST_LABELS = {
    birth_registration: 'জন্ম নিবন্ধন আবেদন',
    death_certificate: 'মৃত্যু সনদ আবেদন',
    warish_certificate: 'ওয়ারিশ সনদ আবেদন',
    utility_request: 'ইউটিলিটি সেবা আবেদন'
};

export async function POST(request) {
    try {
        const { requestId, eventKey } = await request.json();
        if (!requestId || !eventKey || !STATUS_COPY[eventKey]) {
            return NextResponse.json({ error: 'Valid requestId and eventKey are required' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: serviceRequest, error } = await supabaseAdmin
            .from('service_requests')
            .select(`
                id,
                request_type,
                applicant_name,
                contact_phone,
                collection_date,
                household:households(
                    ward:locations(parent_id)
                )
            `)
            .eq('id', requestId)
            .maybeSingle();

        if (error) throw error;
        if (!serviceRequest) return NextResponse.json({ error: 'Service request not found' }, { status: 404 });

        if (!serviceRequest.contact_phone) {
            return NextResponse.json({ success: true, skipped: true, message: 'No phone number found' });
        }

        const collectionText = eventKey === 'ready' && serviceRequest.collection_date
            ? ` সংগ্রহের তারিখ: ${serviceRequest.collection_date}.`
            : '';
        const requestLabel = REQUEST_LABELS[serviceRequest.request_type] || 'সেবা আবেদন';
        const message = `DigiGram: ${requestLabel} - ${serviceRequest.applicant_name || 'নাগরিক'}, ${STATUS_COPY[eventKey]}${collectionText}`;

        const { data: existingQueued } = await supabaseAdmin
            .from('service_request_sms')
            .select('id')
            .eq('service_request_id', requestId)
            .eq('event_key', eventKey)
            .maybeSingle();

        if (!existingQueued) {
            let queueStatus = 'queued';
            let queueError = null;
            const unionId = serviceRequest.household?.ward?.parent_id;

            if (unionId) {
                const { data: wallet } = await supabaseAdmin
                    .from('sms_wallets')
                    .upsert({ owner_type: 'location', owner_id: unionId }, { onConflict: 'owner_type,owner_id' })
                    .select()
                    .single();

                if (!wallet || Number(wallet.balance || 0) < 1) {
                    queueStatus = 'skipped';
                    queueError = 'SMS balance is empty';
                } else {
                    const nextBalance = Number(wallet.balance || 0) - 1;
                    const { data: smsMessage, error: paidQueueError } = await supabaseAdmin
                        .from('sms_messages')
                        .insert([{
                            wallet_id: wallet.id,
                            owner_type: 'location',
                            owner_id: unionId,
                            recipient_phone: serviceRequest.contact_phone,
                            message,
                            category: `service_${eventKey}`,
                            source_type: 'service_request',
                            source_id: serviceRequest.id
                        }])
                        .select()
                        .single();

                    if (paidQueueError) throw paidQueueError;

                    const { error: walletUpdateError } = await supabaseAdmin
                        .from('sms_wallets')
                        .update({ balance: nextBalance, updated_at: new Date().toISOString() })
                        .eq('id', wallet.id);
                    if (walletUpdateError) throw walletUpdateError;

                    const { error: txError } = await supabaseAdmin
                        .from('sms_wallet_transactions')
                        .insert([{
                            wallet_id: wallet.id,
                            transaction_type: 'usage',
                            credits: -1,
                            reference_type: 'sms_messages',
                            reference_id: smsMessage.id,
                            note: `Service request ${eventKey}`
                        }]);
                    if (txError) throw txError;
                }
            } else {
                queueStatus = 'skipped';
                queueError = 'Union wallet not found for request';
            }

            const { error: smsError } = await supabaseAdmin
                .from('service_request_sms')
                .insert([{
                    service_request_id: requestId,
                    phone: serviceRequest.contact_phone,
                    event_key: eventKey,
                    message,
                    status: queueStatus,
                    error_message: queueError
                }]);

            if (smsError) throw smsError;
        }

        return NextResponse.json({ success: true, message });
    } catch (err) {
        console.error('Service request notify error:', err);
        return NextResponse.json({ error: err.message || 'Notification queue failed' }, { status: 500 });
    }
}

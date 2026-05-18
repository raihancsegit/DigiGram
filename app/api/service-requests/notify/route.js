import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const STATUS_COPY = {
    submitted: 'আপনার আবেদন গ্রহণ করা হয়েছে। বর্তমানে এটি অপেক্ষমাণ অবস্থায় আছে।',
    processing: 'আপনার আবেদনটি বর্তমানে প্রক্রিয়াধীন আছে।',
    ready: 'আপনার আবেদন প্রস্তুত। ইউনিয়ন পরিষদে এসে সংগ্রহ করুন।',
    rejected: 'আপনার আবেদনটি বাতিল করা হয়েছে। বিস্তারিত জানতে ইউনিয়ন পরিষদে যোগাযোগ করুন।',
    completed: 'আপনার আবেদন সম্পন্ন হয়েছে। ধন্যবাদ।'
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
            .select('id, applicant_name, contact_phone, collection_date')
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
        const message = `DigiGram: ${serviceRequest.applicant_name || 'নাগরিক'}, ${STATUS_COPY[eventKey]}${collectionText}`;

        const { data: existingQueued } = await supabaseAdmin
            .from('service_request_sms')
            .select('id')
            .eq('service_request_id', requestId)
            .eq('event_key', eventKey)
            .maybeSingle();

        if (!existingQueued) {
            const { error: smsError } = await supabaseAdmin
                .from('service_request_sms')
                .insert([{
                    service_request_id: requestId,
                    phone: serviceRequest.contact_phone,
                    event_key: eventKey,
                    message
                }]);

            if (smsError) throw smsError;
        }

        return NextResponse.json({ success: true, message });
    } catch (err) {
        console.error('Service request notify error:', err);
        return NextResponse.json({ error: err.message || 'Notification queue failed' }, { status: 500 });
    }
}

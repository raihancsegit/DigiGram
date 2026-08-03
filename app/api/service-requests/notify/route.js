import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

const STATUS_COPY = {
    submitted: 'আপনার আবেদন গ্রহণ করা হয়েছে। এটি এখন সংশ্লিষ্ট ইউনিয়নে অপেক্ষমাণ আছে।',
    processing: 'আপনার আবেদনটি বর্তমানে ইউনিয়ন পরিষদে প্রক্রিয়াধীন আছে।',
    ready: 'আপনার আবেদন প্রস্তুত। ইউনিয়ন পরিষদ থেকে সংগ্রহ করুন।',
    rejected: 'আপনার আবেদনটি গ্রহণ করা যায়নি। বিস্তারিত জানতে ইউনিয়ন পরিষদে যোগাযোগ করুন।',
    completed: 'আপনার আবেদন সম্পন্ন হয়েছে। ধন্যবাদ।'
};

const REQUEST_LABELS = {
    birth_registration: 'জন্ম নিবন্ধন', death_certificate: 'মৃত্যু সনদ', warish_certificate: 'ওয়ারিশ সনদ',
    benefit_support: 'ভাতা সহায়তা', local_problem: 'এলাকার অভিযোগ', emergency_support: 'জরুরি সহায়তা',
    document_update: 'নথি সহায়তা', farmer_support: 'কৃষক সহায়তা', job_training: 'কাজ ও প্রশিক্ষণ',
    health_support: 'স্বাস্থ্য সহায়তা', education_support: 'শিক্ষা সহায়তা', fee_support: 'ফি সহায়তা'
};

export async function POST(request) {
    try {
        const { requestId, eventKey } = await request.json();
        if (!requestId || !STATUS_COPY[eventKey]) return NextResponse.json({ error: 'সঠিক আবেদন ও স্ট্যাটাস প্রয়োজন' }, { status: 400 });
        const { data: item, error } = await supabaseAdmin.from('service_requests')
            .select('id,request_type,applicant_name,contact_phone,collection_date,routed_union_id,service_setting:union_service_settings(sms_enabled),household:households(ward:locations(parent_id))')
            .eq('id', requestId).maybeSingle();
        if (error) throw error;
        if (!item) return NextResponse.json({ error: 'আবেদন পাওয়া যায়নি' }, { status: 404 });
        if (!item.contact_phone || item.service_setting?.sms_enabled === false) return NextResponse.json({ success: true, skipped: true });

        const collection = eventKey === 'ready' && item.collection_date ? ` সংগ্রহের তারিখ: ${item.collection_date}।` : '';
        const message = `DigiGram: ${REQUEST_LABELS[item.request_type] || 'সেবা আবেদন'} - ${item.applicant_name || 'নাগরিক'}, ${STATUS_COPY[eventKey]}${collection}`;
        const { data: queued } = await supabaseAdmin.from('service_request_sms').select('id').eq('service_request_id', requestId).eq('event_key', eventKey).maybeSingle();
        if (queued) return NextResponse.json({ success: true, message });

        const unionId = item.routed_union_id || item.household?.ward?.parent_id;
        let status = 'queued'; let errorMessage = null;
        if (!unionId) { status = 'skipped'; errorMessage = 'Union not found'; }
        else {
            const { data: wallet } = await supabaseAdmin.from('sms_wallets').upsert({ owner_type: 'location', owner_id: unionId }, { onConflict: 'owner_type,owner_id' }).select().single();
            if (!wallet || Number(wallet.balance || 0) < 1) { status = 'skipped'; errorMessage = 'SMS balance is empty'; }
            else {
                const { data: sms, error: smsError } = await supabaseAdmin.from('sms_messages').insert({ wallet_id: wallet.id, owner_type: 'location', owner_id: unionId, recipient_phone: item.contact_phone, message, category: `service_${eventKey}`, source_type: 'service_request', source_id: item.id }).select().single();
                if (smsError) throw smsError;
                await supabaseAdmin.from('sms_wallets').update({ balance: Number(wallet.balance) - 1, updated_at: new Date().toISOString() }).eq('id', wallet.id);
                await supabaseAdmin.from('sms_wallet_transactions').insert({ wallet_id: wallet.id, transaction_type: 'usage', credits: -1, reference_type: 'sms_messages', reference_id: sms.id, note: `Service request ${eventKey}` });
            }
        }
        const { error: queueError } = await supabaseAdmin.from('service_request_sms').insert({ service_request_id: requestId, phone: item.contact_phone, event_key: eventKey, message, status, error_message: errorMessage });
        if (queueError) throw queueError;
        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error('Service request notify error:', error);
        return NextResponse.json({ error: error.message || 'SMS queue failed' }, { status: 500 });
    }
}

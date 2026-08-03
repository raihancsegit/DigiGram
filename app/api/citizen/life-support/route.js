import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { internalServerError } from '@/lib/utils/api-response';
import {
    readJsonObject,
    validateMetadata,
    validateOptionalNumber,
    validateTextFields
} from '@/lib/utils/request-validation';

const VALID_TYPES = new Set(['document', 'benefit', 'health', 'problem', 'job', 'farmer', 'trust_feedback']);
const VALID_PRIORITY = new Set(['low', 'normal', 'urgent', 'emergency']);

const SUBMIT_MESSAGE = {
    document: 'DigiGram: আপনার document readiness help request গ্রহণ করা হয়েছে। Officer review করলে SMS/Inbox update পাবেন।',
    benefit: 'DigiGram: আপনার ভাতা/সহায়তা eligibility request গ্রহণ করা হয়েছে। যাচাই শেষে update পাবেন।',
    health: 'DigiGram: আপনার health/checkup request গ্রহণ করা হয়েছে। Camp/schedule update SMS/Inbox-এ পাবেন।',
    problem: 'DigiGram: আপনার village problem report গ্রহণ করা হয়েছে। দায়িত্বপ্রাপ্ত officer review করবেন।',
    job: 'DigiGram: আপনার local jobs/skills request গ্রহণ করা হয়েছে। Match/update হলে জানানো হবে।',
    farmer: 'DigiGram: আপনার farmer support request গ্রহণ করা হয়েছে। কৃষি/বাজার সহায়তা update পাবেন।',
    trust_feedback: 'DigiGram: আপনার feedback গ্রহণ করা হয়েছে। ধন্যবাদ।'
};

function normalizePhone(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

async function resolveUnionId(scopeType, scopeId) {
    if (!scopeId) return null;
    if (scopeType === 'union') return scopeId;

    const { data: scope } = await supabaseAdmin
        .from('locations')
        .select('id,type,parent_id,parent:parent_id(id,type,parent_id)')
        .eq('id', scopeId)
        .maybeSingle();

    if (!scope) return null;
    if (scope.type === 'union') return scope.id;
    if (scope.type === 'ward') return scope.parent_id;
    if (scope.type === 'village') return scope.parent?.parent_id || null;
    return null;
}

async function queueLifeSupportSms({ row, unionId, message, category }) {
    if (!row?.phone || !unionId) return { queued: false, reason: 'missing_phone_or_union' };

    const { data: wallet, error: walletError } = await supabaseAdmin
        .from('sms_wallets')
        .upsert({ owner_type: 'location', owner_id: unionId }, { onConflict: 'owner_type,owner_id' })
        .select()
        .single();
    if (walletError) throw walletError;

    if (!wallet || Number(wallet.balance || 0) < 1) {
        return { queued: false, reason: 'empty_wallet' };
    }

    const { data: smsMessage, error: smsError } = await supabaseAdmin
        .from('sms_messages')
        .insert([{
            wallet_id: wallet.id,
            owner_type: 'location',
            owner_id: unionId,
            recipient_phone: row.phone,
            message,
            category,
            source_type: 'citizen_life_support_case',
            source_id: row.id
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
            reference_type: 'sms_messages',
            reference_id: smsMessage.id,
            note: category
        }]);
    if (transactionError) throw transactionError;

    return { queued: true, remainingBalance: nextBalance };
}

export async function POST(request) {
    try {
        const parsed = await readJsonObject(request);
        if (parsed.error) {
            return NextResponse.json({ error: parsed.error }, { status: parsed.status });
        }
        const body = parsed.data;
        const phone = normalizePhone(body.phone);
        const validation = validateTextFields(body, {
            citizenName: { label: 'Citizen name', maxLength: 120 },
            caseType: { label: 'Service type', required: true, allowed: VALID_TYPES },
            category: { label: 'Category', maxLength: 120 },
            title: { label: 'Title', required: true, maxLength: 160 },
            description: { label: 'Description', maxLength: 3000 },
            locationText: { label: 'Location', maxLength: 300 },
            scopeType: { label: 'Scope type', maxLength: 16, allowed: new Set(['union', 'ward', 'village']) },
            scopeId: { label: 'Scope ID', maxLength: 80 },
            priority: { label: 'Priority', allowed: VALID_PRIORITY, defaultValue: 'normal' }
        });
        const latitude = validateOptionalNumber(body.latitude, { field: 'Latitude', minimum: -90, maximum: 90 });
        const longitude = validateOptionalNumber(body.longitude, { field: 'Longitude', minimum: -180, maximum: 180 });
        const metadata = validateMetadata(body.metaData);
        if (!/^01[0-9]{9}$/.test(phone)) validation.errors.phone = ['A valid Bangladeshi mobile number is required'];
        if (latitude.error) validation.errors.latitude = [latitude.error];
        if (longitude.error) validation.errors.longitude = [longitude.error];
        if (metadata.error) validation.errors.metaData = [metadata.error];
        validation.valid = Object.keys(validation.errors).length === 0;
        if (!validation.valid) {
            return NextResponse.json({
                error: 'Please correct the highlighted information',
                errors: validation.errors
            }, { status: 400 });
        }

        const {
            citizenName,
            caseType,
            category,
            title,
            description,
            locationText,
            scopeType,
            scopeId,
            priority
        } = validation.values;

        const { data, error } = await supabaseAdmin
            .from('citizen_life_support_cases')
            .insert([{
                phone,
                citizen_name: citizenName,
                case_type: caseType,
                category,
                title,
                description,
                location_text: locationText,
                latitude: latitude.value,
                longitude: longitude.value,
                assigned_scope_type: scopeType,
                assigned_scope_id: scopeId,
                priority,
                meta_data: metadata.value
            }])
            .select()
            .single();
        if (error) throw error;

        const message = SUBMIT_MESSAGE[caseType] || 'DigiGram: আপনার request গ্রহণ করা হয়েছে।';
        await supabaseAdmin
            .from('citizen_reminders')
            .insert([{
                phone,
                reminder_type: `${caseType}_status`,
                title: `Request গ্রহণ: ${data.title}`,
                body: message,
                source_type: 'citizen_life_support_case',
                source_id: data.id,
                status: 'pending'
            }]);

        const unionId = await resolveUnionId(scopeType, scopeId);
        const sms = await queueLifeSupportSms({
            row: data,
            unionId,
            message,
            category: `${caseType}_submitted`
        });

        return NextResponse.json({ success: true, data, sms });
    } catch (error) {
        console.error('Citizen life support submit failed:', error);
        return internalServerError('Life support submission failed. Please try again.');
    }
}

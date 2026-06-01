import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

function normalizePhone(phone) {
    if (!phone) return '';
    const digits = String(phone).replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    if (digits.startsWith('01') && digits.length === 11) return digits;
    return digits;
}

function personalize(message, recipient) {
    return String(message || '')
        .replaceAll('{name}', recipient.name || 'নাগরিক')
        .replaceAll('{phone}', recipient.phone || '');
}

function dedupeRecipients(rows) {
    const seen = new Set();
    return rows
        .map((item) => ({ ...item, phone: normalizePhone(item.phone) }))
        .filter((item) => {
            if (!item.phone || seen.has(item.phone)) return false;
            seen.add(item.phone);
            return true;
        });
}

async function getLocationScope(ownerId) {
    const { data } = await supabaseAdmin
        .from('locations')
        .select('id,type,parent_id')
        .eq('id', ownerId)
        .maybeSingle();

    if (data?.type === 'village') return 'village';
    return data?.type === 'ward' ? 'ward' : 'union';
}

function applyHouseholdScope(query, ownerId, scope, relation = 'household') {
    if (scope === 'village') {
        return relation ? query.eq(`${relation}.location_village_id`, ownerId) : query.eq('location_village_id', ownerId);
    }
    if (scope === 'ward') {
        return relation ? query.eq(`${relation}.ward_id`, ownerId) : query.eq('ward_id', ownerId);
    }
    return relation ? query.eq(`${relation}.ward.parent_id`, ownerId) : query.eq('ward.parent_id', ownerId);
}

async function getLocationRecipients(ownerId, targetType) {
    const scope = await getLocationScope(ownerId);

    if (targetType === 'service_applicants') {
        const query = supabaseAdmin
            .from('service_requests')
            .select('id, applicant_name, contact_phone, household:households!inner(ward_id, location_village_id, ward:locations!inner(parent_id))')
            .not('contact_phone', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1000);
        const { data, error } = await applyHouseholdScope(query, ownerId, scope);
        if (error) throw error;
        return dedupeRecipients((data || []).map((item) => ({
            id: item.id,
            phone: item.contact_phone,
            name: item.applicant_name
        })));
    }

    if (targetType === 'service_ready' || targetType === 'service_processing') {
        const statuses = targetType === 'service_ready' ? ['ready'] : ['pending', 'processing'];
        const query = supabaseAdmin
            .from('service_requests')
            .select('id, applicant_name, contact_phone, status, household:households!inner(ward_id, location_village_id, ward:locations!inner(parent_id))')
            .in('status', statuses)
            .not('contact_phone', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1500);
        const { data, error } = await applyHouseholdScope(query, ownerId, scope);
        if (error) throw error;
        return dedupeRecipients((data || []).map((item) => ({
            id: item.id,
            phone: item.contact_phone,
            name: item.applicant_name
        })));
    }

    if (targetType === 'tax_due') {
        const query = supabaseAdmin
            .from('household_taxes')
            .select('id, status, household:households!inner(owner_name, phone, ward_id, location_village_id, ward:locations!inner(parent_id))')
            .in('status', ['due', 'partial', 'pending'])
            .order('created_at', { ascending: false })
            .limit(1500);
        const { data, error } = await applyHouseholdScope(query, ownerId, scope);
        if (error) throw error;
        return dedupeRecipients((data || []).map((item) => ({
            id: item.id,
            phone: item.household?.phone,
            name: item.household?.owner_name
        })));
    }

    if (['missing_nid', 'missing_birth', 'benefit_candidates', 'women_support', 'widow_support', 'maternity_support', 'health_checkup', 'low_completeness', 'emergency_broadcast'].includes(targetType)) {
        const query = supabaseAdmin
            .from('residents')
            .select('id, name, dob, gender, nid, birth_reg_no, blood_group, marital_status, disability_status, occupation, household:households!inner(owner_name, phone, ward_id, location_village_id, ward:locations!inner(parent_id))')
            .limit(4000);
        const { data, error } = await applyHouseholdScope(query, ownerId, scope);
        if (error) throw error;

        return dedupeRecipients((data || [])
            .filter((resident) => {
                const age = getAge(resident.dob);
                if (targetType === 'missing_nid') return age !== null && age >= 18 && !resident.nid;
                if (targetType === 'missing_birth') return !resident.birth_reg_no;
                if (targetType === 'benefit_candidates') return isBenefitCandidate(resident, age);
                if (targetType === 'emergency_broadcast') return true;
                if (targetType === 'health_checkup') return isHealthCheckupCandidate(resident, age);
                if (targetType === 'low_completeness') return isLowCompletenessResident(resident);
                if (targetType === 'widow_support') return isWidowCandidate(resident);
                if (targetType === 'maternity_support') return isFemale(resident) && age !== null && age >= 13 && age <= 49;
                if (targetType === 'women_support') return isWomenSupportCandidate(resident, age);
                return false;
            })
            .map((resident) => ({
                id: resident.id,
                phone: resident.household?.phone,
                name: resident.name || resident.household?.owner_name
            })));
    }

    const query = supabaseAdmin
        .from('households')
        .select('id, owner_name, phone, ward_id, location_village_id, ward:locations!inner(parent_id)')
        .not('phone', 'is', null)
        .order('created_at', { ascending: false })
        .limit(2000);
    const { data, error } = await applyHouseholdScope(query, ownerId, scope, null);
    if (error) throw error;
    return dedupeRecipients((data || []).map((item) => ({
        id: item.id,
        phone: item.phone,
        name: item.owner_name
    })));
}

function getAge(dob) {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
    return age;
}

function isBenefitCandidate(resident, age) {
    const gender = String(resident.gender || '').toLowerCase();
    const disability = String(resident.disability_status || '').toLowerCase();
    const marital = String(resident.marital_status || '').toLowerCase();
    const occupation = String(resident.occupation || '').toLowerCase();
    const female = ['female', 'নারী', 'মহিলা'].includes(gender);
    const elderly = age !== null && ((female && age >= 62) || (!female && age >= 65));
    const disabled = disability && !['none', 'no', 'না', 'নেই', 'n/a'].includes(disability);
    const widow = female && (marital.includes('widow') || marital.includes('বিধবা'));
    const student = age !== null && age >= 5 && age <= 24 && (occupation.includes('student') || occupation.includes('ছাত্র') || occupation.includes('শিক্ষার্থী'));
    return elderly || disabled || widow || student;
}

function isFemale(resident = {}) {
    const gender = String(resident.gender || '').toLowerCase();
    return ['female', 'woman', 'নারী', 'মহিলা', 'মেয়ে', 'মেয়ে'].includes(gender);
}

function isWidowCandidate(resident = {}) {
    const marital = String(resident.marital_status || '').toLowerCase();
    return isFemale(resident) && (marital.includes('widow') || marital.includes('বিধবা'));
}

function isDisabledResident(resident = {}) {
    const disability = String(resident.disability_status || '').toLowerCase();
    return Boolean(disability) && !['none', 'no', 'না', 'নেই', 'n/a', 'na'].includes(disability);
}

function isHealthCheckupCandidate(resident = {}, age) {
    return !resident.blood_group
        || isDisabledResident(resident)
        || (age !== null && (age <= 5 || age >= 60));
}

function isLowCompletenessResident(resident = {}) {
    const missingCount = Number(!resident.nid) + Number(!resident.birth_reg_no) + Number(!resident.blood_group);
    return missingCount >= 2;
}

function isWomenSupportCandidate(resident = {}, age) {
    return isFemale(resident) && (
        isWidowCandidate(resident)
        || !resident.blood_group
        || (age !== null && age >= 13 && age <= 49)
    );
}

async function getInstitutionRecipients(ownerId) {
    const { data, error } = await supabaseAdmin
        .from('school_students')
        .select('id, student_name, guardian_name, guardian_phone')
        .eq('institution_id', ownerId)
        .eq('active', true)
        .not('guardian_phone', 'is', null)
        .order('student_name', { ascending: true })
        .limit(2000);
    if (error) throw error;
    return dedupeRecipients((data || []).map((item) => ({
        id: item.id,
        phone: item.guardian_phone,
        name: item.guardian_name || item.student_name
    })));
}

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            ownerType,
            ownerId,
            targetType = 'all_households',
            templateId,
            title,
            message,
            category = 'campaign',
            targetOwnerId = ownerId
        } = body;

        if (!ownerType || !ownerId || !message) {
            return NextResponse.json({ error: 'ownerType, ownerId and message are required' }, { status: 400 });
        }

        const recipients = ownerType === 'institution'
            ? await getInstitutionRecipients(ownerId)
            : await getLocationRecipients(targetOwnerId, targetType);

        if (recipients.length === 0) {
            return NextResponse.json({ error: 'No valid recipients found for this target' }, { status: 400 });
        }

        const { data: wallet, error: walletError } = await supabaseAdmin
            .from('sms_wallets')
            .upsert({ owner_type: ownerType, owner_id: ownerId }, { onConflict: 'owner_type,owner_id' })
            .select()
            .single();
        if (walletError) throw walletError;

        if (Number(wallet.balance || 0) < recipients.length) {
            return NextResponse.json({
                error: `SMS balance কম। দরকার ${recipients.length}, আছে ${wallet.balance || 0}`,
                required: recipients.length,
                balance: wallet.balance || 0
            }, { status: 409 });
        }

        const { data: campaign, error: campaignError } = await supabaseAdmin
            .from('sms_campaigns')
            .insert([{
                wallet_id: wallet.id,
                owner_type: ownerType,
                owner_id: ownerId,
                template_id: templateId || null,
                title: title || 'SMS Campaign',
                target_type: targetType,
                message,
                recipient_count: recipients.length,
                status: 'queued'
            }])
            .select()
            .single();
        if (campaignError) throw campaignError;

        const rows = recipients.map((recipient) => ({
            wallet_id: wallet.id,
            owner_type: ownerType,
            owner_id: ownerId,
            recipient_phone: recipient.phone,
            message: personalize(message, recipient),
            category,
            source_type: 'sms_campaign',
            source_id: campaign.id,
            campaign_id: campaign.id
        }));

        const { error: messageError } = await supabaseAdmin.from('sms_messages').insert(rows);
        if (messageError) throw messageError;

        const nextBalance = Number(wallet.balance || 0) - recipients.length;
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
                credits: -recipients.length,
                reference_type: 'sms_campaigns',
                reference_id: campaign.id,
                note: title || targetType
            }]);
        if (txError) throw txError;

        return NextResponse.json({
            success: true,
            data: campaign,
            recipientCount: recipients.length,
            remainingBalance: nextBalance
        });
    } catch (error) {
        console.error('SMS campaign failed:', error);
        return NextResponse.json({ error: error.message || 'SMS campaign failed' }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const ownerType = searchParams.get('ownerType');
        const ownerId = searchParams.get('ownerId');
        const targetOwnerId = searchParams.get('targetOwnerId') || ownerId;
        const targetType = searchParams.get('targetType') || 'all_households';

        if (!ownerType || !ownerId) {
            return NextResponse.json({ error: 'ownerType and ownerId are required' }, { status: 400 });
        }

        const recipients = ownerType === 'institution'
            ? await getInstitutionRecipients(ownerId)
            : await getLocationRecipients(targetOwnerId, targetType);

        return NextResponse.json({
            success: true,
            data: {
                targetType,
                targetOwnerId,
                recipientCount: recipients.length,
                estimatedCredits: recipients.length,
                sample: recipients.slice(0, 5)
            }
        });
    } catch (error) {
        console.error('SMS campaign preview failed:', error);
        return NextResponse.json({ error: error.message || 'SMS campaign preview failed' }, { status: 500 });
    }
}

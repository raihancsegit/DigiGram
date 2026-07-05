import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import {
    createCitizenAccessToken,
    normalizeCitizenPhone,
    verifyCitizenAccessToken,
    verifyCitizenOtp
} from '@/lib/utils/citizen-otp';

export const dynamic = 'force-dynamic';

function isMissingPaymentSchema(error) {
    return ['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error?.code);
}

async function requireCitizen(request) {
    const body = await request.json();
    const phone = normalizeCitizenPhone(body.phone);
    const hasSession = verifyCitizenAccessToken(phone, body.accessToken);
    const verified = hasSession || await verifyCitizenOtp(phone, body.otpCode);
    if (!verified) {
        return {
            body,
            phone,
            response: NextResponse.json({ error: 'OTP ভুল অথবা মেয়াদ শেষ হয়েছে' }, { status: 401 })
        };
    }
    return {
        body,
        phone,
        accessToken: hasSession ? body.accessToken : createCitizenAccessToken(phone),
        response: null
    };
}

async function loadOverview(phone) {
    const { data: households, error: householdError } = await supabaseAdmin
        .from('households')
        .select('id,owner_name,house_no')
        .eq('phone', phone);
    if (householdError) throw householdError;

    const householdIds = (households || []).map((item) => item.id);
    const [{ data: taxes, error: taxError }, { data: services, error: serviceError }] = await Promise.all([
        householdIds.length
            ? supabaseAdmin
                .from('household_taxes')
                .select('id,household_id,fiscal_year_label,year,amount_due,amount_paid,due_date,status')
                .in('household_id', householdIds)
                .neq('status', 'paid')
                .order('created_at', { ascending: false })
            : Promise.resolve({ data: [], error: null }),
        supabaseAdmin
            .from('service_requests')
            .select('id,request_type,applicant_name,fee_amount,amount_paid,payment_status,status,created_at')
            .eq('contact_phone', phone)
            .gt('fee_amount', 0)
            .neq('payment_status', 'paid')
            .order('created_at', { ascending: false })
    ]);
    if (taxError) throw taxError;
    if (serviceError && !['42703', 'PGRST204'].includes(serviceError.code)) throw serviceError;

    const { data: transactions, error: transactionError } = await supabaseAdmin
        .from('payment_transactions')
        .select('*')
        .eq('payer_phone', phone)
        .order('created_at', { ascending: false })
        .limit(30);
    if (transactionError) throw transactionError;

    const { data: gateways, error: gatewayError } = await supabaseAdmin
        .from('payment_gateways')
        .select('provider,display_name,account_number,instructions,test_mode')
        .eq('is_active', true)
        .order('display_name');
    if (gatewayError) throw gatewayError;

    const householdMap = Object.fromEntries((households || []).map((item) => [item.id, item]));
    return {
        gateways: gateways || [],
        taxes: (taxes || []).map((item) => ({
            ...item,
            household: householdMap[item.household_id] || null,
            outstanding: Math.max(0, Number(item.amount_due || 0) - Number(item.amount_paid || 0))
        })),
        services: serviceError ? [] : (services || []).map((item) => ({
            ...item,
            outstanding: Math.max(0, Number(item.fee_amount || 0) - Number(item.amount_paid || 0))
        })),
        transactions: transactions || []
    };
}

export async function POST(request) {
    try {
        const auth = await requireCitizen(request);
        if (auth.response) return auth.response;
        const { body, phone } = auth;

        if (body.action === 'overview') {
            return NextResponse.json({
                success: true,
                data: await loadOverview(phone),
                accessToken: auth.accessToken
            });
        }

        if (body.action !== 'submit') {
            return NextResponse.json({ error: 'Unsupported payment action' }, { status: 400 });
        }

        const referenceType = body.referenceType;
        const referenceId = body.referenceId;
        const amount = Number(body.amount || 0);
        const provider = String(body.provider || '').trim();
        const providerTransactionId = String(body.providerTransactionId || '').trim();

        if (!['household_tax', 'service_request'].includes(referenceType) || !referenceId || amount <= 0 || !provider) {
            return NextResponse.json({ error: 'Payment reference, provider and valid amount are required' }, { status: 400 });
        }

        const { data: gateway } = await supabaseAdmin
            .from('payment_gateways')
            .select('provider')
            .eq('provider', provider)
            .eq('is_active', true)
            .maybeSingle();
        if (!gateway) return NextResponse.json({ error: 'Payment method is not active' }, { status: 400 });

        let outstanding = 0;
        let payerName = body.payerName || null;
        let description = '';

        if (referenceType === 'household_tax') {
            const { data: tax } = await supabaseAdmin
                .from('household_taxes')
                .select('id,amount_due,amount_paid,fiscal_year_label,household:households!inner(phone,owner_name,house_no)')
                .eq('id', referenceId)
                .eq('household.phone', phone)
                .maybeSingle();
            if (!tax) return NextResponse.json({ error: 'Tax record does not belong to this phone' }, { status: 403 });
            outstanding = Math.max(0, Number(tax.amount_due || 0) - Number(tax.amount_paid || 0));
            payerName = payerName || tax.household?.owner_name;
            description = `${tax.fiscal_year_label || 'Holding tax'} · ${tax.household?.house_no || ''}`.trim();
        } else {
            const { data: service } = await supabaseAdmin
                .from('service_requests')
                .select('id,request_type,applicant_name,fee_amount,amount_paid')
                .eq('id', referenceId)
                .eq('contact_phone', phone)
                .maybeSingle();
            if (!service) return NextResponse.json({ error: 'Service request does not belong to this phone' }, { status: 403 });
            outstanding = Math.max(0, Number(service.fee_amount || 0) - Number(service.amount_paid || 0));
            payerName = payerName || service.applicant_name;
            description = service.request_type || 'Service fee';
        }

        if (outstanding <= 0 || amount > outstanding) {
            return NextResponse.json({ error: `Payable amount সর্বোচ্চ ৳${outstanding}` }, { status: 400 });
        }

        const { data: pending } = await supabaseAdmin
            .from('payment_transactions')
            .select('id,payment_no')
            .eq('payer_phone', phone)
            .eq('reference_type', referenceType)
            .eq('reference_id', referenceId)
            .eq('status', 'pending')
            .maybeSingle();
        if (pending) {
            return NextResponse.json({ error: `এই bill-এর payment ${pending.payment_no} review-তে আছে` }, { status: 409 });
        }

        const { data, error } = await supabaseAdmin
            .from('payment_transactions')
            .insert([{
                payer_phone: phone,
                payer_name: payerName,
                amount,
                provider,
                provider_transaction_id: providerTransactionId || null,
                reference_type: referenceType,
                reference_id: referenceId,
                description
            }])
            .select()
            .single();
        if (error) throw error;

        return NextResponse.json({ success: true, data, accessToken: auth.accessToken });
    } catch (error) {
        console.error('Citizen payment failed:', error);
        if (isMissingPaymentSchema(error)) {
            return NextResponse.json({
                error: 'Payment database setup বাকি',
                setupRequired: true,
                migration: 'database/64_unified_payment_center.sql'
            }, { status: 503 });
        }
        return NextResponse.json({ error: error.message || 'Payment request failed' }, { status: 500 });
    }
}

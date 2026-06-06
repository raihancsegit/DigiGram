import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { recordDataAccess } from '@/lib/utils/data-access-log';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const lookup = searchParams.get('lookup');
        const pin = searchParams.get('pin');

        if (!lookup || !pin) {
            return NextResponse.json({ error: 'Missing household lookup or locker PIN' }, { status: 400 });
        }

        const { data: isValidPin, error: pinError } = await supabaseAdmin.rpc('verify_household_locker_pin', {
            lookup_value: lookup,
            candidate_pin: pin
        });

        if (pinError) throw pinError;
        if (!isValidPin) {
            return NextResponse.json({ error: 'Invalid locker PIN' }, { status: 403 });
        }

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lookup);
        let householdQuery = supabaseAdmin.from('households').select('id,phone');
        householdQuery = isUuid
            ? householdQuery.eq('id', lookup)
            : householdQuery.eq('qr_code_id', lookup);
        const { data: household, error: householdError } = await householdQuery.single();

        if (householdError) throw householdError;

        const { data: docs, error: docsError } = await supabaseAdmin
            .from('household_documents')
            .select('*')
            .eq('household_id', household.id)
            .order('created_at', { ascending: false });

        if (docsError) throw docsError;

        const signedDocs = await Promise.all((docs || []).map(async (doc) => {
            if (!doc.file_path) {
                return {
                    ...doc,
                    file_url: null,
                    needs_migration: true
                };
            }

            const { data } = await supabaseAdmin.storage
                .from('household_documents')
                .createSignedUrl(doc.file_path, 60 * 10);

            return {
                ...doc,
                file_url: data?.signedUrl || null,
                needs_migration: false
            };
        }));

        await recordDataAccess({
            request,
            citizenPhone: household.phone || null,
            householdId: household.id,
            resourceType: 'household_locker',
            resourceId: household.id,
            action: 'documents_viewed',
            metadata: { document_count: signedDocs.length }
        });

        return NextResponse.json({ success: true, data: signedDocs });
    } catch (err) {
        console.error('Household documents API error:', err);
        return NextResponse.json({ error: err.message || 'Failed to load documents' }, { status: 500 });
    }
}

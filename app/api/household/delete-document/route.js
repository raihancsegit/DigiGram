import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const pin = searchParams.get('pin');

        if (!id || !pin) {
            return NextResponse.json({ error: 'Missing document ID or locker PIN' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Get file path before deleting metadata
        const { data: doc, error: fetchError } = await supabaseAdmin
            .from('household_documents')
            .select('file_path, household_id')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        const { data: household, error: householdError } = await supabaseAdmin
            .from('households')
            .select('id, qr_code_id')
            .eq('id', doc.household_id)
            .single();

        if (householdError) throw householdError;

        const { data: isValidPin, error: pinError } = await supabaseAdmin.rpc('verify_household_locker_pin', {
            lookup_value: household.id,
            candidate_pin: pin
        });

        if (pinError) throw pinError;
        if (!isValidPin) {
            return NextResponse.json({ error: 'Invalid locker PIN' }, { status: 403 });
        }

        // Delete from Storage
        if (doc?.file_path) {
            await supabaseAdmin.storage
                .from('household_documents')
                .remove([doc.file_path]);
        }

        // Delete metadata
        const { error: deleteError } = await supabaseAdmin
            .from('household_documents')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Document Delete API error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

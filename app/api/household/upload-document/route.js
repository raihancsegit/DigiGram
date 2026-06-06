import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { recordDataAccess } from '@/lib/utils/data-access-log';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const householdLookup = formData.get('householdLookup');
        const pin = formData.get('pin');
        const type = formData.get('type') || 'Other';
        const title = formData.get('title') || 'Document';

        if (!file || !householdLookup || !pin) {
            return NextResponse.json({ error: 'Missing file, household lookup, or locker PIN' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: isValidPin, error: pinError } = await supabaseAdmin.rpc('verify_household_locker_pin', {
            lookup_value: householdLookup,
            candidate_pin: pin
        });

        if (pinError) throw pinError;
        if (!isValidPin) {
            return NextResponse.json({ error: 'Invalid locker PIN' }, { status: 403 });
        }

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(householdLookup);
        let householdQuery = supabaseAdmin.from('households').select('id,phone');
        householdQuery = isUuid
            ? householdQuery.eq('id', householdLookup)
            : householdQuery.eq('qr_code_id', householdLookup);
        const { data: household, error: householdError } = await householdQuery.single();

        if (householdError) throw householdError;

        // Ensure bucket exists
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        const bucketExists = buckets?.find(b => b.name === 'household_documents');
        
        if (!bucketExists) {
            await supabaseAdmin.storage.createBucket('household_documents', {
                public: false,
                fileSizeLimit: 5242880 // 5MB
            });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${household.id}/${type}-${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('household_documents')
            .upload(fileName, file, {
                upsert: true,
                contentType: file.type
            });

        if (uploadError) throw uploadError;

        // Save metadata to table
        const { data: docData, error: dbError } = await supabaseAdmin
            .from('household_documents')
            .insert([{
                household_id: household.id,
                type,
                title,
                file_url: null,
                file_path: fileName,
                file_size: file.size,
                mime_type: file.type
            }])
            .select()
            .single();

        if (dbError) throw dbError;

        await recordDataAccess({
            request,
            citizenPhone: household.phone || null,
            householdId: household.id,
            resourceType: 'household_document',
            resourceId: docData.id,
            action: 'document_uploaded',
            metadata: { type, title, mime_type: file.type, file_size: file.size }
        });

        return NextResponse.json({ success: true, data: docData });
    } catch (err) {
        console.error('Document Upload API error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

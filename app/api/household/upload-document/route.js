import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const householdId = formData.get('householdId');
        const type = formData.get('type') || 'Other';
        const title = formData.get('title') || 'Document';

        if (!file || !householdId) {
            return NextResponse.json({ error: 'Missing file or householdId' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Ensure bucket exists
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        const bucketExists = buckets?.find(b => b.name === 'household_documents');
        
        if (!bucketExists) {
            await supabaseAdmin.storage.createBucket('household_documents', {
                public: true,
                fileSizeLimit: 5242880 // 5MB
            });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${householdId}/${type}-${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('household_documents')
            .upload(fileName, file, {
                upsert: true,
                contentType: file.type
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('household_documents')
            .getPublicUrl(fileName);

        // Save metadata to table
        const { data: docData, error: dbError } = await supabaseAdmin
            .from('household_documents')
            .insert([{
                household_id: householdId,
                type,
                title,
                file_url: publicUrl,
                file_path: fileName,
                file_size: file.size,
                mime_type: file.type
            }])
            .select()
            .single();

        if (dbError) throw dbError;

        return NextResponse.json({ success: true, data: docData });
    } catch (err) {
        console.error('Document Upload API error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

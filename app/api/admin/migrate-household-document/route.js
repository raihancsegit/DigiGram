import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const documentId = formData.get('documentId');
        const file = formData.get('file');

        if (!documentId || !file) {
            return NextResponse.json({ error: 'documentId and file are required' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: doc, error: docError } = await supabaseAdmin
            .from('household_documents')
            .select('id, household_id, type, file_path')
            .eq('id', documentId)
            .maybeSingle();

        if (docError) throw docError;
        if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        const bucketExists = buckets?.find((bucket) => bucket.name === 'household_documents');

        if (!bucketExists) {
            const { error: bucketError } = await supabaseAdmin.storage.createBucket('household_documents', {
                public: false,
                fileSizeLimit: 5242880
            });
            if (bucketError) throw bucketError;
        }

        const originalName = file.name || 'document';
        const fileExt = originalName.includes('.') ? originalName.split('.').pop() : 'bin';
        const filePath = `${doc.household_id}/${doc.type || 'document'}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from('household_documents')
            .upload(filePath, file, {
                upsert: false,
                contentType: file.type || 'application/octet-stream'
            });

        if (uploadError) throw uploadError;

        if (doc.file_path) {
            await supabaseAdmin.storage
                .from('household_documents')
                .remove([doc.file_path]);
        }

        const { data, error: updateError } = await supabaseAdmin
            .from('household_documents')
            .update({
                file_url: null,
                file_path: filePath,
                file_size: file.size,
                mime_type: file.type || 'application/octet-stream'
            })
            .eq('id', doc.id)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            message: 'Document private storage-এ migrate হয়েছে।',
            data
        });
    } catch (err) {
        console.error('Document migration error:', err);
        return NextResponse.json({ error: err.message || 'Document migration failed' }, { status: 500 });
    }
}

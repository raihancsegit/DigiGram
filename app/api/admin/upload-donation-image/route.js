import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireRequestProfile } from '@/lib/utils/server-auth';
import { internalServerError } from '@/lib/utils/api-response';
import { createSafeUploadName, validateUploadedFile } from '@/lib/utils/upload-security';

export async function POST(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin', 'chairman']);
        if (auth.response) return auth.response;

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'Missing file' }, { status: 400 });
        }
        const validatedFile = await validateUploadedFile(file, {
            kind: 'image',
            maxBytes: 5 * 1024 * 1024
        });
        if (validatedFile.error) {
            return NextResponse.json({ error: validatedFile.error }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Use a more common bucket or ensure it exists
        const bucketName = 'public-uploads'; 
        
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        const bucketExists = buckets?.find(b => b.name === bucketName);
        
        if (!bucketExists) {
            const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
                public: true,
                allowedMimeTypes: ['image/*'],
                fileSizeLimit: 5242880 // 5MB
            });
            if (createError) console.error('Bucket creation error:', createError);
        }

        const fileName = `donations/${createSafeUploadName(validatedFile.extension)}`;

        const { data, error: uploadError } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(fileName, file, {
                upsert: true,
                contentType: validatedFile.mimeType
            });

        if (uploadError) {
            console.error('Donation storage upload error:', uploadError);
            return internalServerError('Donation image upload failed. Please try again.');
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return NextResponse.json({ success: true, publicUrl });
    } catch (err) {
        console.error('Upload API error:', err);
        return internalServerError('Donation image upload failed. Please try again.');
    }
}

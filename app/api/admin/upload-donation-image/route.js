import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'Missing file' }, { status: 400 });
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

        const fileExt = file.name.split('.').pop();
        const fileName = `donations/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data, error: uploadError } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(fileName, file, {
                upsert: true,
                contentType: file.type
            });

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return NextResponse.json({ success: true, publicUrl });
    } catch (err) {
        console.error('Upload API error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

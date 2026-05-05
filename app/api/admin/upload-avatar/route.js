import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const userId = formData.get('userId');

        if (!file || !userId) {
            return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Ensure bucket exists
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        const bucketExists = buckets?.find(b => b.name === 'avatars');
        
        if (!bucketExists) {
            const { error: createError } = await supabaseAdmin.storage.createBucket('avatars', {
                public: true,
                allowedMimeTypes: ['image/*'],
                fileSizeLimit: 2097152 // 2MB
            });
            if (createError) console.error('Bucket creation error:', createError);
        } else {
            // Ensure it is public
            await supabaseAdmin.storage.updateBucket('avatars', { public: true });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;

        const { data, error: uploadError } = await supabaseAdmin.storage
            .from('avatars')
            .upload(fileName, file, {
                upsert: true,
                contentType: file.type
            });

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('avatars')
            .getPublicUrl(fileName);

        return NextResponse.json({ success: true, publicUrl });
    } catch (err) {
        console.error('Upload API error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireRequestProfile } from '@/lib/utils/server-auth';
import { internalServerError } from '@/lib/utils/api-response';
import { createSafeUploadName, validateUploadedFile } from '@/lib/utils/upload-security';
import { consumeRateLimit, rateLimitHeaders } from '@/lib/utils/rate-limit';

export async function POST(request) {
    try {
        const auth = await requireRequestProfile(request);
        if (auth.response) return auth.response;

        const formData = await request.formData();
        const file = formData.get('file');
        const userId = formData.get('userId');

        if (!file || !userId) {
            return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 });
        }
        if (auth.profile.role !== 'super_admin' && auth.profile.id !== userId) {
            return NextResponse.json({ error: 'You can only update your own avatar' }, { status: 403 });
        }
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        const uploadLimit = await consumeRateLimit({
            request,
            scope: 'avatar-upload',
            identity: auth.profile.id,
            limit: 10,
            windowSeconds: 10 * 60,
            client: supabaseAdmin
        });
        if (!uploadLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many avatar uploads. Please try again later.' },
                { status: 429, headers: rateLimitHeaders(uploadLimit) }
            );
        }
        const validatedFile = await validateUploadedFile(file, {
            kind: 'image',
            maxBytes: 2 * 1024 * 1024
        });
        if (validatedFile.error) {
            return NextResponse.json({ error: validatedFile.error }, { status: 400 });
        }

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

        const fileName = `${userId}-${createSafeUploadName(validatedFile.extension)}`;

        const { data, error: uploadError } = await supabaseAdmin.storage
            .from('avatars')
            .upload(fileName, file, {
                upsert: true,
                contentType: validatedFile.mimeType
            });

        if (uploadError) {
            console.error('Avatar storage upload error:', uploadError);
            return internalServerError('Avatar upload failed. Please try again.');
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('avatars')
            .getPublicUrl(fileName);

        return NextResponse.json({ success: true, publicUrl });
    } catch (err) {
        console.error('Upload API error:', err);
        return internalServerError('Avatar upload failed. Please try again.');
    }
}

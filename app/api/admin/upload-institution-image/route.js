import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { canManageInstitution, requireRequestProfile } from '@/lib/utils/server-auth';
import { internalServerError } from '@/lib/utils/api-response';
import { createSafeUploadName, validateUploadedFile } from '@/lib/utils/upload-security';

const bucketName = 'public-uploads';

function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
}

function safeInstitutionFolder(value) {
    return String(value || 'general').replace(/[^a-zA-Z0-9-_]/g, '') || 'general';
}

function mediaPathAllowed(path, institutionId) {
    return path?.startsWith(`institutions/${safeInstitutionFolder(institutionId)}/`);
}

export async function GET(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin', 'institution_admin', 'school_admin']);
        if (auth.response) return auth.response;

        const institutionId = safeInstitutionFolder(new URL(request.url).searchParams.get('institutionId'));
        if (!(await canManageInstitution(auth.profile, institutionId))) {
            return NextResponse.json({ error: 'This institution is outside your assigned scope' }, { status: 403 });
        }
        const folder = `institutions/${institutionId}`;
        const supabaseAdmin = createAdminClient();
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();

        if (!buckets?.some((bucket) => bucket.name === bucketName)) {
            return NextResponse.json({ success: true, media: [] });
        }

        const { data, error } = await supabaseAdmin.storage
            .from(bucketName)
            .list(folder, {
                limit: 120,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (error) {
            console.error('Institution media storage list error:', error);
            return internalServerError('Institution media could not be loaded.');
        }

        const media = (data || [])
            .filter((item) => item.name && item.metadata)
            .map((item) => {
                const path = `${folder}/${item.name}`;
                const { data: publicData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(path);
                return {
                    id: item.id || path,
                    name: item.name,
                    path,
                    url: publicData.publicUrl,
                    created_at: item.created_at,
                    size: item.metadata?.size || 0,
                    mime_type: item.metadata?.mimetype || ''
                };
            });

        return NextResponse.json({ success: true, media });
    } catch (err) {
        console.error('Institution media list API error:', err);
        return internalServerError('Institution media could not be loaded.');
    }
}

export async function DELETE(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin', 'institution_admin', 'school_admin']);
        if (auth.response) return auth.response;

        const body = await request.json();
        const institutionId = safeInstitutionFolder(body.institutionId);
        const path = body.path;

        if (!(await canManageInstitution(auth.profile, institutionId))) {
            return NextResponse.json({ error: 'This institution is outside your assigned scope' }, { status: 403 });
        }
        if (!mediaPathAllowed(path, institutionId)) {
            return NextResponse.json({ error: 'Invalid institution media path' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();
        const { error } = await supabaseAdmin.storage.from(bucketName).remove([path]);

        if (error) {
            console.error('Institution media storage delete error:', error);
            return internalServerError('Institution media could not be deleted.');
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Institution media delete API error:', err);
        return internalServerError('Institution media could not be deleted.');
    }
}

export async function POST(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin', 'institution_admin', 'school_admin']);
        if (auth.response) return auth.response;

        const formData = await request.formData();
        const file = formData.get('file');
        const institutionId = formData.get('institutionId') || 'general';

        if (!file) {
            return NextResponse.json({ error: 'Missing file' }, { status: 400 });
        }
        if (!(await canManageInstitution(auth.profile, institutionId))) {
            return NextResponse.json({ error: 'This institution is outside your assigned scope' }, { status: 403 });
        }

        const validatedFile = await validateUploadedFile(file, {
            kind: 'image',
            maxBytes: 5 * 1024 * 1024
        });
        if (validatedFile.error) {
            return NextResponse.json({ error: validatedFile.error }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        const bucketExists = buckets?.some((bucket) => bucket.name === bucketName);

        if (!bucketExists) {
            const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
                public: true,
                allowedMimeTypes: ['image/*'],
                fileSizeLimit: 5242880
            });

            if (createError) {
                console.error('Institution media bucket creation error:', createError);
                return internalServerError('Institution image upload failed. Please try again.');
            }
        }

        const safeInstitutionId = safeInstitutionFolder(institutionId);
        const filePath = `institutions/${safeInstitutionId}/${createSafeUploadName(validatedFile.extension)}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(filePath, file, {
                upsert: true,
                contentType: validatedFile.mimeType
            });

        if (uploadError) {
            console.error('Institution storage upload error:', uploadError);
            return internalServerError('Institution image upload failed. Please try again.');
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return NextResponse.json({ success: true, publicUrl });
    } catch (err) {
        console.error('Institution image upload API error:', err);
        return internalServerError('Institution image upload failed. Please try again.');
    }
}

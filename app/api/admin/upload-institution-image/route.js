import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
        const institutionId = safeInstitutionFolder(new URL(request.url).searchParams.get('institutionId'));
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
            return NextResponse.json({ error: error.message }, { status: 500 });
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
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const body = await request.json();
        const institutionId = safeInstitutionFolder(body.institutionId);
        const path = body.path;

        if (!mediaPathAllowed(path, institutionId)) {
            return NextResponse.json({ error: 'Invalid institution media path' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();
        const { error } = await supabaseAdmin.storage.from(bucketName).remove([path]);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Institution media delete API error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const institutionId = formData.get('institutionId') || 'general';

        if (!file) {
            return NextResponse.json({ error: 'Missing file' }, { status: 400 });
        }

        if (!file.type?.startsWith('image/')) {
            return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
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
                return NextResponse.json({ error: createError.message }, { status: 500 });
            }
        }

        const fileExt = file.name.split('.').pop() || 'jpg';
        const safeInstitutionId = safeInstitutionFolder(institutionId);
        const filePath = `institutions/${safeInstitutionId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(filePath, file, {
                upsert: true,
                contentType: file.type
            });

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return NextResponse.json({ success: true, publicUrl });
    } catch (err) {
        console.error('Institution image upload API error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

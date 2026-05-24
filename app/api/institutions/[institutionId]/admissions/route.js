import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

function text(value, maxLength = 240) {
    return String(value || '').trim().slice(0, maxLength);
}

function normalizePhone(value) {
    return text(value, 40).replace(/[^\d+]/g, '');
}

export async function POST(request, { params }) {
    try {
        const { institutionId } = await params;
        const body = await request.json();
        const payload = {
            institution_id: institutionId,
            student_name: text(body.student_name, 180),
            student_name_en: text(body.student_name_en, 180) || null,
            date_of_birth: body.date_of_birth || null,
            gender: text(body.gender, 40) || null,
            desired_class: text(body.desired_class, 100),
            previous_institution: text(body.previous_institution, 180) || null,
            guardian_name: text(body.guardian_name, 180),
            guardian_phone: normalizePhone(body.guardian_phone),
            guardian_email: text(body.guardian_email, 180) || null,
            address: text(body.address, 500) || null,
            notes: text(body.notes, 1000) || null
        };

        if (!payload.institution_id || !payload.student_name || !payload.desired_class || !payload.guardian_name || !payload.guardian_phone) {
            return NextResponse.json({ error: 'Student name, class, guardian name and phone are required.' }, { status: 400 });
        }

        const { data: institution, error: institutionError } = await supabaseAdmin
            .from('institutions')
            .select('id,website_status')
            .eq('id', institutionId)
            .maybeSingle();
        if (institutionError) throw institutionError;
        if (!institution || institution.website_status === 'paused') {
            return NextResponse.json({ error: 'Admission is not available for this institution.' }, { status: 404 });
        }

        const { data, error } = await supabaseAdmin
            .from('school_admission_applications')
            .insert([payload])
            .select('id,status,created_at')
            .single();
        if (error) throw error;

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        console.error('Admission application failed:', error);
        return NextResponse.json({ error: error.message || 'Admission application failed.' }, { status: 500 });
    }
}

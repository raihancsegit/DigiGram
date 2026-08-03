import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { internalServerError } from '@/lib/utils/api-response';
import { readJsonObject, validateTextFields } from '@/lib/utils/request-validation';

const VALID_BLOOD_GROUPS = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

function normalizePhone(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

export async function POST(request) {
    try {
        const parsed = await readJsonObject(request);
        if (parsed.error) {
            return NextResponse.json({ error: parsed.error }, { status: parsed.status });
        }
        const body = parsed.data;
        const phone = normalizePhone(body.phone);
        const validation = validateTextFields(body, {
            requesterName: { label: 'Requester name', maxLength: 120 },
            bloodGroup: { label: 'Blood group', required: true, allowed: VALID_BLOOD_GROUPS },
            patientName: { label: 'Patient name', maxLength: 120 },
            hospitalOrLocation: { label: 'Hospital or location', maxLength: 300 },
            neededAt: { label: 'Needed time', maxLength: 32, pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/ },
            note: { label: 'Note', maxLength: 1000 }
        });
        if (!/^01[0-9]{9}$/.test(phone)) {
            validation.errors.phone = ['A valid Bangladeshi mobile number is required'];
            validation.valid = false;
        }
        if (!validation.valid) {
            return NextResponse.json({
                error: 'Please correct the highlighted information',
                errors: validation.errors
            }, { status: 400 });
        }
        const {
            requesterName,
            bloodGroup,
            patientName,
            hospitalOrLocation,
            neededAt,
            note
        } = validation.values;

        const { data, error } = await supabaseAdmin
            .from('citizen_blood_requests')
            .insert([{
                requester_name: requesterName,
                phone,
                blood_group: bloodGroup,
                patient_name: patientName,
                hospital_or_location: hospitalOrLocation,
                needed_at: neededAt,
                note
            }])
            .select()
            .single();

        if (error) throw error;

        const { count: possibleDonorCount, error: donorError } = await supabaseAdmin
            .from('residents')
            .select('id', { count: 'exact', head: true })
            .eq('blood_group', bloodGroup)
            .limit(20);
        if (donorError) throw donorError;

        return NextResponse.json({
            success: true,
            data,
            possibleDonorCount: Math.min(Number(possibleDonorCount || 0), 20)
        });
    } catch (error) {
        console.error('Citizen blood request failed:', error);
        return internalServerError('Blood request failed. Please try again.');
    }
}

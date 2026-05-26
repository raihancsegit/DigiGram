import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

function normalizePhone(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
    return digits;
}

export async function POST(request) {
    try {
        const body = await request.json();
        const phone = normalizePhone(body.phone);
        if (!/^01[0-9]{9}$/.test(phone) || !body.bloodGroup) {
            return NextResponse.json({ error: 'Phone and blood group are required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('citizen_blood_requests')
            .insert([{
                requester_name: body.requesterName || null,
                phone,
                blood_group: body.bloodGroup,
                patient_name: body.patientName || null,
                hospital_or_location: body.hospitalOrLocation || null,
                needed_at: body.neededAt || null,
                note: body.note || null
            }])
            .select()
            .single();

        if (error) throw error;

        const { data: donors } = await supabaseAdmin
            .from('residents')
            .select('id,name,blood_group,phone,household:households(owner_name,phone)')
            .eq('blood_group', body.bloodGroup)
            .limit(20);

        return NextResponse.json({
            success: true,
            data,
            possibleDonors: (donors || []).map((item) => ({
                id: item.id,
                name: item.name,
                phone: item.phone || item.household?.phone || null
            })).filter((item) => item.phone)
        });
    } catch (error) {
        console.error('Citizen blood request failed:', error);
        return NextResponse.json({ error: error.message || 'Blood request failed' }, { status: 500 });
    }
}

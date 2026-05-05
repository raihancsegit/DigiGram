import { NextResponse } from 'next/server';
import { getInstitutionsByLocation } from '@/lib/services/hierarchyService';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const location_id = searchParams.get('location_id');

    if (!location_id) {
        return NextResponse.json({ success: false, message: "location_id parameter is required." }, { status: 400 });
    }

    try {
        const institutions = await getInstitutionsByLocation(location_id);
        return NextResponse.json({ success: true, data: institutions }, { status: 200 });
    } catch (error) {
        console.error("API Error in /api/v1/institutions:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error." }, { status: 500 });
    }
}

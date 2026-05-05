import { NextResponse } from 'next/server';
import { getChildLocations } from '@/lib/services/hierarchyService';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    const resolvedParams = await params;
    const { location_id } = resolvedParams;

    if (!location_id) {
        return NextResponse.json({ success: false, message: "location_id is required." }, { status: 400 });
    }

    try {
        const children = await getChildLocations(location_id);
        
        return NextResponse.json({ success: true, data: children }, { status: 200 });
    } catch (error) {
        console.error("API Error in /api/v1/hierarchy/[location_id]/children:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error." }, { status: 500 });
    }
}

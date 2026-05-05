import { NextResponse } from 'next/server';
import { getLocationPath } from '@/lib/services/hierarchyService';

export async function GET(request, { params }) {
    const resolvedParams = await params;
    const { location_id } = resolvedParams;

    if (!location_id) {
        return NextResponse.json({ success: false, message: "location_id is required." }, { status: 400 });
    }

    try {
        const data = await getLocationPath(location_id);
        
        if (!data) {
            return NextResponse.json({ success: false, message: "Location not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
        console.error("API Error in /api/v1/hierarchy/[location_id]:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error." }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { getLocationBySlug } from '@/lib/services/hierarchyService';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    if (!slug) {
        return NextResponse.json({ success: false, message: "slug is required." }, { status: 400 });
    }

    try {
        const data = await getLocationBySlug(slug);
        
        if (!data) {
            return NextResponse.json({ success: false, message: "Location not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
        console.error("API Error in /api/v1/hierarchy/slug/[slug]:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error." }, { status: 500 });
    }
}

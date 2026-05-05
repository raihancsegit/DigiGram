import { getLocationBySlug } from '@/lib/services/hierarchyService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function GET(request, { params }) {
    const { slug } = await params;
    const location = await getLocationBySlug(slug);
    return NextResponse.json(location);
}

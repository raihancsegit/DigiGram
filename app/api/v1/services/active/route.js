import { getActiveServices } from '@/lib/services/hierarchyService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');
    const services = await getActiveServices(locationId);
    return NextResponse.json(services);
}

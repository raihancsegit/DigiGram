import { getInstitutionsByLocation } from '@/lib/services/hierarchyService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');
    const type = searchParams.get('type');
    
    const institutions = await getInstitutionsByLocation(locationId, type);
    return NextResponse.json(institutions);
}

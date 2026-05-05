import { getVillagesByWard } from '@/lib/services/hierarchyService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function GET(request, { params }) {
    const { location_id } = await params;
    const villages = await getVillagesByWard(location_id);
    return NextResponse.json(villages);
}

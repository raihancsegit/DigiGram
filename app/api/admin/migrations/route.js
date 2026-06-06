import { NextResponse } from 'next/server';
import { requireRequestProfile } from '@/lib/utils/server-auth';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export const dynamic = 'force-dynamic';

function isSetupError(error) {
    return ['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error?.code);
}

export async function GET(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin']);
        if (auth.response) return auth.response;

        const [{ data, error }, extensionResult] = await Promise.all([
            supabaseAdmin.rpc('get_digigram_migration_status'),
            supabaseAdmin.rpc('get_digigram_migration_67_status')
        ]);
        if (error && isSetupError(error)) {
            return NextResponse.json({
                error: 'Migration registry is not installed',
                setupRequired: true,
                migration: 'database/66_migration_registry.sql'
            }, { status: 409 });
        }
        if (error) throw error;

        const extensionRows = isSetupError(extensionResult.error) ? [] : (extensionResult.data || []);
        if (extensionResult.error && !isSetupError(extensionResult.error)) throw extensionResult.error;

        const rowMap = new Map(
            [...(data || []), ...extensionRows].map((item) => [item.migration_id, item])
        );
        const rows = [...rowMap.values()].sort(
            (a, b) => Number(a.migration_id) - Number(b.migration_id)
        );
        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    total: rows.length,
                    installed: rows.filter((item) => item.installed).length,
                    missing: rows.filter((item) => !item.installed).length
                },
                migrations: rows
            }
        });
    } catch (error) {
        console.error('Migration status load failed:', error);
        return NextResponse.json({ error: error.message || 'Migration status load failed' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export async function POST(request) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'create_gateway') {
            const { data, error } = await supabaseAdmin
                .from('sms_gateways')
                .insert([{
                    name: body.name,
                    provider: body.provider,
                    sender_id: body.senderId || null,
                    api_base_url: body.apiBaseUrl || null,
                    api_key: body.apiKey || null,
                    is_active: Boolean(body.isActive)
                }])
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (action === 'create_package') {
            const { data, error } = await supabaseAdmin
                .from('sms_packages')
                .insert([{
                    name: body.name,
                    credits: Number(body.credits),
                    price: Number(body.price),
                    is_active: body.isActive !== false
                }])
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Admin SMS mutation failed:', error);
        return NextResponse.json({ error: error.message || 'SMS mutation failed' }, { status: 500 });
    }
}

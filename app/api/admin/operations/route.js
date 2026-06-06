import { NextResponse } from 'next/server';
import { requireRequestProfile } from '@/lib/utils/server-auth';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { recordDataAccess } from '@/lib/utils/data-access-log';

export const dynamic = 'force-dynamic';

function isSetupError(error) {
    return ['42703', '42P01', 'PGRST204', 'PGRST205'].includes(error?.code);
}

export async function GET(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin']);
        if (auth.response) return auth.response;

        const { error: refreshError } = await supabaseAdmin.rpc('refresh_service_sla_escalations');
        if (refreshError && !isSetupError(refreshError)) throw refreshError;

        const [serviceResult, complaintResult, appointmentResult, lifeSupportResult, accessResult] = await Promise.all([
            supabaseAdmin
                .from('service_requests')
                .select(`
                    id,request_type,status,applicant_name,contact_phone,priority,
                    created_at,sla_due_at,sla_breached_at,escalation_level,
                    household:households(owner_name,house_no,ward_id)
                `)
                .in('status', ['pending', 'processing', 'ready'])
                .order('sla_due_at', { ascending: true })
                .limit(150),
            supabaseAdmin
                .from('citizen_complaints')
                .select('id,title,citizen_name,phone,priority,status,assigned_scope_type,assigned_scope_id,created_at,sla_due_at,sla_breached_at,escalation_level')
                .in('status', ['submitted', 'reviewing', 'assigned'])
                .order('sla_due_at', { ascending: true })
                .limit(150),
            supabaseAdmin
                .from('citizen_appointments')
                .select('id,title,citizen_name,phone,priority,status,assigned_scope_type,assigned_scope_id,created_at,sla_due_at,sla_breached_at,escalation_level')
                .in('status', ['submitted', 'reviewing', 'scheduled'])
                .order('sla_due_at', { ascending: true })
                .limit(150),
            supabaseAdmin
                .from('citizen_life_support_cases')
                .select('id,title,citizen_name,phone,case_type,priority,status,assigned_scope_type,assigned_scope_id,created_at,sla_due_at,sla_breached_at,escalation_level')
                .in('status', ['submitted', 'reviewing', 'assigned', 'scheduled'])
                .order('sla_due_at', { ascending: true })
                .limit(150),
            supabaseAdmin
                .from('data_access_logs')
                .select('id,actor_role,citizen_phone,resource_type,resource_id,action,access_channel,created_at')
                .order('created_at', { ascending: false })
                .limit(60)
        ]);

        const queueSetupError = [appointmentResult.error, lifeSupportResult.error].find(isSetupError);
        if (queueSetupError) {
            return NextResponse.json({
                error: 'Officer queue SLA migration is not installed',
                setupRequired: true,
                migration: 'database/67_officer_scope_activity_sla.sql'
            }, { status: 409 });
        }

        const setupError = [serviceResult.error, complaintResult.error, accessResult.error].find(isSetupError);
        if (setupError) {
            return NextResponse.json({
                error: 'Operations migration is not installed',
                setupRequired: true,
                migration: 'database/65_service_sla_privacy_audit.sql'
            }, { status: 409 });
        }

        if (serviceResult.error) throw serviceResult.error;
        if (complaintResult.error) throw complaintResult.error;
        if (appointmentResult.error) throw appointmentResult.error;
        if (lifeSupportResult.error) throw lifeSupportResult.error;
        if (accessResult.error) throw accessResult.error;

        const now = Date.now();
        const services = (serviceResult.data || []).map((item) => ({
            ...item,
            overdue: Boolean(item.sla_due_at && new Date(item.sla_due_at).getTime() < now)
        }));
        const complaints = (complaintResult.data || []).map((item) => ({
            ...item,
            overdue: Boolean(item.sla_due_at && new Date(item.sla_due_at).getTime() < now)
        }));
        const appointments = (appointmentResult.data || []).map((item) => ({
            ...item,
            overdue: Boolean(item.sla_due_at && new Date(item.sla_due_at).getTime() < now)
        }));
        const lifeSupport = (lifeSupportResult.data || []).map((item) => ({
            ...item,
            overdue: Boolean(item.sla_due_at && new Date(item.sla_due_at).getTime() < now)
        }));

        await recordDataAccess({
            request,
            actor: auth.profile,
            resourceType: 'operations_dashboard',
            action: 'operations_viewed',
            metadata: {
                service_count: services.length,
                complaint_count: complaints.length,
                appointment_count: appointments.length,
                life_support_count: lifeSupport.length
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    openServices: services.length,
                    overdueServices: services.filter((item) => item.overdue).length,
                    openComplaints: complaints.length,
                    overdueComplaints: complaints.filter((item) => item.overdue).length,
                    openAppointments: appointments.length,
                    overdueAppointments: appointments.filter((item) => item.overdue).length,
                    openLifeSupport: lifeSupport.length,
                    overdueLifeSupport: lifeSupport.filter((item) => item.overdue).length,
                    highEscalations: [...services, ...complaints, ...appointments, ...lifeSupport]
                        .filter((item) => Number(item.escalation_level || 0) >= 2).length,
                    recentPrivateAccess: accessResult.data?.length || 0
                },
                services,
                complaints,
                appointments,
                lifeSupport,
                accessLogs: accessResult.data || []
            }
        });
    } catch (error) {
        console.error('Operations dashboard failed:', error);
        return NextResponse.json({ error: error.message || 'Operations dashboard failed' }, { status: 500 });
    }
}

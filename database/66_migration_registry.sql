-- DigiGram migration registry and installation diagnostics
-- Safe to run more than once in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sql_file TEXT NOT NULL,
    notes TEXT,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can read schema migrations" ON public.schema_migrations;
CREATE POLICY "Super admins can read schema migrations"
ON public.schema_migrations FOR SELECT
TO authenticated
USING (public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "Super admins can manage schema migrations" ON public.schema_migrations;
CREATE POLICY "Super admins can manage schema migrations"
ON public.schema_migrations FOR ALL
TO authenticated
USING (public.get_auth_role() = 'super_admin')
WITH CHECK (public.get_auth_role() = 'super_admin');

REVOKE ALL ON public.schema_migrations FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schema_migrations TO authenticated;

CREATE OR REPLACE FUNCTION public.get_digigram_migration_status()
RETURNS TABLE (
    migration_id TEXT,
    title TEXT,
    sql_file TEXT,
    installed BOOLEAN,
    detail TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT *
    FROM (
        VALUES
            (
                '58',
                'Household edit scope hardening',
                'database/58_household_edit_scope_hardening.sql',
                to_regprocedure('public.household_is_in_auth_village(uuid,uuid,uuid)') IS NOT NULL,
                'Only the assigned village volunteer or ward officer can edit a household.'
            ),
            (
                '59',
                'SMS worker gateway readiness',
                'database/59_sms_worker_gateway_readiness.sql',
                EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'sms_gateways'
                      AND column_name = 'config'
                ),
                'Gateway configuration and delivery-worker support.'
            ),
            (
                '60',
                'Market complaint and utility hub',
                'database/60_market_complaints_and_utility_hub.sql',
                to_regclass('public.market_complaints') IS NOT NULL,
                'Market complaints and union utility service records.'
            ),
            (
                '61',
                'Local business directory and ads',
                'database/61_local_business_directory_and_ads.sql',
                to_regclass('public.local_businesses') IS NOT NULL
                    AND to_regclass('public.business_ads') IS NOT NULL,
                'Verified local business listings and paid advertisements.'
            ),
            (
                '62',
                'Data quality command center',
                'database/62_data_quality_command_center.sql',
                to_regclass('public.data_quality_tasks') IS NOT NULL,
                'Missing and duplicate data review workflow.'
            ),
            (
                '63',
                'Role and RLS security audit',
                'database/63_role_rls_security_audit.sql',
                to_regclass('public.admin_rls_security_audit') IS NOT NULL,
                'Role policies, private documents, and RLS diagnostics.'
            ),
            (
                '64',
                'Unified payment center',
                'database/64_unified_payment_center.sql',
                to_regclass('public.payment_transactions') IS NOT NULL
                    AND to_regclass('public.payment_gateways') IS NOT NULL,
                'Citizen payment requests and gateway transaction tracking.'
            ),
            (
                '65',
                'Service SLA and privacy audit',
                'database/65_service_sla_privacy_audit.sql',
                to_regclass('public.data_access_logs') IS NOT NULL
                    AND EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'service_requests'
                          AND column_name = 'sla_due_at'
                    ),
                'SLA deadlines, escalation, and private-data access history.'
            ),
            (
                '66',
                'Migration registry',
                'database/66_migration_registry.sql',
                to_regclass('public.schema_migrations') IS NOT NULL,
                'Database installation status visible from Super Admin.'
            ),
            (
                '67',
                'Officer scope, activity, and SLA',
                'database/67_officer_scope_activity_sla.sql',
                to_regclass('public.officer_activity_events') IS NOT NULL
                    AND EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'citizen_appointments'
                          AND column_name = 'sla_due_at'
                    )
                    AND EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'citizen_life_support_cases'
                          AND column_name = 'sla_due_at'
                ),
                'RLS, officer activity history, and SLA escalation for citizen queues.'
            ),
            (
                '68',
                'SMS delivery monitoring and retry',
                'database/68_sms_delivery_monitoring.sql',
                to_regclass('public.sms_delivery_attempts') IS NOT NULL
                    AND to_regprocedure('public.claim_sms_messages(integer,text)') IS NOT NULL,
                'Atomic worker claims, retry scheduling, provider health, and delivery-attempt audit.'
            ),
            (
                '69',
                'SMS gateway failover and webhook',
                'database/69_sms_failover_webhook.sql',
                to_regclass('public.sms_delivery_webhooks') IS NOT NULL
                    AND EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'sms_gateways'
                          AND column_name = 'priority'
                ),
                'Priority-based provider failover and signed delivery-status callbacks.'
            ),
            (
                '70',
                'Fuel, OTP, and public-form security hardening',
                'database/70_security_hardening_fuel_otp_public_forms.sql',
                to_regprocedure('public.verify_fuel_operator_password(text,text)') IS NOT NULL
                    AND EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'fuel_pump_settings'
                          AND column_name = 'access_password_hash'
                ),
                'Signed operator sessions, hashed fuel PINs, single-use OTP support, and public form throttling.'
            ),
            (
                '71',
                'Duplicate citizen review workflow',
                'database/71_duplicate_citizen_review.sql',
                to_regclass('public.duplicate_citizen_reviews') IS NOT NULL,
                'Grouped duplicate matching with audited confirmed/different-person decisions.'
            ),
            (
                '72',
                'Citizen governance center',
                'database/72_citizen_governance_center.sql',
                to_regclass('public.citizen_consents') IS NOT NULL
                    AND to_regclass('public.officer_devices') IS NOT NULL
                    AND to_regclass('public.citizen_merge_events') IS NOT NULL
                    AND to_regclass('public.sms_automation_rules') IS NOT NULL
                    AND to_regclass('public.system_recovery_snapshots') IS NOT NULL,
                'Consent, officer devices, reversible citizen merge, SMS rules, and recovery snapshots.'
            ),
            (
                '73',
                'Safe demo data registry',
                'database/73_demo_data_registry.sql',
                to_regclass('public.demo_data_batches') IS NOT NULL
                    AND to_regclass('public.demo_data_records') IS NOT NULL,
                'Tracks every generated demo row for one-click, real-data-safe cleanup.'
            )
    ) AS checks(migration_id, title, sql_file, installed, detail)
    ORDER BY migration_id::INTEGER;
$$;

REVOKE ALL ON FUNCTION public.get_digigram_migration_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_digigram_migration_status() TO authenticated;

INSERT INTO public.schema_migrations (id, name, sql_file, notes)
SELECT status.migration_id, status.title, status.sql_file, status.detail
FROM public.get_digigram_migration_status() status
WHERE status.installed
ON CONFLICT (id) DO UPDATE
SET
    name = EXCLUDED.name,
    sql_file = EXCLUDED.sql_file,
    notes = EXCLUDED.notes;

COMMENT ON TABLE public.schema_migrations IS
    'Tracks DigiGram SQL migrations that have been installed or confirmed by diagnostics.';

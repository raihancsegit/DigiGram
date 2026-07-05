-- DigiGram SMS delivery monitoring, atomic worker claims, and retry support.
-- Safe to run more than once after 59_sms_worker_gateway_readiness.sql.

ALTER TABLE public.sms_gateways
    ADD COLUMN IF NOT EXISTS timeout_ms INTEGER NOT NULL DEFAULT 15000,
    ADD COLUMN IF NOT EXISTS health_status TEXT NOT NULL DEFAULT 'unknown',
    ADD COLUMN IF NOT EXISTS last_success_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_failure_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS consecutive_failures INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_error TEXT;

ALTER TABLE public.sms_messages
    ADD COLUMN IF NOT EXISTS gateway_id UUID REFERENCES public.sms_gateways(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 4,
    ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS locked_by TEXT,
    ADD COLUMN IF NOT EXISTS provider_response JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sms_messages_worker_queue
    ON public.sms_messages(status, next_attempt_at, queued_at)
    WHERE status = 'queued';

CREATE TABLE IF NOT EXISTS public.sms_delivery_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sms_message_id UUID NOT NULL REFERENCES public.sms_messages(id) ON DELETE CASCADE,
    gateway_id UUID REFERENCES public.sms_gateways(id) ON DELETE SET NULL,
    attempt_no INTEGER NOT NULL,
    worker_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('sent', 'retry', 'failed')),
    provider_message_id TEXT,
    provider_http_status INTEGER,
    response_body JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_delivery_attempts_message
    ON public.sms_delivery_attempts(sms_message_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_delivery_attempts_gateway
    ON public.sms_delivery_attempts(gateway_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.claim_sms_messages(
    p_limit INTEGER DEFAULT 20,
    p_worker_id TEXT DEFAULT 'sms-worker'
)
RETURNS SETOF public.sms_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH claimable AS (
        SELECT m.id
        FROM public.sms_messages m
        WHERE m.status = 'queued'
          AND COALESCE(m.next_attempt_at, NOW()) <= NOW()
          AND m.attempts < m.max_attempts
          AND (m.locked_until IS NULL OR m.locked_until < NOW())
        ORDER BY m.next_attempt_at ASC, m.queued_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100)
    )
    UPDATE public.sms_messages m
    SET
        attempts = m.attempts + 1,
        last_attempt_at = NOW(),
        locked_at = NOW(),
        locked_until = NOW() + INTERVAL '2 minutes',
        locked_by = p_worker_id
    FROM claimable
    WHERE m.id = claimable.id
    RETURNING m.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_sms_messages(INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_sms_messages(INTEGER, TEXT) TO service_role;

ALTER TABLE public.sms_delivery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_gateways ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can read SMS gateways" ON public.sms_gateways;
CREATE POLICY "Super admins can read SMS gateways"
ON public.sms_gateways FOR SELECT
TO authenticated
USING (public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "Super admins can manage SMS gateways" ON public.sms_gateways;
CREATE POLICY "Super admins can manage SMS gateways"
ON public.sms_gateways FOR ALL
TO authenticated
USING (public.get_auth_role() = 'super_admin')
WITH CHECK (public.get_auth_role() = 'super_admin');

REVOKE ALL ON public.sms_gateways FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_gateways TO authenticated;
GRANT ALL ON public.sms_gateways TO service_role;

DROP POLICY IF EXISTS "Super admins can read SMS delivery attempts" ON public.sms_delivery_attempts;
CREATE POLICY "Super admins can read SMS delivery attempts"
ON public.sms_delivery_attempts FOR SELECT
TO authenticated
USING (public.get_auth_role() = 'super_admin');

REVOKE ALL ON public.sms_delivery_attempts FROM anon;
GRANT SELECT ON public.sms_delivery_attempts TO authenticated;
GRANT ALL ON public.sms_delivery_attempts TO service_role;

CREATE OR REPLACE FUNCTION public.get_digigram_migration_68_status()
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
    SELECT
        '68'::TEXT,
        'SMS delivery monitoring and retry',
        'database/68_sms_delivery_monitoring.sql',
        to_regclass('public.sms_delivery_attempts') IS NOT NULL
            AND to_regprocedure('public.claim_sms_messages(integer,text)') IS NOT NULL,
        'Atomic worker claims, retry scheduling, provider health, and delivery-attempt audit.';
$$;

REVOKE ALL ON FUNCTION public.get_digigram_migration_68_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_digigram_migration_68_status() TO authenticated;

DO $$
BEGIN
    IF to_regclass('public.schema_migrations') IS NOT NULL THEN
        INSERT INTO public.schema_migrations (id, name, sql_file, notes)
        VALUES (
            '68',
            'SMS delivery monitoring and retry',
            'database/68_sms_delivery_monitoring.sql',
            'Atomic worker claims, retry scheduling, provider health, and delivery-attempt audit.'
        )
        ON CONFLICT (id) DO UPDATE
        SET
            name = EXCLUDED.name,
            sql_file = EXCLUDED.sql_file,
            notes = EXCLUDED.notes;
    END IF;
END $$;

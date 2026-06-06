-- DigiGram service SLA, escalation and private-data access audit
-- Safe to run more than once in Supabase SQL Editor.
-- Run after 30_service_request_workflow_hardening.sql and
-- 50_citizen_inbox_complaint_blood.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------------------------------------------------------
-- Service request SLA
-- -------------------------------------------------------------------------
ALTER TABLE public.service_requests
    ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sla_breached_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS escalation_level INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.service_request_sla_interval(
    request_kind TEXT,
    request_priority TEXT DEFAULT NULL
)
RETURNS INTERVAL
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN request_priority IN ('emergency', 'critical') THEN INTERVAL '1 day'
        WHEN request_priority IN ('urgent', 'high') THEN INTERVAL '2 days'
        WHEN request_kind = 'death_certificate' THEN INTERVAL '3 days'
        WHEN request_kind = 'birth_registration' THEN INTERVAL '7 days'
        WHEN request_kind = 'utility_request' THEN INTERVAL '5 days'
        ELSE INTERVAL '5 days'
    END;
$$;

CREATE OR REPLACE FUNCTION public.set_service_request_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.sla_due_at IS NULL
       OR (
           TG_OP = 'UPDATE'
           AND (
               NEW.request_type IS DISTINCT FROM OLD.request_type
               OR NEW.priority IS DISTINCT FROM OLD.priority
           )
       ) THEN
        NEW.sla_due_at := COALESCE(NEW.created_at, NOW())
            + public.service_request_sla_interval(NEW.request_type, NEW.priority);
    END IF;

    IF NEW.status IN ('completed', 'rejected', 'cancelled', 'closed') THEN
        RETURN NEW;
    END IF;

    IF NEW.sla_due_at < NOW() AND NEW.sla_breached_at IS NULL THEN
        NEW.sla_breached_at := NOW();
        NEW.escalation_level := GREATEST(NEW.escalation_level, 1);
        NEW.escalated_at := COALESCE(NEW.escalated_at, NOW());
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_service_request_sla ON public.service_requests;
CREATE TRIGGER trigger_set_service_request_sla
BEFORE INSERT OR UPDATE OF request_type, priority, status, sla_due_at
ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_service_request_sla();

UPDATE public.service_requests
SET sla_due_at = COALESCE(created_at, NOW())
    + public.service_request_sla_interval(request_type, priority)
WHERE sla_due_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_requests_sla_open
    ON public.service_requests(sla_due_at, status)
    WHERE status IN ('pending', 'processing', 'ready');

-- -------------------------------------------------------------------------
-- Complaint SLA
-- -------------------------------------------------------------------------
ALTER TABLE public.citizen_complaints
    ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS officer_note TEXT,
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sla_breached_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS escalation_level INTEGER NOT NULL DEFAULT 0;

-- Older installations may have the column without its validation constraint.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'citizen_complaints_priority_check'
          AND conrelid = 'public.citizen_complaints'::regclass
    ) THEN
        ALTER TABLE public.citizen_complaints
            ADD CONSTRAINT citizen_complaints_priority_check
            CHECK (priority IN ('low', 'normal', 'urgent', 'emergency'))
            NOT VALID;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.complaint_sla_interval(complaint_priority TEXT)
RETURNS INTERVAL
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE COALESCE(complaint_priority, 'normal')
        WHEN 'emergency' THEN INTERVAL '6 hours'
        WHEN 'urgent' THEN INTERVAL '1 day'
        WHEN 'low' THEN INTERVAL '7 days'
        ELSE INTERVAL '3 days'
    END;
$$;

CREATE OR REPLACE FUNCTION public.set_complaint_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.sla_due_at IS NULL
       OR (TG_OP = 'UPDATE' AND NEW.priority IS DISTINCT FROM OLD.priority) THEN
        NEW.sla_due_at := COALESCE(NEW.created_at, NOW())
            + public.complaint_sla_interval(NEW.priority);
    END IF;

    IF NEW.status NOT IN ('resolved', 'rejected')
       AND NEW.sla_due_at < NOW()
       AND NEW.sla_breached_at IS NULL THEN
        NEW.sla_breached_at := NOW();
        NEW.escalation_level := GREATEST(NEW.escalation_level, 1);
        NEW.escalated_at := COALESCE(NEW.escalated_at, NOW());
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_complaint_sla ON public.citizen_complaints;
CREATE TRIGGER trigger_set_complaint_sla
BEFORE INSERT OR UPDATE OF priority, status, sla_due_at
ON public.citizen_complaints
FOR EACH ROW
EXECUTE FUNCTION public.set_complaint_sla();

UPDATE public.citizen_complaints
SET sla_due_at = COALESCE(created_at, NOW())
    + public.complaint_sla_interval(priority)
WHERE sla_due_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_citizen_complaints_sla_open
    ON public.citizen_complaints(sla_due_at, status)
    WHERE status IN ('submitted', 'reviewing', 'assigned');

-- This function can be called by a scheduled Supabase cron job or by an
-- authenticated officer dashboard before loading its queue.
CREATE OR REPLACE FUNCTION public.refresh_service_sla_escalations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    service_count INTEGER := 0;
    complaint_count INTEGER := 0;
BEGIN
    UPDATE public.service_requests
    SET
        sla_breached_at = COALESCE(sla_breached_at, NOW()),
        escalated_at = COALESCE(escalated_at, NOW()),
        escalation_level = CASE
            WHEN NOW() > sla_due_at + INTERVAL '3 days' THEN 3
            WHEN NOW() > sla_due_at + INTERVAL '1 day' THEN 2
            ELSE GREATEST(escalation_level, 1)
        END
    WHERE status IN ('pending', 'processing', 'ready')
      AND sla_due_at < NOW();
    GET DIAGNOSTICS service_count = ROW_COUNT;

    UPDATE public.citizen_complaints
    SET
        sla_breached_at = COALESCE(sla_breached_at, NOW()),
        escalated_at = COALESCE(escalated_at, NOW()),
        escalation_level = CASE
            WHEN NOW() > sla_due_at + INTERVAL '3 days' THEN 3
            WHEN NOW() > sla_due_at + INTERVAL '1 day' THEN 2
            ELSE GREATEST(escalation_level, 1)
        END
    WHERE status IN ('submitted', 'reviewing', 'assigned')
      AND sla_due_at < NOW();
    GET DIAGNOSTICS complaint_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'service_requests', service_count,
        'complaints', complaint_count,
        'refreshed_at', NOW()
    );
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_service_sla_escalations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_service_sla_escalations() TO authenticated;

-- -------------------------------------------------------------------------
-- Private data access audit
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.data_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_role TEXT,
    citizen_phone TEXT,
    household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    action TEXT NOT NULL,
    access_channel TEXT NOT NULL DEFAULT 'web',
    ip_hash TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_access_logs_phone_created
    ON public.data_access_logs(citizen_phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_access_logs_household_created
    ON public.data_access_logs(household_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_access_logs_actor_created
    ON public.data_access_logs(actor_id, created_at DESC);

ALTER TABLE public.data_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Actors can read own access logs" ON public.data_access_logs;
CREATE POLICY "Actors can read own access logs"
ON public.data_access_logs FOR SELECT
TO authenticated
USING (
    actor_id = auth.uid()
    OR public.get_auth_role() = 'super_admin'
);

REVOKE ALL ON public.data_access_logs FROM anon;
GRANT SELECT ON public.data_access_logs TO authenticated;

COMMENT ON TABLE public.data_access_logs IS
    'Audit trail for citizen inbox, household locker and private document access.';

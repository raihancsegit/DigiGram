-- DigiGram officer scope, activity history, and SLA hardening
-- Safe to run more than once in Supabase SQL Editor.
-- Run after 55, 56, 63, 65, and 66.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------------------------------------------------------
-- Shared location scope check
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.location_is_in_auth_scope(target_location_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    WITH RECURSIVE ancestry AS (
        SELECT id, parent_id
        FROM public.locations
        WHERE id = target_location_id

        UNION ALL

        SELECT parent.id, parent.parent_id
        FROM public.locations parent
        JOIN ancestry child ON child.parent_id = parent.id
    )
    SELECT
        public.get_auth_role() = 'super_admin'
        OR EXISTS (
            SELECT 1
            FROM ancestry
            WHERE id = public.get_auth_scope_id()
        );
$$;

REVOKE ALL ON FUNCTION public.location_is_in_auth_scope(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.location_is_in_auth_scope(UUID) TO authenticated;

-- -------------------------------------------------------------------------
-- Appointment and life-support SLA
-- -------------------------------------------------------------------------
ALTER TABLE public.citizen_appointments
    ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sla_breached_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS escalation_level INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.citizen_life_support_cases
    ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sla_breached_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS escalation_level INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.citizen_queue_sla_interval(queue_priority TEXT)
RETURNS INTERVAL
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE COALESCE(queue_priority, 'normal')
        WHEN 'emergency' THEN INTERVAL '6 hours'
        WHEN 'urgent' THEN INTERVAL '1 day'
        WHEN 'low' THEN INTERVAL '7 days'
        ELSE INTERVAL '3 days'
    END;
$$;

CREATE OR REPLACE FUNCTION public.set_citizen_queue_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.sla_due_at IS NULL
       OR (TG_OP = 'UPDATE' AND NEW.priority IS DISTINCT FROM OLD.priority) THEN
        NEW.sla_due_at := COALESCE(NEW.created_at, NOW())
            + public.citizen_queue_sla_interval(NEW.priority);
    END IF;

    IF NEW.status NOT IN ('completed', 'rejected', 'no_show')
       AND NEW.sla_due_at < NOW()
       AND NEW.sla_breached_at IS NULL THEN
        NEW.sla_breached_at := NOW();
        NEW.escalation_level := GREATEST(NEW.escalation_level, 1);
        NEW.escalated_at := COALESCE(NEW.escalated_at, NOW());
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_appointment_sla ON public.citizen_appointments;
CREATE TRIGGER trigger_set_appointment_sla
BEFORE INSERT OR UPDATE OF priority, status, sla_due_at
ON public.citizen_appointments
FOR EACH ROW EXECUTE FUNCTION public.set_citizen_queue_sla();

DROP TRIGGER IF EXISTS trigger_set_life_support_sla ON public.citizen_life_support_cases;
CREATE TRIGGER trigger_set_life_support_sla
BEFORE INSERT OR UPDATE OF priority, status, sla_due_at
ON public.citizen_life_support_cases
FOR EACH ROW EXECUTE FUNCTION public.set_citizen_queue_sla();

UPDATE public.citizen_appointments
SET sla_due_at = COALESCE(created_at, NOW())
    + public.citizen_queue_sla_interval(priority)
WHERE sla_due_at IS NULL;

UPDATE public.citizen_life_support_cases
SET sla_due_at = COALESCE(created_at, NOW())
    + public.citizen_queue_sla_interval(priority)
WHERE sla_due_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_citizen_appointments_sla_open
    ON public.citizen_appointments(sla_due_at, status)
    WHERE status IN ('submitted', 'reviewing', 'scheduled');

CREATE INDEX IF NOT EXISTS idx_citizen_life_support_sla_open
    ON public.citizen_life_support_cases(sla_due_at, status)
    WHERE status IN ('submitted', 'reviewing', 'assigned', 'scheduled');

-- -------------------------------------------------------------------------
-- Officer activity history
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.officer_activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL CHECK (
        source_type IN ('citizen_appointment', 'citizen_life_support_case')
    ),
    source_id UUID NOT NULL,
    assigned_scope_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_role TEXT,
    actor_name TEXT,
    action TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT,
    note TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_officer_activity_source
    ON public.officer_activity_events(source_type, source_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_officer_activity_scope
    ON public.officer_activity_events(assigned_scope_id, created_at DESC);

ALTER TABLE public.officer_activity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Scoped officers can read officer activity" ON public.officer_activity_events;
CREATE POLICY "Scoped officers can read officer activity"
ON public.officer_activity_events FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() IN ('chairman', 'ward_member')
        AND assigned_scope_id IS NOT NULL
        AND public.location_is_in_auth_scope(assigned_scope_id)
    )
);

REVOKE ALL ON public.officer_activity_events FROM anon;
GRANT SELECT ON public.officer_activity_events TO authenticated;

-- -------------------------------------------------------------------------
-- Queue row-level security
-- Public submission continues through the server API using the service role.
-- -------------------------------------------------------------------------
ALTER TABLE public.citizen_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizen_life_support_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Scoped officers can read appointments" ON public.citizen_appointments;
CREATE POLICY "Scoped officers can read appointments"
ON public.citizen_appointments FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() IN ('chairman', 'ward_member')
        AND assigned_scope_id IS NOT NULL
        AND public.location_is_in_auth_scope(assigned_scope_id)
    )
);

DROP POLICY IF EXISTS "Scoped officers can update appointments" ON public.citizen_appointments;
CREATE POLICY "Scoped officers can update appointments"
ON public.citizen_appointments FOR UPDATE
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() IN ('chairman', 'ward_member')
        AND assigned_scope_id IS NOT NULL
        AND public.location_is_in_auth_scope(assigned_scope_id)
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() IN ('chairman', 'ward_member')
        AND assigned_scope_id IS NOT NULL
        AND public.location_is_in_auth_scope(assigned_scope_id)
    )
);

DROP POLICY IF EXISTS "Scoped officers can read life support cases" ON public.citizen_life_support_cases;
CREATE POLICY "Scoped officers can read life support cases"
ON public.citizen_life_support_cases FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() IN ('chairman', 'ward_member')
        AND assigned_scope_id IS NOT NULL
        AND public.location_is_in_auth_scope(assigned_scope_id)
    )
);

DROP POLICY IF EXISTS "Scoped officers can update life support cases" ON public.citizen_life_support_cases;
CREATE POLICY "Scoped officers can update life support cases"
ON public.citizen_life_support_cases FOR UPDATE
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() IN ('chairman', 'ward_member')
        AND assigned_scope_id IS NOT NULL
        AND public.location_is_in_auth_scope(assigned_scope_id)
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() IN ('chairman', 'ward_member')
        AND assigned_scope_id IS NOT NULL
        AND public.location_is_in_auth_scope(assigned_scope_id)
    )
);

REVOKE ALL ON public.citizen_appointments FROM anon;
REVOKE ALL ON public.citizen_life_support_cases FROM anon;
GRANT SELECT, UPDATE ON public.citizen_appointments TO authenticated;
GRANT SELECT, UPDATE ON public.citizen_life_support_cases TO authenticated;

-- -------------------------------------------------------------------------
-- Refresh all citizen-service escalation levels
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_service_sla_escalations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    service_count INTEGER := 0;
    complaint_count INTEGER := 0;
    appointment_count INTEGER := 0;
    life_support_count INTEGER := 0;
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

    UPDATE public.citizen_appointments
    SET
        sla_breached_at = COALESCE(sla_breached_at, NOW()),
        escalated_at = COALESCE(escalated_at, NOW()),
        escalation_level = CASE
            WHEN NOW() > sla_due_at + INTERVAL '3 days' THEN 3
            WHEN NOW() > sla_due_at + INTERVAL '1 day' THEN 2
            ELSE GREATEST(escalation_level, 1)
        END
    WHERE status IN ('submitted', 'reviewing', 'scheduled')
      AND sla_due_at < NOW();
    GET DIAGNOSTICS appointment_count = ROW_COUNT;

    UPDATE public.citizen_life_support_cases
    SET
        sla_breached_at = COALESCE(sla_breached_at, NOW()),
        escalated_at = COALESCE(escalated_at, NOW()),
        escalation_level = CASE
            WHEN NOW() > sla_due_at + INTERVAL '3 days' THEN 3
            WHEN NOW() > sla_due_at + INTERVAL '1 day' THEN 2
            ELSE GREATEST(escalation_level, 1)
        END
    WHERE status IN ('submitted', 'reviewing', 'assigned', 'scheduled')
      AND sla_due_at < NOW();
    GET DIAGNOSTICS life_support_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'service_requests', service_count,
        'complaints', complaint_count,
        'appointments', appointment_count,
        'life_support', life_support_count,
        'refreshed_at', NOW()
    );
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_service_sla_escalations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_service_sla_escalations() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_digigram_migration_67_status()
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
        '67'::TEXT,
        'Officer scope, activity, and SLA'::TEXT,
        'database/67_officer_scope_activity_sla.sql'::TEXT,
        (
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
            )
        ),
        'RLS, officer activity history, and SLA escalation for citizen queues.'::TEXT;
$$;

REVOKE ALL ON FUNCTION public.get_digigram_migration_67_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_digigram_migration_67_status() TO authenticated;

DO $$
BEGIN
    IF to_regclass('public.schema_migrations') IS NOT NULL THEN
        INSERT INTO public.schema_migrations (id, name, sql_file, notes)
        VALUES (
            '67',
            'Officer scope, activity, and SLA',
            'database/67_officer_scope_activity_sla.sql',
            'RLS, activity history, and SLA escalation for appointments and life-support cases.'
        )
        ON CONFLICT (id) DO UPDATE
        SET
            name = EXCLUDED.name,
            sql_file = EXCLUDED.sql_file,
            notes = EXCLUDED.notes;
    END IF;
END $$;

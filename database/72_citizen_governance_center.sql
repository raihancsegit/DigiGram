-- DigiGram citizen governance center
-- Safe to run more than once after database/71_duplicate_citizen_review.sql.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.residents
    ADD COLUMN IF NOT EXISTS merged_into_resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS merged_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS merged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_residents_merged_into
    ON public.residents(merged_into_resident_id)
    WHERE merged_into_resident_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.citizen_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL,
    household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
    consent_type TEXT NOT NULL CHECK (
        consent_type IN ('data_processing', 'document_access', 'sms_service', 'sms_marketing')
    ),
    granted BOOLEAN NOT NULL DEFAULT FALSE,
    source TEXT NOT NULL DEFAULT 'citizen_portal',
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(phone, consent_type)
);

CREATE INDEX IF NOT EXISTS idx_citizen_consents_phone
    ON public.citizen_consents(phone, consent_type);

CREATE TABLE IF NOT EXISTS public.officer_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_token_hash TEXT NOT NULL UNIQUE,
    device_name TEXT,
    platform TEXT,
    user_agent TEXT,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_officer_devices_profile
    ON public.officer_devices(profile_id, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS public.citizen_merge_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    duplicate_review_id UUID REFERENCES public.duplicate_citizen_reviews(id) ON DELETE SET NULL,
    primary_resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
    duplicate_resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
    backup_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'completed'
        CHECK (status IN ('completed', 'rolled_back', 'failed')),
    note TEXT,
    merged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    merged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rolled_back_at TIMESTAMPTZ,
    rolled_back_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_citizen_merge_events_status
    ON public.citizen_merge_events(status, merged_at DESC);

CREATE TABLE IF NOT EXISTS public.sms_automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'service',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    cooldown_hours INTEGER NOT NULL DEFAULT 24 CHECK (cooldown_hours BETWEEN 1 AND 8760),
    template_text TEXT,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.sms_automation_rules
    (rule_key, title, description, trigger_type, category, cooldown_hours)
VALUES
    ('service_ready', 'Application ready SMS', 'Collection date সহ নাগরিককে জানাবে।', 'service_status_ready', 'service', 12),
    ('service_processing', 'Application processing update', 'আবেদন processing হলে নাগরিককে update দেবে।', 'service_status_processing', 'service', 12),
    ('tax_due', 'Tax due reminder', 'Due বা partial household tax-এর reminder।', 'monthly_tax_due', 'tax', 720),
    ('low_completeness', 'Citizen data reminder', 'NID, জন্ম নিবন্ধন বা blood group missing reminder।', 'household_score_low', 'household', 720),
    ('women_support', 'Women support follow-up', 'Eligible support candidate-এর follow-up।', 'women_support_candidate', 'support', 168),
    ('sla_escalation', 'SLA escalation alert', 'Deadline অতিক্রম করা request officer-কে জানাবে।', 'sla_overdue', 'operations', 24)
ON CONFLICT (rule_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.system_recovery_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_type TEXT NOT NULL DEFAULT 'health_summary',
    label TEXT,
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('creating', 'ready', 'failed')),
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_recovery_snapshots_created
    ON public.system_recovery_snapshots(created_at DESC);

CREATE OR REPLACE FUNCTION public.merge_duplicate_resident(
    target_review_id UUID,
    target_primary_resident_id UUID,
    target_duplicate_resident_id UUID,
    actor_id UUID,
    merge_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    review_row public.duplicate_citizen_reviews%ROWTYPE;
    event_id UUID;
    backup JSONB;
BEGIN
    IF target_primary_resident_id = target_duplicate_resident_id THEN
        RAISE EXCEPTION 'Primary and duplicate resident must be different';
    END IF;

    SELECT * INTO review_row
    FROM public.duplicate_citizen_reviews
    WHERE id = target_review_id
    FOR UPDATE;

    IF NOT FOUND OR review_row.decision <> 'confirmed_duplicate' THEN
        RAISE EXCEPTION 'Duplicate review must be confirmed first';
    END IF;

    IF NOT target_primary_resident_id = ANY(review_row.resident_ids)
       OR NOT target_duplicate_resident_id = ANY(review_row.resident_ids) THEN
        RAISE EXCEPTION 'Residents do not belong to the reviewed duplicate group';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.residents
        WHERE id = target_duplicate_resident_id
          AND merged_into_resident_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Duplicate resident is already merged';
    END IF;

    SELECT jsonb_build_object(
        'service_request_ids', COALESCE((
            SELECT jsonb_agg(id) FROM public.service_requests
            WHERE resident_id = target_duplicate_resident_id
        ), '[]'::jsonb),
        'father_reference_ids', COALESCE((
            SELECT jsonb_agg(id) FROM public.residents
            WHERE father_id = target_duplicate_resident_id
        ), '[]'::jsonb),
        'mother_reference_ids', COALESCE((
            SELECT jsonb_agg(id) FROM public.residents
            WHERE mother_id = target_duplicate_resident_id
        ), '[]'::jsonb),
        'spouse_reference_ids', COALESCE((
            SELECT jsonb_agg(id) FROM public.residents
            WHERE spouse_id = target_duplicate_resident_id
        ), '[]'::jsonb)
    ) INTO backup;

    UPDATE public.service_requests
    SET resident_id = target_primary_resident_id
    WHERE resident_id = target_duplicate_resident_id;

    UPDATE public.residents SET father_id = target_primary_resident_id
    WHERE father_id = target_duplicate_resident_id;
    UPDATE public.residents SET mother_id = target_primary_resident_id
    WHERE mother_id = target_duplicate_resident_id;
    UPDATE public.residents SET spouse_id = target_primary_resident_id
    WHERE spouse_id = target_duplicate_resident_id;

    UPDATE public.residents
    SET merged_into_resident_id = target_primary_resident_id,
        merged_at = NOW(),
        merged_by = actor_id
    WHERE id = target_duplicate_resident_id;

    INSERT INTO public.citizen_merge_events (
        duplicate_review_id, primary_resident_id, duplicate_resident_id,
        backup_payload, note, merged_by
    )
    VALUES (
        target_review_id, target_primary_resident_id, target_duplicate_resident_id,
        backup, merge_note, actor_id
    )
    RETURNING id INTO event_id;

    RETURN event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rollback_duplicate_resident_merge(
    target_event_id UUID,
    actor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    event_row public.citizen_merge_events%ROWTYPE;
BEGIN
    SELECT * INTO event_row
    FROM public.citizen_merge_events
    WHERE id = target_event_id
    FOR UPDATE;

    IF NOT FOUND OR event_row.status <> 'completed' THEN
        RAISE EXCEPTION 'Active merge event not found';
    END IF;

    UPDATE public.service_requests
    SET resident_id = event_row.duplicate_resident_id
    WHERE id IN (
        SELECT value::uuid
        FROM jsonb_array_elements_text(event_row.backup_payload->'service_request_ids')
    );

    UPDATE public.residents SET father_id = event_row.duplicate_resident_id
    WHERE id IN (
        SELECT value::uuid
        FROM jsonb_array_elements_text(event_row.backup_payload->'father_reference_ids')
    );
    UPDATE public.residents SET mother_id = event_row.duplicate_resident_id
    WHERE id IN (
        SELECT value::uuid
        FROM jsonb_array_elements_text(event_row.backup_payload->'mother_reference_ids')
    );
    UPDATE public.residents SET spouse_id = event_row.duplicate_resident_id
    WHERE id IN (
        SELECT value::uuid
        FROM jsonb_array_elements_text(event_row.backup_payload->'spouse_reference_ids')
    );

    UPDATE public.residents
    SET merged_into_resident_id = NULL,
        merged_at = NULL,
        merged_by = NULL
    WHERE id = event_row.duplicate_resident_id
      AND merged_into_resident_id = event_row.primary_resident_id;

    UPDATE public.citizen_merge_events
    SET status = 'rolled_back',
        rolled_back_at = NOW(),
        rolled_back_by = actor_id
    WHERE id = target_event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.merge_duplicate_resident(UUID, UUID, UUID, UUID, TEXT)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rollback_duplicate_resident_merge(UUID, UUID)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.merge_duplicate_resident(UUID, UUID, UUID, UUID, TEXT)
    TO service_role;
GRANT EXECUTE ON FUNCTION public.rollback_duplicate_resident_merge(UUID, UUID)
    TO service_role;

ALTER TABLE public.citizen_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officer_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizen_merge_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_recovery_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage governance consents" ON public.citizen_consents;
CREATE POLICY "Super admins manage governance consents"
ON public.citizen_consents FOR ALL TO authenticated
USING (public.get_auth_role() = 'super_admin')
WITH CHECK (public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "Officers read own devices" ON public.officer_devices;
CREATE POLICY "Officers read own devices"
ON public.officer_devices FOR SELECT TO authenticated
USING (profile_id = auth.uid() OR public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "Super admins manage officer devices" ON public.officer_devices;
CREATE POLICY "Super admins manage officer devices"
ON public.officer_devices FOR ALL TO authenticated
USING (public.get_auth_role() = 'super_admin')
WITH CHECK (public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "Super admins manage citizen merges" ON public.citizen_merge_events;
CREATE POLICY "Super admins manage citizen merges"
ON public.citizen_merge_events FOR ALL TO authenticated
USING (public.get_auth_role() = 'super_admin')
WITH CHECK (public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "Super admins manage SMS automation" ON public.sms_automation_rules;
CREATE POLICY "Super admins manage SMS automation"
ON public.sms_automation_rules FOR ALL TO authenticated
USING (public.get_auth_role() = 'super_admin')
WITH CHECK (public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "Super admins manage recovery snapshots" ON public.system_recovery_snapshots;
CREATE POLICY "Super admins manage recovery snapshots"
ON public.system_recovery_snapshots FOR ALL TO authenticated
USING (public.get_auth_role() = 'super_admin')
WITH CHECK (public.get_auth_role() = 'super_admin');

COMMENT ON TABLE public.citizen_merge_events IS
    'Reversible, audited duplicate-resident merges. Duplicate rows are archived, never deleted automatically.';
COMMENT ON TABLE public.system_recovery_snapshots IS
    'Database health and record-count snapshots for recovery readiness. Supabase PITR remains the full backup layer.';

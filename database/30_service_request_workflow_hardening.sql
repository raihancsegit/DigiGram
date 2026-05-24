-- DigiGram service request workflow hardening
-- Safe to run more than once in Supabase SQL Editor.
-- Purpose:
-- 1. keep citizen service status fields available
-- 2. prevent duplicate SMS queue rows for the same request/status
-- 3. keep fast indexes for ward/union dashboards

ALTER TABLE service_requests
    ADD COLUMN IF NOT EXISTS contact_phone TEXT,
    ADD COLUMN IF NOT EXISTS collection_date DATE,
    ADD COLUMN IF NOT EXISTS feedback TEXT,
    ADD COLUMN IF NOT EXISTS certificate_no TEXT,
    ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS collected_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_service_requests_status_created
    ON service_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_requests_household_status_created
    ON service_requests(household_id, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_service_requests_certificate_no
    ON service_requests(certificate_no)
    WHERE certificate_no IS NOT NULL;

CREATE TABLE IF NOT EXISTS service_request_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    actor_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_request_events_request_created
    ON service_request_events(service_request_id, created_at DESC);

CREATE TABLE IF NOT EXISTS service_request_sms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    event_key TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
    provider_message_id TEXT,
    error_message TEXT,
    queued_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_service_request_sms_event
    ON service_request_sms(service_request_id, event_key);

CREATE INDEX IF NOT EXISTS idx_service_request_sms_status_queued
    ON service_request_sms(status, queued_at DESC);

ALTER TABLE service_request_sms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Scoped officers can read service request sms" ON service_request_sms;
CREATE POLICY "Scoped officers can read service request sms"
ON service_request_sms FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM service_requests sr
        JOIN households h ON h.id = sr.household_id
        JOIN locations w ON w.id = h.ward_id
        WHERE sr.id = service_request_sms.service_request_id
          AND (
            public.get_auth_role() = 'super_admin'
            OR (public.get_auth_role() = 'chairman' AND w.parent_id = public.get_auth_scope_id())
            OR (public.get_auth_role() = 'ward_member' AND h.ward_id = public.get_auth_scope_id())
          )
    )
);

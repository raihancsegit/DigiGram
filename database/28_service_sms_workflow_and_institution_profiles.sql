-- DigiGram service SMS workflow + institution profile foundation
-- Safe to run more than once after the household service migrations.

ALTER TABLE institutions
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS portal_features JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS operational_settings JSONB DEFAULT '{}'::jsonb;

UPDATE institutions
SET category = CASE
    WHEN type = 'mosque' THEN 'mosque'
    WHEN type = 'college' THEN 'college'
    WHEN type = 'madrasa' THEN 'alim_madrasa'
    WHEN type = 'school' THEN 'high_school'
    ELSE type::text
END
WHERE category IS NULL;

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

CREATE INDEX IF NOT EXISTS idx_service_request_sms_request_id
    ON service_request_sms(service_request_id, queued_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_request_sms_status
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

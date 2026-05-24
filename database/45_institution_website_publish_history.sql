-- DigiGram institution website publish history + rollback snapshots
-- Safe to run more than once after 44_institution_website_draft_publish.sql.

CREATE TABLE IF NOT EXISTS institution_page_publish_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    content_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    theme_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    published_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_institution_page_publish_history_institution
    ON institution_page_publish_history(institution_id, published_at DESC);

ALTER TABLE institution_page_publish_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Scoped institution admins can read publish history" ON institution_page_publish_history;
CREATE POLICY "Scoped institution admins can read publish history"
ON institution_page_publish_history FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = institution_page_publish_history.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role = 'admin'
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Scoped institution admins can create publish history" ON institution_page_publish_history;
CREATE POLICY "Scoped institution admins can create publish history"
ON institution_page_publish_history FOR INSERT
TO authenticated
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = institution_page_publish_history.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role = 'admin'
          AND im.is_active = TRUE
    )
);

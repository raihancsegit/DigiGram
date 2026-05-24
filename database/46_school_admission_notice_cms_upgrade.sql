-- DigiGram school admission, notice review, and website content upgrade.
-- Safe to run more than once after 45_institution_website_publish_history.sql.

CREATE TABLE IF NOT EXISTS school_admission_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_name_en TEXT,
    date_of_birth DATE,
    gender TEXT,
    desired_class TEXT NOT NULL,
    previous_institution TEXT,
    guardian_name TEXT NOT NULL,
    guardian_phone TEXT NOT NULL,
    guardian_email TEXT,
    address TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'admitted')),
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_admission_applications_institution_status
    ON school_admission_applications(institution_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_school_admission_applications_guardian_phone
    ON school_admission_applications(guardian_phone);

CREATE OR REPLACE FUNCTION public.touch_school_admission_application()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_touch_school_admission_application
    ON school_admission_applications;
CREATE TRIGGER trigger_touch_school_admission_application
    BEFORE UPDATE ON school_admission_applications
    FOR EACH ROW EXECUTE FUNCTION public.touch_school_admission_application();

ALTER TABLE school_admission_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Institution admins can read admission applications"
    ON school_admission_applications;
CREATE POLICY "Institution admins can read admission applications"
ON school_admission_applications FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_admission_applications.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role = 'admin'
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Institution admins can update admission applications"
    ON school_admission_applications;
CREATE POLICY "Institution admins can update admission applications"
ON school_admission_applications FOR UPDATE
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_admission_applications.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role = 'admin'
          AND im.is_active = TRUE
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_admission_applications.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role = 'admin'
          AND im.is_active = TRUE
    )
);

ALTER TABLE institution_notices
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Older school themes were created before "admission" existed in the school menu.
-- Keep their configured order but append admission so the public form is reachable.
UPDATE institutions
SET theme = jsonb_set(
    COALESCE(theme, '{}'::jsonb),
    '{menu_items}',
    COALESCE(theme->'menu_items', '[]'::jsonb) || '["admission"]'::jsonb,
    TRUE
)
WHERE category IN ('school', 'primary_school', 'high_school', 'college', 'dakhil_madrasa', 'alim_madrasa', 'kindergarten')
  AND NOT (COALESCE(theme->'menu_items', '[]'::jsonb) ? 'admission');

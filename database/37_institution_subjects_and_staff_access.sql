-- DigiGram institution subject management + staff directory access
-- Safe to run more than once after 36_school_class_grade_structure.sql.

ALTER TABLE institution_memberships
    ADD COLUMN IF NOT EXISTS display_name TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_school_subject_per_class
    ON school_subjects(institution_id, class_id, lower(name));

CREATE OR REPLACE FUNCTION public.is_institution_admin(target_institution_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM institution_memberships
        WHERE institution_id = target_institution_id
          AND profile_id = auth.uid()
          AND member_role = 'admin'
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "Institution admins can read own members" ON institution_memberships;
CREATE POLICY "Institution admins can read own members"
ON institution_memberships FOR SELECT
TO authenticated
USING (
    profile_id = auth.uid()
    OR public.get_auth_role() = 'super_admin'
    OR public.is_institution_admin(institution_memberships.institution_id)
);

DROP POLICY IF EXISTS "Institution admins can manage own members" ON institution_memberships;
CREATE POLICY "Institution admins can manage own members"
ON institution_memberships FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR public.is_institution_admin(institution_memberships.institution_id)
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR public.is_institution_admin(institution_memberships.institution_id)
);

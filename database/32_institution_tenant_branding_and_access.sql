-- DigiGram institution tenant branding + exact portal access
-- Safe to run more than once after 31_institution_portal_core.sql.

ALTER TABLE institution_pages
    ADD COLUMN IF NOT EXISTS principal_message TEXT,
    ADD COLUMN IF NOT EXISTS admission_text TEXT,
    ADD COLUMN IF NOT EXISTS result_text TEXT;

CREATE INDEX IF NOT EXISTS idx_institution_memberships_profile_institution
    ON institution_memberships(profile_id, institution_id, member_role)
    WHERE is_active = TRUE;

-- Keep branding and menu defaults available for older institutions too.
UPDATE institutions
SET theme = jsonb_strip_nulls(
    COALESCE(theme, '{}'::jsonb) ||
    jsonb_build_object(
        'preset', COALESCE(theme->>'preset', category),
        'primary_color', COALESCE(theme->>'primary_color',
            CASE
                WHEN category = 'primary_school' THEN '#0284c7'
                WHEN category = 'high_school' THEN '#0f766e'
                WHEN category = 'college' THEN '#4338ca'
                WHEN category = 'alim_madrasa' THEN '#059669'
                WHEN category = 'kindergarten' THEN '#e11d48'
                WHEN category = 'mosque' THEN '#047857'
                ELSE '#0f766e'
            END
        ),
        'font_family', COALESCE(theme->>'font_family', 'hind_siliguri'),
        'menu_items', COALESCE(
            theme->'menu_items',
            '["home","about","teachers","academics","results","notices","contact"]'::jsonb
        )
    )
)
WHERE theme IS NULL
   OR theme = '{}'::jsonb
   OR theme->>'primary_color' IS NULL
   OR theme->'menu_items' IS NULL;

-- School data must stay inside the exact institution membership.
ALTER TABLE school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Institution members can read own classes" ON school_classes;
CREATE POLICY "Institution members can read own classes"
ON school_classes FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_classes.institution_id
          AND im.profile_id = auth.uid()
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Institution admins can manage own classes" ON school_classes;
CREATE POLICY "Institution admins can manage own classes"
ON school_classes FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_classes.institution_id
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
        WHERE im.institution_id = school_classes.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role = 'admin'
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Institution members can read own students" ON school_students;
CREATE POLICY "Institution members can read own students"
ON school_students FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_students.institution_id
          AND im.profile_id = auth.uid()
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Institution admins can manage own students" ON school_students;
CREATE POLICY "Institution admins can manage own students"
ON school_students FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_students.institution_id
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
        WHERE im.institution_id = school_students.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role = 'admin'
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Institution staff can manage own subjects" ON school_subjects;
CREATE POLICY "Institution staff can manage own subjects"
ON school_subjects FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_subjects.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_subjects.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Institution staff can manage own attendance" ON school_attendance;
CREATE POLICY "Institution staff can manage own attendance"
ON school_attendance FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_attendance.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_attendance.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Institution staff can manage own lessons" ON school_lessons;
CREATE POLICY "Institution staff can manage own lessons"
ON school_lessons FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_lessons.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_lessons.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Institution staff can manage own lesson progress" ON school_lesson_progress;
CREATE POLICY "Institution staff can manage own lesson progress"
ON school_lesson_progress FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM school_lessons sl
        JOIN institution_memberships im ON im.institution_id = sl.institution_id
        WHERE sl.id = school_lesson_progress.lesson_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM school_lessons sl
        JOIN institution_memberships im ON im.institution_id = sl.institution_id
        WHERE sl.id = school_lesson_progress.lesson_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Institution members can read own results" ON school_results;
CREATE POLICY "Institution members can read own results"
ON school_results FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_results.institution_id
          AND im.profile_id = auth.uid()
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Institution staff can manage own results" ON school_results;
CREATE POLICY "Institution staff can manage own results"
ON school_results FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_results.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_results.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
);

-- DigiGram institution portal master migration
-- Run this once if 31_institution_portal_core.sql was not applied before 32.
-- Safe to run more than once.

-- -------------------------------------------------------------------------
-- Core institution portal tables
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS institution_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    hero_title TEXT,
    hero_subtitle TEXT,
    about_text TEXT,
    principal_message TEXT,
    admission_text TEXT,
    result_text TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    address TEXT,
    banner_image_url TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institution_id)
);

CREATE TABLE IF NOT EXISTS institution_notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    audience TEXT NOT NULL DEFAULT 'public'
        CHECK (audience IN ('public', 'teachers', 'students', 'guardians')),
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS institution_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    member_role TEXT NOT NULL CHECK (member_role IN ('admin', 'teacher', 'student')),
    title TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institution_id, profile_id, member_role)
);

ALTER TABLE institution_pages
    ADD COLUMN IF NOT EXISTS principal_message TEXT,
    ADD COLUMN IF NOT EXISTS admission_text TEXT,
    ADD COLUMN IF NOT EXISTS result_text TEXT;

ALTER TABLE school_students
    ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_institution_notices_institution_id
    ON institution_notices(institution_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_institution_memberships_institution_id
    ON institution_memberships(institution_id, member_role);

CREATE INDEX IF NOT EXISTS idx_institution_memberships_profile_institution
    ON institution_memberships(profile_id, institution_id, member_role)
    WHERE is_active = TRUE;

ALTER TABLE institution_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read institution pages" ON institution_pages;
CREATE POLICY "Public can read institution pages"
ON institution_pages FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public can read public institution notices" ON institution_notices;
CREATE POLICY "Public can read public institution notices"
ON institution_notices FOR SELECT
USING (audience = 'public');

DROP POLICY IF EXISTS "Scoped institution staff can manage pages" ON institution_pages;
CREATE POLICY "Scoped institution staff can manage pages"
ON institution_pages FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = institution_pages.institution_id
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
        WHERE im.institution_id = institution_pages.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role = 'admin'
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Scoped institution staff can manage notices" ON institution_notices;
CREATE POLICY "Scoped institution staff can manage notices"
ON institution_notices FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = institution_notices.institution_id
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
        WHERE im.institution_id = institution_notices.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Users can read own institution memberships" ON institution_memberships;
CREATE POLICY "Users can read own institution memberships"
ON institution_memberships FOR SELECT
TO authenticated
USING (
    profile_id = auth.uid()
    OR public.get_auth_role() = 'super_admin'
);

INSERT INTO institution_pages (institution_id, hero_title, hero_subtitle)
SELECT
    id,
    name,
    CASE
        WHEN category = 'mosque' THEN 'ইবাদত, দান ও স্বচ্ছ হিসাবের ডিজিটাল কেন্দ্র'
        ELSE 'শিক্ষার্থী, শিক্ষক ও অভিভাবকদের জন্য ডিজিটাল শিক্ষা প্ল্যাটফর্ম'
    END
FROM institutions
ON CONFLICT (institution_id) DO NOTHING;

-- -------------------------------------------------------------------------
-- Branding defaults
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- Exact institution portal data access
-- -------------------------------------------------------------------------
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
        SELECT 1 FROM institution_memberships im
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
        SELECT 1 FROM institution_memberships im
        WHERE im.institution_id = school_classes.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role = 'admin'
          AND im.is_active = TRUE
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1 FROM institution_memberships im
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
        SELECT 1 FROM institution_memberships im
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
        SELECT 1 FROM institution_memberships im
        WHERE im.institution_id = school_students.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role = 'admin'
          AND im.is_active = TRUE
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1 FROM institution_memberships im
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
        SELECT 1 FROM institution_memberships im
        WHERE im.institution_id = school_subjects.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1 FROM institution_memberships im
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
        SELECT 1 FROM institution_memberships im
        WHERE im.institution_id = school_attendance.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1 FROM institution_memberships im
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
        SELECT 1 FROM institution_memberships im
        WHERE im.institution_id = school_lessons.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1 FROM institution_memberships im
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
        SELECT 1 FROM institution_memberships im
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
        SELECT 1 FROM institution_memberships im
        WHERE im.institution_id = school_results.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1 FROM institution_memberships im
        WHERE im.institution_id = school_results.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
);

-- DigiGram school exam + subject result engine
-- Safe to run more than once after 37_institution_subjects_and_staff_access.sql.

CREATE TABLE IF NOT EXISTS school_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES school_classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    exam_date DATE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_exam_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES school_exams(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES school_classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES school_students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES school_subjects(id) ON DELETE CASCADE,
    total_marks DECIMAL(6,2) NOT NULL DEFAULT 100,
    obtained_marks DECIMAL(6,2),
    grade TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, student_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_school_exams_institution_class
    ON school_exams(institution_id, class_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_school_exam_entries_exam
    ON school_exam_entries(exam_id, student_id, subject_id);

ALTER TABLE school_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_exam_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Institution members can read own exams" ON school_exams;
CREATE POLICY "Institution members can read own exams"
ON school_exams FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_exams.institution_id
          AND im.profile_id = auth.uid()
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Institution staff can manage own exams" ON school_exams;
CREATE POLICY "Institution staff can manage own exams"
ON school_exams FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_exams.institution_id
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
        WHERE im.institution_id = school_exams.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Institution members can read own exam entries" ON school_exam_entries;
CREATE POLICY "Institution members can read own exam entries"
ON school_exam_entries FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_exam_entries.institution_id
          AND im.profile_id = auth.uid()
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Institution staff can manage own exam entries" ON school_exam_entries;
CREATE POLICY "Institution staff can manage own exam entries"
ON school_exam_entries FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_exam_entries.institution_id
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
        WHERE im.institution_id = school_exam_entries.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
);

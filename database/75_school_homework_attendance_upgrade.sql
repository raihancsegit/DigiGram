-- School study workflow upgrade: richer attendance + homework submission/review.
-- Safe to run after the school portal foundation migrations.

DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'school_attendance'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%status%'
    LOOP
        EXECUTE format('ALTER TABLE school_attendance DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END LOOP;
END $$;

ALTER TABLE school_attendance
    ALTER COLUMN status SET DEFAULT 'present',
    ADD CONSTRAINT school_attendance_status_check
        CHECK (status IN ('present', 'absent', 'late', 'leave', 'excused'));

ALTER TABLE school_attendance
    ADD COLUMN IF NOT EXISTS note TEXT,
    ADD COLUMN IF NOT EXISTS marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS school_homework_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES school_classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES school_subjects(id) ON DELETE SET NULL,
    lesson_id UUID NOT NULL REFERENCES school_lessons(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES school_students(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('assigned', 'submitted', 'reviewing', 'needs_revision', 'completed')),
    answer_text TEXT,
    file_url TEXT,
    teacher_note TEXT,
    score NUMERIC(6,2),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lesson_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_school_homework_submissions_lesson_status
    ON school_homework_submissions(lesson_id, status);

CREATE INDEX IF NOT EXISTS idx_school_homework_submissions_student_status
    ON school_homework_submissions(student_id, status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_school_homework_submissions_institution_class
    ON school_homework_submissions(institution_id, class_id, submitted_at DESC);

ALTER TABLE school_homework_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage own homework submissions" ON school_homework_submissions;
CREATE POLICY "Students can manage own homework submissions"
ON school_homework_submissions FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM school_students ss
        WHERE ss.id = school_homework_submissions.student_id
          AND ss.profile_id = auth.uid()
          AND ss.active = TRUE
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM school_students ss
        JOIN school_lessons sl ON sl.id = school_homework_submissions.lesson_id
        WHERE ss.id = school_homework_submissions.student_id
          AND ss.profile_id = auth.uid()
          AND ss.active = TRUE
          AND sl.institution_id = school_homework_submissions.institution_id
          AND sl.class_id = school_homework_submissions.class_id
    )
);

DROP POLICY IF EXISTS "Institution staff can manage homework submissions" ON school_homework_submissions;
CREATE POLICY "Institution staff can manage homework submissions"
ON school_homework_submissions FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_homework_submissions.institution_id
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
        WHERE im.institution_id = school_homework_submissions.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
);

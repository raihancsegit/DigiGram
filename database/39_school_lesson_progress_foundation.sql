-- DigiGram school lesson/topic progress foundation
-- Safe to run more than once after 38_school_exam_result_engine.sql.

ALTER TABLE school_lessons
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS homework TEXT,
    ADD COLUMN IF NOT EXISTS resource_url TEXT,
    ADD COLUMN IF NOT EXISTS source_image_url TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
        CHECK (status IN ('draft', 'published'));

ALTER TABLE school_lesson_progress
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_school_lessons_institution_class_date
    ON school_lessons(institution_id, class_id, lesson_date DESC);

CREATE INDEX IF NOT EXISTS idx_school_lessons_subject_date
    ON school_lessons(subject_id, lesson_date DESC);

CREATE INDEX IF NOT EXISTS idx_school_lesson_progress_student
    ON school_lesson_progress(student_id, created_at DESC);

DROP POLICY IF EXISTS "Institution members can read own lessons" ON school_lessons;
CREATE POLICY "Institution members can read own lessons"
ON school_lessons FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_lessons.institution_id
          AND im.profile_id = auth.uid()
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Institution students can read own lesson progress" ON school_lesson_progress;
CREATE POLICY "Institution students can read own lesson progress"
ON school_lesson_progress FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM school_students ss
        WHERE ss.id = school_lesson_progress.student_id
          AND ss.profile_id = auth.uid()
    )
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

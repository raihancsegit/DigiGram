-- DigiGram school portal runtime repairs
-- Safe to run more than once after 29_sms_platform_and_school_foundation.sql.
-- Use this when teacher/student/guardian topic flow exists in the app but Supabase
-- still blocks progress saves or misses lesson metadata columns.

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

CREATE INDEX IF NOT EXISTS idx_school_lesson_progress_student_lesson
    ON school_lesson_progress(student_id, lesson_id);

ALTER TABLE school_lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage own lesson progress" ON school_lesson_progress;
CREATE POLICY "Students can manage own lesson progress"
ON school_lesson_progress FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM school_students ss
        JOIN school_lessons sl ON sl.id = school_lesson_progress.lesson_id
        WHERE ss.id = school_lesson_progress.student_id
          AND ss.profile_id = auth.uid()
          AND ss.active = TRUE
          AND sl.institution_id = ss.institution_id
          AND sl.class_id = ss.class_id
          AND sl.status = 'published'
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM school_students ss
        JOIN school_lessons sl ON sl.id = school_lesson_progress.lesson_id
        WHERE ss.id = school_lesson_progress.student_id
          AND ss.profile_id = auth.uid()
          AND ss.active = TRUE
          AND sl.institution_id = ss.institution_id
          AND sl.class_id = ss.class_id
          AND sl.status = 'published'
    )
);

-- DigiGram school student lesson self-progress
-- Safe to run more than once after 40_school_lesson_quiz_engine.sql.
-- Students can mark their own class topic as completed or not completed from the student portal.

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

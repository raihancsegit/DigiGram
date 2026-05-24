-- DigiGram school lesson mini quiz engine
-- Safe to run more than once after 39_school_lesson_progress_foundation.sql.

CREATE TABLE IF NOT EXISTS school_lesson_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES school_lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Topic check',
    passing_score INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lesson_id)
);

CREATE TABLE IF NOT EXISTS school_lesson_quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES school_lesson_quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT,
    option_d TEXT,
    correct_option TEXT NOT NULL CHECK (correct_option IN ('a', 'b', 'c', 'd')),
    explanation TEXT,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_lesson_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES school_lesson_quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES school_students(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    score INTEGER NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(quiz_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_school_lesson_quiz_questions_quiz
    ON school_lesson_quiz_questions(quiz_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_school_lesson_quiz_attempts_student
    ON school_lesson_quiz_attempts(student_id, submitted_at DESC);

ALTER TABLE school_lesson_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_lesson_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_lesson_quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Institution members can read own lesson quizzes" ON school_lesson_quizzes;
CREATE POLICY "Institution members can read own lesson quizzes"
ON school_lesson_quizzes FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM school_lessons sl
        JOIN institution_memberships im ON im.institution_id = sl.institution_id
        WHERE sl.id = school_lesson_quizzes.lesson_id
          AND im.profile_id = auth.uid()
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Institution staff can manage own lesson quizzes" ON school_lesson_quizzes;
CREATE POLICY "Institution staff can manage own lesson quizzes"
ON school_lesson_quizzes FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM school_lessons sl
        JOIN institution_memberships im ON im.institution_id = sl.institution_id
        WHERE sl.id = school_lesson_quizzes.lesson_id
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
        WHERE sl.id = school_lesson_quizzes.lesson_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Institution members can read own lesson quiz questions" ON school_lesson_quiz_questions;
CREATE POLICY "Institution members can read own lesson quiz questions"
ON school_lesson_quiz_questions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM school_lesson_quizzes q
        JOIN school_lessons sl ON sl.id = q.lesson_id
        JOIN institution_memberships im ON im.institution_id = sl.institution_id
        WHERE q.id = school_lesson_quiz_questions.quiz_id
          AND im.profile_id = auth.uid()
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Institution staff can manage own lesson quiz questions" ON school_lesson_quiz_questions;
CREATE POLICY "Institution staff can manage own lesson quiz questions"
ON school_lesson_quiz_questions FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM school_lesson_quizzes q
        JOIN school_lessons sl ON sl.id = q.lesson_id
        JOIN institution_memberships im ON im.institution_id = sl.institution_id
        WHERE q.id = school_lesson_quiz_questions.quiz_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM school_lesson_quizzes q
        JOIN school_lessons sl ON sl.id = q.lesson_id
        JOIN institution_memberships im ON im.institution_id = sl.institution_id
        WHERE q.id = school_lesson_quiz_questions.quiz_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Students can read own quiz attempts" ON school_lesson_quiz_attempts;
CREATE POLICY "Students can read own quiz attempts"
ON school_lesson_quiz_attempts FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM school_students ss
        WHERE ss.id = school_lesson_quiz_attempts.student_id
          AND ss.profile_id = auth.uid()
    )
    OR public.get_auth_role() = 'super_admin'
);

DROP POLICY IF EXISTS "Students can submit own quiz attempts" ON school_lesson_quiz_attempts;
CREATE POLICY "Students can submit own quiz attempts"
ON school_lesson_quiz_attempts FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM school_students ss
        WHERE ss.id = school_lesson_quiz_attempts.student_id
          AND ss.profile_id = auth.uid()
    )
    OR public.get_auth_role() = 'super_admin'
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM school_students ss
        WHERE ss.id = school_lesson_quiz_attempts.student_id
          AND ss.profile_id = auth.uid()
    )
    OR public.get_auth_role() = 'super_admin'
);

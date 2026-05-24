-- DigiGram school usability + safety upgrade
-- Safe to run more than once after 39-42.
-- Adds soft delete support, audit trail, and teacher-owned lesson edit/delete policies.

ALTER TABLE school_lessons
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'school_lessons_status_check'
    ) THEN
        ALTER TABLE school_lessons
            ADD CONSTRAINT school_lessons_status_check
            CHECK (status IN ('draft', 'published', 'archived'));
    ELSE
        ALTER TABLE school_lessons DROP CONSTRAINT IF EXISTS school_lessons_status_check;
        ALTER TABLE school_lessons
            ADD CONSTRAINT school_lessons_status_check
            CHECK (status IN ('draft', 'published', 'archived'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_school_lessons_active_lookup
    ON school_lessons(institution_id, class_id, subject_id, lesson_date DESC)
    WHERE deleted_at IS NULL AND status <> 'archived';

CREATE TABLE IF NOT EXISTS school_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    action TEXT NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    before_data JSONB,
    after_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_audit_logs_institution
    ON school_audit_logs(institution_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.audit_school_lesson_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO school_audit_logs (
            institution_id,
            entity_type,
            entity_id,
            action,
            actor_id,
            before_data,
            after_data
        )
        VALUES (
            NEW.institution_id,
            'school_lesson',
            NEW.id,
            CASE WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN 'soft_delete' ELSE 'update' END,
            auth.uid(),
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        NEW.updated_at = NOW();
        IF NEW.deleted_at IS NOT NULL AND NEW.deleted_by IS NULL THEN
            NEW.deleted_by = auth.uid();
        END IF;
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_school_lesson_change ON school_lessons;
CREATE TRIGGER trigger_audit_school_lesson_change
    BEFORE UPDATE ON school_lessons
    FOR EACH ROW EXECUTE FUNCTION public.audit_school_lesson_change();

ALTER TABLE school_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teacher can update own school lessons" ON school_lessons;
CREATE POLICY "Teacher can update own school lessons"
ON school_lessons FOR UPDATE
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR teacher_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_lessons.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role = 'admin'
          AND im.is_active = TRUE
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR teacher_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_lessons.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role = 'admin'
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Teacher can insert own school lessons" ON school_lessons;
CREATE POLICY "Teacher can insert own school lessons"
ON school_lessons FOR INSERT
TO authenticated
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR teacher_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = school_lessons.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
);

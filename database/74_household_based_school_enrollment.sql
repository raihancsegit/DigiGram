-- DigiGram household-based school enrollment.
-- Safe to run more than once after household_schema.sql and school portal migrations.

ALTER TABLE school_students
    ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS resident_id UUID REFERENCES residents(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS enrollment_source TEXT NOT NULL DEFAULT 'school_admin'
        CHECK (enrollment_source IN ('school_admin', 'household_profile', 'public_admission', 'migration')),
    ADD COLUMN IF NOT EXISTS enrollment_status TEXT NOT NULL DEFAULT 'studying'
        CHECK (enrollment_status IN ('applied', 'studying', 'transferred', 'completed', 'dropped')),
    ADD COLUMN IF NOT EXISTS admission_application_id UUID REFERENCES school_admission_applications(id) ON DELETE SET NULL;

ALTER TABLE school_admission_applications
    ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS resident_id UUID REFERENCES residents(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'public_form'
        CHECK (source IN ('public_form', 'household_profile', 'school_admin'));

ALTER TABLE residents
    ADD COLUMN IF NOT EXISTS student_status TEXT DEFAULT 'not_student'
        CHECK (student_status IN ('not_student', 'studying', 'applied', 'completed', 'dropped')),
    ADD COLUMN IF NOT EXISTS current_institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS current_school_name TEXT,
    ADD COLUMN IF NOT EXISTS current_class_name TEXT,
    ADD COLUMN IF NOT EXISTS current_roll_no TEXT,
    ADD COLUMN IF NOT EXISTS school_enrollment_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_school_students_household
    ON school_students(household_id, institution_id);

CREATE INDEX IF NOT EXISTS idx_school_students_resident
    ON school_students(resident_id, institution_id);

CREATE INDEX IF NOT EXISTS idx_residents_current_institution
    ON residents(current_institution_id, student_status);

CREATE INDEX IF NOT EXISTS idx_school_admissions_household
    ON school_admission_applications(household_id, resident_id, institution_id);

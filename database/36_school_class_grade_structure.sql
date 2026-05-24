-- DigiGram school class grade structure
-- Safe to run more than once after 35_institution_academic_structure.sql.

ALTER TABLE school_classes
    ADD COLUMN IF NOT EXISTS grade_level INTEGER
        CHECK (grade_level BETWEEN 0 AND 12);

CREATE INDEX IF NOT EXISTS idx_school_classes_grade_level
    ON school_classes(institution_id, academic_year, grade_level);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_school_classes_primary_grade_per_year
    ON school_classes(institution_id, academic_year, grade_level)
    WHERE grade_level IS NOT NULL
      AND section IS NULL;

-- DigiGram citizen complaint priority + officer notes
-- Safe to run more than once after 50_citizen_inbox_complaint_blood.sql.

ALTER TABLE citizen_complaints
    ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'
        CHECK (priority IN ('low', 'normal', 'urgent', 'emergency')),
    ADD COLUMN IF NOT EXISTS officer_note TEXT,
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_citizen_complaints_priority_status
    ON citizen_complaints(priority, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_citizen_complaints_unresolved_age
    ON citizen_complaints(status, created_at DESC)
    WHERE status NOT IN ('resolved', 'rejected');

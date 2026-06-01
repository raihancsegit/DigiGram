-- DigiGram citizen life-support services foundation
-- Safe to run more than once in Supabase SQL Editor.
-- Covers:
-- document readiness help, benefit eligibility follow-up, health/vaccine,
-- village problem map, local jobs/skills, farmer support and trust reporting.

CREATE TABLE IF NOT EXISTS citizen_life_support_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL,
    citizen_name TEXT,
    case_type TEXT NOT NULL CHECK (
        case_type IN (
            'document',
            'benefit',
            'health',
            'problem',
            'job',
            'farmer',
            'trust_feedback'
        )
    ),
    category TEXT,
    title TEXT NOT NULL,
    description TEXT,
    location_text TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    assigned_scope_type TEXT CHECK (assigned_scope_type IN ('union', 'ward', 'village')),
    assigned_scope_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent', 'emergency')),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (
        status IN ('submitted', 'reviewing', 'assigned', 'scheduled', 'completed', 'rejected')
    ),
    meta_data JSONB DEFAULT '{}'::jsonb,
    feedback TEXT,
    officer_note TEXT,
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citizen_life_cases_phone_created
    ON citizen_life_support_cases(phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_citizen_life_cases_scope_status
    ON citizen_life_support_cases(assigned_scope_type, assigned_scope_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_citizen_life_cases_type_status
    ON citizen_life_support_cases(case_type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_citizen_life_cases_priority_status
    ON citizen_life_support_cases(priority, status, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_citizen_life_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_citizen_life_cases_updated_at ON citizen_life_support_cases;
CREATE TRIGGER trigger_citizen_life_cases_updated_at
    BEFORE UPDATE ON citizen_life_support_cases
    FOR EACH ROW EXECUTE FUNCTION public.set_citizen_life_cases_updated_at();

CREATE OR REPLACE VIEW public.citizen_life_support_trust_summary AS
SELECT
    assigned_scope_type,
    assigned_scope_id,
    case_type,
    COUNT(*) AS total_cases,
    COUNT(*) FILTER (WHERE status IN ('completed')) AS completed_cases,
    COUNT(*) FILTER (WHERE status IN ('submitted', 'reviewing', 'assigned', 'scheduled')) AS open_cases,
    COUNT(*) FILTER (WHERE priority IN ('urgent', 'emergency')) AS urgent_cases,
    MAX(updated_at) AS last_update_at
FROM citizen_life_support_cases
GROUP BY assigned_scope_type, assigned_scope_id, case_type;

GRANT SELECT ON public.citizen_life_support_trust_summary TO anon, authenticated;

COMMENT ON TABLE citizen_life_support_cases IS
    'Unified citizen cases for daily-life services: documents, benefits, health, village issues, jobs, farmer support and trust feedback.';

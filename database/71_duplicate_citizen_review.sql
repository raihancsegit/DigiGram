-- DigiGram duplicate citizen review workflow
-- Safe to run more than once after database/62_data_quality_command_center.sql.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.duplicate_citizen_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fingerprint TEXT NOT NULL UNIQUE,
    match_type TEXT NOT NULL CHECK (match_type IN ('nid', 'birth', 'phone_name', 'family')),
    resident_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
    decision TEXT NOT NULL DEFAULT 'pending'
        CHECK (decision IN ('pending', 'confirmed_duplicate', 'different_people')),
    primary_resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
    note TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_duplicate_citizen_reviews_decision
    ON public.duplicate_citizen_reviews(decision, updated_at DESC);

CREATE OR REPLACE FUNCTION public.touch_duplicate_citizen_review()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.decision <> 'pending' THEN
        NEW.reviewed_at = COALESCE(NEW.reviewed_at, NOW());
    ELSE
        NEW.reviewed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_touch_duplicate_citizen_review
    ON public.duplicate_citizen_reviews;
CREATE TRIGGER trigger_touch_duplicate_citizen_review
    BEFORE UPDATE ON public.duplicate_citizen_reviews
    FOR EACH ROW EXECUTE FUNCTION public.touch_duplicate_citizen_review();

ALTER TABLE public.duplicate_citizen_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can read duplicate reviews"
    ON public.duplicate_citizen_reviews;
CREATE POLICY "Super admins can read duplicate reviews"
ON public.duplicate_citizen_reviews FOR SELECT TO authenticated
USING (public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "Super admins can manage duplicate reviews"
    ON public.duplicate_citizen_reviews;
CREATE POLICY "Super admins can manage duplicate reviews"
ON public.duplicate_citizen_reviews FOR ALL TO authenticated
USING (public.get_auth_role() = 'super_admin')
WITH CHECK (public.get_auth_role() = 'super_admin');

COMMENT ON TABLE public.duplicate_citizen_reviews IS
    'Audited officer decisions for possible duplicate residents. No resident is deleted automatically.';

-- DigiGram: Market complaints and utility hub support
-- Safe to run more than once after 53_market_demand_and_lost_found_claims.sql.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS market_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
    complainant_name TEXT NOT NULL,
    complainant_phone TEXT NOT NULL,
    complaint_type TEXT NOT NULL DEFAULT 'high_price'
        CHECK (complaint_type IN ('high_price', 'low_weight', 'adulteration', 'behavior', 'other')),
    note TEXT NOT NULL,
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'reviewing', 'resolved', 'rejected')),
    officer_note TEXT,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_complaints_location_status_created
    ON market_complaints(location_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_market_complaints_market_created
    ON market_complaints(market_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_market_complaints_phone_created
    ON market_complaints(complainant_phone, created_at DESC);

ALTER TABLE market_complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create market complaints" ON market_complaints;
CREATE POLICY "Public can create market complaints"
ON market_complaints FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Scoped officers can read market complaints" ON market_complaints;
CREATE POLICY "Scoped officers can read market complaints"
ON market_complaints FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND location_id = public.get_auth_scope_id()
    )
    OR (
        public.get_auth_role() = 'market_manager'
        AND EXISTS (
            SELECT 1
            FROM markets m
            WHERE m.id = market_complaints.market_id
              AND m.manager_id = auth.uid()
        )
    )
);

DROP POLICY IF EXISTS "Scoped officers can manage market complaints" ON market_complaints;
CREATE POLICY "Scoped officers can manage market complaints"
ON market_complaints FOR UPDATE
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND location_id = public.get_auth_scope_id()
    )
    OR (
        public.get_auth_role() = 'market_manager'
        AND EXISTS (
            SELECT 1
            FROM markets m
            WHERE m.id = market_complaints.market_id
              AND m.manager_id = auth.uid()
        )
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND location_id = public.get_auth_scope_id()
    )
    OR (
        public.get_auth_role() = 'market_manager'
        AND EXISTS (
            SELECT 1
            FROM markets m
            WHERE m.id = market_complaints.market_id
              AND m.manager_id = auth.uid()
        )
    )
);

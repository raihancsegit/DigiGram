-- DigiGram: Market demand board + lost-found claim workflow
-- Safe to run more than once after 52_market_alert_and_lost_found_sms_business.sql.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- Market demand board: buy/sell requests from farmers and buyers
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS market_demands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
    commodity_id UUID REFERENCES market_commodities(id) ON DELETE SET NULL,
    demand_type TEXT NOT NULL CHECK (demand_type IN ('buy', 'sell')),
    title TEXT NOT NULL,
    quantity TEXT,
    expected_price DECIMAL(10,2),
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    village_name TEXT,
    note TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'spam')),
    phone_verified BOOLEAN DEFAULT FALSE,
    sms_boost_requested BOOLEAN DEFAULT FALSE,
    sms_boost_status TEXT DEFAULT 'not_requested'
        CHECK (sms_boost_status IN ('not_requested', 'queued', 'skipped_no_wallet', 'failed')),
    sms_boost_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_demands_location_status_created
    ON market_demands(location_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_market_demands_market_created
    ON market_demands(market_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_market_demands_phone_created
    ON market_demands(contact_phone, created_at DESC);

ALTER TABLE market_demands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active market demands" ON market_demands;
CREATE POLICY "Public can read active market demands"
ON market_demands FOR SELECT
TO anon, authenticated
USING (status = 'active');

DROP POLICY IF EXISTS "Public can create market demands" ON market_demands;
CREATE POLICY "Public can create market demands"
ON market_demands FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Scoped officers can manage market demands" ON market_demands;
CREATE POLICY "Scoped officers can manage market demands"
ON market_demands FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND location_id = public.get_auth_scope_id()
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND location_id = public.get_auth_scope_id()
    )
);

-- -------------------------------------------------------------------------
-- Lost-found claims: claimant proof + officer approval
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lost_found_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES lost_found_posts(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    claimant_name TEXT NOT NULL,
    claimant_phone TEXT NOT NULL,
    proof_note TEXT NOT NULL,
    proof_image_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    phone_verified BOOLEAN DEFAULT FALSE,
    officer_note TEXT,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lost_found_claims_post_status_created
    ON lost_found_claims(post_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lost_found_claims_location_created
    ON lost_found_claims(location_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lost_found_claims_phone_created
    ON lost_found_claims(claimant_phone, created_at DESC);

ALTER TABLE lost_found_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create lost found claims" ON lost_found_claims;
CREATE POLICY "Public can create lost found claims"
ON lost_found_claims FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Scoped officers can read lost found claims" ON lost_found_claims;
CREATE POLICY "Scoped officers can read lost found claims"
ON lost_found_claims FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND location_id = public.get_auth_scope_id()
    )
);

DROP POLICY IF EXISTS "Scoped officers can manage lost found claims" ON lost_found_claims;
CREATE POLICY "Scoped officers can manage lost found claims"
ON lost_found_claims FOR UPDATE
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND location_id = public.get_auth_scope_id()
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND location_id = public.get_auth_scope_id()
    )
);

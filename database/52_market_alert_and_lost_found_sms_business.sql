-- DigiGram: Market price alert + verified lost-found + SMS blast
-- Safe to run more than once in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- Market price subscriptions
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS market_price_alert_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    commodity_id UUID REFERENCES market_commodities(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    alert_type TEXT NOT NULL DEFAULT 'any_change'
        CHECK (alert_type IN ('any_change', 'price_down', 'price_up', 'target_below')),
    target_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    last_notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(location_id, market_id, commodity_id, phone, alert_type)
);

CREATE INDEX IF NOT EXISTS idx_market_price_alert_subscriptions_match
    ON market_price_alert_subscriptions(market_id, commodity_id, is_active);

CREATE INDEX IF NOT EXISTS idx_market_price_alert_subscriptions_phone
    ON market_price_alert_subscriptions(phone, created_at DESC);

ALTER TABLE market_price_alert_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create market price alerts" ON market_price_alert_subscriptions;
CREATE POLICY "Public can create market price alerts"
ON market_price_alert_subscriptions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read own-ish market price alerts" ON market_price_alert_subscriptions;
CREATE POLICY "Public can read own-ish market price alerts"
ON market_price_alert_subscriptions FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Scoped officers can manage market price alerts" ON market_price_alert_subscriptions;
CREATE POLICY "Scoped officers can manage market price alerts"
ON market_price_alert_subscriptions FOR ALL
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

-- Ensure price history exists because the market updater writes here.
CREATE TABLE IF NOT EXISTS market_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    commodity_id UUID REFERENCES market_commodities(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    supply TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_price_history_market_commodity_date
    ON market_price_history(market_id, commodity_id, recorded_at DESC);

ALTER TABLE market_price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view market price history" ON market_price_history;
CREATE POLICY "Public can view market price history"
ON market_price_history FOR SELECT
TO anon, authenticated
USING (true);

-- -------------------------------------------------------------------------
-- Lost-found verification and SMS blast
-- -------------------------------------------------------------------------
ALTER TABLE lost_found_posts
    ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reporter_phone TEXT,
    ADD COLUMN IF NOT EXISTS reporter_ip TEXT,
    ADD COLUMN IF NOT EXISTS sms_blast_requested BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS sms_blast_status TEXT DEFAULT 'not_requested'
        CHECK (sms_blast_status IN ('not_requested', 'queued', 'skipped_no_wallet', 'failed')),
    ADD COLUMN IF NOT EXISTS sms_blast_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_lost_found_posts_phone_verified
    ON lost_found_posts(phone_verified, created_at DESC);

CREATE TABLE IF NOT EXISTS lost_found_sms_blasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES lost_found_posts(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES sms_wallets(id) ON DELETE SET NULL,
    requested_by_phone TEXT,
    recipient_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'queued'
        CHECK (status IN ('queued', 'skipped_no_wallet', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lost_found_sms_blasts_post
    ON lost_found_sms_blasts(post_id, created_at DESC);

ALTER TABLE lost_found_sms_blasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Scoped officers can read lost found sms blasts" ON lost_found_sms_blasts;
CREATE POLICY "Scoped officers can read lost found sms blasts"
ON lost_found_sms_blasts FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND location_id = public.get_auth_scope_id()
    )
);

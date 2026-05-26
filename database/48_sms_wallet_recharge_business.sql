-- DigiGram SMS wallet, package and recharge business layer
-- Safe to run more than once after 29_sms_platform_and_school_foundation.sql.

ALTER TABLE sms_packages
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 365,
    ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS sms_recharge_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES sms_wallets(id) ON DELETE SET NULL,
    owner_type TEXT NOT NULL CHECK (owner_type IN ('location', 'institution')),
    owner_id UUID NOT NULL,
    package_id UUID REFERENCES sms_packages(id) ON DELETE SET NULL,
    requested_credits INTEGER NOT NULL,
    payable_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'manual',
    transaction_id TEXT,
    payer_phone TEXT,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_recharge_requests_owner_status
    ON sms_recharge_requests(owner_type, owner_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_recharge_requests_wallet
    ON sms_recharge_requests(wallet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_messages_owner_queued
    ON sms_messages(owner_type, owner_id, queued_at DESC);

INSERT INTO sms_packages (name, credits, price, description, sort_order)
VALUES
    ('Starter 500', 500, 350, 'ছোট ইউনিয়ন, স্কুল বা মসজিদের শুরু করার জন্য।', 1),
    ('Growth 1500', 1500, 950, 'নিয়মিত notice, attendance ও service update পাঠানোর জন্য।', 2),
    ('Union Pro 5000', 5000, 2900, 'বড় ইউনিয়ন, স্কুল ও multi-service portal-এর জন্য।', 3)
ON CONFLICT DO NOTHING;

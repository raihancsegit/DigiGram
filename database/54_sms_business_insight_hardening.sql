-- DigiGram SMS business insight hardening
-- Safe to run more than once in Supabase SQL Editor.
-- Keeps older databases compatible with the SMS business dashboard.

ALTER TABLE sms_packages
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 365,
    ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE sms_wallets
    ADD COLUMN IF NOT EXISTS low_balance_threshold INTEGER DEFAULT 50;

CREATE INDEX IF NOT EXISTS idx_sms_messages_category_status
    ON sms_messages(category, status);

CREATE INDEX IF NOT EXISTS idx_sms_messages_owner_status
    ON sms_messages(owner_type, owner_id, status);

CREATE INDEX IF NOT EXISTS idx_sms_wallet_transactions_type_created
    ON sms_wallet_transactions(transaction_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_recharge_requests_status_created
    ON sms_recharge_requests(status, created_at DESC);

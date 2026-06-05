-- DigiGram: SMS worker/provider readiness
-- Safe to run more than once after 29_sms_platform_and_school_foundation.sql.
--
-- Use provider='mock' for local/UAT testing. Real providers can use
-- provider='generic_json' with api_base_url, api_key and config JSON.

ALTER TABLE sms_gateways
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_sms_gateways_active_updated
    ON sms_gateways(is_active, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_messages_status_queued
    ON sms_messages(status, queued_at ASC);

INSERT INTO sms_gateways (
    name,
    provider,
    sender_id,
    api_base_url,
    api_key,
    is_active,
    config
)
VALUES (
    'Mock SMS Gateway',
    'mock',
    'DigiGram',
    NULL,
    NULL,
    FALSE,
    '{"note":"Set is_active=true only for local/UAT testing. It marks queued SMS as sent without external provider."}'::jsonb
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE sms_gateways IS
    'Configure one active SMS gateway. /api/sms/process sends queued sms_messages through the active gateway. For external cron use GET /api/sms/process?secret=SMS_WORKER_SECRET&limit=50 after setting SMS_WORKER_SECRET in environment.';

-- DigiGram SMS gateway failover and provider delivery webhooks.
-- Safe to run more than once after 68_sms_delivery_monitoring.sql.

ALTER TABLE public.sms_gateways
    ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 100,
    ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_sms_gateways_worker_priority
    ON public.sms_gateways(is_active, priority ASC, consecutive_failures ASC);

ALTER TABLE public.sms_messages
    ADD COLUMN IF NOT EXISTS delivery_status TEXT,
    ADD COLUMN IF NOT EXISTS delivery_error TEXT,
    ADD COLUMN IF NOT EXISTS delivery_updated_at TIMESTAMPTZ;

ALTER TABLE public.sms_messages
    DROP CONSTRAINT IF EXISTS sms_messages_status_check;

ALTER TABLE public.sms_messages
    ADD CONSTRAINT sms_messages_status_check
    CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'skipped'));

CREATE TABLE IF NOT EXISTS public.sms_delivery_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway_id UUID NOT NULL REFERENCES public.sms_gateways(id) ON DELETE CASCADE,
    sms_message_id UUID REFERENCES public.sms_messages(id) ON DELETE SET NULL,
    provider_message_id TEXT,
    provider_status TEXT,
    normalized_status TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    error_message TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_delivery_webhooks_gateway_received
    ON public.sms_delivery_webhooks(gateway_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_delivery_webhooks_provider_message
    ON public.sms_delivery_webhooks(provider_message_id);

ALTER TABLE public.sms_delivery_webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can read SMS delivery webhooks" ON public.sms_delivery_webhooks;
CREATE POLICY "Super admins can read SMS delivery webhooks"
ON public.sms_delivery_webhooks FOR SELECT
TO authenticated
USING (public.get_auth_role() = 'super_admin');

REVOKE ALL ON public.sms_delivery_webhooks FROM anon;
GRANT SELECT ON public.sms_delivery_webhooks TO authenticated;
GRANT ALL ON public.sms_delivery_webhooks TO service_role;

CREATE OR REPLACE FUNCTION public.get_digigram_migration_69_status()
RETURNS TABLE (
    migration_id TEXT,
    title TEXT,
    sql_file TEXT,
    installed BOOLEAN,
    detail TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        '69'::TEXT,
        'SMS gateway failover and webhook',
        'database/69_sms_failover_webhook.sql',
        to_regclass('public.sms_delivery_webhooks') IS NOT NULL
            AND EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'sms_gateways'
                  AND column_name = 'priority'
            ),
        'Priority-based provider failover and signed delivery-status callbacks.';
$$;

REVOKE ALL ON FUNCTION public.get_digigram_migration_69_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_digigram_migration_69_status() TO authenticated;

DO $$
BEGIN
    IF to_regclass('public.schema_migrations') IS NOT NULL THEN
        INSERT INTO public.schema_migrations (id, name, sql_file, notes)
        VALUES (
            '69',
            'SMS gateway failover and webhook',
            'database/69_sms_failover_webhook.sql',
            'Priority-based provider failover and signed delivery-status callbacks.'
        )
        ON CONFLICT (id) DO UPDATE
        SET
            name = EXCLUDED.name,
            sql_file = EXCLUDED.sql_file,
            notes = EXCLUDED.notes;
    END IF;
END $$;

